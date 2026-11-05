'use strict';

module.exports = function cases(numbers, measure) {
  const mixed = [0, -3.5, NaN, Infinity, '3'];
  measure('isOdd / primitive', 500000, (i) => numbers.isOdd(i));
  measure('isFinite / mixed primitives', 500000, (i) => numbers.isFinite(mixed[i % 5]));
  measure('parseStrict / valid decimal', 100000, () => numbers.parseStrict('-12.345e2'));
  measure('parse / embedded decimal', 100000, () => numbers.parse('temperature: -12.5 C'));
  measure('getFraction / decimal digits', 100000, () => numbers.getFraction(12.345));
  measure('parseFinite / finite decimal', 100000, () => numbers.parseFinite('-12.345e2'));
  measure('parseSafeInteger / signed digits', 100000, () => numbers.parseSafeInteger('-12345'));
  measure('clamp / primitive bounds', 500000, (i) => numbers.clamp(i % 150, 0, 100));
  measure('isInRange / default options', 500000, (i) => numbers.isInRange(i % 150, 0, 100));
  const halfOpen = { includeMax: false };
  measure('isInRange / explicit options', 100000, (i) => numbers.isInRange(i % 150, 0, 100, halfOpen));
  measure('round / decimal ties', 100000, (i) => numbers.round(i % 2 ? -1.005 : 1.005, 2));
  measure('ceil / decimal precision', 100000, (i) => numbers.ceil(i % 2 ? -1.239 : 1.1, 2));
  measure('floor / decimal precision', 100000, (i) => numbers.floor(i % 2 ? -0.29 : 0.29, 2));
  measure('roundTo / fractional step', 100000, (i) => numbers.roundTo(i % 2 ? -0.15 : 0.15, 0.1));
  measure('modulo / integer cycle', 500000, (i) => numbers.modulo(i - 250000, 97));
  measure('isClose / default options', 500000, (i) => numbers.isClose(i + 0.1 + 0.2, i + 0.3));
  const pixelTolerance = { absoluteTolerance: 0.5, relativeTolerance: 0 };
  measure('isClose / pixel tolerance', 100000, (i) => numbers.isClose(i, i + 0.4, pixelTolerance));
  for (const size of [4000, 8000, 16000, 64000, 250000]) {
    const text = '1'.repeat(size) + 'x';
    measure(`parseStrict / reject ${size + 1} chars`, 10, () => numbers.parseStrict(text));
    measure(`parseFinite / reject ${size + 1} chars`, 10, () => numbers.parseFinite(text));
    measure(`parseSafeInteger / reject ${size + 1}`, 10, () => numbers.parseSafeInteger(text));
  }
};
