/**
 * E2E test: navigate to /organization/test1/traces/:id and assert the stored trace renders.
 *
 * Scenario:
 *   1. PUT settings with storeTraces: true and a mock provider/assistant model.
 *   2. Drive a gateway request with consent headers so a trace gets stored.
 *   3. Poll GET /api/traces/conversation/:id until the trace appears.
 *   4. Navigate to /agents/organization/test1/traces/:id as superadmin.
 *   5. Assert the TraceView rendered (a user-message chip is visible).
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'
import { runTurn, setTraceConsent } from '../../support/turn.ts'

const admin = await superAdmin

// Assigned per test by the turn that creates it: the server owns conversation ids.
let convId = ''

const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: [
    {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      usage: ['assistant'],
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    }
  ],
  modelMapping: {
    assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' }
  },
  quotas: {
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
    const res = await admin.get(`/api/traces/conversation/${conversationId}`).catch(() => null)
    if (res && res.data.results.length > 0) return
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for conversation ${conversationId}`)
}

test.describe('Trace review page (/organization/test1/traces/:id)', () => {
  test.beforeEach(async () => {
    await clean()
    await putSettings(admin, 'organization/test1', settingsData)

    // Run a real turn, which is what produces a stored trace now. Consent travels in the cookie
    // both boundaries read; the conversation id is the server's, not ours to choose.
    await setTraceConsent(admin, true)
    convId = (await runTurn(admin, 'organization/test1', 'hello review page')).conversationId

    // Wait until the trace is persisted (async write)
    await waitForConversation(convId)
  })

  test('renders the stored trace for an admin', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/traces/${convId}`, 'superadmin', { adminMode: true })

    // The page must not show the load-error state
    await expect(page.getByText('Trace not found or access denied.', { exact: false })).toHaveCount(0)

    // TraceView renders a chip per trace entry; the first user message produces a
    // "user-message" chip — same assertion used in trace-review.e2e.spec.ts
    await expect(page.getByText('user-message').first()).toBeVisible({ timeout: 15000 })
  })

  test('shows the summary bar, flag chips and view toggle', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/traces/${convId}`, 'superadmin', { adminMode: true })

    // summary bar: the request-count metric.
    //
    // The flag-chip assertion is GONE with its source. Experimental chat flags were read from a
    // cookie by the gateway and recorded on the trace; the server-held loop receives no flags, so
    // there is no chip to assert rather than a chip that moved.
    await expect(page.getByText('1 requests', { exact: false })).toBeVisible({ timeout: 15000 })

    // default Interpreted view hides physical-request entries
    await expect(page.getByText('physical-request')).toHaveCount(0)

    // switching to Raw reveals them
    await page.getByRole('button', { name: 'Raw' }).click()
    await expect(page.getByText('physical-request').first()).toBeVisible()
  })
})
