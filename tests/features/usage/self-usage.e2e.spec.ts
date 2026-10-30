/**
 * E2E: an org member (contrib) sees their own consumption in the chat settings dialog.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas, anonymousAx } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'

const admin = await superAdmin

test.describe('Chat consumption tab', () => {
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
      quotas: { ...defaultQuotas, contrib: { unlimited: false, monthlyLimit: 1000 } }
    })
  })

  test('shows the conversation cost and the quota windows, reset zeroes the conversation', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1/chat', 'test1-contrib1', { org: 'test1' })

    await page.getByRole('textbox').fill('hello')
    await page.keyboard.press('Enter')
    await expect(page.getByText('world')).toBeVisible()

    await page.getByRole('button', { name: /^Settings$/ }).click()
    await page.getByRole('tab', { name: 'Consumption' }).click()

    const conversation = page.getByTestId('consumption-conversation')
    await expect(conversation).toBeVisible()
    await expect(conversation).not.toHaveText(/\b0 credits/)
    await expect(page.getByTestId('consumption-daily')).toContainText('250')
    await expect(page.getByTestId('consumption-monthly')).toContainText('1,000')

    await page.getByRole('button', { name: 'Close' }).click()
    await page.getByRole('button', { name: 'Reset conversation' }).click()
    await page.getByRole('button', { name: /^Settings$/ }).click()
    await page.getByRole('tab', { name: 'Consumption' }).click()
    await expect(page.getByTestId('consumption-conversation')).toContainText('0 credits')
  })

  test('a quota refusal reads as which limit and when it resets', async ({ page, goToWithAuth }) => {
    // seed the member's daily usage past the daily limit (1000 / 4 = 250)
    await anonymousAx.post(`http://localhost:${process.env.DEV_API_PORT}/api/test-env/usage`, {
      owner: { type: 'organization', id: 'test1' }, userId: 'test1-contrib1', cost: 300
    })
    await goToWithAuth('/agents/organization/test1/chat', 'test1-contrib1', { org: 'test1' })
    await page.getByRole('textbox').fill('hello')
    await page.keyboard.press('Enter')
    await expect(page.getByText(/Your daily AI quota is used up\. It resets on/)).toBeVisible()
  })
})
