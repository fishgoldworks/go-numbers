'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const reporter = require('node:url').pathToFileURL(path.resolve(__dirname, '../scripts/lib/mutation-reporter.js')).href;
const { assessRun } = require('../scripts/lib/mutation-outcome.js');

const target = '^expected regression$';
const header = "const {test} = require('node:test'); const assert = require('node:assert/strict');\n";
function fixture(source, pattern = target, args = []) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-verifier-'));
  try {
    const file = path.join(folder, 'fixture.test.cjs');
    fs.writeFileSync(file, header + source);
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    delete env.NODE_V8_COVERAGE;
    const reporting = ['--test-reporter', reporter];
    const run = spawnSync(process.execPath, ['--test', ...reporting, '--test-name-pattern', pattern, ...args, file], {
      encoding: 'utf8',
      timeout: 5000,
      env
    });
    assert.ifError(run.error);
    return { run, assessment: assessRun(run, pattern) };
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
}

test('verifier: a module-load exception is not a detected regression', () => {
  const { assessment } = fixture("throw new Error('module initialization failed');");
  assert.equal(assessment.detected, false);
  assert.equal(assessment.baselinePassed, false);
});
test('verifier: an assertion failure in the selected test is a detected regression', () => {
  const { assessment } = fixture("test('expected regression', () => assert.equal(1, 2));");
  assert.equal(assessment.detected, true);
  assert.equal(assessment.baselinePassed, false);
  assert.equal(assessment.firstFailingTest, 'expected regression');
});
test('verifier: a matching successful test establishes a valid baseline', () => {
  const { assessment } = fixture("test('expected regression', () => assert.equal(1, 1));");
  assert.equal(assessment.detected, false);
  assert.equal(assessment.baselinePassed, true);
});
test('verifier: no selected tests is not a successful baseline', () => {
  const { assessment } = fixture("test('different test', () => assert.equal(1, 1));");
  assert.equal(assessment.detected, false);
  assert.equal(assessment.baselinePassed, false);
});
test('verifier: skip is neither a detection nor a verified baseline', () => {
  const { assessment } = fixture("test('expected regression', {skip: true}, () => assert.fail('not run'));");
  assert.equal(assessment.detected, false);
  assert.equal(assessment.baselinePassed, false);
});
test('verifier: a passing TODO is not a verified baseline', () => {
  const { assessment } = fixture("test('expected regression', {todo: true}, () => {});");
  assert.equal(assessment.detected, false);
  assert.equal(assessment.baselinePassed, false);
});
test('verifier: a failing TODO is not a detection', () => {
  const { assessment } = fixture("test('expected regression', {todo: true}, () => assert.fail('TODO'));");
  assert.equal(assessment.detected, false);
  assert.equal(assessment.baselinePassed, false);
});
test('verifier: code errors inside the selected test still detect a regression', () => {
  const { assessment } = fixture(
    "test('expected regression', () => { throw new ReferenceError('bad implementation'); });"
  );
  assert.equal(assessment.detected, true);
});
test('verifier: TAP-like console output cannot fabricate a detection', () => {
  const { assessment } = fixture(`console.log("not ok 1 - expected regression\\n  failureType: 'testCodeFailure'");
        process.exitCode = 1;`);
  assert.equal(assessment.detected, false);
});
test('verifier: module-not-found and syntax-like assertion text is not infrastructure failure', () => {
  const { assessment } = fixture(
    "test('expected regression', () => assert.fail('MODULE_NOT_FOUND and SyntaxError: are message text'));"
  );
  assert.equal(assessment.detected, true);
});
test('verifier: cancellation is not a detected regression', () => {
  const { assessment } = fixture("test('expected regression', { timeout: 15 }, () => new Promise(() => {}));");
  assert.equal(assessment.detected, false);
  assert.equal(assessment.baselinePassed, false);
});
test('verifier: process termination before test completion is not a detection', () => {
  const { assessment } = fixture("test('expected regression', () => process.exit(2));");
  assert.equal(assessment.detected, false);
  assert.equal(assessment.baselinePassed, false);
});
test('verifier: real module-not-found failures are rejected', () => {
  const { assessment } = fixture("require('./does-not-exist.cjs');");
  assert.equal(assessment.detected, false);
});
test('verifier: regular-expression test-name groups select the actual failing name', () => {
  const { assessment } = fixture("test('case B', () => assert.equal(1, 2));", '^case (A|B)$');
  assert.equal(assessment.detected, true);
  assert.equal(assessment.firstFailingTest, 'case B');
});
test('verifier: child-process errors invalidate otherwise genuine failure output', () => {
  const { run } = fixture("test('expected regression', () => assert.equal(1, 2));");
  const failed = assessRun({ ...run, error: new Error('spawn failure') }, target);
  assert.equal(failed.detected, false);
  assert.equal(failed.baselinePassed, false);
});
test('verifier: an interrupted or truncated reporter stream cannot verify a result', () => {
  const { run } = fixture("test('expected regression', () => assert.equal(1, 2));");
  for (const stdout of ['', run.stdout.split('\n').slice(0, -2).join('\n'), '{invalid json}\n']) {
    const failed = assessRun({ ...run, stdout }, target);
    assert.equal(failed.detected, false);
    assert.equal(failed.baselinePassed, false);
  }
});

