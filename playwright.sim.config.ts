/**
 * Simulations run from their own config, never from playwright.config.ts.
 * A bare `playwright test` runs every project in its config, so adding a
 * simulation project there would make `npm run test` spend plan quota.
 */
import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './simulations',
  testMatch: /.*\.sim\.spec\.ts/,
  workers: 1,
  fullyParallel: false,
  // A judged scenario is many model turns, each of which can be a slow first token.
  timeout: 15 * 60 * 1000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:' + process.env.NGINX_PORT,
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'state-setup', testDir: './tests', testMatch: /state-setup\.ts/, teardown: 'state-teardown' },
    { name: 'state-teardown', testDir: './tests', testMatch: /state-teardown\.ts/ },
    { name: 'simulate', dependencies: ['state-setup'], use: { ...devices['Desktop Chrome'] } }
  ]
})
