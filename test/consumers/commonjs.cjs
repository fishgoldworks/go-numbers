const assert = require('assert');
const numbers = require('go-numbers');
Object.keys(numbers).forEach(function (name) {
  if (typeof numbers[name] !== 'function') return;
  assert.strictEqual(require('go-numbers/' + name), numbers[name]);
  assert.strictEqual(require('go-numbers/src/' + name), numbers[name]);
  assert.strictEqual(require('go-numbers/src/' + name + '.js'), numbers[name]);
});
assert.strictEqual(require('go-numbers/index.js'), numbers);
assert.strictEqual(require('go-numbers/src/Numbers'), numbers);
assert.strictEqual(require('go-numbers/src/parseInt'), numbers.parse);
assert.strictEqual(numbers.parseStrict('12.5'), 12.5);
assert.strictEqual(
  numbers.parse({
    toString: function () {
      return '12px';
    }
  }),
  12
);
assert.strictEqual(numbers.isOdd(-3), true);
assert.strictEqual(numbers.roundTo(1.375, 0.25), 1.5);
assert.strictEqual(numbers.roundTo(-1.375, 0.25), -1.25);
assert.strictEqual(numbers.roundTo(Number.MAX_VALUE, 0.03), Number.MAX_VALUE);
assert.strictEqual(numbers.roundTo(1, 2e-323), 1);
assert.strictEqual(numbers.roundTo(2e-323, 3e-323), 3e-323);
assert.strictEqual(numbers.modulo(-1, 5), 4);
assert.strictEqual(numbers.isInRange(1, 0, 1, { includeMax: false }), false);
assert.strictEqual(numbers.isClose(1, 1.1, { absoluteTolerance: 0.2, relativeTolerance: 0 }), true);
if (typeof BigInt === 'function') {
  assert.strictEqual(numbers.parse(BigInt(12), null), null);
  assert.strictEqual(numbers.parse(Object(BigInt(12)), null), null);
}
require('./contracts.cjs')(numbers);
console.log('PASS: installed CommonJS identities and arithmetic on ' + process.version);
