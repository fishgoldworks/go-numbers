'use strict';

const toNumericInput = require('./internal/toNumericInput');

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
 *
 * @example
 * parseSafeInteger('24', null);  // => 24
 * parseSafeInteger('24.0', null); // => null
 */
function parseSafeInteger(value, defaultValue) {
  const input = toNumericInput(value);
  if (typeof input === 'number') return Number.isSafeInteger(input) ? input : defaultValue;
  if (typeof input !== 'string') return defaultValue;

  const first = input.charCodeAt(0);
  let index = first === 43 || first === 45 ? 1 : 0;
  if (index === input.length) return defaultValue;
  for (; index < input.length; index++) {
    const code = input.charCodeAt(index);
    if (code < 48 || code > 57) return defaultValue;
  }
  // Validate the text first so that 1.0000000000000001 cannot silently become 1.
  const number = Number(input);
  return Number.isSafeInteger(number) ? number : defaultValue;
}

module.exports = parseSafeInteger;
