'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const numbers = require('..');

function randomDoubles(seed) {
  const view = new DataView(new ArrayBuffer(8));
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    view.setUint32(0, seed);
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    view.setUint32(4, seed);
    return view.getFloat64(0);
  };
}

// Independent directional oracle uses exact integer division, not production's
// decimal-string truncation, carry logic or mode branches.
function directedReference(value, precision, direction) {
  if (!Number.isFinite(value) || value === 0) return value;
  const [mantissa, exponent] = Math.abs(value).toExponential().split('e');
  const decimals = mantissa.includes('.') ? mantissa.length - mantissa.indexOf('.') - 1 : 0;
  const coefficient = BigInt(mantissa.replace('.', ''));
  const shift = Number(exponent) - decimals + precision;
  if (shift >= 0) return value;
  const divisor = 10n ** BigInt(-shift);
  let quotient = coefficient / divisor;
  const residual = coefficient % divisor;
  if (residual !== 0n && (direction === 'ceil' ? value > 0 : value < 0)) quotient++;
  return Number(`${value < 0 ? '-' : ''}${quotient}e${-precision}`);
}

test('ceil and floor match an independent exact-decimal reference over generated IEEE-754 values', () => {
  const next = randomDoubles(0xb9723105);
  for (let i = 0; i < 12000; i++) {
    const value = next(),
      precision = (i % 633) - 308;
    for (const direction of ['ceil', 'floor']) {
      const expected = directedReference(value, precision, direction);
      const actual = numbers[direction](value, precision);
      assert.ok(Object.is(actual, expected), `${direction}(${value}, ${precision}): ${actual} vs ${expected}`);
      assert.ok(Object.is(numbers[direction](actual, precision), actual), 'idempotence');
      if (Number.isFinite(value)) {
        assert.ok(direction === 'ceil' ? actual >= value : actual <= value, 'direction');
        assert.ok(
          Object.is(numbers[direction](value), Math[direction](value)),
          'zero precision matches native direction'
        );
      }
    }
  }
});

test('roundTo on exact decimal powers of ten agrees with the independently tested round contract', () => {
  const next = randomDoubles(0x9830c575);
  for (let i = 0; i < 6000; i++) {
    const value = next(),
      precision = (i % 632) - 308;
    const step = Number(`1e${-precision}`);
    assert.ok(Object.is(numbers.roundTo(value, step), numbers.round(value, precision)), `${value} at step ${step}`);
  }
});

test('modulo obeys safe integer periodicity and exact integer results', () => {
  for (let value = -200; value <= 200; value++) {
    for (let divisor = 1; divisor <= 97; divisor++) {
      const expected = value - Math.floor(value / divisor) * divisor;
      const actual = numbers.modulo(value, divisor);
      assert.ok(Object.is(actual, expected));
      assert.equal(numbers.modulo(value + 13 * divisor, divisor), actual);
      assert.equal(numbers.modulo(value - 13 * divisor, divisor), actual);
    }
  }
});

test('modulo preserves its half-open interval over random finite IEEE-754 operands', () => {
  const next = randomDoubles(0x735ac021);
  for (let i = 0; i < 20000; i++) {
    const value = next(),
      divisor = Math.abs(next());
    if (!Number.isFinite(value) || !Number.isFinite(divisor) || divisor === 0) continue;
    const actual = numbers.modulo(value, divisor);
    assert.ok(actual >= 0 && actual < divisor, `${value}, ${divisor}: ${actual}`);
    assert.equal(Object.is(actual, -0), false);
    if (value >= 0) assert.equal(actual, value % divisor);
  }
});
