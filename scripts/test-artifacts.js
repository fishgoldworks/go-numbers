'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { root, consumerFiles, consumerManifest, functionEntries } = require('./package-layout');
async function validate(directory = path.join(root, 'package'), source = root) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  assert.deepEqual(manifest, consumerManifest(source));
  function filesUnder(base, relative = '') {
    const files = [];
    for (const entry of fs.readdirSync(path.join(base, relative), { withFileTypes: true })) {
      const name = relative ? relative + '/' + entry.name : entry.name;
      if (entry.isDirectory()) {
        if (base === source && ['temp', '.tmp'].includes(entry.name)) continue;
        files.push(...filesUnder(base, name));
      } else files.push(name);
    }
    return files;
  }
  const expectedFiles = new Set(['package.json', ...consumerFiles]);
  for (const [file, content] of functionEntries(source)) {
    expectedFiles.add(file);
    assert.equal(fs.readFileSync(path.join(directory, file), 'utf8'), content, 'Stale function entry: ' + file);
  }
  for (const file of filesUnder(source, 'src')) if (/\.(js|d\.ts)$/.test(file)) expectedFiles.add(file);
  for (const [file, content] of require('./build-browser.cjs').generateBrowserBundles(source)) {
    expectedFiles.add(file);
    assert.equal(fs.readFileSync(path.join(directory, file), 'utf8'), content, 'Stale browser bundle: ' + file);
  }
  const actualFiles = new Set(filesUnder(directory));
  for (const file of actualFiles) assert.ok(expectedFiles.has(file), 'Unexpected generated artifact: ' + file);
  for (const file of expectedFiles) assert.ok(actualFiles.has(file), 'Missing generated artifact: ' + file);
  function targets(value) {
    if (typeof value === 'string') {
      const resolved = path.resolve(directory, value);
      assert.ok(resolved.startsWith(directory + path.sep), value);
      assert.ok(fs.existsSync(resolved), 'Missing export or declaration: ' + value);
    } else for (const target of Object.values(value)) targets(target);
  }
  targets(manifest.exports);
  targets(manifest.typesVersions);
  const api = require(path.join(directory, 'index.js'));
  const esm = await import(pathToFileURL(path.join(directory, 'index.mjs')).href);
  assert.equal(esm.default, api);
  for (const key of Object.keys(api)) {
    assert.ok(Object.is(esm[key], api[key]), key);
    if (typeof api[key] === 'function') {
      assert.equal(require(path.join(directory, key + '.js')), api[key]);
      const focused = await import(pathToFileURL(path.join(directory, 'esm', key + '.mjs')).href);
      assert.equal(focused.default, api[key]);
      assert.equal(focused[key], api[key]);
    }
  }
  assert.equal(api.roundTo(1.375, 0.25), 1.5);
  for (const file of consumerFiles)
    assert.equal(
      fs.readFileSync(path.join(directory, file), 'utf8'),
      fs.readFileSync(path.join(source, file), 'utf8'),
      file
    );
  function compareSources(relative) {
    for (const entry of fs.readdirSync(path.join(source, relative), { withFileTypes: true })) {
      const file = path.join(relative, entry.name);
      if (entry.isDirectory()) {
        if (!['temp', '.tmp'].includes(entry.name)) compareSources(file);
      } else if (/\.(js|d\.ts)$/.test(file))
        assert.equal(
          fs.readFileSync(path.join(directory, file), 'utf8'),
          fs.readFileSync(path.join(source, file), 'utf8'),
          file
        );
    }
  }
  compareSources('src');
}
if (require.main === module)
  validate()
    .then(() => console.log('PASS: generated package entries, declarations, imports and freshness'))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
module.exports = { validate };
