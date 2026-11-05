'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const { withPackedPackage } = require('../scripts/package-consumer');

const root = path.resolve(__dirname, '..');
const fixture = path.join(__dirname, 'fixtures/optional-api-consumer.cjs');
const profiles = [
  'native',
  'no-bigint',
  'no-bigint-null',
  'no-bigint-value-of',
  'inherited-bigint-value-of',
  'no-symbol',
  'no-proxy',
  'no-collections',
  'no-bigint-views',
  'combined',
  'after-import'
];
function run(directory, mode, profile, consumerFixture = fixture) {
  const env = { ...process.env };
  delete env.NODE_V8_COVERAGE;
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, [consumerFixture, directory, mode, profile], {
    encoding: 'utf8',
    env,
    timeout: 15000,
    maxBuffer: 1024 * 1024
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${mode}/${profile}: ${result.stdout}\n${result.stderr}`);
  assert.deepEqual(JSON.parse(result.stdout), { result: 'PASS', mode, profile, callables: 27 });
}

for (const profile of profiles) {
  test(`optional capabilities: fresh authored root/focused CJS/ESM — ${profile}`, { timeout: 65000 }, () => {
    for (const mode of ['root-cjs', 'root-esm', 'focused-cjs', 'focused-esm']) run(root, mode, profile);
  });
}
test('optional capabilities: exact installed candidate in fresh processes', { timeout: 180000 }, () => {
  withPackedPackage(({ directory }) => {
    const installed = path.join(directory, 'node_modules/go-numbers');
    // Place the fixture in the consumer to resolve bare ESM specifiers through
    // the real installed export map, not through absolute source paths.
    const consumerFixture = path.join(directory, 'optional-api-consumer.cjs');
    fs.copyFileSync(fixture, consumerFixture);
    assert.ok(fs.existsSync(path.join(installed, 'package.json')));
    for (const profile of profiles) {
      for (const mode of [
        'package-root-cjs',
        'package-root-esm',
        'package-focused',
        'package-focused-esm',
        'package-alias',
        'package-alias-esm',
        'package-wrapper'
      ]) {
        run(installed, mode, profile, consumerFixture);
      }
    }
  });
});
