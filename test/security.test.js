'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { run } = require('../scripts/package-consumer');
const root = path.resolve(__dirname, '..');

test('security: CI remote actions use immutable full commit references', () => {
  // This checks the actual workflow's simple scalar uses entries, not a YAML parser.
  // Action content still needs review; a hash alone does not establish trust.
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');
  const uses = [...workflow.matchAll(/^\s*-\s+uses:\s+(\S+)/gm)].map((match) => match[1]);
  assert.ok(uses.length > 0, 'The workflow must contain actions to check.');
  for (const reference of uses) {
    assert.match(reference, /^[\w-]+\/[\w.-]+@[a-f0-9]{40}$/, reference);
  }
});

test('security: child-process arguments remain literal data, including shell metacharacters', () => {
  const args = [
    'ordinary value',
    '; echo injection',
    '$(echo substitution)',
    '`echo substitution`',
    'a&b|c',
    '"quoted"',
    '../relative path',
    '--not-an-option',
    '\nsecond line'
  ];
  const output = run(process.execPath, [
    '-e',
    'process.stdout.write(JSON.stringify(process.argv.slice(1)))',
    '--',
    ...args
  ]);
  assert.deepEqual(JSON.parse(output), args);
});

test('security: generated consumers have no dependency or executable installation surface', () => {
  const manifest = require('../scripts/package-layout').consumerManifest();
  for (const field of [
    'dependencies',
    'optionalDependencies',
    'peerDependencies',
    'devDependencies',
    'scripts',
    'bin'
  ]) {
    assert.equal(Object.hasOwn(manifest, field), false, field);
  }
  assert.equal(require('../package.json').private, true);
});
