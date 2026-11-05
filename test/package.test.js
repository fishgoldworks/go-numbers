'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('metadata declares a tested runtime, declarations and no runtime dependencies', () => {
  const pkg = require('../scripts/package-layout').consumerManifest();
  assert.equal(pkg.engines.node, '>=8.0.0');
  assert.equal(pkg.version, '0.3.6');
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.types, './index.d.ts');
  assert.deepEqual(pkg.sideEffects, ['./dist/go-numbers.js', './dist/go-numbers.min.js']);
  assert.deepEqual(pkg.dependencies || {}, {});
  assert.equal(require('../package.json').devDependencies.typescript, '5.8.3');
  assert.ok(Array.isArray(pkg.files));
  assert.ok(pkg.exports['.'][0].import.types.endsWith('.d.mts'));
  assert.ok(pkg.exports['.'][0].require.types.endsWith('.d.ts'));
});

test('consumer export map contains exactly the supported public paths', () => {
  const api = require('..');
  const functions = Object.keys(api).filter((name) => typeof api[name] === 'function');
  const manifest = require('../scripts/package-layout').consumerManifest();
  const browserFiles = ['go-numbers.js', 'go-numbers.js.map', 'go-numbers.min.js', 'go-numbers.min.js.map'].map(
    (file) => 'dist/' + file
  );
  const expectedExports = ['.', './index.js', './package.json', ...browserFiles.map((file) => './' + file)];
  for (const name of functions) {
    expectedExports.push('./' + name, './src/' + name, './src/' + name + '.js');
  }
  expectedExports.push('./src/Numbers', './src/Numbers.js', './src/parseInt', './src/parseInt.js');
  assert.deepEqual(Object.keys(manifest.exports).sort(), expectedExports.sort());
  assert.deepEqual(Object.keys(manifest.typesVersions['*']).sort(), functions.sort());
});

test('the package retains its copyright under MIT', () => {
  assert.equal(fs.existsSync(path.join(root, 'src/a.js')), false);
  const licence = fs.readFileSync(path.join(root, 'LICENSE.md'), 'utf8');
  assert.match(licence, /^MIT License/);
  assert.match(licence, /Copyright \(c\) 2015 Michael Ko/);
});

