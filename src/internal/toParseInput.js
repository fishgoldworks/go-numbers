'use strict';

const unwrapNumber = require('./unwrapNumber');
const stringValueOf = Function.prototype.call.bind(String.prototype.valueOf);
let bigintBrand;
try {
  bigintBrand = require('./bigintBrand');
} catch (error) {
  // Hosts without BigInt syntax cannot create BigInt boxes either.
  if (!(error instanceof SyntaxError)) throw error;
}
const apply = Reflect.apply;

/**
 * Normalize once, without recursively following arbitrary conversion results.
 * Genuine boxes use their internal value. Other objects may explicitly supply
 * a toString method; errors in that getter/method deliberately propagate.
 * @param {unknown} value
 * @returns {string | number | undefined}
 */
function toParseInput(value) {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return undefined;
  }

  const number = unwrapNumber(value);
  if (number !== undefined) return number;

  try {
    return stringValueOf(value);
  } catch (error) {
    // Not a genuine String box. No user code was invoked.
  }
  if (bigintBrand)
    try {
      bigintBrand(value);
      // Do not implicitly lose integer precision through boxed BigInt strings.
      return undefined;
    } catch (error) {
      // Not a genuine BigInt box. No user code was invoked.
    }

  const method = value.toString;
  if (typeof method !== 'function') return undefined;
  const converted = apply(method, value, []);
  return typeof converted === 'string' || typeof converted === 'number' ? converted : undefined;
}

module.exports = toParseInput;
