'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { root, consumerFiles, consumerManifest, functionEntries } = require('./package-layout');
const { validate } = require('./test-artifacts');
function replaceDirectory(staged, destination, io = fs) {
  const previous = staged + '-previous';
  let hadPrevious = false;
  try {
    io.renameSync(destination, previous);
    hadPrevious = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  try {
    io.renameSync(staged, destination);
  } catch (error) {
    if (hadPrevious) {
      try {
        io.renameSync(previous, destination);
      } catch (restoreError) {
        throw new AggregateError(
          [error, restoreError],
          'Build replacement and rollback failed; previous package retained at ' + previous,
          { cause: restoreError }
        );
      }
    }
    throw error;
  }
  if (hadPrevious) {
    try {
      io.rmSync(previous, { recursive: true, force: true });
    } catch (error) {
      return { error, previous };
    }
  }
}
async function build(directory = root) {
  const staged = fs.mkdtempSync(path.join(directory, '.go-numbers-build-'));
  let failure;
  let failed = false;
  try {
    require('./docs').generate(directory);
    const metadata = consumerManifest(directory);
    for (const file of consumerFiles) {
      fs.mkdirSync(path.dirname(path.join(staged, file)), { recursive: true });
      fs.copyFileSync(path.join(directory, file), path.join(staged, file));
    }
    fs.cpSync(path.join(directory, 'src'), path.join(staged, 'src'), {
      recursive: true,
      filter: (source) =>
        fs.lstatSync(source).isDirectory()
          ? !['temp', '.tmp'].includes(path.basename(source))
          : /\.(js|d\.ts)$/.test(source)
    });
    for (const [file, content] of functionEntries(directory)) {
      fs.mkdirSync(path.dirname(path.join(staged, file)), { recursive: true });
      fs.writeFileSync(path.join(staged, file), content);
    }
    fs.writeFileSync(path.join(staged, 'package.json'), JSON.stringify(metadata, null, 2) + '\n');
    for (const [file, content] of require('./build-browser.cjs').generateBrowserBundles(directory)) {
      fs.mkdirSync(path.dirname(path.join(staged, file)), { recursive: true });
      fs.writeFileSync(path.join(staged, file), content);
    }
    await validate(staged, directory);
    const cleanup = replaceDirectory(staged, path.join(directory, 'package'));
    if (cleanup)
      console.warn(
        'Built package replaced successfully but the previous package backup could not be removed at ' +
          cleanup.previous +
          ': ' +
          String(cleanup.error)
      );
  } catch (error) {
    failed = true;
    failure = error;
  }
  try {
    fs.rmSync(staged, { recursive: true, force: true });
  } catch (cleanupError) {
    if (failed)
      throw new AggregateError([failure, cleanupError], String(failure) + '; staged cleanup also failed', {
        cause: cleanupError
      });
    throw cleanupError;
  }
  if (failed) throw failure;
  return path.join(directory, 'package');
}
if (require.main === module)
  build()
    .then((directory) => console.log('Built ' + directory))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
module.exports = { build, replaceDirectory };
