'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function collect(directory) {
  const examples = [];
  for (const file of ['README.md', 'docs/API.md']) {
    const text = fs.readFileSync(path.join(directory, file), 'utf8');
    for (const [index, match] of [
      ...text.matchAll(/\x60\x60\x60(javascript|typescript)\r?\n([\s\S]*?)\x60\x60\x60/g)
    ].entries()) {
      examples.push({ name: file + ' example ' + (index + 1), language: match[1], code: match[2] });
    }
  }
  for (const [name, value] of Object.entries(require(path.join(directory, 'index.js')))) {
    if (typeof value !== 'function') continue;
    const source = fs.readFileSync(path.join(directory, 'src', name + '.js'), 'utf8');
    for (const [, block] of source.matchAll(/\/\*\*([\s\S]*?)\*\//g)) {
      const clean = block.replace(/^[ \t]*\* ?/gm, '');
      for (const [, code] of clean.matchAll(/@example\s*\n([\s\S]*?)(?=\n@\w|$)/g)) {
        examples.push({ name: 'src/' + name + '.js JSDoc', language: 'javascript', code: code.trim(), jsdoc: true });
      }
    }
  }
  return examples;
}

function instrument(code) {
  const ast = ts.createSourceFile('example.ts', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS),
    statements = [];
  assert.equal(ast.parseDiagnostics.length, 0, 'Invalid example syntax.');
  function visit(node) {
    if (ts.isExpressionStatement(node) || ts.isVariableStatement(node) || ts.isReturnStatement(node))
      statements.push(node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  const edits = [];
  let assertions = 0;
  for (const match of code.matchAll(/\/\/ => ([^\r\n]+)/g)) {
    const statement = statements
      .filter((node) => node.end <= match.index && /^\s*$/.test(code.slice(node.end, match.index)))
      .sort((a, b) => b.end - a.end || a.pos - b.pos)[0];
    assert.ok(statement, 'No statement for result: ' + match[1]);
    const expected = match[1].trim();
    const start = statement.getStart(ast),
      end = statement.end;
    let replacement;
    if (expected.startsWith('throws ')) {
      assert.match(expected, /^throws [A-Za-z]+Error$/);
      replacement = '__throws(() => { ' + code.slice(start, end) + ' }, ' + JSON.stringify(expected.slice(7)) + ');';
    } else {
      const check = ts.createSourceFile(
        'expected.ts',
        'const result = (' + expected + ');',
        ts.ScriptTarget.Latest,
        true
      );
      assert.equal(check.parseDiagnostics.length, 0, 'Invalid expected result: ' + expected);
      let expression;
      if (ts.isVariableStatement(statement)) {
        assert.equal(statement.declarationList.declarations.length, 1);
        expression = statement.declarationList.declarations[0].name.getText(ast);
        replacement = code.slice(start, end) + '\n__equal(' + expression + ', (' + expected + '));';
      } else {
        expression = statement.expression.getText(ast);
        if (/^console\.log\(/.test(expression)) replacement = '__log(() => ' + expression + ', (' + expected + '));';
        else replacement = '__equal((' + expression + '), (' + expected + '));';
      }
    }
    assert.ok(!edits.some((edit) => edit.start === start), 'Repeated annotation for one statement.');
    edits.push({ start, end, text: replacement });
    assertions++;
  }
  let output = code;
  for (const edit of edits.sort((a, b) => b.start - a.start))
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  return { code: output, assertions };
}

function runExample(
  example,
  directory = root,
  consumerDirectory = directory === root ? path.join(root, 'package') : directory
) {
  const marked = instrument(example.code);
  let code = marked.code;
  if (example.language === 'typescript')
    code = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
    }).outputText;
  const esm = /^\s*import\b/m.test(code);
  const prelude = esm
    ? 'import __assert from "node:assert/strict";\n'
    : 'const __assert = require("node:assert/strict");\n';
  const globals = example.jsdoc
    ? 'const { ' +
      Object.keys(require(path.join(directory, 'index.js')))
        .filter((name) => name !== 'NaN')
        .join(', ') +
      ' } = require("go-numbers");\n'
    : '';
  const runtime = [
    'let __checks = 0;',
    'function __equal(actual, expected) { __assert.deepStrictEqual(actual, expected); __checks++; }',
    'function __throws(fn, name) { __assert.throws(fn, error => error.name === name); __checks++; }',
    'function __log(fn, expected) {',
    '  const original = console.log, logs = [];',
    '  console.log = (...args) => logs.push(args);',
    '  try { fn(); } finally { console.log = original; }',
    '  __assert.equal(logs.length, 1); __assert.equal(logs[0].length, 1); __equal(logs[0][0], expected);',
    '}'
  ].join('\n');
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=' + (esm ? 'module' : 'commonjs'),
      '-e',
      prelude + runtime + '\n' + globals + code + '\n__assert.equal(__checks, ' + marked.assertions + ');'
    ],
    {
      cwd: consumerDirectory,
      encoding: 'utf8',
      timeout: 10000
    }
  );
  if (result.error) throw result.error;
  assert.equal(result.status, 0, example.name + '\n' + result.stderr);
  return marked.assertions;
}
function runAll(directory = root, consumerDirectory = directory === root ? path.join(root, 'package') : directory) {
  const examples = collect(directory);
  let assertions = 0;
  for (const example of examples) assertions += runExample(example, directory, consumerDirectory);
  console.log(examples.length + ' documentation examples and ' + assertions + ' displayed results passed.');
  return { examples: examples.length, assertions };
}
function checkTypes(directory = root) {
  const examples = collect(directory).filter((example) => example.language === 'typescript');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-doc-types-'));
  try {
    for (const [index, example] of examples.entries()) {
      const source = example.code.replace(
        /(['"])go-numbers\1/g,
        JSON.stringify(path.join(directory, 'index.mjs').replace(/\\/g, '/'))
      );
      fs.writeFileSync(path.join(temporary, 'example-' + index + '.mts'), source);
    }
    for (const exact of [false, true]) {
      fs.writeFileSync(
        path.join(temporary, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            strict: true,
            noEmit: true,
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            exactOptionalPropertyTypes: exact,
            skipLibCheck: false
          }
        })
      );
      const result = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', temporary], {
        encoding: 'utf8',
        timeout: 20000
      });
      if (result.error) throw result.error;
      assert.equal(
        result.status,
        0,
        'Documentation types (exactOptionalPropertyTypes=' + exact + ')\n' + result.stdout + result.stderr
      );
    }
  } finally {
    assert.equal(path.dirname(temporary), os.tmpdir());
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  console.log(examples.length + ' TypeScript examples compile with and without exactOptionalPropertyTypes.');
}
module.exports = { collect, instrument, runExample, runAll, checkTypes };
