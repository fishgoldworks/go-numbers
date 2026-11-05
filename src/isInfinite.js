'use strict';

const unwrapNumber = require('./internal/unwrapNumber');

/**
 * Determines whether a value is positive or negative infinity.
 *
 * `NaN` and finite numbers return `false`; numeric strings are not converted. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is `Infinity` or `-Infinity`; otherwise
 * `false`.
 * @see ../docs/API.md#isinfinitevalue
 *
 * @example
 * isInfinite(new Number(Infinity));  // => true
 */
function isInfinite(value) {
  const number = unwrapNumber(value);
  return number === Infinity || number === -Infinity;
}

module.exports = isInfinite;