test('verifier: even a broad selector must reject file-level loading failures', () => {
  const { assessment } = fixture("throw new Error('failed before a test ran');", '.*');
  assert.equal(assessment.detected, false);
  assert.equal(assessment.baselinePassed, false);
});
test('verifier: an unrelated failing test cannot count for the intended target', () => {
  const { run } = fixture(
    "test('expected regression', () => {}); test('unrelated test', () => assert.fail('unrelated'));",
    '.*'
  );
  const assessment = assessRun(run, target);
  assert.equal(assessment.detected, false);
  assert.equal(assessment.baselinePassed, false);
});
test('verifier: a target failure plus an unrelated failure is an invalid run', () => {
  const { run } = fixture(
    "test('expected regression', () => assert.fail('target')); test('unrelated test', () => assert.fail('unrelated'));",
    '.*'
  );
  assert.equal(assessRun(run, target).detected, false);
});
test('verifier: all selected baseline cases must run without skips', () => {
  const { assessment } = fixture("test('case A', () => {}); test('case B', {skip: true}, () => {});", '^case [AB]$');
  assert.equal(assessment.baselinePassed, false);
});
test('verifier: two actual selected passes establish a baseline', () => {
  const { assessment } = fixture("test('case A', () => {}); test('case B', () => {});", '^case [AB]$');
  assert.equal(assessment.baselinePassed, true);
  assert.equal(assessment.matchedPasses, 2);
});
test('verifier: a process signal invalidates genuine reported failures', () => {
  const { run } = fixture("test('expected regression', () => assert.fail('failure'));");
  assert.equal(assessRun({ ...run, status: null, signal: 'SIGTERM' }, target).detected, false);
});
test('verifier: schema-invalid output is rejected instead of crashing', () => {
  const { run } = fixture("test('expected regression', () => assert.fail('failure'));");
  for (const stdout of ['null\n', '{}\n', '{"type":"test:summary","data":{}}\n']) {
    assert.equal(assessRun({ ...run, stdout }, target).detected, false);
  }
});
test('verifier: duplicate global summaries are not accepted', () => {
  const { run } = fixture("test('expected regression', () => assert.fail('failure'));");
  const final = run.stdout.trim().split('\n').at(-1);
  assert.equal(assessRun({ ...run, stdout: run.stdout + final + '\n' }, target).detected, false);
});

test('verifier: a missing passing event cannot still establish a baseline', () => {
  const { run } = fixture("test('case A', () => {}); test('case B', () => {});", '^case [AB]$');
  const events = run.stdout
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
    .filter((event) => !(event.type === 'test:pass' && event.data.name === 'case B'));
  const assessment = assessRun({ ...run, stdout: events.map(JSON.stringify).join('\n') + '\n' }, '^case [AB]$');
  assert.equal(assessment.baselinePassed, false);
  assert.equal(assessment.detected, false);
});

test('verifier: a missing unrelated failure event cannot fabricate mutation detection', () => {
  const { run } = fixture(
    "test('expected regression', () => assert.fail('target')); test('unrelated test', () => assert.fail('unrelated'));",
    '.*'
  );
  const events = run.stdout
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
    .filter((event) => !(event.type === 'test:fail' && event.data.name === 'unrelated test'));
  const assessment = assessRun({ ...run, stdout: events.map(JSON.stringify).join('\n') + '\n' }, target);
  assert.equal(assessment.detected, false);
  assert.equal(assessment.baselinePassed, false);
});

