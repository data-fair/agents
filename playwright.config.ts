import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const ci = !!process.env.CI

export default defineConfig({
  testDir: './tests',
  // api and e2e tests share the dev env state (one clean() wipes every test owner): one worker
  workers: 1,
  fullyParallel: false,
  forbidOnly: ci,
  // a flake must not cost a full re-run; a real regression shows up as several failures anyway
  retries: ci ? Number(process.env.TEST_RETRIES || 1) : 0,
  // the json report keeps the per-test durations of the last run, used to size the @smoke set and the CI jobs
  reporter: [['dot'], ['json', { outputFile: 'dev/logs/test-timings.json' }]],

  use: {
    baseURL: 'http://localhost:' + process.env.NGINX_PORT,
    // on a failure: npx playwright show-trace test-results/<test>/trace.zip
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'state-setup',
      testMatch: /state-setup\.ts/,
      teardown: 'state-teardown'
    },
    {
      name: 'state-teardown',
      testMatch: /state-teardown\.ts/,
    },
    {
      name: 'unit',
      testMatch: /.*\.unit\.spec\.ts/,
    },
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
      dependencies: ['state-setup'],
    },
    {
      // pays the dev UI's first-hit transforms once, with a long timeout, before the e2e tests
      name: 'e2e-warmup',
      testMatch: /e2e-warmup\.ts/,
      dependencies: ['state-setup'],
      timeout: 120_000,
      expect: { timeout: 60_000 },
      use: { ...devices['Desktop Chrome'], navigationTimeout: 60_000 },
    },
    {
      name: 'e2e',
      testMatch: /.*\.e2e\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['e2e-warmup'],
    },
  ],
})
