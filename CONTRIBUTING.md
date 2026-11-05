# Contributing

This guide records go-numbers-specific verification responsibilities and retained
differences from the shared library conventions. Package scripts and the lockfile
own exact command composition and tool versions; the README owns the overview and docs/API.md owns the full public reference.

## Development and release checks

Install the pinned development tools with `npm ci`. Contributors require Node
22.16.0 or newer. ESLint 10 and its dependencies require a supported modern Node
line; coverage additionally needs Node 22.8 or newer. These development tools do
not change consumer compatibility: CommonJS supports Node 8.0.0, and native ESM
supports Node 12.17.0 (Node 13 requires 13.2.0, with
`--experimental-conditional-exports` on 13.2 through 13.6). BigInt is an optional capability;
step rounding uses exact decimal-string arithmetic when it is absent.

Set `NODE8_BIN` to an exact Node 8.0.0 executable and `NODE_ESM_BIN` to an exact
Node 12.17.0 executable. Set `NODE13_ESM_BIN` to Node 13.2.0 and
`NODE13_UNFLAGGED_ESM_BIN` to Node 13.7.0. Missing floor runtimes fail the
compatibility gate. Both loader modes run on those Node 13 versions, including
flagged CommonJS/ESM on 13.2 and unflagged CommonJS on 13.2.
Early Node 13 needs its conditional-exports flag to distinguish import from
require; the manifest includes its legacy `node` condition as an ESM fallback.
The CommonJS and ESM consumer fixtures share checks that invoke every public
function, compare all constants, exercise native foreign Number/String boxes,
and preserve representative boundary/error results. CommonJS also runs on the
12.17.0 executable so that both loader modes at that floor are checked.
`test/runtime-consumers.test.js` runs the same fixtures against the installed
candidate on the current interpreter and rejects missing/substituted floor
executables. A current-interpreter pass is not a historical-runtime pass.
`verify` builds and packs one candidate, then checks lint, formatting, syntax,
documentation, runtime coverage, TypeScript, generated artefacts and installed
consumers. `verify` also runs bundler consumers, Python numeric oracles and curated mutations.
`verify:all` adds both standalone bundles and the README example in Chromium,
Firefox and WebKit. Install the pinned browser engines with
`npx playwright install chromium firefox webkit` (add `--with-deps` on Linux). Both accept `-- --tarball <path>` to reuse an existing candidate.
A supplied missing archive, or a mismatch with its adjacent digest record, fails
without rebuilding or repacking. TypeScript NodeNext, Bundler and legacy fixtures
are type-checked; separate valid default-import consumers are emitted and executed
on contributor and exact consumer-floor runtimes.

CI produces one SHA-256-identified candidate in the full Node 24 gate, transfers
its tarball and digest record, and exercises that same archive on Node 22/24 on
Linux and Windows, including the exact CommonJS/native ESM floors. The consumer
jobs do not build or pack. Documentation freshness and source regeneration also
reject drift. CI configuration is not evidence that a remote run passed.

Python 3.9+ is needed for `test:oracle` and `verify:all`. Windows selects `python`;
Unix selects `python3`. Set `PYTHON` to one executable path to override this
selection; it is not a shell command or a list of arguments.
The verifier explicitly runs `test/oracle_verifier_test.py` and
`test/python_launcher_test.py`, keeping experimental Python packages outside discovery.
Add future maintained Python suites to this explicit command. The launcher uses
`-B` and passes the current Node executable to the Python subprocess. Failed
checks and missing tools fail the command rather than silently skip.

## Distribution and consumer contracts

The private development root retains authored entries and declarations.
`build` regenerates README/API documentation, then generates a complete ignored `package/` from those sources and the
public API inventory. Expanded export/type mappings, native ESM function entries and physical Node 8
short wrappers exist only there. Function subpaths expose the same callable as
default and named ESM exports, with format-specific declarations; CommonJS
continues to return that callable directly. Node 8 predates package `exports`, so it cannot enforce
subpath encapsulation for physically shipped internals; those paths remain unsupported.
The build validates staged imports, identity, metadata
and source freshness before replacement. Failure before the staged package is
committed preserves or restores the prior package; failed restoration retains and
reports its backup and original errors. After a validated staged package has been
renamed into place, failure to delete the previous-package backup is reported as a
warning without turning the committed build into a failure; the retained backup
path is included in that warning.

`pack:package` builds once and packs `package/` into ignored `artifacts/`,
recording the portable archive basename and SHA-256 beside the tarball. Candidate
checks reject a present record that names a different adjacent archive or whose
digest no longer matches. Install that tarball, or link the built `package/`
directory, from local consumer projects. Root `prepack` and
`prepublishOnly` reject wrong-directory packing/publication. The generated
manifest has no repository dependencies or lifecycle hooks.

