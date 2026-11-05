'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const numbers = require('..');

const valid = [
  ['0', 0],
  ['-0', -0],
  ['+0', 0],
  ['1', 1],
  ['-1', -1],
  ['+1', 1],
  ['0.123', 0.123],
  ['.123', 0.123],
  ['-.123', -0.123],
  ['+.123', 0.123],
  ['12.', 12],
  ['-12.', -12],
  ['00012.500', 12.5],
  ['1.2345E6', 1.2345e6],
  ['1.2345e6', 1.2345e6],
  ['.123E2', 12.3],
  ['12.E2', 1200],
  ['12.e2', 1200],
  ['1.2345E-6', 1.2345e-6],
  ['.123e-2', 0.00123],
  ['12.E-2', 0.12],
  ['1e+3', 1000],
  ['1E+03', 1000],
  ['1e000', 1],
  ['-0e4', -0],
  ['5e-324', Number.MIN_VALUE],
  ['-5e-324', -Number.MIN_VALUE],
  ['1e-999', 0],
  ['-1e-999', -0],
  ['1e999', Infinity],
  ['-1e999', -Infinity],
  ['9007199254740991', Number.MAX_SAFE_INTEGER],
  ['9007199254740993', 9007199254740992],
  ['1.7976931348623157e308', Number.MAX_VALUE],
  ['0e999999', 0],
  ['Infinity', Infinity],
  ['+Infinity', Infinity],
  ['-Infinity', -Infinity],
  ['infinity', Infinity],
  ['INFINITY', Infinity],
  ['-iNfInItY', -Infinity],
  ['NaN', NaN],
  ['nan', NaN],
  ['NAN', NaN]
];
const strictInvalid = [
  '',
  ' ',
  '\t',
  '\n',
  '\r',
  '\u2028',
  '\u2029',
  ' 123',
  '123 ',
  '123\n',
  '123\r',
  '123\r\n',
  '123\u2028',
  '123\u2029',
  '\uFEFF1',
  '1\u00a0',
  'NaN\n',
  'Infinity\n',
  '123f',
  '1e',
  '1e+',
  '1e-',
  '1e++2',
  '.',
  '+',
  '-',
  '+.',
  '-.',
  '..1',
  '1..2',
  '0x10',
  '0XFF',
  '0b10',
  '0o10',
  '1_000',
  '123n',
  '1,234.50',
  '1 234',
  '--1',
  '+-1',
  '++1',
  '1e2e3',
  'Infinity.',
  'Infinitys',
  'Infinity2',
  'NaNN',
  'NaN2',
  '+NaN',
  '-NaN',
  'inf',
  '∞',
  'true',
  'null',
  'undefined',
  '１２',
  '١٢',
  '−1',
  '1\0'
];
for (const name of ['parse', 'parseStrict']) {
  const parse = numbers[name];
  for (const [input, expected] of valid) {
    test(`${name}: accepts ${JSON.stringify(input)}`, () => {
      assert.ok(Object.is(parse(input, 99), expected));
      assert.ok(Object.is(parse(new String(input), 99), expected));
      assert.ok(Object.is(parse(vm.runInNewContext('new String(input)', { input }), 99), expected));
    });
  }
  for (const number of [0, -0, 1.25, -1.25, Number.MIN_VALUE, Number.MAX_VALUE, Infinity, -Infinity, NaN]) {
    test(`${name}: preserves primitive/boxed number ${Object.is(number, -0) ? '-0' : number}`, () => {
      assert.ok(Object.is(parse(number, 99), number));
      assert.ok(Object.is(parse(new Number(number), 99), number));
      assert.ok(Object.is(parse(vm.runInNewContext('new Number(number)', { number }), 99), number));
    });
  }
  for (const value of [undefined, null, true, false, 1n, Symbol('1'), Object(1n), Object.create(null)]) {
    test(`${name}: unsupported input preserves an object fallback`, () => {
      const fallback = { missing: true };
      assert.equal(parse(value, fallback), fallback);
      assert.equal(parse(value), undefined);
    });
  }
  test(`${name}: preserves the exact fallback, including signed zero and falsy values`, () => {
    for (const fallback of [undefined, null, 0, -0, false, '', NaN, Infinity, Symbol(), { missing: true }]) {
      assert.ok(Object.is(parse('', fallback), fallback));
      assert.ok(Object.is(parse({ toString: () => 'not a number' }, fallback), fallback));
    }
  });
  test(`${name}: invokes object toString once with the right receiver`, () => {
    let gets = 0;
    let calls = 0;
    const input = {
      value: '42.5',
      get toString() {
        gets++;
        return function () {
          calls++;
          return this.value;
        };
      }
    };
    assert.equal(parse(input, 99), 42.5);
    assert.equal(gets, 1);
    assert.equal(calls, 1);
  });
  test(`${name}: custom conversion may return a primitive number directly`, () => {
    assert.equal(parse({ toString: () => 42.5 }), 42.5);
    assert.ok(Object.is(parse({ toString: () => -0 }), -0));
    assert.ok(Number.isNaN(parse({ toString: () => NaN }, 99)));
  });
  test(`${name}: does not recursively follow custom conversion results`, () => {
    const self = {
      toString() {
        return this;
      }
    };
    const a = {
      toString() {
        return b;
      }
    };
    const b = {
      toString() {
        return a;
      }
    };
    for (const value of [self, a, { toString: () => new String('12') }, { toString: () => new Number(12) }]) {
      assert.equal(parse(value, 99), 99);
    }
    for (const result of [undefined, null, true, 1n, Symbol('1'), () => '1']) {
      assert.equal(parse({ toString: () => result }, 99), 99);
    }
  });
  test(`${name}: non-callable toString uses fallback`, () => {
    for (const toString of [null, undefined, true, '12', 12, {}]) {
      assert.equal(parse({ toString }, 99), 99);
    }
  });
  test(`${name}: deliberately invoked conversion errors propagate unchanged`, () => {
    const error = new Error('user conversion failed');
    assert.throws(
      () =>
        parse(
          {
            get toString() {
              throw error;
            }
          },
          99
        ),
      (value) => value === error
    );
    assert.throws(
      () =>
        parse(
          {
            toString() {
              throw error;
            }
          },
          99
        ),
      (value) => value === error
    );
    const { proxy, revoke } = Proxy.revocable({}, {});
    revoke();
    assert.throws(() => parse(proxy, 99), TypeError);
  });
  test(`${name}: genuine number/string boxes ignore overridden conversion hooks`, () => {
    const fail = () => {
      throw new Error('box hook must not run');
    };
    for (const value of [new Number(12.5), new String('12.5')]) {
      Object.defineProperties(value, {
        toString: { get: fail },
        valueOf: { get: fail },
        [Symbol.toPrimitive]: { get: fail }
      });
      assert.equal(parse(value), 12.5);
    }
    assert.equal(parse(Object.setPrototypeOf(new Number(12.5), null)), 12.5);
    assert.equal(parse(Object.setPrototypeOf(new String('12.5'), null)), 12.5);
    assert.equal(parse(vm.runInNewContext('Object(123n)'), 99), 99);
  });
  test(`${name}: ignores unrelated valueOf, Symbol.toPrimitive and toStringTag hooks`, () => {
    const fail = () => {
      throw new Error('unrelated hook must not run');
    };
    const input = Object.defineProperties(
      {
        toString() {
          return '12.5';
        }
      },
      {
        valueOf: { get: fail },
        [Symbol.toPrimitive]: { get: fail },
        [Symbol.toStringTag]: { get: fail }
      }
    );
    assert.equal(parse(input), 12.5);
  });
  test(`${name}: calls conversion without using an overridden .call property`, () => {
    function toString() {
      return '12.5';
    }
    toString.call = () => {
      throw new Error('untrusted call');
    };
    assert.equal(parse({ toString }), 12.5);
  });
  test(`${name}: accepts custom function and null-prototype object conversion`, () => {
    const fn = () => undefined;
    fn.toString = () => '12.5';
    assert.equal(parse(fn), 12.5);
    const object = Object.assign(Object.create(null), { toString: () => '12.5' });
    assert.equal(parse(object), 12.5);
  });
  test(`${name}: rejects boxed bigint without calling its conversion hook`, () => {
    const value = Object(9007199254740993n);
    value.toString = () => {
      throw new Error('must not lose bigint precision');
    };
    assert.equal(parse(value, 99), 99);
  });
}
for (const value of strictInvalid) {
  test(`parseStrict: rejects ${JSON.stringify(value)}`, () => {
    assert.equal(numbers.parseStrict(value, 99), 99);
  });
}
const extracted = [
  [' 123 ', 123],
  ['123f', 123],
  ['temperature: -12.5 C', -12.5],
  ['invoice-123', -123],
  ['1,234.50', 1],
  ['0x10', 0],
  ['1_000', 1],
  ['123n', 123],
  ['1e', 1],
  ['1e+', 1],
  ['1e-words', 1],
  ['1e2e3', 100],
  ['...25', 0.25],
  ['+-.25', -0.25],
  ['x+Infinity!', Infinity],
  ['Infinity.', Infinity],
  ['value -INFINITY.', -Infinity],
  ['NaN then 2', NaN],
  ['2 then NaN', 2],
  ['+NaN', NaN],
  ['-NaN', NaN],
  ['fooInfinity', undefined],
  ['fooNaN', undefined],
  ['Infinitys', undefined],
  ['NaNN', undefined],
  ['_Infinity', undefined],
  ['NaN_', undefined],
  ['Infinity2', 2],
  ['fooNaN 4', 4],
  ['value = .5e+2 px', 50],
  ['no number', undefined],
  ['∞', undefined],
  ['\0-0\n', -0]
];
for (const [value, expected] of extracted) {
  test(`parse: extracts from ${JSON.stringify(value)}`, () => {
    assert.ok(Object.is(numbers.parse(value), expected));
  });
}

