'use strict';

const unwrapNumber = require('./internal/unwrapNumber');

/**
 * Determines whether a value is a finite integer.
 *
 * Values outside the safe-integer range can still be integers; use `isSafeInteger` when adjacent
 * integers must remain distinguishable. Primitive numbers and genuine `Number` boxes are
 * supported; unrelated values return `false` without conversion hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the represented numeric value is finite and integral; otherwise
 * `false`.
 * @see ../docs/API.md#isintegervalue
 *
 * @example
 * isInteger(new Number(3));      // => true
 */
function isInteger(value) {
  return Number.isInteger(unwrapNumber(value));
}

module.exports = isInteger;
