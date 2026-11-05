'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
test('docs regenerates metadata and headings; checking stale output never writes', () => {
  const owner = path.join(__dirname, 'docs.js');
  assert.ok(fs.existsSync(owner), 'A real documentation generator is required');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'library-docs-'));
  try {
    fs.mkdirSync(path.join(root, 'scripts'));
    for (const file of ['CHANGELOG.md', 'MIGRATION.md']) fs.writeFileSync(path.join(root, file), '# Fixture\n');
    fs.copyFileSync(owner, path.join(root, 'scripts/docs.js'));
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({
        name: 'fixture',
        version: '3.2.1',
        license: 'MIT',
        engines: { node: '>=18' },
        devDependencies: { typescript: '5.8.3', esbuild: '0.25.5' }
      })
    );
    fs.writeFileSync(path.join(root, 'index.js'), 'module.exports = {alpha() {}, BETA: 2};\n');
    fs.writeFileSync(
      path.join(root, 'scripts/README.template.md'),
      '# Fixture\n\nVersion {{VERSION}}, {{CALLABLE_COUNT}} functions, {{CONSTANT_COUNT}} constants.\n\n{{TOC}}\n\n## Usage\n\n```js\n// ## Hidden\n```\n\n## Usage\n'
    );
    fs.writeFileSync(
      path.join(root, 'scripts/API.template.md'),
      [
        '# API',
        '',
        '{{TOC}}',
        '',
        '## Functions',
        '',
        '### `alpha()`',
        '',
        'Creates a fixture.',
        '',
        '**Parameters**',
        '',
        'None.',
        '',
        '**Returns:** `undefined` — No result.',
        '',
        '**Examples**',
        '',
        '```javascript',
        'alpha();',
        '```',
        '',
        '## Constants',
        '',
        '### `BETA`',
        '',
        'The fixture constant.',
        '',
        '**Value:** `number` — 2.',
        ''
      ].join('\n')
    );
    const run = (...args) =>
      spawnSync(process.execPath, [path.join(root, 'scripts/docs.js'), ...args], { encoding: 'utf8' });
    let result = run();
    assert.equal(result.status, 0, result.stderr);
    const generated = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    assert.match(generated, /Version 3\.2\.1, 1 functions, 1 constants\./);
    assert.match(generated, /\[Usage\]\(#usage\)/);
    assert.match(generated, /\[Usage\]\(#usage-1\)/);
    assert.doesNotMatch(generated, /\[Hidden\]/);
    result = run('--check');
    assert.equal(result.status, 0, result.stderr);
    fs.writeFileSync(path.join(root, 'README.md'), 'stale\n');
    result = run('--check');
    assert.notEqual(result.status, 0);
    assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), 'stale\n');
    result = run();
    assert.equal(result.status, 0, result.stderr);
    fs.appendFileSync(path.join(root, 'docs/API.md'), 'stale');
    result = run('--check');
    assert.notEqual(result.status, 0);
    assert.ok(fs.readFileSync(path.join(root, 'docs/API.md'), 'utf8').endsWith('stale'));
    result = run('--unknown');
    assert.notEqual(result.status, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('full reference generation covers callable and constant exports and validates destinations', () => {
  const docs = require('./docs.js');
  assert.equal(typeof docs.generate, 'function', 'Generate README and docs/API.md together');
  const root = path.resolve(__dirname, '..');
  const outputs = docs.generate(root, true);
  assert.ok(outputs['docs/API.md']);
  docs.validateLinks(root, outputs);
  const reference = outputs['docs/API.md'];
  const summary = docs.summary(reference, require('../index.js'));
  for (const name of Object.keys(require('../index.js'))) {
    assert.ok(summary.includes('[`' + name + '(') || summary.includes('[`' + name + '`]'), name);
  }
  assert.throws(
    () => docs.summary(reference.replace('### `isInteger(value)`', '### `missing(value)`'), require('../index.js')),
    /Document public API/
  );
  assert.throws(
    () =>
      docs.validateLinks(root, {
        ...outputs,
        'README.md': outputs['README.md'].replace('docs/API.md#isinteger', 'docs/API.md#missing')
      }),
    /Missing documentation heading/
  );
});
