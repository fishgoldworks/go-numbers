'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const n = require('..');
const {
  same,
  doubles,
  nextUp,
  nextDown,
  roundReference,
  stepReference,
  moduloReference
} = require('./helpers/scenario-oracles.js');

// Performance changes must preserve results, not just stay close. These tests
// deliberately exercise the boundaries between proposed cheap and exact paths.
for (const mode of ['round', 'ceil', 'floor']) {
  test(`optimisation: ${mode} at zero precision agrees bit-for-bit with the decimal oracle`, () => {
    for (const value of [
      ...doubles(0x8f9912, 4000),
      -0.5,
      nextUp(-0.5),
      nextDown(-0.5),
      0.5,
      nextUp(0.5),
      nextDown(0.5),
      -0,
      0,
      Number.MIN_VALUE,
      -Number.MIN_VALUE,
      4503599627370495.5,
      -4503599627370495.5
    ]) {
      same(n[mode](value, 0), roundReference(value, 0, mode), `${mode}(${value}, 0)`);
    }
  });
  test(`optimisation: ${mode} preserves integral values for nonnegative precision`, () => {
    for (const value of [0, -0, 1, -1, 7, Number.MAX_SAFE_INTEGER, 2 ** 53, 1e21, 1e100, Number.MAX_VALUE]) {
      for (const sign of [1, -1])
        for (const precision of [0, 1, 2, 15, 308, 324]) {
          same(n[mode](sign * value, precision), sign * value, `${mode} integer`);
        }
    }
  });
  test(`optimisation: ${mode} still validates precision before early returns`, () => {
    for (const value of [0, -0, 1, 1e100, Infinity, NaN]) {
      assert.throws(() => n[mode](value, '0'), TypeError);
      assert.throws(() => n[mode](value, 325), RangeError);
    }
  });
}

const steps = [0.1, 0.25, 1, 2.5, 10, 97, 1e-15, 1e15, Number.MIN_VALUE, 1e-300, 1e300, Number.MAX_VALUE];
for (const step of steps) {
  test(`optimisation: roundTo repeated and changing grids match the exact oracle (step ${step})`, () => {
    const values = [
      0.15,
      -0.15,
      0.3,
      -0.3,
      1.37,
      -1.37,
      1.005,
      -1.005,
      127,
      -127,
      1234567890123.4,
      4503599627370495,
      4503599627370496,
      9007199254740991,
      9007199254740992,
      Number.MIN_VALUE,
      Number.MAX_VALUE,
      ...doubles(0x472ad, 128)
    ];
    for (const value of values) {
      if (!Number.isFinite(value)) continue;
      for (let repeat = 0; repeat < 2; repeat++)
        same(n.roundTo(value, step), stepReference(value, step), `${value} / ${step}`);
      same(n.roundTo(value, 0.3), stepReference(value, 0.3), 'switch grid');
      same(n.roundTo(value, step), stepReference(value, step), 'return to grid');
    }
  });
}
test('optimisation: roundTo near safe integer scaling and half boundaries', () => {
  for (const limit of [2 ** 26, 2 ** 51, 2 ** 52, Number.MAX_SAFE_INTEGER, 2 ** 53]) {
    for (const value of [nextDown(limit), limit, nextUp(limit)]) {
      for (const sign of [1, -1])
        for (const step of [0.01, 0.1, 0.3, 1, 2, 3, 7, 11, 9999999, 1e15]) {
          same(n.roundTo(sign * value, step), stepReference(sign * value, step), `limit ${sign * value}, step ${step}`);
        }
    }
  }
  for (let numerator = -31; numerator <= 31; numerator++)
    for (let denominator = 1; denominator <= 16; denominator++) {
      const value = numerator / 8,
        step = denominator / 16;
      for (const adjacent of [nextDown(value), value, nextUp(value)]) {
        same(n.roundTo(adjacent, step), stepReference(adjacent, step), `step boundary ${adjacent}, ${step}`);
      }
    }
});
test('optimisation: a reused step never skips validation or trusts object conversion hooks', () => {
  const box = new Number(0.1);
  Object.defineProperty(box, 'valueOf', {
    get() {
      throw new Error('must not read');
    }
  });
  for (let i = 0; i < 5; i++) {
    same(n.roundTo(0.15, box), 0.2, 'genuine box');
    same(n.roundTo(0.15, new Number(0.25)), 0.25, 'different boxed step');
    assert.throws(() => n.roundTo(0.15, new Proxy(box, {})), TypeError);
    assert.throws(() => n.roundTo(NaN, 0), RangeError);
    assert.throws(() => n.roundTo('value', 0.1), TypeError);
  }
});
for (const modulus of [1, nextUp(1), 2, 3, 97, 1e100, Number.MAX_VALUE]) {
  test(`optimisation: modulo scratch storage does not retain previous results (${modulus})`, () => {
    for (let i = 0; i < 20; i++) {
      for (const divisor of [modulus, nextUp(modulus / 2), modulus]) {
        for (const value of [-Number.MIN_VALUE, -1e-300, 1, -0, -3]) {
          same(n.modulo(value, divisor), moduloReference(value, divisor), `${value} % ${divisor}`);
        }
      }
    }
  });
}
for (const [name, keys, args, expected] of [
  ['isInRange', ['includeMax', 'includeMin'], [0, 0, 1], false],
  ['isClose', ['relativeTolerance', 'absoluteTolerance'], [0, 0.25], true]
]) {
  test(`optimisation: ${name} checks ownership and reads mutable options in proxy key order`, () => {
    let state = false;
    const events = [];
    const target = Object.fromEntries(keys.map((key) => [key, undefined]));
    const options = new Proxy(target, {
      ownKeys() {
        events.push('keys');
        return keys;
      },
      get(object, key) {
        events.push(key);
        return name === 'isInRange' ? state : key === 'absoluteTolerance' ? 0.5 : 0;
      },
      getPrototypeOf() {
        throw new Error('no prototype introspection');
      },
      getOwnPropertyDescriptor(object, key) {
        events.push('own:' + key);
        return Reflect.getOwnPropertyDescriptor(object, key);
      }
    });
    assert.equal(n[name](...args, options), expected);
    assert.deepEqual(events, ['keys', ...keys.flatMap((key) => ['own:' + key, key])]);
    if (name === 'isInRange') {
      state = true;
      events.length = 0;
      assert.equal(n[name](...args, options), true);
      assert.deepEqual(events, ['keys', ...keys.flatMap((key) => ['own:' + key, key])]);
    }
  });
}

test('optimisation: roundTo keeps negative half ties on both exact arithmetic paths', () => {
  same(n.roundTo(-1.375, 0.25), -1.25, 'small exact coefficient');
  same(n.roundTo(-4503599627370495, 9007199254740990), -0, 'large exact coefficient');
  same(n.roundTo(4503599627370495, 9007199254740990), 9007199254740990, 'large positive half');
  same(n.roundTo(0.32, 0.05), 0.3, 'final decimal reconstruction, not binary scaling');
});
