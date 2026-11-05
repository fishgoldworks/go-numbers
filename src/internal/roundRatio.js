'use strict';

// Unsigned decimal arithmetic for hosts without BigInt. Operands originate in
// shortest Number representations; their aligned length is bounded by 633 digits.
function normalize(value) {
  return value.replace(/^0+/, '') || '0';
}
function compare(left, right) {
  return left.length === right.length ? (left > right ? 1 : left < right ? -1 : 0) : left.length - right.length;
}
function subtract(left, right) {
  let borrow = 0;
  let result = '';
  for (let i = left.length - 1, j = right.length - 1; i >= 0; i--, j--) {
    let digit = Number(left[i]) - (j >= 0 ? Number(right[j]) : 0) - borrow;
    borrow = digit < 0 ? 1 : 0;
    if (borrow) digit += 10;
    result = digit + result;
  }
  return normalize(result);
}
function add(left, right) {
  let carry = 0;
  let result = '';
  for (let i = left.length - 1, j = right.length - 1; i >= 0 || j >= 0 || carry; i--, j--) {
    const digit = (i >= 0 ? Number(left[i]) : 0) + (j >= 0 ? Number(right[j]) : 0) + carry;
    result = (digit % 10) + result;
    carry = Math.floor(digit / 10);
  }
  return result;
}
function roundRatio(input, grid, inputShift, gridShift, negative, number) {
  const numerator = input.digits + '0'.repeat(inputShift);
  const denominator = grid.digits + '0'.repeat(gridShift);
  let remainder = '0';
  for (const digit of numerator) {
    remainder = normalize(remainder + digit);
    // Long division needs at most nine subtractions per digit.
    while (compare(remainder, denominator) >= 0) remainder = subtract(remainder, denominator);
  }
  if (remainder === '0') return number;
  let aligned = subtract(numerator, remainder);
  const half = compare(add(remainder, remainder), denominator);
  if (half > 0 || (half === 0 && !negative)) aligned = add(aligned, denominator);
  // The aligned coefficient includes gridShift trailing zeroes. Keeping those
  // digits and shifting the exponent avoids another arbitrary-integer division.
  return Number((negative ? '-' : '') + aligned + 'e' + (grid.power - gridShift));
}
module.exports = roundRatio;
