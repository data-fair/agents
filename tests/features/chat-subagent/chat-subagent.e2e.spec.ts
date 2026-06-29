/**
 * E2E tests for the sub-agent chat page.
 *
 * The mock model responds to:
 *   "hello"                          → "world"
 *   "call tool <name> <json-args>"   → tool call
 *   anything else                    → "what do you mean ?"
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

// Seed the flags cookie before boot so each test pins its own sub-agent render
// mode. goToWithAuth reuses a cached browser context, so a path=/ cookie set by
// one test leaks into the next — every rendering test must seed explicitly.
const seedFlagsCookie = (page: Page, simpleSubAgents: boolean) => page.addInitScript((simple) => {
  const flags = { toolExploration: false, subAgents: true, mermaid: false, simpleSubAgents: simple }
  document.cookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify(flags))}; path=/`
}, simpleSubAgents)
// Full v-alert panel rendering (to inspect the inner sub-agent trace).
const seedFullPanelCookie = (page: Page) => seedFlagsCookie(page, false)
// Simplified chip rendering (the product default).
const seedChipCookie = (page: Page) => seedFlagsCookie(page, true)

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
  quotas: defaultQuotas
}

/**
 * Open the debug dialog's Tools tab and wait for a specific tool to appear.
 * Returns a locator scoped to the debug dialog's expansion panels.
 */
async function waitForToolsReady (page: import('@playwright/test').Page, toolName: string, locateAsText = false) {
  await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
  await page.getByRole('tab', { name: 'Info' }).click()
  const debugContent = page.locator('.v-dialog .v-window-item--active')
  if (locateAsText) {
    await expect(debugContent.getByText(toolName)).toBeVisible({ timeout: 5000 })
  } else {
    await expect(debugContent.getByRole('button', { name: toolName })).toBeVisible({ timeout: 5000 })
  }
  await page.getByRole('button', { name: /Close|Fermer/ }).click()
}

test.describe('Chat Sub-Agent UI', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Page loads with correct title and UI elements', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await expect(page.getByRole('heading', { name: 'Chat Sub-Agent Dev', level: 1 })).toBeVisible()
    await expect(page.getByLabel('Output')).toBeVisible()
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible()
  })

  test('All tools are discovered via MCP', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()

    // All tools + sub-agent should appear in the debug dialog
    const debugContent = page.locator('.v-dialog .v-window-item--active')
    await expect(debugContent.getByRole('button', { name: 'set_display' })).toBeVisible({ timeout: 5000 })
    // Sub-agent is displayed as a labeled group, not a button
    await expect(debugContent.getByText('data_analyst (2 tools)')).toBeVisible()
    await expect(debugContent.getByRole('button', { name: 'get_schema' })).toBeVisible()
    await expect(debugContent.getByRole('button', { name: 'query_data' })).toBeVisible()
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

  test('Main agent delegates to a sub-agent (simplified chip)', async ({ page, goToWithAuth }) => {
    await seedChipCookie(page)
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    // The sub-agent receives "hello" as task → mock responds "world"
    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_analyst {"task":"hello"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // Default simple mode: the delegation renders as a chip, not a panel.
    await expect(page.getByTestId('subagent-chip').filter({ hasText: 'Data Analyst' }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('subagent-panel')).toHaveCount(0)
  })

  test('Sub-agent can use reserved tools (full panel)', async ({ page, goToWithAuth }) => {
    await seedFullPanelCookie(page)
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    // Ask the mock model to call the sub-agent with a task that triggers a tool call
    // The sub-agent mock receives "call tool get_schema {}" → calls get_schema
    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_analyst {"task":"call tool get_schema {\\"dataset\\":\\"test\\"}"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // The sub-agent panel appears and is collapsed by default (no auto-open).
    const panel = page.locator('.agent-chat').getByTestId('subagent-panel').first()
    await expect(panel).toBeVisible({ timeout: 15000 })
    await expect(panel.getByTestId('subagent-panel-body')).toBeHidden()

    // Wait for the turn to fully settle (input re-enabled) before expanding.
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    // Expand manually and verify the reserved get_schema tool chip is inside the body.
    await panel.getByTestId('subagent-panel-header').click()
    const body = panel.getByTestId('subagent-panel-body')
    await expect(body).toBeVisible({ timeout: 5000 })
    await expect(body.locator('.v-chip', { hasText: 'get_schema' }).first()).toBeVisible({ timeout: 5000 })
  })
})
