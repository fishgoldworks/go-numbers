import numbers, {
  isInteger,
  isSafeInteger,
  isFinite,
  isInfinite,
  isNaN,
  isEven,
  isOdd,
  isPositive,
  isNegative,
  isZero,
  isZeroOrPositive,
  isZeroOrNegative,
  parse,
  parseStrict,
  getInteger,
  getFraction,
  EPSILON,
  MAX_SAFE_INTEGER,
  MIN_SAFE_INTEGER,
  MAX_VALUE,
  MIN_VALUE,
  NEGATIVE_INFINITY,
  POSITIVE_INFINITY,
  NaN as NOT_A_NUMBER
} from 'go-numbers';
import odd from 'go-numbers/isOdd';
import strict from 'go-numbers/parseStrict';

const input: unknown = new Number(3);
const checks: boolean[] = [
  isInteger(input),
  isSafeInteger(input),
  isFinite(input),
  isInfinite(input),
  isNaN(input),
  isEven(input),
  isOdd(input),
  isPositive(input),
  isNegative(input),
  isZero(input),
  isZeroOrPositive(input),
  isZeroOrNegative(input)
];
const constants: number[] = [
  EPSILON,
  MAX_SAFE_INTEGER,
  MIN_SAFE_INTEGER,
  MAX_VALUE,
  MIN_VALUE,
  NEGATIVE_INFINITY,
  POSITIVE_INFINITY,
  NOT_A_NUMBER
];
const extracted: number | undefined = parse(input);
const strictResult: number | null = strict(input, null);
const parts: (number | undefined)[] = [getInteger(input), getFraction(input)];
const literalNumber: number = parseStrict(NaN);
const fallback = { missing: true } as const;
const objectFallback: number | typeof fallback = numbers.parse(input, fallback);
const namedPredicate: boolean = odd(input);
// @ts-expect-error predicates return booleans, not numbers
const incorrect: number = isOdd(input);
// @ts-expect-error a nullable fallback cannot be ignored
const unchecked: number = parseStrict(input, null);

import {
  extractNumber,
  parseFinite,
  parseSafeInteger,
  clamp,
  isInRange,
  round,
  isClose,
  type RangeOptions,
  type CloseOptions
} from 'go-numbers';
import finiteDirect from 'go-numbers/parseFinite';
import safeDirect from 'go-numbers/parseSafeInteger';
import extractDirect from 'go-numbers/extractNumber';
import clampDirect from 'go-numbers/clamp';
import rangeDirect from 'go-numbers/isInRange';
import roundDirect from 'go-numbers/round';
import closeDirect from 'go-numbers/isClose';
const addedNumbers: Array<number | undefined> = [parseFinite(input), parseSafeInteger(input), extractNumber(input)];
const finiteTyped: number | null = finiteDirect(input, null);
const safeTyped: number | false = safeDirect(input, false);
const exactAlias: typeof parse = extractDirect;
const configuredRange: RangeOptions = { includeMax: false, includeMin: undefined };
const configuredClose: CloseOptions = { relativeTolerance: 0, absoluteTolerance: 0.5 };
const rangeResult: boolean = isInRange(input, 0, 10, configuredRange);
const closeResult: boolean = isClose(input, 2, configuredClose);
const arithmetic: number[] = [clamp(10, 0, 5), round(1.005, 2), clampDirect(10, 0, 5), roundDirect(1.005, 2)];
const comparisons: boolean[] = [rangeDirect(input, 0, 1), closeDirect(input, 1)];
const defaultObjectCall: number | null = numbers.parseFinite(input, null);
// @ts-expect-error safe integer parsing may fail even on number input
const uncheckedSafe: number = parseSafeInteger(1.5);
// @ts-expect-error finite parsing may fail even on number input
const uncheckedFinite: number = parseFinite(NaN);

import { ceil, floor, roundTo, modulo } from 'go-numbers';
import ceilDirect from 'go-numbers/ceil';
import floorDirect from 'go-numbers/floor';
import stepDirect from 'go-numbers/roundTo';
import moduloDirect from 'go-numbers/modulo';
import moduloLegacy from 'go-numbers/src/modulo.js';
const extendedArithmetic: number[] = [
  ceil(1.1, 2),
  floor(0.29, 2),
  roundTo(0.15, 0.1),
  modulo(-1, 5),
  ceilDirect(1.1, 2),
  floorDirect(0.29, 2),
  stepDirect(0.15, 0.1),
  moduloDirect(-1, 5),
  moduloLegacy(-15, 360),
  numbers.roundTo(1.37, 0.25)
];
// @ts-expect-error a positive step still must be supplied
roundTo(1);
// @ts-expect-error modulo requires numeric inputs, not strings
modulo('-1', 5);
// @ts-expect-error decimal precision is not an options object
ceil(1, { precision: 2 });

// map passes its index as argument two; these calls compile but have the wrong
// runtime intent. The README recommends explicit unary wrappers, not overload hacks.
const callbackTraps: unknown[][] = [['10', 'bad'].map(parseFinite), [1.234, 1.234].map(round)];
const safeCallbacks: Array<number | null> = ['10', 'bad'].map((value) => parseFinite(value, null));
