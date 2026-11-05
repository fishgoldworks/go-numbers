'use strict';

// This is a real consumer-bundler gate, not a string-based tree-shaking estimate.
// Installed with the pinned development dependencies by npm ci.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { withPackedPackage } = require('./package-consumer.js');
let esbuild;
try {
  esbuild = require('esbuild');
} catch (error) {
  throw new Error('Bundle verification requires esbuild 0.25.5. Run: npm ci', { cause: error });
}
assert.equal(esbuild.version, '0.25.5', 'Use the documented bundler version for reproducible results.');

withPackedPackage(({ directory }) => {
  function bundle(label, source, scope = {}) {
    const entry = path.join(directory, 'entry.mjs');
    fs.writeFileSync(entry, source);
    const result = esbuild.buildSync({
      absWorkingDir: directory,
      entryPoints: [entry],
      bundle: true,
      platform: 'browser',
      format: 'iife',
      globalName: 'Consumer',
      target: 'es2020',
      treeShaking: true,
      minify: true,
      write: false,
      metafile: true,
      logLevel: 'silent'
    });
    const code = result.outputFiles[0].text;
    vm.runInNewContext(code, scope, { filename: `${label}.js`, timeout: 5000 });
    const retained = new Set();
    for (const output of Object.values(result.metafile.outputs)) {
      for (const [file, info] of Object.entries(output.inputs)) {
        const normal = file.replaceAll('\\', '/');
        const prefix = 'node_modules/go-numbers/';
        const offset = normal.indexOf(prefix);
        if (offset >= 0 && info.bytesInOutput > 0) retained.add(normal.slice(offset + prefix.length));
      }
    }
    console.log(`${label}: ${Buffer.byteLength(code)} bytes; ${[...retained].join(', ')}`);
    return { api: scope.Consumer, retained };
  }
  const allowedClamp = new Set(['src/clamp.js', 'src/internal/unwrapNumber.js', 'src/internal/checkBounds.js']);
  for (const [label, source] of [
    ['root named clamp', "export { clamp as operation } from 'go-numbers';"],
    ['leaf clamp', "export { default as operation } from 'go-numbers/clamp';"],
    ['named leaf clamp', "export { clamp as operation } from 'go-numbers/clamp';"]
  ]) {
    const result = bundle(label, source);
    assert.equal(result.api.operation(150, 0, 100), 100);
    assert.ok(result.retained.has('src/clamp.js'));
    for (const file of result.retained) {
      if (file.startsWith('src/')) assert.ok(allowedClamp.has(file), `Unrelated module retained: ${file}`);
    }
    assert.equal(result.retained.has('index.js'), false);
  }
  const constant = bundle('root constant', "export { EPSILON } from 'go-numbers';");
  assert.equal(constant.api.EPSILON, Number.EPSILON);
  assert.equal(
    [...constant.retained].some((file) => file.startsWith('src/')),
    false
  );

  const aggregate = bundle('default aggregate', "import Numbers from 'go-numbers'; export default Numbers;");
  assert.ok(aggregate.retained.has('src/Numbers.js'));
  assert.equal(aggregate.api.default.roundTo(0.15, 0.1), 0.2);
  assert.equal(aggregate.api.default.modulo(-1, 5), 4);
  const identity = bundle(
    'mixed import identities',
    `
        import Numbers, { roundTo, extractNumber, parse, ceil, floor, modulo } from 'go-numbers';
        import direct from 'go-numbers/roundTo';
        export const same = Numbers.roundTo === roundTo && roundTo === direct && extractNumber === parse;
        export const results = [ceil(1.1, 2), floor(.29, 2), roundTo(.15, .1), modulo(-1, 5)];
    `
  );
  assert.equal(identity.api.same, true);
  assert.deepEqual(Array.from(identity.api.results), [1.1, 0.29, 0.2, 4]);
  const hiddenGlobals = bundle(
    'legacy parsing without BigInt globals',
    "export { parseStrict, parse, extractNumber, getInteger, getFraction } from 'go-numbers';",
    { BigInt: undefined, BigInt64Array: undefined, BigUint64Array: undefined }
  );
  for (const name of ['parseStrict', 'parse', 'extractNumber', 'getInteger', 'getFraction']) {
    const value = Object(9007199254740993n);
    Object.defineProperty(value, 'toString', {
      get() {
        return assert.fail('BigInt conversion hook');
      }
    });
    assert.equal(hiddenGlobals.api[name](value, null), null);
    assert.equal(hiddenGlobals.api[name](Object(9007199254740993n), null), null);
  }
  assert.equal(hiddenGlobals.api.parseStrict({ toString: () => '12.5' }), 12.5);
  console.log('PASS: packed browser-targeted bundles execute and exclude unrelated runtime modules.');
});
