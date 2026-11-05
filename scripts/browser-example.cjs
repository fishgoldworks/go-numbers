'use strict';
const assert = require('node:assert/strict');
function browserExample(readme, metadata) {
  const prefix = 'https://cdn.jsdelivr.net/npm/' + metadata.name + '@' + metadata.version + '/';
  for (const [label, file] of [
    ['Minified bundle', 'go-numbers.min.js'],
    ['Readable bundle', 'go-numbers.js']
  ])
    assert.ok(
      readme.includes('[' + label + '](' + prefix + 'dist/' + file + ')'),
      'Incorrect candidate CDN link: ' + label
    );
  const match = /<!-- browser-example -->\s*`{3}html\r?\n([\s\S]*?)`{3}/.exec(readme);
  assert.ok(match, 'Packaged README must contain the executable script-tag example');
  const sources = [...match[1].matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)].map((entry) => entry[1]);
  assert.deepEqual(sources, [prefix + 'dist/go-numbers.min.js'], 'README must load this exact candidate');
  return match[1].replaceAll(prefix, './');
}
module.exports = { browserExample };
