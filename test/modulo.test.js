'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const numbers = require('..');
function modulo(...args) {
  assert.equal(typeof numbers.modulo, 'function', 'modulo must be exported');
  return numbers.modulo(...args);
}
const cases = [
  [-1, 5, 4],
  [-15, 360, 345],
  [725, 360, 5],
  [15, 5, 0],
  [-15, 5, 0],
  [0, 5, 0],
  [-0, 5, 0],
  [0.75, 0.5, 0.25],
  [-0.75, 0.5, 0.25],
  [1, 1e308, 1],
  [Number.MIN_VALUE, 1, Number.MIN_VALUE],
  [-Number.MIN_VALUE, 1, 0.9999999999999999],
  [Number.MIN_VALUE, 1e-323, Number.MIN_VALUE],
  [-Number.MIN_VALUE, 1e-323, Number.MIN_VALUE],
  [1, Number.MIN_VALUE, 0],
  [-1, Number.MIN_VALUE, 0],
  [Number.MAX_VALUE, Number.MAX_VALUE, 0],
  [0.3, 0.1, 0.3 % 0.1]
];
for (const [value, modulus, expected] of cases) {
  test(`modulo(${String(value)}, ${modulus}) stays in the half-open range`, () => {
    const result = modulo(value, modulus);
    assert.ok(Object.is(result, expected));
    assert.ok(result >= 0 && result < modulus);
    assert.equal(Object.is(result, -0), false);
  });
}
test('modulo rejects nonfinite values and nonpositive/nonfinite moduli', () => {
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.throws(() => modulo(value, 5), RangeError);
  }
  for (const modulus of [0, -0, -5, NaN, Infinity, -Infinity]) {
    assert.throws(() => modulo(1, modulus), RangeError);
  }
});
test('modulo accepts genuine boxes and never coerces unsupported operands', () => {
  const foreign = vm.runInNewContext('new Number(-1)');
  Object.defineProperty(foreign, Symbol.toPrimitive, {
    get() {
      throw new Error('coercion');
    }
  });
  assert.equal(modulo(foreign, new Number(5)), 4);
  const hostile = new Proxy(
    {},
    {
      get() {
        throw new Error('trap');
      }
    }
  );
  const revoked = Proxy.revocable(new Number(1), {});
  revoked.revoke();
  for (const value of [null, undefined, false, '1', 1n, Symbol(), {}, [], hostile, revoked.proxy]) {
    assert.throws(() => modulo(value, 5), TypeError);
    assert.throws(() => modulo(1, value), TypeError);
  }
});
