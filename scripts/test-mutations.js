'use strict';

// Targeted mutation smoke suite, not an exhaustive mutation score. Each mutation
// runs in a disposable copy and must produce a test-code failure; syntax errors,
// load failures, timeouts and child-process errors do NOT count as detections.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { assessRun } = require('./lib/mutation-outcome.js');
const reporter = require('node:url').pathToFileURL(path.resolve(__dirname, 'lib/mutation-reporter.js')).href;
const root = path.resolve(__dirname, '..');
const arguments_ = process.argv.slice(2);
if (arguments_.length && (arguments_.length !== 2 || arguments_[0] !== '--output')) {
  throw new Error('Usage: node scripts/test-mutations.js [--output directory]');
}
const output = arguments_.length ? path.resolve(arguments_[1]) : undefined;
if (output) fs.mkdirSync(output, { recursive: true });
const numeric = 'test/scenarios-numeric-boundaries.test.js';
const grammar = 'test/scenarios-parser-grammar.test.js';
const inputs = 'test/scenarios-input-contracts.test.js';
const options = 'test/scenarios-options-and-ranges.test.js';
const entries = 'test/scenarios-entry-contracts.test.js';
const mutations = [
  ['odd-negative-sign', 'src/isOdd.js', 'number % 2 !== 0', 'number % 2 === 1', numeric],
  ['positive-includes-zero', 'src/isPositive.js', 'number > 0', 'number >= 0', numeric],
  [
    'zero-loses-negative-zero',
    'src/isZero.js',
    'unwrapNumber(value) === 0',
    'Object.is(unwrapNumber(value), 0)',
    numeric
  ],
  ['safe-predicate-accepts-unsafe', 'src/isSafeInteger.js', 'Number.isSafeInteger', 'Number.isInteger', numeric],
  [
    'boxed-nan-accepted',
    'src/isNaN.js',
    'Number.isNaN(value)',
    "Number.isNaN(require('./internal/unwrapNumber')(value))",
    numeric
  ],
  [
    'falsy-fallback-lost',
    'src/parse.js',
    "if (typeof input !== 'string') return defaultValue;",
    "if (typeof input !== 'string') return defaultValue || undefined;",
    inputs
  ],
  ['strict-extracts', 'src/parseStrict.js', 'scanNumber(input, true)', 'scanNumber(input, false)', grammar],
  ['strict-trims', 'src/parseStrict.js', 'scanNumber(input, true)', 'scanNumber(input.trim(), true)', grammar],
  ['finite-accepts-infinity', 'src/parseFinite.js', 'Number.isFinite(number)', "typeof number === 'number'", grammar],
  ['safe-text-rounds-fractions', 'src/parseSafeInteger.js', 'if (code < 48 || code > 57)', 'if (false)', grammar],
  [
    'safe-text-accepts-unsafe',
    'src/parseSafeInteger.js',
    'Number.isSafeInteger(number)',
    'Number.isInteger(number)',
    grammar
  ],
  [
    'lowercase-exponent-rejected',
    'src/internal/scanNumber.js',
    'exponent === 69 || exponent === 101',
    'exponent === 69',
    grammar
  ],
  [
    'infinity-sign-lost',
    'src/internal/scanNumber.js',
    'return first === 45 ? -Infinity : Infinity;',
    'return Infinity;',
    grammar
  ],
  [
    'nan-word-boundary-removed',
    'src/internal/scanNumber.js',
    '&& !isWord(text.charCodeAt(end)) && (!strict',
    '&& (!strict',
    grammar
  ],
  ['integer-truncates-negative', 'src/getInteger.js', 'Math.floor(number)', 'Math.trunc(number)', numeric],
  [
    'fraction-is-binary-remainder',
    'src/getFraction.js',
    "return Number(text.slice(text.indexOf('.')));",
    'return magnitude % 1;',
    numeric
  ],
  [
    'unboxing-invokes-user-hook',
    'src/internal/unwrapNumber.js',
    'return numberValueOf(value);',
    'return value.valueOf();',
    inputs
  ],
  [
    'safe-string-coercion',
    'src/internal/toNumericInput.js',
    'return stringValueOf(value);',
    'return String(value);',
    inputs
  ],
  [
    'conversion-wrong-receiver',
    'src/internal/toParseInput.js',
    'apply(method, value, [])',
    'apply(method, undefined, [])',
    inputs
  ],
  [
    'conversion-invoked-twice',
    'src/internal/toParseInput.js',
    'const converted = apply(method, value, []);',
    'const converted = apply(method, value, []); apply(method, value, []);',
    inputs
  ],
  [
    'conversion-error-swallowed',
    'src/internal/toParseInput.js',
    'const converted = apply(method, value, []);',
    'let converted; try { converted = apply(method, value, []); } catch { return undefined; }',
    inputs
  ],
  ['clamp-loses-zero-sign', 'src/clamp.js', 'return number < low ?', 'return number <= low ?', options],
  ['range-lower-endpoint-excluded', 'src/isInRange.js', 'number >= low', 'number > low', options],
  ['range-upper-endpoint-excluded', 'src/isInRange.js', 'number <= high', 'number < high', options],
  [
    'nonenumerable-options-ignored',
    'src/internal/readOptions.js',
    'Reflect.ownKeys(options)',
    'Object.keys(options)',
    options
  ],
  ['undefined-option-not-defaulted', 'src/internal/readOptions.js', 'if (value !== undefined)', 'if (true)', options],
  [
    'generic-option-error',
    'src/internal/readOptions.js',
    '`Unknown option ${label}. Expected one of: ${allowed}.`',
    "'Unknown option.'",
    options
  ],
  [
    'close-requires-absolute',
    'src/isClose.js',
    'if (difference <= absoluteTolerance) return true;',
    'if (difference > absoluteTolerance) return false;',
    options
  ],
  [
    'close-relative-excludes-equality',
    'src/isClose.js',
    'relativeDistance <= relativeTolerance',
    'relativeDistance < relativeTolerance',
    options
  ],
  [
    'decimal-negative-half-away',
    'src/internal/roundDecimal.js',
    '(!negative || hasNonzero(digits, retained + 1))',
    '(true)',
    numeric
  ],
  [
    'directed-rounding-reversed',
    'src/internal/roundDecimal.js',
    "mode === 'ceil' ? !negative : negative",
    "mode === 'ceil' ? negative : !negative",
    numeric
  ],
  [
    'precision-endpoint-excluded',
    'src/internal/roundDecimal.js',
    'decimalPlaces > 324',
    'decimalPlaces >= 324',
    numeric
  ],
  [
    'step-binary-scaling',
    'src/roundTo.js',
    'const negative = number < 0;',
    'return Math.round(number / increment) * increment;\n    const negative = number < 0;',
    numeric
  ],
  [
    'step-negative-half-away',
    'src/roundTo.js',
    '(doubled === denominator && !negative)',
    '(doubled === denominator)',
    'test/performance-contracts.test.js'
  ],
  [
    'modulo-unconditional-addition',
    'src/modulo.js',
    'if (remainder > 0) return remainder;',
    'if (remainder > 0) return (remainder + divisor) % divisor;',
    numeric
  ],
  [
    'modulo-negative-zero',
    'src/modulo.js',
    'if (remainder === 0) return 0;',
    'if (remainder === 0) return remainder;',
    numeric
  ],
  ['modulo-upper-endpoint-allowed', 'src/modulo.js', 'return view.getFloat64(0);', 'return divisor;', numeric],
  ['modulo-roundoff-wraps-to-zero', 'src/modulo.js', 'return view.getFloat64(0);', 'return 0;', numeric],
  [
    'alias-function-identity-lost',
    'src/extractNumber.js',
    "module.exports = require('./parse');",
    "module.exports = (...args) => require('./parse')(...args);",
    entries
  ]
];
mutations.push([
  'option-ownership-check-removed',
  'src/internal/readOptions.js',
  'if (!hasOwn(options, key)) continue;',
  '',
  'test/option-ownership.test.js'
]);

