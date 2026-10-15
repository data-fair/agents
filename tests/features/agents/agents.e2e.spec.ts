/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin

test.describe('Chat UI', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'user/test-standalone1')
  })

  // The plain hello → world exchange is covered by compaction.e2e.spec.ts (same user, same page,
  // three of them); this file keeps what that one does not render.
  test('Renders markdown links without error', async ({ page, goToWithAuth }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))

    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')

    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })
    await input.fill('markdown')
    await page.getByRole('button', { name: 'Send' }).click()

    const link = page.locator('.assistant-content a', { hasText: 'the docs' }).last()
    await expect(link).toBeVisible({ timeout: 10000 })
    await expect(link).toHaveAttribute('href', 'https://example.com/docs')
    await expect(link).toHaveAttribute('target', '_top')

    expect(errors.filter(e => e.includes('parseInline'))).toEqual([])
  })
})
