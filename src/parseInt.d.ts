import Numbers = require('../index.js');

/**
 * Extracts the first decimal or scientific number, or standalone `Infinity`/`NaN` token, from
 * text.
 *
 * Legacy import path for `parse`; this extracts decimals and does not truncate to an integer.
 *
 * @template [T=undefined]
 * @param {unknown} value The value to parse.
 * @param {T} [defaultValue] Returned unchanged when parsing fails; not converted or invoked.
 * Omitted means `undefined`.
 * @returns {number | T | undefined} The extracted number, or the exact fallback when no
 * supported value is found. Without a fallback, failure returns `undefined`.
 * @remarks Errors from deliberately invoked `toString` getters or methods propagate unchanged.
 * Unsupported inputs or unmatched text return the fallback; recognised `NaN` and infinities are
 * successful parses.
 * @see ../docs/API.md#parsevalue-defaultvalue
 */
declare const parseInt: typeof Numbers.parse;
export = parseInt;
