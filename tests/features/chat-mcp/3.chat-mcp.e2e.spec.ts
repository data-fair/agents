/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, axiosAuth } from '../../support/axios.ts'

test.describe('Chat MCP UI', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('Page loads with Chat MCP Dev title', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')
    await expect(page.getByRole('heading', { name: 'Chat MCP Dev', level: 1 })).toBeVisible()
  })

  test('Textarea is visible', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')
    await expect(page.getByLabel('Data')).toBeVisible()
  })

  test('Agent can call set_data tool', async ({ page, goToWithAuth }) => {
    const user = await axiosAuth('test-standalone1')
    await user.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      chatModel: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } }
    })

    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')

    await page.getByLabel('Type your message...').fill('Please set the data to: Hello World')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByLabel('Data')).toHaveValue('Hello World', { timeout: 10000 })
  })
})
