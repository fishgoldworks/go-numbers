'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const numbers = require('..');

const cases = [
  [0, 0, 0],
  [-0, -0, 0],
  [1, 1, 0],
  [-1, -1, 0],
  [1.25, 1, 0.25],
  [-1.25, -2, 0.25],
  [12.345, 12, 0.345],
  [-1.01, -2, 0.01],
  [123456.789, 123456, 0.789],
  [0.345, 0, 0.345],
  [-0.345, -1, 0.345],
  [1e-7, 0, 1e-7],
  [-1e-7, -1, 1e-7],
  [1.23e-7, 0, 1.23e-7],
  [1e-6, 0, 1e-6],
  [1.2e21, 1.2e21, 0],
  [-1.2e21, -1.2e21, 0],
  [Number.MIN_VALUE, 0, Number.MIN_VALUE],
  [-Number.MIN_VALUE, -1, Number.MIN_VALUE],
  [Number.MAX_VALUE, Number.MAX_VALUE, 0],
  [-Number.MAX_VALUE, -Number.MAX_VALUE, 0],
  [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0],
  [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 0],
  [2 ** 52 - 0.5, 2 ** 52 - 1, 0.5],
  [-(2 ** 52 - 0.5), -(2 ** 52), 0.5],
  [1 + Number.EPSILON, 1, 2e-16],
  [1 - Number.EPSILON / 2, 0, 0.9999999999999999],
  [1.0000000000000002, 1, 2e-16],
  [1.9999999999999998, 1, 0.9999999999999998],
  [1000000000000000.1, 1000000000000000, 0.1],
  [100000000000000.02, 100000000000000, 0.02]
];
for (const [number, integer, fraction] of cases) {
  const label = Object.is(number, -0) ? '-0' : String(number);
  test(`getInteger: floor contract for ${label}`, () => {
    assert.ok(Object.is(numbers.getInteger(number, 99), integer));
    assert.ok(Object.is(numbers.getInteger(new Number(number), 99), integer));
    assert.ok(Object.is(numbers.getInteger(vm.runInNewContext('new Number(number)', { number }), 99), integer));
  });
  test(`getFraction: decimal-magnitude contract for ${label}`, () => {
    assert.ok(Object.is(numbers.getFraction(number, 99), fraction));
    assert.ok(Object.is(numbers.getFraction(new Number(number), 99), fraction));
    assert.ok(Object.is(numbers.getFraction(vm.runInNewContext('new Number(number)', { number }), 99), fraction));
  });
}
for (const name of ['getInteger', 'getFraction']) {
  const part = numbers[name];
  test(`${name}: uses the existing extraction contract for text`, () => {
    const expected = name === 'getInteger' ? -13 : 0.345;
    assert.equal(part('value: -12.345 kg', 99), expected);
    assert.equal(part(new String('value: -12.345 kg'), 99), expected);
    assert.equal(part({ toString: () => 'value: -12.345 kg' }, 99), expected);
    assert.equal(part({ toString: () => -12.345 }, 99), expected);
    assert.equal(part('0x10'), 0);
  });
  for (const value of [
    undefined,
    null,
    false,
    true,
    12n,
    Symbol('12'),
    '',
    'none',
    {},
    Object.create(null),
    Infinity,
    -Infinity,
    NaN,
    'NaN',
    'Infinity',
    '-Infinity',
    '1e999',
    new Number(NaN),
    new Number(Infinity)
  ]) {
    test(`${name}: non-finite/missing inputs return exact fallback`, () => {
      const fallback = { missing: true };
      assert.equal(part(value, fallback), fallback);
      assert.equal(part(value), undefined);
      assert.ok(Object.is(part(value, -0), -0));
      assert.ok(Number.isNaN(part(value, NaN)));
    });
  }
  test(`${name}: does not transform a numeric fallback`, () => {
    assert.equal(part('missing', 9.75), 9.75);
    assert.equal(part(Infinity, 9.75), 9.75);
  });
  test(`${name}: calls custom conversion once and propagates its errors`, () => {
    let calls = 0;
    const input = {
      toString() {
        calls++;
        return '12.5';
      }
    };
    assert.equal(part(input), name === 'getInteger' ? 12 : 0.5);
    assert.equal(calls, 1);
    const error = new Error('conversion');
    assert.throws(
      () =>
        part(
          {
            toString() {
              throw error;
            }
          },
          99
        ),
      (value) => value === error
    );
  });
  test(`${name}: cannot recurse through self-returning conversion`, () => {
    assert.equal(
      part(
        {
          toString() {
            return this;
          }
        },
        99
      ),
      99
    );
  });
  test(`${name}: ignores genuine box coercion overrides`, () => {
    const value = new Number(-12.5);
    const fail = () => {
      throw new Error('box conversion must not run');
    };
    Object.defineProperties(value, { valueOf: { get: fail }, toString: { get: fail } });
    assert.equal(part(value), name === 'getInteger' ? -13 : 0.5);
  });
}

test('getFraction represents decimal digits, not binary remainder arithmetic', () => {
  assert.equal(numbers.getFraction(12.345), 0.345);
  assert.notEqual(numbers.getFraction(12.345), Math.abs(12.345 % 1));
  assert.equal(numbers.getFraction(1 + Number.EPSILON), 2e-16);
  assert.notEqual(numbers.getFraction(1 + Number.EPSILON), Number.EPSILON);
});

test('part helpers do not depend on mutable public function properties', () => {
  const original = numbers.parse;
  try {
    numbers.parse = () => {
      throw new Error('public replacement must not affect internals');
    };
    assert.equal(numbers.getInteger('-12.5'), -13);
    assert.equal(numbers.getFraction('-12.5'), 0.5);
  } finally {
    numbers.parse = original;
  }
});

// Independent decimal oracle: represent shortest decimal digits as an exact
// BigInt numerator/denominator, then extract the decimal fractional digits.
function decimalFractionOracle(value) {
  const text = String(Math.abs(value));
  const [mantissa, exponentText] = text.split('e');
  const point = mantissa.indexOf('.');
  const places = point < 0 ? 0 : mantissa.length - point - 1;
  const scale = places - Number(exponentText || 0);
  if (scale <= 0) return 0;
  const numerator = BigInt(mantissa.replace('.', ''));
  const denominator = 10n ** BigInt(scale);
  const fraction = numerator % denominator;
  return fraction === 0n ? 0 : Number(`0.${fraction.toString().padStart(scale, '0')}`);
}

test('generated IEEE-754 bit patterns satisfy finite floor and fraction contracts', () => {
  const bytes = new ArrayBuffer(8);
  const view = new DataView(bytes);
  let state = 0x173af4c;
  let checked = 0;
  for (let i = 0; i < 20000; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    view.setUint32(0, state);
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    view.setUint32(4, state);
    const value = view.getFloat64(0);
    if (!Number.isFinite(value)) continue;
    checked++;
    const fraction = numbers.getFraction(value);
    assert.ok(fraction >= 0 && fraction < 1, String(value));
    assert.ok(!Object.is(fraction, -0), String(value));
    assert.equal(fraction, decimalFractionOracle(value), String(value));
    assert.ok(Object.is(numbers.getInteger(value), Math.floor(value)), String(value));
    assert.equal(fraction, numbers.getFraction(-value), String(value));
  }
  assert.ok(checked > 19000);
});
