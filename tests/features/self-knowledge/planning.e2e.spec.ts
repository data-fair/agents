/**
 * stateful E2E tests: the approval card reads as plain language — a planning call shows the task it
 * plans, changes or deletes, and any other gated call shows its tool's title, description and arguments.
 * Mock model, configured autonomous agent; planning calls are an administrator's of the organization.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const AGENTS = '/api/autonomous-agents/organization/test1'
const weekly = { type: 'weekly', month: '*', dayOfWeek: '1', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
const digest = { title: 'Weekly digest', prompt: 'Summarize the week.', scheduling: [weekly] }

const createAgent = async (over: any = {}) => {
  const agent = (await admin.post(AGENTS, {
    title: 'Planner',
    persona: 'You answer briefly.',
    mcpServers: [],
    enabled: true,
    instructors: [{ mode: 'member', type: 'user', id: 'test1-user1' }],
    ...over
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}

const ask = async (page: any, text: string) => {
  await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill(text)
  await page.getByTestId('agent-chat-send').click()
}

test.describe('Readable approval cards', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('plan_task shows the task in words, and approving it plans the task', async ({ page, goToWithAuth }) => {
    const agent = await createAgent()
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agent.id}`, 'test1-admin1', { org: 'test1' })
    await ask(page, `call tool plan_task ${JSON.stringify(digest)}`)

    const card = page.getByTestId('approval-card')
    await expect(card).toBeVisible({ timeout: 15000 })
    await expect(card.getByTestId('approval-title')).toHaveText('Approve "Plan a task"?')
    // The model-facing description and the service's server id are not for the person deciding.
    await expect(card.getByTestId('approval-description')).toHaveCount(0)
    await expect(card).not.toContainText('agent-self')
    await expect(card).toContainText('Weekly digest')
    await expect(card).toContainText('Summarize the week.')
    await expect(card).toContainText('every Monday at 08:00 (Europe/Paris)')
    await expect(card).toContainText('enabled')
    // No raw JSON anywhere on the card: the person reads the task, not its encoding.
    expect(await card.innerText()).not.toContain('{')

    await page.getByTestId('approval-approve').click()
    await expect(card).toHaveCount(0, { timeout: 15000 })
    // The decision stays visible on the call, live and after a reload: an approved chip reading like any
    // other let a judged agent tell the person their approval was still pending.
    await expect(page.getByTestId('tool-chip').first()).toHaveText('Approved: Plan a task', { timeout: 15000 })
    await expect.poll(async () => (await admin.get(`${AGENTS}/${agent.id}/tasks`)).data.results.map((t: any) => t.title))
      .toEqual(['Weekly digest'])
    await page.reload()
    await expect(page.getByTestId('tool-chip').first()).toHaveText('Approved: Plan a task', { timeout: 15000 })
  })

  // A disabled task, so the same card also shows that an update without "enabled" keeps it disabled
  // in the After column.
  test('update_task shows the task before and after the change, keeping a disabled task disabled', async ({ page, goToWithAuth }) => {
    const agent = await createAgent()
    const task = (await admin.post(`${AGENTS}/${agent.id}/tasks`, { ...digest, enabled: false })).data
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agent.id}`, 'test1-admin1', { org: 'test1' })
    await ask(page, `call tool update_task ${JSON.stringify({ taskId: task.id, ...digest, title: 'Renamed digest' })}`)

    const card = page.getByTestId('approval-card')
    await expect(card).toBeVisible({ timeout: 15000 })
    await expect(card).toContainText('Before')
    await expect(card).toContainText('After')
    // The Before column is the task as stored, read from the API by the administrator deciding.
    await expect(card).toContainText('Weekly digest')
    await expect(card).toContainText('Renamed digest')
    await expect(card.getByTestId('approval-task-state')).toHaveText(['disabled', 'disabled'])
  })

  test('update_task on a paused task shows the pause, and that the change lifts it', async ({ page, goToWithAuth }) => {
    const agent = await createAgent()
    const task = (await admin.post(`${AGENTS}/${agent.id}/tasks`, digest)).data
    // Paused by the scheduler, as for real: a schedule it cannot compute.
    await admin.post('/api/test-env/task-next-run', {
      taskId: task.id, nextRunAt: '2026-01-15T09:00:00.000Z', scheduling: [{ ...weekly, timeZone: 'Not/AZone' }]
    })
    await admin.post('/api/test-env/scheduler-pass', { now: '2026-01-15T10:00:00.000Z' })
    await expect.poll(async () => (await admin.get(`${AGENTS}/${agent.id}/tasks/${task.id}`)).data.pausedReason).toBeTruthy()

    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agent.id}`, 'test1-admin1', { org: 'test1' })
    await ask(page, `call tool update_task ${JSON.stringify({ taskId: task.id, ...digest, title: 'Renamed digest' })}`)

    const card = page.getByTestId('approval-card')
    const states = card.getByTestId('approval-task-state')
    await expect(states).toHaveText([/^paused: its schedule cannot be computed/, 'enabled: this change lifts the pause and plans the next run'], { timeout: 15000 })

    // What the card says is what happens.
    await page.getByTestId('approval-approve').click()
    await expect(card).toHaveCount(0, { timeout: 15000 })
    await expect.poll(async () => (await admin.get(`${AGENTS}/${agent.id}/tasks/${task.id}`)).data.pausedReason, { timeout: 15000 }).toBeUndefined()
  })

  // A gated catalog call's card (its title, description and "no arguments"): approval-gate.e2e.spec.ts.
})
