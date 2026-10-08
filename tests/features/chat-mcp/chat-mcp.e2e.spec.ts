/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'
import { putSettings, putMockSettings } from '../../support/settings.ts'
import { waitForPageTools } from '../../support/page-tools.ts'

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
    const admin = await superAdmin
    await putSettings(admin, 'user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: [
        {
          model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } },
          usage: ['assistant'],
          inputPricePerMillion: 0,
          outputPricePerMillion: 0
        }
      ],
      modelMapping: {
        assistant: { provider: 'mock', id: 'mock-model', name: 'Mock Model' }
      },
      quotas: defaultQuotas
    })

    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')

    // Wait for tools to be discovered via BroadcastChannel before sending a message
    await waitForPageTools(page, 'set_data')

    await page.getByPlaceholder('Type your message...').fill('call tool set_data {"data":"Hello World"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // THE CLAIM, end to end in a browser: `set_data` exists only in this page; the loop on the server
    // asked for it over the socket, this page ran it, and the textarea changed.
    await expect(page.getByLabel('Data')).toHaveValue('Hello World', { timeout: 10000 })

    // The structure arrived too, not just the side effect: the call renders as a finished tool chip
    // (titled by the page's own tool title, in its done colour).
    const chip = page.getByTestId('tool-chip').filter({ hasText: 'Data' })
    await expect(chip).toHaveCount(1, { timeout: 10000 })
    await expect(chip).toHaveClass(/text-success/)
  })

  test('A turn runs on the server and streams into the page', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await putMockSettings(admin, 'user/test-standalone1')

    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')
    await page.getByPlaceholder('Type your message...').fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()

    // The mock answers "hello" with "world": the socket carried the prompt, the executor ran the turn
    // as the personal assistant, and its tokens were streamed back to this page.
    await expect(page.locator('.assistant-content').last()).toHaveText('world', { timeout: 15000 })
  })

  test('Reset button clears the conversation', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await putSettings(admin, 'user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: [
        {
          model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } },
          usage: ['assistant'],
          inputPricePerMillion: 0,
          outputPricePerMillion: 0
        }
      ],
      modelMapping: {
        assistant: { provider: 'mock', id: 'mock-model', name: 'Mock Model' }
      },
      quotas: defaultQuotas
    })

    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')

    await page.getByPlaceholder('Type your message...').fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    await page.getByRole('button', { name: /Reset conversation|Réinitialiser la conversation/ }).click()

    await expect(page.locator('.assistant-content')).toHaveCount(0)
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible()
  })

  test('Debug dialog shows tool inputSchema', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')
    await waitForPageTools(page, 'set_data')

    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()

    // Expand the tool panel to reveal the inputSchema
    await page.getByTestId('page-tools').getByText('set_data', { exact: true }).click()

    // The schema the page declared is not empty - it should contain the "data" property
    const schemaBlock = page.getByTestId('page-tools').locator('.agent-chat__pre').last()
    await expect(schemaBlock).toBeVisible()
    await expect(schemaBlock).toContainText('"properties"')
    await expect(schemaBlock).toContainText('"data"')
  })
})
