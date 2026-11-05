import Numbers = require('../index.js');

/**
 * Clamps a numeric value to inclusive, finite, ordered bounds.
 *
 * Genuine number boxes are unwrapped without user conversion hooks. Infinities clip to a bound.
 * Bounds are required and are never swapped.
 *
 * @param {number | Number} value The primitive number or genuine `Number` box.
 * @param {number | Number} min The finite lower bound.
 * @param {number | Number} max The finite upper bound; must be at least `min`.
 * @returns {number} The input number when in range, otherwise the nearest bound. `NaN` stays
 * `NaN`; the selected value's zero sign is preserved.
 * @remarks `TypeError` for unsupported value or bound types. `RangeError` for non-finite or
 * reversed numeric bounds. Bounds are validated before the checked value.
 * @see ../docs/API.md#clampvalue-min-max
 */
declare const clamp: typeof Numbers.clamp;
export = clamp;
