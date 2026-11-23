import { test } from '@playwright/test'

test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    await page.goto('/agents/user/test_agents_standalone/chat')
    await page.waitForTimeout(3000)
  })
})
