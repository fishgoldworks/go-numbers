'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const vm = require('node:vm');

const filename = path.resolve(__dirname, '../src/internal/toParseInput.js');
const source = fs.readFileSync(filename, 'utf8');
const localRequire = createRequire(filename);

function loadWithoutBigIntModule(error) {
  const module = { exports: {} };
  vm.runInNewContext(
    source,
    {
      module,
      SyntaxError,
      require(name) {
        if (name === './bigintBrand') throw error;
        return localRequire(name);
      }
    },
    { filename }
  );
  return module.exports;
}

test('legacy hosts without BigInt syntax retain primitive, boxed and explicit object conversion', () => {
  const convert = loadWithoutBigIntModule(new SyntaxError('BigInt syntax is unavailable'));
  assert.equal(convert('12.5'), '12.5');
  assert.equal(convert(12.5), 12.5);
  assert.equal(convert(new Number(12.5)), 12.5);
  assert.equal(convert(new String('12.5')), '12.5');
  let conversions = 0;
  const value = {
    toString() {
      conversions++;
      return '12.5';
    }
  };
  assert.equal(convert(value), '12.5');
  assert.equal(conversions, 1);
  assert.equal(convert(null), undefined);
});

test('unexpected BigInt module loading failures are propagated unchanged', () => {
  const sentinel = new Error('module loading failed');
  assert.throws(
    () => loadWithoutBigIntModule(sentinel),
    (error) => error === sentinel
  );
});

for (const profile of ['undefined', 'deleted']) {
  test(`BigInt boxes are rejected without conversion when valueOf is ${profile}`, () => {
    const brandFilename = path.resolve(__dirname, '../src/internal/bigintBrand.js');
    const brandSource = fs.readFileSync(brandFilename, 'utf8');
    const module = { exports: {} };
    const context = vm.createContext({ module });
    vm.runInContext(
      profile === 'deleted' ? 'delete BigInt.prototype.valueOf' : 'BigInt.prototype.valueOf = undefined',
      context
    );
    vm.runInContext(brandSource, context, { filename: brandFilename });
    const box = Object(9007199254740993n);
    Object.defineProperty(box, 'toString', {
      get() {
        return assert.fail('conversion hook');
      }
    });
    assert.doesNotThrow(() => module.exports(box));
    assert.throws(
      () =>
        module.exports({
          toString() {
            assert.fail('conversion hook');
          }
        }),
      (error) => error.name === 'TypeError'
    );
  });
}
