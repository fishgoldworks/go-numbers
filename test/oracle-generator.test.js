'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { createHash } = require('node:crypto');
const catalog = require('../scripts/lib/oracle-corpora.json');
const script = path.resolve(__dirname, '../scripts/oracle-cases.js');

function generate(args = []) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 16 * 1024 * 1024
  });
}

for (const family of ['lcg', 'sha256']) {
  test(`oracle generator: ${family} retains its independently reviewed input corpus`, () => {
    const result = generate(['--family', family]);
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    const cases = JSON.parse(result.stdout);
    const expected = catalog.families[family];
    assert.equal(cases.length, expected.count);
    const counts = {};
    for (const row of cases) {
      assert.equal(row.length, 4);
      for (const field of row) assert.equal(typeof field, 'string');
      assert.match(row[3], /^[0-9a-f]{16}$/);
      counts[row[0]] = (counts[row[0]] || 0) + 1;
    }
    assert.deepEqual(counts, expected.operations);
    const inputWire = JSON.stringify(cases.map((row) => row.slice(0, 3)));
    assert.equal(createHash('sha256').update(inputWire).digest('hex'), expected.inputSha256);
  });
}

test('oracle generator: invalid family and unexpected arguments fail rather than silently using LCG', () => {
  for (const args of [['--family', 'typo'], ['--family'], ['--unknown'], ['--family', 'lcg', 'extra']]) {
    const result = generate(args);
    assert.ifError(result.error);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout.trim(), '');
    assert.match(result.stderr, /Usage|family/);
  }
});

test('oracle generator: invocation without arguments keeps the existing LCG input protocol', () => {
  const result = generate();
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  const inputWire = JSON.stringify(JSON.parse(result.stdout).map((row) => row.slice(0, 3)));
  assert.equal(createHash('sha256').update(inputWire).digest('hex'), catalog.families.lcg.inputSha256);
});
