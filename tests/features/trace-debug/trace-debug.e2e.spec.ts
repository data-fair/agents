/**
 * E2E test for the stored-trace review page's auto-load-detail behavior.
 *
 * Validates that, on the /traces/:id/review page:
 *   - Expanding a tool-call entry auto-loads its details (no "Show detail" button)
 *   - A tool-result entry displays its content (including the toolName field)
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

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
  quotas: defaultQuotas,
  storeTraces: true
}

test.describe('Trace review detail loading', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Expanding a trace entry auto-loads details and tool results are displayed', async ({ page, context, goToWithAuth }) => {
    // Pre-set the consent cookie so the chat stores the conversation server-side.
    await context.addCookies([{
      name: 'agent-chat-trace-consent',
      value: 'yes',
      domain: 'localhost',
      path: '/'
    }])

    // The _dev/chat-subagent page drives its gateway as the logged-in user's
    // account (session.account), i.e. user/test-standalone1, which has
    // storeTraces enabled above. It registers a set_display tool.
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    // Wait for tools to be ready. The debug dialog has two tabs (Info / Settings);
    // registered tools are listed under the default "Info" tab.
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    const debugPanels = page.locator('.v-dialog .v-window-item--active')
    await expect(debugPanels.getByRole('button', { name: 'set_display' })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    // Send a message that triggers a tool call
    await page.getByPlaceholder('Type your message...').fill('call tool set_display {"text":"trace test"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // Wait for the tool call to complete
    await expect(page.getByLabel('Output')).toHaveValue('trace test', { timeout: 15000 })

    // Poll the list API until the stored conversation appears.
    let conversationId = ''
    for (let i = 0; i < 40; i++) {
      const res = await admin.get('/api/traces/user/test-standalone1?page=1&size=20').catch(() => null)
      if (res && res.data.results.length) { conversationId = res.data.results[0].conversationId; break }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    expect(conversationId).toBeTruthy()

    // Open the per-trace review page.
    await goToWithAuth(`/agents/traces/${conversationId}/review`, 'test-standalone1')

    const tracePanel = page.locator('.agent-chat__trace-panels')
    await expect(tracePanel).toBeVisible({ timeout: 10000 })
    await expect(tracePanel.locator('.v-expansion-panel')).not.toHaveCount(0, { timeout: 10000 })

    // Find and expand a tool-call entry (the type chip reads "tool-call")
    const toolCallEntry = tracePanel.locator('.v-expansion-panel', { hasText: 'tool-call' }).first()
    await expect(toolCallEntry).toBeVisible()
    await toolCallEntry.locator('.v-expansion-panel-title').click()

    // Details should load automatically without needing a button click.
    await expect(toolCallEntry.locator('.agent-chat__pre')).toBeVisible({ timeout: 3000 })

    // Verify there is no "Show detail" button anywhere in the trace view.
    await expect(tracePanel.getByRole('button', { name: /Show detail|Voir le détail/ })).not.toBeVisible()

    // Find and expand a tool-result entry (the type chip reads "tool-result")
    const toolResultEntry = tracePanel.locator('.v-expansion-panel', { hasText: 'tool-result' }).first()
    await expect(toolResultEntry).toBeVisible()
    await toolResultEntry.locator('.v-expansion-panel-title').click()

    // Tool result details should auto-load and display content.
    await expect(toolResultEntry.locator('.agent-chat__pre')).toBeVisible({ timeout: 3000 })

    // The reconstructed tool-result detail is { output, toolName, durationMs }, so
    // the rendered JSON must contain the toolName field.
    const resultContent = await toolResultEntry.locator('.agent-chat__pre').textContent()
    expect(resultContent).toContain('toolName')
  })
})
