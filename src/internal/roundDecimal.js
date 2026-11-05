'use strict';

const unwrapNumber = require('./unwrapNumber');
const decimalParts = require('./decimalParts');

/** Increment decimal digits exactly, including carry chains beyond safe integers. */
function increment(digits) {
  let index = digits.length - 1;
  while (index >= 0 && digits.charCodeAt(index) === 57) index--;
  if (index < 0) return '1' + '0'.repeat(digits.length);
  return (
    digits.slice(0, index) + String.fromCharCode(digits.charCodeAt(index) + 1) + '0'.repeat(digits.length - index - 1)
  );
}

function hasNonzero(digits, start) {
  for (let index = Math.max(0, start); index < digits.length; index++) {
    const code = digits.charCodeAt(index);
    if (code >= 49 && code <= 57) return true;
  }
  return false;
}

/** Shared decimal-place rounding. The internal mode is 'nearest', 'ceil' or 'floor'. */
function roundDecimal(value, decimalPlaces, mode) {
  if (typeof decimalPlaces !== 'number') throw new TypeError('decimalPlaces must be a primitive number.');
  if (!Number.isInteger(decimalPlaces) || decimalPlaces < -308 || decimalPlaces > 324) {
    throw new RangeError('decimalPlaces must be an integer from -308 through 324.');
  }
  const number = unwrapNumber(value);
  if (number === undefined) throw new TypeError('value must be a number or genuine Number object.');
  if (!Number.isFinite(number) || number === 0) return number;

  // At precision zero all half/integer boundaries are exactly representable.
  // Native operations therefore agree with the shortest-decimal contract,
  // including negative half ties and signed zero. Validation stays above them.
  if (decimalPlaces === 0) {
    if (mode === 'nearest') return Math.round(number);
    return mode === 'ceil' ? Math.ceil(number) : Math.floor(number);
  }
  if (decimalPlaces > 0 && Number.isInteger(number)) return number;

  const negative = number < 0;
  const { digits, power } = decimalParts(Math.abs(number));
  const discarded = -power - decimalPlaces;
  if (discarded <= 0) return number;
  const retained = digits.length - discarded;
  let coefficient = retained <= 0 ? '0' : digits.slice(0, retained);
  let roundUp;
  if (mode === 'nearest') {
    const firstDiscarded = retained < 0 ? 0 : digits.charCodeAt(retained);
    // On a negative exact half keep the smaller magnitude; trailing nonzero
    // digits mean strictly beyond the half, so both signs increase magnitude.
    roundUp = firstDiscarded > 53 || (firstDiscarded === 53 && (!negative || hasNonzero(digits, retained + 1)));
  } else {
    const hasRemainder = hasNonzero(digits, retained);
    roundUp = hasRemainder && (mode === 'ceil' ? !negative : negative);
  }
  if (roundUp) coefficient = increment(coefficient);
  return Number(`${negative ? '-' : ''}${coefficient}e${-decimalPlaces}`);
}

module.exports = roundDecimal;
