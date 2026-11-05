'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
test('ordinary parsers and exact step rounding work without the optional BigInt host capability', () => {
  const native = require('..');
  const values = [
    Number.MIN_VALUE,
    1e-300,
    1.2345678901234567e-100,
    0.15,
    1,
    1.375,
    9.999999999999998,
    9007199254740991,
    1e100,
    Number.MAX_VALUE
  ];
  const steps = [Number.MIN_VALUE, 2e-323, 2.5e-300, 0.03, 0.25, 3, 3e100, 2.5e307, Number.MAX_VALUE];
  const cases = [];
  for (const value of values)
    for (const step of steps)
      for (const sign of [1, -1]) cases.push([sign * value, step, native.roundTo(sign * value, step)]);
  const captured = global.BigInt;
  const moduleId = require.resolve('../src/internal/toParseInput');
  const previous = require.cache[moduleId];
  try {
    global.BigInt = undefined;
    delete require.cache[moduleId];
    const parseInput = require('../src/internal/toParseInput');
    assert.equal(parseInput('12.5'), '12.5');
    assert.equal(parseInput({ toString: () => '12px' }), '12px');
    assert.equal(parseInput(new String('1')), '1');
    for (const [value, step, expected] of cases)
      assert.ok(Object.is(native.roundTo(value, step), expected), String([value, step]));
    // Exercise exact decimal carry and borrow around a half tie beyond 2^52.
    assert.equal(native.roundTo(4503599627370497, 2), 4503599627370498);
    assert.equal(native.roundTo(-4503599627370497, 2), -4503599627370496);
    assert.equal(native.roundTo(9999999999999998, 3), 10000000000000000);
  } finally {
    global.BigInt = captured;
    require.cache[moduleId] = previous;
  }
  assert.equal(native.parse(Object(BigInt(12)), null), null);
});

test('roundTo cached BigInt grid remains valid when BigInt availability changes', () => {
  const numbers = require('..');
  const value = 4503599627370495;
  const step = 9007199254740990;
  const expected = 9007199254740990;

  // Prime the one-entry grid cache and its BigInt coefficient on the normal host path.
  assert.equal(numbers.roundTo(value, step), expected);

  const captured = global.BigInt;
  try {
    global.BigInt = undefined;
    assert.equal(numbers.roundTo(value, step), expected);
  } finally {
    global.BigInt = captured;
  }

  assert.equal(numbers.roundTo(value, step), expected);
});
