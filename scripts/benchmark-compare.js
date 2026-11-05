'use strict';

// Compare the same workloads in separate processes. The runner alternates
// baseline/candidate order, consumes every result, retains all measured samples,
// and reports medians, not whichever single sample happens to look best.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const os = require('node:os');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const argv = process.argv.slice(2);
function argument(name, fallback) {
  const i = argv.indexOf(name);
  return i < 0 ? fallback : argv[i + 1];
}
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function resultToken(value) {
  if (value === undefined) return 'u';
  if (value === null) return 'l';
  if (typeof value === 'boolean') return value ? 'b:1' : 'b:0';
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'n:NaN';
    if (Object.is(value, -0)) return 'n:-0';
    return `n:${String(value)}`;
  }
  if (typeof value === 'string') return `s:${value.length}:${value}`;
  throw new TypeError(`Benchmark callbacks must return number-like primitive values; received ${typeof value}.`);
}

if (argv[0] === '--verify-worker') {
  const root = path.resolve(argv[1]);
  const n = require(root);
  const cases = require('../benchmarks/comparison-cases')(n);
  const results = [];
  for (const [name, iterations, callback] of cases) {
    const digest = createHash('sha256');
    for (let i = 0; i < iterations; i++) digest.update(resultToken(callback(i)) + '\0');
    results.push({ name, iterations, resultDigest: digest.digest('hex') });
  }
  console.log(JSON.stringify({ version: require(path.join(root, 'package.json')).version, results }));
} else if (argv[0] === '--worker') {
  const root = path.resolve(argv[1]);
  const n = require(root);
  const cases = require('../benchmarks/comparison-cases')(n);
  let sink = 0;
  function consume(value) {
    sink = (Math.imul(sink, 31) + (value | 0)) | 0;
  }
  const results = [];
  for (const [name, iterations, callback] of cases) {
    for (let i = 0; i < Math.min(15000, iterations); i++) consume(callback(i));
    const samples = [];
    for (let sample = 0; sample < 3; sample++) {
      const start = performance.now();
      for (let i = 0; i < iterations; i++) consume(callback(i));
      samples.push(((performance.now() - start) * 1e6) / iterations);
    }
    results.push({ name, iterations, samples, ns: median(samples) });
  }
  console.log(JSON.stringify({ version: require(path.join(root, 'package.json')).version, results, sink }));
} else {
  const baseline = argument('--baseline');
  if (!baseline)
    throw new Error(
      'Usage: node scripts/benchmark-compare.js --baseline <original-directory> [--candidate <directory>] [--rounds 7] [--output results.json]'
    );
  const candidate = argument('--candidate', path.resolve(__dirname, '..'));
  const rounds = Number(argument('--rounds', '7'));
  assert.ok(Number.isInteger(rounds) && rounds > 0);
  function runWorker(mode, location) {
    const p = spawnSync(process.execPath, [__filename, mode, path.resolve(location)], {
      encoding: 'utf8',
      timeout: 120000,
      maxBuffer: 8 * 1024 * 1024
    });
    assert.ifError(p.error);
    assert.equal(p.status, 0, p.stderr);
    return JSON.parse(p.stdout);
  }
  const verification = {
    baseline: runWorker('--verify-worker', baseline),
    candidate: runWorker('--verify-worker', candidate)
  };
  assert.equal(
    verification.baseline.results.length,
    verification.candidate.results.length,
    'Benchmark case count must agree'
  );
  for (let index = 0; index < verification.baseline.results.length; index++) {
    const before = verification.baseline.results[index];
    const after = verification.candidate.results[index];
    assert.equal(after.name, before.name, 'Benchmark case names must agree');
    assert.equal(after.iterations, before.iterations, `Iteration count must agree for ${before.name}`);
    assert.equal(after.resultDigest, before.resultDigest, `Observable results must agree for ${before.name}`);
  }
  const trials = [];
  for (let i = 0; i < rounds; i++) {
    const trial = {};
    for (const [label, location] of i % 2
      ? [
          ['candidate', candidate],
          ['baseline', baseline]
        ]
      : [
          ['baseline', baseline],
          ['candidate', candidate]
        ]) {
      trial[label] = runWorker('--worker', location);
    }
    assert.equal(trial.baseline.sink, trial.candidate.sink, 'The timed-loop sink must agree');
    trials.push(trial);
    process.stderr.write(`Finished paired trial ${i + 1}/${rounds}\n`);
  }
  const rows = trials[0].baseline.results.map((item, index) => {
    const before = trials.map((t) => t.baseline.results[index].ns);
    const after = trials.map((t) => t.candidate.results[index].ns);
    const b = median(before),
      a = median(after);
    return {
      name: item.name,
      beforeNs: b,
      afterNs: a,
      speedup: b / a,
      beforeRange: [Math.min(...before), Math.max(...before)],
      afterRange: [Math.min(...after), Math.max(...after)],
      beforeMad: median(before.map((v) => Math.abs(v - b))),
      afterMad: median(after.map((v) => Math.abs(v - a)))
    };
  });
  const report = {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpu: os.cpus()[0].model,
    rounds,
    date: new Date().toISOString(),
    methodology:
      'One exact-result SHA-256 preflight per package across every case iteration, then alternating fresh timing processes with up to 15000 warm-up calls and three timed samples per case. Median of per-process medians; raw samples and median absolute deviations retained. Timings include only the timed-loop harness overhead, not result verification. No performance thresholds in unit tests.',
    verification,
    rows,
    trials
  };
  const output = argument('--output');
  if (output) fs.writeFileSync(path.resolve(output), JSON.stringify(report, null, 2) + '\n');
  console.log('Workload'.padEnd(47), 'Before ns'.padStart(10), 'After ns'.padStart(10), 'Speedup'.padStart(9));
  for (const r of rows)
    console.log(
      r.name.padEnd(47),
      r.beforeNs.toFixed(1).padStart(10),
      r.afterNs.toFixed(1).padStart(10),
      `${r.speedup.toFixed(2)}x`.padStart(9)
    );
}
