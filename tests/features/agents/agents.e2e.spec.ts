/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, axiosAuth } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')

const settingsData = {
  providers: [
    {
      id: 'mock-provider',
      type: 'mock',
      name: 'Mock Provider',
      enabled: true
    }
  ],
  models: {
    assistant: {
      model: {
        id: 'mock-model',
        name: 'Mock Model',
        provider: {
          type: 'mock',
          name: 'Mock Provider',
          id: 'mock-provider'
        }
      }
    }
  },
  limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
}

test.describe('Chat UI', () => {
  test.beforeEach(async () => {
    await clean()
    await user.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Page loads with input field', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
  })

  test('Can send a message and receive response', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')

    // Wait for chat to be ready
    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })

    // Type a message
    await input.fill('hello')
    await expect(input).toHaveValue('hello')

    // Click send
    await page.getByRole('button', { name: 'Send' }).click()

    // Verify user message appears
    await expect(page.getByText('hello', { exact: true })).toBeVisible()

    // Wait for loading to complete and assistant response
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })
  })
})
