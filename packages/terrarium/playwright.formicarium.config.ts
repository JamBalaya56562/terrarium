import { defineConfig, devices } from '@playwright/test';

export const SITE = 'http://127.0.0.1:8880';
export const HOST = 'http://127.0.0.1:8881';
const bun = process.env.TERRARIUM_BUN;
const site = process.env.TERRARIUM_SITE_DIR;
if (!bun || !site)
  throw new Error('set TERRARIUM_BUN and TERRARIUM_SITE_DIR explicitly');
export default defineConfig({
  outputDir: 'test-results/formicarium',
  testDir: 'e2e',
  testMatch: ['formicarium-terminal.spec.ts', 'formicarium-iframe.spec.ts'],
  timeout: 840_000,
  expect: { timeout: 120_000 },
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    serviceWorkers: 'block',
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
      command: `"${bun}" e2e/formicarium-serve.ts "${site}" 8880`,
      url: `${SITE}/element.html`,
      reuseExistingServer: false,
    },
    {
      command: `"${bun}" e2e/formicarium-serve.ts "${site}" 8881`,
      url: `${HOST}/element.html`,
      reuseExistingServer: false,
    },
  ],
});
