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
      models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } } } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    })

    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')

    // Wait for tools to be discovered via BroadcastChannel before sending a message
    await page.getByRole('button', { name: /Debug|Débogage/ }).click()
    await page.getByRole('tab', { name: /Outils|Tools/ }).click()
    await expect(page.getByText('set_data')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    await page.getByPlaceholder('Type your message...').fill('call tool set_data {"data":"Hello World"}')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByLabel('Data')).toHaveValue('Hello World', { timeout: 10000 })
  })
})