mutations.push([
  'verifier-ignores-event-summary-mismatch',
  'scripts/lib/mutation-outcome.js',
  "return { ...result, reason: 'test events do not match the final summary' };",
  'void 0;',
  'test/tooling.test.js'
]);

const performanceContracts = 'test/performance-contracts.test.js';
mutations.push(
  [
    'native-nearest-becomes-floor',
    'src/internal/roundDecimal.js',
    "if (mode === 'nearest') return Math.round(number);",
    "if (mode === 'nearest') return Math.floor(number);",
    performanceContracts
  ],
  [
    'integer-shortcut-ignores-negative-precision',
    'src/internal/roundDecimal.js',
    'decimalPlaces > 0 && Number.isInteger(number)',
    'Number.isInteger(number)',
    numeric
  ],
  [
    'step-cache-ignores-grid-changes',
    'src/roundTo.js',
    'if (increment === previousStep)',
    'if (previousGrid !== undefined)',
    performanceContracts
  ],
  [
    'small-step-negative-half-away',
    'src/roundTo.js',
    '(remainder === otherHalf && !negative)',
    '(remainder === otherHalf)',
    performanceContracts
  ],
  [
    'small-step-binary-output',
    'src/roundTo.js',
    'const coefficient = multiple * grid.coefficient;',
    'return multiple * increment * (negative ? -1 : 1);\n        const coefficient = multiple * grid.coefficient;',
    performanceContracts
  ],
  [
    'modulo-low-word-borrow-lost',
    'src/modulo.js',
    'view.setUint32(0, view.getUint32(0) - 1);',
    'view.setUint32(0, view.getUint32(0));',
    performanceContracts
  ],
  ['modulo-scratch-not-reset', 'src/modulo.js', 'view.setFloat64(0, divisor);', 'void divisor;', performanceContracts]
);
mutations.push([
  'type-verifier-version-guard-removed',
  'scripts/test-types.js',
  'assert.equal(compilerVersion, `Version ${expectedCompilerVersion}`,',
  'assert.equal(compilerVersion, compilerVersion,',
  'test/tooling.test.js'
]);

