/**
 * E2E test: navigate to /organization/test1/traces/:id and assert the stored trace renders.
 *
 * Scenario:
 *   1. PUT settings with storeTraces: true and a mock provider/assistant model.
 *   2. Drive a gateway request with consent headers so a trace gets stored.
 *   3. Poll GET /api/review/conversation/:id until the trace appears.
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
  // Reviewable means BOTH gates are satisfied: the org enabled review and the person consented. The
  // by-conversation route answers 200 only then, so a 404 here is the consent write not having
  // landed yet rather than the conversation being absent.
  for (let i = 0; i < 60; i++) {
    const res = await admin.get(`/api/review/conversation/${conversationId}`).catch(() => null)
    if (res?.status === 200) return
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

  test('renders the conversation for an admin', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/traces/${convId}`, 'superadmin', { adminMode: true })

    await expect(page.getByText('Conversation not found or access denied.', { exact: false })).toHaveCount(0)

    // The exchange itself, rendered by the SAME component the chat uses — so a reviewer sees what the
    // person saw. The old assertion looked for a `user-message` TYPE CHIP, which the reconstruction
    // layer emitted whether or not the entry had any content: it kept passing after the executor
    // stopped putting messages in the trace body, which is how that feature broke unnoticed.
    await expect(page.getByText('hello review page')).toBeVisible({ timeout: 15000 })
    // The mock answers 'world' only to exactly "hello"; this seed gets the fallback. Asserting the
    // ANSWER and not just the question matters — a reviewer seeing only one side of the exchange is
    // the failure the old chip assertion could not detect.
    await expect(page.getByText('what do you mean', { exact: false })).toBeVisible()
  })

  test('shows the telemetry the conversation cannot carry', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/traces/${convId}`, 'superadmin', { adminMode: true })

    // Per-call detail now lives on the run: which model answered, and what the turn cost.
    await expect(page.getByText('1 turns', { exact: false })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('mock-model').first()).toBeVisible()

    // The instructions are behind the detail toggle rather than always on screen.
    await page.getByRole('button', { name: 'Show detail' }).click()
    await expect(page.getByText('Instructions given to the model')).toBeVisible()
    await expect(page.getByText('tool result', { exact: false }).first()).toBeVisible()
  })
})
