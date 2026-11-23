import { expect } from '@playwright/test'
import { test as setup } from './fixtures/login.ts'

/**
 * The dev UI transforms each route on its first hit. Without this project the first e2e tests of a
 * cold run (CI, or a vite just restarted) pay for it inside their own timeouts. It visits the routes
 * most e2e specs use once, with a long timeout, and records how long each one took in the test
 * annotations.
 */
setup('warm up the dev UI routes', async ({ page, goToWithAuth }, testInfo) => {
  let last = Date.now()
  const visit = async (url: string, user: string, opts?: { adminMode?: boolean }) => {
    await goToWithAuth(url, user, opts)
    await expect(page.locator('.v-application')).toBeVisible()
    await page.waitForLoadState('networkidle')
    testInfo.annotations.push({ type: 'warmup', description: `${url}: ${Date.now() - last} ms` })
    last = Date.now()
  }

  await visit('/agents/organization/test_agents_org1', 'test_agents_superadmin', { adminMode: true })
  await visit('/agents/organization/test_agents_org1/chat', 'test_agents_superadmin', { adminMode: true })
  await visit('/agents/admin/user/test_agents_standalone', 'test_agents_superadmin', { adminMode: true })
  await visit('/agents/user/test_agents_standalone/chat', 'test_agents_standalone')
  await visit('/agents/_dev/chat-mcp', 'test_agents_standalone')
})
