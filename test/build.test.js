'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
test('a private development root cannot be packed instead of the consumer package', () => {
  assert.equal(require('../package.json').private, true);
});
test('generated physical function entries preserve Node 8 identities and declarations', () => {
  const manifest = require('../package/package.json');
  assert.equal(manifest.engines.node, '>=8.0.0');
  assert.equal(manifest.private, undefined);
  assert.equal(manifest.scripts, undefined);
  assert.equal(manifest.devDependencies, undefined);
  const numbers = require('../package/index.js');
  for (const name of Object.keys(numbers).filter((key) => typeof numbers[key] === 'function')) {
    assert.equal(require('../package/' + name + '.js'), numbers[name]);
    assert.equal(
      fs.readFileSync(path.join(root, 'package/src', name + '.d.ts'), 'utf8'),
      fs.readFileSync(path.join(root, 'src', name + '.d.ts'), 'utf8')
    );
  }
});
test('a failed staged build preserves the previous complete output', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-build-'));
  try {
    for (const name of [
      'src',
      'index.js',
      'index.mjs',
      'index.d.ts',
      'index.d.mts',
      'package.json',
      'README.md',
      'CHANGELOG.md',
      'LICENSE.md',
      'MIGRATION.md',
      'docs',
      'scripts'
    ])
      fs.cpSync(path.join(root, name), path.join(fixture, name), { recursive: true });
    fs.mkdirSync(path.join(fixture, 'package'));
    fs.writeFileSync(path.join(fixture, 'package/previous.txt'), 'previous complete output');
    fs.writeFileSync(path.join(fixture, 'index.mjs'), 'throw new Error("broken staged import");');
    const result = spawnSync(
      process.execPath,
      [
        '-e',
        'require(' +
          JSON.stringify(path.join(root, 'scripts/build.js')) +
          ').build(' +
          JSON.stringify(fixture) +
          ').catch(error => { console.error(error); process.exitCode = 1; })'
      ],
      { encoding: 'utf8' }
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /broken staged import/);
    assert.equal(fs.readFileSync(path.join(fixture, 'package/previous.txt'), 'utf8'), 'previous complete output');
    assert.deepEqual(
      fs.readdirSync(fixture).filter((name) => name.startsWith('.go-numbers-build-')),
      []
    );
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test('artifact validation rejects unexpected generated files', async () => {
  const { validate } = require('../scripts/test-artifacts');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-artifacts-'));
  const generated = path.join(directory, 'package');
  try {
    fs.cpSync(path.join(root, 'package'), generated, { recursive: true });
    fs.writeFileSync(path.join(generated, 'stale-output.js'), "module.exports = 'stale';\n");
    await assert.rejects(() => validate(generated, root), /Unexpected generated artifact: stale-output\.js/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('a supplied missing tarball fails without creating a replacement', () => {
  const { withPackedPackage } = require('../scripts/package-consumer.js');
  let called = false;
  assert.throws(
    () =>
      withPackedPackage(
        () => {
          called = true;
        },
        path.join(os.tmpdir(), 'absent-go-numbers-candidate.tgz')
      ),
    /Supplied tarball does not exist/
  );
  assert.equal(called, false);
});

test('failed directory replacement restores the previous complete package', () => {
  const { replaceDirectory } = require('../scripts/build');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-replace-'));
  const staged = path.join(directory, 'staged');
  const destination = path.join(directory, 'package');
  fs.mkdirSync(staged);
  fs.mkdirSync(destination);
  fs.writeFileSync(path.join(destination, 'previous.txt'), 'previous');
  const error = new Error('replacement denied');
  try {
    assert.throws(
      () =>
        replaceDirectory(staged, destination, {
          ...fs,
          renameSync(from, to) {
            if (from === staged) throw error;
            fs.renameSync(from, to);
          }
        }),
      (caught) => caught === error
    );
    assert.equal(fs.readFileSync(path.join(destination, 'previous.txt'), 'utf8'), 'previous');
    assert.ok(fs.existsSync(staged));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
test('wrong-directory lifecycle hooks reject publication with an actionable target', () => {
  const result = spawnSync(process.execPath, ['scripts/reject-root-package.js'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /pack:package/);
});

test('a supplied candidate with a mismatched recorded digest fails before installation', () => {
  const { withPackedPackage } = require('../scripts/package-consumer');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-digest-'));
  const archive = path.join(directory, 'candidate.tgz');
  try {
    fs.writeFileSync(archive, 'changed candidate');
    fs.writeFileSync(archive + '.json', JSON.stringify({ sha256: 'incorrect' }));
    assert.throws(() => withPackedPackage(() => assert.fail('must not install'), archive), /digest does not match/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('a supplied candidate record must name the adjacent tarball portably', () => {
  const { checkTarball, digest } = require('../scripts/package-consumer');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-record-'));
  const archive = path.join(directory, 'candidate.tgz');
  try {
    fs.writeFileSync(archive, 'candidate bytes');
    fs.writeFileSync(
      archive + '.json',
      JSON.stringify({ tarball: path.join('/build/machine', 'different.tgz'), sha256: digest(archive) })
    );
    assert.throws(() => checkTarball(archive), /does not name the supplied tarball/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('post-commit backup cleanup failure does not report a failed replacement', () => {
  const { replaceDirectory } = require('../scripts/build');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-cleanup-'));
  const staged = path.join(directory, 'staged');
  const destination = path.join(directory, 'package');
  fs.mkdirSync(staged);
  fs.mkdirSync(destination);
  fs.writeFileSync(path.join(staged, 'new.txt'), 'new');
  fs.writeFileSync(path.join(destination, 'previous.txt'), 'previous');
  const cleanupError = new Error('backup cleanup denied');
  try {
    let cleanup;
    assert.doesNotThrow(() => {
      cleanup = replaceDirectory(staged, destination, {
        ...fs,
        rmSync(target, options) {
          if (target === staged + '-previous') throw cleanupError;
          return fs.rmSync(target, options);
        }
      });
    });
    assert.equal(cleanup.error, cleanupError);
    assert.equal(cleanup.previous, staged + '-previous');
    assert.equal(fs.readFileSync(path.join(destination, 'new.txt'), 'utf8'), 'new');
    assert.equal(fs.readFileSync(path.join(staged + '-previous', 'previous.txt'), 'utf8'), 'previous');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('failed rollback reports both errors and retains the previous package backup', () => {
  const { replaceDirectory } = require('../scripts/build');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-rollback-'));
  const staged = path.join(directory, 'staged');
  const destination = path.join(directory, 'package');
  fs.mkdirSync(staged);
  fs.mkdirSync(destination);
  fs.writeFileSync(path.join(destination, 'previous.txt'), 'previous');
  const replacement = new Error('replacement denied'),
    restoration = new Error('restore denied');
  try {
    assert.throws(
      () =>
        replaceDirectory(staged, destination, {
          ...fs,
          renameSync(from, to) {
            if (from === staged) throw replacement;
            if (from === staged + '-previous') throw restoration;
            fs.renameSync(from, to);
          }
        }),
      (caught) => {
        assert.deepEqual(caught.errors, [replacement, restoration]);
        assert.ok(caught.message.includes(staged + '-previous'));
        return true;
      }
    );
    assert.equal(fs.readFileSync(path.join(staged + '-previous', 'previous.txt'), 'utf8'), 'previous');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
