'use strict';

// Test-only references: never import a production internal or use it to derive
// expected values. Decimal operations use signed rational arithmetic; modulo
// uses exact integer counts of the smallest representable binary64 unit.
const assert = require('node:assert/strict');

function bits(value) {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);
  return view.getBigUint64(0);
}
function fromBits(value) {
  const view = new DataView(new ArrayBuffer(8));
  view.setBigUint64(0, value);
  return view.getFloat64(0);
}
function nextUp(value) {
  if (Number.isNaN(value) || value === Infinity) return value;
  if (value === 0) return Number.MIN_VALUE;
  return fromBits(bits(value) + (value > 0 ? 1n : -1n));
}
function nextDown(value) {
  return -nextUp(-value);
}
function label(value) {
  return `${Object.is(value, -0) ? '-0' : value} [0x${bits(value).toString(16).padStart(16, '0')}]`;
}
function same(actual, expected, context) {
  assert.ok(Object.is(actual, expected), `${context}: expected ${label(expected)}, got ${label(actual)}`);
}
function* doubles(seed, count) {
  for (let i = 0; i < count; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const high = BigInt(seed);
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    yield fromBits((high << 32n) | BigInt(seed));
  }
}
function decimal(value) {
  const [mantissa, exp] = value.toExponential().split('e');
  const dot = mantissa.indexOf('.');
  const fractionDigits = dot < 0 ? 0 : mantissa.length - dot - 1;
  const coefficient = BigInt(mantissa.replace('.', ''));
  const power = Number(exp) - fractionDigits;
  return power >= 0
    ? { numerator: coefficient * 10n ** BigInt(power), denominator: 1n }
    : { numerator: coefficient, denominator: 10n ** BigInt(-power) };
}
function floorDivision(a, b) {
  const quotient = a / b;
  return a < 0n && a % b !== 0n ? quotient - 1n : quotient;
}
function integerRound(a, b, mode) {
  if (mode === 'floor') return floorDivision(a, b);
  if (mode === 'ceil') return -floorDivision(-a, b);
  if (mode === 'round') return floorDivision(2n * a + b, 2n * b);
  throw new Error(`Invalid test oracle mode ${mode}`);
}
function roundReference(value, precision, mode) {
  if (!Number.isFinite(value) || value === 0) return value;
  let { numerator, denominator } = decimal(value);
  if (precision >= 0) numerator *= 10n ** BigInt(precision);
  else denominator *= 10n ** BigInt(-precision);
  const quotient = integerRound(numerator, denominator, mode);
  if (quotient === 0n && value < 0) return -0;
  return Number(`${quotient}e${-precision}`);
}
function stepReference(value, step) {
  if (!Number.isFinite(value) || value === 0) return value;
  const x = decimal(value),
    grid = decimal(step);
  const quotient = integerRound(x.numerator * grid.denominator, x.denominator * grid.numerator, 'round');
  if (quotient === 0n && value < 0) return -0;
  const coefficient = quotient * grid.numerator;
  // Every denominator here is exactly a power of ten; no binary division.
  return Number(`${coefficient}e-${grid.denominator.toString().length - 1}`);
}
function fractionReference(value) {
  const { numerator, denominator } = decimal(Math.abs(value));
  return Number(`${numerator % denominator}e-${denominator.toString().length - 1}`);
}
function binaryUnits(value) {
  const raw = bits(value);
  const exponent = Number((raw >> 52n) & 0x7ffn);
  assert.notEqual(exponent, 0x7ff, 'binary oracle requires a finite input');
  const significand = raw & ((1n << 52n) - 1n);
  const magnitude = exponent === 0 ? significand : ((1n << 52n) | significand) << BigInt(exponent - 1);
  return raw >> 63n ? -magnitude : magnitude;
}
function unitsToNumber(units) {
  assert.ok(units >= 0n);
  if (units === 0n) return 0;
  const shift = Math.max(0, units.toString(2).length - 53);
  let significand = units >> BigInt(shift);
  if (shift > 0) {
    const remainder = units - (significand << BigInt(shift));
    const half = 1n << BigInt(shift - 1);
    if (remainder > half || (remainder === half && significand % 2n === 1n)) significand++;
  }
  return Number(significand) * 2 ** (shift - 1074);
}
function moduloReference(value, modulus) {
  const a = binaryUnits(value),
    b = binaryUnits(modulus);
  const exact = ((a % b) + b) % b;
  const rounded = unitsToNumber(exact);
  return rounded >= modulus ? nextDown(modulus) : rounded;
}

module.exports = {
  bits,
  fromBits,
  nextUp,
  nextDown,
  label,
  same,
  doubles,
  roundReference,
  stepReference,
  fractionReference,
  moduloReference,
  binaryUnits,
  unitsToNumber
};
