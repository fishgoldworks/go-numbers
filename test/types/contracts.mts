// Contract fixtures are compile-only; every @ts-expect-error must reject a real misuse.
import numbers, { type RangeOptions, type CloseOptions } from 'go-numbers';
import direct_ceil_0 from 'go-numbers/ceil';
import direct_ceil_1 from 'go-numbers/src/ceil';
import direct_ceil_2 from 'go-numbers/src/ceil.js';
import direct_clamp_0 from 'go-numbers/clamp';
import direct_clamp_1 from 'go-numbers/src/clamp';
import direct_clamp_2 from 'go-numbers/src/clamp.js';
import direct_extractNumber_0 from 'go-numbers/extractNumber';
import direct_extractNumber_1 from 'go-numbers/src/extractNumber';
import direct_extractNumber_2 from 'go-numbers/src/extractNumber.js';
import direct_floor_0 from 'go-numbers/floor';
import direct_floor_1 from 'go-numbers/src/floor';
import direct_floor_2 from 'go-numbers/src/floor.js';
import direct_getFraction_0 from 'go-numbers/getFraction';
import direct_getFraction_1 from 'go-numbers/src/getFraction';
import direct_getFraction_2 from 'go-numbers/src/getFraction.js';
import direct_getInteger_0 from 'go-numbers/getInteger';
import direct_getInteger_1 from 'go-numbers/src/getInteger';
import direct_getInteger_2 from 'go-numbers/src/getInteger.js';
import direct_isClose_0 from 'go-numbers/isClose';
import direct_isClose_1 from 'go-numbers/src/isClose';
import direct_isClose_2 from 'go-numbers/src/isClose.js';
import direct_isEven_0 from 'go-numbers/isEven';
import direct_isEven_1 from 'go-numbers/src/isEven';
import direct_isEven_2 from 'go-numbers/src/isEven.js';
import direct_isFinite_0 from 'go-numbers/isFinite';
import direct_isFinite_1 from 'go-numbers/src/isFinite';
import direct_isFinite_2 from 'go-numbers/src/isFinite.js';
import direct_isInRange_0 from 'go-numbers/isInRange';
import direct_isInRange_1 from 'go-numbers/src/isInRange';
import direct_isInRange_2 from 'go-numbers/src/isInRange.js';
import direct_isInfinite_0 from 'go-numbers/isInfinite';
import direct_isInfinite_1 from 'go-numbers/src/isInfinite';
import direct_isInfinite_2 from 'go-numbers/src/isInfinite.js';
import direct_isInteger_0 from 'go-numbers/isInteger';
import direct_isInteger_1 from 'go-numbers/src/isInteger';
import direct_isInteger_2 from 'go-numbers/src/isInteger.js';
import direct_isNaN_0 from 'go-numbers/isNaN';
import direct_isNaN_1 from 'go-numbers/src/isNaN';
import direct_isNaN_2 from 'go-numbers/src/isNaN.js';
import direct_isNegative_0 from 'go-numbers/isNegative';
import direct_isNegative_1 from 'go-numbers/src/isNegative';
import direct_isNegative_2 from 'go-numbers/src/isNegative.js';
import direct_isOdd_0 from 'go-numbers/isOdd';
import direct_isOdd_1 from 'go-numbers/src/isOdd';
import direct_isOdd_2 from 'go-numbers/src/isOdd.js';
import direct_isPositive_0 from 'go-numbers/isPositive';
import direct_isPositive_1 from 'go-numbers/src/isPositive';
import direct_isPositive_2 from 'go-numbers/src/isPositive.js';
import direct_isSafeInteger_0 from 'go-numbers/isSafeInteger';
import direct_isSafeInteger_1 from 'go-numbers/src/isSafeInteger';
import direct_isSafeInteger_2 from 'go-numbers/src/isSafeInteger.js';
import direct_isZero_0 from 'go-numbers/isZero';
import direct_isZero_1 from 'go-numbers/src/isZero';
import direct_isZero_2 from 'go-numbers/src/isZero.js';
import direct_isZeroOrNegative_0 from 'go-numbers/isZeroOrNegative';
import direct_isZeroOrNegative_1 from 'go-numbers/src/isZeroOrNegative';
import direct_isZeroOrNegative_2 from 'go-numbers/src/isZeroOrNegative.js';
import direct_isZeroOrPositive_0 from 'go-numbers/isZeroOrPositive';
import direct_isZeroOrPositive_1 from 'go-numbers/src/isZeroOrPositive';
import direct_isZeroOrPositive_2 from 'go-numbers/src/isZeroOrPositive.js';
import direct_modulo_0 from 'go-numbers/modulo';
import direct_modulo_1 from 'go-numbers/src/modulo';
import direct_modulo_2 from 'go-numbers/src/modulo.js';
import direct_parse_0 from 'go-numbers/parse';
import direct_parse_1 from 'go-numbers/src/parse';
import direct_parse_2 from 'go-numbers/src/parse.js';
import direct_parseFinite_0 from 'go-numbers/parseFinite';
import direct_parseFinite_1 from 'go-numbers/src/parseFinite';
import direct_parseFinite_2 from 'go-numbers/src/parseFinite.js';
import direct_parseSafeInteger_0 from 'go-numbers/parseSafeInteger';
import direct_parseSafeInteger_1 from 'go-numbers/src/parseSafeInteger';
import direct_parseSafeInteger_2 from 'go-numbers/src/parseSafeInteger.js';
import direct_parseStrict_0 from 'go-numbers/parseStrict';
import direct_parseStrict_1 from 'go-numbers/src/parseStrict';
import direct_parseStrict_2 from 'go-numbers/src/parseStrict.js';
import direct_round_0 from 'go-numbers/round';
import direct_round_1 from 'go-numbers/src/round';
import direct_round_2 from 'go-numbers/src/round.js';
import direct_roundTo_0 from 'go-numbers/roundTo';
import direct_roundTo_1 from 'go-numbers/src/roundTo';
import direct_roundTo_2 from 'go-numbers/src/roundTo.js';
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
declare const input: unknown;
const fallbackRecord = { missing: true } as const;
declare const fallbackSymbol: unique symbol;
const fallbackCallback = () => 'fallback' as const;
const fallbackTuple = ['missing', 1] as const;
type Same_ceil_0 = Assert<Equal<typeof direct_ceil_0, typeof numbers.ceil>>;
type Same_ceil_1 = Assert<Equal<typeof direct_ceil_1, typeof numbers.ceil>>;
type Same_ceil_2 = Assert<Equal<typeof direct_ceil_2, typeof numbers.ceil>>;
type Same_clamp_0 = Assert<Equal<typeof direct_clamp_0, typeof numbers.clamp>>;
type Same_clamp_1 = Assert<Equal<typeof direct_clamp_1, typeof numbers.clamp>>;
type Same_clamp_2 = Assert<Equal<typeof direct_clamp_2, typeof numbers.clamp>>;
type Same_extractNumber_0 = Assert<Equal<typeof direct_extractNumber_0, typeof numbers.extractNumber>>;
type Same_extractNumber_1 = Assert<Equal<typeof direct_extractNumber_1, typeof numbers.extractNumber>>;
type Same_extractNumber_2 = Assert<Equal<typeof direct_extractNumber_2, typeof numbers.extractNumber>>;
type Same_floor_0 = Assert<Equal<typeof direct_floor_0, typeof numbers.floor>>;
type Same_floor_1 = Assert<Equal<typeof direct_floor_1, typeof numbers.floor>>;
type Same_floor_2 = Assert<Equal<typeof direct_floor_2, typeof numbers.floor>>;
type Same_getFraction_0 = Assert<Equal<typeof direct_getFraction_0, typeof numbers.getFraction>>;
type Same_getFraction_1 = Assert<Equal<typeof direct_getFraction_1, typeof numbers.getFraction>>;
type Same_getFraction_2 = Assert<Equal<typeof direct_getFraction_2, typeof numbers.getFraction>>;
type Same_getInteger_0 = Assert<Equal<typeof direct_getInteger_0, typeof numbers.getInteger>>;
type Same_getInteger_1 = Assert<Equal<typeof direct_getInteger_1, typeof numbers.getInteger>>;
type Same_getInteger_2 = Assert<Equal<typeof direct_getInteger_2, typeof numbers.getInteger>>;
type Same_isClose_0 = Assert<Equal<typeof direct_isClose_0, typeof numbers.isClose>>;
type Same_isClose_1 = Assert<Equal<typeof direct_isClose_1, typeof numbers.isClose>>;
type Same_isClose_2 = Assert<Equal<typeof direct_isClose_2, typeof numbers.isClose>>;
type Same_isEven_0 = Assert<Equal<typeof direct_isEven_0, typeof numbers.isEven>>;
type Same_isEven_1 = Assert<Equal<typeof direct_isEven_1, typeof numbers.isEven>>;
type Same_isEven_2 = Assert<Equal<typeof direct_isEven_2, typeof numbers.isEven>>;
type Same_isFinite_0 = Assert<Equal<typeof direct_isFinite_0, typeof numbers.isFinite>>;
type Same_isFinite_1 = Assert<Equal<typeof direct_isFinite_1, typeof numbers.isFinite>>;
type Same_isFinite_2 = Assert<Equal<typeof direct_isFinite_2, typeof numbers.isFinite>>;
type Same_isInRange_0 = Assert<Equal<typeof direct_isInRange_0, typeof numbers.isInRange>>;
type Same_isInRange_1 = Assert<Equal<typeof direct_isInRange_1, typeof numbers.isInRange>>;
type Same_isInRange_2 = Assert<Equal<typeof direct_isInRange_2, typeof numbers.isInRange>>;
type Same_isInfinite_0 = Assert<Equal<typeof direct_isInfinite_0, typeof numbers.isInfinite>>;
type Same_isInfinite_1 = Assert<Equal<typeof direct_isInfinite_1, typeof numbers.isInfinite>>;
type Same_isInfinite_2 = Assert<Equal<typeof direct_isInfinite_2, typeof numbers.isInfinite>>;
type Same_isInteger_0 = Assert<Equal<typeof direct_isInteger_0, typeof numbers.isInteger>>;
type Same_isInteger_1 = Assert<Equal<typeof direct_isInteger_1, typeof numbers.isInteger>>;
type Same_isInteger_2 = Assert<Equal<typeof direct_isInteger_2, typeof numbers.isInteger>>;
type Same_isNaN_0 = Assert<Equal<typeof direct_isNaN_0, typeof numbers.isNaN>>;
type Same_isNaN_1 = Assert<Equal<typeof direct_isNaN_1, typeof numbers.isNaN>>;
type Same_isNaN_2 = Assert<Equal<typeof direct_isNaN_2, typeof numbers.isNaN>>;
type Same_isNegative_0 = Assert<Equal<typeof direct_isNegative_0, typeof numbers.isNegative>>;
type Same_isNegative_1 = Assert<Equal<typeof direct_isNegative_1, typeof numbers.isNegative>>;
type Same_isNegative_2 = Assert<Equal<typeof direct_isNegative_2, typeof numbers.isNegative>>;
type Same_isOdd_0 = Assert<Equal<typeof direct_isOdd_0, typeof numbers.isOdd>>;
type Same_isOdd_1 = Assert<Equal<typeof direct_isOdd_1, typeof numbers.isOdd>>;
type Same_isOdd_2 = Assert<Equal<typeof direct_isOdd_2, typeof numbers.isOdd>>;
type Same_isPositive_0 = Assert<Equal<typeof direct_isPositive_0, typeof numbers.isPositive>>;
type Same_isPositive_1 = Assert<Equal<typeof direct_isPositive_1, typeof numbers.isPositive>>;
type Same_isPositive_2 = Assert<Equal<typeof direct_isPositive_2, typeof numbers.isPositive>>;
type Same_isSafeInteger_0 = Assert<Equal<typeof direct_isSafeInteger_0, typeof numbers.isSafeInteger>>;
type Same_isSafeInteger_1 = Assert<Equal<typeof direct_isSafeInteger_1, typeof numbers.isSafeInteger>>;
type Same_isSafeInteger_2 = Assert<Equal<typeof direct_isSafeInteger_2, typeof numbers.isSafeInteger>>;
type Same_isZero_0 = Assert<Equal<typeof direct_isZero_0, typeof numbers.isZero>>;
type Same_isZero_1 = Assert<Equal<typeof direct_isZero_1, typeof numbers.isZero>>;
type Same_isZero_2 = Assert<Equal<typeof direct_isZero_2, typeof numbers.isZero>>;
type Same_isZeroOrNegative_0 = Assert<Equal<typeof direct_isZeroOrNegative_0, typeof numbers.isZeroOrNegative>>;
type Same_isZeroOrNegative_1 = Assert<Equal<typeof direct_isZeroOrNegative_1, typeof numbers.isZeroOrNegative>>;
type Same_isZeroOrNegative_2 = Assert<Equal<typeof direct_isZeroOrNegative_2, typeof numbers.isZeroOrNegative>>;
type Same_isZeroOrPositive_0 = Assert<Equal<typeof direct_isZeroOrPositive_0, typeof numbers.isZeroOrPositive>>;
type Same_isZeroOrPositive_1 = Assert<Equal<typeof direct_isZeroOrPositive_1, typeof numbers.isZeroOrPositive>>;
type Same_isZeroOrPositive_2 = Assert<Equal<typeof direct_isZeroOrPositive_2, typeof numbers.isZeroOrPositive>>;
type Same_modulo_0 = Assert<Equal<typeof direct_modulo_0, typeof numbers.modulo>>;
type Same_modulo_1 = Assert<Equal<typeof direct_modulo_1, typeof numbers.modulo>>;
type Same_modulo_2 = Assert<Equal<typeof direct_modulo_2, typeof numbers.modulo>>;
type Same_parse_0 = Assert<Equal<typeof direct_parse_0, typeof numbers.parse>>;
type Same_parse_1 = Assert<Equal<typeof direct_parse_1, typeof numbers.parse>>;
type Same_parse_2 = Assert<Equal<typeof direct_parse_2, typeof numbers.parse>>;
type Same_parseFinite_0 = Assert<Equal<typeof direct_parseFinite_0, typeof numbers.parseFinite>>;
type Same_parseFinite_1 = Assert<Equal<typeof direct_parseFinite_1, typeof numbers.parseFinite>>;
type Same_parseFinite_2 = Assert<Equal<typeof direct_parseFinite_2, typeof numbers.parseFinite>>;
type Same_parseSafeInteger_0 = Assert<Equal<typeof direct_parseSafeInteger_0, typeof numbers.parseSafeInteger>>;
type Same_parseSafeInteger_1 = Assert<Equal<typeof direct_parseSafeInteger_1, typeof numbers.parseSafeInteger>>;
type Same_parseSafeInteger_2 = Assert<Equal<typeof direct_parseSafeInteger_2, typeof numbers.parseSafeInteger>>;
type Same_parseStrict_0 = Assert<Equal<typeof direct_parseStrict_0, typeof numbers.parseStrict>>;
type Same_parseStrict_1 = Assert<Equal<typeof direct_parseStrict_1, typeof numbers.parseStrict>>;
type Same_parseStrict_2 = Assert<Equal<typeof direct_parseStrict_2, typeof numbers.parseStrict>>;
type Same_round_0 = Assert<Equal<typeof direct_round_0, typeof numbers.round>>;
type Same_round_1 = Assert<Equal<typeof direct_round_1, typeof numbers.round>>;
type Same_round_2 = Assert<Equal<typeof direct_round_2, typeof numbers.round>>;
type Same_roundTo_0 = Assert<Equal<typeof direct_roundTo_0, typeof numbers.roundTo>>;
type Same_roundTo_1 = Assert<Equal<typeof direct_roundTo_1, typeof numbers.roundTo>>;
type Same_roundTo_2 = Assert<Equal<typeof direct_roundTo_2, typeof numbers.roundTo>>;
const result_parse_0 = numbers.parse(input, null);
type Result_parse_0 = Assert<Equal<typeof result_parse_0, number | null>>;
const result_parse_1 = numbers.parse(input, undefined);
type Result_parse_1 = Assert<Equal<typeof result_parse_1, number | undefined>>;
const result_parse_2 = numbers.parse(input, false as const);
type Result_parse_2 = Assert<Equal<typeof result_parse_2, number | false>>;
const result_parse_3 = numbers.parse(input, 'missing' as const);
type Result_parse_3 = Assert<Equal<typeof result_parse_3, number | 'missing'>>;
const result_parse_4 = numbers.parse(input, 1n);
type Result_parse_4 = Assert<Equal<typeof result_parse_4, number | 1n>>;
const result_parse_5 = numbers.parse(input, fallbackRecord);
type Result_parse_5 = Assert<Equal<typeof result_parse_5, number | typeof fallbackRecord>>;
const result_parse_6 = numbers.parse(input, fallbackSymbol);
type Result_parse_6 = Assert<Equal<typeof result_parse_6, number | typeof fallbackSymbol>>;
const result_parse_7 = numbers.parse(input, fallbackCallback);
type Result_parse_7 = Assert<Equal<typeof result_parse_7, number | typeof fallbackCallback>>;
const result_parse_8 = numbers.parse(input, fallbackTuple);
type Result_parse_8 = Assert<Equal<typeof result_parse_8, number | typeof fallbackTuple>>;
const omitted_parse = numbers.parse(input);
type Omitted_parse = Assert<Equal<typeof omitted_parse, number | undefined>>;
const nonfinite_parse = numbers.parse(NaN, null);
type Nonfinite_parse = Assert<Equal<typeof nonfinite_parse, number>>;
const result_parseStrict_0 = numbers.parseStrict(input, null);
type Result_parseStrict_0 = Assert<Equal<typeof result_parseStrict_0, number | null>>;
const result_parseStrict_1 = numbers.parseStrict(input, undefined);
type Result_parseStrict_1 = Assert<Equal<typeof result_parseStrict_1, number | undefined>>;
const result_parseStrict_2 = numbers.parseStrict(input, false as const);
type Result_parseStrict_2 = Assert<Equal<typeof result_parseStrict_2, number | false>>;
const result_parseStrict_3 = numbers.parseStrict(input, 'missing' as const);
type Result_parseStrict_3 = Assert<Equal<typeof result_parseStrict_3, number | 'missing'>>;
const result_parseStrict_4 = numbers.parseStrict(input, 1n);
type Result_parseStrict_4 = Assert<Equal<typeof result_parseStrict_4, number | 1n>>;
const result_parseStrict_5 = numbers.parseStrict(input, fallbackRecord);
type Result_parseStrict_5 = Assert<Equal<typeof result_parseStrict_5, number | typeof fallbackRecord>>;
const result_parseStrict_6 = numbers.parseStrict(input, fallbackSymbol);
type Result_parseStrict_6 = Assert<Equal<typeof result_parseStrict_6, number | typeof fallbackSymbol>>;
const result_parseStrict_7 = numbers.parseStrict(input, fallbackCallback);
type Result_parseStrict_7 = Assert<Equal<typeof result_parseStrict_7, number | typeof fallbackCallback>>;
const result_parseStrict_8 = numbers.parseStrict(input, fallbackTuple);
type Result_parseStrict_8 = Assert<Equal<typeof result_parseStrict_8, number | typeof fallbackTuple>>;
const omitted_parseStrict = numbers.parseStrict(input);
type Omitted_parseStrict = Assert<Equal<typeof omitted_parseStrict, number | undefined>>;
const nonfinite_parseStrict = numbers.parseStrict(NaN, null);
type Nonfinite_parseStrict = Assert<Equal<typeof nonfinite_parseStrict, number>>;
const result_extractNumber_0 = numbers.extractNumber(input, null);
type Result_extractNumber_0 = Assert<Equal<typeof result_extractNumber_0, number | null>>;
const result_extractNumber_1 = numbers.extractNumber(input, undefined);
type Result_extractNumber_1 = Assert<Equal<typeof result_extractNumber_1, number | undefined>>;
const result_extractNumber_2 = numbers.extractNumber(input, false as const);
type Result_extractNumber_2 = Assert<Equal<typeof result_extractNumber_2, number | false>>;
const result_extractNumber_3 = numbers.extractNumber(input, 'missing' as const);
type Result_extractNumber_3 = Assert<Equal<typeof result_extractNumber_3, number | 'missing'>>;
const result_extractNumber_4 = numbers.extractNumber(input, 1n);
type Result_extractNumber_4 = Assert<Equal<typeof result_extractNumber_4, number | 1n>>;
const result_extractNumber_5 = numbers.extractNumber(input, fallbackRecord);
type Result_extractNumber_5 = Assert<Equal<typeof result_extractNumber_5, number | typeof fallbackRecord>>;
const result_extractNumber_6 = numbers.extractNumber(input, fallbackSymbol);
type Result_extractNumber_6 = Assert<Equal<typeof result_extractNumber_6, number | typeof fallbackSymbol>>;
const result_extractNumber_7 = numbers.extractNumber(input, fallbackCallback);
type Result_extractNumber_7 = Assert<Equal<typeof result_extractNumber_7, number | typeof fallbackCallback>>;
const result_extractNumber_8 = numbers.extractNumber(input, fallbackTuple);
type Result_extractNumber_8 = Assert<Equal<typeof result_extractNumber_8, number | typeof fallbackTuple>>;
const omitted_extractNumber = numbers.extractNumber(input);
type Omitted_extractNumber = Assert<Equal<typeof omitted_extractNumber, number | undefined>>;
const nonfinite_extractNumber = numbers.extractNumber(NaN, null);
type Nonfinite_extractNumber = Assert<Equal<typeof nonfinite_extractNumber, number>>;
const result_parseFinite_0 = numbers.parseFinite(input, null);
type Result_parseFinite_0 = Assert<Equal<typeof result_parseFinite_0, number | null>>;
const result_parseFinite_1 = numbers.parseFinite(input, undefined);
type Result_parseFinite_1 = Assert<Equal<typeof result_parseFinite_1, number | undefined>>;
const result_parseFinite_2 = numbers.parseFinite(input, false as const);
type Result_parseFinite_2 = Assert<Equal<typeof result_parseFinite_2, number | false>>;
const result_parseFinite_3 = numbers.parseFinite(input, 'missing' as const);
type Result_parseFinite_3 = Assert<Equal<typeof result_parseFinite_3, number | 'missing'>>;
const result_parseFinite_4 = numbers.parseFinite(input, 1n);
type Result_parseFinite_4 = Assert<Equal<typeof result_parseFinite_4, number | 1n>>;
const result_parseFinite_5 = numbers.parseFinite(input, fallbackRecord);
type Result_parseFinite_5 = Assert<Equal<typeof result_parseFinite_5, number | typeof fallbackRecord>>;
const result_parseFinite_6 = numbers.parseFinite(input, fallbackSymbol);
type Result_parseFinite_6 = Assert<Equal<typeof result_parseFinite_6, number | typeof fallbackSymbol>>;
const result_parseFinite_7 = numbers.parseFinite(input, fallbackCallback);
type Result_parseFinite_7 = Assert<Equal<typeof result_parseFinite_7, number | typeof fallbackCallback>>;
const result_parseFinite_8 = numbers.parseFinite(input, fallbackTuple);
type Result_parseFinite_8 = Assert<Equal<typeof result_parseFinite_8, number | typeof fallbackTuple>>;
const omitted_parseFinite = numbers.parseFinite(input);
type Omitted_parseFinite = Assert<Equal<typeof omitted_parseFinite, number | undefined>>;
const nonfinite_parseFinite = numbers.parseFinite(NaN, null);
type Nonfinite_parseFinite = Assert<Equal<typeof nonfinite_parseFinite, number | null>>;
const result_parseSafeInteger_0 = numbers.parseSafeInteger(input, null);
type Result_parseSafeInteger_0 = Assert<Equal<typeof result_parseSafeInteger_0, number | null>>;
const result_parseSafeInteger_1 = numbers.parseSafeInteger(input, undefined);
type Result_parseSafeInteger_1 = Assert<Equal<typeof result_parseSafeInteger_1, number | undefined>>;
const result_parseSafeInteger_2 = numbers.parseSafeInteger(input, false as const);
type Result_parseSafeInteger_2 = Assert<Equal<typeof result_parseSafeInteger_2, number | false>>;
const result_parseSafeInteger_3 = numbers.parseSafeInteger(input, 'missing' as const);
type Result_parseSafeInteger_3 = Assert<Equal<typeof result_parseSafeInteger_3, number | 'missing'>>;
const result_parseSafeInteger_4 = numbers.parseSafeInteger(input, 1n);
type Result_parseSafeInteger_4 = Assert<Equal<typeof result_parseSafeInteger_4, number | 1n>>;
const result_parseSafeInteger_5 = numbers.parseSafeInteger(input, fallbackRecord);
type Result_parseSafeInteger_5 = Assert<Equal<typeof result_parseSafeInteger_5, number | typeof fallbackRecord>>;
const result_parseSafeInteger_6 = numbers.parseSafeInteger(input, fallbackSymbol);
type Result_parseSafeInteger_6 = Assert<Equal<typeof result_parseSafeInteger_6, number | typeof fallbackSymbol>>;
const result_parseSafeInteger_7 = numbers.parseSafeInteger(input, fallbackCallback);
type Result_parseSafeInteger_7 = Assert<Equal<typeof result_parseSafeInteger_7, number | typeof fallbackCallback>>;
const result_parseSafeInteger_8 = numbers.parseSafeInteger(input, fallbackTuple);
type Result_parseSafeInteger_8 = Assert<Equal<typeof result_parseSafeInteger_8, number | typeof fallbackTuple>>;
const omitted_parseSafeInteger = numbers.parseSafeInteger(input);
type Omitted_parseSafeInteger = Assert<Equal<typeof omitted_parseSafeInteger, number | undefined>>;
const nonfinite_parseSafeInteger = numbers.parseSafeInteger(NaN, null);
type Nonfinite_parseSafeInteger = Assert<Equal<typeof nonfinite_parseSafeInteger, number | null>>;
const result_getInteger_0 = numbers.getInteger(input, null);
type Result_getInteger_0 = Assert<Equal<typeof result_getInteger_0, number | null>>;
const result_getInteger_1 = numbers.getInteger(input, undefined);
type Result_getInteger_1 = Assert<Equal<typeof result_getInteger_1, number | undefined>>;
const result_getInteger_2 = numbers.getInteger(input, false as const);
type Result_getInteger_2 = Assert<Equal<typeof result_getInteger_2, number | false>>;
const result_getInteger_3 = numbers.getInteger(input, 'missing' as const);
type Result_getInteger_3 = Assert<Equal<typeof result_getInteger_3, number | 'missing'>>;
const result_getInteger_4 = numbers.getInteger(input, 1n);
type Result_getInteger_4 = Assert<Equal<typeof result_getInteger_4, number | 1n>>;
const result_getInteger_5 = numbers.getInteger(input, fallbackRecord);
type Result_getInteger_5 = Assert<Equal<typeof result_getInteger_5, number | typeof fallbackRecord>>;
const result_getInteger_6 = numbers.getInteger(input, fallbackSymbol);
type Result_getInteger_6 = Assert<Equal<typeof result_getInteger_6, number | typeof fallbackSymbol>>;
const result_getInteger_7 = numbers.getInteger(input, fallbackCallback);
type Result_getInteger_7 = Assert<Equal<typeof result_getInteger_7, number | typeof fallbackCallback>>;
const result_getInteger_8 = numbers.getInteger(input, fallbackTuple);
type Result_getInteger_8 = Assert<Equal<typeof result_getInteger_8, number | typeof fallbackTuple>>;
const omitted_getInteger = numbers.getInteger(input);
type Omitted_getInteger = Assert<Equal<typeof omitted_getInteger, number | undefined>>;
const nonfinite_getInteger = numbers.getInteger(NaN, null);
type Nonfinite_getInteger = Assert<Equal<typeof nonfinite_getInteger, number | null>>;
const result_getFraction_0 = numbers.getFraction(input, null);
type Result_getFraction_0 = Assert<Equal<typeof result_getFraction_0, number | null>>;
const result_getFraction_1 = numbers.getFraction(input, undefined);
type Result_getFraction_1 = Assert<Equal<typeof result_getFraction_1, number | undefined>>;
const result_getFraction_2 = numbers.getFraction(input, false as const);
type Result_getFraction_2 = Assert<Equal<typeof result_getFraction_2, number | false>>;
const result_getFraction_3 = numbers.getFraction(input, 'missing' as const);
type Result_getFraction_3 = Assert<Equal<typeof result_getFraction_3, number | 'missing'>>;
const result_getFraction_4 = numbers.getFraction(input, 1n);
type Result_getFraction_4 = Assert<Equal<typeof result_getFraction_4, number | 1n>>;
const result_getFraction_5 = numbers.getFraction(input, fallbackRecord);
type Result_getFraction_5 = Assert<Equal<typeof result_getFraction_5, number | typeof fallbackRecord>>;
const result_getFraction_6 = numbers.getFraction(input, fallbackSymbol);
type Result_getFraction_6 = Assert<Equal<typeof result_getFraction_6, number | typeof fallbackSymbol>>;
const result_getFraction_7 = numbers.getFraction(input, fallbackCallback);
type Result_getFraction_7 = Assert<Equal<typeof result_getFraction_7, number | typeof fallbackCallback>>;
const result_getFraction_8 = numbers.getFraction(input, fallbackTuple);
type Result_getFraction_8 = Assert<Equal<typeof result_getFraction_8, number | typeof fallbackTuple>>;
const omitted_getFraction = numbers.getFraction(input);
type Omitted_getFraction = Assert<Equal<typeof omitted_getFraction, number | undefined>>;
const nonfinite_getFraction = numbers.getFraction(NaN, null);
type Nonfinite_getFraction = Assert<Equal<typeof nonfinite_getFraction, number | null>>;
const predicate_isClose = numbers.isClose(input, 1);
type Predicate_isClose = Assert<Equal<typeof predicate_isClose, boolean>>;
if (numbers.isClose(input, 1)) {
  // @ts-expect-error accepting boxes does not narrow unknown to primitive number
  const unsafe: number = input;
}
const predicate_isEven = numbers.isEven(input);
type Predicate_isEven = Assert<Equal<typeof predicate_isEven, boolean>>;
if (numbers.isEven(input)) {
  // @ts-expect-error accepting boxes does not narrow unknown to primitive number
  const unsafe: number = input;
}
const predicate_isFinite = numbers.isFinite(input);
type Predicate_isFinite = Assert<Equal<typeof predicate_isFinite, boolean>>;
if (numbers.isFinite(input)) {
  // @ts-expect-error accepting boxes does not narrow unknown to primitive number
  const unsafe: number = input;
}
const predicate_isInRange = numbers.isInRange(input, 0, 1);
type Predicate_isInRange = Assert<Equal<typeof predicate_isInRange, boolean>>;
if (numbers.isInRange(input, 0, 1)) {
  // @ts-expect-error accepting boxes does not narrow unknown to primitive number
  const unsafe: number = input;
}
const predicate_isInfinite = numbers.isInfinite(input);
type Predicate_isInfinite = Assert<Equal<typeof predicate_isInfinite, boolean>>;
if (numbers.isInfinite(input)) {
  // @ts-expect-error accepting boxes does not narrow unknown to primitive number
  const unsafe: number = input;
}
const predicate_isInteger = numbers.isInteger(input);
type Predicate_isInteger = Assert<Equal<typeof predicate_isInteger, boolean>>;
if (numbers.isInteger(input)) {
  // @ts-expect-error accepting boxes does not narrow unknown to primitive number
  const unsafe: number = input;
}
const predicate_isNaN = numbers.isNaN(input);
type Predicate_isNaN = Assert<Equal<typeof predicate_isNaN, boolean>>;
if (numbers.isNaN(input)) {
  // @ts-expect-error a TypeScript predicate would be unsound: false still includes non-NaN numbers
  const unsafe: number = input;
}
const predicate_isNegative = numbers.isNegative(input);
type Predicate_isNegative = Assert<Equal<typeof predicate_isNegative, boolean>>;
if (numbers.isNegative(input)) {
  // @ts-expect-error accepting boxes does not narrow unknown to primitive number
  const unsafe: number = input;
}
const predicate_isOdd = numbers.isOdd(input);
type Predicate_isOdd = Assert<Equal<typeof predicate_isOdd, boolean>>;
if (numbers.isOdd(input)) {
  // @ts-expect-error accepting boxes does not narrow unknown to primitive number
  const unsafe: number = input;
}
const predicate_isPositive = numbers.isPositive(input);
type Predicate_isPositive = Assert<Equal<typeof predicate_isPositive, boolean>>;
if (numbers.isPositive(input)) {
  // @ts-expect-error accepting boxes does not narrow unknown to primitive number
  const unsafe: number = input;
}
const predicate_isSafeInteger = numbers.isSafeInteger(input);
type Predicate_isSafeInteger = Assert<Equal<typeof predicate_isSafeInteger, boolean>>;
if (numbers.isSafeInteger(input)) {
  // @ts-expect-error accepting boxes does not narrow unknown to primitive number
  const unsafe: number = input;
}
const predicate_isZero = numbers.isZero(input);
type Predicate_isZero = Assert<Equal<typeof predicate_isZero, boolean>>;
if (numbers.isZero(input)) {
  // @ts-expect-error accepting boxes does not narrow unknown to primitive number
  const unsafe: number = input;
}
const predicate_isZeroOrNegative = numbers.isZeroOrNegative(input);
type Predicate_isZeroOrNegative = Assert<Equal<typeof predicate_isZeroOrNegative, boolean>>;
if (numbers.isZeroOrNegative(input)) {
  // @ts-expect-error accepting boxes does not narrow unknown to primitive number
  const unsafe: number = input;
}
const predicate_isZeroOrPositive = numbers.isZeroOrPositive(input);
type Predicate_isZeroOrPositive = Assert<Equal<typeof predicate_isZeroOrPositive, boolean>>;
if (numbers.isZeroOrPositive(input)) {
  // @ts-expect-error accepting boxes does not narrow unknown to primitive number
  const unsafe: number = input;
}
const rangeOptions = { includeMin: undefined, includeMax: false } satisfies RangeOptions;
const closeOptions = { absoluteTolerance: undefined, relativeTolerance: 0 } satisfies CloseOptions;
declare const readonlyRange: RangeOptions;
// @ts-expect-error options declarations promise readonly properties
readonlyRange.includeMax = true;
declare const readonlyClose: CloseOptions;
// @ts-expect-error options declarations promise readonly properties
readonlyClose.absoluteTolerance = 1;
// @ts-expect-error fresh object literals reject misspelled keys
numbers.isInRange(input, 0, 1, { includeMAX: false });
// @ts-expect-error tolerance must be primitive, not a box
numbers.isClose(input, 1, { relativeTolerance: new Number(0) });
const arithmetic_round: number = numbers.round(new Number(1), undefined);
// @ts-expect-error numeric operations are not parsers
numbers.round('1', 2);
// @ts-expect-error precision is primitive
numbers.round(1, new Number(2));
const arithmetic_ceil: number = numbers.ceil(new Number(1), undefined);
// @ts-expect-error numeric operations are not parsers
numbers.ceil('1', 2);
// @ts-expect-error precision is primitive
numbers.ceil(1, new Number(2));
const arithmetic_floor: number = numbers.floor(new Number(1), undefined);
// @ts-expect-error numeric operations are not parsers
numbers.floor('1', 2);
// @ts-expect-error precision is primitive
numbers.floor(1, new Number(2));
const arithmetic_roundTo: number = numbers.roundTo(new Number(1), new Number(2));
// @ts-expect-error the second numeric argument is required
numbers.roundTo(1);
// @ts-expect-error BigInt arithmetic is unsupported
numbers.roundTo(1n, 2n);
const arithmetic_modulo: number = numbers.modulo(new Number(1), new Number(2));
// @ts-expect-error the second numeric argument is required
numbers.modulo(1);
// @ts-expect-error BigInt arithmetic is unsupported
numbers.modulo(1n, 2n);

