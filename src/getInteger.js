'use strict';

const parse = require('./parse');

/**
 * Returns the parsed finite number rounded down to an integer.
 *
 * Uses the legacy `parse` conversion policy. Negative fractions round toward negative infinity,
 * not toward zero. Signed zero is preserved.
 *
 * @template [T=undefined]
 * @param {unknown} value The value to parse.
 * @param {T} [defaultValue] Returned unchanged when parsing fails; not converted or invoked.
 * Omitted means `undefined`.
 * @returns {number | T | undefined} The floored number, or the exact fallback for missing or
 * non-finite input. Without a fallback, failure returns `undefined`.
 * @remarks Errors from the legacy parser's object conversion getters or methods propagate
 * unchanged. Missing or non-finite parsed values return the fallback.
 * @see ../docs/API.md#getintegervalue-defaultvalue
 *
 * @example
 * getInteger('offset: -1.25', null);   // => -2
 */
function getInteger(value, defaultValue) {
  const number = parse(value);
  return Number.isFinite(number) ? Math.floor(number) : defaultValue;
}

module.exports = getInteger;
