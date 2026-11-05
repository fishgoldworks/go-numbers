'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { chromium, firefox, webkit } = require('playwright');
const contract = require('./browser-contract.cjs');
const directory = process.env.GO_BROWSER_PACKAGE || path.resolve(__dirname, '../package');
const filenames = ['go-numbers.js', 'go-numbers.min.js'];
let server;
let address;
before(async () => {
  const metadata = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  const example = require('./browser-example.cjs').browserExample(
    fs.readFileSync(path.join(directory, 'README.md'), 'utf8'),
    metadata
  );
  const scripts = new Map(
    filenames.map((name) => ['/dist/' + name, fs.readFileSync(path.join(directory, 'dist', name))])
  );
  server = http.createServer((request, response) => {
    if (scripts.has(request.url)) {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(scripts.get(request.url));
    } else if (request.url === '/' || request.url.startsWith('/example/')) {
      response.setHeader('Content-Type', 'text/html');
      response.end(
        '<!doctype html><html><head><base href="/"></head><body>' +
          (request.url.startsWith('/example/')
            ? example.replace('./dist/go-numbers.min.js', './dist/' + request.url.split('/').pop())
            : '') +
          '</body></html>'
      );
    } else {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  address = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});
async function isolate(page, errors) {
  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).origin === address) await route.continue();
    else {
      errors.push('External request blocked: ' + route.request().url());
      await route.abort();
    }
  });
}
for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  test(name + ': standalone bundles and documented script-tag example', async (t) => {
    const browser = await engine.launch();
    t.diagnostic(name + ' ' + browser.version());
    try {
      for (const filename of filenames)
        for (const missingBigInt of [false, true])
          await t.test(filename + (missingBigInt ? ': without BigInt global' : ''), async () => {
            const page = await browser.newPage();
            try {
              const errors = [];
              page.on('pageerror', (error) => errors.push(error.message));
              await isolate(page, errors);
              if (missingBigInt)
                await page.addInitScript(() => {
                  globalThis.BigInt = undefined;
                });
              await page.goto(address);
              await page.evaluate(() => {
                globalThis.module = null;
              });
              await page.addScriptTag({ url: address + '/dist/' + filename });
              assert.equal(await page.evaluate('(' + contract.toString() + ')(goNumbers, document)'), true);
              assert.deepEqual(errors, []);
            } finally {
              await page.close();
            }
          });
      for (const filename of filenames)
        await t.test('README example: ' + filename, async () => {
          const page = await browser.newPage();
          try {
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            await isolate(page, errors);
            await page.goto(address + '/example/' + filename);
            assert.deepEqual(errors, []);
            assert.deepEqual(await page.evaluate('result'), contract.example);
          } finally {
            await page.close();
          }
        });
    } finally {
      await browser.close();
    }
  });
}
