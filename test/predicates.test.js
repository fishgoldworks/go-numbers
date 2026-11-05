'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');

const reference = {
  isInteger: Number.isInteger,
  isSafeInteger: Number.isSafeInteger,
  isFinite: Number.isFinite,
  isInfinite: (value) => value === Infinity || value === -Infinity,
  isNaN: Number.isNaN,
  isEven: (value) => Number.isInteger(value) && value % 2 === 0,
  isOdd: (value) => Number.isInteger(value) && Math.abs(value % 2) === 1,
  isPositive: (value) => value > 0,
  isNegative: (value) => value < 0,
  isZero: (value) => value === 0,
  isZeroOrPositive: (value) => value >= 0,
  isZeroOrNegative: (value) => value <= 0
};
const values = [
  ['+0', 0],
  ['-0', -0],
  ['+1', 1],
  ['-1', -1],
  ['+2', 2],
  ['-2', -2],
  ['+3', 3],
  ['-3', -3],
  ['fraction', 1.25],
  ['negative fraction', -1.25],
  ['minimum positive subnormal', Number.MIN_VALUE],
  ['negative subnormal', -Number.MIN_VALUE],
  ['epsilon', Number.EPSILON],
  ['one plus epsilon', 1 + Number.EPSILON],
  ['max finite', Number.MAX_VALUE],
  ['min finite', -Number.MAX_VALUE],
  ['max safe', Number.MAX_SAFE_INTEGER],
  ['min safe', Number.MIN_SAFE_INTEGER],
  ['outside max safe', Number.MAX_SAFE_INTEGER + 1],
  ['outside min safe', Number.MIN_SAFE_INTEGER - 1],
  ['large represented integer', 1e21],
  ['Infinity', Infinity],
  ['-Infinity', -Infinity],
  ['NaN', NaN]
];
for (const [name, expected] of Object.entries(reference)) {
  for (const [label, number] of values) {
    test(`${name}: primitive ${label}`, () => {
      assert.equal(require('..')[name](number), expected(number));
    });
    test(`${name}: boxed ${label}`, () => {
      assert.equal(require('..')[name](new Number(number)), name === 'isNaN' ? false : expected(number));
    });
    test(`${name}: cross-realm boxed ${label}`, () => {
      const boxed = vm.runInNewContext('new Number(value)', { value: number });
      assert.equal(require('..')[name](boxed), name === 'isNaN' ? false : expected(number));
    });
  }
}

const unsupported = [
  ['undefined', undefined],
  ['null', null],
  ['true', true],
  ['false', false],
  ['empty string', ''],
  ['numeric string', '1'],
  ['boxed string', new String('1')],
  ['bigint', 1n],
  ['boxed bigint', Object(1n)],
  ['symbol', Symbol('1')],
  ['boxed symbol', Object(Symbol('1'))],
  ['empty array', []],
  ['numeric array', [1]],
  ['object', {}],
  ['null prototype', Object.create(null)],
  ['date', new Date(0)],
  ['regexp', /1/],
  ['function', () => 1],
  ['fake box', Object.create(Number.prototype)],
  ['boxed boolean', new Boolean(true)]
];
for (const name of Object.keys(reference)) {
  for (const [label, value] of unsupported) {
    test(`${name}: rejects ${label}`, () => assert.equal(require('..')[name](value), false));
  }
  test(`${name}: does not call user coercion hooks or inspect toStringTag`, () => {
    const fail = () => {
      throw new Error('conversion hook must not run');
    };
    const impostor = Object.defineProperties(
      {},
      {
        valueOf: { get: fail },
        toString: { get: fail },
        [Symbol.toPrimitive]: { get: fail },
        [Symbol.toStringTag]: { get: fail }
      }
    );
    assert.equal(require('..')[name](impostor), false);
  });
  test(`${name}: rejects proxies without triggering traps`, () => {
    const fail = () => {
      throw new Error('proxy trap must not run');
    };
    const handler = { get: fail, getPrototypeOf: fail, has: fail };
    for (const target of [{}, new Number(1), () => 1]) {
      assert.equal(require('..')[name](new Proxy(target, handler)), false);
    }
    const { proxy, revoke } = Proxy.revocable(new Number(1), {});
    revoke();
    assert.equal(require('..')[name](proxy), false);
  });
  test(`${name}: uses a genuine box internal value, not overridden methods`, () => {
    const fail = () => {
      throw new Error('box override must not run');
    };
    class Box extends Number {
      valueOf() {
        return fail();
      }
      toString() {
        return fail();
      }
      [Symbol.toPrimitive]() {
        return fail();
      }
    }
    assert.equal(require('..')[name](new Box(-3)), name === 'isNaN' ? false : reference[name](-3));
    const box = Object.setPrototypeOf(new Number(-3), null);
    assert.equal(require('..')[name](box), name === 'isNaN' ? false : reference[name](-3));
  });
}

test('parity remains exclusive and exhaustive over generated signed integers', () => {
  const numbers = require('..');
  for (let value = -10000; value <= 10000; value++) {
    assert.notEqual(numbers.isEven(value), numbers.isOdd(value), String(value));
    assert.equal(numbers.isOdd(value), numbers.isOdd(-value), String(value));
    assert.equal(numbers.isEven(value), numbers.isEven(-value), String(value));
  }
});
