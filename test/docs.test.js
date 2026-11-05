'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const docs = require('../scripts/docs.js');
const examples = require('../scripts/test-examples.js');

test('an identity alias shares one complete reference entry without weakening coverage', () => {
  const alpha = () => 1;
  const reference = [
    '## Functions',
    '',
    '### `alpha()`',
    '',
    'Returns one.',
    '',
    '**Aliases:** [`beta`](#alpha)',
    '',
    '**Parameters**',
    '',
    'None.',
    '',
    '**Returns:** `number` — One.',
    '',
    '**Examples**',
    '',
    '```javascript',
    'alpha(); // => 1',
    '```',
    ''
  ].join('\n');
  const api = { alpha, beta: alpha };
  const summary = docs.summary(reference, api);
  assert.match(summary, /\[`beta`\]\(docs\/API.md#alpha\)/);
  assert.equal(summary.split('| [').length - 1, 1);
  assert.throws(
    () => docs.summary(reference.replace('**Aliases:** [`beta`](#alpha)', ''), api),
    /Document public API: beta/
  );
  assert.throws(() => docs.summary(reference.replace('](#alpha)', '](#wrong)'), api), /Alias destination/);
  assert.throws(() => docs.summary(reference, { alpha, beta: () => 2 }), /Alias identity/);
  assert.throws(
    () => docs.summary(reference.replace('](#alpha)', '](#alpha), [`beta`](#alpha)'), api),
    /Duplicate public API/
  );
});

test('README and full reference cover every public export with valid links', () => {
  require('../scripts/lib/check-library-readme.cjs').checkRepository(root);
  const outputs = docs.generate(root, true);
  docs.summary(outputs['docs/API.md'], require('..'));
  docs.validateLinks(root, outputs);
  for (const text of Object.values(outputs)) assert.doesNotMatch(text, /\bTODO\b|\bTBD\b|coming soon/i);
});
test('current README, reference and JSDoc examples verify displayed results', () => {
  const result = examples.runAll();
  assert.ok(result.examples > 0 && result.assertions > 0);
});
test('current TypeScript examples compile under both optional-property modes', () => examples.checkTypes());
test('example checks preserve negative zero, NaN, primitive types and expected exceptions', () => {
  examples.runExample({ name: 'boundaries', language: 'javascript', code: '(-0); // => -0\nNaN; // => NaN\n' });
  assert.throws(() => examples.runExample({ name: 'wrong zero', language: 'javascript', code: '0; // => -0' }));
  assert.throws(() => examples.runExample({ name: 'wrong type', language: 'javascript', code: 'true; // => 1' }));
  examples.runExample({
    name: 'multiline throw',
    language: 'javascript',
    code: 'const { clamp } = require("go-numbers");\nclamp(\n  1, 5, 0\n); // => throws RangeError'
  });
});
test('release documentation distinguishes the published baseline from the target', () => {
  const pkg = require('../package.json');
  const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
  assert.match(changelog, /^# Changelog\n\n## Unreleased/m);
  assert.ok(changelog.includes('Target: ' + pkg.version));
  assert.deepEqual(
    [...changelog.matchAll(/^## (\d+\.\d+\.\d+) — /gm)].map((match) => match[1]),
    ['0.0.1']
  );
  assert.ok(fs.readFileSync(path.join(root, 'README.md'), 'utf8').includes('go-numbers-' + pkg.version + '.tgz'));
  assert.ok(fs.readFileSync(path.join(root, 'MIGRATION.md'), 'utf8').includes('src/Types'));
});

test('compatibility docs explain Node 8 package-internal path visibility', () => {
  const outputs = docs.generate(root, true);
  const caveat = /Node 8[\s\S]{0,200}predates[\s\S]{0,100}package `exports`[\s\S]{0,160}unsupported/i;
  assert.match(outputs['README.md'], caveat);
  assert.match(outputs['docs/API.md'], caveat);
});

test('JSDoc result comments use executable result annotations', () => {
  const suspicious = /\/\/\s*(?:null|undefined|true|false|NaN|-?Infinity|-?(?:\d|\.\d))/;
  for (const [name, value] of Object.entries(require('..'))) {
    if (typeof value !== 'function') continue;
    const source = fs.readFileSync(path.join(root, 'src', name + '.js'), 'utf8');
    for (const [, block] of source.matchAll(/\/\*\*([\s\S]*?)\*\//g)) {
      const clean = block.replace(/^[ \t]*\* ?/gm, '');
      for (const [, code] of clean.matchAll(/@example\s*\n([\s\S]*?)(?=\n@\w|$)/g)) {
        for (const line of code.split(/\r?\n/)) {
          if (suspicious.test(line) && !/\/\/\s*=>/.test(line)) {
            assert.fail('Unverified JSDoc result comment in src/' + name + '.js: ' + line.trim());
          }
        }
      }
    }
  }
});

test('consumer docs route contributors to the canonical guide without obsolete paths', () => {
  const outputs = docs.generate(root, true);
  const remoteSourceOnly =
    /https?:\/\/[^)\s]+\/(?:blob\/[^/]+\/)?docs\/(?:project-validation|performance|test-coverage)\.md/;
  assert.doesNotMatch(outputs['README.md'], remoteSourceOnly);
  assert.doesNotMatch(outputs['docs/API.md'], remoteSourceOnly);
  assert.match(outputs['README.md'], /https:\/\/github\.com\/koyote130708\/go-numbers\/blob\/master\/CONTRIBUTING\.md/);
  assert.match(outputs['README.md'], /source checkout[\s\S]{0,120}`docs\/test-coverage\.md`/i);
  assert.match(outputs['docs/API.md'], /source checkout[\s\S]{0,120}`docs\/performance\.md`/i);
});
