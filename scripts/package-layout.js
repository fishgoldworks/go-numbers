'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const consumerFiles = [
  'index.js',
  'index.mjs',
  'index.d.ts',
  'index.d.mts',
  'README.md',
  'CHANGELOG.md',
  'LICENSE.md',
  'MIGRATION.md',
  'docs/API.md'
];
function consumerManifest(directory = root) {
  const metadata = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  const api = require(path.join(directory, 'index.js'));
  const manifest = {};
  for (const key of ['name', 'version', 'description', 'author', 'license', 'homepage', 'repository', 'keywords'])
    manifest[key] = metadata[key];
  // Consumer bundlers may omit unused modules; importing the library requires no setup.
  manifest.sideEffects = ['./dist/go-numbers.js', './dist/go-numbers.min.js'];
  Object.assign(manifest, {
    type: 'commonjs',
    main: './index.js',
    module: './index.mjs',
    types: './index.d.ts',
    engines: { node: '>=8.0.0' }
  });
  const entry = {
    import: { types: './index.d.mts', default: './index.mjs' },
    require: { types: './index.d.ts', default: './index.js' },
    // Early Node 13 recognizes node/require, but not import, behind its flag.
    node: './index.mjs',
    default: './index.js'
  };
  manifest.exports = { '.': entry, './index.js': entry, './package.json': './package.json' };
  manifest.typesVersions = { '*': {} };
  for (const name of Object.keys(api).filter((key) => typeof api[key] === 'function')) {
    const target = {
      import: { types: './esm/' + name + '.d.mts', default: './esm/' + name + '.mjs' },
      require: { types: './src/' + name + '.d.ts', default: './src/' + name + '.js' },
      node: './esm/' + name + '.mjs',
      default: './src/' + name + '.js'
    };
    for (const alias of [name, 'src/' + name, 'src/' + name + '.js']) manifest.exports['./' + alias] = target;
    manifest.typesVersions['*'][name] = ['src/' + name + '.d.ts'];
  }
  for (const name of ['Numbers', 'parseInt'])
    for (const extension of ['', '.js'])
      manifest.exports['./src/' + name + extension] = {
        types: './src/' + name + '.d.ts',
        default: './src/' + name + '.js'
      };
  // Node 13.0 supports export arrays but predates conditional export objects.
  for (const [alias, target] of Object.entries(manifest.exports)) {
    if (typeof target !== 'string') manifest.exports[alias] = [target, target.default];
  }
  manifest.files = [
    '*.js',
    '*.mjs',
    '*.d.ts',
    '*.d.mts',
    'src/**/*.js',
    'src/**/*.d.ts',
    'esm/*.mjs',
    'esm/*.d.mts',
    'README.md',
    'CHANGELOG.md',
    'LICENSE.md',
    'MIGRATION.md',
    'docs/API.md'
  ];
  manifest.unpkg = manifest.jsdelivr = './dist/go-numbers.min.js';
  manifest.files.push('dist/');
  for (const file of ['go-numbers.js', 'go-numbers.js.map', 'go-numbers.min.js', 'go-numbers.min.js.map'])
    manifest.exports['./dist/' + file] = './dist/' + file;
  // Sort only manifest fields; nested export conditions and fallback arrays retain precedence.
  const fields = [
    'name',
    'version',
    'private',
    'description',
    'license',
    'author',
    'contributors',
    'email',
    'keywords',
    'homepage',
    'repository',
    'bugs',
    'funding',
    'type',
    'engines',
    'devEngines',
    'packageManager',
    'main',
    'module',
    'browser',
    'types',
    'typesVersions',
    'exports',
    'imports',
    'bin',
    'unpkg',
    'jsdelivr',
    'files',
    'sideEffects',
    'publishConfig',
    'scripts',
    'dependencies',
    'optionalDependencies',
    'peerDependencies',
    'peerDependenciesMeta',
    'devDependencies',
    'overrides',
    'resolutions'
  ];
  return Object.fromEntries(
    fields.filter((field) => Object.hasOwn(manifest, field)).map((field) => [field, manifest[field]])
  );
}
function functionEntries(directory = root) {
  const api = require(path.join(directory, 'index.js'));
  const files = new Map();
  for (const name of Object.keys(api).filter((key) => typeof api[key] === 'function')) {
    files.set(name + '.js', "'use strict';\nmodule.exports = require('./src/" + name + ".js');\n");
    const facade = `import ${name} from '../src/${name}.js';\nexport { ${name} };\nexport default ${name};\n`;
    files.set('esm/' + name + '.mjs', facade);
    files.set('esm/' + name + '.d.mts', facade);
  }
  return files;
}
module.exports = { root, consumerFiles, consumerManifest, functionEntries };
