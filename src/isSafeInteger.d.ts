import Numbers = require('../index.js');

/**
 * Determines whether a value is an integer within the safe-integer bounds.
 *
 * The check applies to the number already represented in memory; it cannot recover previously
 * rounded digits. Primitive numbers and genuine `Number` boxes are supported; unrelated values
 * return `false` without conversion hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is an integer between `MIN_SAFE_INTEGER` and
 * `MAX_SAFE_INTEGER`, inclusive; otherwise `false`.
 * @see ../docs/API.md#issafeintegervalue
 */
declare const isSafeInteger: typeof Numbers.isSafeInteger;
export = isSafeInteger;
