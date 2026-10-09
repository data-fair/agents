/**
 * stateful E2E tests of the Tasks tab of an autonomous agent's page: an agent's planned tasks, planned
 * and run from there.
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const asSuperAdmin = { adminMode: true } as const
const daily = { type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }

const createAgent = async (over: any = {}) => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'Tasks agent', persona: 'You answer briefly.', mcpServers: [], enabled: true, ...over
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent.id as string
}
const tasksUrl = (agentId: string) => `/api/autonomous-agents/organization/test1/${agentId}/tasks`
const createTask = async (agentId: string, over: any = {}) =>
  (await admin.post(tasksUrl(agentId), { title: 'Morning digest', prompt: 'hello', scheduling: [daily], ...over })).data
const awaitRunEnd = async (agentId: string, runId: string) => {
  for (let i = 0; i < 150; i++) {
    const run = (await admin.get(`/api/autonomous-agents/organization/test1/${agentId}/runs/${runId}`)).data
    if (run.status !== 'running') return
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('run never ended')
}
// Paused as the scheduler pauses a task: five failed runs in a row (the mock fails on "stream error").
const pausedTask = async (agentId: string) => {
  const task = await createTask(agentId, { title: 'Failing digest', prompt: 'stream error' })
  for (let i = 0; i < 5; i++) {
    await awaitRunEnd(agentId, (await admin.post(`${tasksUrl(agentId)}/${task.id}/run`)).data.runId)
  }
  return task
}

const openTasks = async (page: Page, goToWithAuth: any, agentId: string) => {
  await goToWithAuth(`/agents/organization/test1/agents/${agentId}?tab=tasks`, 'superadmin', asSuperAdmin)
  await expect(page.getByRole('button', { name: 'New task' })).toBeVisible({ timeout: 20000 })
}
const taskItem = (page: Page, title: string) => page.getByTestId('agent-task').filter({ hasText: title })

/** Adds a schedule rule of `type` at hour:minute to the dialog's form. */
const addRule = async (page: Page, type: string, hour: string, minute = '0') => {
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Add item' }).click()
  // the outer combobox wrapper, not the input it overlays (which intercepts clicks); a new rule
  // starts as the first variant
  await dialog.getByRole('combobox').filter({ hasText: 'Monthly' }).last().click()
  await page.getByRole('option', { name: type, exact: true }).click()
  await dialog.getByRole('textbox', { name: 'Hour' }).last().fill(hour)
  await dialog.getByRole('textbox', { name: 'Minute' }).last().fill(minute)
}
const fillTaskForm = async (page: Page, title: string, type: string) => {
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Title' }).fill(title)
  await dialog.getByRole('textbox', { name: 'Instruction' }).fill('Summarize the news.')
  await addRule(page, type, '8')
}

