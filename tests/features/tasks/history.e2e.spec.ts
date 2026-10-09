/**
 * stateful E2E tests of the History tab of an autonomous agent's page: its runs, and a task run read like
 * a conversation. Runs are seeded through the API, with the mock model.
 */

import { readFile } from 'node:fs/promises'
import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { axiosAuth, clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startTurnOverSocket } from '../../../dev/socket-turn.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const asSuperAdmin = { adminMode: true } as const
const daily = { type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
// matches api/config/development.js secretKeys.limits
const LIMITS_SECRET = 'secretlimits'

const agentBase = (agentId: string) => `/api/autonomous-agents/organization/test1/${agentId}`
const createAgent = async () => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'History agent', persona: 'You answer briefly.', mcpServers: [], enabled: true
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
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

const openHistory = async (page: Page, goToWithAuth: any, agentId: string, query = '') => {
  await goToWithAuth(`/agents/organization/test1/agents/${agentId}?tab=history${query}`, 'superadmin', asSuperAdmin)
}
const runItem = (page: Page, text: string) => page.getByTestId('agent-run').filter({ hasText: text })

test.describe('Agent page, History tab', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('each state of a task run reads distinctly', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    await runTask(agentId, 'Reported digest', 'call tool report_outcome {"status":"needs-attention","summary":"Two datasets are stale"}')
    await runTask(agentId, 'Silent digest', 'hello')
    await runTask(agentId, 'Broken digest', 'stream error')
    const running = await runTask(agentId, 'Stalling digest', 'stall', false)
    try {
      await skippedRun(agentId)
      await openHistory(page, goToWithAuth, agentId)

      const reported = runItem(page, 'Reported digest')
      await expect(reported).toContainText('Done')
      await expect(reported).toContainText('Run manually')
      await expect(reported).toContainText('Needs attention')
      await expect(reported).toContainText('Two datasets are stale')
      await expect(reported.getByTestId('agent-run-credits')).toBeVisible()

      await expect(runItem(page, 'Silent digest')).toContainText('No outcome reported')
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

  test('a task run opens as a transcript, and its export downloads as a .jsonl', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    const runId = await runTask(agentId, 'Greeting', 'hello')
    await openHistory(page, goToWithAuth, agentId)
    await runItem(page, 'Greeting').click()

    await expect(page).toHaveURL(new RegExp(`run=${runId}`))
    const view = page.getByTestId('task-run-view')
    await expect(view).toContainText('Greeting')
    // the prompt as the user's turn, the mock's answer as the agent's, in the chat's own transcript
    await expect(view.locator('.agent-chat__user-bubble')).toHaveText('hello')
    await expect(view.locator('.assistant-content')).toContainText('world')
    // read-only: nothing to type into
    await expect(view.getByRole('textbox')).toHaveCount(0)

    const downloadPromise = page.waitForEvent('download')
    await view.getByRole('link', { name: 'Export' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe(`task-run-${runId}.jsonl`)
    const lines = (await readFile(await download.path(), 'utf8')).trim().split('\n').map(line => JSON.parse(line))
    expect(lines[0].type).toBe('meta')

    // closing goes back to the list, and drops the run from the url
    await view.getByRole('button', { name: 'Back to history' }).click()
    await expect(runItem(page, 'Greeting')).toBeVisible()
    await expect(page).not.toHaveURL(/run=/)
    // ...in place of the run, so Back does not reopen the run just closed
    await page.goBack()
    await expect(page).not.toHaveURL(/run=/)
    await expect(view).toHaveCount(0)
  })

  test('a notification url opens directly on the run', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    const runId = await runTask(agentId, 'Linked digest', 'hello')
    await openHistory(page, goToWithAuth, agentId, `&run=${runId}`)
    const view = page.getByTestId('task-run-view')
    await expect(view).toContainText('Linked digest', { timeout: 20000 })
    await expect(view.locator('.assistant-content')).toContainText('world')
  })

  test('a running task run can be aborted from its view', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    const runId = await runTask(agentId, 'Stalling digest', 'stall', false)
    try {
      await openHistory(page, goToWithAuth, agentId, `&run=${runId}`)
      const view = page.getByTestId('task-run-view')
      await expect(view).toContainText('Running', { timeout: 20000 })
      await view.getByRole('button', { name: 'Abort' }).click()
      await expect(view).toContainText('Aborted', { timeout: 10000 })
      await expect(view.getByRole('button', { name: 'Abort' })).toHaveCount(0)
    } finally {
      await admin.post(`${agentBase(agentId)}/runs/${runId}/abort`)
      await awaitRunEnd(agentId, runId)
    }
  })

  test('conversation runs are listed apart, and open on the existing review page', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    await runTask(agentId, 'Task digest', 'hello')
    const { runId, conversationId } = await startTurnOverSocket(orgAdmin, { agentId }, 'hello')
    await awaitRunEnd(agentId, runId)
    await openHistory(page, goToWithAuth, agentId)
    await expect(runItem(page, 'Task digest')).toBeVisible()

    await page.getByRole('button', { name: 'Conversations' }).click()
    await expect(page.getByTestId('agent-run')).toHaveCount(1)
    await expect(runItem(page, 'Task digest')).toHaveCount(0)
    await page.getByTestId('agent-run').click()
    await expect(page).toHaveURL(new RegExp(`/agents/organization/test1/traces/${conversationId}`))
    await expect(page.locator('.agent-chat__user-bubble')).toHaveText('hello')
  })
})
