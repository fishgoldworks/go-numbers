'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const n = require('..');

// Explicit list makes an added export require an intentional contract decision.
const unaryPredicates = [
  'isInteger',
  'isSafeInteger',
  'isFinite',
  'isInfinite',
  'isNaN',
  'isEven',
  'isOdd',
  'isPositive',
  'isNegative',
  'isZero',
  'isZeroOrPositive',
  'isZeroOrNegative'
];
const converters = [
  'parse',
  'extractNumber',
  'parseStrict',
  'parseFinite',
  'parseSafeInteger',
  'getInteger',
  'getFraction'
];
const legacyConverters = ['parse', 'extractNumber', 'parseStrict', 'getInteger', 'getFraction'];
const operations = [
  ...unaryPredicates.map((name) => ({ name, run: (value) => n[name](value), expected: n[name](3), reject: false })),
  ...converters.map((name) => ({
    name,
    run: (value) => n[name](value, null),
    expected: name === 'getFraction' ? 0 : 3,
    reject: null
  })),
  { name: 'clamp', run: (value) => n.clamp(value, 0, 5), expected: 3, reject: TypeError },
  { name: 'isInRange', run: (value) => n.isInRange(value, 0, 5), expected: true, reject: false },
  { name: 'isClose', run: (value) => n.isClose(value, 3), expected: true, reject: false },
  ...['round', 'ceil', 'floor'].map((name) => ({
    name,
    run: (value) => n[name](value, 2),
    expected: 3,
    reject: TypeError
  })),
  { name: 'roundTo', run: (value) => n.roundTo(value, 0.5), expected: 3, reject: TypeError },
  { name: 'modulo', run: (value) => n.modulo(value, 5), expected: 3, reject: TypeError }
];
const foreignContext = vm.createContext({});
function poisonBox(box) {
  for (const key of ['toString', 'valueOf', 'constructor', Symbol.toPrimitive, Symbol.toStringTag]) {
    Object.defineProperty(box, key, {
      get() {
        throw new Error(`Box hook ${String(key)} must not run`);
      }
    });
  }
  return Object.freeze(box);
}
const representations = [
  ['Number subclass', () => new (class NumericBox extends Number {})(3)],
  ['null prototype Number', () => Object.setPrototypeOf(new Number(3), null)],
  ['foreign Number', () => vm.runInContext('new Number(3)', foreignContext)],
  ['changed prototype Number', () => Object.setPrototypeOf(new Number(3), String.prototype)]
];
for (const { name, run, expected } of operations) {
  for (const [label, make] of representations) {
    test(`${name} input: ${label} uses its internal numeric value, without reading hooks`, () => {
      assert.equal(run(poisonBox(make())), name === 'isNaN' ? false : expected);
    });
  }
}
const fallbackFactories = [
  ['undefined', () => undefined],
  ['null', () => null],
  ['false', () => false],
  ['empty text', () => ''],
  ['positive zero', () => 0],
  ['negative zero', () => -0],
  ['NaN', () => NaN],
  ['Infinity', () => Infinity],
  ['bigint', () => 9007199254740993n],
  ['symbol', () => Symbol('missing')],
  ['frozen object', () => Object.freeze({ missing: true })],
  ['array', () => Object.freeze(['missing'])],
  [
    'function',
    () =>
      function fallback() {
        throw new Error('fallback is a value, not a callback');
      }
  ],
  [
    'hostile proxy',
    () =>
      new Proxy(
        {},
        {
          get() {
            throw new Error('fallback must not be inspected');
          }
        }
      )
  ],
  [
    'revoked proxy',
    () => {
      const revocable = Proxy.revocable({}, {});
      revocable.revoke();
      return revocable.proxy;
    }
  ]
];
for (const name of converters) {
  for (const [label, make] of fallbackFactories) {
    test(`${name} fallback: preserves ${label} identity and never evaluates it`, () => {
      const fallback = make();
      for (const invalid of ['', null, undefined, true, false, 1n]) {
        assert.ok(Object.is(n[name](invalid, fallback), fallback));
      }
      assert.equal(n[name]('3', fallback), name === 'getFraction' ? 0 : 3);
    });
  }
  test(`${name} fallback: explicit undefined and omission behave identically`, () => {
    assert.equal(n[name]('no numeric input'), undefined);
    assert.equal(n[name]('no numeric input', undefined), undefined);
  });
}
const errorValues = [
  new Error('conversion failure'),
  undefined,
  null,
  false,
  0,
  -0,
  NaN,
  Symbol('conversion'),
  Object.freeze({ reason: 'conversion' })
];
function expectExactThrow(operation, value) {
  let thrown = false;
  try {
    operation();
  } catch (error) {
    thrown = true;
    assert.ok(Object.is(error, value));
  }
  assert.equal(thrown, true);
}
for (const name of legacyConverters) {
  test(`${name} conversion: propagates primitive and object exceptions from explicitly invoked hooks`, () => {
    for (const thrown of errorValues) {
      expectExactThrow(
        () =>
          n[name](
            {
              get toString() {
                throw thrown;
              }
            },
            null
          ),
        thrown
      );
      expectExactThrow(
        () =>
          n[name](
            {
              toString() {
                throw thrown;
              }
            },
            null
          ),
        thrown
      );
    }
  });
  test(`${name} conversion: callable proxy receives the original this, no arguments, and exactly one invocation`, () => {
    let gets = 0,
      calls = 0;
    const method = new Proxy(function () {}, {
      apply(_target, receiver, args) {
        calls++;
        assert.equal(receiver, input);
        assert.deepEqual(args, []);
        return '3';
      },
      get() {
        throw new Error('must not inspect function.call or function.apply');
      }
    });
    const input = {
      get toString() {
        gets++;
        return method;
      }
    };
    assert.equal(n[name](input), name === 'getFraction' ? 0 : 3);
    assert.equal(gets, 1);
    assert.equal(calls, 1);
  });
  test(`${name} conversion: does not invoke valueOf when toString is missing or returns an unsupported type`, () => {
    const fail = () => {
      throw new Error('must not fall through to valueOf');
    };
    const fallback = Object.freeze({ missing: true });
    for (const returned of [
      true,
      undefined,
      null,
      3n,
      Symbol('3'),
      [3],
      new Number(3),
      new String('3'),
      {
        toString() {
          throw new Error('no recursive conversion');
        }
      }
    ]) {
      const value = {
        toString() {
          return returned;
        },
        valueOf: fail,
        [Symbol.toPrimitive]: fail
      };
      assert.equal(n[name](value, fallback), fallback);
    }
    const value = Object.assign(Object.create(null), { valueOf: fail });
    assert.equal(n[name](value, fallback), fallback);
  });
  test(`${name} conversion: proxies around genuine boxes are not treated as intrinsic boxes`, () => {
    let gets = 0,
      calls = 0;
    const proxy = new Proxy(new Number(999), {
      get(_target, property) {
        assert.equal(property, 'toString');
        gets++;
        return function () {
          assert.equal(this, proxy);
          calls++;
          return '3';
        };
      }
    });
    assert.equal(n[name](proxy), name === 'getFraction' ? 0 : 3);
    assert.equal(gets, 1);
    assert.equal(calls, 1);
    const revoked = Proxy.revocable(new Number(3), {});
    revoked.revoke();
    assert.throws(() => n[name](revoked.proxy, null), TypeError);
  });
  test(`${name} conversion: genuine BigInt boxes are rejected before any custom conversion`, () => {
    for (const box of [Object(3n), vm.runInContext('Object(3n)', foreignContext)]) {
      Object.defineProperty(box, 'toString', {
        get() {
          throw new Error('bigint conversion must not run');
        }
      });
      assert.equal(n[name](box, null), null);
    }
  });
}
for (const name of [
  'parse',
  'extractNumber',
  'parseStrict',
  'parseFinite',
  'parseSafeInteger',
  'getInteger',
  'getFraction'
]) {
  test(`${name} input: genuine String boxes still work with a null, foreign, or changed prototype`, () => {
    const boxes = [
      new (class TextBox extends String {})('3'),
      Object.setPrototypeOf(new String('3'), null),
      vm.runInContext('new String("3")', foreignContext),
      Object.setPrototypeOf(new String('3'), Number.prototype)
    ];
    for (const box of boxes) assert.equal(n[name](poisonBox(box)), name === 'getFraction' ? 0 : 3);
  });
}
const rejectors = operations.filter((operation) => !legacyConverters.includes(operation.name));
const mismatches = [
  ['foreign Array', () => vm.runInContext('[3]', foreignContext)],
  ['foreign Function', () => vm.runInContext('() => 3', foreignContext)],
  ['Float64Array', () => new Float64Array([3])],
  ['DataView', () => new DataView(new ArrayBuffer(8))],
  ['Boolean box', () => new Boolean(true)],
  ['Symbol box', () => Object(Symbol('3'))],
  ['Date', () => new Date(3)],
  ['Promise', () => Promise.resolve(3)],
  ['fake Number', () => Object.create(Number.prototype)],
  ['proxy around Number', () => new Proxy(new Number(3), {})],
  [
    'revoked Number proxy',
    () => {
      const proxy = Proxy.revocable(new Number(3), {});
      proxy.revoke();
      return proxy.proxy;
    }
  ]
];
for (const { name, run, reject } of rejectors) {
  test(`${name} input: unsupported structural lookalikes cannot masquerade as numbers`, () => {
    for (const [label, make] of mismatches) {
      const value = make();
      if (reject === TypeError) assert.throws(() => run(value), TypeError, label);
      else assert.equal(run(value), reject, label);
    }
    let reads = 0;
    const value = new Proxy(
      {},
      {
        get() {
          reads++;
          throw new Error('value trap should not run');
        },
        getPrototypeOf() {
          reads++;
          throw new Error('prototype trap should not run');
        },
        has() {
          reads++;
          throw new Error('has trap should not run');
        }
      }
    );
    if (reject === TypeError) assert.throws(() => run(value), TypeError);
    else assert.equal(run(value), reject);
    assert.equal(reads, 0);
  });
}
for (const name of ['round', 'ceil', 'floor']) {
  test(`${name} configuration: precision errors take precedence over invalid or special values`, () => {
    for (const checked of [undefined, null, '1', NaN, Infinity, 0, -0]) {
      for (const precision of [null, '2', false, 2n, Symbol('precision'), new Number(2), {}]) {
        assert.throws(() => n[name](checked, precision), {
          name: 'TypeError',
          message: 'decimalPlaces must be a primitive number.'
        });
      }
      for (const precision of [-309, 325, 0.5, Number.MIN_VALUE, NaN, Infinity]) {
        assert.throws(() => n[name](checked, precision), RangeError);
      }
    }
  });
}
for (const [name, parameter] of [
  ['roundTo', 'step'],
  ['modulo', 'modulus']
]) {
  test(`${name} configuration: second operand is validated before the checked value`, () => {
    for (const value of [undefined, null, 'bad', NaN, Infinity, 0, -0]) {
      assert.throws(
        () => n[name](value),
        (error) => error instanceof TypeError && error.message.startsWith(parameter)
      );
      for (const bad of [-0, 0, -Number.MIN_VALUE, NaN, Infinity, -Infinity]) {
        assert.throws(
          () => n[name](value, new Number(bad)),
          (error) => error instanceof RangeError && error.message.startsWith(parameter)
        );
      }
    }
  });
}
test('captured Number/String unboxing intrinsics resist later prototype replacement in an isolated process', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
        const assert = require('node:assert/strict');
        const n = require(${JSON.stringify(path.resolve(__dirname, '..'))});
        const number = new Number(3), text = new String('3');
        Number.prototype.valueOf = () => { throw new Error('replacement number intrinsic'); };
        String.prototype.valueOf = () => { throw new Error('replacement string intrinsic'); };
        for (const name of ['parse', 'parseStrict', 'parseFinite', 'parseSafeInteger', 'getInteger']) {
            assert.equal(n[name](number), 3);
            assert.equal(n[name](text), 3);
        }
        assert.equal(n.isInteger(number), true);
        assert.equal(n.round(number), 3);
        assert.equal(n.roundTo(number, .5), 3);
        assert.equal(n.modulo(number, 5), 3);
    `
    ],
    { encoding: 'utf8', timeout: 5000 }
  );
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});
