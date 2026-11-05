'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const numbers = require('..');
function call(name, ...args) {
  assert.equal(typeof numbers[name], 'function', `${name} must be exported`);
  return numbers[name](...args);
}

const finiteCases = [
  ['12.5', 12.5],
  ['-12.5', -12.5],
  ['+12', 12],
  ['.5', 0.5],
  ['12.', 12],
  ['1e3', 1000],
  ['1E-3', 0.001],
  ['-.5e+2', -50],
  ['00012.50', 12.5],
  ['0', 0],
  ['-0', -0],
  ['-0.000e50', -0],
  [0, 0],
  [-0, -0],
  [12.5, 12.5],
  [Number.MAX_VALUE, Number.MAX_VALUE],
  [Number.MIN_VALUE, Number.MIN_VALUE],
  ['1.7976931348623157e308', Number.MAX_VALUE],
  ['5e-324', Number.MIN_VALUE],
  ['1e-999', 0],
  ['-1e-999', -0],
  ['9007199254740993', 9007199254740992]
];
for (const [value, expected] of finiteCases) {
  test(`parseFinite accepts ${String(value)} (${typeof value})`, () => {
    assert.ok(Object.is(call('parseFinite', value, null), expected));
  });
}
const invalidFinite = [
  '',
  ' ',
  ' 12',
  '12 ',
  '12\n',
  '\n12',
  '12\r',
  '12\u2028',
  '1_000',
  '0x10',
  '0b10',
  '12px',
  '.',
  '+',
  '-',
  '1e',
  '1e+',
  '+.e2',
  'NaN',
  'nan',
  '+NaN',
  'Infinity',
  '-Infinity',
  'INFINITY',
  '1e999',
  '-1e999',
  '１２',
  '١٢',
  NaN,
  Infinity,
  -Infinity,
  null,
  undefined,
  true,
  false,
  12n,
  Symbol('12'),
  [],
  [12],
  {},
  () => 12,
  Object.create(null),
  Object(12n),
  new Date(0),
  new Boolean(true)
];
for (const [index, value] of invalidFinite.entries()) {
  test(`parseFinite rejects invalid case ${index} without coercion`, () => {
    const fallback = { missing: true };
    assert.equal(call('parseFinite', value, fallback), fallback);
  });
}

const integerCases = [
  ['24', 24],
  ['-24', -24],
  ['+24', 24],
  ['00024', 24],
  ['-00024', -24],
  ['0', 0],
  ['-0', -0],
  ['+000', 0],
  ['-000', -0],
  ['9007199254740991', Number.MAX_SAFE_INTEGER],
  ['-9007199254740991', Number.MIN_SAFE_INTEGER],
  [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER],
  [24, 24],
  [-0, -0],
  [1e3, 1000]
];
for (const [value, expected] of integerCases) {
  test(`parseSafeInteger accepts ${String(value)} (${typeof value})`, () => {
    assert.ok(Object.is(call('parseSafeInteger', value, null), expected));
  });
}
const invalidInteger = [
  ...invalidFinite,
  '24.0',
  '24.',
  '.0',
  '-0.0',
  '1e3',
  '1E0',
  '24.5',
  '1.0000000000000001',
  '9007199254740991.1',
  '9007199254740992',
  '-9007199254740992',
  '9007199254740993',
  '123\n',
  1.5,
  Number.MIN_VALUE,
  Number.MAX_SAFE_INTEGER + 1,
  Number.MIN_SAFE_INTEGER - 1,
  Number.MAX_VALUE
];
for (const [index, value] of invalidInteger.entries()) {
  test(`parseSafeInteger rejects invalid case ${index} without truncating`, () => {
    assert.equal(call('parseSafeInteger', value, null), null);
  });
}

