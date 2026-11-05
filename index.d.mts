import Numbers = require('./index.js');

export default Numbers;
/**
 * The difference between `1` and the next representable number above it; not a universal
 * comparison tolerance.
 *
 * @type {number}
 * @see docs/API.md#epsilon
 */
export const EPSILON: typeof Numbers.EPSILON;
/**
 * The largest safe integer, `9007199254740991`.
 *
 * @type {number}
 * @see docs/API.md#max_safe_integer
 */
export const MAX_SAFE_INTEGER: typeof Numbers.MAX_SAFE_INTEGER;
/**
 * The smallest safe integer, `-9007199254740991`.
 *
 * @type {number}
 * @see docs/API.md#min_safe_integer
 */
export const MIN_SAFE_INTEGER: typeof Numbers.MIN_SAFE_INTEGER;
/**
 * The largest finite positive number.
 *
 * @type {number}
 * @see docs/API.md#max_value
 */
export const MAX_VALUE: typeof Numbers.MAX_VALUE;
/**
 * The smallest positive subnormal number, not the most negative number.
 *
 * @type {number}
 * @see docs/API.md#min_value
 */
export const MIN_VALUE: typeof Numbers.MIN_VALUE;
/**
 * Negative infinity (`-Infinity`).
 *
 * @type {number}
 * @see docs/API.md#negative_infinity
 */
export const NEGATIVE_INFINITY: typeof Numbers.NEGATIVE_INFINITY;
/**
 * Positive infinity (`Infinity`).
 *
 * @type {number}
 * @see docs/API.md#positive_infinity
 */
export const POSITIVE_INFINITY: typeof Numbers.POSITIVE_INFINITY;
/**
 * The primitive not-a-number value (`NaN`).
 *
 * @type {number}
 * @see docs/API.md#nan
 */
export const NaN: typeof Numbers.NaN;
/**
 * Determines whether a value is a finite integer.
 *
 * Values outside the safe-integer range can still be integers; use `isSafeInteger` when adjacent
 * integers must remain distinguishable. Primitive numbers and genuine `Number` boxes are
 * supported; unrelated values return `false` without conversion hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the represented numeric value is finite and integral; otherwise
 * `false`.
 * @see docs/API.md#isintegervalue
 */
export const isInteger: typeof Numbers.isInteger;
/**
 * Determines whether a value is an integer within the safe-integer bounds.
 *
 * The check applies to the number already represented in memory; it cannot recover previously
 * rounded digits. Primitive numbers and genuine `Number` boxes are supported; unrelated values
 * return `false` without conversion hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is an integer between `MIN_SAFE_INTEGER` and
 * `MAX_SAFE_INTEGER`, inclusive; otherwise `false`.
 * @see docs/API.md#issafeintegervalue
 */
export const isSafeInteger: typeof Numbers.isSafeInteger;
/**
 * Determines whether a value is a finite number.
 *
 * `NaN` and both infinities return `false`; numeric strings are not converted. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is finite; otherwise `false`.
 * @see docs/API.md#isfinitevalue
 */
export const isFinite: typeof Numbers.isFinite;
/**
 * Determines whether a value is positive or negative infinity.
 *
 * `NaN` and finite numbers return `false`; numeric strings are not converted. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is `Infinity` or `-Infinity`; otherwise
 * `false`.
 * @see docs/API.md#isinfinitevalue
 */
export const isInfinite: typeof Numbers.isInfinite;
/**
 * Determines whether a value is primitive `NaN`.
 *
 * Unlike the other numeric predicates, this does not unwrap `Number` boxes. Boxed `NaN` returns `false`. This follows
 * `Number.isNaN`, not the coercing global `isNaN`.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the value is primitive `NaN`; otherwise `false`.
 * @see docs/API.md#isnanvalue
 */
