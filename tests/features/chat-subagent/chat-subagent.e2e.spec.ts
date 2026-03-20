/**
 * E2E tests for the sub-agent chat page.
 *
 * The mock model responds to:
 *   "hello"                          → "world"
 *   "call tool <name> <json-args>"   → tool call
 *   anything else                    → "what do you mean ?"
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, axiosAuth } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')

const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: {
    assistant: {
      model: {
        id: 'mock-model',
        name: 'Mock Model',
        provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }
      }
    }
  },
  limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
}

/**
 * Open the debug dialog's Tools tab and wait for a specific tool to appear.
 * Returns a locator scoped to the debug dialog's expansion panels.
 */
async function waitForToolsReady (page: import('@playwright/test').Page, toolName: string) {
  await page.getByRole('button', { name: /Debug|Débogage/ }).click()
  await page.getByRole('tab', { name: /Outils|Tools/ }).click()
  const debugPanels = page.locator('.v-dialog .v-expansion-panels')
  await expect(debugPanels.getByRole('button', { name: toolName })).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: /Close|Fermer/ }).click()
}

test.describe('Chat Sub-Agent UI', () => {
  test.beforeEach(async () => {
    await clean()
    await user.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Page loads with correct title and UI elements', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await expect(page.getByRole('heading', { name: 'Chat Sub-Agent Dev', level: 1 })).toBeVisible()
    await expect(page.getByLabel('Output')).toBeVisible()
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible()
  })

  test('All tools are discovered via MCP', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    await page.getByRole('button', { name: /Debug|Débogage/ }).click()
    await page.getByRole('tab', { name: /Outils|Tools/ }).click()

    // All four tools + sub-agent should appear in the debug dialog's expansion panels
    const debugPanels = page.locator('.v-dialog .v-expansion-panels')
    await expect(debugPanels.getByRole('button', { name: 'get_schema' })).toBeVisible({ timeout: 5000 })
    await expect(debugPanels.getByRole('button', { name: 'query_data' })).toBeVisible()
    await expect(debugPanels.getByRole('button', { name: 'set_display' })).toBeVisible()
    await expect(debugPanels.getByRole('button', { name: 'subagent_data_analyst' })).toBeVisible()
  })

  test('Main agent can call set_display tool', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'set_display')

    // Ask the mock model to call set_display
    await page.getByPlaceholder('Type your message...').fill('call tool set_display {"text":"Hello from test"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // Verify the output textarea receives the value
    await expect(page.getByLabel('Output')).toHaveValue('Hello from test', { timeout: 15000 })
  })

  test('Main agent can delegate to sub-agent', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'subagent_data_analyst')

    // Ask the mock model to call the sub-agent
    // The sub-agent receives "hello" as task → mock responds "world"
    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_analyst {"task":"hello"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // A sub-agent expansion panel should appear with title "Data Analyst"
    await expect(page.locator('.agent-chat').getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })
  })

  test('Sub-agent can use reserved tools', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'subagent_data_analyst')

    // Ask the mock model to call the sub-agent with a task that triggers a tool call
    // The sub-agent mock receives "call tool get_schema {}" → calls get_schema
    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_analyst {"task":"call tool get_schema {\\"dataset\\":\\"test\\"}"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // The sub-agent expansion panel should appear
    await expect(page.locator('.agent-chat').getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })

    // Expand the sub-agent panel to see inner tool calls
    await page.locator('.agent-chat').getByText('Data Analyst').first().click()

    // At least one get_schema tool chip should appear inside the sub-agent expansion panel
    const chatArea = page.locator('.agent-chat')
    await expect(chatArea.locator('.v-expansion-panel-text .v-chip', { hasText: 'get_schema' }).first()).toBeVisible({ timeout: 5000 })
  })
})
