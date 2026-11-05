# go-numbers performance notes

## 0.3.6 progressive-review measurements (A12)

These measurements compare checkpoint C011 with the A12 candidate. Both identify as
0.3.6; this is a review checkpoint comparison, not a version-to-version release claim.
The only runtime change is in `src/internal/roundDecimal.js`: discarded decimal
digits are scanned directly instead of creating a substring and running `/[1-9]/`.
Public signatures, validation order and numeric results are unchanged.

Environment: Node.js v22.16.0, linux/x64, AMD EPYC 9V74 80-Core Processor. The
standard comparator used seven alternating fresh-process pairs after an exact-result
preflight. A separate targeted run used eleven alternating pairs for the rounding
paths. Microbenchmarks include loop/callback/sink overhead and are not browser or
application latency guarantees.

Representative invocation results from the seven-pair standard comparison:

| Workload | C011 ns/op | A12 ns/op | Before / after |
| --- | ---: | ---: | ---: |
| round / varied at precision 2 | 197.5 | 181.1 | 1.09x |
| round / mixed precision | 143.9 | 128.3 | 1.12x |
| ceil / precision 2 | 233.7 | 179.8 | 1.30x |
| floor / precision 2 | 232.8 | 182.4 | 1.28x |
| roundTo / extreme BigInt fallback | 11302.5 | 11602.9 | 0.97x |
| isClose / defaults (control) | 8.7 | 9.3 | 0.94x |
| parseFinite / reject long (control) | 47119.5 | 47105.5 | 1.00x |

The directly affected `ceil`/`floor` paths improved consistently. An eleven-pair
targeted run measured median speedups of 1.30x for `ceil(..., 2)`, 1.27x for
`floor(..., 2)`, and 1.08x for ordinary `round(..., 2)`. Untouched controls include
small wins and small regressions; they are retained as noise/tradeoff evidence rather
than being described as optimisations.

### Construction, allocation and retained memory

Cold construction was effectively neutral: across fifteen fresh processes, root
CommonJS loading measured 6.79 ms / 270.0 KiB retained for C011 and 6.98 ms /
270.8 KiB for A12; a direct `src/round` load measured 1.23 ms and about 37 KiB in
both. The package root loaded 38 project modules, while the direct function loaded 4.
Those differences describe import construction cost, not per-call cost.

Allocation pressure improved on the affected hot path. Across seven alternating
5,000,000-call `ceil(value, 2)` trials under `--trace-gc`, median elapsed time fell
from 1171 ms to 936 ms and young-generation Scavenge events fell from 1543 to 1187.
This is GC-event evidence, not a byte-exact allocation-rate measurement.

Post-GC retained heap did not improve. After a mixed `roundTo`/`modulo` workload
with 250,000 changing steps, the median delta was 7.8 KiB for C011 and 12.9 KiB for
A12. The A12 delta remained about 13 KiB when the workload grew to 1,000,000 calls,
so no unbounded cache growth was observed; the small retained increase is accepted
as a bounded JIT/code-state tradeoff for the measured invocation/allocation gain.

### Benchmark integrity

The old comparison harness consumed timed results with `value | 0` and required only
the resulting sink to match. A baseline returning `0.25` and a candidate returning
`0.75` therefore compared successfully. A12 keeps that cheap sink only inside timed
loops, but adds one untimed SHA-256 preflight per package over the complete case
iteration range. Primitive result tokens preserve type, `-0`, `NaN`, `undefined`, `null`, booleans
and strings. Timing workers run only after those observable-result digests agree.

Correctness verification for the runtime optimisation included 914 focused numeric
tests, 101,065 independent Python Decimal/Fraction comparisons and 380,000
bit-sensitive public-result comparisons against C011.

---

## Historical 0.3.1 optimisation measurements

## Scope and methodology

Baseline: the supplied 0.3.0 expanded-tests archive (3,256 tests). Candidate:
0.3.1, with the same public signatures and numerical contracts. These are local
microbenchmarks, not application benchmarks, a cross-engine result, or a blanket
speedup for every input. Smaller ns/op is better.

Environment: Node.js v22.16.0, linux/x64,
AMD EPYC 9V74 80-Core Processor. Seven paired trials run sequentially in separate processes,
alternating baseline/candidate order. Each workload warms up with up to 15,000
calls and records three timed samples. The table reports the median of the seven
per-process medians. Inputs are prepared before timing; results feed a bounded
integer checksum, which must agree between versions. The timing includes loop,
callback and checksum overhead. Raw samples, ranges, and median absolute
deviations are retained in the accompanying evidence archive.

No aggregate score is computed. Unchanged control paths and extreme fallbacks
are reported, rather than selecting only the favourable cases. Ordinary parser,
predicate and modulo timings should be regarded as approximately unchanged;
small differences can be noise. Garbage collection contributes to the old
per-call allocation workload's spread; no standalone heap-allocation rate or
application latency improvement is claimed.

## All measured workloads