// A nonliteral BigInt fallback retains its wider static type.
declare const bigintFallback: bigint;
const widerBigintFallback = numbers.parseFinite(input, bigintFallback);
type WiderBigintFallback = Assert<Equal<typeof widerBigintFallback, number | bigint>>;

// Callback-body inference must preserve the explicit fallback union rather than erase it.
const callbackFinite = ['10', 'bad'].map((value) => numbers.parseFinite(value, null));
type CallbackFiniteElement = Assert<Equal<(typeof callbackFinite)[number], number | null>>;
const callbackSafeInteger = ['10', 'bad'].map((value) => numbers.parseSafeInteger(value, false as const));
type CallbackSafeIntegerElement = Assert<Equal<(typeof callbackSafeInteger)[number], number | false>>;
const nullableFiniteCallback = (value: unknown) => numbers.parseFinite(value, null);
type NullableFiniteCallbackReturn = Assert<Equal<ReturnType<typeof nullableFiniteCallback>, number | null>>;

// Extended review: both branches must preserve the original union. A boolean
// result is not evidence that a finite/realm/capability-dependent value is primitive.
type NumberBox = InstanceType<NumberConstructor>;
function checkFiniteBranches(value: number | string | NumberBox) {
  if (numbers.isFinite(value)) {
    type TrueBranch = Assert<Equal<typeof value, number | string | NumberBox>>;
    // @ts-expect-error genuine boxes and unrelated values remain possible statically
    const primitive: number = value;
  } else {
    type FalseBranch = Assert<Equal<typeof value, number | string | NumberBox>>;
    // @ts-expect-error false also includes non-finite primitive numbers
    const text: string = value;
  }
}
function checkNaNBranches(value: number | string) {
  if (numbers.isNaN(value)) {
    type TrueBranch = Assert<Equal<typeof value, number | string>>;
  } else {
    type FalseBranch = Assert<Equal<typeof value, number | string>>;
    // @ts-expect-error ordinary numbers also produce false
    const text: string = value;
  }
}

