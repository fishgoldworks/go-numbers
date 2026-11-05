'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { withPackedPackage, run } = require('./package-consumer');
const node8 = process.env.NODE8_BIN;
const esm = process.env.NODE_ESM_BIN;
const node13 = process.env.NODE13_BIN;
const esm13 = process.env.NODE13_ESM_BIN;
const esm13Unflagged = process.env.NODE13_UNFLAGGED_ESM_BIN;
if (!node8 || !esm || !esm13 || !esm13Unflagged)
  throw new Error(
    'Set NODE8_BIN to Node 8.0.0 and NODE_ESM_BIN to Node 12.17.0 plus NODE13_ESM_BIN to Node 13.2.0 and NODE13_UNFLAGGED_ESM_BIN to Node 13.7.0 for exact consumer-floor verification.'
  );
assert.equal(run(node8, ['--version']).trim(), 'v8.0.0');
assert.equal(run(esm, ['--version']).trim(), 'v12.17.0');
assert.equal(run(esm13, ['--version']).trim(), 'v13.2.0');
assert.equal(run(esm13Unflagged, ['--version']).trim(), 'v13.7.0');
if (node13) assert.equal(run(node13, ['--version']).trim(), 'v13.0.0');
withPackedPackage(({ directory }) => {
  for (const file of ['contracts.cjs', 'commonjs.cjs', 'module.mjs'])
    fs.copyFileSync(path.join(__dirname, '../test/consumers', file), path.join(directory, file));
  for (const [file, executables] of [
    ['commonjs.cjs', [node8, esm, node13, esm13, esm13Unflagged, process.execPath].filter(Boolean)],
    ['module.mjs', [esm, esm13Unflagged, process.execPath]]
  ]) {
    for (const executable of executables) process.stdout.write(run(executable, [file], directory));
  }
  for (const file of ['commonjs.cjs', 'module.mjs'])
    process.stdout.write(run(esm13, ['--experimental-conditional-exports', file], directory));
});
