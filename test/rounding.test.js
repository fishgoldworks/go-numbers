'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const n = require('..');
function round(...args) {
  assert.equal(typeof n.round, 'function', 'round must be exported');
  return n.round(...args);
}

const examples = [
  [12.345, 2, 12.35],
  [1.005, 2, 1.01],
  [-1.005, 2, -1],
  [-1.0051, 2, -1.01],
  [2.675, 2, 2.68],
  [-2.675, 2, -2.67],
  [1.0049, 2, 1],
  [1.00501, 2, 1.01],
  [1.5, 0, 2],
  [-1.5, 0, -1],
  [0.5, 0, 1],
  [-0.5, 0, -0],
  [-0.5001, 0, -1],
  [0.49999999999999994, 0, 0],
  [4500000000000000.5, 0, 4500000000000001],
  [1260, -2, 1300],
  [1250, -2, 1300],
  [-1250, -2, -1200],
  [-1251, -2, -1300],
  [999.5, 0, 1000],
  [-999.5, 0, -999],
  [-999.5001, 0, -1000],
  [9.999, 2, 10],
  [99.999, 2, 100],
  [-99.999, 2, -100],
  [0.000099995, 8, 0.0001],
  [0.01234, 4, 0.0123],
  [1.25e-7, 8, 1.3e-7],
  [-1.25e-7, 8, -1.2e-7],
  [12.3, 10, 12.3],
  [Number.MAX_VALUE, 0, Number.MAX_VALUE],
  [Number.MAX_VALUE, 324, Number.MAX_VALUE],
  [1e21, -2, 1e21],
  [1.5e21, -21, 2e21],
  [1e-200, -200, 0],
  [-1e-200, -200, -0],
  [Number.MIN_VALUE, 324, Number.MIN_VALUE],
  [Number.MIN_VALUE, 323, 1e-323],
  [-Number.MIN_VALUE, 323, -0],
  [Number.MIN_VALUE, 322, 0],
  [2.5e-323, 323, 3e-323],
  [-2.5e-323, 323, -2e-323],
  [1.5e308, -308, Infinity],
  [-1.5e308, -308, -1e308],
  [Number.MAX_VALUE, -308, Infinity],
  [-Number.MAX_VALUE, -308, -Infinity],
  [0, 0, 0],
  [-0, 0, -0],
  [-0, 324, -0],
  [NaN, 2, NaN],
  [Infinity, 2, Infinity],
  [-Infinity, -308, -Infinity]
];
for (const [value, precision, expected] of examples) {
  test(`round(${String(value)}, ${precision}) follows decimal digits and positive-infinity ties`, () => {
    assert.ok(
      Object.is(round(value, precision), expected),
      `expected ${expected}, received ${round(value, precision)}`
    );
  });
}

test('round defaults to zero decimal places and preserves signed zero on underflow', () => {
  assert.equal(round(1.5), 2);
  assert.equal(round(1.5, undefined), 2);
  assert.ok(Object.is(round(-0.1), -0));
  assert.equal(round(5, -0), 5);
});
test('round accepts genuine boxes without invoking their coercion hooks', () => {
  for (const value of [new Number(1.005), vm.runInNewContext('new Number(1.005)')]) {
    Object.defineProperty(value, Symbol.toPrimitive, {
      get() {
        throw new Error('do not coerce');
      }
    });
    assert.equal(round(value, 2), 1.01);
  }
});
test('round rejects non-number values without invoking properties or proxy traps', () => {
  const hostile = new Proxy(
    {},
    {
      get() {
        throw new Error('get trap');
      }
    }
  );
  const revoked = Proxy.revocable(new Number(3), {});
  revoked.revoke();
  for (const value of ['1.5', null, undefined, false, 1n, Symbol(), {}, [], hostile, revoked.proxy]) {
    assert.throws(() => round(value), TypeError);
  }
});
test('round validates precision even for special numeric inputs', () => {
  for (const precision of [null, '2', false, 2n, Symbol(), new Number(2), {}]) {
    assert.throws(() => round(1, precision), TypeError);
  }
  for (const precision of [NaN, Infinity, -Infinity, 0.5, -1.5, -309, 325, Number.MAX_VALUE]) {
    assert.throws(() => round(1, precision), RangeError);
    assert.throws(() => round(Infinity, precision), RangeError);
  }
});

// Independent algorithm: use exact integer coefficient / power-of-ten division.
// Production rounding must not call this reference or use its output as fixtures.
function exactDecimalReference(value, precision) {
  if (!Number.isFinite(value) || value === 0) return value;
  const negative = value < 0;
  const [mantissa, exponentText = '0'] = Math.abs(value).toExponential().split('e');
  const dot = mantissa.indexOf('.');
  const fractionalLength = dot < 0 ? 0 : mantissa.length - dot - 1;
  const coefficient = BigInt(mantissa.replace('.', ''));
  const shift = Number(exponentText) - fractionalLength + precision;
  if (shift >= 0) return value;
  const divisor = 10n ** BigInt(-shift);
  let quotient = coefficient / divisor;
  const remainder = coefficient % divisor;
  if (remainder * 2n > divisor || (remainder * 2n === divisor && !negative)) quotient++;
  return Number(`${negative ? '-' : ''}${quotient}e${-precision}`);
}

test('round matches an independent BigInt decimal oracle on generated IEEE-754 values', () => {
  const bytes = new ArrayBuffer(8),
    view = new DataView(bytes);
  let seed = 0x8f236bd1;
  for (let i = 0; i < 20000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    view.setUint32(0, seed);
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    view.setUint32(4, seed);
    const value = view.getFloat64(0),
      precision = (i % 633) - 308;
    const expected = exactDecimalReference(value, precision);
    const actual = round(value, precision);
    assert.ok(Object.is(actual, expected), `${value}, ${precision}: ${actual} !== ${expected}`);
    assert.ok(Object.is(round(actual, precision), actual), 'idempotence');
  }
});
test('round matches the oracle on densely sampled decimal ties and carry boundaries', () => {
  for (let integer = -250; integer <= 250; integer++) {
    for (const suffix of ['0049', '005', '0051', '9949', '995', '9951', '9999']) {
      const value = Number(`${integer}.${suffix}`);
      for (const precision of [-1, 0, 1, 2, 3, 4]) {
        assert.ok(
          Object.is(round(value, precision), exactDecimalReference(value, precision)),
          `${value}, ${precision}`
        );
      }
    }
  }
});
