// Named exports bypass the aggregate so bundlers can discard unused functions.
// The default still shares the exact CommonJS object; Node evaluates eagerly.
export { default } from './index.js';

export const EPSILON = Number.EPSILON;
export const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
export const MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER;
export const MAX_VALUE = Number.MAX_VALUE;
export const MIN_VALUE = Number.MIN_VALUE;
export const NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;
export const POSITIVE_INFINITY = Number.POSITIVE_INFINITY;
const notANumber = Number.NaN;
export { notANumber as NaN };

export { default as isInteger } from './src/isInteger.js';
export { default as isSafeInteger } from './src/isSafeInteger.js';
export { default as isFinite } from './src/isFinite.js';
export { default as isInfinite } from './src/isInfinite.js';
export { default as isNaN } from './src/isNaN.js';
export { default as isEven } from './src/isEven.js';
export { default as isOdd } from './src/isOdd.js';
export { default as isPositive } from './src/isPositive.js';
export { default as isNegative } from './src/isNegative.js';
export { default as isZero } from './src/isZero.js';
export { default as isZeroOrPositive } from './src/isZeroOrPositive.js';
export { default as isZeroOrNegative } from './src/isZeroOrNegative.js';
export { default as parse } from './src/parse.js';
export { default as parseStrict } from './src/parseStrict.js';
export { default as getInteger } from './src/getInteger.js';
export { default as getFraction } from './src/getFraction.js';
export { default as extractNumber } from './src/extractNumber.js';
export { default as parseFinite } from './src/parseFinite.js';
export { default as parseSafeInteger } from './src/parseSafeInteger.js';
export { default as clamp } from './src/clamp.js';
export { default as isInRange } from './src/isInRange.js';
export { default as round } from './src/round.js';
export { default as isClose } from './src/isClose.js';
export { default as ceil } from './src/ceil.js';
export { default as floor } from './src/floor.js';
export { default as roundTo } from './src/roundTo.js';
export { default as modulo } from './src/modulo.js';
