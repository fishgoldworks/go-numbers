'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { build } = require('../scripts/build');
const { consumerFiles } = require('../scripts/package-layout');
const root = path.resolve(__dirname, '..');

async function fixture(check) {
  // A .tmp ancestor must not exclude the maintained files inside this project.
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-release-'));
  const directory = path.join(temporary, '.tmp', 'project');
  fs.mkdirSync(directory, { recursive: true });
  try {
    for (const file of new Set([...consumerFiles, 'src', 'package.json', 'scripts'])) {
      fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
      fs.cpSync(path.join(root, file), path.join(directory, file), { recursive: true });
    }
    return await check(directory);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

test('build excludes nested experiments while preserving their source files', async () => {
  await fixture(async (directory) => {
    for (const relative of ['src/temp/probe.js', 'src/internal/.tmp/probe.d.ts']) {
      fs.mkdirSync(path.dirname(path.join(directory, relative)), { recursive: true });
      fs.writeFileSync(path.join(directory, relative), 'local experiment');
    }
    await build(directory);
    for (const relative of ['src/temp/probe.js', 'src/internal/.tmp/probe.d.ts']) {
      assert.equal(fs.existsSync(path.join(directory, 'package', relative)), false, relative + ' was shipped');
      assert.equal(fs.readFileSync(path.join(directory, relative), 'utf8'), 'local experiment');
    }
    assert.equal(require(path.join(directory, 'package/index.js')).roundTo(1.375, 0.25), 1.5);
  });
});

test('build regenerates stale documentation from the maintained templates', async () => {
  await fixture(async (directory) => {
    fs.writeFileSync(path.join(directory, 'README.md'), 'stale README');
    await build(directory);
    const readme = fs.readFileSync(path.join(directory, 'package/README.md'), 'utf8');
    assert.match(readme, /# Go Numbers/);
    assert.equal(readme, fs.readFileSync(path.join(root, 'README.md'), 'utf8'));
  });
});

test('build rejects experiments imported into a browser bundle before replacing output', async () => {
  await fixture(async (directory) => {
    fs.mkdirSync(path.join(directory, 'src/temp'));
    fs.writeFileSync(path.join(directory, 'src/temp/secret.js'), "globalThis.experimentalMarker = 'private data';");
    fs.appendFileSync(path.join(directory, 'index.js'), "\nrequire('./src/temp/secret');\n");
    fs.mkdirSync(path.join(directory, 'package'));
    fs.writeFileSync(path.join(directory, 'package/previous.txt'), 'previous complete output');
    await assert.rejects(() => build(directory), /Reserved experiment directory/);
    assert.equal(fs.readFileSync(path.join(directory, 'package/previous.txt'), 'utf8'), 'previous complete output');
    delete globalThis.experimentalMarker;
  });
});

test('the browser command rejects a mismatched candidate record before installing', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-browser-record-'));
  try {
    const tarball = path.join(directory, 'candidate.tgz');
    fs.writeFileSync(tarball, 'not an archive');
    fs.writeFileSync(tarball + '.json', JSON.stringify({ sha256: 'incorrect' }));
    const result = require('node:child_process').spawnSync(
      process.execPath,
      ['scripts/test-browser-distribution.cjs', '--tarball', tarball],
      { cwd: root, encoding: 'utf8', timeout: 30000 }
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /digest does not match/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('browser README validation rejects wrong-version links and script URLs', () => {
  const { browserExample } = require('../scripts/browser-example.cjs');
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const metadata = require('../package.json');
  const prefix = 'https://cdn.jsdelivr.net/npm/go-numbers@' + metadata.version + '/';
  assert.ok(browserExample(readme, metadata).includes('./dist/go-numbers.min.js'));
  assert.throws(
    () => browserExample(readme.replace(prefix, prefix.replace(metadata.version, '0.0.1')), metadata),
    /Incorrect candidate CDN link/
  );
  assert.throws(
    () => browserExample(readme.replace('<script src="' + prefix, '<script src="https://example.invalid/'), metadata),
    /exact candidate/
  );
});

test('the browser command honours an explicitly supplied environment candidate', () => {
  const result = require('node:child_process').spawnSync(process.execPath, ['scripts/test-browser-distribution.cjs'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30000,
    env: { ...process.env, GO_NUMBERS_TARBALL: path.join(os.tmpdir(), 'absent-go-numbers-candidate.tgz') }
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Supplied tarball does not exist/);
});
