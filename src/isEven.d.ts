import Numbers = require('../index.js');

/**
 * Determines whether a value is an even integer.
 *
 * Both signed zeros are even. Parity describes the represented number, including unsafe integer
 * values. Primitive numbers and genuine `Number` boxes are supported; unrelated values return
 * `false` without conversion hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is a finite even integer; otherwise `false`.
 * @see ../docs/API.md#isevenvalue
 */
declare const isEven: typeof Numbers.isEven;
export = isEven;
