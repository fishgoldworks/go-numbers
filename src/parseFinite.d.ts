import Numbers = require('../index.js');

/**
 * Parses a complete decimal or scientific value and requires a finite result.
 *
 * Accepts primitive numbers/strings and genuine boxes without arbitrary object conversion. No
 * implicit trimming. Numeric conversion can still round digits or underflow to signed zero.
 *
 * @template [T=undefined]
 * @param {unknown} value The value to parse.
 * @param {T} [defaultValue] Returned unchanged when parsing fails; not converted or invoked.
 * Omitted means `undefined`.
 * @returns {number | T | undefined} The finite parsed number, or the exact fallback on invalid
 * or non-finite input. Without a fallback, failure returns `undefined`.
 * @remarks Ordinary input mismatches return the fallback without invoking arbitrary conversion
 * hooks.
 * @see ../docs/API.md#parsefinitevalue-defaultvalue
 */
declare const parseFinite: typeof Numbers.parseFinite;
export = parseFinite;
