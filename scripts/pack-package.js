'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { build } = require('./build');
const { npm, digest } = require('./package-consumer');
const { root } = require('./package-layout');
async function pack() {
  const directory = await build();
  const destination = path.join(root, 'artifacts');
  fs.mkdirSync(destination, { recursive: true });
  const [manifest] = JSON.parse(
    npm(['pack', '--ignore-scripts', '--json', '--pack-destination', destination], directory)
  );
  const tarball = path.join(destination, manifest.filename);
  const record = { tarball: path.basename(tarball), sha256: digest(tarball) };
  fs.writeFileSync(tarball + '.json', JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify(record));
  return tarball;
}
if (require.main === module)
  pack().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { pack };
