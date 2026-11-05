# Test coverage

This guide describes the maintained behavioral partitions and independent references.
See [contributor guide](../CONTRIBUTING.md) for commands and prerequisites.
Finite test corpora provide evidence, not a proof for all JavaScript inputs.

## Parser and conversion partitions

- All 22,621 strings of length zero through four over the 12-character alphabet
  `0`, `1`, `e`, `E`, `+`, `-`, `.`, `x`, `_`, space, LF and NUL. Each is compared
  across `parse`, `extractNumber`, `parseStrict`, `parseFinite` and
  `parseSafeInteger` with a separate bounded regular-expression grammar.
- Optional signs, 15 mantissa forms, complete and incomplete exponent forms,
  unsafe integral text, underflow, overflow, decimal/radix/grouping ambiguities.
- All 256 case spellings of Infinity and all eight of NaN, with sign/precedence
  combinations; every adjacent ASCII code unit on both sides of special tokens.
- ASCII insertions at every position in representative numeric strings; Unicode
  whitespace, non-ASCII digits/signs/group separators, BOM, NUL, lone surrogates
  and astral characters. Strict parsing never silently trims.
- Each signed integer within 128 integers on either side of both safe limits is
  compared with an exact BigInt bound before numeric conversion.
- Million-character digit, exponent, sign, dot and special-token sequences run
  in a killable child process. The generous timeout is a hang guard, not an
  asymptotic-complexity proof or performance guarantee.
- Primitive, subclassed, foreign-realm, frozen, null-prototype and altered-
  prototype boxes; fake boxes, proxies/revoked proxies, arrays, typed arrays,
  DataView, dates, promises, boxed symbols/booleans and functions.
- Fifteen fallback categories through all seven fallback-bearing functions,
  including negative zero, NaN, bigint, symbols, callable defaults and revoked
  proxies. A fallback is never invoked, inspected, transformed or cloned.
- Legacy conversion getter/method exceptions preserve any thrown value, including
  undefined, NaN and symbols. Receiver and zero-argument invocation are checked.
  Safer parsers/predicates never invoke these arbitrary conversion hooks.

## Numeric partitions and references

- Every representable power `2 ** exponent`, for exponent -1074 through 1023,
  plus each predecessor/successor and both signs. This spans subnormal/normal
  transitions, precision changes, safe-integer limits and loss of odd integers.
- Several positive/negative NaN payload patterns and the deliberate distinction
  between primitive NaN and genuine boxed NaN.
- Every precision -308 through 324 for round/ceil/floor, with signs, half ties,
  carry chains, neighboring values, zeros, NaN, infinities and magnitude extremes.
  The tests check exact output values including signed zero, idempotence and
  consistency of the two directed bounds with nearest rounding.
- Twenty-one step/modulus classes, from the minimum subnormal through the largest
  finite value, including non-power-of-ten decimal increments and realistic
  cyclic ranges. Seeded binary64 inputs complement exact-multiple/half-step and
  immediately neighboring cases.
- `test/helpers/scenario-oracles.js` uses signed rational BigInt arithmetic for
  decimal rounding instead of production digit truncation/carry code. Modulo's
  reference converts binary64 inputs into exact counts of `2 ** -1074`, computes
  integer remainders, then independently rounds to nearest-even binary64 and
  enforces the documented predecessor rule at the excluded upper endpoint.
- Reference helpers have hand-verifiable anchor cases and exact binary round-trip
  checks. The production files never import the reference helpers.
- The existing independent Python Decimal/Fraction check remains available with
  two deterministic input families across five numeric operations.

## Range, comparison and configuration partitions

Closed/open endpoint combinations include equal, immediately adjacent, signed-
zero and extreme finite bounds. Clamping must preserve in-range zero signs and
remain idempotent. Exact dyadic relative distances (one half, one, one and a half,
two) are checked below/at/above their thresholds across many binary exponents;
absolute tolerances are tested independently. Closeness is deliberately not
transitive and absolute/relative tolerance are alternatives, not a conjunction.

Supported own properties may be non-enumerable, frozen, sealed or on null-
prototype records. Inherited getters stay unread; own getters run exactly once
per call with the correct receiver. Unknown string/symbol keys report useful
messages without evaluating unknown values. Explicit undefined uses defaults.
Options are not mutated. Proxy failures and thrown primitive/object values
propagate. Invalid configuration is checked before equal/invalid-value shortcuts.

## TypeScript and consumer contracts

`contracts.cts` and `contracts.mts` check all 27 public callable declarations
against all 81 individual/compatibility paths. They supplement the existing
consumer fixtures. The CJS contract also runs under legacy Node resolution.
The three tested configurations are NodeNext CJS/ESM, Bundler ESM resolution and
legacy CommonJS/Node resolution; these are compilation checks, not browser bundles.

Return types preserve null, undefined, false, string/bigint literals, general
bigint, unique symbols, readonly records/tuples and function fallbacks. Predicate
results cannot narrow a boxed-or-unknown value into a primitive number. Numeric
operations reject text/BigInt arguments at compile time; configuration properties
remain readonly. `@ts-expect-error` assertions must fail when their corresponding
misuse unexpectedly becomes type-correct.

Runtime tests exercise import identities and behavior through every public
callable. Existing packed-tarball tests still install offline and run CJS/ESM
consumers. Source-only tests are not substituted for those package checks.

## Standalone browser distribution

`npm run build` produces readable/minified UMD files and source maps in `package/dist/`.
`npm run test:artifacts` checks their CommonJS, AMD and browser-global loaders.
Install pinned engines with `npx playwright install chromium firefox webkit`, then run
`npm run test:browser -- --tarball /path/to/package.tgz` for the installed browser matrix.
`verify:all` reuses its exact candidate for Chromium, Firefox and WebKit and executes
the script-tag README example. Existing native-module and other consumer checks remain in place.