// Every unary predicate has a boolean signature, never a partial type guard.
type UnaryPredicateName =
  | 'isInteger'
  | 'isSafeInteger'
  | 'isFinite'
  | 'isInfinite'
  | 'isNaN'
  | 'isEven'
  | 'isOdd'
  | 'isPositive'
  | 'isNegative'
  | 'isZero'
  | 'isZeroOrPositive'
  | 'isZeroOrNegative';
type BooleanPredicates = Assert<
  Equal<Pick<typeof numbers, UnaryPredicateName>, { [K in UnaryPredicateName]: (value: unknown) => boolean }>
>;

interface FallbackContext {
  readonly label: string;
}
function receiverFallback(this: FallbackContext, suffix: string): string {
  return this.label + suffix;
}
const receiver = { label: 'missing' } as const;
const boundFallback = receiverFallback.bind(receiver);
declare const literalOrNumber: 12 | 'bad';
declare const widenedOrBox: number | string | NumberBox;
declare const optionalFallback: 'missing' | undefined;

// parse: returned fallbacks are values, not callbacks to execute implicitly.
const receiver_parse = numbers.parse(input, receiverFallback);
type Receiver_parse = Assert<Equal<typeof receiver_parse, number | typeof receiverFallback>>;
if (typeof receiver_parse === 'function') {
  const called: string = receiver_parse.call(receiver, '!');
  const bound: (suffix: string) => string = receiver_parse.bind(receiver);
  const afterBinding: string = bound('!');
  // @ts-expect-error a receiver-sensitive fallback still requires its receiver
  receiver_parse('!');
  // @ts-expect-error fallback parameter types must not be erased to any
  receiver_parse.call(receiver, 1);
}
const callback_parse = (value: unknown) => numbers.parse(value, null);
const bound_parse = callback_parse.bind(undefined, input);
const returned_parse = bound_parse();
type Returned_parse = Assert<Equal<typeof returned_parse, number | null>>;
const receiverOnly_parse = numbers.parse.bind(undefined);
const receiverOnlyResult_parse = receiverOnly_parse(input, false as const);
type ReceiverOnly_parse = Assert<Equal<typeof receiverOnlyResult_parse, number | false>>;
const union_parse = numbers.parse(literalOrNumber, optionalFallback);
type Union_parse = Assert<Equal<typeof union_parse, number | 'missing' | undefined>>;
const wide_parse = numbers.parse(widenedOrBox, boundFallback);
type Wide_parse = Assert<Equal<typeof wide_parse, number | typeof boundFallback>>;
function forward_parse<T>(value: unknown, fallback: T) {
  return numbers.parse(value, fallback);
}
const forwarded_parse = forward_parse(input, fallbackTuple);
type Forwarded_parse = Assert<Equal<typeof forwarded_parse, number | typeof fallbackTuple>>;

