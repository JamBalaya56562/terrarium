import { expect, type Page, test } from '@playwright/test';
import { SITE } from '../playwright.formicarium.config.ts';
import type { TerrariumTerminal } from '../src/terminal.ts';

declare global {
  var u3Events: {
    type: string;
    detail: Record<string, unknown>;
    bubbles: boolean;
    composed: boolean;
  }[];
  var u3Pending: Promise<unknown>;
}
async function open(page: Page, query = '') {
  await page.goto(`${SITE}/element.html${query}`);
  await page.locator('terrarium-terminal').waitFor();
  return page.evaluate(
    () =>
      (document.querySelector('terrarium-terminal') as TerrariumTerminal).ready,
  );
}
const run = (page: Page, command: string) =>
  page.evaluate(
    (command) =>
      (document.querySelector('terrarium-terminal') as TerrariumTerminal).run(
        command,
      ),
    command,
  );
const transcript = (page: Page) =>
  page.evaluate(
    () =>
      (document.querySelector('terrarium-terminal') as TerrariumTerminal)
        .transcript,
  );

test('latest aube ready fields, events and actual Worker version', async ({
  page,
}) => {
  const ready = await open(page);
  expect(ready).toMatchObject({
    tool: 'aube',
    ref: 'v2.7.0',
    commit: 'd36fec01764689ef6d99a5e43de98925b571d67f',
  });
  expect(ready.seconds).toBeGreaterThanOrEqual(0);
  const result = await run(page, 'aube --version');
  expect(result).toMatchObject({
    command: 'aube --version',
    code: 0,
    output: '2.7.0 linux-x64 (2026-10-07)\n',
  });
  expect(await transcript(page)).toBe(result.output);
  const events = await page.evaluate(() => u3Events);
  expect(events.map((event) => event.type)).toEqual([
    'terrarium-ready',
    'terrarium-exit',
  ]);
  expect(events.every((event) => event.bubbles && event.composed)).toBe(true);
  expect(events[1]?.detail).toEqual(result);
});
test('latest pitchfork uses common runtime actual Worker version', async ({
  page,
}) => {
  test.setTimeout(600_000);
  expect(await open(page, '?tool=pitchfork')).toMatchObject({
    tool: 'pitchfork',
    ref: 'v2.30.1',
  });
  expect(await run(page, 'pitchfork --version')).toMatchObject({
    code: 0,
    output: 'pitchfork 2.30.1\n',
  });
});
test('nested cwd keeps /work sibling before and after actual guest', async ({
  page,
}) => {
  await open(page, '?cwd=%2Fwork%2Fapp');
  const before = await run(page, 'cat ../outside/linked/package.json');
  expect(before.output).toContain('"linked"');
  await run(page, 'aube --version');
  expect((await run(page, 'cat ../outside/linked/package.json')).output).toBe(
    before.output,
  );
  expect((await run(page, 'pwd')).output).toBe('/work/app\n');
});
test('empty fixture and empty command have no added exit event', async ({
  page,
}) => {
  await open(page, '?fixture=');
  expect((await run(page, 'pwd')).output).toBe('/work\n');
  expect((await run(page, 'ls')).output).toBe('');
  const count = await page.evaluate(() => u3Events.length);
  expect(await run(page, '   ')).toEqual({
    command: '   ',
    code: 0,
    output: '',
  });
  expect(await page.evaluate(() => u3Events.length)).toBe(count);
});
test('normal nonzero exit and unsupported syntax error once; queue recovers', async ({
  page,
}) => {
  await open(page);
  expect((await run(page, 'cat missing')).code).toBe(1);
  expect((await run(page, 'unknown')).code).toBe(127);
  const failure = await page.evaluate(async () => {
    try {
      await (
        document.querySelector('terrarium-terminal') as TerrariumTerminal
      ).run('aube | cat');
      return '';
    } catch (error) {
      return String(error);
    }
  });
  expect(failure).toContain('shell syntax is unsupported');
  expect((await run(page, 'pwd')).code).toBe(0);
  expect(
    await page.evaluate(() => u3Events.map((event) => event.type)),
  ).toEqual([
    'terrarium-ready',
    'terrarium-exit',
    'terrarium-exit',
    'terrarium-error',
    'terrarium-exit',
  ]);
});
test('run attributes and concurrent calls retain serial command order', async ({
  page,
}) => {
  await open(page, '?fixture=&run=pwd&run=ls');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          u3Events.filter((event) => event.type === 'terrarium-exit').length,
      ),
    )
    .toBe(2);
  await page.evaluate(async () => {
    const terminal = document.querySelector(
      'terrarium-terminal',
    ) as TerrariumTerminal;
    await Promise.all([
      terminal.run('pwd'),
      terminal.run('unknown'),
      terminal.run('pwd'),
    ]);
  });
  expect(
    await page.evaluate(() =>
      u3Events
        .filter((event) => event.type === 'terrarium-exit')
        .map((event) => event.detail.command),
    ),
  ).toEqual(['pwd', 'ls', 'pwd', 'unknown', 'pwd']);
});
test('keyboard focus deletion arrows history and Ctrl-C preserve terminal controls', async ({
  page,
}) => {
  await open(page, '?fixture=');
  await page.evaluate(() =>
    (document.querySelector('terrarium-terminal') as TerrariumTerminal).focus(),
  );
  const input = page.locator('terrarium-terminal .xterm-helper-textarea');
  await expect(input).toBeFocused();
  await page.keyboard.type('pwdx');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Enter');
  await expect.poll(() => transcript(page)).toBe('/work\n');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect.poll(() => transcript(page)).toBe('/work\n/work\n');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.type('discard');
  await page.keyboard.press('Control+c');
  await page.keyboard.type('pwd');
  await page.keyboard.press('Enter');
  await expect.poll(() => transcript(page)).toBe('/work\n/work\n/work\n');
});
test('tool switch resets attributes and suppresses prior queued run notifications', async ({
  page,
}) => {
  await open(page, '?fixture=&cwd=/work&run=pwd');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          u3Events.filter((event) => event.type === 'terrarium-exit').length,
      ),
    )
    .toBe(1);
  await page.evaluate(() => {
    const terminal = document.querySelector(
      'terrarium-terminal',
    ) as TerrariumTerminal;
    u3Pending = terminal.run('aube --version').catch(() => {});
    terminal.setAttribute('tool', 'pitchfork');
  });
  const ready = await page.evaluate(
    () =>
      (document.querySelector('terrarium-terminal') as TerrariumTerminal).ready,
  );
  expect(ready).toMatchObject({ tool: 'pitchfork', ref: 'v2.30.1' });
  expect(
    await page.evaluate(() =>
      ['ref', 'fixture', 'cwd', 'run'].map((name) =>
        document.querySelector('terrarium-terminal')?.hasAttribute(name),
      ),
    ),
  ).toEqual([false, false, false, false]);
  await page.evaluate(() => u3Pending);
  expect(
    await page.evaluate(() =>
      u3Events
        .filter((event) => event.type === 'terrarium-exit')
        .map((event) => event.detail.command),
    ),
  ).toEqual(['pwd']);
  expect((await run(page, 'pwd')).output).toBe('/work/app\n');
});
test('disconnect invalidates old work and reconnect creates independent session', async ({
  page,
}) => {
  await open(page);
  const events = await page.evaluate(async () => {
    const terminal = document.querySelector(
      'terrarium-terminal',
    ) as TerrariumTerminal;
    const pending = terminal.run('aube --version').catch(() => {});
    terminal.remove();
    await pending;
    const previous = u3Events.length;
    document.body.append(terminal);
    await terminal.ready;
    return {
      previous,
      types: u3Events.slice(previous).map((event) => event.type),
      output: terminal.transcript,
    };
  });
  expect(events.previous).toBe(1);
  expect(events.types).toEqual(['terrarium-ready']);
  expect(events.output).toBe('');
});
test('boot error rejects ready once without creating any guest Worker', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('package-worker.mjs'))
      requests.push(request.url());
  });
  await page.goto(`${SITE}/element.html?ref=not-published`);
  await page.locator('terrarium-terminal').waitFor();
  const result = await page.evaluate(async () => {
    try {
      await (document.querySelector('terrarium-terminal') as TerrariumTerminal)
        .ready;
      return '';
    } catch (error) {
      return String(error);
    }
  });
  expect(result).toContain('no build');
  expect(
    await page.evaluate(() => u3Events.map((event) => event.type)),
  ).toEqual(['terrarium-error']);
  expect(requests).toEqual([]);
});
