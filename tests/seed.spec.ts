import { test } from '@playwright/test'

test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    await page.goto('http://feat-upgrade-ui.localhost:9553/agents/user/albanm/chat')
    await page.waitForTimeout(3000)
  })
})