// parseStrict: returned fallbacks are values, not callbacks to execute implicitly.
const receiver_parseStrict = numbers.parseStrict(input, receiverFallback);
type Receiver_parseStrict = Assert<Equal<typeof receiver_parseStrict, number | typeof receiverFallback>>;
if (typeof receiver_parseStrict === 'function') {
  const called: string = receiver_parseStrict.call(receiver, '!');
  const bound: (suffix: string) => string = receiver_parseStrict.bind(receiver);
  const afterBinding: string = bound('!');
  // @ts-expect-error a receiver-sensitive fallback still requires its receiver
  receiver_parseStrict('!');
  // @ts-expect-error fallback parameter types must not be erased to any
  receiver_parseStrict.call(receiver, 1);
}
const callback_parseStrict = (value: unknown) => numbers.parseStrict(value, null);
const bound_parseStrict = callback_parseStrict.bind(undefined, input);
const returned_parseStrict = bound_parseStrict();
type Returned_parseStrict = Assert<Equal<typeof returned_parseStrict, number | null>>;
const receiverOnly_parseStrict = numbers.parseStrict.bind(undefined);
const receiverOnlyResult_parseStrict = receiverOnly_parseStrict(input, false as const);
type ReceiverOnly_parseStrict = Assert<Equal<typeof receiverOnlyResult_parseStrict, number | false>>;
const union_parseStrict = numbers.parseStrict(literalOrNumber, optionalFallback);
type Union_parseStrict = Assert<Equal<typeof union_parseStrict, number | 'missing' | undefined>>;
const wide_parseStrict = numbers.parseStrict(widenedOrBox, boundFallback);
type Wide_parseStrict = Assert<Equal<typeof wide_parseStrict, number | typeof boundFallback>>;
function forward_parseStrict<T>(value: unknown, fallback: T) {
  return numbers.parseStrict(value, fallback);
}
const forwarded_parseStrict = forward_parseStrict(input, fallbackTuple);
type Forwarded_parseStrict = Assert<Equal<typeof forwarded_parseStrict, number | typeof fallbackTuple>>;

