'use strict';

const { performance } = require('node:perf_hooks');
const numbers = require('..');
let sink = 0;

function median(values) {
  return values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
}
function measure(label, iterations, callback) {
  for (let i = 0; i < Math.min(iterations, 10000); i++) sink += Number(callback(i)) || 0;
  const samples = [];
  for (let sample = 0; sample < 7; sample++) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) sink += Number(callback(i)) || 0;
    samples.push(performance.now() - start);
  }
  const ms = median(samples);
  console.log(
    `${label.padEnd(38)} ${ms.toFixed(3).padStart(10)} ms  ${((ms * 1e6) / iterations).toFixed(1).padStart(10)} ns/op`
  );
}

console.log(
  `go-numbers ${require('../package.json').version} — ${process.version} (${process.platform}/${process.arch})`
);
console.log('Median of 7 warmed samples; comparative diagnostics, not cross-machine guarantees.');
require('../benchmarks/cases')(numbers, measure);
console.log(`Checksum: ${sink}`);
