'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { candidate, digest } = require('./package-consumer');
const { root } = require('./package-layout');
const tarball = candidate();
const sha256 = digest(tarball);
process.env.GO_NUMBERS_TARBALL = tarball;
const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const commands = [
  'lint',
  'format:check',
  'test:syntax',
  'test:docs',
  'coverage',
  'test:types',
  'test:build',
  'test:artifacts',
  'test:runtime',
  'test:tree-shaking',
  'test:oracle',
  'test:mutations'
];
for (const command of commands) {
  const result = spawnSync(process.execPath, [npmCli, 'run', command], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exitCode = result.status || 1;
    break;
  }
  if (digest(tarball) !== sha256) throw new Error('Candidate changed during verification: ' + tarball);
}
if (!process.exitCode && process.argv.includes('--all')) {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, 'test-browser-distribution.cjs'), '--tarball', tarball],
    { cwd: root, stdio: 'inherit' }
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status || 1;
}
if (digest(tarball) !== sha256) throw new Error('Candidate changed during verification: ' + tarball);
if (!process.exitCode) console.log('Verified candidate: ' + tarball + '\nSHA-256: ' + sha256);
