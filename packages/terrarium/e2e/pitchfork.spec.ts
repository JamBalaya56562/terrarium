import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { HOST, SITE } from '../playwright.config.ts';

const commands = readFileSync(
  resolve('../../fixtures/sessions/pitchfork-basic.txt'),
  'utf8',
)
  .split('\n')
  .filter((line) => line.startsWith('$ '))
  .map((line) => line.slice(2).trim());

function checkOutputs(outputs: string[]) {
  expect(commands).toHaveLength(8);
  expect(outputs[0]).toContain('2.29.0');
  expect(outputs[1]).toContain('api');
  expect(outputs[1]).toContain('worker');
  expect(outputs[4]).toContain('[daemons.api]');
  expect(outputs[4]).toContain('[daemons.db]');
  expect(outputs[4]).not.toContain('[daemons.worker]');
  expect(outputs[4]).toContain('postgres -D data');
  expect(outputs[5]).toContain('api');
  expect(outputs[5]).toContain('available');
  expect(outputs[7]?.trim()).toBe('5s');
}

async function ready(page: Page) {
  await page.waitForFunction(() =>
    document.querySelector('terrarium-terminal'),
  );
  return page.evaluate(
    () => document.querySelector('terrarium-terminal')?.ready,
  );
}

async function runSession(page: Page) {
  const outputs: string[] = [];
  for (const command of commands) {
    const result = await page.evaluate(
      (command) => document.querySelector('terrarium-terminal')?.run(command),
      command,
    );
    expect(result).toMatchObject({ command, code: 0 });
    outputs.push(result?.output ?? '');
  }
  checkOutputs(outputs);
  return outputs;
}

test('public page selects pitchfork and preserves the complete session', async ({
  page,
}) => {
  await page.goto(`${SITE}/web/?tool=pitchfork`);
  expect(await ready(page)).toMatchObject({
    tool: 'pitchfork',
    ref: 'v2.29.0',
  });
  await expect(page.locator('#tool')).toHaveValue('pitchfork');
  await expect(page.locator('#build')).toHaveValue('v2.29.0');
  await runSession(page);
});

test('tool switch clears pitchfork ref, fixture, cwd and queued commands', async ({
  page,
}) => {
  await page.goto(
    `${SITE}/web/?tool=pitchfork&ref=v2.29.0&fixture=pitchfork-basic&cwd=/work/app&run=pitchfork%20--version`,
  );
  await ready(page);
  await runSession(page);
  await page.locator('#tool').selectOption('aube');
  await page.waitForURL((url) => url.searchParams.get('tool') === 'aube');
  const params = new URL(page.url()).searchParams;
  for (const key of ['ref', 'fixture', 'cwd', 'run'])
    expect(params.has(key)).toBe(false);
  expect(await ready(page)).toMatchObject({ tool: 'aube' });
  const config = await page.evaluate(() =>
    document.querySelector('terrarium-terminal')?.run('cat pitchfork.toml'),
  );
  expect(config).toMatchObject({ code: 1 });
  const version = await page.evaluate(() =>
    document.querySelector('terrarium-terminal')?.run('aube --version'),
  );
  expect(version).toMatchObject({ code: 0 });
  expect(version?.output).toContain('2.6.1');
});

test('unknown tool and pitchfork ref fail without falling back', async ({
  page,
}) => {
  await page.goto(`${SITE}/web/?tool=unknown`);
  await expect(page.locator('#status')).toContainText('unknown tool "unknown"');
  await page.goto(`${SITE}/web/?tool=pitchfork&ref=nope`);
  await expect(page.locator('#status')).toContainText(
    'no build "nope" of pitchfork',
  );
});

test('cross-origin element returns all exit events and resets a new fixture', async ({
  page,
}) => {
  await page.goto(`${HOST}/pitchfork-element.html`);
  await ready(page);
  const outputs = await runSession(page);
  const exits = await page.evaluate(() =>
    events.filter((event) => event.type === 'terrarium-exit'),
  );
  expect(exits).toEqual(
    commands.map((command, index) => ({
      type: 'terrarium-exit',
      command,
      code: 0,
      output: outputs[index],
    })),
  );
  await page.evaluate(() => {
    const fresh = document.createElement('terrarium-terminal');
    fresh.setAttribute('base', 'http://localhost:8780/web/');
    fresh.setAttribute('tool', 'pitchfork');
    fresh.setAttribute('ref', 'v2.29.0');
    document.body.replaceChildren(fresh);
  });
  await ready(page);
  const result = await page.evaluate(() =>
    document.querySelector('terrarium-terminal')?.run('cat pitchfork.toml'),
  );
  expect(result?.output).toContain('[daemons.worker]');
  expect(result?.output).not.toContain('[daemons.db]');
});

test('element reports the existing isolation error', async ({ page }) => {
  await page.goto(`${HOST}/plain/pitchfork-element.html`);
  await expect
    .poll(() => page.evaluate(() => events))
    .toEqual([
      {
        type: 'terrarium-error',
        message: expect.stringContaining('not cross-origin isolated'),
      },
    ]);
});

test('same-origin iframe works across browsers and rejects wrong source/origin', async ({
  page,
}) => {
  await page.goto(`${SITE}/pitchfork-iframe.html`);
  await expect
    .poll(() => page.evaluate(() => messages.map((message) => message.type)))
    .toContain('terrarium:ready');
  const frame = page
    .frames()
    .find((frame) => frame.url().includes('/web/?embed'));
  expect(frame).toBeDefined();
  await frame?.evaluate(() => {
    for (const [source, origin] of [
      [window, location.origin],
      [window.parent, 'https://invalid.example'],
    ]) {
      dispatchEvent(
        new MessageEvent('message', {
          source: source as Window,
          origin: origin as string,
          data: {
            type: 'terrarium:run',
            command: 'pitchfork daemons remove api',
          },
        }),
      );
    }
  });
  const outputs: string[] = [];
  for (const [index, command] of commands.entries()) {
    await page.evaluate((command) => runInFrame(command), command);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            messages.filter((message) => message.type === 'terrarium:exit')
              .length,
        ),
      )
      .toBe(index + 1);
    const result = await page.evaluate(
      (index) =>
        messages.filter((message) => message.type === 'terrarium:exit')[index],
      index,
    );
    expect(result).toMatchObject({ origin: SITE, command, code: 0 });
    outputs.push(String(result?.output));
  }
  checkOutputs(outputs);
});