export const isNaN: typeof Numbers.isNaN;
/**
 * Determines whether a value is an even integer.
 *
 * Both signed zeros are even. Parity describes the represented number, including unsafe integer
 * values. Primitive numbers and genuine `Number` boxes are supported; unrelated values return
 * `false` without conversion hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is a finite even integer; otherwise `false`.
 * @see docs/API.md#isevenvalue
 */
export const isEven: typeof Numbers.isEven;
/**
 * Determines whether a value is an odd integer.
 *
 * Negative odd integers are supported. Fractions, non-finite values and both signed zeros return
 * `false`. Primitive numbers and genuine `Number` boxes are supported; unrelated values return
 * `false` without conversion hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is a finite odd integer; otherwise `false`.
 * @see docs/API.md#isoddvalue
 */
export const isOdd: typeof Numbers.isOdd;
/**
 * Determines whether a value is a number greater than zero.
 *
 * Positive infinity is accepted; both signed zeros and `NaN` return `false`. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is greater than zero; otherwise `false`.
 * @see docs/API.md#ispositivevalue
 */
export const isPositive: typeof Numbers.isPositive;
/**
 * Determines whether a value is a number less than zero.
 *
 * Negative infinity is accepted; both signed zeros and `NaN` return `false`. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is less than zero; otherwise `false`.
 * @see docs/API.md#isnegativevalue
 */
export const isNegative: typeof Numbers.isNegative;
/**
 * Determines whether a value is either signed zero.
 *
 * This is an exact zero check; use `isClose` for tolerance-based comparison. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is `0` or `-0`; otherwise `false`.
 * @see docs/API.md#iszerovalue
 */
export const isZero: typeof Numbers.isZero;
/**
 * Determines whether a value is a number greater than or equal to zero.
 *
 * Both signed zeros and positive infinity are accepted; `NaN` returns `false`. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is zero or positive; otherwise `false`.
 * @see docs/API.md#iszeroorpositivevalue
 */
export const isZeroOrPositive: typeof Numbers.isZeroOrPositive;
/**
 * Determines whether a value is a number less than or equal to zero.
 *
 * Both signed zeros and negative infinity are accepted; `NaN` returns `false`. Primitive numbers
 * and genuine `Number` boxes are supported; unrelated values return `false` without conversion
 * hooks.
 *
 * @param {unknown} value The value to inspect.
 * @returns {boolean} `true` if the numeric value is zero or negative; otherwise `false`.
 * @see docs/API.md#iszeroornegativevalue
 */
export const isZeroOrNegative: typeof Numbers.isZeroOrNegative;
/**
 * Extracts the first decimal or scientific number, or standalone `Infinity`/`NaN` token, from
 * text.
 *
 * Primitive numbers pass through. Genuine number/string boxes are unwrapped; other objects can
 * supply `toString` once. This is extraction, not validation.
 *
 * @template [T=undefined]
 * @param {unknown} value The value to parse.
 * @param {T} [defaultValue] Returned unchanged when parsing fails; not converted or invoked.
 * Omitted means `undefined`.
 * @returns {number | T | undefined} The extracted number, or the exact fallback when no
 * supported value is found. Without a fallback, failure returns `undefined`.
 * @remarks Errors from deliberately invoked `toString` getters or methods propagate unchanged.
 * Unsupported inputs or unmatched text return the fallback; recognised `NaN` and infinities are
 * successful parses.
 * @see docs/API.md#parsevalue-defaultvalue
 */
export const parse: typeof Numbers.parse;
/**
 * Parses an entire numeric string without trimming or accepting trailing text.
 *
 * Uses the legacy parsing input policy, including explicit object-to-string conversion.
 * Full-string syntax does not imply a finite or application-valid result.
 *
 * @template [T=undefined]
 * @param {unknown} value The value to parse.
 * @param {T} [defaultValue] Returned unchanged when parsing fails; not converted or invoked.
 * Omitted means `undefined`.
 * @returns {number | T | undefined} The parsed number, or the exact fallback on failure.
 * Recognised `NaN` and infinities remain numeric results.
 * @remarks Errors from deliberately invoked `toString` getters or methods propagate unchanged.
 * Unsupported inputs or unmatched text return the fallback; recognised `NaN` and infinities are
 * successful parses.
 * @see docs/API.md#parsestrictvalue-defaultvalue
 */
