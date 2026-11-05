'use strict';

const unwrapNumber = require('./internal/unwrapNumber');

// Private fixed-size scratch space: no user callbacks run while it is in use.
// Each correction writes all 64 bits before reading; calls cannot retain state.
const view = new DataView(new ArrayBuffer(8));

/**
 * Wraps a finite numeric value into the positive half-open interval `[0, modulus)`.
 *
 * The modulus must be finite and positive and is validated first. Genuine number boxes are
 * accepted. A negative correction that rounds to the excluded upper endpoint uses its
 * representable predecessor.
 *
 * @param {number | Number} value The finite primitive number or genuine `Number` box.
 * @param {number | Number} modulus The finite, strictly positive modulus.
 * @returns {number} The binary remainder adjusted into `[0, modulus)`. All zero results are
 * positive zero.
 * @remarks `TypeError` for unsupported operand types. `RangeError` for a non-finite value or a
 * zero, negative or non-finite modulus.
 * @see ../docs/API.md#modulovalue-modulus
 *
 * @example
 * modulo(-1, 5);                 // => 4
 * modulo(1, 1e308);              // => 1
 */
function modulo(value, modulus) {
  const divisor = unwrapNumber(modulus);
  if (divisor === undefined) throw new TypeError('modulus must be a number or genuine Number object.');
  if (!Number.isFinite(divisor) || divisor <= 0) throw new RangeError('modulus must be finite and greater than zero.');
  const number = unwrapNumber(value);
  if (number === undefined) throw new TypeError('value must be a number or genuine Number object.');
  if (!Number.isFinite(number)) throw new RangeError('value must be finite.');

  const remainder = number % divisor;
  if (remainder === 0) return 0;
  if (remainder > 0) return remainder;
  const corrected = remainder + divisor;
  if (corrected < divisor) return corrected;

  // A tiny negative remainder may disappear during addition. Clamping to the
  // predecessor preserves the half-open interval without jumping to zero.
  view.setFloat64(0, divisor);
  const low = view.getUint32(4);
  if (low === 0) {
    view.setUint32(0, view.getUint32(0) - 1);
    view.setUint32(4, 0xffffffff);
  } else {
    view.setUint32(4, low - 1);
  }
  return view.getFloat64(0);
}

module.exports = modulo;
