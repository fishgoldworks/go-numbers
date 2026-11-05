# Changelog

## Unreleased

Target: 0.3.6. Versions 0.1.0 through 0.3.6 previously labelled internal review
checkpoints were not published to npm. These changes are relative to 0.0.1.

### Breaking changes

- Required Node.js 8.0.0 or later for CommonJS; native ESM requires 12.17.0 or
  later, with the documented conditional-exports flag on Node 13.2–13.6.
- Made numeric predicates non-coercing, used intrinsic values for genuine boxes,
  and corrected parser boundaries, fallback propagation and non-finite handling.
  See [migration](MIGRATION.md) for the affected inputs and replacements.
- Omitted the unfinished `random` and `randomInt` functions from the public API.
  Restricted supported imports to the documented root, function and compatibility paths.

### Added

- Added finite and safe-integer parsers, `extractNumber`, range checking and
  clamping, precision and step rounding, modulo, and approximate comparison.
- Added default/named ESM imports at the root and every public function subpath,
  with matching TypeScript declarations and shared function identities.
- Added readable and minified standalone browser bundles with source maps,
  CommonJS/AMD loading and the `goNumbers` browser global.

### Changed

- Licensed the library-owned code under MIT, retaining Michael Ko's 2015 copyright.
  Previously distributed archives retain their original notices.

### Fixed

- Repaired the published entry point's missing `src/Types` dependency.
- Corrected scientific-notation fractions, strict parsing,
  special-token boundaries, signed zero and rounding at numeric limits.
- Preserved exact fallback values and conversion errors; rejected boxed bigints
  without precision loss, including when the optional global is unavailable.
- Excluded local experiment directories from generated packages and rejected
  browser imports from those directories. Regenerated documentation during builds.

### Documentation

- Replaced the placeholder README with executable usage examples, a complete API
  reference and upgrade guidance based on the published 0.0.1 archive.
- Aligned starter imports, API navigation and alias documentation with the library
  family, and consolidated contributor instructions in `CONTRIBUTING.md`.

### Maintenance

- Updated the development glob-matching dependency to a patched release.

## 0.0.1 — 2022-08-02

### Added

- Published the initial npm archive. It contained a numeric utility source file,
  a placeholder README and an entry point referencing the missing `src/Types` module.
  Its package metadata declared `GNU LGPLv3`; the archive is unchanged by this release.
