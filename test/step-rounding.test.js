'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const numbers = require('..');
function roundTo(...args) {
  assert.equal(typeof numbers.roundTo, 'function', 'roundTo must be exported');
  return numbers.roundTo(...args);
}
const cases = [
  [127, 10, 130],
  [1.37, 0.25, 1.25],
  [17, 5, 15],
  [0.15, 0.1, 0.2],
  [0.3, 0.1, 0.3],
  [-0.15, 0.1, -0.1],
  [-0.15001, 0.1, -0.2],
  [1.375, 0.25, 1.5],
  [-1.375, 0.25, -1.25],
  [0.025, 0.05, 0.05],
  [-0.025, 0.05, -0],
  [0.0249, 0.05, 0],
  [-0.0249, 0.05, -0],
  [0, 0.1, 0],
  [-0, 0.1, -0],
  [NaN, 0.1, NaN],
  [Infinity, 0.1, Infinity],
  [-Infinity, 0.1, -Infinity],
  [Number.MIN_VALUE, Number.MAX_VALUE, 0],
  [-Number.MIN_VALUE, Number.MAX_VALUE, -0],
  [Number.MAX_VALUE, Number.MIN_VALUE, Number.MAX_VALUE],
  [1, Number.MIN_VALUE, 1],
  [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE],
  [1e-323, 1.5e-323, 1.5e-323],
  [-1e-323, 1.5e-323, -1.5e-323],
  [Number.MIN_VALUE, 1e-323, 1e-323],
  [-Number.MIN_VALUE, 1e-323, -0],
  [Number.MAX_VALUE, 1e308, Infinity],
  [-Number.MAX_VALUE, 1e308, -Infinity],
  [1.5e308, 1e308, Infinity],
  [-1.5e308, 1e308, -1e308],
  [2.49, 1, 2],
  [2.5, 1, 3],
  [-2.5, 1, -2],
  [1e-30, 2e-30, 2e-30],
  [-1e-30, 2e-30, -0]
];
for (const [value, step, expected] of cases) {
  test(`roundTo(${String(value)}, ${step}) rounds decimal multiples with positive ties`, () => {
    assert.ok(Object.is(roundTo(value, step), expected));
  });
}
test('roundTo validates a positive finite step, including for special values', () => {
  for (const value of [1, Infinity, NaN]) {
    for (const step of [undefined, null, false, '.1', 1n, Symbol(), {}, []]) {
      assert.throws(() => roundTo(value, step), TypeError);
    }
    for (const step of [0, -0, -0.1, NaN, Infinity, -Infinity]) {
      assert.throws(() => roundTo(value, step), RangeError);
    }
  }
});
test('roundTo accepts intrinsic boxes for both operands and rejects unrelated values without coercion', () => {
  for (const box of [new Number(0.15), vm.runInNewContext('new Number(.15)')]) {
    Object.defineProperty(box, Symbol.toPrimitive, {
      get() {
        throw new Error('coercion');
      }
    });
    assert.equal(roundTo(box, new Number(0.1)), 0.2);
  }
  const hostile = new Proxy(
    {},
    {
      get() {
        throw new Error('trap');
      }
    }
  );
  for (const value of ['.15', undefined, null, true, 1n, Symbol(), {}, [], hostile]) {
    assert.throws(() => roundTo(value, 0.1), TypeError);
    assert.throws(() => roundTo(1, value), TypeError);
  }
  const revoked = Proxy.revocable(new Number(1), {});
  revoked.revoke();
  assert.throws(() => roundTo(revoked.proxy, 1), TypeError);
});