mutations.push(
  [
    'oracle-sha-family-collapses-to-lcg',
    'scripts/oracle-cases.js',
    "if (family === 'sha256') {",
    'if (false) {',
    'test/oracle-generator.test.js'
  ],
  [
    'oracle-generator-ignores-invalid-arguments',
    'scripts/oracle-cases.js',
    "throw new Error('Usage: node scripts/oracle-cases.js [--family lcg|sha256]');",
    'void 0;',
    'test/oracle-generator.test.js'
  ]
);

const focusedTests = {
  'odd-negative-sign':
    '^numeric\\ classes:\\ neighbors\\ of\\ every\\ binary\\ power\\ with\\ exponents\\ \\-18\\.\\.13$',
  'positive-includes-zero':
    '^numeric\\ classes:\\ neighbors\\ of\\ every\\ binary\\ power\\ with\\ exponents\\ \\-1074\\.\\.\\-1043$',
  'zero-loses-negative-zero':
    '^numeric\\ classes:\\ neighbors\\ of\\ every\\ binary\\ power\\ with\\ exponents\\ \\-1074\\.\\.\\-1043$',
  'safe-predicate-accepts-unsafe':
    '^numeric\\ classes:\\ neighbors\\ of\\ every\\ binary\\ power\\ with\\ exponents\\ 46\\.\\.77$',
  'boxed-nan-accepted':
    '^NaN\\ classification:\\ payload\\ 0x7ff0000000000001\\ is\\ never\\ a\\ valid\\ numeric\\ match$',
  'falsy-fallback-lost': '^parse\\ fallback:\\ preserves\\ null\\ identity\\ and\\ never\\ evaluates\\ it$',
  'strict-extracts': '^parser\\ grammar:\\ exhaustive\\ length\\ 2\\ over\\ 12\\ lexical\\ representatives$',
  'strict-trims': '^parser\\ grammar:\\ exhaustive\\ length\\ 2\\ over\\ 12\\ lexical\\ representatives$',
  'finite-accepts-infinity': '^parser\\ grammar:\\ "00012"\\ with\\ every\\ exponent\\ class$',
  'safe-text-rounds-fractions': '^parser\\ grammar:\\ exhaustive\\ length\\ 1\\ over\\ 12\\ lexical\\ representatives$',
  'safe-text-accepts-unsafe': '^parser\\ grammar:\\ "9007199254740992"\\ with\\ every\\ exponent\\ class$',
  'lowercase-exponent-rejected':
    '^parser\\ grammar:\\ exhaustive\\ length\\ 3\\ over\\ 12\\ lexical\\ representatives$',
  'infinity-sign-lost': '^parser\\ grammar:\\ every\\ ASCII\\ letter\\-case\\ spelling\\ and\\ sign\\ of\\ Infinity$',
  'nan-word-boundary-removed':
    '^parser\\ grammar:\\ NaN\\ has\\ ASCII\\ word\\ boundaries\\ for\\ every\\ adjacent\\ ASCII\\ code\\ unit$',
  'integer-truncates-negative':
    '^numeric\\ classes:\\ neighbors\\ of\\ every\\ binary\\ power\\ with\\ exponents\\ \\-1074\\.\\.\\-1043$',
  'fraction-is-binary-remainder':
    '^numeric\\ classes:\\ neighbors\\ of\\ every\\ binary\\ power\\ with\\ exponents\\ \\-18\\.\\.13$',
  'unboxing-invokes-user-hook':
    '^isInteger\\ input:\\ Number\\ subclass\\ uses\\ its\\ internal\\ numeric\\ value,\\ without\\ reading\\ hooks$',
  'safe-string-coercion':
    '^parseFinite\\ input:\\ genuine\\ String\\ boxes\\ still\\ work\\ with\\ a\\ null,\\ foreign,\\ or\\ changed\\ prototype$',
  'conversion-wrong-receiver':
    '^parse\\ conversion:\\ callable\\ proxy\\ receives\\ the\\ original\\ this,\\ no\\ arguments,\\ and\\ exactly\\ one\\ invocation$',
  'conversion-invoked-twice':
    '^parse\\ conversion:\\ callable\\ proxy\\ receives\\ the\\ original\\ this,\\ no\\ arguments,\\ and\\ exactly\\ one\\ invocation$',
  'conversion-error-swallowed':
    '^parse\\ conversion:\\ propagates\\ primitive\\ and\\ object\\ exceptions\\ from\\ explicitly\\ invoked\\ hooks$',
  'clamp-loses-zero-sign': '^range\\ topology:\\ adjacent\\ or\\ extreme\\ bounds\\ \\[-0,\\ 0\\]$',
  'range-lower-endpoint-excluded':
    '^range\\ topology:\\ equal\\ bounds\\ and\\ immediate\\ neighboring\\ values\\ around\\ \\-1\\.7976931348623157e\\+308$',
  'range-upper-endpoint-excluded':
    '^isInRange\\ options:\\ own\\ undefined\\ values\\ default\\ independently\\ without\\ changing\\ later\\ calls$',
  'nonenumerable-options-ignored':
    '^isInRange\\ options:\\ reads\\ supported\\ own\\ properties\\ in\\ non\\-enumerable\\ records\\ without\\ mutation$',
  'undefined-option-not-defaulted':
    '^isInRange\\ options:\\ own\\ undefined\\ values\\ default\\ independently\\ without\\ changing\\ later\\ calls$',
  'generic-option-error':
    '^isInRange\\ options:\\ rejects\\ unknown\\ own\\ key\\ typo\\ before\\ accessing\\ its\\ value$',
  'close-requires-absolute':
    '^isClose\\ options:\\ reads\\ supported\\ own\\ properties\\ in\\ plain\\ records\\ without\\ mutation$',
  'close-relative-excludes-equality':
    '^isClose\\ thresholds:\\ exact\\ dyadic\\ distances\\ at\\ binary\\ exponent\\ \\-1073$',
  'decimal-negative-half-away':
    '^decimal\\ rounding:\\ precision\\ \\-308\\ with\\ signs,\\ ties,\\ carries\\ and\\ adjacent\\ inputs$',
  'directed-rounding-reversed':
    '^decimal\\ rounding:\\ precision\\ \\-308\\ with\\ signs,\\ ties,\\ carries\\ and\\ adjacent\\ inputs$',
  'precision-endpoint-excluded':
    '^decimal\\ rounding:\\ precision\\ 324\\ with\\ signs,\\ ties,\\ carries\\ and\\ adjacent\\ inputs$',
  'step-binary-scaling':
    '^roundTo:\\ exact\\-rational\\ reference\\ with\\ step\\ 5e\\-324\\ across\\ boundary\\ and\\ generated\\ values$',
  'step-negative-half-away':
    '^roundTo:\\ exact\\-rational\\ reference\\ with\\ step\\ 1e\\-323\\ across\\ boundary\\ and\\ generated\\ values$',
  'modulo-unconditional-addition': '^modulo:\\ exact\\ binary\\-unit\\ reference\\ with\\ modulus\\ 1e\\-100$',
  'modulo-negative-zero': '^modulo:\\ exact\\ binary\\-unit\\ reference\\ with\\ modulus\\ 5e\\-324$',
  'modulo-upper-endpoint-allowed': '^modulo:\\ exact\\ binary\\-unit\\ reference\\ with\\ modulus\\ 1e\\-100$',
  'modulo-roundoff-wraps-to-zero': '^modulo:\\ exact\\ binary\\-unit\\ reference\\ with\\ modulus\\ 1e\\-100$',
  'alias-function-identity-lost': '^alias identity remains exact across repeated mixed imports$'
};
Object.assign(focusedTests, {
  'option-ownership-check-removed':
    '^option ownership: isInRange ignores a deleted own option instead of reading its prototype$',
  'step-negative-half-away': '^optimisation: roundTo keeps negative half ties on both exact arithmetic paths$',
  'native-nearest-becomes-floor': '^optimisation: round at zero precision agrees bit-for-bit with the decimal oracle$',
  'integer-shortcut-ignores-negative-precision': focusedTests['decimal-negative-half-away'],
  'step-cache-ignores-grid-changes': '^optimisation: roundTo repeated and changing grids match the exact oracle',
  'small-step-negative-half-away': '^optimisation: roundTo keeps negative half ties on both exact arithmetic paths$',
  'small-step-binary-output': '^optimisation: roundTo keeps negative half ties on both exact arithmetic paths$',
  'modulo-low-word-borrow-lost': '^optimisation: modulo scratch storage does not retain previous results',
  'modulo-scratch-not-reset': '^optimisation: modulo scratch storage does not retain previous results'
});
focusedTests['verifier-ignores-event-summary-mismatch'] =
  '^verifier: a missing unrelated failure event cannot fabricate mutation detection$';

