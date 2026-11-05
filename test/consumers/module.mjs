import assert from 'assert';
import { createRequire } from 'module';
import numbers, * as named from 'go-numbers';
import isOdd, { isOdd as namedOdd } from 'go-numbers/isOdd';
const require = createRequire(import.meta.url);
assert.strictEqual(numbers, require('go-numbers'));
assert.strictEqual(isOdd, numbers.isOdd);
assert.strictEqual(namedOdd, isOdd);
async function main() {
  for (const name of Object.keys(numbers)) {
    assert.ok(Object.is(named[name], numbers[name]), name);
    if (typeof numbers[name] === 'function') {
      for (const suffix of ['/' + name, '/src/' + name, '/src/' + name + '.js']) {
        const focused = await import('go-numbers' + suffix);
        assert.strictEqual(focused.default, numbers[name]);
        assert.strictEqual(focused[name], numbers[name]);
      }
    }
  }
  assert.strictEqual(numbers.roundTo(0.15, 0.1), 0.2);
  assert.strictEqual(numbers.parse(Object(BigInt(12)), null), null);
  require('./contracts.cjs')(numbers);
  assert.strictEqual((await import('go-numbers/index.js')).default, numbers);
  assert.strictEqual((await import('go-numbers/src/Numbers.js')).default, numbers);
  assert.strictEqual((await import('go-numbers/src/parseInt.js')).default, numbers.parse);
  console.log('PASS: installed native ESM identities and arithmetic on ' + process.version);
}
main().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
