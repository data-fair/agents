/**
 * E2E tests for the trace debug dialog.
 *
 * Validates that:
 *   - Expanding a trace entry auto-loads its details (no "Show detail" button)
 *   - Tool result entries display their content
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, axiosAuth, defaultQuotas } from '../../support/axios.ts'

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
  quotas: defaultQuotas
}

test.describe('Trace Debug Dialog', () => {
  test.beforeEach(async () => {
    await clean()
    await user.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Expanding a trace entry auto-loads details and tool results are displayed', async ({ page, goToWithAuth }) => {
    // Enable tracing before navigating (sessionStorage must be set before component mounts)
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await page.evaluate(() => sessionStorage.setItem('agent-chat-trace', '1'))
    await page.reload()

    // Wait for tools to be ready
    await page.getByRole('button', { name: /Debug|Débogage/ }).click()
    await page.getByRole('tab', { name: /Outils|Tools/ }).click()
    const debugPanels = page.locator('.v-dialog .v-expansion-panels')
    await expect(debugPanels.getByRole('button', { name: 'set_display' })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    // Send a message that triggers a tool call
    await page.getByPlaceholder('Type your message...').fill('call tool set_display {"text":"trace test"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // Wait for the tool call to complete
    await expect(page.getByLabel('Output')).toHaveValue('trace test', { timeout: 15000 })

    // Open debug dialog and go to Trace tab
    await page.getByRole('button', { name: /Debug|Débogage/ }).click()
    await page.getByRole('tab', { name: /Trace/ }).click()

    // Verify trace entries exist
    const tracePanel = page.locator('.v-dialog .v-expansion-panels').last()
    await expect(tracePanel.locator('.v-expansion-panel')).not.toHaveCount(0, { timeout: 5000 })

    // Find and expand a tool-call entry
    const toolCallEntry = tracePanel.locator('.v-expansion-panel', { hasText: 'tool call' }).first()
    await expect(toolCallEntry).toBeVisible()
    await toolCallEntry.locator('.v-expansion-panel-title').click()

    // Details should load automatically without needing a button click
    // Verify the detail content (pre element) appears
    await expect(toolCallEntry.locator('.agent-chat__pre')).toBeVisible({ timeout: 3000 })

    // Verify there is no "Show detail" button anywhere in the trace
    await expect(tracePanel.getByRole('button', { name: /Show detail|Voir le détail/ })).not.toBeVisible()

    // Find and expand a tool-result entry
    const toolResultEntry = tracePanel.locator('.v-expansion-panel', { hasText: 'tool result' }).first()
    await expect(toolResultEntry).toBeVisible()
    await toolResultEntry.locator('.v-expansion-panel-title').click()

    // Tool result details should auto-load and display content
    await expect(toolResultEntry.locator('.agent-chat__pre')).toBeVisible({ timeout: 3000 })

    // Verify tool result contains expected fields
    const resultContent = await toolResultEntry.locator('.agent-chat__pre').textContent()
    expect(resultContent).toContain('toolName')
  })
})
