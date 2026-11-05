'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const n = require('..');
const { nextUp, nextDown, same } = require('./helpers/scenario-oracles.js');
const display = (value) => (Object.is(value, -0) ? '-0' : String(value));

const configurations = [
  {
    name: 'isInRange',
    keys: ['includeMin', 'includeMax'],
    configured: [false, false],
    invoke: (options) => n.isInRange(10, 0, 10, options),
    defaults: true,
    changed: false
  },
  {
    name: 'isClose',
    keys: ['absoluteTolerance', 'relativeTolerance'],
    configured: [2, 0],
    invoke: (options) => n.isClose(0, 1, options),
    defaults: false,
    changed: true
  }
];
const thrownValues = [
  new Error('error identity'),
  new TypeError('type identity'),
  undefined,
  null,
  false,
  0,
  -0,
  NaN,
  'user error',
  Symbol('user error'),
  Object.freeze({ failure: true })
];
function throwsExactly(operation, expected) {
  let caught = false;
  try {
    operation();
  } catch (error) {
    caught = true;
    assert.ok(Object.is(error, expected));
  }
  assert.equal(caught, true, 'the explicitly invoked hook must throw');
}
for (const config of configurations) {
  const { name, keys, configured, invoke, defaults, changed } = config;
  for (const state of ['plain', 'frozen', 'sealed', 'non-extensible', 'null-prototype', 'non-enumerable']) {
    test(`${name} options: reads supported own properties in ${state} records without mutation`, () => {
      const options = state === 'null-prototype' ? Object.create(null) : {};
      keys.forEach((key, index) =>
        Object.defineProperty(options, key, {
          value: configured[index],
          writable: true,
          configurable: true,
          enumerable: state !== 'non-enumerable'
        })
      );
      if (state === 'frozen') Object.freeze(options);
      if (state === 'sealed') Object.seal(options);
      if (state === 'non-extensible') Object.preventExtensions(options);
      const before = Object.getOwnPropertyDescriptors(options);
      assert.equal(invoke(options), changed);
      assert.deepEqual(Object.getOwnPropertyDescriptors(options), before);
    });
  }
  test(`${name} options: own undefined values default independently without changing later calls`, () => {
    for (let mask = 0; mask < 4; mask++) {
      const options = Object.fromEntries(keys.filter((_, i) => mask & (2 ** i)).map((key) => [key, undefined]));
      assert.equal(invoke(options), defaults);
    }
    assert.equal(invoke(Object.fromEntries(keys.map((key, i) => [key, configured[i]]))), changed);
    assert.equal(invoke(undefined), defaults);
  });
  test(`${name} options: inherited supported and unknown getters are never evaluated`, () => {
    const prototype = {};
    for (const key of [...keys, 'unknown', Symbol('unknown')]) {
      Object.defineProperty(prototype, key, {
        get() {
          throw new Error('inherited configuration must be ignored');
        }
      });
    }
    const options = Object.create(prototype);
    assert.equal(invoke(options), defaults);
    keys.forEach((key, i) => Object.defineProperty(options, key, { value: configured[i] }));
    assert.equal(invoke(options), changed);
  });
  test(`${name} options: each own getter sees its receiver and is evaluated exactly once per call`, () => {
    const calls = Object.fromEntries(keys.map((key) => [key, 0]));
    const options = {};
    keys.forEach((key, index) =>
      Object.defineProperty(options, key, {
        get() {
          assert.equal(this, options);
          calls[key]++;
          return configured[index];
        }
      })
    );
    Object.freeze(options);
    assert.equal(invoke(options), changed);
    for (const key of keys) assert.equal(calls[key], 1);
    assert.equal(invoke(options), changed);
    for (const key of keys) assert.equal(calls[key], 2);
  });
  for (const [position, key] of keys.entries()) {
    for (const [index, thrown] of thrownValues.entries()) {
      test(`${name} options: ${key} getter propagates thrown-value identity #${index}`, () => {
        const options = {};
        Object.defineProperty(options, key, {
          get() {
            throw thrown;
          }
        });
        throwsExactly(() => invoke(options), thrown);
      });
    }
    test(`${name} options: proxy get errors for ${key} propagate without touching unrelated properties`, () => {
      const error = new Error('proxy get error');
      const target = { [key]: configured[position] };
      const proxy = new Proxy(target, {
        get(object, property, receiver) {
          assert.equal(property, key);
          assert.equal(receiver, proxy);
          throw error;
        }
      });
      throwsExactly(() => invoke(proxy), error);
    });
  }
  test(`${name} options: ownKeys failures and revoked configuration proxies propagate`, () => {
    const error = new Error('ownKeys failed');
    throwsExactly(
      () =>
        invoke(
          new Proxy(
            {},
            {
              ownKeys() {
                throw error;
              }
            }
          )
        ),
      error
    );
    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    assert.throws(() => invoke(revoked.proxy), TypeError);
  });
  for (const key of ['typo', '__proto__', 'constructor', 'toString', '', 'bad\n"key', Symbol('typo')]) {
    test(`${name} options: rejects unknown own key ${String(key)} before accessing its value`, () => {
      const options = Object.create(null);
      let reads = 0;
      Object.defineProperty(options, key, {
        get() {
          reads++;
          throw new Error('unknown value was read');
        }
      });
      assert.throws(
        () => invoke(options),
        (error) =>
          error instanceof TypeError &&
          error.message.includes(typeof key === 'symbol' ? String(key) : JSON.stringify(key)) &&
          keys.every((allowed) => error.message.includes(JSON.stringify(allowed)))
      );
      assert.equal(reads, 0);
    });
  }
  test(`${name} options: empty non-array objects are valid records regardless of their prototype`, () => {
    for (const options of [Object.create(null), new Date(0), new Map(), new Set(), Object.freeze({})]) {
      assert.equal(invoke(options), defaults);
    }
  });
}
for (const flag of ['includeMin', 'includeMax']) {
  test(`isInRange rejects every non-boolean type for ${flag}, even for invalid checked values`, () => {
    for (const value of [
      null,
      0,
      -0,
      1,
      NaN,
      Infinity,
      'false',
      '',
      0n,
      Symbol(),
      {},
      [],
      new Boolean(false),
      new Number(0),
      () => true
    ]) {
      for (const checked of [NaN, null, 1, 0, 10]) {
        assert.throws(() => n.isInRange(checked, 0, 10, { [flag]: value }), TypeError);
      }
    }
  });
}
for (const tolerance of ['absoluteTolerance', 'relativeTolerance']) {
  test(`isClose validates type and numeric domain of ${tolerance} before value shortcuts`, () => {
    for (const [left, right] of [
      [1, 1],
      [NaN, NaN],
      [null, null],
      [Infinity, Infinity],
      [0, -0]
    ]) {
      for (const value of [null, false, '0', '', 0n, Symbol(), {}, [], new Number(0), () => 0]) {
        assert.throws(() => n.isClose(left, right, { [tolerance]: value }), TypeError);
      }
      for (const value of [-Number.MIN_VALUE, -1, NaN, Infinity, -Infinity]) {
        assert.throws(() => n.isClose(left, right, { [tolerance]: value }), RangeError);
      }
    }
  });
}
for (const boundary of [
  -Number.MAX_VALUE,
  -1,
  -Number.MIN_VALUE,
  -0,
  0,
  Number.MIN_VALUE,
  2 ** -1022,
  1,
  Number.MAX_SAFE_INTEGER,
  Number.MAX_VALUE
]) {
  test(`range topology: equal bounds and immediate neighboring values around ${Object.is(boundary, -0) ? '-0' : boundary}`, () => {
    for (const includeMin of [false, true])
      for (const includeMax of [false, true]) {
        for (const value of [nextDown(boundary), boundary, nextUp(boundary)]) {
          assert.equal(
            n.isInRange(value, boundary, boundary, { includeMin, includeMax }),
            value === boundary && includeMin && includeMax
          );
          same(n.clamp(value, boundary, boundary), value === boundary ? value : boundary, 'degenerate clamp');
        }
      }
  });
}
for (const [min, max] of [
  [-0, 0],
  [0, -0],
  [-Number.MIN_VALUE, Number.MIN_VALUE],
  [-Number.MAX_VALUE, Number.MAX_VALUE],
  [1, nextUp(1)],
  [nextDown(1), 1],
  [nextDown(Number.MAX_VALUE), Number.MAX_VALUE],
  [Number.MIN_VALUE, 2 * Number.MIN_VALUE]
]) {
  test(`range topology: adjacent or extreme bounds [${display(min)}, ${display(max)}]`, () => {
    for (const includeMin of [false, true])
      for (const includeMax of [false, true]) {
        for (const value of [nextDown(min), min, nextUp(min), nextDown(max), max, nextUp(max), NaN]) {
          const expected =
            Number.isFinite(value) &&
            (value > min || (includeMin && value === min)) &&
            (value < max || (includeMax && value === max));
          assert.equal(n.isInRange(value, min, max, { includeMin, includeMax }), expected);
          const clamped = n.clamp(value, min, max);
          same(clamped, value < min ? min : value > max ? max : value, 'ordered clamp');
          same(n.clamp(clamped, min, max), clamped, 'clamp idempotence');
        }
      }
  });
}
for (let exponent = -1073; exponent <= 1022; exponent += 31) {
  test(`isClose thresholds: exact dyadic distances at binary exponent ${exponent}`, () => {
    const base = 2 ** exponent;
    for (const [left, right, threshold] of [
      [base, 2 * base, 0.5],
      [0, base, 1],
      [base, -base, 2],
      [base, -2 * base, 1.5]
    ]) {
      for (const relative of [nextDown(threshold), threshold, nextUp(threshold)]) {
        const expected = relative >= threshold;
        assert.equal(n.isClose(left, right, { relativeTolerance: relative }), expected);
        assert.equal(n.isClose(right, left, { relativeTolerance: relative }), expected);
      }
    }
    for (const absolute of [nextDown(base), base, nextUp(base)]) {
      assert.equal(n.isClose(0, base, { absoluteTolerance: absolute, relativeTolerance: 0 }), absolute >= base);
    }
  });
}
test('isClose tolerances are alternatives, not requirements that must both pass', () => {
  assert.equal(n.isClose(0, 1, { absoluteTolerance: 1, relativeTolerance: 0 }), true);
  assert.equal(n.isClose(1, 2, { absoluteTolerance: 0, relativeTolerance: 0.5 }), true);
  assert.equal(n.isClose(1, 2, { absoluteTolerance: 0.5, relativeTolerance: 0.25 }), false);
});
test('isClose is intentionally nontransitive, not an equivalence relation', () => {
  const options = { absoluteTolerance: 1, relativeTolerance: 0 };
  assert.equal(n.isClose(0, 1, options), true);
  assert.equal(n.isClose(1, 2, options), true);
  assert.equal(n.isClose(0, 2, options), false);
});
