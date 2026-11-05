'use strict';

// Capture the intrinsic: Number subclasses, spoofed tags and proxies must not
// get to decide whether a value is a genuine boxed number.
const numberValueOf = Function.prototype.call.bind(Number.prototype.valueOf);

/**
 * Return a primitive number (including NaN), or undefined for a non-number.
 * The primitive path allocates nothing. Intrinsic unboxing works across realms
 * and never invokes the value's getters, valueOf, or Symbol.toPrimitive.
 * @param {unknown} value
 * @returns {number | undefined}
 */
function unwrapNumber(value) {
  if (typeof value === 'number') return value;
  if (value === null || typeof value !== 'object') return undefined;
  try {
    return numberValueOf(value);
  } catch (error) {
    // Only the intrinsic's incompatible-receiver failure is possible here.
    return undefined;
  }
}

module.exports = unwrapNumber;
