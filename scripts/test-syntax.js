'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const sources = ['index.js', 'index.mjs'];
function collect(directory) {
  for (const file of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.join(directory, file.name);
    if (file.isDirectory()) {
      if (!['temp', '.tmp'].includes(file.name)) collect(relative);
    } else if (/\.(?:c|m)?js$/.test(file.name)) sources.push(relative);
  }
}
for (const directory of ['src', 'test', 'scripts', 'benchmarks']) collect(directory);
for (const file of sources) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${file}\n${result.stderr}`);
}
const pkg = require('../package.json');
const lock = require('../package-lock.json');
assert.equal(lock.name, pkg.name);
assert.equal(lock.packages[''].name, pkg.name);
assert.equal(lock.version, pkg.version);
assert.equal(lock.packages[''].version, pkg.version);
assert.deepEqual(lock.packages[''].devDependencies, pkg.devDependencies);
assert.deepEqual(lock.packages[''].engines, pkg.engines);
assert.equal(lock.packages[''].license, pkg.license);
console.log(`PASS: ${sources.length} JavaScript syntax checks and package/lock consistency`);
