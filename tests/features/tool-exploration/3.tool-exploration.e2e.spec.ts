/**
 * E2E smoke test: explore_tools → promote → call
 *
 * Proves the exploration wiring runs end-to-end in a browser.
 * Turn 1: main mock-model calls explore_tools; the summarizer seam promotes
 * every candidate tool via select_tools.
 * Turn 2: main mock-model calls set_display, which updates the output area.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

const mockProvider = { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }

const settingsData = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
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

async function sendMessage (page: import('@playwright/test').Page, text: string) {
  const input = page.getByPlaceholder('Type your message...')
  await expect(input).toBeEnabled({ timeout: 10000 })
  await input.fill(text)
  await page.getByRole('button', { name: 'Send' }).click()
}

test.describe('Tool exploration E2E', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('explore_tools promotes tools then set_display updates the output area', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    // Enable exploration mode (requires debug=true which is set on the page)
    await page.evaluate(() => localStorage.setItem('agent-chat-explore', '1'))
    await page.reload()

    // Wait for the input to be ready
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 10000 })

    // Turn 1: trigger explore_tools via the mock "call tool" syntax
    await sendMessage(page, 'call tool explore_tools {"intent":"display some text"}')

    // Wait for the explore_tools chip to appear in the assistant message
    await expect(
      page.locator('.agent-chat .v-chip', { hasText: 'explore_tools' }).first()
    ).toBeVisible({ timeout: 20000 })

    // Wait for the full turn 1 response (the assistant text after the tool result).
    // 'done' appears only after explore_tools.execute has finished running
    // (including the summarizer select_tools call that promotes the tools).
    await expect(
      page.locator('.agent-chat .assistant-content').last()
    ).toContainText('done', { timeout: 20000 })

    // Turn 2: call set_display – should now be callable (promoted by explore_tools)
    await sendMessage(page, 'call tool set_display {"text":"hello-from-explore"}')

    // The set_display tool writes to the output textarea
    await expect(page.getByLabel('Output')).toHaveValue('hello-from-explore', { timeout: 20000 })
  })

  test('without exploration mode, set_display is called directly and updates the output area', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    // Exploration mode is NOT enabled (no localStorage['agent-chat-explore'])

    // Wait for tools to be registered via MCP before sending – mirrors the waitForToolsReady
    // pattern from chat-subagent.e2e.spec.ts (avoids the race between MCP setup and sendMessage)
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: /Tools/ }).click()
    await expect(
      page.locator('.v-dialog .v-window-item--active').getByRole('button', { name: 'set_display' })
    ).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /Close/ }).click()

    // Call set_display directly – no explore_tools involved
    await sendMessage(page, 'call tool set_display {"text":"direct-no-explore"}')

    // The set_display tool writes to the output textarea
    await expect(page.getByLabel('Output')).toHaveValue('direct-no-explore', { timeout: 20000 })
  })
})
