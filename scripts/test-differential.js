'use strict';

// Compare public results against a separately extracted pre-optimisation package.
// These are compatibility checks, not a substitute for the independent oracles.
const assert = require('node:assert/strict');
const path = require('node:path');
const { doubles } = require('../test/helpers/scenario-oracles.js');
const index = process.argv.indexOf('--baseline');
if (index < 0 || !process.argv[index + 1])
  throw new Error('Usage: node scripts/test-differential.js --baseline <original-directory>');
const before = require(path.resolve(process.argv[index + 1]));
const after = require('..');
let comparisons = 0;
function check(name, args) {
  const original = before[name](...args),
    candidate = after[name](...args);
  assert.ok(Object.is(original, candidate), `${name}(${args.map(String).join(', ')}): ${candidate} !== ${original}`);
  comparisons++;
}
const values = [...doubles(0xe47d391, 25000)];
for (let i = 0; i < values.length; i++) {
  const value = values[i],
    other = values[(i + 19) % values.length];
  const candidateStep = Math.abs(other);
  const step = Number.isFinite(candidateStep) && candidateStep > 0 ? candidateStep : 0.25;
  for (const name of ['round', 'ceil', 'floor']) {
    check(name, [value, (i % 633) - 308]);
    check(name, [value, 0]);
  }
  for (const grid of [step, 0.1, 0.25]) check('roundTo', [value, grid]);
  if (Number.isFinite(value)) check('modulo', [value, step]);
  check('isInRange', [value, -100, 100]);
  check('isInRange', [value, -100, 100, { includeMax: Boolean(i & 1), includeMin: Boolean(i & 2) }]);
  check('isClose', [value, other]);
  check('isClose', [value, other, { absoluteTolerance: 0.5, relativeTolerance: 0.01 }]);
}
// Deliberately visit decimal coefficients on both sides of the safe fast path.
for (let i = -1000; i <= 1000; i++) {
  for (const scale of [1, 1e6, 1e12]) {
    const value = i * scale + 0.125;
    for (const step of [0.05, 0.25, 3, 7, 9007199254740990]) check('roundTo', [value, step]);
  }
}
assert.deepEqual(Object.keys(before), Object.keys(after), 'Public export surface is unchanged');
console.log(
  `PASS: ${comparisons} bit-sensitive (Object.is) public-result comparisons against the baseline; export surface unchanged.`
);
