import Numbers = require('../index.js');

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
 */
declare const isInfinite: typeof Numbers.isInfinite;
export = isInfinite;
