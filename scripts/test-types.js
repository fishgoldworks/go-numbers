'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { withPackedPackage, run } = require('./package-consumer.js');
const compiler = require.resolve('typescript/bin/tsc');
const expectedCompilerVersion = require('../package.json').devDependencies.typescript;
const compilerVersion = run(process.execPath, [compiler, '--version'], path.resolve(__dirname, '..')).trim();
assert.equal(
  compilerVersion,
  `Version ${expectedCompilerVersion}`,
  `TypeScript ${expectedCompilerVersion} is required for reproducible declaration verification; got ${compilerVersion || 'no version output'}.`
);
const fixtures = path.resolve(__dirname, '../test/types');

withPackedPackage(({ directory }) => {
  const installedApi = require(path.join(directory, 'node_modules/go-numbers'));
  const functionImports = [
    "import * as root from 'go-numbers';",
    'type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;',
    'type Assert<T extends true> = T;'
  ];
  for (const name of Object.keys(installedApi).filter((key) => typeof installedApi[key] === 'function')) {
    for (const [index, suffix] of [name, 'src/' + name, 'src/' + name + '.js'].entries()) {
      const id = name + index;
      functionImports.push(
        `import default${id}, { ${name} as named${id} } from 'go-numbers/${suffix}';`,
        `type Named${id} = Assert<Equal<typeof named${id}, typeof root.${name}>>;`,
        `type Default${id} = Assert<Equal<typeof default${id}, typeof root.${name}>>;`,
        '// @ts-expect-error function subpaths expose only their own named callable',
        `import { unsupported as absent${id} } from 'go-numbers/${suffix}';`
      );
    }
  }
  fs.writeFileSync(path.join(directory, 'function-imports.mts'), functionImports.join('\n'));
  for (const file of [
    'consumer.cts',
    'consumer.mts',
    'legacy.ts',
    'contracts.cts',
    'contracts.mts',
    'compiler-options.cts',
    'compiler-options.mts',
    'minimal.cts',
    'minimal.mts',
    'runtime.cts',
    'runtime.mts',
    'runtime.ts'
  ]) {
    fs.copyFileSync(path.join(fixtures, file), path.join(directory, file));
  }
  const strict = {
    strict: true,
    skipLibCheck: false,
    types: [],
    noUncheckedIndexedAccess: true,
    noPropertyAccessFromIndexSignature: true,
    useUnknownInCatchVariables: true
  };
  function compile(label, options, files) {
    const config = path.join(directory, 'tsconfig.check.json');
    fs.writeFileSync(config, JSON.stringify({ compilerOptions: { ...strict, ...options }, files }));
    run(process.execPath, [compiler, '--project', config], directory);
    console.log('PASS: packed-package TypeScript consumer — ' + label);
  }
  for (const exactOptionalPropertyTypes of [false, true]) {
    for (const [label, module, moduleResolution, files] of [
      [
        'NodeNext CJS/ESM',
        'NodeNext',
        'NodeNext',
        [
          'consumer.cts',
          'consumer.mts',
          'contracts.cts',
          'contracts.mts',
          'compiler-options.cts',
          'compiler-options.mts',
          'function-imports.mts'
        ]
      ],
      [
        'Bundler ESM',
        'ESNext',
        'Bundler',
        ['consumer.mts', 'contracts.mts', 'compiler-options.mts', 'function-imports.mts']
      ],
      ['Legacy CommonJS', 'CommonJS', 'Node', ['legacy.ts', 'contracts.cts', 'compiler-options.cts']]
    ]) {
      compile(
        `${label}; exactOptionalPropertyTypes=${exactOptionalPropertyTypes}`,
        {
          noEmit: true,
          target: 'ES2022',
          lib: ['ES2022'],
          module,
          moduleResolution,
          exactOptionalPropertyTypes,
          verbatimModuleSyntax: true
        },
        files
      );
    }
  }
  for (const [label, module, moduleResolution, files] of [
    ['NodeNext CJS/ESM', 'NodeNext', 'NodeNext', ['minimal.cts', 'minimal.mts']],
    ['Bundler ESM', 'ESNext', 'Bundler', ['minimal.mts']],
    ['Legacy CommonJS', 'CommonJS', 'Node', ['minimal.cts']]
  ]) {
    compile(
      `${label}; ES5-only ambient library`,
      {
        noEmit: true,
        target: 'ES5',
        lib: ['ES5'],
        module,
        moduleResolution,
        exactOptionalPropertyTypes: true,
        verbatimModuleSyntax: true
      },
      files
    );
  }
  for (const [label, module, moduleResolution, files, outputs] of [
    ['NodeNext', 'NodeNext', 'NodeNext', ['runtime.cts', 'runtime.mts'], ['runtime.cjs', 'runtime.mjs']],
    ['Legacy', 'CommonJS', 'Node', ['runtime.ts'], ['runtime.js']],
    ['Bundler', 'ESNext', 'Bundler', ['runtime.mts'], ['runtime.mjs']]
  ]) {
    compile(
      `${label}; emitted callbacks/defaults`,
      {
        target: 'ES2017',
        lib: ['ES2017'],
        module,
        moduleResolution,
        noEmitOnError: true,
        esModuleInterop: true,
        exactOptionalPropertyTypes: true,
        outDir: label
      },
      files
    );
    for (const file of outputs) {
      const executable = file.endsWith('.mjs') ? process.env.NODE_ESM_BIN : process.env.NODE8_BIN;
      for (const runtime of new Set([process.execPath, executable].filter(Boolean)))
        process.stdout.write(run(runtime, [path.join(label, file)], directory));
    }
    console.log('PASS: compiled and executed TypeScript defaults — ' + label);
  }
  require('./test-types-compat')({ directory: path.join(directory, 'node_modules/go-numbers') });
});
