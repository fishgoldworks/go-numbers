import Numbers = require('../index.js');

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
 * @see ../docs/API.md#getfractionvalue-defaultvalue
 */
declare const getFraction: typeof Numbers.getFraction;
export = getFraction;
