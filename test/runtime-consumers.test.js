'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const { withPackedPackage, run } = require('../scripts/package-consumer');

const root = path.resolve(__dirname, '..');

test('runtime consumer fixtures execute the installed full API on the current interpreter', () => {
  withPackedPackage(({ directory }) => {
    for (const file of ['contracts.cjs', 'commonjs.cjs', 'module.mjs']) {
      fs.copyFileSync(path.join(__dirname, 'consumers', file), path.join(directory, file));
    }
    for (const file of ['commonjs.cjs', 'module.mjs']) {
      process.stdout.write(run(process.execPath, [file], directory));
    }
  });
});

test('consumer-floor verification fails when the required historical executables are absent', () => {
  const env = { ...process.env };
  for (const name of ['NODE8_BIN', 'NODE_ESM_BIN', 'NODE13_BIN', 'NODE13_ESM_BIN', 'NODE13_UNFLAGGED_ESM_BIN'])
    delete env[name];
  const result = spawnSync(process.execPath, ['scripts/test-compatibility.js'], {
    cwd: root,
    env,
    encoding: 'utf8',
    timeout: 10000
  });
  assert.ifError(result.error);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Set NODE8_BIN to Node 8\.0\.0 and NODE_ESM_BIN to Node 12\.17\.0/);
});

test('a current interpreter cannot stand in for the declared CommonJS floor', () => {
  const env = {
    ...process.env,
    NODE8_BIN: process.execPath,
    NODE_ESM_BIN: process.execPath,
    NODE13_ESM_BIN: process.execPath,
    NODE13_UNFLAGGED_ESM_BIN: process.execPath
  };
  delete env.NODE13_BIN;
  const result = spawnSync(process.execPath, ['scripts/test-compatibility.js'], {
    cwd: root,
    env,
    encoding: 'utf8',
    timeout: 10000
  });
  assert.ifError(result.error);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /v8\.0\.0/);
});

for (const missing of ['NODE13_ESM_BIN', 'NODE13_UNFLAGGED_ESM_BIN']) {
  test('consumer-floor verification requires ' + missing, () => {
    const env = {
      ...process.env,
      NODE8_BIN: process.execPath,
      NODE_ESM_BIN: process.execPath,
      NODE13_ESM_BIN: process.execPath,
      NODE13_UNFLAGGED_ESM_BIN: process.execPath
    };
    delete env[missing];
    const result = spawnSync(process.execPath, ['scripts/test-compatibility.js'], {
      cwd: root,
      env,
      encoding: 'utf8',
      timeout: 10000
    });
    assert.ifError(result.error);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Set NODE8_BIN/);
    assert.ok(result.stderr.includes(missing));
  });
}
