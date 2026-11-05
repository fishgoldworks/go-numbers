'use strict';

const unwrapNumber = require('./internal/unwrapNumber');
const readOptions = require('./internal/readOptions');

// Keep explicit configuration handling off the default hot path. This also
// keeps the frequently inlined public wrapper small without skipping validation.
function compare(a, b, absoluteTolerance, relativeTolerance) {
  const left = unwrapNumber(a);
  const right = unwrapNumber(b);
  if (left === undefined || right === undefined) return false;
  if (left === right) return true;
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;

  const difference = Math.abs(left - right);
  if (difference <= absoluteTolerance) return true;
  const scale = Math.max(Math.abs(left), Math.abs(right));
  // For distinct finite Numbers the normalized distance cannot underflow to
  // zero. Dividing avoids relativeTolerance * scale rounding UP a subnormal
  // threshold (or overflowing). Opposite large signs can overflow subtraction,
  // so normalize each operand before subtracting in that case only.
  const relativeDistance = Number.isFinite(difference) ? difference / scale : Math.abs(left / scale - right / scale);
  return relativeDistance <= relativeTolerance;
}

function withOptions(a, b, options) {
  const [absoluteTolerance, relativeTolerance] = readOptions(
    options,
    'absoluteTolerance',
    'relativeTolerance',
    0,
    1e-12
  );
  if (typeof absoluteTolerance !== 'number' || typeof relativeTolerance !== 'number') {
    throw new TypeError('Tolerances must be primitive numbers.');
  }
  if (
    !Number.isFinite(absoluteTolerance) ||
    absoluteTolerance < 0 ||
    !Number.isFinite(relativeTolerance) ||
    relativeTolerance < 0
  ) {
    throw new RangeError('Tolerances must be finite and nonnegative.');
  }
  return compare(a, b, absoluteTolerance, relativeTolerance);
}

/**
 * Determines whether two numeric values are close under absolute or relative tolerance.
 *
 * Genuine number boxes are accepted without conversion hooks. Unsupported values return `false`.
 * Own options are validated even for equal or invalid inputs. Closeness is not transitive.
 *
 * @param {unknown} a The first value.
 * @param {unknown} b The second value.
 * @param {CloseOptions} [options] Own `absoluteTolerance` and `relativeTolerance`; defaults are `0` and `1e-12`. Omitted
 * means `undefined`.
 * @returns {boolean} `true` if the numbers are identical or satisfy either tolerance; otherwise
 * `false`. `NaN` never matches, and infinities match only themselves.
 * @remarks `TypeError` for invalid options or non-number tolerances. `RangeError` for negative
 * or non-finite tolerances. Configuration getter/proxy errors propagate.
 * @see ../docs/API.md#isclosea-b-options
 *
 * @example
 * isClose(0.1 + 0.2, 0.3);       // => true
 */
function isClose(a, b, options) {
  return options === undefined ? compare(a, b, 0, 1e-12) : withOptions(a, b, options);
}

module.exports = isClose;