test.describe('Agent page, Tasks tab', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('a weekly task is created through the form, described and given a next run', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    await openTasks(page, goToWithAuth, agentId)
    await page.getByRole('button', { name: 'New task' }).click()
    await fillTaskForm(page, 'Weekly digest', 'Weekly')
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click()

    await expect(page.getByRole('dialog')).toBeHidden()
    const item = taskItem(page, 'Weekly digest')
    await expect(item).toContainText('every Monday at 08:00 (Europe/Paris)')
    await expect(item.getByTestId('agent-task-next-run')).toContainText(/\d/)
    const stored = (await admin.get(tasksUrl(agentId))).data.results
    expect(stored.map((t: any) => t.title)).toEqual(['Weekly digest'])
  })

  test('a schedule under the minimum interval shows the refusal in the dialog, which stays open', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    await openTasks(page, goToWithAuth, agentId)
    await page.getByRole('button', { name: 'New task' }).click()
    await fillTaskForm(page, 'Too often', 'Daily')
    // a second daily rule ten minutes later: two runs within the minimum interval of 60 minutes
    const dialog = page.getByRole('dialog')
    await addRule(page, 'Daily', '8', '10')
    await dialog.getByRole('button', { name: 'Save' }).click()

    await expect(dialog.getByTestId('agent-task-form-error')).toContainText('minimum interval')
    await expect(dialog).toBeVisible()
    expect((await admin.get(tasksUrl(agentId))).data.results).toEqual([])
  })

  test('a paused task says why and how to resume it; saving it resumes it', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    await pausedTask(agentId)
    await openTasks(page, goToWithAuth, agentId)
    const item = taskItem(page, 'Failing digest')
    await expect(item.getByTestId('agent-task-paused')).toContainText('Paused')
    await expect(item).toContainText('5 consecutive failed runs')
    await expect(item).toContainText('Saving the task resumes it')

    await item.getByRole('button', { name: 'Edit' }).click()
    await expect(page.getByRole('dialog').getByRole('textbox', { name: 'Title' })).toHaveValue('Failing digest')
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(item.getByTestId('agent-task-paused')).toBeHidden()
    await expect(item.getByTestId('agent-task-next-run')).toContainText(/\d/)
  })

  test('a paused task switched off reads as disabled, not as paused', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    const task = await pausedTask(agentId)
    // switched off as the switch does it: the task as it is, `enabled` false — which keeps the pause
    await admin.put(`${tasksUrl(agentId)}/${task.id}`, { title: task.title, prompt: task.prompt, scheduling: task.scheduling, enabled: false })
    await openTasks(page, goToWithAuth, agentId)
    const item = taskItem(page, 'Failing digest')
    await expect(item.getByRole('checkbox', { name: 'Enabled' })).not.toBeChecked()
    await expect(item.getByTestId('agent-task-paused')).toBeHidden()
    await expect(item).not.toContainText('Saving the task resumes it')
  })

  test('run now starts a run of the task', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    const task = await createTask(agentId)
    await openTasks(page, goToWithAuth, agentId)
    await taskItem(page, 'Morning digest').getByRole('button', { name: 'Run now' }).click()
    await expect(page.getByText('The run has started')).toBeVisible()
    const runs = (await admin.get(`/api/autonomous-agents/organization/test1/${agentId}/runs`, { params: { taskId: task.id } })).data.results
    expect(runs.map((r: any) => r.trigger)).toEqual(['manual'])
    await awaitRunEnd(agentId, runs[0].id)
  })

  // Run now is how an admin probes a task the scheduler will not run: a paused one, or one switched
  // off. Only a disabled AGENT refuses it (below) — a guard on the task's own state would take the
  // probe away.
  test('run now is allowed on a paused task and on a task switched off', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    const paused = await pausedTask(agentId)
    const off = await createTask(agentId, { title: 'Switched off digest', enabled: false })
    const runsOf = async (taskId: string) =>
      (await admin.get(`/api/autonomous-agents/organization/test1/${agentId}/runs`, { params: { taskId } })).data.results
    for (const task of [paused, off]) {
      // a fresh page per task, so the first click's message cannot stand in for the second's
      await openTasks(page, goToWithAuth, agentId)
      const before = new Set((await runsOf(task.id)).map((r: any) => r.id))
      const item = taskItem(page, task.title)
      // precondition: the state the scheduler would not run
      if (task === paused) await expect(item.getByTestId('agent-task-paused')).toBeVisible()
      else await expect(item.getByRole('checkbox', { name: 'Enabled' })).not.toBeChecked()
      await item.getByRole('button', { name: 'Run now' }).click()
      await expect(page.getByText('The run has started')).toBeVisible()
      await expect(item.getByTestId('agent-task-run-error')).toBeHidden()
      const added = (await runsOf(task.id)).filter((r: any) => !before.has(r.id))
      expect(added.map((r: any) => r.trigger)).toEqual(['manual'])
      await awaitRunEnd(agentId, added[0].id)
    }
  })

  test('run now on a disabled agent shows the refusal next to the task', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent({ enabled: false })
    await createTask(agentId)
    await openTasks(page, goToWithAuth, agentId)
    const item = taskItem(page, 'Morning digest')
    await item.getByRole('button', { name: 'Run now' }).click()
    await expect(item.getByTestId('agent-task-run-error')).toContainText('the autonomous agent is disabled')
  })

  test('the enabled switch saves the task, and a disabled task has no next run', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    const task = await createTask(agentId)
    await openTasks(page, goToWithAuth, agentId)
    const item = taskItem(page, 'Morning digest')
    await expect(item.getByTestId('agent-task-next-run')).toBeVisible()
    await item.getByRole('checkbox', { name: 'Enabled' }).click()
    await expect(item.getByTestId('agent-task-next-run')).toBeHidden()
    const stored = (await admin.get(`${tasksUrl(agentId)}/${task.id}`)).data
    expect(stored.enabled).toBe(false)
    expect(stored.prompt).toBe('hello')
  })

  test('delete asks for confirmation, then removes the task', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    await createTask(agentId)
    await openTasks(page, goToWithAuth, agentId)
    const item = taskItem(page, 'Morning digest')
    await item.getByRole('button', { name: 'Delete' }).click()
    // exact: the open menu is owned by the Delete button, whose accessible name then includes it
    await page.getByRole('button', { name: 'Confirm deletion', exact: true }).click()
    await expect(item).toHaveCount(0)
    expect((await admin.get(tasksUrl(agentId))).data.results).toEqual([])
  })
})
