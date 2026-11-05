// Original active assertions ported to node:test; archived random APIs are out of scope.
(function () {
  'use strict';

  var assert = require('node:assert/strict');
  var { describe: suite, it: test } = require('node:test');

  var Types = { isNaN: Number.isNaN };
  var Numbers = require('../src/Numbers');

  suite('go/Numbers', function () {
    suite('#isInteger', function () {
      var isInteger = Numbers.isInteger;

      test('original active assertions', function () {
        assert.equal(isInteger(0), true);
        assert.equal(isInteger(1.0), true);
        assert.equal(isInteger(Number.MIN_SAFE_INTEGER), true);
        assert.equal(isInteger(Number.MAX_SAFE_INTEGER), true);
        assert.equal(isInteger(new Number(1)), true);

        assert.equal(isInteger(Number.MIN_VALUE), false);
        assert.equal(isInteger(Number.MAX_VALUE), true);
        assert.equal(isInteger(Number.POSITIVE_INFINITY), false);
        assert.equal(isInteger(Number.NEGATIVE_INFINITY), false);
        assert.equal(isInteger(0.001), false);
        assert.equal(isInteger('0'), false);
        assert.equal(isInteger(Number.NaN), false);
        assert.equal(isInteger(null), false);

        // these tests will fail due to the precision limitation of JavaScript numbers
        //                assert.equal(isInteger(0.00000000001), false);
        //                assert.equal(isInteger(123456789.00000000001), false);
      });
    });

    suite('#isEven', function () {
      var isEven = Numbers.isEven;

      test('original active assertions', function () {
        assert.equal(isEven(0), true);
        assert.equal(isEven(2), true);
        assert.equal(isEven(-2), true);
        assert.equal(isEven(new Number(2)), true);
        assert.equal(isEven(1024), true);

        assert.equal(isEven(1), false);
        assert.equal(isEven(-1), false);
        assert.equal(isEven(2.0001), false);
        assert.equal(isEven(Number.NaN), false);
        assert.equal(isEven(null), false);
        assert.equal(isEven('2'), false);
      });
    });

    suite('#isOdd', function () {
      var isOdd = Numbers.isOdd;

      test('original active assertions', function () {
        assert.equal(isOdd(1), true);
        assert.equal(isOdd(-1), true);
        assert.equal(isOdd(new Number(1)), true);
        assert.equal(isOdd(1023), true);

        assert.equal(isOdd(0), false);
        assert.equal(isOdd(2), false);
        assert.equal(isOdd(-2), false);
        assert.equal(isOdd(1.0001), false);
        assert.equal(isOdd(Number.NaN), false);
        assert.equal(isOdd(null), false);
        assert.equal(isOdd('1'), false);
      });
    });

    suite('#isSafeInteger', function () {
      var isSafeInteger = Numbers.isSafeInteger;

      test('original active assertions', function () {
        assert.equal(isSafeInteger(0), true);
        assert.equal(isSafeInteger(Number.MAX_SAFE_INTEGER), true);
        assert.equal(isSafeInteger(Number.MIN_SAFE_INTEGER), true);
        assert.equal(isSafeInteger(new Number(1)), true);

        assert.equal(isSafeInteger(Number.MAX_SAFE_INTEGER + 1), false);
        assert.equal(isSafeInteger(Number.MIN_SAFE_INTEGER - 1), false);
        assert.equal(isSafeInteger(Number.MIN_VALUE), false);
        assert.equal(isSafeInteger(Number.MAX_VALUE), false);
        assert.equal(isSafeInteger(0.0001), false);
        assert.equal(isSafeInteger(Number.NaN), false);
        assert.equal(isSafeInteger(null), false);
        assert.equal(isSafeInteger('0'), false);
      });
    });

    suite('#isFinite', function () {
      var isFinite = Numbers.isFinite;

      test('original active assertions', function () {
        assert.equal(isFinite(0), true);
        assert.equal(isFinite(-1), true);
        assert.equal(isFinite(1.00001), true);
        assert.equal(isFinite(Number.MAX_VALUE), true);
        assert.equal(isFinite(Number.MIN_VALUE), true);
        assert.equal(isFinite(new Number(1)), true);

        assert.equal(isFinite(Number.POSITIVE_INFINITY), false);
        assert.equal(isFinite(Number.NEGATIVE_INFINITY), false);
        assert.equal(isFinite(Number.NaN), false);
        assert.equal(isFinite(null), false);
        assert.equal(isFinite('0'), false);
      });
    });

    suite('#isInfinite', function () {
      var isInfinite = Numbers.isInfinite;

      test('original active assertions', function () {
        assert.equal(isInfinite(Number.POSITIVE_INFINITY), true);
        assert.equal(isInfinite(Number.NEGATIVE_INFINITY), true);
        assert.equal(isInfinite(new Number(Number.POSITIVE_INFINITY)), true);

        assert.equal(isInfinite(0), false);
        assert.equal(isInfinite(Number.MAX_VALUE), false);
        assert.equal(isInfinite(Number.MIN_VALUE), false);
        assert.equal(isInfinite(Number.NaN), false);
        assert.equal(isInfinite(null), false);
        assert.equal(isInfinite('0'), false);
      });
    });

    suite('#isNaN', function () {
      var isNaN = Numbers.isNaN;

      test('original active assertions', function () {
        assert.equal(isNaN(Number.NaN), true);
        assert.equal(isNaN('a' / 1), true);
        assert.equal(isNaN(new Number(Number.NaN)), false); // a Number object that represents NaN is not NaN.

        assert.equal(isNaN(Number.POSITIVE_INFINITY), false);
        assert.equal(isNaN(Number.NEGATIVE_INFINITY), false);
        assert.equal(isNaN(null), false);
        assert.equal(isNaN('NaN'), false);
        assert.equal(isNaN('0'), false);
      });
    });

    suite('#isPositive', function () {
      var isPositive = Numbers.isPositive;

      test('original active assertions', function () {
        assert.equal(isPositive(0), false);
        assert.equal(isPositive(-1), false);
        assert.equal(isPositive(1), true);
        assert.equal(isPositive(new Number(0)), false);
        assert.equal(isPositive(new Number(1)), true);
        assert.equal(isPositive(Number.MIN_VALUE), true);
        assert.equal(isPositive(Number.MAX_VALUE), true);
        assert.equal(isPositive(Number.POSITIVE_INFINITY), true);
        assert.equal(isPositive(Number.NEGATIVE_INFINITY), false);
        assert.equal(isPositive('1'), false);
      });
    });

    suite('#isNegative', function () {
      var isNegative = Numbers.isNegative;

      test('original active assertions', function () {
        assert.equal(isNegative(0), false);
        assert.equal(isNegative(-1), true);
        assert.equal(isNegative(1), false);
        assert.equal(isNegative(new Number(0)), false);
        assert.equal(isNegative(new Number(-1)), true);
        assert.equal(isNegative(Number.MIN_VALUE), false);
        assert.equal(isNegative(Number.MAX_VALUE), false);
        assert.equal(isNegative(Number.POSITIVE_INFINITY), false);
        assert.equal(isNegative(Number.NEGATIVE_INFINITY), true);
        assert.equal(isNegative('-1'), false);
      });
    });

    suite('#isZero', function () {
      var isZero = Numbers.isZero;

      test('original active assertions', function () {
        assert.equal(isZero(0), true);
        assert.equal(isZero(new Number(0)), true);

        assert.equal(isZero(-1), false);
        assert.equal(isZero(1), false);
        assert.equal(isZero(0.000000001), false);
        assert.equal(isZero('0'), false);
        assert.equal(isZero(null), false);
      });
    });

    suite('#isZeroOrPositive', function () {
      var isZeroOrPositive = Numbers.isZeroOrPositive;

      test('original active assertions', function () {
        assert.equal(isZeroOrPositive(0), true);
        assert.equal(isZeroOrPositive(1), true);
        assert.equal(isZeroOrPositive(new Number(0)), true);
        assert.equal(isZeroOrPositive(new Number(1)), true);
        assert.equal(isZeroOrPositive(Number.MIN_VALUE), true);
        assert.equal(isZeroOrPositive(Number.MAX_VALUE), true);
        assert.equal(isZeroOrPositive(Number.POSITIVE_INFINITY), true);
        assert.equal(isZeroOrPositive(Number.NEGATIVE_INFINITY), false);
        assert.equal(isZeroOrPositive(-1), false);
        assert.equal(isZeroOrPositive('1'), false);
      });
    });

    suite('#isZeroOrNegative', function () {
      var isZeroOrNegative = Numbers.isZeroOrNegative;

      test('original active assertions', function () {
        assert.equal(isZeroOrNegative(0), true);
        assert.equal(isZeroOrNegative(-1), true);
        assert.equal(isZeroOrNegative(new Number(0)), true);
        assert.equal(isZeroOrNegative(new Number(-1)), true);
        assert.equal(isZeroOrNegative(Number.MIN_VALUE), false);
        assert.equal(isZeroOrNegative(Number.MAX_VALUE), false);
        assert.equal(isZeroOrNegative(Number.POSITIVE_INFINITY), false);
        assert.equal(isZeroOrNegative(Number.NEGATIVE_INFINITY), true);
        assert.equal(isZeroOrNegative(1), false);
        assert.equal(isZeroOrNegative('-1'), false);
      });
    });

    suite('#getInteger', function () {
      var getInteger = Numbers.getInteger;

      test('original active assertions', function () {
        assert.equal(getInteger(0), 0);
        assert.equal(getInteger(-1), -1);
        assert.equal(getInteger(1.0), 1);
        assert.equal(getInteger(123456.789), 123456);
        assert.equal(getInteger('123456.7890'), 123456);
      });
    });

    suite('#getFraction', function () {
      var getFraction = Numbers.getFraction;

      test('original active assertions', function () {
        assert.equal(getFraction(0), 0);
        assert.equal(getFraction(12.345), 0.345);
        assert.equal(getFraction(-1.01), 0.01);
        assert.equal(getFraction('123456.7890'), 0.789);
      });
    });

    suite('#parse', function () {
      var parse = Numbers.parse;

      test('original active assertions', function () {
        assert.equal(parse('0'), 0);
        assert.equal(parse('-1'), -1);
        assert.equal(parse('1'), 1);
        assert.equal(parse('+1'), 1);
        assert.equal(parse('0.123'), 0.123);
        assert.equal(parse('.123'), 0.123);
        assert.equal(parse('12.'), 12);
        assert.equal(parse('1.2345E6'), 1.2345e6);
        assert.equal(parse('.123E2'), 0.123e2);
        assert.equal(parse('12.E2'), 12e2);
        assert.equal(parse('1.2345E-6'), 1.2345e-6);
        assert.equal(parse('.123E-2'), 0.123e-2);
        assert.equal(parse('12.E-2'), 12e-2);

        assert.equal(parse(' 123  '), 123);
        assert.equal(parse('123f'), 123);

        assert.equal(parse(''), undefined);
        assert.equal(parse('', 0), 0);

        assert.equal(parse('Infinity'), Number.POSITIVE_INFINITY);
        assert.equal(parse('+Infinity'), Number.POSITIVE_INFINITY);
        assert.equal(parse('-Infinity'), Number.NEGATIVE_INFINITY);
        assert(Types.isNaN(parse('NaN')));

        assert.equal(parse('Infinity.'), Number.POSITIVE_INFINITY);
        assert.equal(parse('Infinitys'), undefined);
        assert.equal(parse('NaNN'), undefined);
      });
    });

    suite('#parseStrict', function () {
      var parseStrict = Numbers.parseStrict;

      test('original active assertions', function () {
        assert.equal(parseStrict('0'), 0);
        assert.equal(parseStrict('-1'), -1);
        assert.equal(parseStrict('1'), 1);
        assert.equal(parseStrict('+1'), 1);
        assert.equal(parseStrict('0.123'), 0.123);
        assert.equal(parseStrict('.123'), 0.123);
        assert.equal(parseStrict('12.'), 12);
        assert.equal(parseStrict('1.2345E6'), 1.2345e6);
        assert.equal(parseStrict('.123E2'), 12.3);
        assert.equal(parseStrict('12.E2'), 1200);
        assert.equal(parseStrict('1.2345E-6'), 1.2345e-6);
        assert.equal(parseStrict('.123E-2'), 0.123e-2);
        assert.equal(parseStrict('12.E-2'), 12e-2);

        assert.equal(parseStrict(' 123 '), undefined);
        assert.equal(parseStrict('123f'), undefined);
        assert.equal(parseStrict(''), undefined);
        assert.equal(parseStrict('', 0), 0);

        assert.equal(parseStrict('Infinity'), Number.POSITIVE_INFINITY);
        assert.equal(parseStrict('+Infinity'), Number.POSITIVE_INFINITY);
        assert.equal(parseStrict('-Infinity'), Number.NEGATIVE_INFINITY);
        assert(Types.isNaN(parseStrict('NaN')));

        assert.equal(parseStrict('Infinity.'), undefined);
        assert.equal(parseStrict('Infinitys'), undefined);
        assert.equal(parseStrict('NaNN'), undefined);
      });
    });
  });
})();
