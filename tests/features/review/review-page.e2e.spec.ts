/**
 * E2E test: navigate to /organization/test1/review/:id and assert the conversation renders.
 *
 * Scenario:
 *   1. PUT settings with reviewPersonalAssistant: true and a mock provider/assistant model.
 *   2. Run a consented turn so the conversation is reviewable.
 *   3. Poll GET /api/review/conversation/:id until the conversation appears.
 *   4. Navigate to /agents/organization/test1/review/:id as superadmin.
 *   5. Assert the TraceView rendered (a user-message chip is visible).
 */

import { readFile } from 'node:fs/promises'
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { runTurn, setReviewConsent } from '../../support/turn.ts'

const admin = await superAdmin

// Assigned per test by the turn that creates it: the server owns conversation ids.
let convId = ''

// External visitors unlimited, and the account offers review.
const reviewSettings = { quotas: { external: { unlimited: true, monthlyLimit: 0 } }, reviewPersonalAssistant: true }

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

test.describe('Review page (/organization/test1/review/:id)', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1', reviewSettings)

    // Run a real turn, which is what makes a conversation reviewable. Consent travels in the cookie
    // both boundaries read; the conversation id is the server's, not ours to choose.
    await setReviewConsent(admin, true)
    convId = (await runTurn(admin, 'organization/test1', 'hello review page')).conversationId

    // Wait until the conversation is reviewable
    await waitForConversation(convId)
  })

  test('renders the conversation for an admin', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/review/${convId}`, 'superadmin', { adminMode: true })

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
    await goToWithAuth(`/agents/organization/test1/review/${convId}`, 'superadmin', { adminMode: true })

    // Per-call detail now lives on the run: which model answered, and what the turn cost.
    await expect(page.getByText('1 turns', { exact: false })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('mock-model').first()).toBeVisible()

    // The instructions are behind the detail toggle rather than always on screen.
    await page.getByRole('button', { name: 'Show detail' }).click()
    await expect(page.getByText('Instructions given to the model')).toBeVisible()
    await expect(page.getByText('tool result', { exact: false }).first()).toBeVisible()
  })

  test('downloads the conversation as a JSONL file a coding agent can read', async ({ page, goToWithAuth }) => {
    // The whole replacement for the trace evaluator: one button, one file. Asserted through a real
    // browser download rather than by fetching the endpoint, because what can break here is the
    // link (a wrong URL, or a button rendered where the endpoint will 403) rather than the format,
    // which is pinned in tests/features/review/conversation-export.unit.spec.ts.
    await goToWithAuth(`/agents/organization/test1/review/${convId}`, 'superadmin', { adminMode: true })
    await expect(page.getByText('1 turns', { exact: false })).toBeVisible({ timeout: 15000 })

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('link', { name: 'Download' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe(`conversation-${convId}.jsonl`)

    const path = await download.path()
    const lines = (await readFile(path, 'utf8')).replace(/\n$/, '').split('\n')
    const meta = JSON.parse(lines[0])
    expect(meta.type).toBe('meta')
    expect(meta.conversation.id).toBe(convId)
    expect(meta.lines.total).toBe(lines.length)
    // And the outline's pointers resolve in the file that actually reached the disk.
    for (const entry of JSON.parse(lines[1]).records) {
      expect(JSON.parse(lines[entry.line - 1]).type).toBe(entry.record)
    }
  })
})
