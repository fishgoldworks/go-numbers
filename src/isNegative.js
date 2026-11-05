'use strict';

const unwrapNumber = require('./internal/unwrapNumber');

/**
 * Determines whether a value is a number less than zero.
 *
 * Negative infinity is accepted; both signed zeros and `NaN` return `false`. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is less than zero; otherwise `false`.
 * @see ../docs/API.md#isnegativevalue
 *
 * @example
 * isNegative(-Infinity);         // => true
 */
function isNegative(value) {
  const number = unwrapNumber(value);
  return number !== undefined && number < 0;
}

module.exports = isNegative;
