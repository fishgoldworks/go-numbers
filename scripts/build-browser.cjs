'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildSync } = require('esbuild');
const filenames = ['go-numbers.js', 'go-numbers.min.js'];
function generateBrowserBundles(directory = path.resolve(__dirname, '..')) {
  const metadata = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  const license = fs.readFileSync(path.join(directory, 'LICENSE.md'), 'utf8').replace(/\r\n/g, '\n').trim();
  const notice = '/*! ' + metadata.name + ' v' + metadata.version + '\n\n' + license + '\n*/';
  const wrapper =
    '(function (root, factory) {\n' +
    "  if (typeof module === 'object' && module !== null && module.exports) module.exports = factory();\n" +
    "  else if (typeof define === 'function' && define.amd) define([], factory);\n" +
    '  else root.goNumbers = factory();\n' +
    "})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {\n" +
    '  var module = { exports: {} };\n  var exports = module.exports;';
  const outputs = new Map();
  for (const filename of filenames) {
    const result = buildSync({
      absWorkingDir: directory,
      entryPoints: ['index.js'],
      outfile: path.join(directory, 'dist', filename),
      bundle: true,
      metafile: true,
      write: false,
      format: 'cjs',
      platform: 'browser',
      target: 'es2020',
      keepNames: true,
      // Avoid syntax folding that can change HTMLDDA or observable property access.
      minifyIdentifiers: filename.endsWith('.min.js'),
      minifyWhitespace: filename.endsWith('.min.js'),
      minifySyntax: false,
      sourcemap: true,
      sourcesContent: true,
      legalComments: 'inline',
      banner: { js: notice + '\n' + wrapper },
      footer: { js: 'return module.exports;\n});' }
    });
    for (const input of Object.keys(result.metafile.inputs)) {
      const relative = path.relative(directory, path.resolve(directory, input));
      if (
        relative
          .split(path.sep)
          .slice(0, -1)
          .some((part) => ['temp', '.tmp'].includes(part))
      )
        throw new Error('Reserved experiment directory in browser input: ' + relative);
    }
    for (const output of result.outputFiles) outputs.set('dist/' + path.basename(output.path), output.text);
    const context = vm.createContext({});
    vm.runInContext(outputs.get('dist/' + filename), context, { timeout: 10000 });
  }
  return outputs;
}
module.exports = { filenames, generateBrowserBundles };