// extractNumber: returned fallbacks are values, not callbacks to execute implicitly.
const receiver_extractNumber = numbers.extractNumber(input, receiverFallback);
type Receiver_extractNumber = Assert<Equal<typeof receiver_extractNumber, number | typeof receiverFallback>>;
if (typeof receiver_extractNumber === 'function') {
  const called: string = receiver_extractNumber.call(receiver, '!');
  const bound: (suffix: string) => string = receiver_extractNumber.bind(receiver);
  const afterBinding: string = bound('!');
  // @ts-expect-error a receiver-sensitive fallback still requires its receiver
  receiver_extractNumber('!');
  // @ts-expect-error fallback parameter types must not be erased to any
  receiver_extractNumber.call(receiver, 1);
}
const callback_extractNumber = (value: unknown) => numbers.extractNumber(value, null);
const bound_extractNumber = callback_extractNumber.bind(undefined, input);
const returned_extractNumber = bound_extractNumber();
type Returned_extractNumber = Assert<Equal<typeof returned_extractNumber, number | null>>;
const receiverOnly_extractNumber = numbers.extractNumber.bind(undefined);
const receiverOnlyResult_extractNumber = receiverOnly_extractNumber(input, false as const);
type ReceiverOnly_extractNumber = Assert<Equal<typeof receiverOnlyResult_extractNumber, number | false>>;
const union_extractNumber = numbers.extractNumber(literalOrNumber, optionalFallback);
type Union_extractNumber = Assert<Equal<typeof union_extractNumber, number | 'missing' | undefined>>;
const wide_extractNumber = numbers.extractNumber(widenedOrBox, boundFallback);
type Wide_extractNumber = Assert<Equal<typeof wide_extractNumber, number | typeof boundFallback>>;
function forward_extractNumber<T>(value: unknown, fallback: T) {
  return numbers.extractNumber(value, fallback);
}
const forwarded_extractNumber = forward_extractNumber(input, fallbackTuple);
type Forwarded_extractNumber = Assert<Equal<typeof forwarded_extractNumber, number | typeof fallbackTuple>>;

