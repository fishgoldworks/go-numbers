'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, npm_config_update_notifier: 'false' }
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed (${result.status})\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

function npm(args, cwd) {
  // npm supplies its JS entry in scripts, which also avoids Windows .cmd spawning.
  if (process.env.npm_execpath && path.basename(process.env.npm_execpath) === 'npm-cli.js') {
    return run(process.execPath, [process.env.npm_execpath, ...args], cwd);
  }
  const sibling = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  if (fs.existsSync(sibling)) return run(process.execPath, [sibling, ...args], cwd);
  // Direct node --test invocation on Unix, outside an npm script.
  return run('npm', args, cwd);
}

function runNode(directory, source, esm = false) {
  const file = path.join(directory, esm ? 'consumer.mjs' : 'consumer.cjs');
  fs.writeFileSync(file, source);
  return run(process.execPath, [file], directory);
}

function suppliedTarball(args = process.argv.slice(2)) {
  const index = args.indexOf('--tarball');
  if (index >= 0) {
    if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error('--tarball requires a path');
    return path.resolve(args[index + 1]);
  }
  return process.env.GO_NUMBERS_TARBALL ? path.resolve(process.env.GO_NUMBERS_TARBALL) : undefined;
}
function checkTarball(tarball) {
  if (!fs.existsSync(tarball) || !fs.statSync(tarball).isFile())
    throw new Error('Supplied tarball does not exist: ' + tarball);
  const record = tarball + '.json';
  if (fs.existsSync(record)) {
    const metadata = JSON.parse(fs.readFileSync(record, 'utf8'));
    if (metadata.tarball && metadata.tarball !== path.basename(tarball))
      throw new Error('Supplied candidate record does not name the supplied tarball: ' + tarball);
    if (metadata.sha256 !== digest(tarball))
      throw new Error('Supplied tarball digest does not match its candidate record: ' + tarball);
  }
  return tarball;
}
function digest(tarball) {
  return require('node:crypto').createHash('sha256').update(fs.readFileSync(tarball)).digest('hex');
}
function candidate(tarball = suppliedTarball()) {
  if (tarball) return checkTarball(tarball);
  run(process.execPath, [path.join(__dirname, 'pack-package.js')], root);
  return path.join(
    root,
    'artifacts',
    require('../package.json').name + '-' + require('../package.json').version + '.tgz'
  );
}
/** Install the exact candidate; an explicit missing candidate never triggers packing. */
function withPackedPackage(callback, tarball = suppliedTarball()) {
  const archive = candidate(tarball);
  const sha256 = digest(archive);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'go-numbers-consumer-'));
  try {
    fs.writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify({ name: 'go-numbers-consumer', private: true })
    );
    npm(
      ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', archive],
      directory
    );
    assertDigest();
    const installed = path.join(directory, 'node_modules/go-numbers');
    const files = [];
    function collect(relative = '') {
      for (const entry of fs.readdirSync(path.join(installed, relative), { withFileTypes: true })) {
        const name = relative ? relative + '/' + entry.name : entry.name;
        if (entry.isDirectory()) collect(name);
        else files.push({ path: name });
      }
    }
    collect();
    console.log('Candidate SHA-256: ' + sha256);
    const result = callback({ directory, manifest: { files }, tarball: archive, sha256 });
    assertDigest();
    return result;
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
  function assertDigest() {
    if (digest(archive) !== sha256) throw new Error('Supplied tarball changed during verification: ' + archive);
  }
}
module.exports = { withPackedPackage, runNode, run, npm, suppliedTarball, checkTarball, candidate, digest };
