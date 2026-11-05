'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const numbers = require('..');

function call(name, ...args) {
  assert.equal(typeof numbers[name], 'function', `${name} must be exported`);
  return numbers[name](...args);
}

const cases = [
  [10.001, 2, 10.01, 10],
  [99.999, 1, 100, 99.9],
  [1.1, 2, 1.1, 1.1],
  [0.29, 2, 0.29, 0.29],
  [-1.239, 2, -1.23, -1.24],
  [-1.231, 2, -1.23, -1.24],
  [1.005, 2, 1.01, 1],
  [-1.005, 2, -1, -1.01],
  [1.5, 0, 2, 1],
  [-1.5, 0, -1, -2],
  [0.1, 0, 1, 0],
  [-0.1, 0, -0, -1],
  [0, 2, 0, 0],
  [-0, 2, -0, -0],
  [NaN, 2, NaN, NaN],
  [Infinity, 2, Infinity, Infinity],
  [-Infinity, 2, -Infinity, -Infinity],
  [1260, -2, 1300, 1200],
  [-1260, -2, -1200, -1300],
  [1200, -2, 1200, 1200],
  [-1200, -2, -1200, -1200],
  [9.999, 2, 10, 9.99],
  [-9.999, 2, -9.99, -10],
  [1e-200, -200, 1e200, 0],
  [-1e-200, -200, -0, -1e200],
  [1.23e-7, 8, 1.3e-7, 1.2e-7],
  [-1.23e-7, 8, -1.2e-7, -1.3e-7],
  [Number.MIN_VALUE, 324, Number.MIN_VALUE, Number.MIN_VALUE],
  [Number.MIN_VALUE, 323, 1e-323, 0],
  [-Number.MIN_VALUE, 323, -0, -1e-323],
  [Number.MAX_VALUE, 324, Number.MAX_VALUE, Number.MAX_VALUE],
  [Number.MAX_VALUE, -308, Infinity, 1e308],
  [-Number.MAX_VALUE, -308, -1e308, -Infinity],
  [12.34, 20, 12.34, 12.34],
  [1e21, -2, 1e21, 1e21]
];
for (const [value, precision, ceiled, floored] of cases) {
  for (const [name, expected] of [
    ['ceil', ceiled],
    ['floor', floored]
  ]) {
    test(`${name}(${String(value)}, ${precision}) follows directed decimal rounding`, () => {
      assert.ok(Object.is(call(name, value, precision), expected));
    });
  }
}
for (const name of ['ceil', 'floor']) {
  test(`${name} defaults precision, accepts genuine boxes and never coerces unrelated values`, () => {
    assert.equal(call(name, 1.2), name === 'ceil' ? 2 : 1);
    assert.equal(call(name, 1.2, undefined), name === 'ceil' ? 2 : 1);
    for (const value of [new Number(1.2), vm.runInNewContext('new Number(1.2)')]) {
      Object.defineProperty(value, Symbol.toPrimitive, {
        get() {
          throw new Error('coercion');
        }
      });
      assert.equal(call(name, value, 1), 1.2);
    }
    const proxy = new Proxy(
      {},
      {
        get() {
          throw new Error('proxy');
        }
      }
    );
    const revoked = Proxy.revocable(new Number(1), {});
    revoked.revoke();
    for (const value of [undefined, null, false, '1.2', 1n, Symbol(), {}, [], proxy, revoked.proxy]) {
      assert.throws(() => call(name, value), TypeError);
    }
  });
  test(`${name} validates precision before accepting special values`, () => {
    for (const value of [0, Infinity, NaN]) {
      for (const precision of ['2', null, 2n, new Number(2), Symbol(), {}]) {
        assert.throws(() => call(name, value, precision), TypeError);
      }
      for (const precision of [0.5, -309, 325, NaN, Infinity, -Infinity]) {
        assert.throws(() => call(name, value, precision), RangeError);
      }
    }
    assert.equal(call(name, 5, -0), 5);
  });
}