test('arrays retain the explicit object-toString conversion policy', () => {
  assert.equal(numbers.parse([12.5, 7]), 12.5);
  assert.equal(numbers.parseStrict([12.5, 7], 99), 99);
  assert.equal(numbers.parseStrict([12.5]), 12.5);
});

test('generated short strings agree with an independent grammar oracle', () => {
  const decimal = '[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?';
  const strict = new RegExp('^(?:' + decimal + '|[+-]?Infinity|NaN)(?![\\s\\S])', 'i');
  const loose = new RegExp(decimal + '|[+-]?\\bInfinity\\b|\\bNaN\\b', 'i');
  const convert = (text) =>
    /nan/i.test(text) ? NaN : /infinity/i.test(text) ? (text[0] === '-' ? -Infinity : Infinity) : Number(text);
  const alphabet = '0129eE+-.x \n';
  let state = 0xabc123;
  for (let i = 0; i < 15000; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const length = state % 18;
    let text = '';
    for (let j = 0; j < length; j++) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      text += alphabet[state % alphabet.length];
    }
    const exact = strict.exec(text);
    const match = loose.exec(text);
    assert.ok(
      Object.is(numbers.parseStrict(text), exact ? convert(exact[0]) : undefined),
      `strict ${JSON.stringify(text)}`
    );
    assert.ok(Object.is(numbers.parse(text), match ? convert(match[0]) : undefined), `loose ${JSON.stringify(text)}`);
  }
});

test('long malformed inputs complete inside a bounded child process', { timeout: 12000 }, () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
        const assert = require('node:assert/strict');
        const numbers = require(${JSON.stringify(path.resolve(__dirname, '..'))});
        const long = '1'.repeat(250000);
        assert.equal(numbers.parseStrict(long + 'x', 99), 99);
        assert.equal(numbers.parseStrict(long + '\\n', 99), 99);
        assert.equal(numbers.parseStrict(long + 'e+', 99), 99);
        assert.equal(numbers.parseStrict('1.' + '1'.repeat(250000) + 'x', 99), 99);
        assert.equal(numbers.parseStrict('1e' + '1'.repeat(250000) + 'x', 99), 99);
        assert.equal(numbers.parse('-'.repeat(250000) + '7'), -7);
        assert.equal(numbers.parse('.'.repeat(250000)), undefined);
        assert.equal(numbers.parse('I'.repeat(250000)), undefined);
        assert.equal(numbers.parse('x'.repeat(250000) + ' 1e3'), 1000);
    `
    ],
    { encoding: 'utf8', timeout: 10000 }
  );
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});