// parseFinite: returned fallbacks are values, not callbacks to execute implicitly.
const receiver_parseFinite = numbers.parseFinite(input, receiverFallback);
type Receiver_parseFinite = Assert<Equal<typeof receiver_parseFinite, number | typeof receiverFallback>>;
if (typeof receiver_parseFinite === 'function') {
  const called: string = receiver_parseFinite.call(receiver, '!');
  const bound: (suffix: string) => string = receiver_parseFinite.bind(receiver);
  const afterBinding: string = bound('!');
  // @ts-expect-error a receiver-sensitive fallback still requires its receiver
  receiver_parseFinite('!');
  // @ts-expect-error fallback parameter types must not be erased to any
  receiver_parseFinite.call(receiver, 1);
}
const callback_parseFinite = (value: unknown) => numbers.parseFinite(value, null);
const bound_parseFinite = callback_parseFinite.bind(undefined, input);
const returned_parseFinite = bound_parseFinite();
type Returned_parseFinite = Assert<Equal<typeof returned_parseFinite, number | null>>;
const receiverOnly_parseFinite = numbers.parseFinite.bind(undefined);
const receiverOnlyResult_parseFinite = receiverOnly_parseFinite(input, false as const);
type ReceiverOnly_parseFinite = Assert<Equal<typeof receiverOnlyResult_parseFinite, number | false>>;
const union_parseFinite = numbers.parseFinite(literalOrNumber, optionalFallback);
type Union_parseFinite = Assert<Equal<typeof union_parseFinite, number | 'missing' | undefined>>;
const wide_parseFinite = numbers.parseFinite(widenedOrBox, boundFallback);
type Wide_parseFinite = Assert<Equal<typeof wide_parseFinite, number | typeof boundFallback>>;
function forward_parseFinite<T>(value: unknown, fallback: T) {
  return numbers.parseFinite(value, fallback);
}
const forwarded_parseFinite = forward_parseFinite(input, fallbackTuple);
type Forwarded_parseFinite = Assert<Equal<typeof forwarded_parseFinite, number | typeof fallbackTuple>>;

