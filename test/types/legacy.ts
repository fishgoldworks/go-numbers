import numbers = require('go-numbers');
import isOdd = require('go-numbers/isOdd');
import parse = require('go-numbers/src/parse');
const checked: boolean = isOdd(-3);
const value: number | null = parse('unknown', null);
const constant: number = numbers.EPSILON;
// @ts-expect-error failure must be handled under strictNullChecks
const unchecked: number = numbers.getInteger('unknown');

import parseFinite = require('go-numbers/parseFinite');
import parseSafeInteger = require('go-numbers/parseSafeInteger');
import extractNumber = require('go-numbers/extractNumber');
import clamp = require('go-numbers/clamp');
import isInRange = require('go-numbers/isInRange');
import round = require('go-numbers/round');
import isClose = require('go-numbers/isClose');
const finite: number | null = parseFinite('12.5', null);
const integer: number | null = parseSafeInteger('12', null);
const extracted: number | undefined = extractNumber('12px');
const inRange: boolean = isInRange(12, 0, 10, { includeMin: false });
const close: boolean = isClose(1, 1.01, { relativeTolerance: 0.1 });
const clamped: number = clamp(10, 0, 5);
const rounded: number = round(1.005, 2);

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
