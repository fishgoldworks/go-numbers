'use strict';

/**
 * Determines whether a value is primitive `NaN`.
 *
 * Unlike the other numeric predicates, this does not unwrap `Number` boxes. Boxed `NaN` returns `false`. This follows
 * `Number.isNaN`, not the coercing global `isNaN`.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the value is primitive `NaN`; otherwise `false`.
 * @see ../docs/API.md#isnanvalue
 *
 * @example
 * isNaN(NaN);                    // => true
 * isNaN(new Number(NaN));        // => false
 */
function isNaN(value) {
  return Number.isNaN(value);
}

module.exports = isNaN;
