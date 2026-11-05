import Numbers = require('../index.js');

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
 */
declare const isClose: typeof Numbers.isClose;
export = isClose;
