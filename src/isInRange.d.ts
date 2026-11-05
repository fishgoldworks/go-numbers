import Numbers = require('../index.js');

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
 */
declare const isInRange: typeof Numbers.isInRange;
export = isInRange;
