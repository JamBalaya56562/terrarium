#!/usr/bin/env bun
// Basic U1 acceptance against real staged Wasm, using the existing element API.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(root, 'packages/terrarium/package.json'));
const { chromium } = require('@playwright/test');
const siteRoot = resolve(root, '.site');

async function bounded(operation, label) {
  let timer;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out`)),
          180_000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function freePort() {
  const reservation = createServer();
  await new Promise((ready, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', ready);
  });
  const port = reservation.address().port;
  await new Promise((done) => reservation.close(done));
  return port;
}

async function waitForHost(url, child) {
  const limit = Date.now() + 30_000;
  while (Date.now() < limit) {
    if (child.exitCode !== null)
      throw new Error(`static host exited ${child.exitCode}`);
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return;
    } catch {
      // The server may still be starting; a bounded retry follows.
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error('static host did not become ready');
}

async function createTerminal(page, site, tool, ref) {
  return bounded(
    page.evaluate(
      async ({ site, tool, ref }) => {
        const element = document.createElement('terrarium-terminal');
        element.setAttribute('base', `${site}/web/`);
        element.setAttribute('tool', tool);
        element.setAttribute('ref', ref);
        document.body.replaceChildren(element);
        return await element.ready;
      },
      { site, tool, ref },
    ),
    `${tool} ${ref} startup`,
  );
}

async function command(page, text, code = 0) {
  const result = await bounded(
    page.evaluate(
      (text) => document.querySelector('terrarium-terminal').run(text),
      text,
    ),
    text,
  );
  console.log(JSON.stringify(result));
  assert.equal(result.command, text);
  assert.equal(result.code, code, `${text}: ${result.output}`);
  return result.output;
}

let host;
let browser;
try {
  const manifest = JSON.parse(
    await readFile(resolve(siteRoot, 'web/dist/builds.json'), 'utf8'),
  );
  assert.ok(
    manifest.builds?.pitchfork?.['v2.29.0'],
    'stage the fresh pitchfork v2.29.0 build first',
  );
  assert.ok(
    manifest.builds?.aube?.['v2.6.1'],
    'stage the existing aube v2.6.1 regression build first',
  );
  const port = await freePort();
  const site = `http://127.0.0.1:${port}`;
  host = spawn(
    process.execPath,
    [resolve(root, 'packages/terrarium/e2e/serve.ts'), siteRoot, String(port)],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let hostOutput = '';
  host.stdout.on('data', (data) => {
    hostOutput += data;
  });
  host.stderr.on('data', (data) => {
    hostOutput += data;
  });
  await waitForHost(`${site}/web/tools.json`, host).catch((error) => {
    throw new Error(`${error.message}\n${hostOutput}`, { cause: error });
  });
  browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(180_000);
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  await page.route(`${site}/__pitchfork-runtime-check`, (route) =>
    route.fulfill({
      contentType: 'text/html',
      headers: {
        'cross-origin-opener-policy': 'same-origin',
        'cross-origin-embedder-policy': 'require-corp',
      },
      body: `<!doctype html><title>pitchfork runtime check</title><script type="module" src="${site}/web/terrarium.mjs"></script>`,
    }),
  );
  await page.goto(`${site}/__pitchfork-runtime-check`);
  await page.waitForFunction(() => customElements.get('terrarium-terminal'));
  assert.equal(await page.evaluate(() => crossOriginIsolated), true);
  const ready = await createTerminal(page, site, 'pitchfork', 'v2.29.0');
  assert.equal(ready.tool, 'pitchfork');
  assert.equal(ready.ref, 'v2.29.0');
  assert.equal(
    ready.commit,
    manifest.builds.pitchfork['v2.29.0'].source.commit,
  );

  const recording = await readFile(
    resolve(root, 'fixtures/sessions/pitchfork-basic.txt'),
    'utf8',
  );
  const commands = recording
    .split('\n')
    .filter((line) => line.startsWith('$ '))
    .map((line) => line.slice(2).trim());
  assert.equal(
    commands.length,
    8,
    'the approved fixture contains eight commands',
  );
  const outputs = [];
  for (const text of commands) outputs.push(await command(page, text));
  assert.match(outputs[0], /2\.29\.0/);
  assert.match(outputs[1], /api/);
  assert.match(outputs[1], /worker/);
  assert.match(outputs[4], /\[daemons\.api\]/);
  assert.match(outputs[4], /\[daemons\.db\]/);
  assert.doesNotMatch(outputs[4], /\[daemons\.worker\]/);
  assert.match(outputs[4], /postgres -D data/);
  assert.match(outputs[5], /api/);
  assert.match(outputs[5], /available/);
  assert.match(outputs[7], /5s/);
  assert.match(
    await command(page, 'unknown-command', 127),
    /command not found/,
  );
  assert.match(await command(page, 'cat does-not-exist', 1), /no such file/);

  await createTerminal(page, site, 'pitchfork', 'v2.29.0');
  const reset = await command(page, 'cat pitchfork.toml');
  assert.match(reset, /\[daemons\.api\]/);
  assert.match(reset, /\[daemons\.worker\]/);
  assert.doesNotMatch(reset, /\[daemons\.db\]/);

  await createTerminal(page, site, 'aube', 'v2.6.1');
  await command(page, 'aube install');
  await command(page, 'rm -rf node_modules');
  const frozen = await command(page, 'aube install --frozen-lockfile');
  const listed = await command(page, 'aube list');
  assert.match(frozen, /filedep@0\.0\.0/);
  assert.match(frozen, /linked@0\.0\.0/);
  assert.match(listed, /filedep 0\.0\.0/);
  assert.match(listed, /linked 0\.0\.0/);
  assert.deepEqual(pageErrors, []);
  console.log(
    JSON.stringify({
      verified: true,
      browser: 'chromium',
      pitchforkCommands: 8,
      aubeCommands: 4,
      edges: 3,
    }),
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (host && host.exitCode === null) {
    await new Promise((done) => {
      host.once('exit', done);
      host.kill();
    });
  }
}
