'use strict';

const toParseInput = require('./internal/toParseInput');
const scanNumber = require('./internal/scanNumber');

/**
 * Parses an entire numeric string without trimming or accepting trailing text.
 *
 * Uses the legacy parsing input policy, including explicit object-to-string conversion.
 * Full-string syntax does not imply a finite or application-valid result.
 *
 * @template [T=undefined]
 * @param {unknown} value The value to parse.
 * @param {T} [defaultValue] Returned unchanged when parsing fails; not converted or invoked.
 * Omitted means `undefined`.
 * @returns {number | T | undefined} The parsed number, or the exact fallback on failure.
 * Recognised `NaN` and infinities remain numeric results.
 * @remarks Errors from deliberately invoked `toString` getters or methods propagate unchanged.
 * Unsupported inputs or unmatched text return the fallback; recognised `NaN` and infinities are
 * successful parses.
 * @see ../docs/API.md#parsestrictvalue-defaultvalue
 *
 * @example
 * parseStrict(' 12.5 ', null); // => null
 */
function parseStrict(value, defaultValue) {
  const input = toParseInput(value);
  if (typeof input === 'number') return input;
  if (typeof input !== 'string') return defaultValue;
  const number = scanNumber(input, true);
  return number === undefined ? defaultValue : number;
}

module.exports = parseStrict;
