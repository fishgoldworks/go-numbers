'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');
// Windows installations commonly expose python.exe, while Unix uses python3.
// PYTHON is a single executable path, including paths with spaces, never a shell command.
const executable = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const result = spawnSync(executable, ['-B', ...process.argv.slice(2)], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: { ...process.env, NODE: process.execPath }
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
