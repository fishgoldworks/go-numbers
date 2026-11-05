import Numbers = require('../index.js');

/**
 * Rounds a number's shortest decimal representation to a chosen precision, with half ties toward
 * positive infinity.
 *
 * Precision must be a primitive integer from `-308` through `324` and is validated before
 * special-value handling. Genuine number boxes are accepted. Negative results rounded to zero
 * produce `-0`; results remain binary numbers.
 *
 * @param {number | Number} value The primitive number or genuine `Number` box.
 * @param {number} [decimalPlaces=0] Decimal places; negative values round tens, hundreds and
 * larger powers of ten.
 * @returns {number} The rounded number. `NaN`, infinities and signed zero pass through; overflow
 * produces signed infinity.
 * @remarks `TypeError` for unsupported value types or non-number precision. `RangeError` for
 * non-integral, non-finite or out-of-range precision, even when the input is non-finite.
 * @see ../docs/API.md#roundvalue-decimalplaces
 */
declare const round: typeof Numbers.round;
export = round;