for (const name of ['parseFinite', 'parseSafeInteger']) {
  test(`${name} accepts genuine boxes, across realms and with hostile methods`, () => {
    for (const value of [
      new Number(24),
      new String('24'),
      vm.runInNewContext('new Number(24)'),
      vm.runInNewContext('new String("24")')
    ]) {
      for (const key of ['toString', 'valueOf', Symbol.toPrimitive, Symbol.toStringTag]) {
        Object.defineProperty(value, key, {
          get() {
            throw new Error('must not touch');
          }
        });
      }
      assert.equal(call(name, value, null), 24);
    }
    assert.equal(call(name, new Number(Infinity), null), null);
    assert.equal(call(name, new Number(NaN), null), null);
    assert.ok(Object.is(call(name, new Number(-0)), -0));
    assert.ok(Object.is(call(name, new String('-0')), -0));
  });
  test(`${name} rejects spoofed boxes and proxies without reading any properties`, () => {
    const hostile = new Proxy(
      {},
      {
        get() {
          throw new Error('get trap');
        },
        getPrototypeOf() {
          throw new Error('prototype trap');
        }
      }
    );
    const revoked = Proxy.revocable(new Number(12), {});
    revoked.revoke();
    const fake = Object.create(Number.prototype);
    const fakeString = Object.create(String.prototype);
    for (const value of [hostile, revoked.proxy, fake, fakeString, new Proxy(new Number(12), {})]) {
      assert.equal(call(name, value, null), null);
    }
    let calls = 0;
    const convertible = {
      toString() {
        calls++;
        return '24';
      },
      valueOf() {
        calls++;
        return 24;
      }
    };
    assert.equal(call(name, convertible, null), null);
    assert.equal(calls, 0);
  });
  test(`${name} preserves every fallback by identity and defaults to undefined`, () => {
    assert.equal(call(name, 'invalid'), undefined);
    for (const fallback of [
      undefined,
      null,
      false,
      '',
      0,
      -0,
      NaN,
      Infinity,
      'missing',
      Symbol('missing'),
      1n,
      {},
      () => {}
    ]) {
      assert.ok(Object.is(call(name, 'invalid', fallback), fallback));
    }
    assert.equal(call(name, '24', {}), 24);
  });
  test(`${name} handles long valid/invalid input without rescanning suffixes`, { timeout: 3000 }, () => {
    assert.equal(call(name, '0'.repeat(250000) + '24'), 24);
    assert.equal(call(name, '1'.repeat(250000), null), null);
    assert.equal(call(name, '0'.repeat(250000) + '24x', null), null);
  });
}

test('extractNumber is exactly the existing parser, including its fallback and object rules', () => {
  assert.equal(typeof numbers.extractNumber, 'function');
  assert.equal(numbers.extractNumber, numbers.parse);
  assert.equal(numbers.extractNumber('temperature: -12.5 C'), -12.5);
  assert.equal(
    numbers.extractNumber({
      toString() {
        return 'distance: 42km';
      }
    }),
    42
  );
  const fallback = { missing: true };
  assert.equal(numbers.extractNumber('invalid', fallback), fallback);
  assert.ok(Number.isNaN(numbers.extractNumber('NaN', null)));
  assert.equal(numbers.extractNumber('Infinity', null), Infinity);
});

test('new strict parsers do not change the legacy object-conversion contract', () => {
  const value = {
    toString() {
      return '24';
    }
  };
  assert.equal(numbers.parseStrict(value), 24);
  assert.equal(numbers.parse(value), 24);
  assert.equal(call('parseFinite', value, null), null);
  assert.equal(call('parseSafeInteger', value, null), null);
  assert.equal(numbers.getInteger(-1.25), -2);
  assert.equal(numbers.getFraction(-1.25), 0.25);
});

test('parseSafeInteger agrees with exact BigInt bounds for generated signed integer strings', () => {
  let seed = 0x12345678;
  for (let i = 0; i < 5000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const integer = (BigInt(seed) << BigInt(i % 32)) * (i % 2 ? -1n : 1n);
    const text = integer < 0n ? '-000' + -integer : '+000' + integer;
    const expected = integer >= -9007199254740991n && integer <= 9007199254740991n ? Number(integer) : null;
    assert.equal(call('parseSafeInteger', text, null), expected, text);
  }
});