Package checks install the exact archive offline into temporary consumers and
check its inventory, CommonJS/ESM paths, API identities, reference links,
documentation examples and declarations. esbuild verifies browser-targeted
consumer bundles and tree shaking separately from the real-browser gate.
Readable and minified UMD distributions expose `goNumbers` and support CommonJS
and AMD loaders. Their ES2020 target preserves BigInt syntax; minification keeps
function names and avoids syntax folding that changes HTMLDDA or getter behaviour.
The real-browser gate tests every public function, missing optional BigInt globals,
foreign-realm boxes, both bundle files and the executable README example. It
validates the candidate's exact-version CDN links and blocks external requests.
`test:browser` accepts the same tarball argument or `GO_NUMBERS_TARBALL` environment
variable as the other consumer gates and checks its digest before and after use.

Local `temp/` and `.tmp/` directories at any depth are reserved for experiments.
Git, formatting, lint, recursive syntax checks, source coverage and build inputs
exclude them. Builds leave them intact and reject runtime imports from them in
the browser dependency graph. Regression fixtures use a `.tmp` ancestor to verify
that exclusions are scoped to the project, not its parent directories.

## Declaration and inference verification

`test:types` compiles an offline-installed, digest-identified candidate with the
exact TypeScript version in `devDependencies`. It does not compile against the
private root or silently substitute a different compiler. There is no separately
declared consumer compiler range; a passing pinned-compiler run must not be
reported as proof of an older minimum or of every newer compiler.

The NodeNext, Bundler and legacy CommonJS fixtures run with `strict`,
`skipLibCheck: false`, `noUncheckedIndexedAccess`,
`noPropertyAccessFromIndexSignature`, `useUnknownInCatchVariables`, and both
`exactOptionalPropertyTypes` modes. `strict` includes `strictBindCallApply` and
`noImplicitThis`. Type-only checks preserve module syntax with
`verbatimModuleSyntax`. Explicit ES libraries and `types: []` exclude accidental
DOM/Node ambient declarations. Separate ES5-library fixtures check declaration
ambient dependencies only; they are not ES5 runtime or historical-compiler tests.

Keep positive inferred-result assertions alongside targeted `@ts-expect-error`
cases. Check both narrowing branches, generic/optional fallback relationships,
readonly records, and direct/focused/alias signatures. The package has no callback
factory API, but a fallback can itself be a function returned unchanged. Its
arguments and explicit `this` type must survive parsing and later binding/calling.
Emitted consumers check those operations and skipped legacy conversion at runtime,
without a console/DOM shim. CommonJS default imports retain their required
`esModuleInterop` transform; ESM output is executed using native Node loading.
TypeScript's Bundler resolution and executing that ESM output do not replace the
separate esbuild consumer gate.

Receiver-only binding preserves these overloads on the pinned compiler. Native
`call`/`apply`, or pre-binding an input to a generic overloaded parser, can infer
from the catch-all signature and lose the fallback relationship. Use an explicit
wrapper such as `(value: unknown) => parseFinite(value, null)` before binding an
input. Do not hide that compiler limitation with a cast or redesign working
parser overloads merely to make every native function helper infer perfectly.

## Lint and formatting

`lint` uses pinned ESLint correctness rules, TypeScript declaration rules and
scoped CommonJS/ESM globals with zero warnings. `format:check` and `format` use
Prettier for maintained JavaScript, TypeScript, JSON configuration and CI files.
Canonical Markdown templates/renderers retain ownership of aligned examples;
generated packages, artefacts and historical prose are excluded from formatting.

Maintainer-owned compatibility exceptions are limited to authored declaration
namespaces/boxed `Number` types, TypeScript `import = require` contracts, and
unused typed bindings in negative consumer fixtures. These preserve existing
public types and compiler tests; reconsider them only when those contracts change.
Relative package imports remain intentional because published files cannot rely
on application aliases. Mutation controls match exact unique token sequences, so
formatter whitespace changes do not disable any curated regression.

## Focused and comparative checks

Use `test:scenarios` for the behavioural partitions in [test coverage](docs/test-coverage.md),
`test:tooling` for verifier negative controls, and `test:oracle:verifier` for Python
controls. Oracle corpus fingerprints identify inputs only, never expected results;
review any input changes before updating the manifest.

Mutation checks run in disposable copies and require successful named preflights,
then fail on surviving mutations. Process/load failures cannot count as detections.
All normal tests also run with coverage through the same test runner.

