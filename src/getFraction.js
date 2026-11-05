'use strict';

const parse = require('./parse');

/**
 * Returns the nonnegative fractional digits of a finite number's shortest decimal
 * representation.
 *
 * Obtains its input through `parse`. This is not the binary remainder and cannot recover decimal
 * digits lost during numeric conversion.
 *
 * @template [T=undefined]
 * @param {unknown} value The value to parse.
 * @param {T} [defaultValue] Returned unchanged when parsing fails; not converted or invoked.
 * Omitted means `undefined`.
 * @returns {number | T | undefined} A number in `[0, 1)`, or the exact fallback for missing or
 * non-finite input. Integer inputs and signed zeros produce positive zero.
 * @remarks Errors from the legacy parser's object conversion getters or methods propagate
 * unchanged. Missing or non-finite parsed values return the fallback.
 * @see ../docs/API.md#getfractionvalue-defaultvalue
 *
 * @example
 * getFraction(-1.01);            // => 0.01
 * getFraction(1.23e-7);          // => 1.23e-7
 */
function getFraction(value, defaultValue) {
  const number = parse(value);
  if (!Number.isFinite(number)) return defaultValue;
  const magnitude = Math.abs(number);
  if (Number.isInteger(magnitude)) return 0;
  if (magnitude < 1) return magnitude;

  // A non-integral Number with magnitude >= 1 is below 2^52, so its
  // shortest decimal representation contains a dot and no exponent.
  // This avoids subtraction artifacts without misreading scientific notation.
  const text = String(magnitude);
  return Number(text.slice(text.indexOf('.')));
}

module.exports = getFraction;
