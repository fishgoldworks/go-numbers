'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const n = require('..');
const {
  nextUp,
  nextDown,
  fromBits,
  same,
  doubles,
  roundReference,
  stepReference,
  fractionReference,
  moduloReference,
  binaryUnits,
  unitsToNumber
} = require('./helpers/scenario-oracles.js');

// Audit the independent references against hand-verifiable values first. These
// checks catch errors in the tests' signed division and representable-neighbor logic.
test('numeric reference helpers preserve signed ties and known binary64 neighbors', () => {
  same(nextUp(0), Number.MIN_VALUE, 'nextUp zero');
  same(nextDown(0), -Number.MIN_VALUE, 'nextDown zero');
  same(nextUp(-Number.MIN_VALUE), -0, 'nextUp negative subnormal');
  same(nextDown(1), 0.9999999999999999, 'predecessor of one');
  same(nextUp(1), 1 + Number.EPSILON, 'successor of one');
  same(nextDown(Infinity), Number.MAX_VALUE, 'largest finite');
  assert.equal(binaryUnits(Number.MIN_VALUE), 1n);
  assert.equal(binaryUnits(2 ** -1022), 1n << 52n);
  same(roundReference(-1.005, 2, 'round'), -1, 'negative decimal tie');
  same(roundReference(-1.231, 2, 'floor'), -1.24, 'negative rational floor');
  same(stepReference(0.15, 0.1), 0.2, 'step tie');
  same(stepReference(-0.15, 0.1), -0.1, 'negative step tie');
  same(moduloReference(-Number.MIN_VALUE, 1), nextDown(1), 'excluded upper boundary');
});
const predicates = {
  isFinite: Number.isFinite,
  isInfinite: (value) => Math.abs(value) === Infinity,
  isInteger: Number.isInteger,
  isSafeInteger: Number.isSafeInteger,
  isEven: (value) => Number.isInteger(value) && value / 2 === Math.trunc(value / 2),
  isOdd: (value) => Number.isInteger(value) && value / 2 !== Math.trunc(value / 2),
  isPositive: (value) => value > 0,
  isNegative: (value) => value < 0,
  isZero: (value) => value === 0,
  isZeroOrPositive: (value) => value >= 0,
  isZeroOrNegative: (value) => value <= 0
};
// Every representable power of two and its adjacent numbers, including the
// subnormal-to-normal transition and loss of fractional/odd/safe-integer values.
for (let start = -1074; start <= 1023; start += 32) {
  const end = Math.min(start + 31, 1023);
  test(`numeric classes: neighbors of every binary power with exponents ${start}..${end}`, () => {
    for (let exponent = start; exponent <= end; exponent++) {
      const power = 2 ** exponent;
      for (const positive of [nextDown(power), power, nextUp(power)]) {
        if (!Number.isFinite(positive)) continue;
        same(unitsToNumber(binaryUnits(positive)), positive, `binary reference round trip ${exponent}`);
        for (const value of [positive, -positive]) {
          for (const [name, reference] of Object.entries(predicates)) {
            const expected = reference(value);
            assert.equal(n[name](value), expected, `${name}(${value}), exponent ${exponent}`);
            assert.equal(n[name](new Number(value)), expected, `boxed ${name}(${value})`);
          }
          same(n.getInteger(value), Math.floor(value), `floor part ${value}`);
          same(n.getFraction(value), fractionReference(value), `decimal fraction ${value}`);
          same(n.parseStrict(String(value)), value === 0 ? 0 : value, `numeric text round trip ${value}`);
        }
      }
    }
  });
}
for (const raw of [
  0x7ff0000000000001n,
  0x7ff8000000000000n,
  0x7fffffffffffffffn,
  0xfff0000000000001n,
  0xfff8000000000000n,
  0xffffffffffffffffn
]) {
  test(`NaN classification: payload 0x${raw.toString(16)} is never a valid numeric match`, () => {
    const value = fromBits(raw);
    assert.ok(Number.isNaN(value));
    assert.equal(n.isNaN(value), true);
    assert.equal(n.isNaN(new Number(value)), false);
    for (const predicate of Object.keys(predicates)) assert.equal(n[predicate](value), false, predicate);
    assert.equal(n.parseFinite(value, null), null);
    assert.equal(n.parseSafeInteger(value, null), null);
    assert.equal(n.getInteger(value, null), null);
    assert.equal(n.getFraction(value, null), null);
    assert.equal(n.isClose(value, value), false);
    assert.equal(n.isInRange(value, -1, 1), false);
  });
}
for (let precision = -308; precision <= 324; precision++) {
  test(`decimal rounding: precision ${precision} with signs, ties, carries and adjacent inputs`, () => {
    const target = Number(`9.995e${-precision}`);
    const edge = Number(`1.5e${-precision}`);
    const samples = [
      0,
      -0,
      Number.MIN_VALUE,
      -Number.MIN_VALUE,
      Number.MAX_VALUE,
      -Number.MAX_VALUE,
      NaN,
      Infinity,
      -Infinity,
      1.005,
      -1.005,
      0.29,
      -0.29,
      1.1,
      -1.1,
      target,
      -target,
      nextDown(target),
      nextUp(target),
      edge,
      -edge,
      nextDown(edge),
      nextUp(edge),
      -nextDown(edge),
      -nextUp(edge)
    ];
    for (const value of samples) {
      const results = {};
      for (const mode of ['round', 'ceil', 'floor']) {
        const actual = n[mode](value, precision);
        same(actual, roundReference(value, precision, mode), `${mode}(${value}, ${precision})`);
        same(n[mode](actual, precision), actual, `${mode} idempotence ${value}, ${precision}`);
        results[mode] = actual;
      }
      if (Number.isFinite(value)) {
        assert.ok(results.floor <= value && results.ceil >= value, 'direction preserved');
        assert.ok(
          results.floor <= results.round && results.round <= results.ceil,
          'round stays between directed bounds'
        );
      }
    }
  });
}
const steps = [
  Number.MIN_VALUE,
  nextUp(Number.MIN_VALUE),
  2 ** -1022,
  1e-308,
  1e-100,
  0.01,
  0.05,
  0.1,
  0.2,
  0.25,
  0.3,
  0.5,
  1,
  3,
  7,
  10,
  360,
  Number.MAX_SAFE_INTEGER,
  1e100,
  1e308,
  Number.MAX_VALUE
];
for (const step of steps) {
  test(`roundTo: exact-rational reference with step ${step} across boundary and generated values`, () => {
    const samples = [
      0,
      -0,
      NaN,
      Infinity,
      -Infinity,
      Number.MIN_VALUE,
      -Number.MIN_VALUE,
      Number.MAX_VALUE,
      -Number.MAX_VALUE,
      step,
      -step,
      nextDown(step),
      nextUp(step),
      step / 2,
      -step / 2,
      nextDown(step / 2),
      nextUp(step / 2),
      -nextDown(step / 2),
      -nextUp(step / 2),
      ...doubles(0x520b824a, 128)
    ];
    for (const value of samples) {
      const actual = n.roundTo(value, step);
      same(actual, stepReference(value, step), `roundTo(${value}, ${step})`);
      same(n.roundTo(actual, step), actual, `roundTo idempotence ${value}, ${step}`);
    }
  });
}
for (const modulus of steps) {
  test(`modulo: exact binary-unit reference with modulus ${modulus}`, () => {
    const samples = [
      0,
      -0,
      Number.MIN_VALUE,
      -Number.MIN_VALUE,
      Number.MAX_VALUE,
      -Number.MAX_VALUE,
      modulus,
      -modulus,
      nextDown(modulus),
      nextUp(modulus),
      -nextDown(modulus),
      -nextUp(modulus),
      ...doubles(0x5cab8341, 192)
    ];
    for (const value of samples) {
      if (!Number.isFinite(value)) continue;
      const actual = n.modulo(value, modulus);
      same(actual, moduloReference(value, modulus), `modulo(${value}, ${modulus})`);
      assert.ok(actual >= 0 && actual < modulus, 'half-open interval');
      same(n.modulo(actual, modulus), actual, 'modulo idempotence');
      assert.equal(Object.is(actual, -0), false, 'canonical positive zero');
    }
  });
}
test('modulo: generated negative binary64 operands match exact arithmetic, not merely range checks', () => {
  const values = [...doubles(0xd2f408b3, 12000)];
  let checked = 0;
  for (let i = 0; i < values.length; i += 2) {
    const value = -Math.abs(values[i]),
      modulus = Math.abs(values[i + 1]);
    if (!Number.isFinite(value) || !Number.isFinite(modulus) || modulus === 0) continue;
    same(n.modulo(value, modulus), moduloReference(value, modulus), `random negative modulo #${i}`);
    checked++;
  }
  assert.ok(checked > 5900, 'generation must exercise nearly every sampled pair');
});
