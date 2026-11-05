# Migration

## Upgrade from 0.0.1 to 0.3.6

The npm archive published on 2 August 2022 is the upgrade baseline. Its root
`index.js` requires `./src/Types`, which was not shipped; `src/Numbers.js` also
depends on that missing file. The following guidance covers consumers that patched
or copied that source as well as consumers replacing the broken package.

### Update imports and runtime requirements

Use Node.js 8.0.0 or later for CommonJS:

```javascript
const Numbers = require('go-numbers');
```

Native ESM supports Node.js 12.17.0 or later. Node 13 requires 13.2.0 or later,
with `--experimental-conditional-exports` on 13.2 through 13.6:

```javascript
import Numbers from 'go-numbers';
```

The old manifest's singular `engine` field did not establish tested Node 0.10
support. Modern browser script usage requires ES2020 syntax; use the standalone
bundles in the [README](README.md#browser), or a CommonJS-aware bundler.

`go-numbers/src/Numbers` and its `.js` form return the API object. Use documented
function imports such as `go-numbers/isOdd`; private helper paths are unsupported.
`src/parseInt` is retained for local draft consumers as an alias of `parse`, not
an integer-truncation function. No root `parseInt` export is provided.

### Review changed inputs and results

| Area                        | Current contract and upgrade action                                                                                                                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Predicates                  | Strings, symbols and unrelated objects are rejected without conversion hooks. Genuine Number boxes, including foreign-realm boxes, use their intrinsic values. `isNaN` accepts only primitive NaN. Convert application text explicitly with a parser. |
| Legacy parsers              | `parse` extracts a numeric token; `parseStrict` requires the complete string and does not trim. Both support e/E exponents and case-insensitive Infinity/NaN. Special tokens need ASCII-word boundaries; signed NaN is rejected by strict parsing.    |
| Object conversion           | Legacy parsers invoke a supplied `toString` once and preserve its errors. Genuine Number/String boxes bypass overrides. Primitive and boxed bigints are rejected; returned objects are not recursively converted.                                     |
| Fallbacks                   | Failed parsing returns the exact supplied fallback, including false, zero or null. `getInteger` and `getFraction` use it for NaN, infinities and overflow as well as missing numbers.                                                                 |
| Integer/fraction extraction | `getInteger` floors negative inputs. `getFraction` returns nonnegative fractional digits from the Number's shortest decimal representation, including scientific notation; it is not binary remainder arithmetic.                                     |
| Random functions            | The unfinished source's `random` and `randomInt` are absent. Move random generation to the application's chosen random-number implementation.                                                                                                         |

For validation of an entire field, prefer `parseFinite` or `parseSafeInteger`.
They reject unrelated objects without conversion hooks. Trim text at the
application boundary when whitespace is permitted. See the [API reference](docs/API.md)
for exact input, error and rounding contracts.

### Review licensing and declarations

The new library-owned code is distributed under the [MIT licence](LICENSE.md).
This does not replace the notices in previously published copies.

Declarations are included for CommonJS, native ESM and bundler consumers and are
verified with TypeScript 5.8.3. No older compiler minimum is claimed. CommonJS
default-import compilation requires `esModuleInterop`; native ESM can use the
default import directly.
