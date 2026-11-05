'use strict';

// This fixture runs on the consumer runtime, not the maintainer runtime.
// Keep its syntax/native dependencies within the Node 8 CommonJS contract.
const assert = require('assert');
const vm = require('vm');

module.exports = function assertConsumerContracts(numbers) {
  const cases = [
    ['isInteger', [12], true],
    ['isSafeInteger', [Number.MAX_SAFE_INTEGER], true],
    ['isFinite', [1.5], true],
    ['isInfinite', [-Infinity], true],
    ['isNaN', [NaN], true],
    ['isEven', [-4], true],
    ['isOdd', [-3], true],
    ['isPositive', [Infinity], true],
    ['isNegative', [-Infinity], true],
    ['isZero', [-0], true],
    ['isZeroOrPositive', [-0], true],
    ['isZeroOrNegative', [0], true],
    ['parse', ['height: -12.5px'], -12.5],
    ['parseStrict', ['1.25e2'], 125],
    ['extractNumber', ['height: -12.5px'], -12.5],
    ['parseFinite', ['1e999', null], null],
    ['parseSafeInteger', ['9007199254740993', null], null],
    ['getInteger', [-1.25], -2],
    ['getFraction', [1.23e-7], 1.23e-7],
    ['round', [1.005, 2], 1.01],
    ['ceil', [-1.239, 2], -1.23],
    ['floor', [-1.231, 2], -1.24],
    ['roundTo', [-1.375, 0.25], -1.25],
    ['modulo', [-1, 5], 4],
    ['clamp', [150, 0, 100], 100],
    ['isInRange', [10, 0, 10, { includeMax: false }], false],
    ['isClose', [0.1 + 0.2, 0.3], true]
  ];
  const names = cases.map(function (row) {
    return row[0];
  });
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
  assert.deepStrictEqual(Object.keys(numbers).sort(), names.concat(constants).sort());
  cases.forEach(function (row) {
    assert.strictEqual(typeof numbers[row[0]], 'function', row[0]);
    assert.ok(Object.is(numbers[row[0]].apply(undefined, row[1]), row[2]), row[0]);
  });
  constants.forEach(function (name) {
    assert.ok(Object.is(numbers[name], Number[name]), name);
  });
  assert.strictEqual(numbers.extractNumber, numbers.parse);

  // These are documented library results, not an arithmetic oracle that assumes
  // every native engine rounds its intermediate computations identically.
  assert.ok(Object.is(numbers.round(-0.5), -0));
  assert.ok(Object.is(numbers.ceil(-Number.MIN_VALUE), -0));
  assert.ok(Object.is(numbers.modulo(-0, 3), 0));
  assert.strictEqual(numbers.roundTo(Number.MAX_VALUE, 0.03), Number.MAX_VALUE);
  assert.strictEqual(numbers.roundTo(2e-323, 3e-323), 3e-323);
  assert.strictEqual(numbers.parseFinite('12.5', null), 12.5);
  assert.strictEqual(numbers.parseSafeInteger('-24', null), -24);
  assert.strictEqual(numbers.parseStrict('12px', null), null);
  assert.strictEqual(numbers.parseSafeInteger('1.0000000000000001', null), null);
  assert.strictEqual(numbers.isNaN(new Number(NaN)), false);
  assert.strictEqual(numbers.isInteger('12'), false);
  assert.strictEqual(numbers.modulo(-Number.MIN_VALUE, 1), 0.9999999999999999);
  assert.throws(function () {
    numbers.clamp(NaN, 2, 1);
  }, RangeError);
  assert.throws(function () {
    numbers.round(NaN, 1.5);
  }, RangeError);
  assert.throws(function () {
    numbers.isInRange(0, -1, 1, { includeMAX: true });
  }, TypeError);
  assert.throws(function () {
    numbers.isClose(1, 1, { relativeTolerance: -1 });
  }, RangeError);

  // Values are created by this executable's actual V8 realm, not tag mocks or
  // modern-value shims. Never use instanceof to decide their numeric brands.
  const foreign = vm.runInNewContext(`
    (function () {
      const number = new Number(-3);
      const string = new String('12.5');
      number.valueOf = string.valueOf = function () { throw new Error('coercion hook'); };
      number.toString = string.toString = number.valueOf;
      return {
        number: number,
        string: string,
        bigint: typeof BigInt === 'function' ? Object(BigInt('9007199254740993')) : undefined
      };
    }())
  `);
  assert.strictEqual(foreign.number instanceof Number, false);
  assert.strictEqual(foreign.string instanceof String, false);
  assert.strictEqual(numbers.isOdd(foreign.number), true);
  assert.strictEqual(numbers.round(foreign.number, 2), -3);
  assert.strictEqual(numbers.parseStrict(foreign.string), 12.5);
  assert.strictEqual(numbers.parseFinite(foreign.string), 12.5);
  const fallback = Object.freeze({ missing: true });
  assert.strictEqual(numbers.parseFinite({}, fallback), fallback);
  assert.strictEqual(
    numbers.parseStrict(
      {
        toString: function () {
          return 'bad';
        }
      },
      fallback
    ),
    fallback
  );
  if (typeof BigInt === 'function') {
    assert.strictEqual(numbers.parseStrict(foreign.bigint, fallback), fallback);
    assert.strictEqual(numbers.parseFinite(foreign.bigint, fallback), fallback);
  }
  assert.strictEqual(
    numbers.parseStrict(
      {
        toString: function () {
          return '12.5';
        }
      },
      fallback
    ),
    12.5
  );
};