export const parseStrict: typeof Numbers.parseStrict;
/**
 * Returns the parsed finite number rounded down to an integer.
 *
 * Uses the legacy `parse` conversion policy. Negative fractions round toward negative infinity,
 * not toward zero. Signed zero is preserved.
 *
 * @template [T=undefined]
 * @param {unknown} value The value to parse.
 * @param {T} [defaultValue] Returned unchanged when parsing fails; not converted or invoked.
 * Omitted means `undefined`.
 * @returns {number | T | undefined} The floored number, or the exact fallback for missing or
 * non-finite input. Without a fallback, failure returns `undefined`.
 * @remarks Errors from the legacy parser's object conversion getters or methods propagate
 * unchanged. Missing or non-finite parsed values return the fallback.
 * @see docs/API.md#getintegervalue-defaultvalue
 */
export const getInteger: typeof Numbers.getInteger;
/**
 * Returns the nonnegative fractional digits of a finite number's shortest decimal
 * representation.
 *
 * Obtains its input through `parse`. This is not the binary remainder and cannot recover decimal
 * digits lost during numeric conversion.
 *
 * @template [T=undefined]
 * @param {unknown} value The value to parse.
 * @param {T} [defaultValue] Returned unchanged when parsing fails; not converted or invoked.
 * Omitted means `undefined`.
 * @returns {number | T | undefined} A number in `[0, 1)`, or the exact fallback for missing or
 * non-finite input. Integer inputs and signed zeros produce positive zero.
 * @remarks Errors from the legacy parser's object conversion getters or methods propagate
 * unchanged. Missing or non-finite parsed values return the fallback.
 * @see docs/API.md#getfractionvalue-defaultvalue
 */
export const getFraction: typeof Numbers.getFraction;
/**
 * Extracts the first decimal or scientific number, or standalone `Infinity`/`NaN` token, from
 * text.
 *
 * An exact alias of `parse`, including identity, input conversion and fallback rules.
 *
 * @template [T=undefined]
 * @param {unknown} value The value to parse.
 * @param {T} [defaultValue] Returned unchanged when parsing fails; not converted or invoked.
 * Omitted means `undefined`.
 * @returns {number | T | undefined} The extracted number, or the exact fallback when no
 * supported value is found. Without a fallback, failure returns `undefined`.
 * @remarks Errors from deliberately invoked `toString` getters or methods propagate unchanged.
 * Unsupported inputs or unmatched text return the fallback; recognised `NaN` and infinities are
 * successful parses.
 * @see docs/API.md#parsevalue-defaultvalue
 */
export const extractNumber: typeof Numbers.extractNumber;
/**
 * Parses a complete decimal or scientific value and requires a finite result.
 *
 * Accepts primitive numbers/strings and genuine boxes without arbitrary object conversion. No
 * implicit trimming. Numeric conversion can still round digits or underflow to signed zero.
 *
 * @template [T=undefined]
 * @param {unknown} value The value to parse.
 * @param {T} [defaultValue] Returned unchanged when parsing fails; not converted or invoked.
 * Omitted means `undefined`.
 * @returns {number | T | undefined} The finite parsed number, or the exact fallback on invalid
 * or non-finite input. Without a fallback, failure returns `undefined`.
 * @remarks Ordinary input mismatches return the fallback without invoking arbitrary conversion
 * hooks.
 * @see docs/API.md#parsefinitevalue-defaultvalue
 */
