'use strict';

const toParseInput = require('./internal/toParseInput');
const scanNumber = require('./internal/scanNumber');

/**
 * Extracts the first decimal or scientific number, or standalone `Infinity`/`NaN` token, from
 * text.
 *
 * Primitive numbers pass through. Genuine number/string boxes are unwrapped; other objects can
 * supply `toString` once. This is extraction, not validation.
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
 *
 * @example
 * parse('temperature: -12.5 C', null);   // => -12.5
 */
function parse(value, defaultValue) {
  const input = toParseInput(value);
  if (typeof input === 'number') return input;
  if (typeof input !== 'string') return defaultValue;
  const number = scanNumber(input, false);
  return number === undefined ? defaultValue : number;
}

module.exports = parse;
