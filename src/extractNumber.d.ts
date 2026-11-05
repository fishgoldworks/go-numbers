import Numbers = require('../index.js');

/**
 * Extracts the first decimal or scientific number, or standalone `Infinity`/`NaN` token, from
 * text.
 *
 * An exact alias of `parse`, including identity, input conversion and fallback rules.
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
declare const extractNumber: typeof Numbers.extractNumber;
export = extractNumber;
