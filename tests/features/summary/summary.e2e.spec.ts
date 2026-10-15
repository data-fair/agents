/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean } from '../../support/axios.ts'

test.describe('Summary UI', () => {
  test.beforeEach(async () => {
    await clean()
  })

  // No account settings: the deployment's global default model covers the
  // summarizer role (the account-configured variants are covered by summary.api).
  test('Summarize is disabled while empty, then shows the summary', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/summary', 'test-standalone1')
    await expect(page.getByRole('heading', { name: 'Summary Dev', level: 1 })).toBeVisible()

    const button = page.getByRole('button', { name: 'Summarize' })
    await expect(button).toBeDisabled()

    await page.getByLabel('Content to summarize').fill('This is a test content that needs to be summarized. It contains multiple sentences describing various things.')
    await button.click()

    await expect(page.getByRole('heading', { name: 'Summary', level: 2 })).toBeVisible()
  })
})
