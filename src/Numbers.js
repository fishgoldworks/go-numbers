'use strict';

// Implementations import private helpers, never this aggregate.
module.exports = {
  /**
   * The difference between `1` and the next representable number above it; not a universal
   * comparison tolerance.
   *
   * @type {number}
   * @see ../docs/API.md#epsilon
   */
  EPSILON: Number.EPSILON,
  /**
   * The largest safe integer, `9007199254740991`.
   *
   * @type {number}
   * @see ../docs/API.md#max_safe_integer
   */
  MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
  /**
   * The smallest safe integer, `-9007199254740991`.
   *
   * @type {number}
   * @see ../docs/API.md#min_safe_integer
   */
  MIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
  /**
   * The largest finite positive number.
   *
   * @type {number}
   * @see ../docs/API.md#max_value
   */
  MAX_VALUE: Number.MAX_VALUE,
  /**
   * The smallest positive subnormal number, not the most negative number.
   *
   * @type {number}
   * @see ../docs/API.md#min_value
   */
  MIN_VALUE: Number.MIN_VALUE,
  /**
   * Negative infinity (`-Infinity`).
   *
   * @type {number}
   * @see ../docs/API.md#negative_infinity
   */
  NEGATIVE_INFINITY: Number.NEGATIVE_INFINITY,
  /**
   * Positive infinity (`Infinity`).
   *
   * @type {number}
   * @see ../docs/API.md#positive_infinity
   */
  POSITIVE_INFINITY: Number.POSITIVE_INFINITY,
  /**
   * The primitive not-a-number value (`NaN`).
   *
   * @type {number}
   * @see ../docs/API.md#nan
   */
  NaN: Number.NaN,
  isInteger: require('./isInteger'),
  isSafeInteger: require('./isSafeInteger'),
  isFinite: require('./isFinite'),
  isInfinite: require('./isInfinite'),
  isEven: require('./isEven'),
  isOdd: require('./isOdd'),
  isPositive: require('./isPositive'),
  isNegative: require('./isNegative'),
  isZero: require('./isZero'),
  isZeroOrPositive: require('./isZeroOrPositive'),
  isZeroOrNegative: require('./isZeroOrNegative'),
  isNaN: require('./isNaN'),
  parse: require('./parse'),
  parseStrict: require('./parseStrict'),
  extractNumber: require('./extractNumber'),
  parseFinite: require('./parseFinite'),
  parseSafeInteger: require('./parseSafeInteger'),
  round: require('./round'),
  ceil: require('./ceil'),
  floor: require('./floor'),
  roundTo: require('./roundTo'),
  modulo: require('./modulo'),
  isClose: require('./isClose'),
  clamp: require('./clamp'),
  isInRange: require('./isInRange'),
  getInteger: require('./getInteger'),
  getFraction: require('./getFraction')
};
