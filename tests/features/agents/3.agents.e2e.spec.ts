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
  agents: {
    backOfficeAssistant: {
      name: 'Test Assistant',
      prompt: 'You are a test assistant.',
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
  }
}

test.describe('Chat UI', () => {
  test.beforeEach(async () => {
    await clean()
    await user.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Page loads with input field', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/chat/back-office-assistant', 'test-standalone1')
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
  })

  test('Can send a message and receive response', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/chat/back-office-assistant', 'test-standalone1')

    // Type a message
    const input = page.getByPlaceholder('Type your message...')
    await input.fill('hello')
    await expect(input).toHaveValue('hello')

    // Click send
    await page.getByRole('button', { name: 'Send' }).click()

    // Verify user message appears
    await expect(page.locator('.chat-message.user')).toContainText('hello')

    // Wait for loading to complete and assistant response
    await expect(page.locator('.chat-message.assistant')).toContainText('world', { timeout: 10000 })
  })
})
