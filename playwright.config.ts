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
      name: 'api-and-unit',
      testMatch: /.*\.spec\.ts/, // Matches all your feature files
      grep: /@api|@unit/, // Allows agents to filter specific runs
    },
    {
      name: 'e2e',
      testMatch: /.*\.spec\.ts/,
      grep: /@e2e/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
