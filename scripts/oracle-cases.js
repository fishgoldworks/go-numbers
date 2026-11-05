'use strict';

// Emit actual runtime results and shortest-decimal operands for the independently
// implemented Python oracle. No expected result is computed in this generator.
const numbers = require('..');
const { createHash } = require('node:crypto');
const args = process.argv.slice(2);
if (args.length !== 0 && (args.length !== 2 || args[0] !== '--family' || !['lcg', 'sha256'].includes(args[1]))) {
  throw new Error('Usage: node scripts/oracle-cases.js [--family lcg|sha256]');
}
const family = args[1] || 'lcg';
const view = new DataView(new ArrayBuffer(8));
let seed = 0x83f17d41;
let counter = 0;
function next() {
  if (family === 'sha256') {
    // Preserve the previously reviewed corpus exactly. The salt is an input
    // identifier, not the current package version; do not bump it on releases.
    return createHash('sha256')
      .update('go-numbers-independent-review-0.3.3:' + counter++)
      .digest()
      .readDoubleBE(0);
  }
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  view.setUint32(0, seed);
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  view.setUint32(4, seed);
  return view.getFloat64(0);
}
function text(value) {
  return Object.is(value, -0) ? '-0' : String(value);
}
const cases = [];
function add(name, value, operand) {
  const result = numbers[name](value, operand);
  const bytes = Buffer.alloc(8);
  bytes.writeDoubleBE(result);
  cases.push([name, text(value), typeof operand === 'number' ? text(operand) : operand, bytes.toString('hex')]);
}
for (let i = 0; i < 10000; i++) {
  const value = next(),
    generatedStep = Math.abs(next());
  if (!Number.isFinite(value)) continue;
  const precision = (i % 633) - 308;
  for (const name of ['round', 'ceil', 'floor']) add(name, value, precision);
  const step = Number.isFinite(generatedStep) && generatedStep > 0 ? generatedStep : 0.25;
  add('roundTo', value, step);
  add('modulo', value, step);
}
const values = [
  0,
  -0,
  0.15,
  -0.15,
  0.3,
  -0.3,
  1.005,
  -1.005,
  1.375,
  -1.375,
  Number.MIN_VALUE,
  -Number.MIN_VALUE,
  1e-323,
  -1e-323,
  1e-200,
  -1e-200,
  1e200,
  -1e200,
  Number.MAX_VALUE,
  -Number.MAX_VALUE
];
const steps = [
  Number.MIN_VALUE,
  1e-323,
  1.5e-323,
  1e-200,
  0.01,
  0.05,
  0.1,
  0.25,
  1,
  5,
  10,
  1e200,
  1e308,
  Number.MAX_VALUE
];
for (const value of values)
  for (const step of steps) {
    add('roundTo', value, step);
    add('modulo', value, step);
  }
console.log(JSON.stringify(cases));
