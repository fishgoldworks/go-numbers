'use strict';

const unwrapNumber = require('./internal/unwrapNumber');

/**
 * Determines whether a value is an odd integer.
 *
 * Negative odd integers are supported. Fractions, non-finite values and both signed zeros return
 * `false`. Primitive numbers and genuine `Number` boxes are supported; unrelated values return
 * `false` without conversion hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is a finite odd integer; otherwise `false`.
 * @see ../docs/API.md#isoddvalue
 *
 * @example
 * isOdd(-3);                     // => true
 */
function isOdd(value) {
  const number = unwrapNumber(value);
  return Number.isInteger(number) && number % 2 !== 0;
}

module.exports = isOdd;
