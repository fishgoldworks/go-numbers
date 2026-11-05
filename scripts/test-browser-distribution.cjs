'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { withPackedPackage, suppliedTarball } = require('./package-consumer');
const { root } = require('./package-layout');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || !['--package', '--tarball'].includes(args[0])))
  throw Error('Usage: test:browser -- [--package DIRECTORY | --tarball FILE]');
function check(directory) {
  const result = spawnSync(
    process.execPath,
    ['--test', 'scripts/test-browser-bundles.cjs', 'scripts/browser.test.cjs'],
    {
      cwd: root,
      env: { ...process.env, GO_BROWSER_PACKAGE: directory },
      stdio: 'inherit'
    }
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error('Browser checks failed');
}
if (args[0] === '--package') check(path.resolve(args[1]));
else
  withPackedPackage(({ directory }) => check(path.join(directory, 'node_modules/go-numbers')), suppliedTarball(args));
