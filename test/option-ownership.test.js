'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const numbers = require('..');

const cases = [
  {
    name: 'isInRange',
    first: 'includeMin',
    second: 'includeMax',
    firstValue: true,
    secondValue: false,
    defaultResult: true,
    configuredResult: false,
    call: (options) => numbers.isInRange(10, 0, 10, options)
  },
  {
    name: 'isClose',
    first: 'relativeTolerance',
    second: 'absoluteTolerance',
    firstValue: 0,
    secondValue: 10,
    defaultResult: false,
    configuredResult: true,
    call: (options) => numbers.isClose(0, 1, options)
  }
];

for (const spec of cases) {
  test(`option ownership: ${spec.name} ignores a deleted own option instead of reading its prototype`, () => {
    let inheritedReads = 0;
    const prototype = Object.defineProperty({}, spec.second, {
      get() {
        inheritedReads++;
        return spec.secondValue;
      }
    });
    const options = Object.create(prototype);
    Object.defineProperty(options, spec.first, {
      enumerable: true,
      get() {
        delete options[spec.second];
        return spec.firstValue;
      }
    });
    Object.defineProperty(options, spec.second, {
      configurable: true,
      enumerable: true,
      value: spec.secondValue
    });
    assert.equal(spec.call(options), spec.defaultResult);
    assert.equal(inheritedReads, 0, 'deleted own properties must not expose inherited getters');
  });

  test(`option ownership: ${spec.name} ignores keys listed by a proxy without an own descriptor`, () => {
    let valueReads = 0;
    const prototype = { [spec.second]: spec.secondValue };
    const target = Object.assign(Object.create(prototype), { [spec.first]: spec.firstValue });
    const options = new Proxy(target, {
      ownKeys() {
        return [spec.first, spec.second];
      },
      get(object, key, receiver) {
        if (key === spec.second) valueReads++;
        return Reflect.get(object, key, receiver);
      }
    });
    assert.equal(spec.call(options), spec.defaultResult);
    assert.equal(valueReads, 0);
  });

  test(`option ownership: ${spec.name} propagates descriptor-trap errors without reading values`, () => {
    const sentinel = new Error('descriptor failure');
    let valueReads = 0;
    const options = new Proxy(
      { [spec.first]: spec.firstValue },
      {
        getOwnPropertyDescriptor() {
          throw sentinel;
        },
        get() {
          valueReads++;
          return spec.firstValue;
        }
      }
    );
    assert.throws(
      () => spec.call(options),
      (error) => error === sentinel
    );
    assert.equal(valueReads, 0);
  });

  test(`option ownership: ${spec.name} preserves every descriptor-trap thrown value`, () => {
    for (const sentinel of [undefined, null, false, 0, -0, NaN, 'failure', Symbol('failure'), {}]) {
      const options = new Proxy(
        { [spec.first]: spec.firstValue },
        {
          getOwnPropertyDescriptor() {
            throw sentinel;
          }
        }
      );
      let caught = false;
      try {
        spec.call(options);
      } catch (error) {
        caught = true;
        assert.ok(Object.is(error, sentinel));
      }
      assert.equal(caught, true);
    }
  });

  test(`option ownership: ${spec.name} ignores phantom unknown keys that have no own property`, () => {
    for (const key of ['typo', Symbol('typo')]) {
      const options = new Proxy(
        {},
        {
          ownKeys() {
            return [key];
          },
          get() {
            throw new Error('phantom value must not be read');
          }
        }
      );
      assert.equal(spec.call(options), spec.defaultResult);
    }
  });

  test(`option ownership: ${spec.name} reads a still-owned replacement option live`, () => {
    const options = Object.defineProperty({}, spec.first, {
      get() {
        Object.defineProperty(options, spec.second, {
          value: spec.secondValue,
          configurable: true
        });
        return spec.firstValue;
      }
    });
    Object.defineProperty(options, spec.second, { configurable: true, value: undefined });
    assert.equal(spec.call(options), spec.configuredResult);
  });

  test(`option ownership: ${spec.name} supports virtual own properties with descriptors and one live get`, () => {
    const events = [];
    const options = new Proxy(
      {},
      {
        ownKeys() {
          events.push('keys');
          return [spec.first, spec.second];
        },
        getOwnPropertyDescriptor(object, key) {
          events.push('own:' + key);
          return { configurable: true, enumerable: true, writable: true, value: undefined };
        },
        get(object, key, receiver) {
          assert.equal(receiver, options);
          events.push('get:' + key);
          return key === spec.first ? spec.firstValue : spec.secondValue;
        },
        getPrototypeOf() {
          throw new Error('prototype must not be inspected');
        }
      }
    );
    assert.equal(spec.call(options), spec.configuredResult);
    assert.deepEqual(events, [
      'keys',
      'own:' + spec.first,
      'get:' + spec.first,
      'own:' + spec.second,
      'get:' + spec.second
    ]);
  });

  test(`option ownership: ${spec.name} ignores options added after the key snapshot`, () => {
    const options = Object.defineProperty({}, spec.first, {
      get() {
        options[spec.second] = spec.secondValue;
        return spec.firstValue;
      }
    });
    assert.equal(spec.call(options), spec.defaultResult);
    assert.equal(spec.call(options), spec.configuredResult);
  });

  test(`option ownership: ${spec.name} ignores a deleted unknown key without invoking its value`, () => {
    const options = {};
    Object.defineProperty(options, spec.first, {
      get() {
        delete options.typo;
        return spec.firstValue;
      }
    });
    Object.defineProperty(options, 'typo', {
      configurable: true,
      get() {
        throw new Error('unknown value must not run');
      }
    });
    assert.equal(spec.call(options), spec.defaultResult);
  });
}
