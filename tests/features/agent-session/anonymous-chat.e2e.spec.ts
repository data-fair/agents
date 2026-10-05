/**
 * E2E: a visitor who is not signed in chats with an account's assistant.
 *
 * The thread is the socket's (see anonymous-chat.api.spec.ts): a reload starts over, and nothing of
 * it is left behind on the server.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'

const admin = await superAdmin

test.describe('Anonymous chat', () => {
  test.beforeEach(async () => {
    await clean()
    await putSettings(admin, 'organization/test1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: [{
        model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
        usage: ['assistant', 'tools', 'summarizer'],
        inputPricePerMillion: 8_000,
        outputPricePerMillion: 8_000
      }],
      modelMapping: { assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' } },
      quotas: { ...defaultQuotas, anonymous: { unlimited: false, monthlyLimit: 100_000 } }
    })
  })

  test('a signed-out visitor gets an answer, and a reload starts over', async ({ page }) => {
    await page.goto('/agents/organization/test1/chat')

    await page.getByRole('textbox').fill('hello')
    await page.keyboard.press('Enter')
    await expect(page.getByText('world')).toBeVisible()

    // Their own consumption is readable too, with the per-IP quota they are held to.
    await page.getByRole('button', { name: /^Settings$/ }).click()
    await page.getByRole('tab', { name: 'Consumption' }).click()
    await expect(page.getByTestId('consumption-conversation')).not.toHaveText(/\b0 credits/)
    await page.getByRole('button', { name: 'Close' }).click()

    await page.reload()
    await expect(page.getByRole('textbox')).toBeVisible()
    await expect(page.getByText('world')).not.toBeVisible()
  })
})
