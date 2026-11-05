import Numbers = require('../index.js');

/**
 * Determines whether a value is a number less than or equal to zero.
 *
 * Both signed zeros and negative infinity are accepted; `NaN` returns `false`. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is zero or negative; otherwise `false`.
 * @see ../docs/API.md#iszeroornegativevalue
 */
declare const isZeroOrNegative: typeof Numbers.isZeroOrNegative;
export = isZeroOrNegative;
