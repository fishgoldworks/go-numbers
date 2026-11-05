'use strict';

const unwrapNumber = require('./internal/unwrapNumber');
const decimalParts = require('./internal/decimalParts');
const roundDecimal = require('./internal/roundDecimal');
const roundRatio = require('./internal/roundRatio');

// One validated primitive grid, not an unbounded memo table or an object cache.
// Intrinsic unboxing and validation still run on every call, including cache hits.
let previousStep;
let previousGrid;
function readGrid(increment) {
  if (increment === previousStep) return previousGrid;
  const { digits, power } = decimalParts(increment);
  const precision = /^10*$/.test(digits) ? -(power + digits.length - 1) : undefined;
  previousGrid = { digits, power, coefficient: Number(digits), precision, bigint: undefined };
  previousStep = increment;
  return previousGrid;
}

/**
 * Rounds a number to the nearest zero-origin step using decimal operands, with half ties toward
 * positive infinity.
 *
 * The step must be finite and positive and is validated first. Genuine number boxes are
 * accepted. Negative results rounded to zero produce `-0`; this does not provide exact decimal
 * storage.
 *
 * @param {number | Number} value The primitive number or genuine `Number` box.
 * @param {number | Number} step The finite, strictly positive step; the grid starts at zero.
 * @returns {number} The rounded binary number. `NaN`, infinities and signed zero pass through;
 * output overflow produces signed infinity.
 * @remarks `TypeError` for unsupported operand types. `RangeError` for a zero, negative or
 * non-finite step, even when the value is non-finite.
 * @see ../docs/API.md#roundtovalue-step
 *
 * @example
 * roundTo(0.15, 0.1);            // => 0.2
 * roundTo(-1.375, 0.25);         // => -1.25
 */
function roundTo(value, step) {
  const increment = unwrapNumber(step);
  if (increment === undefined) throw new TypeError('step must be a number or genuine Number object.');
  if (!Number.isFinite(increment) || increment <= 0) throw new RangeError('step must be finite and greater than zero.');
  const number = unwrapNumber(value);
  if (number === undefined) throw new TypeError('value must be a number or genuine Number object.');
  if (!Number.isFinite(number) || number === 0) return number;

  const negative = number < 0;
  const grid = readGrid(increment);
  // Decimal-place rounding and a power-of-ten grid are the same operation.
  // Reuse that exact algorithm instead of constructing a BigInt ratio.
  if (grid.precision !== undefined) return roundDecimal(number, grid.precision, 'nearest');

  const input = decimalParts(Math.abs(number));
  const power = Math.min(input.power, grid.power);
  const inputShift = input.power - power;
  const gridShift = grid.power - power;
  const smallNumerator = Number(input.digits) * 10 ** inputShift;
  const smallDenominator = grid.coefficient * 10 ** gridShift;
  // The conservative 2^52 bound leaves a full bit of headroom. Scaled
  // coefficients, quotient products, remainders and the final coefficient
  // must ALL remain exact integers. Never scale the original binary value.
  if (
    Number.isSafeInteger(smallNumerator) &&
    smallNumerator <= 2 ** 52 &&
    Number.isSafeInteger(smallDenominator) &&
    smallDenominator <= 2 ** 52
  ) {
    let multiple = Math.floor(smallNumerator / smallDenominator);
    const remainder = smallNumerator - multiple * smallDenominator;
    if (remainder === 0) return number;
    const otherHalf = smallDenominator - remainder;
    if (remainder > otherHalf || (remainder === otherHalf && !negative)) multiple++;
    const coefficient = multiple * grid.coefficient;
    // coefficient <= numerator + denominator / 2 <= 1.5 * 2^52,
    // because grid.coefficient <= denominator. Thus it too is exact.
    return Number(`${negative ? '-' : ''}${coefficient}e${grid.power}`);
  }

  if (typeof BigInt !== 'function') {
    return roundRatio(input, grid, inputShift, gridShift, negative, number);
  }
  const gridCoefficient = grid.bigint === undefined ? (grid.bigint = BigInt(grid.digits)) : grid.bigint;
  const numerator = BigInt(input.digits) * BigInt(10) ** BigInt(inputShift);
  const denominator = gridCoefficient * BigInt(10) ** BigInt(gridShift);
  let multiple = numerator / denominator;
  const remainder = numerator % denominator;
  if (remainder === BigInt(0)) return number;
  const doubled = remainder * BigInt(2);
  if (doubled > denominator || (doubled === denominator && !negative)) multiple++;
  const coefficient = multiple * gridCoefficient;
  return Number(`${negative ? '-' : ''}${coefficient}e${grid.power}`);
}

module.exports = roundTo;
