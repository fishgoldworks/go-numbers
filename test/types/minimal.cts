// ES5-lib declaration consumer: this checks ambient dependencies, not runtime support.
import numbers = require('go-numbers');
import parseFiniteLeaf = require('go-numbers/parseFinite');
import legacyParse = require('go-numbers/src/parseInt.js');
import aggregate = require('go-numbers/src/Numbers');
type RangeOptions = numbers.RangeOptions;
type CloseOptions = numbers.CloseOptions;

import rootAlias = require('go-numbers/index.js');

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
declare const input: unknown;
const box: InstanceType<NumberConstructor> = new Number(1);
const fallback = { status: 'missing' } as const;
const isInteger: boolean = numbers.isInteger(input);
const isSafeInteger: boolean = numbers.isSafeInteger(input);
const isFinite: boolean = numbers.isFinite(input);
const isInfinite: boolean = numbers.isInfinite(input);
const isNaN: boolean = numbers.isNaN(input);
const isEven: boolean = numbers.isEven(input);
const isOdd: boolean = numbers.isOdd(input);
const isPositive: boolean = numbers.isPositive(input);
const isNegative: boolean = numbers.isNegative(input);
const isZero: boolean = numbers.isZero(input);
const isZeroOrPositive: boolean = numbers.isZeroOrPositive(input);
const isZeroOrNegative: boolean = numbers.isZeroOrNegative(input);
const parse = numbers.parse(input, fallback);
type parseResult = Assert<Equal<typeof parse, number | typeof fallback>>;
const parseStrict = numbers.parseStrict(input, fallback);
type parseStrictResult = Assert<Equal<typeof parseStrict, number | typeof fallback>>;
const extractNumber = numbers.extractNumber(input, fallback);
type extractNumberResult = Assert<Equal<typeof extractNumber, number | typeof fallback>>;
const parseFinite = numbers.parseFinite(input, fallback);
type parseFiniteResult = Assert<Equal<typeof parseFinite, number | typeof fallback>>;
const parseSafeInteger = numbers.parseSafeInteger(input, fallback);
type parseSafeIntegerResult = Assert<Equal<typeof parseSafeInteger, number | typeof fallback>>;
const getInteger = numbers.getInteger(input, fallback);
type getIntegerResult = Assert<Equal<typeof getInteger, number | typeof fallback>>;
const getFraction = numbers.getFraction(input, fallback);
type getFractionResult = Assert<Equal<typeof getFraction, number | typeof fallback>>;
const clamp: number = numbers.clamp(box, 0, 2);
const rangeOptions: RangeOptions = { includeMin: undefined, includeMax: true };
const closeOptions: CloseOptions = { absoluteTolerance: 0, relativeTolerance: undefined };
const range: boolean = numbers.isInRange(input, 0, 2, rangeOptions);
const close: boolean = numbers.isClose(input, box, closeOptions);
const round: number = numbers.round(box, 2);
const ceil: number = numbers.ceil(box, 2);
const floor: number = numbers.floor(box, 2);
const step: number = numbers.roundTo(box, 0.25);
const modulo: number = numbers.modulo(box, 3);
const constants: number[] = [
  numbers.EPSILON,
  numbers.MAX_SAFE_INTEGER,
  numbers.MIN_SAFE_INTEGER,
  numbers.MAX_VALUE,
  numbers.MIN_VALUE,
  numbers.NEGATIVE_INFINITY,
  numbers.POSITIVE_INFINITY,
  numbers.NaN
];
const focused = parseFiniteLeaf(input, null);
type Focused = Assert<Equal<typeof focused, number | null>>;
const aliased = legacyParse(input, null);
type Aliased = Assert<Equal<typeof aliased, number | null>>;
type Alias = Assert<Equal<typeof legacyParse, typeof numbers.parse>>;
type RootAlias = Assert<Equal<typeof rootAlias, typeof numbers>>;
type Aggregate = Assert<Equal<typeof aggregate, typeof numbers>>;
// @ts-expect-error no DOM ambient library
const ambientDocument = document;
// @ts-expect-error no Node ambient library
const ambientProcess = process;
// @ts-expect-error ES5 lib intentionally has no BigInt constructor
const ambientBigInt = BigInt;
// @ts-expect-error ES5 lib intentionally has no Symbol constructor
const ambientSymbol = Symbol;
// @ts-expect-error ES5 lib intentionally has no Promise constructor
const ambientPromise = Promise;
