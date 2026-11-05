'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const n = require('..');

// Independent bounded-input grammar, not the production scanner. An explicit
// end-of-input assertion is required: "$" would accept a final line terminator.
const decimal = '[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?';
const strictGrammar = new RegExp('^(?:' + decimal + '|[+-]?Infinity|NaN)(?![\\s\\S])', 'i');
const extractionGrammar = new RegExp(decimal + '|[+-]?\\bInfinity\\b|\\bNaN\\b', 'i');
const integerGrammar = /^[+-]?[0-9]+(?![\s\S])/;
const missing = Object.freeze({ missing: true });
function convert(text) {
  if (/^nan$/i.test(text)) return NaN;
  if (/^[+-]?infinity$/i.test(text)) return text[0] === '-' ? -Infinity : Infinity;
  return Number(text);
}
function check(text) {
  const exact = strictGrammar.exec(text),
    token = extractionGrammar.exec(text);
  const strict = exact ? convert(exact[0]) : missing;
  const extracted = token ? convert(token[0]) : missing;
  const finite = Number.isFinite(strict) ? strict : missing;
  const integer = integerGrammar.test(text) && Number.isSafeInteger(Number(text)) ? Number(text) : missing;
  for (const [name, expected] of [
    ['parse', extracted],
    ['extractNumber', extracted],
    ['parseStrict', strict],
    ['parseFinite', finite],
    ['parseSafeInteger', integer]
  ]) {
    assert.ok(Object.is(n[name](text, missing), expected), `${name}(${JSON.stringify(text)})`);
  }
}
function* strings(alphabet, length, prefix = '') {
  if (length === 0) {
    yield prefix;
    return;
  }
  for (const character of alphabet) yield* strings(alphabet, length - 1, prefix + character);
}
for (let length = 0; length <= 4; length++) {
  test(`parser grammar: exhaustive length ${length} over 12 lexical representatives`, () => {
    let count = 0;
    for (const text of strings('01eE+-.x_ \n\0', length)) {
      check(text);
      count++;
    }
    assert.equal(count, 12 ** length);
  });
}
const mantissas = [
  '0',
  '00',
  '00012',
  '1',
  '9',
  '12.',
  '0.',
  '.0',
  '.5',
  '0.50',
  '12.345',
  '9007199254740991',
  '9007199254740992',
  '9007199254740993',
  '1.0000000000000001'
];
const exponents = [
  '',
  'e0',
  'E+0',
  'e-0',
  'e0002',
  'E+308',
  'e309',
  'e-324',
  'e-325',
  'e99999',
  'e-99999',
  'e',
  'e+',
  'e-',
  'e++1',
  'e--1',
  'e+-1',
  'e1.5',
  'e1e2'
];
for (const sign of ['', '+', '-']) {
  for (const mantissa of mantissas) {
    test(`parser grammar: ${JSON.stringify(sign + mantissa)} with every exponent class`, () => {
      for (const exponent of exponents) check(sign + mantissa + exponent);
    });
  }
}
function spellings(word) {
  return Array.from({ length: 2 ** word.length }, (_, mask) =>
    [...word].map((letter, index) => (mask & (2 ** index) ? letter.toUpperCase() : letter.toLowerCase())).join('')
  );
}
for (const word of ['Infinity', 'NaN']) {
  test(`parser grammar: every ASCII letter-case spelling and sign of ${word}`, () => {
    for (const spelling of spellings(word))
      for (const sign of ['', '+', '-']) {
        check(sign + spelling);
        check(`prefix ${sign}${spelling} suffix 42`);
        check(`7 before ${sign}${spelling}`);
      }
  });
  test(`parser grammar: ${word} has ASCII word boundaries for every adjacent ASCII code unit`, () => {
    for (let code = 0; code < 128; code++) {
      const adjacent = String.fromCharCode(code);
      for (const sign of ['', '+', '-']) {
        check(adjacent + sign + word + ' 7');
        check(sign + word + adjacent + ' 7');
      }
    }
  });
}
const separators = [
  '\u0009',
  '\u000a',
  '\u000b',
  '\u000c',
  '\u000d',
  ' ',
  '\u0085',
  '\u00a0',
  '\u1680',
  '\u180e',
  '\u2000',
  '\u2001',
  '\u2002',
  '\u2003',
  '\u2004',
  '\u2005',
  '\u2006',
  '\u2007',
  '\u2008',
  '\u2009',
  '\u200a',
  '\u200b',
  '\u2028',
  '\u2029',
  '\u202f',
  '\u205f',
  '\u2060',
  '\u3000',
  '\ufeff',
  '\0',
  '\ud800',
  '\udfff',
  '😀'
];
for (const separator of separators) {
  test(`parser grammar: no implicit trimming of U+${separator.codePointAt(0).toString(16).toUpperCase()}`, () => {
    for (const value of ['12', '-.25e+2', 'Infinity', 'NaN']) {
      check(separator + value);
      check(value + separator);
      check(separator + value + separator);
    }
  });
}
test('parser grammar: alternate digit sets, signs, separators and grouping are not decimal syntax', () => {
  for (const text of [
    '١٢',
    '۱۲',
    '१२',
    '১২',
    '１２',
    '𝟙𝟚',
    '−12',
    '＋12',
    '﹣12',
    '1٫25',
    '1٬250',
    '1,250',
    '1\u202f250',
    '1_250',
    '0xFF',
    '0b101',
    '0o77',
    '12n'
  ]) {
    check(text);
    check(`item: ${text} remaining 8`);
  }
});
test('parser grammar: all ASCII insertions distinguish valid continuations from leftover input', () => {
  for (const original of ['-1.5e+2', '12', '.5', '1e-2']) {
    for (let index = 0; index <= original.length; index++) {
      for (let code = 0; code < 128; code++) {
        check(original.slice(0, index) + String.fromCharCode(code) + original.slice(index));
      }
    }
  }
});
test('safe integer text: every integer around both safety boundaries is checked before conversion', () => {
  for (const sign of [-1n, 1n])
    for (let offset = -128n; offset <= 128n; offset++) {
      const integer = sign * (9007199254740991n + offset);
      const expected = integer >= -9007199254740991n && integer <= 9007199254740991n ? Number(integer) : missing;
      const text = `${integer < 0n ? '-' : '+'}000${integer < 0n ? -integer : integer}`;
      assert.ok(Object.is(n.parseSafeInteger(text, missing), expected), text);
    }
});
test(
  'parser rejection and extraction remain bounded for million-character adversarial inputs',
  { timeout: 15000 },
  () => {
    const result = spawnSync(
      process.execPath,
      [
        '-e',
        `
        const assert = require('node:assert/strict');
        const n = require(${JSON.stringify(path.resolve(__dirname, '..'))});
        const size = 1000000, fallback = Symbol('missing');
        for (const parser of [n.parseStrict, n.parseFinite, n.parseSafeInteger]) {
            assert.equal(parser('0'.repeat(size) + '24'), 24);
            assert.equal(parser('0'.repeat(size) + '24x', fallback), fallback);
            assert.equal(parser('0'.repeat(size) + '24e-', fallback), fallback);
        }
        assert.equal(n.parse('-'.repeat(size) + '7'), -7);
        assert.equal(n.parse('.'.repeat(size) + '5'), .5);
        assert.equal(n.parse('e+'.repeat(size / 2) + '7'), 7);
        assert.equal(n.parse('Infinity_'.repeat(size / 8), fallback), fallback);
        assert.equal(n.parse('NaN_'.repeat(size / 4) + ' 9'), 9);
        assert.equal(n.parse('x'.repeat(size) + ' -1e2'), -100);
    `
      ],
      { encoding: 'utf8', timeout: 12000, maxBuffer: 1024 * 1024 }
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
  }
);
