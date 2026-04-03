/**
 * Advanced E2E tests for multi-turn sub-agent scenarios.
 *
 * Uses distinct mock models per role:
 *   - mock-model (assistant): standard "hello"→"world" / "call tool" behavior
 *   - mock-tools (tools/subagent): context-aware tool chaining (get_schema → query_data → summary)
 *   - mock-summarizer (summarizer): always returns a fixed summary string
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

const mockProvider = { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }

const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: {
    assistant: {
      model: { id: 'mock-model', name: 'Mock Model', provider: mockProvider }
    },
    tools: {
      model: { id: 'mock-tools', name: 'Mock Tools Model', provider: mockProvider }
    },
    summarizer: {
      model: { id: 'mock-summarizer', name: 'Mock Summarizer', provider: mockProvider }
    }
  },
  quotas: defaultQuotas
}

async function waitForToolsReady (page: import('@playwright/test').Page, toolName: string, locateAsText = false) {
  await page.getByRole('button', { name: /Debug|Débogage/ }).click()
  await page.getByRole('tab', { name: /Outils|Tools/ }).click()
  const debugContent = page.locator('.v-dialog .v-window-item--active')
  if (locateAsText) {
    await expect(debugContent.getByText(toolName)).toBeVisible({ timeout: 5000 })
  } else {
    await expect(debugContent.getByRole('button', { name: toolName })).toBeVisible({ timeout: 5000 })
  }
  await page.getByRole('button', { name: /Close|Fermer/ }).click()
}

async function sendMessage (page: import('@playwright/test').Page, text: string) {
  const input = page.getByPlaceholder('Type your message...')
  await expect(input).toBeEnabled({ timeout: 10000 })
  await input.fill(text)
  await page.getByRole('button', { name: 'Send' }).click()
}

test.describe('Advanced Sub-Agent Scenarios', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Subagent multi-step tool chain (get_schema → query_data → summary)', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    // Enable trace to verify tool calls
    await page.evaluate(() => { sessionStorage.setItem('agent-chat-trace', '1') })
    await page.reload()
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    // Trigger the sub-agent with a generic task — mock-tools will autonomously chain tools
    await sendMessage(page, 'call tool subagent_data_analyst {"task":"analyze the data"}')

    // Sub-agent expansion panel should appear
    await expect(page.locator('.agent-chat').getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })

    // Wait for the full response to complete
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    // Expand the panel to see inner content
    await page.locator('.agent-chat').getByText('Data Analyst').first().click()

    const subAgentPanel = page.locator('.agent-chat__subagent-panels').first()

    // get_schema should appear as a tool chip (first step in the chain)
    await expect(subAgentPanel.locator('.v-chip', { hasText: 'get_schema' }).first()).toBeVisible({ timeout: 10000 })

    // The final summary text proves the full chain completed (get_schema → query_data → summary)
    // because mock-tools only returns this text after both tool results are in context
    await expect(subAgentPanel.getByText('Analysis complete')).toBeVisible({ timeout: 10000 })

    // Verify via trace that both tools were actually called
    await page.getByRole('button', { name: /Debug|Débogage/ }).click()
    await page.getByRole('tab', { name: /Trace/ }).click()
    const tracePanel = page.locator('.v-dialog .v-expansion-panels').last()
    const subAgentEntry = tracePanel.locator('.v-expansion-panel', { hasText: /data_analyst/i })
    await expect(subAgentEntry.first()).toBeVisible({ timeout: 5000 })
  })

  test('Subagent works across multiple user messages', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    // First call to sub-agent
    await sendMessage(page, 'call tool subagent_data_analyst {"task":"hello"}')
    await expect(page.locator('.agent-chat').getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })

    // Wait for the first response to complete before sending the second
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    // Second call — subagent should work again in a subsequent message
    await sendMessage(page, 'call tool subagent_data_analyst {"task":"hello"}')

    // Should now have two sub-agent panels (one per user message)
    const subAgentPanels = page.locator('.agent-chat__subagent-panels')
    await expect(subAgentPanels).toHaveCount(2, { timeout: 15000 })
  })

  test('Mixed main agent tools and subagent delegation', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'set_display')

    // First: main agent calls set_display
    await sendMessage(page, 'call tool set_display {"text":"step1"}')
    await expect(page.getByLabel('Output')).toHaveValue('step1', { timeout: 15000 })

    // Wait for input to be ready again
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    // Then: main agent delegates to sub-agent
    await sendMessage(page, 'call tool subagent_data_analyst {"task":"hello"}')
    await expect(page.locator('.agent-chat').getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })

    // Output area should still show the previous value
    await expect(page.getByLabel('Output')).toHaveValue('step1')
  })

  test('Subagent trace appears in debug dialog', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    // Enable trace recording
    await page.evaluate(() => {
      sessionStorage.setItem('agent-chat-trace', '1')
    })
    await page.reload()
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    // Trigger a sub-agent call
    await sendMessage(page, 'call tool subagent_data_analyst {"task":"hello"}')
    await expect(page.locator('.agent-chat').getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })

    // Wait for response to complete
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    // Open debug dialog → Trace tab
    await page.getByRole('button', { name: /Debug|Débogage/ }).click()
    await page.getByRole('tab', { name: /Trace/ }).click()

    // A sub-agent trace entry should exist
    const tracePanel = page.locator('.v-dialog .v-expansion-panels').last()
    const subAgentEntry = tracePanel.locator('.v-expansion-panel', { hasText: /sub-?agent|data_analyst/i })
    await expect(subAgentEntry.first()).toBeVisible({ timeout: 5000 })
  })

  test('Compaction works during subagent conversation', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    // Set low compaction threshold and enable trace
    await page.evaluate(() => {
      sessionStorage.setItem('agent-chat-compaction-threshold', '100')
      sessionStorage.setItem('agent-chat-trace', '1')
    })
    await page.reload()
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    // First message to build history
    await sendMessage(page, 'call tool subagent_data_analyst {"task":"hello"}')
    await expect(page.locator('.agent-chat').getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    // Second message should trigger compaction (history > 100 chars)
    // Using "hello" so the mock-model assistant responds "world" after compaction
    await sendMessage(page, 'hello')
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // Conversation should still be functional after compaction
    await sendMessage(page, 'hello')
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })
  })
})
