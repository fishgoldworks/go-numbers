import numbers, { isOdd, roundTo, extractNumber, parse } from 'go-numbers';
import odd, { isOdd as namedOdd } from 'go-numbers/isOdd';
import step, { roundTo as namedStep } from 'go-numbers/roundTo';
import { parseFinite as namedFinite } from 'go-numbers/parseFinite';
if (odd !== namedOdd || step !== namedStep) throw new Error('Named function-subpath identity mismatch');
if (numbers.isOdd !== isOdd || isOdd !== odd || numbers.roundTo !== step || step !== roundTo || extractNumber !== parse)
  throw new Error('Default/named/subpath identity mismatch');
if (!numbers.isOdd(-3) || numbers.roundTo(1.375, 0.25) !== 1.5 || numbers.parseStrict('12.5') !== 12.5)
  throw new Error('Emitted default consumer behavior mismatch');

// Exercise inferred results, not only compile-only assignments.
function requireSame(actual: unknown, expected: unknown): void {
  if (!Object.is(actual, expected)) throw new Error('Emitted callback/fallback contract mismatch');
}
function fallback(this: { readonly label: string }, suffix: string): string {
  return this.label + suffix;
}
const context = { label: 'missing' } as const;
const selected = namedFinite('bad', fallback);
requireSame(selected, fallback);
if (typeof selected !== 'function') throw new Error('Expected unchanged fallback function');
requireSame(selected.call(context, '!'), 'missing!');
const bound = selected.bind(context);
requireSame(bound('?'), 'missing?');
requireSame(numbers.parseFinite('12.5', fallback), 12.5);
requireSame(numbers.parseStrict(12, fallback), 12);
const finiteOrNull = (value: unknown) => numbers.parseFinite(value, null);
const prebound = finiteOrNull.bind(undefined, 'bad');
const absent: number | null = prebound();
requireSame(absent, null);
requireSame(finiteOrNull.call(undefined, '12.5'), 12.5);
const receiverOnly = numbers.parseSafeInteger.bind(undefined);
const receiverOnlyResult: number | false = receiverOnly('bad', false as const);
requireSame(receiverOnlyResult, false);
const directRound = numbers.round;
const partialRound = directRound.bind(context, 1.235);
requireSame(partialRound(2), 1.24);
requireSame(numbers.floor.apply(undefined, [1.239, 2]), 1.23);
const frozen = Object.freeze({ missing: true });
requireSame(numbers.getFraction('bad', frozen), frozen);
let calls = 0;
const textObject = {
  text: '12.5',
  toString(this: { readonly text: string }): string {
    calls++;
    return this.text;
  }
};
requireSame(numbers.parseStrict(textObject, null), 12.5);
requireSame(calls, 1);
requireSame(numbers.parseFinite(textObject, null), null);
requireSame(calls, 1);
const readonlyInput: readonly (number | string | null)[] = ['10', 'bad', null];
const mapped: (number | null)[] = readonlyInput.map(finiteOrNull);
requireSame(mapped[0], 10);
requireSame(mapped[1], null);
requireSame(mapped[2], null);