focusedTests['type-verifier-version-guard-removed'] =
  '^TypeScript verifier rejects a compiler whose reported version is not the pinned development version$';

focusedTests['oracle-sha-family-collapses-to-lcg'] =
  '^oracle generator: sha256 retains its independently reviewed input corpus$';
focusedTests['oracle-generator-ignores-invalid-arguments'] =
  '^oracle generator: invalid family and unexpected arguments fail rather than silently using LCG$';

function run(args, directory) {
  return spawnSync(process.execPath, args, {
    cwd: directory,
    encoding: 'utf8',
    timeout: 20000,
    maxBuffer: 16 * 1024 * 1024
  });
}
function persist(name, text) {
  if (output) fs.writeFileSync(path.join(output, name), text);
}
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-mutations-'));
const results = [];
const { replaceMutation } = require('./lib/mutation-source');
try {
  fs.cpSync(root, directory, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(root, source);
      return (
        !relative
          .split(path.sep)
          .some((part) => ['node_modules', '.git', 'package', 'artifacts', 'temp', '.tmp'].includes(part)) &&
        (!output || (source !== output && !source.startsWith(output + path.sep)))
      );
    }
  });
  const scenarios = fs
    .readdirSync(path.join(directory, 'test'))
    .filter((name) => /^scenarios-.*\.test\.js$/.test(name))
    .sort()
    .map((name) => 'test/' + name)
    .concat('test/option-ownership.test.js', 'test/performance-contracts.test.js', 'test/oracle-generator.test.js');
  const baseline = run(['--test', ...scenarios], directory);
  persist('mutation-baseline.log', baseline.stdout + baseline.stderr);
  assert.ifError(baseline.error);
  assert.equal(
    baseline.status,
    0,
    'Unmodified scenario baseline must pass before mutation checks.\n' + baseline.stdout + baseline.stderr
  );
  console.log('PASS: unmodified expanded scenario and performance-contract baseline');
  // A real module-load failure must NOT be reported as a caught regression.
  const controlFile = path.join(directory, 'test', 'mutation-negative-control.test.cjs');
  fs.writeFileSync(controlFile, "throw new Error('negative control: no test ran');\n");
  try {
    const control = run(
      ['--test', '--test-reporter', reporter, '--test-name-pattern', '^negative control$', controlFile],
      directory
    );
    assert.ifError(control.error);
    assert.equal(control.status, 1);
    const assessment = assessRun(control, '^negative control$');
    assert.equal(assessment.detected, false, 'A load failure must not count as mutation detection');
    assert.equal(assessment.baselinePassed, false);
    persist('mutation-negative-control.jsonl', control.stdout);
    console.log('PASS: negative control — module-load failure rejected');
  } finally {
    fs.rmSync(controlFile, { force: true });
  }
  for (const [id, file, original, replacement, testFile] of mutations) {
    const location = path.join(directory, file);
    const source = fs.readFileSync(location, 'utf8');
    const changedSource = replaceMutation(source, original, replacement, id);
    let result;
    const pattern = focusedTests[id];
    assert.equal(typeof pattern, 'string', `Mutation ${id} needs a named regression target`);
    const command = ['--test', '--test-reporter', reporter, '--test-name-pattern', pattern, testFile];
    // Check the actual selected test, not just a broad suite: a renamed,
    // skipped or absent target is not an unmodified passing baseline.
    const originalRun = run(command, directory);
    const originalOutcome = assessRun(originalRun, pattern);
    persist(`${id}-before.jsonl`, originalRun.stdout);
    assert.equal(
      originalOutcome.baselinePassed,
      true,
      `Mutation ${id}: selected unmodified test did not pass — ${originalOutcome.reason}\n${originalRun.stdout}\n${originalRun.stderr}`
    );
    try {
      fs.writeFileSync(location, changedSource);
      const syntax = run(['--check', location], directory);
      assert.ifError(syntax.error);
      assert.equal(syntax.status, 0, `Mutation ${id} produced invalid syntax`);
      const check = run(command, directory);
      const log = check.stdout + check.stderr;
      persist(`${id}.log`, log);
      const outcome = assessRun(check, pattern);
      const detection = outcome.detected;
      const failedTest = outcome.firstFailingTest;
      result = {
        id,
        file,
        testFile,
        pattern,
        detected: detection,
        exitCode: check.status,
        firstFailingTest: failedTest,
        matchedPassesBefore: originalOutcome.matchedPasses,
        matchedFailures: outcome.matchedFailures,
        reason: outcome.reason,
        processError: check.error?.message || null
      };
      results.push(result);
      console.log(`${detection ? 'DETECTED' : 'NOT DETECTED'}: ${id}${failedTest ? ' — ' + failedTest : ''}`);
    } finally {
      fs.writeFileSync(location, source);
    }
  }
  const restored = run(['--test', ...scenarios], directory);
  persist('mutation-restored.log', restored.stdout + restored.stderr);
  assert.ifError(restored.error);
  assert.equal(restored.status, 0, 'Restored source must pass the entire scenario suite');
  persist('mutations.json', JSON.stringify(results, null, 2) + '\n');
  assert.equal(
    results.filter((result) => result.detected).length,
    mutations.length,
    'Not every curated mutation was detected; inspect the reported survivors/errors.'
  );
  console.log(
    `PASS: ${results.length}/${mutations.length} curated mutations detected; restored scenario suite passed.`
  );
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
