import Numbers = require('../index.js');

/**
 * Determines whether a value is a finite number.
 *
 * `NaN` and both infinities return `false`; numeric strings are not converted. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is finite; otherwise `false`.
 * @see ../docs/API.md#isfinitevalue
 */
declare const isFinite: typeof Numbers.isFinite;
export = isFinite;
