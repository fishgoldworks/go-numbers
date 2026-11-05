'use strict';

const unwrapNumber = require('./internal/unwrapNumber');

/**
 * Determines whether a value is either signed zero.
 *
 * This is an exact zero check; use `isClose` for tolerance-based comparison. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is `0` or `-0`; otherwise `false`.
 * @see ../docs/API.md#iszerovalue
 *
 * @example
 * isZero(-0);                    // => true
 */
function isZero(value) {
  return unwrapNumber(value) === 0;
}

module.exports = isZero;
