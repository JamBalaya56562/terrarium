import { expect, type Frame, type Page, test } from '@playwright/test';
import { HOST, SITE } from '../playwright.formicarium.config.ts';
import type { TerrariumTerminal } from '../src/terminal.ts';

declare global {
  var u3Messages: Record<string, unknown>[];
  var u3MessageSeen: Promise<void>;
}
const markerCommand = 'aube init --bare';
function child(page: Page): Frame {
  const frame = page.frames().find((frame) => frame !== page.mainFrame());
  if (!frame) throw new Error('iframe missing');
  return frame;
}
const marker = (frame: Frame) =>
  frame.evaluate(async () => {
    const terminal = document.querySelector(
      'terrarium-terminal',
    ) as TerrariumTerminal | null;
    if (!terminal)
      return { session: 'absent', marker: 'absent-no-session', output: '' };
    await terminal.ready;
    const result = await terminal.run('cat /work/package.json');
    return {
      session: 'created',
      marker: result.code === 0 ? 'present' : 'absent',
      output: result.output,
    };
  });
async function send(page: Page, command: string) {
  const frame = child(page);
  await frame.evaluate((command) => {
    u3MessageSeen = new Promise<void>((resolve) => {
      const receive = (event: MessageEvent) => {
        if (event.source === parent && event.data?.command === command) {
          removeEventListener('message', receive);
          resolve();
        }
      };
      addEventListener('message', receive);
    });
  }, command);
  await page.evaluate((command) => {
    const frame = document.querySelector('iframe') as HTMLIFrameElement;
    frame.contentWindow?.postMessage(
      { type: 'terrarium:run', command },
      new URL(frame.src).origin,
    );
  }, command);
  await frame.evaluate(() => u3MessageSeen);
}

for (const condition of [
  'same-origin',
  'cross-origin',
  'missing-isolation',
] as const) {
  test(`iframe condition ${condition}: exact origins and guest marker oracle`, async ({
    page,
    browserName,
  }) => {
    const parent = condition === 'cross-origin' ? HOST : SITE;
    const query = new URLSearchParams({
      source: SITE,
      ...(condition === 'missing-isolation' ? { plain: '1' } : {}),
    });
    const workers: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('runtime/web/package-worker.mjs'))
        workers.push(request.url());
    });
    const parentPath =
      condition === 'missing-isolation' ? '/plain/iframe.html' : '/iframe.html';
    await page.goto(`${parent}${parentPath}?${query}`);
    const frame = child(page);
    if (condition === 'missing-isolation') {
      expect(await page.evaluate(() => crossOriginIsolated)).toBe(false);
      expect(await frame.evaluate(() => crossOriginIsolated)).toBe(false);
    }
    const unsupported =
      condition === 'cross-origin' && browserName !== 'chromium';
    const accepted = condition !== 'missing-isolation' && !unsupported;
    await expect
      .poll(() =>
        page.evaluate(() => u3Messages.map((message) => message.type)),
      )
      .toContain(accepted ? 'terrarium:ready' : 'terrarium:error');
    const before = await marker(frame);
    expect(before.marker).not.toBe('present');
    if (!accepted) {
      expect(before.session).toBe('absent');
      await send(page, markerCommand);
      // A sentinel acknowledgement makes the negative observation bounded,
      // without treating a timer or a notification alone as non-execution proof.
      await frame.evaluate(() => Promise.resolve());
      expect(await marker(frame)).toEqual(before);
      expect(workers).toEqual([]);
      const messages = await page.evaluate(() => u3Messages);
      expect(messages).toHaveLength(1);
      expect(String(messages[0]?.message)).toContain(
        unsupported ? 'unsupported' : 'not cross-origin isolated',
      );
      return;
    }
    expect(before.marker).toBe('absent');
    await frame.evaluate((command) => {
      for (const data of [
        { type: 'unknown', command },
        { type: 'terrarium:run', command: 1 },
      ]) {
        dispatchEvent(
          new MessageEvent('message', {
            source: window.parent,
            origin: new URL(document.referrer).origin,
            data,
          }),
        );
      }
      dispatchEvent(
        new MessageEvent('message', {
          source: window.parent,
          origin: 'https://unauthorized.invalid',
          data: { type: 'terrarium:run', command },
        }),
      );
      // Real self-source is different from the parent, even with its origin.
      window.postMessage({ type: 'terrarium:run', command }, location.origin);
    }, markerCommand);
    expect((await marker(frame)).marker).toBe('absent');
    await send(page, markerCommand);
    await expect
      .poll(() =>
        page.evaluate(() =>
          u3Messages.find(
            (message) =>
              message.type === 'terrarium:exit' &&
              message.command === 'aube init --bare',
          ),
        ),
      )
      .toMatchObject({ origin: SITE, code: 0 });
    const after = await marker(frame);
    expect(after.marker).toBe('present');
    expect(after.output).toContain('"name"');
    expect(workers.length).toBeGreaterThan(0);
  });
}

test('invalid opaque wildcard and unknown parent origins never connect or notify', async ({
  page,
}) => {
  for (const origin of [
    'null',
    '*',
    'invalid-origin',
    'https://host.invalid/path',
    'data:text/plain,opaque',
  ]) {
    const workers: string[] = [];
    const observe = (request: { url(): string }) => {
      if (request.url().includes('runtime/web/package-worker.mjs'))
        workers.push(request.url());
    };
    page.on('request', observe);
    await page.goto(
      `${SITE}/iframe.html?${new URLSearchParams({ origin, run: markerCommand })}`,
    );
    const frame = child(page);
    await expect(frame.locator('#status')).toContainText(
      'origin is unknown or invalid',
    );
    await send(page, markerCommand);
    expect(await marker(frame)).toMatchObject({
      session: 'absent',
      marker: 'absent-no-session',
    });
    expect(await page.evaluate(() => u3Messages)).toEqual([]);
    expect(workers).toEqual([]);
    page.off('request', observe);
  }
});

test('unapproved parent origin cannot run or receive notifications even when syntax is valid', async ({
  page,
  browserName,
}) => {
  await page.goto(
    `${SITE}/iframe.html?${new URLSearchParams({ origin: HOST })}`,
  );
  const frame = child(page);
  if (browserName === 'chromium') {
    await frame.locator('terrarium-terminal').waitFor();
    await frame.evaluate(
      () =>
        (document.querySelector('terrarium-terminal') as TerrariumTerminal)
          .ready,
    );
  } else {
    await expect(frame.locator('#status')).toContainText('unsupported');
  }
  expect((await marker(frame)).marker).not.toBe('present');
  await send(page, markerCommand);
  expect((await marker(frame)).marker).not.toBe('present');
  expect(await page.evaluate(() => u3Messages)).toEqual([]);
});
