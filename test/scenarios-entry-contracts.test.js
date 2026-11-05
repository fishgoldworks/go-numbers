'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const n = require('..');

const fallback = Object.freeze({ missing: true });
const samples = {
  isInteger: [
    [[2.5], false],
    [[new Number(2)], true]
  ],
  isSafeInteger: [
    [[Number.MAX_SAFE_INTEGER], true],
    [[2 ** 53], false]
  ],
  isFinite: [
    [[Infinity], false],
    [[new Number(2)], true]
  ],
  isInfinite: [
    [[-Infinity], true],
    [[Number.MAX_VALUE], false]
  ],
  isNaN: [
    [[NaN], true],
    [[new Number(NaN)], false]
  ],
  isEven: [
    [[-2], true],
    [[-3], false]
  ],
  isOdd: [
    [[-3], true],
    [[-2], false]
  ],
  isPositive: [
    [[Infinity], true],
    [[-0], false]
  ],
  isNegative: [
    [[-Infinity], true],
    [[0], false]
  ],
  isZero: [
    [[-0], true],
    [['0'], false]
  ],
  isZeroOrPositive: [
    [[-0], true],
    [[-1], false]
  ],
  isZeroOrNegative: [
    [[0], true],
    [[1], false]
  ],
  parse: [
    [['cost -1.25'], -1.25],
    [['invalid', fallback], fallback]
  ],
  extractNumber: [
    [['cost -1.25'], -1.25],
    [['invalid', fallback], fallback]
  ],
  parseStrict: [
    [['1e3'], 1000],
    [['1e3 ', fallback], fallback]
  ],
  parseFinite: [
    [['1e3'], 1000],
    [['1e999', fallback], fallback]
  ],
  parseSafeInteger: [
    [['001'], 1],
    [['1.0', fallback], fallback]
  ],
  getInteger: [
    [['value -1.25'], -2],
    [[Infinity, fallback], fallback]
  ],
  getFraction: [
    [[-1.01], 0.01],
    [[1.2e21], 0]
  ],
  clamp: [
    [[-0, 0, 1], -0],
    [[10, 0, 1], 1]
  ],
  isInRange: [
    [[1, 0, 1], true],
    [[1, 0, 1, { includeMax: false }], false]
  ],
  isClose: [
    [[0.1 + 0.2, 0.3], true],
    [[Number.MIN_VALUE, 0, { relativeTolerance: 0.75 }], false]
  ],
  round: [
    [[1.005, 2], 1.01],
    [[-0.5], -0]
  ],
  ceil: [
    [[1.1, 2], 1.1],
    [[-0.1], -0]
  ],
  floor: [
    [[0.29, 2], 0.29],
    [[-0.1], -1]
  ],
  roundTo: [
    [[0.15, 0.1], 0.2],
    [[-0.15, 0.1], -0.1]
  ],
  modulo: [
    [[-1, 5], 4],
    [[-0, 5], 0]
  ]
};
test('scenario sample manifest deliberately covers every public callable', () => {
  assert.deepEqual(
    Object.keys(samples).sort(),
    Object.keys(n)
      .filter((key) => typeof n[key] === 'function')
      .sort()
  );
});
for (const [name, cases] of Object.entries(samples)) {
  test(`public entry contract: ${name} through authored root, ESM and leaf`, async () => {
    const esm = await import('../index.mjs');
    const functions = [n[name], esm[name], esm.default[name], require(`../src/${name}.js`)];
    const receiver = new Proxy(
      {},
      {
        get() {
          throw new Error('utility must not depend on this');
        }
      }
    );
    for (const operation of functions) {
      assert.equal(operation, n[name]);
      for (const [args, expected] of cases) {
        assert.ok(Object.is(Reflect.apply(operation, receiver, args), expected), name);
      }
    }
  });
}
test('all individual CommonJS utilities work without loading the public aggregate', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
        const assert = require('node:assert/strict');
        const Module = require('node:module');
        const originalLoad = Module._load;
        Module._load = function (request, parent, isMain) {
            const resolved = Module._resolveFilename(request, parent);
            const normalized = resolved.replaceAll(String.fromCharCode(92), '/');
            assert.ok(!normalized.endsWith('/src/Numbers.js') && !normalized.endsWith('/index.js'),
                'leaf import attempted to load aggregate: ' + resolved);
            return originalLoad.apply(this, arguments);
        };
        for (const name of ${JSON.stringify(Object.keys(samples))}) {
            assert.equal(typeof require(${JSON.stringify(path.resolve(__dirname, '../src'))} + '/' + name + '.js'), 'function');
        }
    `
    ],
    { encoding: 'utf8', timeout: 5000 }
  );
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});
test('alias identity remains exact across repeated mixed imports', async () => {
  const esm = await import('../index.mjs');
  assert.equal(esm.default, n);
  for (const suffix of ['/src/parseInt.js', '/src/parse.js', '/src/extractNumber.js']) {
    assert.equal(require('..' + suffix), n.parse);
    assert.equal((await import('..' + suffix)).default, n.parse);
  }
});
