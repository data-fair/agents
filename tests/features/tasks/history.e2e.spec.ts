/**
 * stateful E2E tests of an autonomous agent's activity: the Task runs and Conversations tabs of its page, and
 * a task run's own page, read like a conversation. Runs are seeded through the API, with the mock model.
 */

import { readFile } from 'node:fs/promises'
import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { axiosAuth, clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startTurnOverSocket } from '../../../dev/socket-turn.ts'
import { createEnrolledAgent } from '../../support/agents.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const asSuperAdmin = { adminMode: true } as const
const daily = { type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
// matches api/config/development.js secretKeys.limits
const LIMITS_SECRET = 'secretlimits'

const agentBase = (agentId: string) => `/api/autonomous-agents/organization/test1/${agentId}`
const createAgent = async () => {
  const agent = await createEnrolledAgent({
    title: 'History agent', persona: 'You answer briefly.', mcpServers: [], enabled: true
  })
  return agent.id as string
}
const createTask = async (agentId: string, title: string, prompt: string) =>
  (await admin.post(`${agentBase(agentId)}/tasks`, { title, prompt, scheduling: [daily] })).data
const awaitRunEnd = async (agentId: string, runId: string) => {
  for (let i = 0; i < 150; i++) {
    const run = (await admin.get(`${agentBase(agentId)}/runs/${runId}`)).data
    if (run.status !== 'running') return run
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('run never ended')
}
/** Run now, waited to its end unless `wait` is false. */
const runTask = async (agentId: string, title: string, prompt: string, wait = true) => {
  const task = await createTask(agentId, title, prompt)
  const runId = (await admin.post(`${agentBase(agentId)}/tasks/${task.id}/run`)).data.runId as string
  if (wait) await awaitRunEnd(agentId, runId)
  return runId
}
/** The credit-cap path of the tasks api specs: an exhausted cap records a skipped run, and refuses. */
const skippedRun = async (agentId: string) => {
  const task = await createTask(agentId, 'Capped digest', 'hello')
  await orgAdmin.post(`/api/v1/limits/organization/test1?key=${LIMITS_SECRET}`, {
    name: 'Test 1', lastUpdate: new Date().toISOString(), ai_credits: { limit: 5, consumption: 5 }
  })
  await admin.post(`${agentBase(agentId)}/tasks/${task.id}/run`).catch(() => {})
}

const openRuns = async (page: Page, goToWithAuth: any, agentId: string, tab = 'runs') => {
  await goToWithAuth(`/agents/organization/test1/agents/${agentId}?tab=${tab}`, 'superadmin', asSuperAdmin)
}
const openRun = async (page: Page, goToWithAuth: any, agentId: string, runId: string) => {
  await goToWithAuth(`/agents/organization/test1/agents/${agentId}/runs/${runId}`, 'superadmin', asSuperAdmin)
}
const runItem = (page: Page, text: string) => page.getByTestId('agent-run').filter({ hasText: text })

test.describe('Agent page, activity', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('each state of a task run reads distinctly', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    // Four tasks, each refused only while its OWN previous run is going: they run side by side.
    const [, , , running] = await Promise.all([
      runTask(agentId, 'Reported digest', 'call tool report_outcome {"status":"needs-attention","summary":"Two datasets are stale"}'),
      runTask(agentId, 'Silent digest', 'ignore the reminder'),
      runTask(agentId, 'Broken digest', 'stream error'),
      runTask(agentId, 'Stalling digest', 'stall', false)
    ])
    try {
      await skippedRun(agentId)
      await openRuns(page, goToWithAuth, agentId)

      const reported = runItem(page, 'Reported digest')
      await expect(reported).toContainText('Run manually')
      // the outcome alone: "Done" is implied by it, and it never also reads as "no outcome"
      await expect(reported).toContainText('Needs attention')
      await expect(reported).not.toContainText('Done')
      await expect(reported.getByTestId('agent-run-no-outcome')).toHaveCount(0)
      await expect(reported).toContainText('Two datasets are stale')
      await expect(reported.getByTestId('agent-run-credits')).toBeVisible()

      // A run whose model ignored the reminder: the list says only that it has no outcome, the open
      // run that it ignored the reminder.
      await expect(runItem(page, 'Silent digest').getByTestId('agent-run-no-outcome')).toHaveText('No outcome reported')
      await expect(runItem(page, 'Broken digest')).toContainText('Error')
      await expect(runItem(page, 'Broken digest').getByTestId('agent-run-error')).not.toBeEmpty()

      const stalling = runItem(page, 'Stalling digest')
      await expect(stalling).toContainText('Running')
      await expect(stalling.getByTestId('agent-run-credits')).toHaveCount(0)
      await expect(stalling).not.toContainText('No outcome reported')

      const skipped = runItem(page, 'Capped digest')
      await expect(skipped).toContainText('Skipped')
      await expect(skipped).toContainText(/credit limit/i)
      await expect(skipped).not.toContainText('No outcome reported')

      await runItem(page, 'Silent digest').click()
      await expect(page.getByTestId('task-run-view').getByTestId('agent-run-no-outcome')).toHaveText('No outcome reported, even after a reminder')
      await page.getByTestId('task-run-view').getByRole('link', { name: 'Back to the agent' }).click()

      // the status filter
      await page.getByRole('combobox').filter({ hasText: 'Status' }).click()
      await page.getByRole('option', { name: 'Skipped', exact: true }).click()
      await expect(page.getByTestId('agent-run')).toHaveCount(1)
      await expect(runItem(page, 'Capped digest')).toBeVisible()
    } finally {
      await admin.post(`${agentBase(agentId)}/runs/${running}/abort`)
      await awaitRunEnd(agentId, running)
    }
  })

  test('a task run opens on its page, read as the review page reads a conversation, and its export downloads as a .jsonl', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    const runId = await runTask(agentId, 'Greeting', 'hello')
    await openRuns(page, goToWithAuth, agentId)
    await runItem(page, 'Greeting').click()

    await expect(page).toHaveURL(new RegExp(`/agents/${agentId}/runs/${runId}$`))
    const view = page.getByTestId('task-run-view')
    await expect(view).toContainText('Greeting')
    // the message the model was given as the user's turn (the task's title, then its prompt), the mock's answer
    // as the agent's, in the chat's own transcript
    await expect(view.locator('.agent-chat__user-bubble')).toHaveText(/^Planned task "Greeting":\s+hello$/)
    await expect(view.locator('.assistant-content').filter({ hasText: 'world' })).toHaveCount(1)
    // read-only: nothing to type into
    await expect(view.getByRole('textbox')).toHaveCount(0)
    // the mock reports only when reminded: the header says so, the transcript having no place for it
    await expect(view.getByTestId('agent-run-reminded')).toHaveText('after a reminder')

    // the review page's bar and detail: what it cost, which model calls, what the model was given
    // two: the mock reports its outcome only when reminded
    await expect(view).toContainText('2 model calls')
    // the reminder the model was sent, folded where it was sent
    const reminder = view.getByTestId('context-step-note')
    await expect(reminder).toHaveCount(1)
    await reminder.getByRole('button', { name: 'Reminder sent to the model' }).click()
    await expect(reminder).toContainText('without calling report_outcome')

    await expect(view.getByTestId('review-turn')).toHaveCount(1)
    await view.getByTestId('review-turn').locator(':scope > summary').click()
    // each tool offered as the model was told about it
    const definitions = view.getByTestId('review-tool-definitions')
    await definitions.locator('summary').first().click()
    const reportOutcome = definitions.getByTestId('review-tool-definition').filter({ has: page.locator('summary', { hasText: /^\s*report_outcome\s*$/ }) })
    await reportOutcome.locator('summary').click()
    await expect(reportOutcome).toContainText('Report the outcome of this planned task run')
    await expect(reportOutcome).toContainText('"summary"')

    const downloadPromise = page.waitForEvent('download')
    await view.getByRole('link', { name: 'Download' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe(`task-run-${runId}.jsonl`)
    const lines = (await readFile(await download.path(), 'utf8')).trim().split('\n').map(line => JSON.parse(line))
    expect(lines[0].type).toBe('meta')

    // back to the agent, on the task runs tab
    await view.getByRole('link', { name: 'Back to the agent' }).click()
    await expect(page).toHaveURL(/tab=runs/)
    await expect(runItem(page, 'Greeting')).toBeVisible()
  })

  // Opened as a notification url opens it: directly on the run.
  test('a notification url opens directly on the run, and a running one can be aborted from its view', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    const runId = await runTask(agentId, 'Stalling digest', 'stall', false)
    try {
      await openRun(page, goToWithAuth, agentId, runId)
      const view = page.getByTestId('task-run-view')
      await expect(view).toContainText('Stalling digest', { timeout: 20000 })
      await expect(view).toContainText('Running')
      await view.getByRole('button', { name: 'Abort' }).click()
      await expect(view).toContainText('Aborted', { timeout: 10000 })
      await expect(view.getByRole('button', { name: 'Abort' })).toHaveCount(0)
    } finally {
      await admin.post(`${agentBase(agentId)}/runs/${runId}/abort`)
      await awaitRunEnd(agentId, runId)
    }
  })

  test('a conversation an action button started reads as the person asked it, the hidden context folded on the review page', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    const started = await startTurnOverSocket(orgAdmin, { agentId }, 'hello', { hiddenContext: 'The open dataset is "roads".' })
    await awaitRunEnd(agentId, started.runId)

    await openRuns(page, goToWithAuth, agentId, 'conversations')
    const row = page.getByTestId('review-row')
    await expect(row).toHaveCount(1, { timeout: 20000 })
    await expect(row.getByText('hello', { exact: true })).toBeVisible()
    await expect(row).not.toContainText('hidden-context')
    await row.click()

    await expect(page.locator('.agent-chat__user-bubble')).toHaveText('hello')
    // folded: nowhere in the transcript until opened (the user turn rendered once, as a bubble)
    await expect(page.getByText('roads')).toHaveCount(0)
    const hidden = page.getByTestId('hidden-context')
    await hidden.getByRole('button', { name: 'Context added by the page' }).click()
    await expect(hidden).toContainText('The open dataset is "roads".')
  })

  test('conversations are listed one per conversation, apart from task runs, and open on the review page', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    await runTask(agentId, 'Task digest', 'hello')
    // two turns of one conversation: one row
    const first = await startTurnOverSocket(orgAdmin, { agentId }, 'hello')
    await awaitRunEnd(agentId, first.runId)
    const second = await startTurnOverSocket(orgAdmin, first.conversationId, 'hello again')
    await awaitRunEnd(agentId, second.runId)
    // another agent's conversation is not listed
    const other = (await createEnrolledAgent({ title: 'Other agent', persona: 'x', mcpServers: [], enabled: true }, 'test-scoped-fixture')).id as string
    const elsewhere = await startTurnOverSocket(orgAdmin, { agentId: other }, 'hello')
    await awaitRunEnd(other, elsewhere.runId)

    await openRuns(page, goToWithAuth, agentId)
    await expect(runItem(page, 'Task digest')).toBeVisible()
    await expect(page.getByTestId('agent-run')).toHaveCount(1)

    await openRuns(page, goToWithAuth, agentId, 'conversations')
    const rows = page.getByTestId('review-row')
    await expect(rows).toHaveCount(1, { timeout: 20000 })
    await expect(rows).toContainText('hello')
    await rows.click()
    await expect(page).toHaveURL(new RegExp(`/agents/organization/test1/review/${first.conversationId}`))
    await expect(page.locator('.agent-chat__user-bubble').first()).toHaveText('hello')

    // a conversation run's page (a tripwire or reviewer notification can name one) sends on to the review
    await openRun(page, goToWithAuth, agentId, second.runId)
    await expect(page).toHaveURL(new RegExp(`/agents/organization/test1/review/${first.conversationId}`), { timeout: 20000 })
  })
})
