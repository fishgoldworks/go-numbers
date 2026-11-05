import numbers = require('go-numbers');
import isOdd = require('go-numbers/isOdd');
import legacyOdd = require('go-numbers/src/isOdd.js');
import legacyParse = require('go-numbers/src/parseInt');
import legacyAggregate = require('go-numbers/src/Numbers');

const input: unknown = '12.5';
const predicate: boolean = numbers.isOdd(input);
const directPredicate: boolean = isOdd(input);
const legacyPredicate: boolean = legacyOdd(input);
const result: number | undefined = numbers.parse(input);
const numericResult: number = numbers.parse(12);
const primitiveStrict: number = numbers.parseStrict(12, null);
const nullable: number | null = numbers.parseStrict(input, null);
const sentinel: number | 'missing' = numbers.getFraction(input, 'missing' as const);
const integer: number | undefined = numbers.getInteger(input);
const boxed: number | undefined = numbers.parse(new Number(12));
const legacyResult: number | null = legacyParse(input, null);
const metadata: number = legacyAggregate.EPSILON;
const negativeZero: number = numbers.parse(-0);

// Predicates accepting boxed numbers must not unsoundly narrow unknown to number.
if (numbers.isInteger(input)) {
  // @ts-expect-error a true result can be a Number object, not a primitive number
  const unsafeNarrowing: number = input;
}
// @ts-expect-error an omitted fallback leaves undefined in the result
const mustHandleFailure: number = numbers.getFraction(input);
// @ts-expect-error a null fallback cannot be treated as a guaranteed number
const mustHandleNull: number = numbers.parseStrict(input, null);
// @ts-expect-error random generation is outside this package
numbers.randomInt(5);
// @ts-expect-error arbitrary private helpers are not public package paths
import privateHelper = require('go-numbers/src/internal/unwrapNumber');

// Additive 0.2 API: public, individual, and legacy-compatible import paths.
import parseFinite = require('go-numbers/parseFinite');
import parseSafeInteger = require('go-numbers/parseSafeInteger');
import extractNumber = require('go-numbers/extractNumber');
import clamp = require('go-numbers/clamp');
import isInRange = require('go-numbers/isInRange');
import round = require('go-numbers/round');
import isClose = require('go-numbers/isClose');
import directRange = require('go-numbers/src/isInRange.js');
import directRound = require('go-numbers/src/round');
const finite: number | null = parseFinite(input, null);
const finiteOmitted: number | undefined = parseFinite(12);
const integerNullable: number | null = parseSafeInteger(input, null);
const safeOmitted: number | undefined = parseSafeInteger(12);
const literalExtract: number = extractNumber(12);
const parsedSentinel = { missing: true } as const;
const finiteSentinel: number | typeof parsedSentinel = numbers.parseFinite(input, parsedSentinel);
const integerSentinel: number | typeof parsedSentinel = numbers.parseSafeInteger(input, parsedSentinel);
const zoom: number = clamp(new Number(1), 0, new Number(2));
const rangeOptions: numbers.RangeOptions = { includeMin: undefined, includeMax: false };
const rangeCheck: boolean = isInRange(input, 0, 10, rangeOptions);
const rangeDirect: boolean = directRange(input, new Number(0), new Number(10));
const rounded: number = round(new Number(1.005), 2);
const roundedDirect: number = directRound(1260, -2);
const closeOptions: numbers.CloseOptions = { absoluteTolerance: 0.5, relativeTolerance: undefined };
const closeCheck: boolean = isClose(input, 1, closeOptions);
const aliasCheck: typeof numbers.parse = extractNumber;
// @ts-expect-error finite parsers can reject a primitive number (NaN/Infinity)
const invalidFiniteNarrowing: number = parseFinite(Infinity, null);
// @ts-expect-error safe-integer parsers can reject a primitive number (fractions)
const invalidIntegerNarrowing: number = parseSafeInteger(1.5, null);
// @ts-expect-error arithmetic does not accept numeric strings
clamp('1', 0, 2);
// @ts-expect-error rounding is not a string parser
round('1.005', 2);
// @ts-expect-error precision must be a primitive number
round(1, new Number(2));
// @ts-expect-error invalid option name
isInRange(1, 0, 2, { inclusive: false });
// @ts-expect-error range flags must be booleans
isInRange(1, 0, 2, { includeMax: 1 });
// @ts-expect-error tolerances must be primitive numbers
isClose(1, 2, { relativeTolerance: '0.1' });
if (isInRange(input, 0, 10) || isClose(input, 5)) {
  // @ts-expect-error numeric predicates also accept boxes, so they are not type guards
  const noNarrowing: number = input;
}

import ceil = require('go-numbers/ceil');
import floor = require('go-numbers/floor');
import roundTo = require('go-numbers/roundTo');
import modulo = require('go-numbers/modulo');
import ceilLegacy = require('go-numbers/src/ceil.js');
const directional: number[] = [ceil(1.1, 2), floor(0.29, 2), ceilLegacy(-1.239, 2)];
const gridAndCycle: number[] = [roundTo(0.15, 0.1), modulo(-1, 5)];
const boxedNew: number[] = [
  ceil(new Number(1.1), 2),
  floor(new Number(0.29), 2),
  roundTo(new Number(0.15), new Number(0.1)),
  modulo(new Number(-1), new Number(5))
];
// @ts-expect-error step is required
roundTo(1);
// @ts-expect-error modulus is required
modulo(1);
// @ts-expect-error numeric-only arithmetic does not parse text
ceil('1.1', 2);
// @ts-expect-error precision must be primitive
floor(1, new Number(2));
// @ts-expect-error bigint arithmetic is outside this API
modulo(1n, 5n);
