'use strict';

// Run in a fresh child process: capability removal must precede the entire
// library import graph, not just one helper's cache eviction.
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');

const [root, mode, profile] = process.argv.slice(2);
const localRequire = createRequire(path.join(root, 'package.json'));
const nativeBigInt = BigInt;
const NativeProxy = Proxy;
const tag = Symbol.toStringTag;
const toPrimitive = Symbol.toPrimitive;
const sentinel = new Error('caller hook');
let calls = 0;
function forbidden() {
  calls++;
  throw sentinel;
}
const boxes = [new Number(12.5), new String('12.5')];
const foreign = vm.runInNewContext(`({number: new Number(12.5), string: new String('12.5'), bigint: Object(12n)})`);
const retainedBigInts = [
  Object(nativeBigInt('9007199254740993')),
  foreign.bigint,
  Object.setPrototypeOf(Object(nativeBigInt('9007199254740993')), null)
];
for (const value of [...boxes, foreign.number, foreign.string, ...retainedBigInts]) {
  Object.defineProperties(value, {
    [tag]: { get: forbidden },
    [toPrimitive]: { get: forbidden },
    valueOf: { get: forbidden },
    toString: { get: forbidden }
  });
}
const inheritedTag = Object.create(null);
Object.defineProperty(inheritedTag, tag, { get: forbidden });
const taggedObject = Object.create(inheritedTag);
taggedObject.toString = function () {
  assert.equal(this, taggedObject);
  return '12.5';
};
const ownTagObject = { toString: () => '12.5' };
Object.defineProperty(ownTagObject, tag, { get: forbidden });
const fakeNumber = { [tag]: 'Number', valueOf: forbidden, toString: forbidden, [toPrimitive]: forbidden };
const trapped = new Proxy({}, { get: forbidden, getPrototypeOf: forbidden });
const revocable = Proxy.revocable({}, {});
revocable.revoke();
const fallback = Object.freeze({ missing: true });

function removeCapabilities() {
  if (profile === 'no-bigint-value-of') nativeBigInt.prototype.valueOf = undefined;
  if (profile === 'inherited-bigint-value-of') delete nativeBigInt.prototype.valueOf;
  if (['no-bigint', 'no-bigint-null', 'combined', 'after-import'].includes(profile)) {
    global.BigInt = profile === 'no-bigint-null' ? null : undefined;
  }
  if (['no-symbol', 'combined'].includes(profile)) global.Symbol = undefined;
  if (['no-proxy', 'combined'].includes(profile)) global.Proxy = undefined;
  if (['no-collections', 'combined'].includes(profile)) {
    for (const key of ['Map', 'Set', 'WeakMap', 'WeakSet']) global[key] = undefined;
  }
  if (['no-bigint-views', 'combined'].includes(profile)) {
    global.BigInt64Array = undefined;
    global.BigUint64Array = undefined;
    for (const name of ['getBigInt64', 'getBigUint64', 'setBigInt64', 'setBigUint64']) {
      DataView.prototype[name] = undefined;
    }
  }
  if (profile === 'after-import') {
    Number.prototype.valueOf = undefined;
    String.prototype.valueOf = undefined;
    nativeBigInt.prototype.valueOf = undefined;
    Object.prototype.hasOwnProperty = undefined;
    Reflect.apply = undefined;
    global.DataView = undefined;
    global.ArrayBuffer = undefined;
  }
}

async function load() {
  if (mode === 'root-cjs') return localRequire('./index.js');
  if (mode === 'package-root-cjs') return localRequire('go-numbers');
  if (mode === 'package-root-esm' || mode === 'root-esm') {
    const namespace = await import(
      mode === 'package-root-esm' ? 'go-numbers' : pathToFileURL(path.join(root, 'index.mjs')).href
    );
    for (const [name, value] of Object.entries(namespace.default)) assert.equal(namespace[name], value);
    return namespace.default;
  }
  const names = [
    'isInteger',
    'isSafeInteger',
    'isFinite',
    'isInfinite',
    'isNaN',
    'isEven',
    'isOdd',
    'isPositive',
    'isNegative',
    'isZero',
    'isZeroOrPositive',
    'isZeroOrNegative',
    'parse',
    'parseStrict',
    'extractNumber',
    'parseFinite',
    'parseSafeInteger',
    'getInteger',
    'getFraction',
    'clamp',
    'isInRange',
    'isClose',
    'round',
    'ceil',
    'floor',
    'roundTo',
    'modulo'
  ];
  const api = {};
  for (const name of names) {
    // Installed package names exercise the export map, not absolute source paths.
    let specifier = './src/' + name + '.js';
    if (mode === 'package-focused' || mode === 'package-focused-esm') specifier = 'go-numbers/' + name;
    if (mode === 'package-alias' || mode === 'package-alias-esm') specifier = 'go-numbers/src/' + name + '.js';
    if (mode === 'package-wrapper') specifier = './' + name + '.js';
    if (mode === 'package-focused-esm' || mode === 'package-alias-esm') {
      api[name] = (await import(specifier)).default;
    } else if (mode === 'focused-esm') {
      api[name] = (await import(pathToFileURL(path.join(root, 'src', name + '.js')).href)).default;
    } else {
      api[name] = localRequire(specifier);
    }
  }
  assert.equal(localRequire('./src/parseInt.js'), api.parse);
  if (mode.startsWith('package-')) {
    assert.equal(localRequire('go-numbers/src/parseInt'), api.parse);
    assert.equal((await import('go-numbers/src/parseInt.js')).default, api.parse);
  }
  return api;
}

