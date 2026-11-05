'use strict';

const unwrapNumber = require('./internal/unwrapNumber');
const checkBounds = require('./internal/checkBounds');
const readOptions = require('./internal/readOptions');

/**
 * Determines whether a numeric value lies within finite, ordered bounds, including both
 * endpoints by default.
 *
 * Genuine number boxes are accepted. Unsupported checked values, `NaN` and infinities return
 * `false`. Own options are validated before the checked value; configuration accessors can run.
 *
 * @param {unknown} value The value to inspect.
 * @param {number | Number} min The finite lower bound.
 * @param {number | Number} max The finite upper bound; must be at least `min`.
 * @param {RangeOptions} [options] Own `includeMin` and `includeMax` flags; each defaults to `true`. Omitted
 * means `undefined`.
 * @returns {boolean} `true` if the finite numeric value satisfies the configured endpoint rules;
 * otherwise `false`.
 * @remarks `TypeError` for unsupported bound types, invalid options or non-boolean endpoint
 * flags. `RangeError` for non-finite or reversed bounds. Configuration getter/proxy errors
 * propagate, including when the checked value is invalid.
 * @see ../docs/API.md#isinrangevalue-min-max-options
 *
 * @example
 * isInRange(10, 0, 10, { includeMax: false });   // => false
 */
function isInRange(value, min, max, options) {
  const low = unwrapNumber(min);
  const high = unwrapNumber(max);
  checkBounds(low, high);
  let includeMin = true;
  let includeMax = true;
  if (options !== undefined) {
    [includeMin, includeMax] = readOptions(options, 'includeMin', 'includeMax', true, true);
    if (typeof includeMin !== 'boolean' || typeof includeMax !== 'boolean') {
      throw new TypeError('includeMin and includeMax must be booleans.');
    }
  }
  const number = unwrapNumber(value);
  return (
    Number.isFinite(number) &&
    (includeMin ? number >= low : number > low) &&
    (includeMax ? number <= high : number < high)
  );
}

module.exports = isInRange;