test('verifier: a nested target failure remains detectable through its parent subtest failure', () => {
  const { run } = fixture(
    "test('parent', async (t) => { await t.test('expected regression', () => assert.fail('child')); });",
    '.*'
  );
  const assessment = assessRun(run, target);
  assert.equal(assessment.detected, true);
  assert.equal(assessment.firstFailingTest, 'expected regression');
});

test('verifier: asynchronous file failure after a passing test is not a detection', () => {
  const { assessment } = fixture(
    `test('expected regression', () => {
        setTimeout(() => { throw new Error('asynchronous file failure'); }, 1);
    });`,
    '.*'
  );
  assert.equal(assessment.detected, false);
  assert.equal(assessment.baselinePassed, false);
});

function manifestFixture(rootVersion, { lockName = 'go-numbers', rootName = 'go-numbers' } = {}) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-metadata-'));
  try {
    for (const name of ['src', 'test', 'scripts', 'benchmarks']) fs.mkdirSync(path.join(folder, name));
    fs.copyFileSync(path.resolve(__dirname, '../scripts/test-syntax.js'), path.join(folder, 'scripts/test-syntax.js'));
    for (const name of ['index.js', 'index.mjs']) fs.writeFileSync(path.join(folder, name), '');
    const pkg = {
      name: 'go-numbers',
      version: '0.3.3',
      license: 'MIT',
      devDependencies: {},
      engines: { node: '>=22' }
    };
    fs.writeFileSync(path.join(folder, 'package.json'), JSON.stringify(pkg));
    fs.writeFileSync(
      path.join(folder, 'package-lock.json'),
      JSON.stringify({
        name: lockName,
        version: pkg.version,
        packages: { '': { ...pkg, name: rootName, version: rootVersion } }
      })
    );
    return spawnSync(process.execPath, ['scripts/test-syntax.js'], { cwd: folder, encoding: 'utf8', timeout: 5000 });
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
}

test('metadata checker rejects a stale lock root version even if the outer version matches', () => {
  const run = manifestFixture('0.0.0');
  assert.ifError(run.error);
  assert.notEqual(run.status, 0, 'the nested root lock version must be checked');
  assert.match(run.stderr, /0\.0\.0/);
});

test('metadata checker accepts matching root and outer lock versions', () => {
  const run = manifestFixture('0.3.3');
  assert.ifError(run.error);
  assert.equal(run.status, 0, run.stdout + run.stderr);
});

test('metadata checker rejects stale package names in both lock locations', () => {
  for (const options of [{ lockName: 'wrong-name' }, { rootName: 'wrong-name' }]) {
    const run = manifestFixture('0.3.3', options);
    assert.ifError(run.error);
    assert.notEqual(run.status, 0, 'package and lock names must stay consistent');
    assert.match(run.stderr, /wrong-name/);
  }
});

test(
  'TypeScript verifier rejects a compiler whose reported version is not the pinned development version',
  { timeout: 30000 },
  () => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-fake-typescript-'));
    try {
      const packageFolder = path.join(folder, 'node_modules', 'typescript');
      fs.mkdirSync(path.join(folder, 'scripts'));
      for (const name of ['test-types.js', 'package-consumer.js'])
        fs.copyFileSync(path.join(__dirname, '../scripts', name), path.join(folder, 'scripts', name));
      fs.copyFileSync(path.join(__dirname, '../package.json'), path.join(folder, 'package.json'));
      fs.mkdirSync(path.join(packageFolder, 'bin'), { recursive: true });
      fs.writeFileSync(
        path.join(packageFolder, 'package.json'),
        JSON.stringify({ name: 'typescript', version: '0.0.0' })
      );
      fs.writeFileSync(
        path.join(packageFolder, 'bin', 'tsc.js'),
        `
            if (process.argv.includes('--version')) console.log('Version 0.0.0');
            process.exit(0);
        `
      );
      const run = spawnSync(process.execPath, ['scripts/test-types.js'], {
        cwd: folder,
        encoding: 'utf8',
        timeout: 30000,
        env: { ...process.env }
      });
      assert.ifError(run.error);
      assert.notEqual(run.status, 0, 'an unpinned compiler must not validate the declaration package');
      assert.match(run.stdout + run.stderr, /TypeScript 5\.8\.3|Version 5\.8\.3|0\.0\.0/);
    } finally {
      fs.rmSync(folder, { recursive: true, force: true });
    }
  }
);

