'use strict';
const { spawnSync } = require('node:child_process');
const { candidate } = require('./package-consumer');
process.env.GO_NUMBERS_TARBALL = candidate();
const result = spawnSync(process.execPath, ['--test', require.resolve('../test/package.test.js')], {
  stdio: 'inherit'
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