// parseSafeInteger: returned fallbacks are values, not callbacks to execute implicitly.
const receiver_parseSafeInteger = numbers.parseSafeInteger(input, receiverFallback);
type Receiver_parseSafeInteger = Assert<Equal<typeof receiver_parseSafeInteger, number | typeof receiverFallback>>;
if (typeof receiver_parseSafeInteger === 'function') {
  const called: string = receiver_parseSafeInteger.call(receiver, '!');
  const bound: (suffix: string) => string = receiver_parseSafeInteger.bind(receiver);
  const afterBinding: string = bound('!');
  // @ts-expect-error a receiver-sensitive fallback still requires its receiver
  receiver_parseSafeInteger('!');
  // @ts-expect-error fallback parameter types must not be erased to any
  receiver_parseSafeInteger.call(receiver, 1);
}
const callback_parseSafeInteger = (value: unknown) => numbers.parseSafeInteger(value, null);
const bound_parseSafeInteger = callback_parseSafeInteger.bind(undefined, input);
const returned_parseSafeInteger = bound_parseSafeInteger();
type Returned_parseSafeInteger = Assert<Equal<typeof returned_parseSafeInteger, number | null>>;
const receiverOnly_parseSafeInteger = numbers.parseSafeInteger.bind(undefined);
const receiverOnlyResult_parseSafeInteger = receiverOnly_parseSafeInteger(input, false as const);
type ReceiverOnly_parseSafeInteger = Assert<Equal<typeof receiverOnlyResult_parseSafeInteger, number | false>>;
const union_parseSafeInteger = numbers.parseSafeInteger(literalOrNumber, optionalFallback);
type Union_parseSafeInteger = Assert<Equal<typeof union_parseSafeInteger, number | 'missing' | undefined>>;
const wide_parseSafeInteger = numbers.parseSafeInteger(widenedOrBox, boundFallback);
type Wide_parseSafeInteger = Assert<Equal<typeof wide_parseSafeInteger, number | typeof boundFallback>>;
function forward_parseSafeInteger<T>(value: unknown, fallback: T) {
  return numbers.parseSafeInteger(value, fallback);
}
const forwarded_parseSafeInteger = forward_parseSafeInteger(input, fallbackTuple);
type Forwarded_parseSafeInteger = Assert<Equal<typeof forwarded_parseSafeInteger, number | typeof fallbackTuple>>;

