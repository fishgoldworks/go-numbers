'use strict';

const unwrapNumber = require('./internal/unwrapNumber');

/**
 * Determines whether a value is a number greater than or equal to zero.
 *
 * Both signed zeros and positive infinity are accepted; `NaN` returns `false`. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is zero or positive; otherwise `false`.
 * @see ../docs/API.md#iszeroorpositivevalue
 *
 * @example
 * isZeroOrPositive(-0);          // => true
 */
function isZeroOrPositive(value) {
  const number = unwrapNumber(value);
  return number !== undefined && number >= 0;
}

module.exports = isZeroOrPositive;
