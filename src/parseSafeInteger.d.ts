import Numbers = require('../index.js');

/**
 * Parses signed decimal digits or accepts an already-represented safe integer, without
 * truncation.
 *
 * String input rejects decimal points, exponents and whitespace before conversion. Genuine
 * number/string boxes are supported; arbitrary objects are rejected. Signed zero and fallback
 * identity are preserved.
 *
 * @template [T=undefined]
 * @param {unknown} value The value to parse.
 * @param {T} [defaultValue] Returned unchanged when parsing fails; not converted or invoked.
 * Omitted means `undefined`.
 * @returns {number | T | undefined} The safe integer, or the exact fallback on failure. Without
 * a fallback, failure returns `undefined`.
 * @remarks Ordinary input mismatches return the fallback without invoking arbitrary conversion
 * hooks.
 * @see ../docs/API.md#parsesafeintegervalue-defaultvalue
 */
declare const parseSafeInteger: typeof Numbers.parseSafeInteger;
export = parseSafeInteger;