test('oracle commands share the portable bytecode-free Python launcher', () => {
  const scripts = require('../package.json').scripts;
  assert.match(scripts['test:oracle:verifier'], /node scripts\/run-python\.js -m unittest/);
  assert.match(scripts['test:oracle'], /node scripts\/run-python\.js scripts\/check-numeric-oracle\.py/);
  assert.match(fs.readFileSync(path.join(__dirname, '../scripts/run-python.js'), 'utf8'), /\['-B',/);
});

test('mutation anchors tolerate formatting but reject missing or ambiguous code', () => {
  const { replaceMutation } = require('../scripts/lib/mutation-source');
  assert.equal(replaceMutation('const value =\n  a + b;', 'a + b', 'a - b', 'operator'), 'const value =\n  a - b;');
  assert.throws(() => replaceMutation('const value = a - b;', 'a + b', 'a - b', 'missing'), /exactly once/);
  assert.throws(
    () => replaceMutation('const value = a + b; const next = a + b;', 'a + b', 'a - b', 'ambiguous'),
    /exactly once/
  );
});

test('mutation anchors after a template expression still select the intended statement', () => {
  const { replaceMutation } = require('../scripts/lib/mutation-source');
  const source = 'const text = `label ${value}`; if (value !== undefined) use(value);';
  assert.equal(
    replaceMutation(source, 'if (value !== undefined)', 'if (true)', 'after-template'),
    'const text = `label ${value}`; if (true) use(value);'
  );
});

test('benchmark comparator rejects result differences hidden by its timed-loop sink', { timeout: 30000 }, () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-benchmark-integrity-'));
  try {
    fs.mkdirSync(path.join(folder, 'scripts'));
    fs.mkdirSync(path.join(folder, 'benchmarks'));
    fs.mkdirSync(path.join(folder, 'baseline'));
    fs.mkdirSync(path.join(folder, 'candidate'));
    fs.copyFileSync(
      path.join(__dirname, '../scripts/benchmark-compare.js'),
      path.join(folder, 'scripts/benchmark-compare.js')
    );
    fs.writeFileSync(
      path.join(folder, 'benchmarks/comparison-cases.js'),
      "'use strict'; module.exports = (n) => [['fractional result', 1000, () => n.value()]];\n"
    );
    fs.writeFileSync(path.join(folder, 'baseline/index.js'), 'module.exports = { value: () => 0.25 };\n');
    fs.writeFileSync(path.join(folder, 'candidate/index.js'), 'module.exports = { value: () => 0.75 };\n');
    fs.writeFileSync(path.join(folder, 'baseline/package.json'), JSON.stringify({ version: 'baseline' }));
    fs.writeFileSync(path.join(folder, 'candidate/package.json'), JSON.stringify({ version: 'candidate' }));

    const run = spawnSync(
      process.execPath,
      ['scripts/benchmark-compare.js', '--baseline', 'baseline', '--candidate', 'candidate', '--rounds', '1'],
      { cwd: folder, encoding: 'utf8', timeout: 30000 }
    );
    assert.ifError(run.error);
    assert.notEqual(run.status, 0, 'different fractional results must invalidate the comparison');
    assert.match(run.stdout + run.stderr, /result|digest|agree|equivalent/i);
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});

test('benchmark comparator accepts identical undefined results outside timed loops', { timeout: 30000 }, () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-benchmark-undefined-'));
  try {
    fs.mkdirSync(path.join(folder, 'scripts'));
    fs.mkdirSync(path.join(folder, 'benchmarks'));
    for (const name of ['baseline', 'candidate']) fs.mkdirSync(path.join(folder, name));
    fs.copyFileSync(
      path.join(__dirname, '../scripts/benchmark-compare.js'),
      path.join(folder, 'scripts/benchmark-compare.js')
    );
    fs.writeFileSync(
      path.join(folder, 'benchmarks/comparison-cases.js'),
      "'use strict'; module.exports = (n) => [['rejection result', 100, () => n.value()]];\n"
    );
    for (const name of ['baseline', 'candidate']) {
      fs.writeFileSync(path.join(folder, name, 'index.js'), 'module.exports = { value: () => undefined };\n');
      fs.writeFileSync(path.join(folder, name, 'package.json'), JSON.stringify({ version: name }));
    }
    const run = spawnSync(
      process.execPath,
      ['scripts/benchmark-compare.js', '--baseline', 'baseline', '--candidate', 'candidate', '--rounds', '1'],
      { cwd: folder, encoding: 'utf8', timeout: 30000 }
    );
    assert.ifError(run.error);
    assert.equal(run.status, 0, run.stdout + run.stderr);
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
