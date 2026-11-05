import Numbers = require('../index.js');

/**
 * Determines whether a value is a number greater than zero.
 *
 * Positive infinity is accepted; both signed zeros and `NaN` return `false`. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is greater than zero; otherwise `false`.
 * @see ../docs/API.md#ispositivevalue
 */
declare const isPositive: typeof Numbers.isPositive;
export = isPositive;
