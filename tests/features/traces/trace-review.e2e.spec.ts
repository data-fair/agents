/**
 * E2E test: browse, load and delete server-stored conversations from the trace-review page.
 *
 * Scenario:
 *   1. PUT settings with storeTraces: true and a mock provider/assistant model.
 *   2. Drive a gateway request directly (with consent headers) to create a stored trace.
 *   3. Poll GET /api/traces until the conversation appears (fire-and-forget storage).
 *   4. Navigate to /{type}/{id}/trace-review as admin.
 *   5. Assert a stored conversation row appears (shows the "hello" preview).
 *   6. Click the row; assert TraceView renders entries (user-message chip).
 *   7. Click the row's delete button; assert the row disappears.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, axiosAuth, directoryUrl } from '../../support/axios.ts'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const admin = await superAdmin
const user = await axiosAuth('test-standalone1')

const CONV_ID = 'conv-review-e2e-1'

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
      },
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    }
  },
  quotas: {
    global: { unlimited: true, monthlyLimit: 0 },
    admin: { unlimited: true, monthlyLimit: 0 },
    contrib: { unlimited: false, monthlyLimit: 0 },
    user: { unlimited: false, monthlyLimit: 0 },
    external: { unlimited: true, monthlyLimit: 0 },
    anonymous: { unlimited: false, monthlyLimit: 0 }
  },
  storeTraces: true
}

async function waitForConversation (conversationId: string) {
  for (let i = 0; i < 60; i++) {
    const res = await admin.get('/api/traces/user/test-standalone1')
    if (res.data.results.some((r: any) => r.conversationId === conversationId)) return
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for conversation ${conversationId}`)
}

test.describe('Trace-review stored conversations', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)

    // Drive a gateway request directly with consent headers so a trace gets stored
    const cookieString = await user.cookieJar.getCookieString(directoryUrl)
    const provider = createOpenAI({
      baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/user/test-standalone1/v1`,
      apiKey: 'unused',
      headers: {
        cookie: cookieString,
        'x-trace-consent': 'yes',
        'x-trace-conversation': CONV_ID,
        'x-trace-ctx': 'turn:t1'
      },
      name: 'data-fair-gateway'
    })
    await generateText({ model: provider.chat('assistant'), messages: [{ role: 'user', content: 'hello' }] })

    // Wait until the trace is persisted (async write)
    await waitForConversation(CONV_ID)
  })

  test('browse, load and delete a stored conversation', async ({ page, goToWithAuth }) => {
    // Navigate to trace-review page as the user who is admin of their own account
    await goToWithAuth('/agents/user/test-standalone1/trace-review', 'test-standalone1')

    // The stored conversations section should appear with the "hello" preview
    const convRow = page.locator('.stored-list__item').first()
    await expect(convRow).toBeVisible({ timeout: 10000 })
    await expect(convRow).toContainText('hello', { timeout: 5000 })

    // Click the row to load the trace into the viewer
    await convRow.click()

    // TraceView should now render entries; a user-message chip appears
    await expect(page.getByText('user-message').first()).toBeVisible({ timeout: 10000 })

    // Click the delete button on the row (stop propagation — should not re-load)
    // Use .first() because rows with a userId also have an erase-user button
    const deleteBtn = convRow.getByRole('button').first()
    await deleteBtn.click()

    // Row should disappear after deletion + re-fetch
    await expect(convRow).toBeHidden({ timeout: 5000 })
  })
})
