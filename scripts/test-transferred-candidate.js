'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { npm, checkTarball, digest } = require('./package-consumer');
const { root } = require('./package-layout');
const metadata = require('../package.json');
const archive = path.join(root, 'artifacts', metadata.name + '-' + metadata.version + '.tgz');
if (!fs.existsSync(archive + '.json')) throw new Error('Transferred candidate is missing its digest record');
process.env.GO_NUMBERS_TARBALL = checkTarball(archive);
const sha256 = digest(archive);
for (const command of ['test:package', 'test:types', 'test:runtime', 'test:tree-shaking']) {
  process.stdout.write(npm(['run', command], root));
  if (digest(archive) !== sha256) throw new Error('Transferred candidate changed during checks');
}
console.log('Verified transferred candidate SHA-256: ' + sha256);
