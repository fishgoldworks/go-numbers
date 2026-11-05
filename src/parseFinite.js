'use strict';

const toNumericInput = require('./internal/toNumericInput');
const scanNumber = require('./internal/scanNumber');

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
 *
 * @example
 * parseFinite('12.5', null);     // => 12.5
 * parseFinite('1e999', null); // => null
 */
function parseFinite(value, defaultValue) {
  const input = toNumericInput(value);
  const number = typeof input === 'string' ? scanNumber(input, true) : input;
  return Number.isFinite(number) ? number : defaultValue;
}

module.exports = parseFinite;