test('actual npm tarball installs offline and supports CJS/ESM/individual imports', { timeout: 30000 }, () => {
  const { withPackedPackage, runNode } = require('../scripts/package-consumer.js');
  withPackedPackage(({ directory, manifest }) => {
    const paths = manifest.files.map((file) => file.path);
    for (const name of [
      'index.js',
      'index.mjs',
      'index.d.ts',
      'index.d.mts',
      'LICENSE.md',
      'MIGRATION.md',
      'README.md',
      'docs/API.md',
      'CHANGELOG.md',
      'package.json'
    ]) {
      assert.ok(paths.includes(name), name);
    }
    for (const name of paths) {
      assert.doesNotMatch(name, /(^|\/)(benchmarks|test|tests|scripts|node_modules|\.git|temp|\.tmp|nbproject)(\/|$)/);
      assert.notEqual(name, 'src/a.js');
    }
    assert.ok(paths.every((name) => !name.endsWith('.tgz')));
    for (const name of paths) {
      assert.match(
        name,
        /^(?:dist\/go-numbers(?:\.min)?\.js(?:\.map)?|[A-Za-z]+\.js|index\.(?:mjs|d\.ts|d\.mts)|esm\/[A-Za-z]+\.(?:mjs|d\.mts)|src\/(?:internal\/)?[A-Za-z]+\.(?:js|d\.ts)|package\.json|README\.md|docs\/API\.md|CHANGELOG\.md|LICENSE\.md|MIGRATION\.md)$/
      );
    }
    const expectedPaths = [
      ...require('../scripts/package-layout').consumerFiles,
      'package.json',
      ...['go-numbers.js', 'go-numbers.js.map', 'go-numbers.min.js', 'go-numbers.min.js.map'].map(
        (file) => 'dist/' + file
      )
    ];
    expectedPaths.push(...require('../scripts/package-layout').functionEntries().keys());
    function sourceFiles(relative) {
      for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
        const file = relative + '/' + entry.name;
        if (entry.isDirectory()) {
          if (!['temp', '.tmp'].includes(entry.name)) sourceFiles(file);
        } else if (/\.(js|d\.ts)$/.test(file)) expectedPaths.push(file);
      }
    }
    sourceFiles('src');
    assert.deepEqual(
      paths.slice().sort(),
      expectedPaths.sort(),
      'Package inventory must be exactly the consumer contract'
    );
    const installed = path.join(directory, 'node_modules/go-numbers');
    require('../scripts/lib/check-library-readme.cjs').checkPackage(installed);
    const docs = require('../scripts/docs.js');
    for (const file of docs.documents) {
      assert.equal(
        fs.readFileSync(path.join(installed, file), 'utf8'),
        fs.readFileSync(path.join(root, file), 'utf8'),
        file
      );
    }
    docs.validateLinks(installed);
    docs.summary(
      fs.readFileSync(path.join(installed, 'docs/API.md'), 'utf8'),
      require(path.join(installed, 'index.js'))
    );
    const examples = require('../scripts/test-examples.js');
    examples.runAll(installed, directory);
    examples.checkTypes(installed);
    runNode(
      directory,
      `
            const assert = require('node:assert/strict');
            const numbers = require('go-numbers');
            for (const [name, value] of Object.entries(numbers)) {
                if (typeof value !== 'function') continue;
                assert.equal(require('go-numbers/' + name), value);
                assert.equal(require('go-numbers/src/' + name), value);
                assert.equal(require('go-numbers/src/' + name + '.js'), value);
            }
            assert.equal(require('go-numbers/src/Numbers'), numbers);
            assert.equal(require('go-numbers/src/Numbers.js'), numbers);
            assert.equal(require('go-numbers/index.js'), numbers);
            assert.equal(require('go-numbers/src/parseInt'), numbers.parse);
            assert.equal(require('go-numbers/src/parseInt.js'), numbers.parse);
            assert.equal(numbers.parseStrict('1e3'), 1000);
            assert.equal(numbers.getFraction(1.23e-7), 1.23e-7);
            assert.equal(numbers.isOdd(-3), true);
            assert.equal(numbers.extractNumber, numbers.parse);
            assert.equal(numbers.parseFinite('1e999', null), null);
            assert.equal(numbers.parseSafeInteger('1.0000000000000001', null), null);
            assert.equal(numbers.clamp(150, 0, 100), 100);
            assert.equal(numbers.isInRange(10, 0, 10, { includeMax: false }), false);
            assert.equal(numbers.round(1.005, 2), 1.01);
            assert.equal(numbers.ceil(1.1, 2), 1.1);
            assert.equal(numbers.floor(.29, 2), .29);
            assert.equal(numbers.roundTo(.15, .1), .2);
            assert.equal(numbers.modulo(-1, 5), 4);
            assert.equal(numbers.isClose(.1 + .2, .3), true);
            for (const suffix of ['/src/internal/unwrapNumber', '/src/internal/unwrapNumber.js', '/src/internal/roundDecimal.js', '/test/predicates.test.js', '/parseInt', '/Numbers', '/notAnExport']) assert.throws(() => require('go-numbers' + suffix), {code:'ERR_PACKAGE_PATH_NOT_EXPORTED'});
        `
    );
    runNode(
      directory,
      `
            import assert from 'node:assert/strict';
            import { createRequire } from 'node:module';
            import numbers, * as named from 'go-numbers';
            import isOdd from 'go-numbers/isOdd';
            import parseStrict from 'go-numbers/parseStrict';
            const require = createRequire(import.meta.url);
            assert.equal(numbers, require('go-numbers'));
            assert.equal(isOdd, numbers.isOdd);
            assert.equal(parseStrict('1e3'), 1000);
            for (const [key,value] of Object.entries(numbers)) {
                assert.ok(Object.is(named[key], value), key);
                if (typeof value === 'function') {
                    for (const suffix of ['/' + key, '/src/' + key, '/src/' + key + '.js']) {
                        const focused = await import('go-numbers' + suffix);
                        assert.equal(focused.default, value);
                        assert.equal(focused[key], value);
                    }
                }
            }
            for (const suffix of ['/src/internal/unwrapNumber', '/src/internal/unwrapNumber.js', '/src/internal/roundDecimal.js', '/test/predicates.test.js', '/parseInt', '/Numbers', '/notAnExport']) await assert.rejects(import('go-numbers' + suffix), {code:'ERR_PACKAGE_PATH_NOT_EXPORTED'});
            assert.equal(numbers.extractNumber, numbers.parse);
            assert.equal(numbers.round(-1.005, 2), -1);
            assert.equal(numbers.isClose(Number.MIN_VALUE, 0, { relativeTolerance: .75 }), false);
        `,
      true
    );
  });
});
