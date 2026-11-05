import Numbers = require('../index.js');

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
 */
declare const isInteger: typeof Numbers.isInteger;
export = isInteger;
