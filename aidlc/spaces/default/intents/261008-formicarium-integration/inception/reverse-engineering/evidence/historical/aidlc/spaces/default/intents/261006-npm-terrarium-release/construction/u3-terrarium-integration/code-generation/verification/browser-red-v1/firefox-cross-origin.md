# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-iframe.spec.ts >> iframe condition cross-origin: exact origins and guest marker oracle
- Location: e2e/formicarium-iframe.spec.ts:39:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: "terrarium:error"
Received array: []

Call Log:
- Timeout 120000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- iframe [ref=e2]
```

# Test source

```ts
  1   | import { expect, type Frame, type Page, test } from '@playwright/test';
  2   | import type { TerrariumTerminal } from '../src/terminal.ts';
  3   | import { SITE, HOST } from '../playwright.formicarium.config.ts';
  4   | 
  5   | declare global { var u3Messages: Record<string, unknown>[]; var u3MessageSeen: Promise<void> }
  6   | const markerCommand = 'aube init --bare';
  7   | function child(page: Page): Frame {
  8   |   const frame = page.frames().find((frame) => frame !== page.mainFrame());
  9   |   if (!frame) throw new Error('iframe missing');
  10  |   return frame;
  11  | }
  12  | const marker = (frame: Frame) => frame.evaluate(async () => {
  13  |   const terminal = document.querySelector('terrarium-terminal') as TerrariumTerminal | null;
  14  |   if (!terminal) return { session: 'absent', marker: 'absent-no-session', output: '' };
  15  |   await terminal.ready;
  16  |   const result = await terminal.run('cat /work/package.json');
  17  |   return { session: 'created', marker: result.code === 0 ? 'present' : 'absent', output: result.output };
  18  | });
  19  | async function send(page: Page, command: string) {
  20  |   const frame = child(page);
  21  |   await frame.evaluate((command) => {
  22  |     u3MessageSeen = new Promise<void>((resolve) => {
  23  |       const receive = (event: MessageEvent) => {
  24  |         if (event.source === parent && event.data?.command === command) {
  25  |           removeEventListener('message', receive); resolve();
  26  |         }
  27  |       };
  28  |       addEventListener('message', receive);
  29  |     });
  30  |   }, command);
  31  |   await page.evaluate((command) => {
  32  |     const frame = document.querySelector('iframe') as HTMLIFrameElement;
  33  |     frame.contentWindow?.postMessage({ type: 'terrarium:run', command }, new URL(frame.src).origin);
  34  |   }, command);
  35  |   await frame.evaluate(() => u3MessageSeen);
  36  | }
  37  | 
  38  | for (const condition of ['same-origin', 'cross-origin', 'missing-isolation'] as const) {
  39  |   test(`iframe condition ${condition}: exact origins and guest marker oracle`, async ({ page, browserName }) => {
  40  |     const parent = condition === 'cross-origin' ? HOST : SITE;
  41  |     const query = new URLSearchParams({ source: SITE, ...(condition === 'missing-isolation' ? { plain: '1' } : {}) });
  42  |     const workers: string[] = [];
  43  |     page.on('request', (request) => { if (request.url().includes('runtime/web/package-worker.mjs')) workers.push(request.url()); });
  44  |     await page.goto(`${parent}/iframe.html?${query}`);
  45  |     const unsupported = condition === 'cross-origin' && browserName !== 'chromium';
  46  |     const accepted = condition !== 'missing-isolation' && !unsupported;
> 47  |     await expect.poll(() => page.evaluate(() => u3Messages.map((message) => message.type))).toContain(accepted ? 'terrarium:ready' : 'terrarium:error');
      |                                                                                             ^ Error: expect(received).toContain(expected) // indexOf
  48  |     const frame = child(page);
  49  |     const before = await marker(frame);
  50  |     expect(before.marker).not.toBe('present');
  51  |     if (!accepted) {
  52  |       expect(before.session).toBe('absent');
  53  |       await send(page, markerCommand);
  54  |       // A sentinel acknowledgement makes the negative observation bounded,
  55  |       // without treating a timer or a notification alone as non-execution proof.
  56  |       await frame.evaluate(() => Promise.resolve());
  57  |       expect(await marker(frame)).toEqual(before);
  58  |       expect(workers).toEqual([]);
  59  |       const messages = await page.evaluate(() => u3Messages);
  60  |       expect(messages).toHaveLength(1);
  61  |       expect(String(messages[0]?.message)).toContain(unsupported ? 'unsupported' : 'not cross-origin isolated');
  62  |       return;
  63  |     }
  64  |     expect(before.marker).toBe('absent');
  65  |     await frame.evaluate((command) => {
  66  |       for (const data of [{ type: 'unknown', command }, { type: 'terrarium:run', command: 1 }]) {
  67  |         dispatchEvent(new MessageEvent('message', { source: window.parent, origin: new URL(document.referrer).origin, data }));
  68  |       }
  69  |       dispatchEvent(new MessageEvent('message', { source: window.parent, origin: 'https://unauthorized.invalid', data: { type: 'terrarium:run', command } }));
  70  |       // Real self-source is different from the parent, even with its origin.
  71  |       window.postMessage({ type: 'terrarium:run', command }, location.origin);
  72  |     }, markerCommand);
  73  |     expect((await marker(frame)).marker).toBe('absent');
  74  |     await send(page, markerCommand);
  75  |     await expect.poll(() => page.evaluate(() => u3Messages.find((message) => message.type === 'terrarium:exit' && message.command === 'aube init --bare'))).toMatchObject({ origin: SITE, code: 0 });
  76  |     const after = await marker(frame);
  77  |     expect(after.marker).toBe('present'); expect(after.output).toContain('"name"');
  78  |     expect(workers.length).toBeGreaterThan(0);
  79  |   });
  80  | }
  81  | 
  82  | test('invalid opaque wildcard and unknown parent origins never connect or notify', async ({ page }) => {
  83  |   for (const origin of ['null', '*', 'invalid-origin', 'https://host.invalid/path', 'data:text/plain,opaque']) {
  84  |     const workers: string[] = [];
  85  |     const observe = (request: { url(): string }) => { if (request.url().includes('runtime/web/package-worker.mjs')) workers.push(request.url()); };
  86  |     page.on('request', observe);
  87  |     await page.goto(`${SITE}/iframe.html?${new URLSearchParams({ origin, run: markerCommand })}`);
  88  |     const frame = child(page);
  89  |     await expect(frame.locator('#status')).toContainText('origin is unknown or invalid');
  90  |     await send(page, markerCommand);
  91  |     expect(await marker(frame)).toMatchObject({ session: 'absent', marker: 'absent-no-session' });
  92  |     expect(await page.evaluate(() => u3Messages)).toEqual([]); expect(workers).toEqual([]);
  93  |     page.off('request', observe);
  94  |   }
  95  | });
  96  | 
  97  | test('unapproved parent origin cannot run or receive notifications even when syntax is valid', async ({ page, browserName }) => {
  98  |   await page.goto(`${SITE}/iframe.html?${new URLSearchParams({ origin: HOST })}`);
  99  |   const frame = child(page);
  100 |   if (browserName === 'chromium') {
  101 |     await frame.locator('terrarium-terminal').waitFor();
  102 |     await frame.evaluate(() => (document.querySelector('terrarium-terminal') as TerrariumTerminal).ready);
  103 |   } else {
  104 |     await expect(frame.locator('#status')).toContainText('unsupported');
  105 |   }
  106 |   expect((await marker(frame)).marker).not.toBe('present');
  107 |   await send(page, markerCommand);
  108 |   expect((await marker(frame)).marker).not.toBe('present');
  109 |   expect(await page.evaluate(() => u3Messages)).toEqual([]);
  110 | });
  111 | 
```