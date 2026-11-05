'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const filename = path.join(__dirname, 'build.js');
const localRequire = createRequire(filename);
const project = path.basename(path.resolve(__dirname, '..'));
// Execute the actual build body with isolated dependency seams: no filesystem mutation.
for (const value of [undefined, null, false, 0, '']) {
  for (const cleanupFails of [false, true]) {
    test('preserves thrown ' + String(value) + (cleanupFails ? ' with cleanup failure' : ''), async () => {
      const cleanupError = new Error('injected cleanup failure');
      let removed = false;
      let replaced = false;
      const fail = () => {
        throw value;
      };
      const remove = () => {
        removed = true;
        if (cleanupFails) throw cleanupError;
      };
      const staged = path.join(__dirname, 'virtual-staging-never-written');
      const fakeFs = {
        ...fs,
        mkdtempSync: () => staged,
        mkdirSync() {},
        copyFileSync() {},
        cpSync() {},
        writeFileSync() {
          if (project === 'go-strings') fail();
        },
        rmSync: remove,
        renameSync() {
          replaced = true;
          throw Error('must not replace after failure');
        }
      };
      const fakePromises = {
        mkdtemp: async () => staged,
        rm: async () => remove(),
        rename: async () => {
          replaced = true;
          throw Error('must not replace after failure');
        }
      };
      const stubRequire = (id) => {
        if (id === 'node:fs') return fakeFs;
        if (id === 'node:fs/promises') return fakePromises;
        if (id === 'esbuild') return { build: async () => fail() };
        if (id === './docs' || id === './docs.js') return { generate() {} };
        if (id === './test-artifacts' || id === './test-artifacts.js') return { validate: async () => fail() };
        if (id === './package-layout' && project === 'go-arrays') return { generatePackage: fail };
        return localRequire(id);
      };
      let source = fs.readFileSync(filename, 'utf8');
      if (project === 'go-arrays') source = source.replace(/main\(\);\s*$/, 'module.exports = main;');
      if (project === 'go-providers') source = source.replace(/main\(\)\.catch\([\s\S]*$/, 'module.exports = main;');
      const module = { exports: {} };
      const wrapper = vm.runInThisContext(
        '(function(require,module,exports,__dirname,__filename,process){' + source + '\n})',
        { filename }
      );
      wrapper(stubRequire, module, module.exports, __dirname, filename, { argv: ['node', filename] });
      const build = typeof module.exports === 'function' ? module.exports : module.exports.build;
      let failed = false;
      try {
        await build();
      } catch (error) {
        failed = true;
        if (cleanupFails) {
          assert.ok(error instanceof AggregateError);
          assert.deepEqual(error.errors, [value, cleanupError]);
          assert.equal(error.cause, cleanupError);
        } else assert.equal(error, value);
      }
      assert.equal(failed, true, 'a thrown falsy value must reject the build');
      assert.equal(removed, true, 'staged cleanup still runs');
      assert.equal(replaced, false, 'failed staging cannot replace usable output');
    });
  }
}
