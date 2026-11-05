'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const n = require('..');
function close(...args) {
  assert.equal(typeof n.isClose, 'function', 'isClose must be exported');
  return n.isClose(...args);
}

test('isClose handles defaults and explicit absolute/relative tolerances', () => {
  assert.equal(close(0.1 + 0.2, 0.3), true);
  assert.equal(close(1, 1.001), false);
  assert.equal(close(10, 10.4, { absoluteTolerance: 0.5, relativeTolerance: 0 }), true);
  assert.equal(close(10, 10.6, { absoluteTolerance: 0.5, relativeTolerance: 0 }), false);
  assert.equal(close(1e12, 1e12 + 0.5), true);
  assert.equal(close(1e-12, 0), false);
  assert.equal(close(1e-12, 0, { absoluteTolerance: 1e-12 }), true);
  assert.equal(close(1, 2, { relativeTolerance: 0.5 }), true);
  assert.equal(close(1, 2, { relativeTolerance: 0.49 }), false);
  assert.equal(close(1, 1 + Number.EPSILON, { relativeTolerance: 0 }), false);
  assert.equal(close(1, 1, { relativeTolerance: -0, absoluteTolerance: -0 }), true);
});
test('isClose special values: identical infinities, signed zero, and NaN', () => {
  for (const value of [0, -0, 1, -1, Number.MAX_VALUE, Number.MIN_VALUE, Infinity, -Infinity]) {
    assert.equal(close(value, value), true);
  }
  assert.equal(close(0, -0), true);
  for (const [a, b] of [
    [NaN, NaN],
    [NaN, 0],
    [0, NaN],
    [Infinity, -Infinity],
    [Infinity, Number.MAX_VALUE],
    [Number.MAX_VALUE, Infinity]
  ]) {
    assert.equal(close(a, b, { absoluteTolerance: Number.MAX_VALUE, relativeTolerance: Number.MAX_VALUE }), false);
  }
});
test('isClose avoids infinity <= infinity from overflowing subtraction and scaling', () => {
  const max = Number.MAX_VALUE;
  assert.equal(close(max, -max, { relativeTolerance: 1.1 }), false);
  assert.equal(close(max, -max, { relativeTolerance: 2 - Number.EPSILON }), false);
  assert.equal(close(max, -max, { relativeTolerance: 2 }), true);
  assert.equal(close(max, -max, { absoluteTolerance: max, relativeTolerance: 0 }), false);
  assert.equal(close(max, -max / 2, { relativeTolerance: 1.5 }), true);
  assert.equal(close(max, -max / 2, { relativeTolerance: 1.49 }), false);
  assert.equal(close(max, -max, { relativeTolerance: max }), true);
});
test('isClose avoids incorrect acceptance when relative scaling rounds up a subnormal', () => {
  const tiny = Number.MIN_VALUE;
  assert.equal(close(tiny, 0, { relativeTolerance: 0.75 }), false);
  assert.equal(close(tiny, 0, { relativeTolerance: 1 }), true);
  assert.equal(close(tiny, 0, { relativeTolerance: 0, absoluteTolerance: tiny }), true);
  assert.equal(close(tiny, -tiny, { relativeTolerance: 1.99 }), false);
  assert.equal(close(tiny, -tiny, { relativeTolerance: 2 }), true);
  assert.equal(close(2 * tiny, tiny, { relativeTolerance: 0.5 }), true);
  assert.equal(close(2 * tiny, tiny, { relativeTolerance: 0.49 }), false);
});
test('isClose accepts real boxes and rejects mismatches without conversion', () => {
  const box = vm.runInNewContext('new Number(.3)');
  Object.defineProperty(box, Symbol.toPrimitive, {
    get() {
      throw new Error('do not coerce');
    }
  });
  assert.equal(close(box, 0.1 + 0.2), true);
  assert.equal(close(new Number(Infinity), Infinity), true);
  assert.equal(close(new Number(NaN), NaN), false);
  const hostile = new Proxy(
    {},
    {
      get() {
        throw new Error('do not read');
      }
    }
  );
  const revoked = Proxy.revocable(new Number(3), {});
  revoked.revoke();
  for (const value of ['1', null, undefined, true, 1n, Symbol(), {}, [], hostile, revoked.proxy]) {
    assert.equal(close(value, 1), false);
    assert.equal(close(1, value), false);
    assert.equal(close(value, value), false);
  }
});
test('isClose validates options before returning even for matching or invalid values', () => {
  for (const options of [
    null,
    false,
    1,
    '',
    [],
    () => {},
    { rel: 1e-12 },
    { [Symbol()]: 0 },
    { absoluteTolerance: null },
    { relativeTolerance: '0.01' },
    { absoluteTolerance: new Number(0) }
  ]) {
    assert.throws(() => close(1, 1, options), TypeError);
    assert.throws(() => close(NaN, NaN, options), TypeError);
  }
  for (const value of [-1, NaN, Infinity, -Infinity]) {
    assert.throws(() => close(1, 1, { absoluteTolerance: value }), RangeError);
    assert.throws(() => close(1, 1, { relativeTolerance: value }), RangeError);
  }
});
test('isClose options use defaults for undefined and ignore inherited properties', () => {
  assert.equal(close(0.1 + 0.2, 0.3, {}), true);
  assert.equal(close(0.1 + 0.2, 0.3, { relativeTolerance: undefined, absoluteTolerance: undefined }), true);
  assert.equal(close(0, 1, Object.create({ absoluteTolerance: 2 })), false);
  assert.equal(close(0, 1, Object.assign(Object.create(null), { absoluteTolerance: 2 })), true);
});
test('isClose does not mutate options and evaluates configuration getters once', () => {
  let count = 0;
  const options = Object.freeze({
    get absoluteTolerance() {
      count++;
      return 0.5;
    },
    relativeTolerance: 0
  });
  assert.equal(close(1, 1.1, options), true);
  assert.equal(count, 1);
  const error = new Error('bad config');
  assert.throws(
    () =>
      close(1, 1, {
        get relativeTolerance() {
          throw error;
        }
      }),
    (e) => e === error
  );
});
test('isClose remains symmetric over generated magnitudes and tolerances', () => {
  let seed = 42;
  for (let i = 0; i < 10000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const scale = 10 ** ((i % 617) - 308);
    const a = (seed / 0xffffffff - 0.5) * scale;
    const b = (i % 3 ? 1 : -1) * a * (1 + (i % 10) * 1e-13);
    const options = { relativeTolerance: (i % 15) * 1e-13, absoluteTolerance: scale * 1e-14 };
    assert.equal(close(a, b, options), close(b, a, options));
  }
});
