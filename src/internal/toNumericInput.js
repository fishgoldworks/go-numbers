'use strict';

const unwrapNumber = require('./unwrapNumber');
const stringValueOf = Function.prototype.call.bind(String.prototype.valueOf);

/**
 * Accept only primitive numbers/strings and genuine boxes, including other realms.
 * Unlike toParseInput, this never reads or invokes arbitrary conversion hooks.
 * @param {unknown} value
 * @returns {string | number | undefined}
 */
function toNumericInput(value) {
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (value === null || typeof value !== 'object') return undefined;
  const number = unwrapNumber(value);
  if (number !== undefined) return number;
  try {
    return stringValueOf(value);
  } catch (error) {
    // The intrinsic rejects non-string boxes without touching their properties.
    return undefined;
  }
}

module.exports = toNumericInput;
