/**
 * E2E tests for handing the chat system prompt to the iframe.
 *
 * Validates that:
 *   - The drawer stores the systemPrompt as initial config (keyed by an `initConfig`
 *     URL param, NOT the prompt itself in the iframe URL), and the iframe applies it
 *     (visible in the debug System Prompt tab).
 *   - The legacy ?systemPrompt= query-param path still applies the prompt.
 */

import { expect, type Page } from '@playwright/test'
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
  quotas: defaultQuotas
}

const MARKER = 'SYSPROMPT_E2E_MARKER you must always answer in pirate speak'
const fabSelector = '.df-agent-chat-toggle'

// The iframe URL now carries an `?initConfig=<key>` param, so match on the pathname
// (which also avoids matching the parent `/_dev/chat-drawer` frame).
function isChatFrameUrl (url: string): boolean {
  try {
    return new URL(url).pathname.endsWith('/_dev/chat')
  } catch {
    return false
  }
}

async function waitForChatFrame (page: Page) {
  await expect(async () => {
    expect(page.frames().find(f => isChatFrameUrl(f.url()))).toBeTruthy()
  }).toPass({ timeout: 10000 })
  const frame = page.frames().find(f => isChatFrameUrl(f.url()))!
  await expect(frame.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 15000 })
  return frame
}

test.describe('Chat system prompt transmission', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('drawer hands systemPrompt as init config, not in the iframe URL', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-drawer?systemPrompt=' + encodeURIComponent(MARKER), 'test-standalone1')

    await expect(page.locator(fabSelector)).toBeVisible()
    await page.locator(fabSelector).dispatchEvent('click')
    const frame = await waitForChatFrame(page)

    // The prompt must NOT be encoded in the iframe URL (that was the size-limited path)
    expect(frame.url()).not.toContain('systemPrompt')
    expect(frame.url()).not.toContain('SYSPROMPT_E2E_MARKER')

    // Open the debug dialog (default tab is "System Prompt") and verify the prompt was applied
    await frame.getByRole('button', { name: /Info|Informations/ }).click()
    await expect(frame.locator('.v-dialog')).toContainText('SYSPROMPT_E2E_MARKER', { timeout: 5000 })
  })

  test('legacy ?systemPrompt= query param still applies the prompt', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/user/test-standalone1/chat?systemPrompt=' + encodeURIComponent(MARKER), 'test-standalone1')

    await expect(page.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: /Info|Informations/ }).click()
    await expect(page.locator('.v-dialog')).toContainText('SYSPROMPT_E2E_MARKER', { timeout: 5000 })
  })
})
