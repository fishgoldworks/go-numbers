'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const functions = [
  'isInteger',
  'isSafeInteger',
  'isFinite',
  'isInfinite',
  'isNaN',
  'isEven',
  'isOdd',
  'isPositive',
  'isNegative',
  'isZero',
  'isZeroOrPositive',
  'isZeroOrNegative',
  'parse',
  'parseStrict',
  'getInteger',
  'getFraction',
  'extractNumber',
  'parseFinite',
  'parseSafeInteger',
  'clamp',
  'isInRange',
  'round',
  'isClose',
  'ceil',
  'floor',
  'roundTo',
  'modulo'
];
const constants = [
  'EPSILON',
  'MAX_SAFE_INTEGER',
  'MIN_SAFE_INTEGER',
  'MAX_VALUE',
  'MIN_VALUE',
  'NEGATIVE_INFINITY',
  'POSITIVE_INFINITY',
  'NaN'
];

test('the public CommonJS entry loads without missing modules', () => {
  assert.doesNotThrow(() => require('..'));
});

test('the public API contains exactly the intended functions and constants', () => {
  const numbers = require('..');
  assert.deepEqual(Object.keys(numbers).sort(), [...functions, ...constants].sort());
  for (const name of functions) assert.equal(typeof numbers[name], 'function', name);
  for (const name of constants) assert.ok(Object.is(numbers[name], Number[name]), name);
});

test('each function is independently importable and shares its public identity', () => {
  const numbers = require('..');
  for (const name of functions) assert.equal(require(`../src/${name}.js`), numbers[name], name);
  assert.equal(require('../src/Numbers.js'), numbers);
});

test('the legacy parseInt source path remains an alias, not an integer parser', () => {
  const numbers = require('..');
  assert.equal(require('../src/parseInt.js'), numbers.parse);
  assert.equal(require('../src/parseInt.js')('12.5'), 12.5);
});

test('ESM default and named exports share the CommonJS implementation', async () => {
  const esm = await import('../index.mjs');
  const cjs = require('..');
  assert.equal(esm.default, cjs);
  for (const name of [...functions, ...constants]) assert.ok(Object.is(esm[name], cjs[name]), name);
  assert.deepEqual(Object.keys(esm).sort(), [...functions, ...constants, 'default'].sort());
});