export const parseFinite: typeof Numbers.parseFinite;
/**
 * Parses signed decimal digits or accepts an already-represented safe integer, without
 * truncation.
 *
 * String input rejects decimal points, exponents and whitespace before conversion. Genuine
 * number/string boxes are supported; arbitrary objects are rejected. Signed zero and fallback
 * identity are preserved.
 *
 * @template [T=undefined]
 * @param {unknown} value The value to parse.
 * @param {T} [defaultValue] Returned unchanged when parsing fails; not converted or invoked.
 * Omitted means `undefined`.
 * @returns {number | T | undefined} The safe integer, or the exact fallback on failure. Without
 * a fallback, failure returns `undefined`.
 * @remarks Ordinary input mismatches return the fallback without invoking arbitrary conversion
 * hooks.
 * @see docs/API.md#parsesafeintegervalue-defaultvalue
 */
export const parseSafeInteger: typeof Numbers.parseSafeInteger;
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
 * @see docs/API.md#clampvalue-min-max
 */
export const clamp: typeof Numbers.clamp;
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
 * @see docs/API.md#isinrangevalue-min-max-options
 */
export const isInRange: typeof Numbers.isInRange;
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
 * @see docs/API.md#roundvalue-decimalplaces
 */
export const round: typeof Numbers.round;
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
 * @see docs/API.md#isclosea-b-options
 */
export const isClose: typeof Numbers.isClose;

/**
 * Rounds a number's shortest decimal representation toward positive infinity at a chosen
 * precision.
 *
 * Precision must be a primitive integer from `-308` through `324` and is validated before
 * special-value handling. Genuine number boxes are accepted. Negative results rounded to zero
 * produce `-0`; results remain binary numbers.
 *
 * @param {number | Number} value The primitive number or genuine `Number` box.
 * @param {number} [decimalPlaces=0] Decimal places; negative values round tens, hundreds and
 * larger powers of ten.
 * @returns {number} The upward-rounded number. `NaN`, infinities and signed zero pass through;
 * overflow produces signed infinity.
 * @remarks `TypeError` for unsupported value types or non-number precision. `RangeError` for
 * non-integral, non-finite or out-of-range precision, even when the input is non-finite.
 * @see docs/API.md#ceilvalue-decimalplaces
 */
export const ceil: typeof Numbers.ceil;
/**
 * Rounds a number's shortest decimal representation toward negative infinity at a chosen
 * precision.
 *
 * Precision must be a primitive integer from `-308` through `324` and is validated before
 * special-value handling. Genuine number boxes are accepted. Negative results rounded to zero
 * produce `-0`; results remain binary numbers.
 *
 * @param {number | Number} value The primitive number or genuine `Number` box.
 * @param {number} [decimalPlaces=0] Decimal places; negative values round tens, hundreds and
 * larger powers of ten.
 * @returns {number} The downward-rounded number. `NaN`, infinities and signed zero pass through;
 * overflow produces signed infinity.
 * @remarks `TypeError` for unsupported value types or non-number precision. `RangeError` for
 * non-integral, non-finite or out-of-range precision, even when the input is non-finite.
 * @see docs/API.md#floorvalue-decimalplaces
 */
export const floor: typeof Numbers.floor;
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
 * @see docs/API.md#roundtovalue-step
 */
export const roundTo: typeof Numbers.roundTo;
/**
 * Wraps a finite numeric value into the positive half-open interval `[0, modulus)`.
 *
 * The modulus must be finite and positive and is validated first. Genuine number boxes are
 * accepted. A negative correction that rounds to the excluded upper endpoint uses its
 * representable predecessor.
 *
 * @param {number | Number} value The finite primitive number or genuine `Number` box.
 * @param {number | Number} modulus The finite, strictly positive modulus.
 * @returns {number} The binary remainder adjusted into `[0, modulus)`. All zero results are
 * positive zero.
 * @remarks `TypeError` for unsupported operand types. `RangeError` for a non-finite value or a
 * zero, negative or non-finite modulus.
 * @see docs/API.md#modulovalue-modulus
 */
export const modulo: typeof Numbers.modulo;

export type RangeOptions = Numbers.RangeOptions;
export type CloseOptions = Numbers.CloseOptions;