(async () => {
  if (profile !== 'after-import') removeCapabilities();
  const numbers = await load();
  if (profile === 'after-import') {
    assert.equal(numbers.roundTo(4503599627370495, 9007199254740990), 9007199254740990);
    removeCapabilities();
  }
  assert.equal(numbers.isInteger(12), true);
  assert.equal(numbers.isSafeInteger(Number.MAX_SAFE_INTEGER), true);
  assert.equal(numbers.isFinite(foreign.number), true);
  assert.equal(numbers.isInfinite(Infinity), true);
  assert.equal(numbers.isNaN(NaN), true);
  assert.equal(numbers.isNaN(new Number(NaN)), false);
  assert.equal(numbers.isEven(-0), true);
  assert.equal(numbers.isOdd(-3), true);
  assert.equal(numbers.isPositive(Infinity), true);
  assert.equal(numbers.isNegative(-Infinity), true);
  assert.equal(numbers.isZero(-0), true);
  assert.equal(numbers.isZeroOrPositive(-0), true);
  assert.equal(numbers.isZeroOrNegative(0), true);
  assert.equal(numbers.parse('prefix 12.5'), 12.5);
  assert.equal(numbers.parseStrict('12.5'), 12.5);
  assert.equal(numbers.extractNumber, numbers.parse);
  assert.equal(numbers.parseFinite('1e3', fallback), 1000);
  assert.equal(numbers.parseSafeInteger('123', fallback), 123);
  assert.equal(numbers.getInteger(-1.25), -2);
  assert.equal(numbers.getFraction(-1.25), 0.25);
  assert.equal(numbers.clamp(3, 0, 1), 1);
  assert.equal(numbers.isInRange(10, 0, 10, { includeMax: false }), false);
  assert.equal(numbers.isClose(0.1 + 0.2, 0.3, { absoluteTolerance: 0 }), true);
  assert.equal(numbers.round(1.005, 2), 1.01);
  assert.equal(numbers.ceil(1.1, 2), 1.1);
  assert.equal(numbers.floor(0.29, 2), 0.29);
  assert.equal(numbers.roundTo(4503599627370497, 2), 4503599627370498);
  assert.equal(numbers.roundTo(-4503599627370497, 2), -4503599627370496);
  assert.equal(numbers.roundTo(4503599627370495, 9007199254740990), 9007199254740990);
  assert.equal(numbers.roundTo(-Number.MIN_VALUE, 3e300), -0);
  assert.equal(numbers.modulo(-1, 5), 4);
  assert.equal(numbers.modulo(-Number.MIN_VALUE, 1), 0.9999999999999999);

  for (const box of [...boxes, foreign.number, foreign.string]) {
    assert.equal(numbers.parse(box, fallback), 12.5);
    assert.equal(numbers.parseFinite(box, fallback), 12.5);
  }
  for (const method of ['parseFinite', 'parseSafeInteger']) {
    for (const value of [...retainedBigInts, fakeNumber, trapped, revocable.proxy, ownTagObject, taggedObject]) {
      assert.equal(numbers[method](value, fallback), fallback);
    }
  }
  for (const value of [...retainedBigInts, fakeNumber, trapped, revocable.proxy]) {
    assert.equal(numbers.isFinite(value), false);
    assert.equal(numbers.isInteger(value), false);
  }
  for (const method of ['parse', 'parseStrict', 'extractNumber', 'getInteger', 'getFraction']) {
    for (const primitive of [undefined, null, true, tag, nativeBigInt(12)]) {
      assert.equal(numbers[method](primitive, fallback), fallback);
    }
    for (const box of [...retainedBigInts, Object(nativeBigInt('9007199254740993'))])
      assert.equal(numbers[method](box, fallback), fallback);
  }
  assert.equal(calls, 0, 'unboxing and safe rejection must not read conversion hooks or tags');
  assert.equal(numbers.parseStrict(taggedObject, fallback), 12.5);
  assert.equal(numbers.parseStrict(ownTagObject, fallback), 12.5);
  assert.equal(calls, 0);
  const customProxy = new NativeProxy(
    {},
    {
      get(_target, property) {
        assert.equal(property, 'toString');
        return () => '12.5';
      },
      getPrototypeOf: forbidden
    }
  );
  assert.equal(numbers.parseStrict(customProxy, fallback), 12.5);
  for (const converted of [tag, nativeBigInt(12), {}]) {
    let conversions = 0;
    assert.equal(
      numbers.parseStrict(
        {
          toString() {
            conversions++;
            return converted;
          }
        },
        fallback
      ),
      fallback
    );
    assert.equal(conversions, 1);
  }
  assert.throws(
    () =>
      numbers.parseStrict({
        get toString() {
          throw sentinel;
        }
      }),
    (error) => error === sentinel
  );
  assert.throws(() => numbers.round('1'), TypeError);
  assert.throws(() => numbers.isInRange(1, 0, 2, { [tag]: 'ignored?' }), TypeError);
  assert.equal(numbers.roundTo(4503599627370495, 9007199254740990), 9007199254740990);
  console.log(JSON.stringify({ result: 'PASS', mode, profile, callables: 27 }));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