// getInteger: returned fallbacks are values, not callbacks to execute implicitly.
const receiver_getInteger = numbers.getInteger(input, receiverFallback);
type Receiver_getInteger = Assert<Equal<typeof receiver_getInteger, number | typeof receiverFallback>>;
if (typeof receiver_getInteger === 'function') {
  const called: string = receiver_getInteger.call(receiver, '!');
  const bound: (suffix: string) => string = receiver_getInteger.bind(receiver);
  const afterBinding: string = bound('!');
  // @ts-expect-error a receiver-sensitive fallback still requires its receiver
  receiver_getInteger('!');
  // @ts-expect-error fallback parameter types must not be erased to any
  receiver_getInteger.call(receiver, 1);
}
const callback_getInteger = (value: unknown) => numbers.getInteger(value, null);
const bound_getInteger = callback_getInteger.bind(undefined, input);
const returned_getInteger = bound_getInteger();
type Returned_getInteger = Assert<Equal<typeof returned_getInteger, number | null>>;
const receiverOnly_getInteger = numbers.getInteger.bind(undefined);
const receiverOnlyResult_getInteger = receiverOnly_getInteger(input, false as const);
type ReceiverOnly_getInteger = Assert<Equal<typeof receiverOnlyResult_getInteger, number | false>>;
const union_getInteger = numbers.getInteger(literalOrNumber, optionalFallback);
type Union_getInteger = Assert<Equal<typeof union_getInteger, number | 'missing' | undefined>>;
const wide_getInteger = numbers.getInteger(widenedOrBox, boundFallback);
type Wide_getInteger = Assert<Equal<typeof wide_getInteger, number | typeof boundFallback>>;
function forward_getInteger<T>(value: unknown, fallback: T) {
  return numbers.getInteger(value, fallback);
}
const forwarded_getInteger = forward_getInteger(input, fallbackTuple);
type Forwarded_getInteger = Assert<Equal<typeof forwarded_getInteger, number | typeof fallbackTuple>>;

// getFraction: returned fallbacks are values, not callbacks to execute implicitly.
const receiver_getFraction = numbers.getFraction(input, receiverFallback);
type Receiver_getFraction = Assert<Equal<typeof receiver_getFraction, number | typeof receiverFallback>>;
if (typeof receiver_getFraction === 'function') {
  const called: string = receiver_getFraction.call(receiver, '!');
  const bound: (suffix: string) => string = receiver_getFraction.bind(receiver);
  const afterBinding: string = bound('!');
  // @ts-expect-error a receiver-sensitive fallback still requires its receiver
  receiver_getFraction('!');
  // @ts-expect-error fallback parameter types must not be erased to any
  receiver_getFraction.call(receiver, 1);
}
const callback_getFraction = (value: unknown) => numbers.getFraction(value, null);
const bound_getFraction = callback_getFraction.bind(undefined, input);
const returned_getFraction = bound_getFraction();
type Returned_getFraction = Assert<Equal<typeof returned_getFraction, number | null>>;
const receiverOnly_getFraction = numbers.getFraction.bind(undefined);
const receiverOnlyResult_getFraction = receiverOnly_getFraction(input, false as const);
type ReceiverOnly_getFraction = Assert<Equal<typeof receiverOnlyResult_getFraction, number | false>>;
const union_getFraction = numbers.getFraction(literalOrNumber, optionalFallback);
type Union_getFraction = Assert<Equal<typeof union_getFraction, number | 'missing' | undefined>>;
const wide_getFraction = numbers.getFraction(widenedOrBox, boundFallback);
type Wide_getFraction = Assert<Equal<typeof wide_getFraction, number | typeof boundFallback>>;
function forward_getFraction<T>(value: unknown, fallback: T) {
  return numbers.getFraction(value, fallback);
}
const forwarded_getFraction = forward_getFraction(input, fallbackTuple);
type Forwarded_getFraction = Assert<Equal<typeof forwarded_getFraction, number | typeof fallbackTuple>>;

// Ordinary, extracted, receiver-free and pre-bound numeric functions retain arguments.
const directRound = numbers.round;
const boundRound = directRound.bind(undefined, new Number(1.235));
const roundResult = boundRound(2);
type BoundRound = Assert<Equal<typeof roundResult, number>>;
const roundViaCall: number = numbers.round.call(undefined, 1.235, 2);
const floorViaApply: number = numbers.floor.apply(undefined, [1.239, 2]);
const roundToStep = numbers.roundTo.bind(receiver, 1.375);
const roundedStep: number = roundToStep(0.25);
// @ts-expect-error the step is required even after binding the numeric value
roundToStep();
// @ts-expect-error binding must not make precision accept strings
boundRound('2');
// @ts-expect-error strictBindCallApply must still reject textual arithmetic
numbers.ceil.call(undefined, '1.23', 2);
// @ts-expect-error a native numeric operation's result is not any
const notText: string = roundResult;
const receiverFree: (this: void, value: unknown) => boolean = numbers.isFinite;
const predicateMap: boolean[] = [1, '1', null].map(receiverFree);
const numericThis: (this: FallbackContext, value: number, precision?: number) => number = numbers.round;
const explicitReceiver: number = numericThis.call(receiver, 1.235, 2);
// @ts-expect-error the consumer's explicit this contract is preserved
numericThis(1.235, 2);

// Readonly input collections and omitted options retain relationship types.
const readonlyInputs: readonly (number | string | null)[] = [1, 'bad', null];
const nullableValues = readonlyInputs.map((value) => numbers.parseFinite(value, null));
type NullableValues = Assert<Equal<typeof nullableValues, (number | null)[]>>;
const readonlyOptions: Readonly<RangeOptions> = { includeMin: true, includeMax: undefined };
const optionalOptions: CloseOptions | undefined = undefined;
const rangeResult: boolean = numbers.isInRange(input, 0, 10, readonlyOptions);
const closeResult: boolean = numbers.isClose(input, 1, optionalOptions);
// @ts-expect-error the range accepts neither null options nor caller coercion
numbers.isInRange(input, 0, 1, null);
// @ts-expect-error string tolerances are not configuration numbers
numbers.isClose(input, 1, { absoluteTolerance: '1' });
// Baseline environments intentionally do not supply DOM or Node ambient globals.
// @ts-expect-error no DOM library is present
const ambientDocument = document;
// @ts-expect-error no automatic @types/node environment is present
const ambientProcess = process;
