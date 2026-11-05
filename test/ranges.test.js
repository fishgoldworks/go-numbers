'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const n = require('..');
function call(name, ...args) {
  assert.equal(typeof n[name], 'function', `${name} must be exported`);
  return n[name](...args);
}

for (const [value, min, max, expected] of [
  [-10, 0, 100, 0],
  [150, 0, 100, 100],
  [75, 0, 100, 75],
  [1.2, 0, 1, 1],
  [0.2, 0.5, 3, 0.5],
  [5, 5, 5, 5],
  [4, 5, 5, 5],
  [6, 5, 5, 5],
  [-15, -10, -5, -10],
  [-7, -10, -5, -7],
  [-1, -10, -5, -5],
  [Infinity, 0, 10, 10],
  [-Infinity, 0, 10, 0],
  [NaN, 0, 10, NaN],
  [-0, 0, 1, -0],
  [0, -0, 1, 0],
  [-0, 0, 0, -0],
  [0, -0, -0, 0],
  [-1, -0, 1, -0],
  [1, -1, -0, -0],
  [Number.MAX_VALUE, -Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]
]) {
  test(`clamp(${String(value)}, ${min}, ${max}) has the intended boundary behavior`, () => {
    assert.ok(Object.is(call('clamp', value, min, max), expected));
  });
}

for (const [value, expected] of [
  [0, true],
  [10, true],
  [5, true],
  [-1, false],
  [11, false],
  [Infinity, false],
  [-Infinity, false],
  [NaN, false],
  [-0, true]
]) {
  test(`isInRange checks ${String(value)} against inclusive [0,10]`, () => {
    assert.equal(call('isInRange', value, 0, 10), expected);
  });
}
test('isInRange supports all endpoint combinations, including degenerate intervals', () => {
  for (const includeMin of [true, false])
    for (const includeMax of [true, false]) {
      const options = { includeMin, includeMax };
      assert.equal(call('isInRange', 0, 0, 10, options), includeMin);
      assert.equal(call('isInRange', 10, 0, 10, options), includeMax);
      assert.equal(call('isInRange', 5, 0, 10, options), true);
      assert.equal(call('isInRange', 4, 5, 5, options), false);
      assert.equal(call('isInRange', 5, 5, 5, options), includeMin && includeMax);
      assert.equal(call('isInRange', -0, 0, 0, options), includeMin && includeMax);
    }
});
for (const name of ['clamp', 'isInRange']) {
  test(`${name} uses genuine boxed arguments and cross-realm numeric values`, () => {
    const value = vm.runInNewContext('new Number(5)');
    const low = new Number(0),
      high = new Number(10);
    for (const box of [value, low, high]) {
      Object.defineProperty(box, Symbol.toPrimitive, {
        get() {
          throw new Error('do not coerce');
        }
      });
    }
    assert.equal(call(name, value, low, high), name === 'clamp' ? 5 : true);
  });
  test(`${name} rejects invalid bounds even when the checked value is unsupported`, () => {
    for (const bad of [undefined, null, '0', true, Symbol(), 0n, {}, [], Object.create(Number.prototype)]) {
      assert.throws(() => call(name, 5, bad, 10), TypeError);
      assert.throws(() => call(name, 5, 0, bad), TypeError);
    }
    for (const bad of [NaN, Infinity, -Infinity]) {
      assert.throws(() => call(name, 5, bad, 10), RangeError);
      assert.throws(() => call(name, 5, 0, bad), RangeError);
    }
    assert.throws(() => call(name, 5, 10, 0), RangeError);
    assert.throws(() => call(name, 'not numeric', 10, 0), RangeError);
  });
}

test('clamp throws on invalid values; isInRange returns false without invoking value hooks', () => {
  const hostile = new Proxy(
    {},
    {
      get() {
        throw new Error('get');
      },
      getPrototypeOf() {
        throw new Error('prototype');
      }
    }
  );
  const revoked = Proxy.revocable(new Number(3), {});
  revoked.revoke();
  for (const value of [undefined, null, '5', true, 5n, Symbol('5'), {}, [], hostile, revoked.proxy]) {
    assert.throws(() => call('clamp', value, 0, 10), TypeError);
    assert.equal(call('isInRange', value, 0, 10), false);
  }
});

test('range options default independently and ignore inherited properties', () => {
  assert.equal(call('isInRange', 10, 0, 10, { includeMin: false }), true);
  assert.equal(call('isInRange', 0, 0, 10, { includeMax: false }), true);
  assert.equal(call('isInRange', 0, 0, 10, {}), true);
  assert.equal(call('isInRange', 10, 0, 10, { includeMax: undefined }), true);
  const inherited = Object.create({ includeMax: false, typo: true });
  assert.equal(call('isInRange', 10, 0, 10, inherited), true);
  const own = Object.assign(Object.create(null), { includeMax: false });
  assert.equal(call('isInRange', 10, 0, 10, own), false);
});

test('range options reject unknown own keys and invalid boolean values', () => {
  for (const options of [
    null,
    false,
    1,
    'options',
    [],
    () => {},
    { includeMax: 0 },
    { includeMin: null },
    { includeMin: 'false' },
    { includeMax: new Boolean(false) },
    { inclusivemax: false },
    { [Symbol('includeMax')]: false }
  ]) {
    assert.throws(() => call('isInRange', 5, 0, 10, options), TypeError);
  }
  assert.throws(() => call('isInRange', NaN, 0, 10, { typo: true }), TypeError);
});

test('range options are not mutated and each configured getter is read once', () => {
  let calls = 0;
  const options = Object.freeze({
    get includeMin() {
      calls++;
      return false;
    },
    includeMax: true
  });
  assert.equal(call('isInRange', 0, 0, 10, options), false);
  assert.equal(calls, 1);
  const error = new Error('option failed');
  assert.throws(
    () =>
      call('isInRange', 5, 0, 10, {
        get includeMin() {
          throw error;
        }
      }),
    (e) => e === error
  );
});

test('range predicates and clamping satisfy generated bounds and idempotence invariants', () => {
  let seed = 123;
  for (let i = 0; i < 10000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const low = (seed % 1000) - 500,
      high = low + (seed % 113),
      value = (seed / 0xffffffff - 0.5) * 2000;
    const result = call('clamp', value, low, high);
    assert.ok(result >= low && result <= high);
    assert.equal(call('clamp', result, low, high), result);
    assert.equal(call('isInRange', value, low, high), value >= low && value <= high);
  }
});
