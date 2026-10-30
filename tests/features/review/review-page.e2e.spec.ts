/**
 * E2E test: from the activity page's stored conversations to the review page of one of them.
 *
 * Scenario:
 *   1. PUT settings with reviewPersonalAssistant: true and a mock provider/assistant model.
 *   2. Run a consented turn so the conversation is reviewable.
 *   3. Poll GET /api/review/organization/test1 until the conversation is listed.
 *   4. Open /agents/organization/test1 as superadmin in adminMode, click the row in the
 *      "Stored conversations" tab, land on /organization/test1/review/:id.
 *   5. Assert the conversation, its telemetry and the JSONL download.
 */

import { readFile } from 'node:fs/promises'
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { runTurn, setReviewConsent } from '../../support/turn.ts'

const admin = await superAdmin

// External visitors unlimited, and the account offers review.
const reviewSettings = { quotas: { external: { unlimited: true, monthlyLimit: 0 } }, reviewPersonalAssistant: true }

test.describe('Activity and review pages', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1', reviewSettings)
  })

  test('a stored conversation is listed, opens on the review page, and downloads as JSONL', async ({ page, goToWithAuth }) => {
    // Run a real turn, which is what makes a conversation reviewable. Consent travels in the cookie
    // both boundaries read; the conversation id is the server's, not ours to choose.
    await setReviewConsent(admin, true)
    const convId = (await runTurn(admin, 'organization/test1', 'hello review page')).conversationId

    // Reviewable means BOTH gates are satisfied: the org enabled review and the person consented. The
    // list only shows it then, so its absence here is the consent write not having landed yet.
    await expect.poll(async () => {
      const res = await admin.get('/api/review/organization/test1?page=1&size=20').catch(() => null)
      return res?.data.results?.some((r: any) => r.conversationId === convId)
    }, { timeout: 12000 }).toBe(true)

    await goToWithAuth('/agents/organization/test1', 'superadmin', { adminMode: true })

    // The stored conversations are a tab of the activity section
    await page.locator('#activity').getByRole('tab', { name: 'Stored conversations' }).click({ timeout: 15000 })

    // A real preview: the list reads the conversation's first user message. While review went
    // through a copy of the exchange this came from a stored request body, and once the executor
    // stopped putting messages there it silently became empty and the row fell back to the id.
    const convRow = page.getByText('hello review page')
    await expect(convRow).toBeVisible({ timeout: 10000 })

    // Clicking the row navigates to the review page
    await convRow.click()
    await expect(page).toHaveURL(new RegExp(`/organization/test1/review/${convId}`), { timeout: 10000 })

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

    // The telemetry the conversation cannot carry. Per-call detail lives on the run: which model
    // answered, and what the turn cost.
    await expect(page.getByText('1 turns', { exact: false })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('mock-model').first()).toBeVisible()

    // The whole replacement for the trace evaluator: one button, one file. Asserted through a real
    // browser download rather than by fetching the endpoint, because what can break here is the
    // link (a wrong URL, or a button rendered where the endpoint will 403) rather than the format,
    // which is pinned in tests/features/review/conversation-export.unit.spec.ts.
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

    // The instructions are behind the detail toggle rather than always on screen.
    await page.getByRole('button', { name: 'Show detail' }).click()
    await expect(page.getByText('Instructions given to the model')).toBeVisible()
    await expect(page.getByText('tool result', { exact: false }).first()).toBeVisible()
    // What else the model was given that the thread does not show: the page's context (none from a bare
    // socket) and the tools the turn offered, by source; and per call, what the provider cache served.
    await expect(page.getByTestId('review-host-context')).toBeVisible()
    await expect(page.getByTestId('review-offered-tools').getByTestId('tool-group').filter({ hasText: 'Built into the service' })).toContainText('wait_for_user_action')
    await expect(page.getByRole('columnheader', { name: 'Cache read' })).toBeVisible()
  })
})
