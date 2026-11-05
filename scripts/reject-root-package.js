'use strict';
console.error(
  'The development root is private. Run npm run pack:package, then verify the generated tarball with npm run verify:all -- --tarball <path>.'
);
process.exitCode = 1;
