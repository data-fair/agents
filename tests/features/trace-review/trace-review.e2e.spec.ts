/**
 * E2E test for the trace download + admin review upload + evaluator flow.
 *
 * Scenario:
 *   1. Send a chat message (always-on tracing records it).
 *   2. Download the trace JSON from the Info dialog's Trace tab.
 *   3. Navigate to the admin trace-review page.
 *   4. Upload the downloaded trace file.
 *   5. Verify the TraceView populated.
 *   6. Send a message to the evaluator that triggers a tool call.
 *   7. Verify the tool invocation chip appears.
 */

import { readFile } from 'node:fs/promises'
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
    },
    evaluator: {
      model: {
        id: 'mock-evaluator',
        name: 'Mock Evaluator',
        provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }
      }
    }
  },
  quotas: defaultQuotas
}

test.describe('Trace review flow', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('download trace from chat then upload and use evaluator on review page', async ({ page, goToWithAuth }) => {
    // Step 1: Open the chat page as test-standalone1 (who is admin of their own user account)
    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')

    // Step 2: Send a message and wait for the assistant response
    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // Step 3: Open the Info dialog (admin-only button)
    await page.getByRole('button', { name: 'Info' }).click()

    // Step 4: Navigate to the Trace tab in the dialog
    await page.getByRole('tab', { name: /Trace/ }).click()

    // Step 5: Download the trace file
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download' }).click()
    const download = await downloadPromise
    const filePath = await download.path()
    expect(filePath).toBeTruthy()

    // Optionally verify the downloaded file is valid JSON with a non-empty turns array
    const fileContent = await readFile(filePath!, 'utf-8')
    const traceData = JSON.parse(fileContent)
    expect(Array.isArray(traceData.turns)).toBe(true)
    expect(traceData.turns.length).toBeGreaterThan(0)

    // Step 6: Navigate to the trace-review page
    await goToWithAuth('/agents/user/test-standalone1/trace-review', 'test-standalone1')

    // Step 7: Upload the downloaded trace file
    await page.locator('input[type=file]').setInputFiles(filePath!)

    // Step 8: Verify the TraceView populated — expect a "user-message" type chip
    await expect(page.getByText('user-message').first()).toBeVisible({ timeout: 10000 })

    // Step 9: Use the evaluator — send a message that triggers the getTraceOverview tool call
    // The mock model parses "call tool <name>" and passes remaining text as JSON args.
    // No trailing args: toolArgs is empty string → falsy → {} used. Avoids JSON.parse error.
    const evalInput = page.getByPlaceholder('Type your message...')
    await expect(evalInput).toBeEnabled({ timeout: 10000 })
    await evalInput.fill('call tool getTraceOverview')
    await page.getByRole('button', { name: 'Send' }).click()

    // Step 10: Assert the tool invocation chip for getTraceOverview appears.
    // The chip is rendered as a sibling to .assistant-content, not inside it.
    await expect(
      page.locator('.v-chip').filter({ hasText: 'getTraceOverview' }).first()
    ).toBeVisible({ timeout: 15000 })
  })
})
