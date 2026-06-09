import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './tests',
  workers: 1, // Force Playwright to run everything one-by-one
  fullyParallel: false, // Also disable parallel test execution inside files
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list', // Best for agents: easy to parse in stdout

  use: {
    baseURL: 'http://localhost:' + process.env.NGINX_PORT,
    trace: 'on-first-retry', // Keeps it lean, only logs on fail
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
      name: 'e2e',
      testMatch: /.*\.e2e\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['state-setup'],
    },
  ],
})