`benchmark` and `benchmark:compare` are diagnostics, not correctness gates. Before
timing, the comparator evaluates every case iteration once per package outside the
timed workers and SHA-256 compares typed primitive result tokens, preserving `-0`
and `NaN`. Timing then uses alternating fresh baseline/candidate processes and an
inexpensive int32 sink only to consume timed results; all raw timing samples are
retained. `test:differential` separately checks public result identity against a
compatible baseline. These commands require a baseline path and therefore do not
run automatically in CI. Historical measurements and arithmetic fast-path rationale
remain in [performance](docs/performance.md).

Write benchmark JSON, mutation output, logs and tarballs to a task-owned temporary
directory outside the checkout. No timing assertion is used as a unit-test gate.

## Documentation maintenance

Edit `scripts/README.template.md` for the overview and `scripts/API.template.md`
for detailed entries. The reference owns the descriptions and returns used in the
README summary. Run `npm run docs` to regenerate both documents; `test:docs`
checks freshness without writing, public reference coverage, links and examples.
The checked-in canonical README checker validates repository navigation, licence
wording and contributor routes; installed-package checks repeat its consumer
rules. Identity aliases share a complete reference entry and are checked against
the runtime API. Named/default function imports are tested on every public
subpath with exact declaration-shape assertions under NodeNext and Bundler.

`scripts/test-examples.js` executes actual JavaScript fences and JSDoc examples
through native Node CommonJS/ESM imports, checks displayed results and expected
exceptions, and compiles TypeScript fences under both optional-property modes.
Installed-package checks repeat these against the tarball contents. Only
`docs/API.md` is included from `docs/`; contributor material stays in the repository.

Predicates use “Determines whether…”. Parsing, text extraction, clamping and rounding
use their precise operation verbs; retrieving integer/fractional parts uses “Returns…”.
Keep each opening consistent in the summary, reference, JSDoc and declaration tooltips.

## Security and trust boundaries

Runtime number/string inputs are data, not programs. Parsing does not evaluate
expressions, access files or make network requests. Extraction (`parse` and
`extractNumber`) is deliberately permissive; it is not validation of an entire
field. Use the documented strict or finite/safe-integer parser for the required
contract. None of these APIs is an authorisation check, sanitiser or exact-decimal
arithmetic boundary. Apply application-specific bounds after parsing.

The non-coercing predicates and safe parsers do not execute arbitrary conversion
hooks. Legacy parsers deliberately read/call a supplied `toString`, and options
may execute own getters or proxy traps. These run with the caller's JavaScript
privileges; the library is not a sandbox. Accepting a caller's executable object
is different from accepting a primitive string from a request. Runtime inputs
are not recursively merged into prototypes or deserialised into executable code.

String scanning is linear, not an unlimited-work guarantee. Request-facing callers
must enforce input-size and rate limits appropriate to their workload. Numeric
rounding works on represented Number values with bounded precision/exponent sizes;
it does not accept arbitrary-length decimal coefficients. Internal caches must
remain bounded and must not retain caller objects.

Contributor scripts trust the checkout, configured executable paths/environment,
and candidate being tested. Child processes use separate arguments rather than a
shell command string. A temporary directory, timeout or Node VM does not make
imported candidate code, documentation examples, or mutation targets safe to run
from an untrusted source. Inspect unfamiliar candidates in an isolated environment
without credentials. Offline installation with `--ignore-scripts` suppresses npm
installation hooks, not code executed by subsequent imports. Candidate SHA-256
records detect changed bytes; an adjacent unsigned record does not authenticate
an archive when an attacker can replace both files.

The consumer package has no runtime dependencies or installation hooks. Development
dependencies and CI actions are a separate supply-chain boundary: review exact
lockfile changes and upstream code/advisories, including any install scripts and
platform-binary downloads. Keep normal platform optional dependencies enabled for
esbuild; its pinned installer's fallback acquisition has a different integrity
path from a lockfile-verified optional package. Do not treat a version-output
check as binary authentication. Dependency upgrades need the normal build,
compatibility and bundle checks rather than an unverified security-only bump.

Remote CI actions use full upstream commit IDs, not movable version tags. Keep the
existing read-only repository permission, disabled persisted checkout credentials,
and same-run candidate transfer. Review action updates explicitly; commit pinning
prevents tag movement but does not establish that the pinned action code is safe.
Do not enable privileged untrusted-PR execution or add credentials to test jobs.

Record security-tool failures as unavailable evidence. An advisory is a confirmed
project finding only after checking the exact affected package/version, attacker
prerequisites, reachable usage and impact. Scanner matches alone do not establish
an exploit; a clean or unavailable scan does not establish absence of vulnerabilities.