| Workload | 0.3.0 ns/op | Optimised ns/op | Before / after |
| --- | ---: | ---: | ---: |
| isOdd / primitives (control) | 15.9 | 15.3 | 1.04x |
| isFinite / boxed (control) | 19.4 | 19.0 | 1.02x |
| parseFinite / varied decimal (control) | 132.4 | 126.6 | 1.05x |
| parse / embedded (control) | 204.1 | 200.4 | 1.02x |
| parseSafeInteger / digits (control) | 21.7 | 22.4 | 0.97x |
| getFraction / varied (control) | 83.6 | 82.5 | 1.01x |
| clamp / bounds (control) | 7.2 | 7.1 | 1.01x |
| round / zero precision | 223.7 | 14.5 | 15.46x |
| round / integer at precision 2 | 63.1 | 10.8 | 5.87x |
| round / varied at precision 2 | 252.0 | 181.9 | 1.39x |
| round / mixed precision | 218.8 | 130.4 | 1.68x |
| ceil / precision 2 | 275.7 | 222.1 | 1.24x |
| floor / precision 2 | 290.9 | 214.5 | 1.36x |
| roundTo / repeated 0.1 step | 732.2 | 187.0 | 3.92x |
| roundTo / repeated 0.25 step | 738.8 | 384.8 | 1.92x |
| roundTo / changing steps | 819.4 | 514.5 | 1.59x |
| roundTo / exact integer multiple | 278.2 | 18.1 | 15.41x |
| roundTo / extreme BigInt fallback | 11274.1 | 11056.1 | 1.02x |
| roundTo / subnormal step | 665.4 | 171.0 | 3.89x |
| isInRange / defaults | 7.9 | 7.3 | 1.08x |
| isInRange / explicit options | 158.3 | 132.6 | 1.19x |
| isInRange / empty options | 88.9 | 63.9 | 1.39x |
| isClose / defaults | 9.3 | 8.4 | 1.10x |
| isClose / explicit tolerance | 222.1 | 175.0 | 1.27x |
| modulo / normal cycle | 12.3 | 12.0 | 1.03x |
| modulo / upper endpoint correction | 343.9 | 27.6 | 12.48x |
| parseFinite / reject long (control) | 45433.6 | 44409.9 | 1.02x |

## Changes and correctness constraints

### Shared decimal decomposition and rounding

`decimalParts` no longer constructs a separate mantissa and applies two replace
operations. It slices out the dot and scans only any leading zeros. It continues
to parse the shortest decimal representation, never an approximate scaled value.

At zero decimal places, integer and half-integer boundaries relevant to a
nonintegral binary64 value are exactly representable. Native `Math.round`,
`Math.ceil` and `Math.floor` therefore produce the same results as the decimal
contract, including negative ties and signed zero. Non-finite values and zeros
return through the original guard; validation precedes every fast path.
Already-integral values at positive precision return unchanged. Negative
precision still uses decimal rounding, even for integral inputs.

### Step rounding

Only one validated primitive grid is retained. The cache stores its bounded
shortest-decimal decomposition and, only when needed, its BigInt coefficient.
There is no map of input values, no caller-object retention, and no result cache.
Every call still unboxes and validates both operands before using the cache.

A power-of-ten grid delegates to the shared decimal-rounding core. Otherwise,
both decimal coefficients are aligned to an integer scale. A Number fast path is
used only when both aligned integers are safe and at most 2^52. This conservative
bound keeps quotient products and remainders exact; comparing the remainder with
`denominator - remainder` avoids multiplying a fractional value. The rounded
coefficient is at most `numerator + denominator / 2`, hence at most `1.5 * 2^52`,
strictly below 2^53. It is reconstructed through a decimal string, not binary
multiplication by the step. Inputs outside this bound retain the exact BigInt
algorithm. No approximate large-magnitude shortcut is used.

### Options

The two supported fields are read into a small internal tuple rather than a
cloned dynamic-key record. Unknown-key diagnostics, ownKeys traversal order,
single getter reads, own undefined defaults, propagated exceptions and
non-mutation are preserved. Omitted options avoid both allocation and repeated
validation of known defaults. Explicit tolerance handling is outlined from the
small public `isClose` wrapper; an initial formulation that slowed its default
path was rejected after measurement. Caller options are never cached.

### Modulo

A private 8-byte DataView replaces per-correction buffer allocation. All bits are
written on each use, after non-coercing input validation, with no user callback
between writes and reads. A two-word unsigned decrement replaces per-correction
BigInt conversion. The positive path and binary remainder semantics are unchanged.
The exceptional negative-correction result remains the representable predecessor
of the positive modulus, including low-word borrow and subnormal boundaries.

## Current comparison commands

The current harness precomputes numeric strings and lookup arrays outside timed
loops. The historical table above retains the original measurements, whose timed
callbacks included that preparation; current timings are not an exact replay of
those historical harness costs. Inputs and numeric operations remain comparable
when both packages run through the same current harness.

```sh
npm run benchmark:compare -- --baseline ../go-numbers-0.3.0 --rounds 7 --output <temporary-directory>/comparison.json
npm run test:differential -- --baseline ../go-numbers-0.3.0
npm run verify
npm run test:oracle
npm run test:mutations
```

The baseline path must point to a separately extracted original source directory.
Do not benchmark concurrently with tests or other CPU-heavy workloads. There are
no timing assertions in unit tests. A very fast microbenchmark includes a
significant amount of harness overhead; do not interpret these numbers as a
cycle-accurate cost or a promise for browser engines.

## Deliberately unchanged

All parser algorithms, intrinsic number/string unboxing, public entry points,
TypeScript declarations, constants and option policies remain unchanged. Invalid
object detection is not weakened to avoid intrinsic exceptions. Extreme decimal
step ratios still favour correctness over cheap approximations. The existing
esbuild release-bundle gate could not run because its pinned tool was unavailable
and registry lookup failed; no new browser bundle-size or browser speed claim is
made.
