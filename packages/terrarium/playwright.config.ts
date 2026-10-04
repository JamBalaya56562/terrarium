// Browser tests against the assembled site (`mise run site:build`, with a
// build of aube in web/dist: `scripts/fetch-builds.sh v2.6.1`), from the site's
// own origin and from a second one standing for a page that embeds terrarium.
import { defineConfig, devices } from '@playwright/test';

export const SITE = 'http://localhost:8780';
export const HOST = 'http://localhost:8781';

export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  expect: { timeout: 120_000 },
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    {
      command: 'bun e2e/serve.ts ../../.site 8780',
      url: `${SITE}/web/`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'bun e2e/serve.ts e2e/host 8781',
      url: `${HOST}/element.html`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
