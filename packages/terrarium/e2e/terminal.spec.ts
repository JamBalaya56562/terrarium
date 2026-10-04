// The three ways in — the page, the element, the iframe — against the
// v2.6.1 build of aube and the aube-local-deps fixture.
import { expect, type Page, test } from '@playwright/test';
import { HOST, SITE } from '../playwright.config.ts';

declare global {
  var terrariumTranscript: string;
  var events: Array<Record<string, unknown>>;
  var messages: Array<Record<string, unknown>>;
  function runInFrame(command: string): void;
}

const transcript = (page: Page) =>
  page.evaluate(() => globalThis.terrariumTranscript);

test.describe('the page', () => {
  test('runs the build in ?ref and types the commands in ?run', async ({
    page,
  }) => {
    await page.goto(
      `${SITE}/web/?ref=v2.6.1&run=aube%20--version&run=aube%20install&run=ls&run=aube%20list`,
    );
    await expect(page.locator('#build')).toHaveValue('v2.6.1');
    await expect(page.locator('#source')).toHaveAttribute(
      'href',
      /aubepkg\/aube\/commit\/bd94e42f/,
    );
    await expect
      .poll(() => transcript(page))
      .toContain('dependencies:\n├── filedep');
    const text = await transcript(page);
    expect(text).toContain('2.6.1');
    expect(text).toMatch(/node_modules\//);
    expect(text).toContain('linked');
    await expect(page.locator('#status')).toHaveText(/^Ready in /);
  });

  test('names the published builds when ?ref asks for a missing one', async ({
    page,
  }) => {
    await page.goto(`${SITE}/web/?ref=nope`);
    await expect(page.locator('#status')).toHaveText(
      /no build "nope" of aube; published: .*v2\.6\.1/,
    );
  });

  test('starts in /work with no fixture when ?fixture is empty', async ({
    page,
  }) => {
    await page.goto(`${SITE}/web/?ref=v2.6.1&fixture=&run=pwd&run=ls`);
    await expect.poll(() => transcript(page)).toBe('/work\n');
  });
});

test.describe('the element on another origin', () => {
  test('loads the build, runs commands and reports them', async ({ page }) => {
    await page.goto(`${HOST}/element.html`);
    const ready = await page.evaluate(
      () => document.querySelector('terrarium-terminal')?.ready,
    );
    expect(ready).toMatchObject({
      tool: 'aube',
      ref: 'v2.6.1',
      commit: expect.stringMatching(/^bd94e42f/),
    });

    const result = await page.evaluate(() =>
      document.querySelector('terrarium-terminal')?.run('aube --version'),
    );
    expect(result).toMatchObject({ command: 'aube --version', code: 0 });
    expect(result?.output).toContain('2.6.1');

    const missing = await page.evaluate(() =>
      document.querySelector('terrarium-terminal')?.run('cat nope'),
    );
    expect(missing).toMatchObject({ code: 1 });

    const types = await page.evaluate(() => events.map((e) => e.type));
    expect(types).toEqual([
      'terrarium-ready',
      'terrarium-exit',
      'terrarium-exit',
    ]);
  });

  test('reports an error on a page that is not cross-origin isolated', async ({
    page,
  }) => {
    await page.goto(`${HOST}/plain/element.html`);
    await expect
      .poll(() => page.evaluate(() => events))
      .toEqual([
        {
          type: 'terrarium-error',
          message: expect.stringContaining('not cross-origin isolated'),
        },
      ]);
  });
});

test.describe('the iframe on another origin', () => {
  test('talks to its parent with postMessage', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'credentialless iframes are Chromium-only so far',
    );
    await page.goto(`${HOST}/iframe.html`);
    await expect
      .poll(() => page.evaluate(() => messages.map((m) => m.type)))
      .toContain('terrarium:ready');

    await page.evaluate(() => runInFrame('aube --version'));
    await expect
      .poll(() =>
        page.evaluate(() => messages.find((m) => m.type === 'terrarium:exit')),
      )
      .toMatchObject({
        origin: SITE,
        command: 'aube --version',
        code: 0,
        output: expect.stringContaining('2.6.1'),
      });
  });
});
