'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const contract = require('./browser-contract.cjs');
const directory = process.env.GO_BROWSER_PACKAGE || path.resolve(__dirname, '../package');
const filenames = ['go-numbers.js', 'go-numbers.min.js'];
for (const filename of filenames) {
  test(filename + ': CommonJS, AMD and browser globals preserve the API', () => {
    const code = fs.readFileSync(path.join(directory, 'dist', filename), 'utf8');
    assert.ok(code.includes('/*!'));
    assert.ok(code.includes(fs.readFileSync(path.join(directory, 'LICENSE.md'), 'utf8').replace(/\r\n/g, '\n').trim()));
    assert.ok(code.includes('Copyright (c) 2015 Michael Ko'));
    assert.ok(!code.includes('LGPL'));
    assert.ok(code.includes('sourceMappingURL=' + filename + '.map'));
    for (const loader of ['commonjs', 'amd', 'global', 'self', 'legacy', 'null-module']) {
      const sandbox = {
        require() {
          throw Error('External runtime dependency');
        }
      };
      if (loader === 'null-module') sandbox.module = null;
      if (loader === 'commonjs') sandbox.module = { exports: {} };
      if (loader === 'amd') {
        sandbox.define = (dependencies, factory) => {
          assert.equal(dependencies.length, 0);
          sandbox.api = factory();
        };
        sandbox.define.amd = {};
      }
      if (loader === 'self') {
        sandbox.globalThis = undefined;
        sandbox.self = sandbox;
      }
      if (loader === 'legacy') {
        sandbox.globalThis = undefined;
        sandbox.self = undefined;
      }
      const context = vm.createContext(sandbox);
      vm.runInContext(code, context, { timeout: 10000 });
      const api = loader === 'commonjs' ? 'module.exports' : loader === 'amd' ? 'api' : 'goNumbers';
      assert.equal(vm.runInContext('(' + contract.toString() + ')(' + api + ')', context, { timeout: 10000 }), true);
      const source = require(path.join(directory, 'index.js'));
      const loaded = vm.runInContext(api, context);
      assert.deepEqual(Object.keys(loaded).sort(), Object.keys(source).sort());
      if (typeof source === 'function') assert.equal(loaded.name, source.name);
      for (const key of Object.keys(source))
        if (typeof source[key] === 'function') assert.equal(loaded[key].name, source[key].name);
      if (loader === 'commonjs' || loader === 'amd') assert.equal(sandbox.goNumbers, undefined);
    }
    const map = JSON.parse(fs.readFileSync(path.join(directory, 'dist', filename + '.map'), 'utf8'));
    assert.equal(map.version, 3);
    assert.ok(map.mappings.length > 0);
    assert.ok(map.sources.length > 0);
    assert.equal(map.sources.length, map.sourcesContent.length);
    assert.ok(map.sources.every((source) => !path.isAbsolute(source) && !source.includes('node_modules')));
    assert.ok(map.sourcesContent.every((source) => typeof source === 'string' && source.length > 0));
    function checkSources(value) {
      for (let i = 0; i < value.sources.length; i++)
        assert.equal(
          value.sourcesContent[i].replace(/\r\n/g, '\n'),
          fs.readFileSync(path.resolve(directory, 'dist', value.sources[i]), 'utf8').replace(/\r\n/g, '\n'),
          'Source map must contain the shipped source: ' + value.sources[i]
        );
    }
    checkSources(map);
    const corrupted = { ...map, sourcesContent: [...map.sourcesContent] };
    corrupted.sourcesContent[0] += '\n// corrupted embedded source';
    assert.throws(() => checkSources(corrupted), /Source map must contain the shipped source/);
  });
}
test('minification reduces bytes and CDN metadata includes both global installers', () => {
  assert.ok(
    fs.statSync(path.join(directory, 'dist', filenames[1])).size <
      fs.statSync(path.join(directory, 'dist', filenames[0])).size
  );
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  assert.equal(manifest.unpkg, './dist/' + filenames[1]);
  assert.equal(manifest.jsdelivr, manifest.unpkg);
  for (const filename of filenames) assert.ok(manifest.sideEffects.includes('./dist/' + filename));
});
