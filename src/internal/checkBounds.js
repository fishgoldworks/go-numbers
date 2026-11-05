'use strict';

/** Validate already-unboxed numeric bounds without allocation or coercion. */
function checkBounds(min, max) {
  if (min === undefined || max === undefined) {
    throw new TypeError('min and max must be numbers or genuine Number objects.');
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new RangeError('min and max must be finite.');
  }
  if (min > max) throw new RangeError('min must not exceed max.');
}

module.exports = checkBounds;
