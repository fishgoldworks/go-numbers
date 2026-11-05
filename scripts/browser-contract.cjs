'use strict';
// Shared behaviour contract runs inside each loader/browser realm.
function checkBrowserContract(api, document) {
  function check(actual, expected) {
    if (!Object.is(actual, expected)) throw Error('Unexpected result: ' + JSON.stringify({ actual, expected }));
  }

  for (const name of [
    'EPSILON',
    'MAX_SAFE_INTEGER',
    'MIN_SAFE_INTEGER',
    'MAX_VALUE',
    'MIN_VALUE',
    'NEGATIVE_INFINITY',
    'POSITIVE_INFINITY',
    'NaN'
  ])
    check(api[name], Number[name]);
  for (const [name, input, expected] of [
    ['isInteger', 2, true],
    ['isSafeInteger', 9007199254740992, false],
    ['isInfinite', Infinity, true],
    ['isEven', -4, true],
    ['isOdd', -3, true],
    ['isPositive', Infinity, true],
    ['isNegative', -1, true],
    ['isZero', -0, true],
    ['isZeroOrPositive', 0, true],
    ['isZeroOrNegative', 1, false],
    ['isNaN', NaN, true],
    ['parse', 'width:12px', 12],
    ['extractNumber', 'width:12px', 12],
    ['parseStrict', '1e3', 1000],
    ['parseFinite', '1.25', 1.25],
    ['parseSafeInteger', '12', 12],
    ['getInteger', -1.2, -2],
    ['getFraction', -1.25, 0.25]
  ])
    check(api[name](input), expected);
  check(api.extractNumber, api.parse);
  check(api.round(1.005, 2), 1.01);
  check(api.ceil(1.001, 2), 1.01);
  check(api.floor(-1.001, 2), -1.01);
  check(api.isInRange(3, 0, 5), true);
  check(api.isInRange(5, 0, 5, { includeMax: false }), false);
  check(api.roundTo(1.375, 0.25), 1.5);
  check(api.roundTo(-0.1, 1), -0);
  check(api.roundTo(1e308, 3e-308), 1e308);
  check(api.modulo(-Number.MIN_VALUE, 1), 1 - Number.EPSILON / 2);
  const unsupported = Object(1n);
  Object.defineProperty(unsupported, 'toString', {
    get() {
      throw Error('BigInt box was coerced');
    }
  });
  check(api.parse(unsupported, false), false);
  check(
    api.parseFinite(
      {
        toString() {
          throw Error('safe parser converted input');
        }
      },
      null
    ),
    null
  );
  let rejected = false;
  try {
    api.roundTo(1, 0);
  } catch (error) {
    rejected = error instanceof RangeError;
  }
  check(rejected, true);
  check(api.clamp(10, 0, 5), 5);
  check(api.isFinite('3'), false);
  check(api.isFinite(3), true);
  check(api.modulo(-1, 5), 4);

  let reads = 0;
  check(
    api.isClose(1, 1.1, {
      get absoluteTolerance() {
        reads++;
        return 0.5;
      },
      relativeTolerance: 0
    }),
    true
  );
  check(reads, 1);
  const failure = new Error('config failure');
  let caught;
  try {
    api.isClose(1, 1, {
      get relativeTolerance() {
        throw failure;
      }
    });
  } catch (error) {
    caught = error;
  }
  if (caught !== failure) throw Error('getter failure identity');
  if (typeof document !== 'undefined') {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    try {
      check(api.isOdd(new frame.contentWindow.Number(-3)), true);
      check(api.parseFinite(new frame.contentWindow.String('1.25')), 1.25);
    } finally {
      frame.remove();
    }
    check(api.isFinite(document.all), false);
    check(api.parse(document.all, 'missing'), 'missing');
  }
  return true;
}
checkBrowserContract.example = 1.5;
module.exports = checkBrowserContract;
