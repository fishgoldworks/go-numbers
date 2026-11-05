'use strict';

module.exports = function comparisonCases(n) {
  const values = Array.from({ length: 256 }, (_, i) => (i - 128) * 1.2345 + 0.005);
  const strings = values.map((value) => String(value));
  const embedded = strings.map((value) => `temperature: ${value} C`);
  const integers = values.map((value) => Math.trunc(value));
  const integerStrings = integers.map(String);
  const moduli = [1, 3, 97, 1e100];
  const boxes = values.map((value) => new Number(value));
  const precision = [-2, 0, 1, 2, 3, 8, -308, 324];
  const grids = [0.1, 0.25, 2.5, 10, 0.3, 0.05, 97, 1];
  const extremes = [1e300, -1e300, 1.12345678901234e308, -1.12345678901234e308];
  const tiny = [5e-324, 1.5e-323, -5e-324, -1.5e-323];
  const halfOpen = { includeMax: false };
  const pixel = { absoluteTolerance: 0.5, relativeTolerance: 0 };
  const empty = {};
  const rejected = '1'.repeat(16000) + 'x';
  return [
    ['isOdd / primitives (control)', 300000, (i) => n.isOdd(integers[i & 255])],
    ['isFinite / boxed (control)', 100000, (i) => n.isFinite(boxes[i & 255])],
    ['parseFinite / varied decimal (control)', 100000, (i) => n.parseFinite(strings[i & 255])],
    ['parse / embedded (control)', 100000, (i) => n.parse(embedded[i & 255])],
    ['parseSafeInteger / digits (control)', 100000, (i) => n.parseSafeInteger(integerStrings[i & 255])],
    ['getFraction / varied (control)', 100000, (i) => n.getFraction(values[i & 255])],
    ['clamp / bounds (control)', 300000, (i) => n.clamp(values[i & 255], 0, 100)],
    ['round / zero precision', 200000, (i) => n.round(values[i & 255])],
    ['round / integer at precision 2', 200000, (i) => n.round(integers[i & 255], 2)],
    ['round / varied at precision 2', 100000, (i) => n.round(values[i & 255], 2)],
    ['round / mixed precision', 100000, (i) => n.round(values[i & 255], precision[i & 7])],
    ['ceil / precision 2', 100000, (i) => n.ceil(values[i & 255], 2)],
    ['floor / precision 2', 100000, (i) => n.floor(values[i & 255], 2)],
    ['roundTo / repeated 0.1 step', 100000, (i) => n.roundTo(values[i & 255], 0.1)],
    ['roundTo / repeated 0.25 step', 100000, (i) => n.roundTo(values[i & 255], 0.25)],
    ['roundTo / changing steps', 100000, (i) => n.roundTo(values[i & 255], grids[i & 7])],
    ['roundTo / exact integer multiple', 100000, (i) => n.roundTo(integers[i & 255], 1)],
    ['roundTo / extreme BigInt fallback', 15000, (i) => n.roundTo(extremes[i & 3], 7e-300)],
    ['roundTo / subnormal step', 20000, (i) => n.roundTo(tiny[i & 3], 1e-323)],
    ['isInRange / defaults', 300000, (i) => n.isInRange(values[i & 255], 0, 100)],
    ['isInRange / explicit options', 100000, (i) => n.isInRange(values[i & 255], 0, 100, halfOpen)],
    ['isInRange / empty options', 100000, (i) => n.isInRange(values[i & 255], 0, 100, empty)],
    ['isClose / defaults', 300000, (i) => n.isClose(values[i & 255], values[i & 255] + 1e-13)],
    ['isClose / explicit tolerance', 100000, (i) => n.isClose(values[i & 255], values[i & 255] + 0.4, pixel)],
    ['modulo / normal cycle', 200000, (i) => n.modulo(integers[i & 255], 97)],
    ['modulo / upper endpoint correction', 100000, (i) => n.modulo(-Number.MIN_VALUE, moduli[i & 3])],
    ['parseFinite / reject long (control)', 100, () => n.parseFinite(rejected)]
  ];
};
