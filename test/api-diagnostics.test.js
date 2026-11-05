'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const numbers = require('..');

test('range option errors identify both the unsupported key and the allowed keys', () => {
  assert.throws(() => numbers.isInRange(5, 0, 10, { includeMAX: false }), {
    name: 'TypeError',
    message: 'Unknown option "includeMAX". Expected one of: "includeMin", "includeMax".'
  });
});
test('comparison option errors identify their own allowed keys', () => {
  assert.throws(() => numbers.isClose(1, 1, { tolerance: 0.1 }), {
    name: 'TypeError',
    message: 'Unknown option "tolerance". Expected one of: "absoluteTolerance", "relativeTolerance".'
  });
});
test('unknown symbol keys have useful diagnostics without reading their values', () => {
  const options = {};
  Object.defineProperty(options, Symbol('mistyped'), {
    get() {
      throw new Error('must not read');
    }
  });
  assert.throws(() => numbers.isInRange(1, 0, 2, options), {
    name: 'TypeError',
    message: 'Unknown option Symbol(mistyped). Expected one of: "includeMin", "includeMax".'
  });
});
test('unknown string keys are escaped, and unknown property getters are never called', () => {
  const options = {};
  Object.defineProperty(options, 'bad\n"key', {
    get() {
      throw new Error('must not read');
    }
  });
  assert.throws(() => numbers.isClose(1, 1, options), {
    name: 'TypeError',
    message: 'Unknown option "bad\\n\\"key". Expected one of: "absoluteTolerance", "relativeTolerance".'
  });
});
test('inherited options remain ignored and extra own properties remain rejected', () => {
  class RangeConfig {
    get includeMax() {
      throw new Error('not an own option');
    }
  }
  assert.equal(numbers.isInRange(10, 0, 10, new RangeConfig()), true);
  assert.equal(numbers.isInRange(10, 0, 10, Object.assign(Object.create(null), { includeMax: false })), false);
  const options = { includeMax: false, unrelated: true };
  assert.throws(() => numbers.isInRange(5, 0, 10, options), /Unknown option "unrelated"/);
});
test('ESM named entry re-exports each leaf directly instead of reading the aggregate', () => {
  const source = fs.readFileSync(require.resolve('../index.mjs'), 'utf8');
  assert.doesNotMatch(source, /import Numbers|= Numbers\./);
  assert.match(source, /export \{ default \} from '\.\/index\.js';/);
  for (const [name, value] of Object.entries(numbers)) {
    if (typeof value === 'function') {
      assert.ok(source.includes(`export { default as ${name} } from './src/${name}.js';`), name);
    }
  }
});

test('parser callback guidance prevents the map index becoming an accidental fallback', () => {
  const input = ['10', 'bad', '30'];
  assert.deepEqual(input.map(numbers.parseFinite), [10, 1, 30]);
  assert.deepEqual(input.map(numbers.parseSafeInteger), [10, 1, 30]);
  assert.deepEqual(
    input.map((value) => numbers.parseFinite(value, null)),
    [10, null, 30]
  );
  assert.deepEqual(
    input.map((value) => numbers.parseSafeInteger(value, null)),
    [10, null, 30]
  );
});
test('rounding callback guidance prevents the map index changing the requested precision', () => {
  const input = [1.234, 1.234, 1.234];
  assert.deepEqual(input.map(numbers.round), [1, 1.2, 1.23]);
  assert.deepEqual(
    input.map((value) => numbers.round(value, 2)),
    [1.23, 1.23, 1.23]
  );
});
