/**
 * stateful E2E tests: the approval card reads as plain language — a planning call shows the task it
 * plans, changes or deletes, and any other gated call shows its tool's title, description and arguments.
 * Mock model, configured autonomous agent.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

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
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
  })

  test('plan_task shows the task in words, and approving it plans the task', async ({ page, goToWithAuth }) => {
    const agent = await createAgent()
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agent.id}`, 'test1-user1', { org: 'test1' })
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
    await expect(page.getByTestId('tool-chip').first()).toBeVisible()
    await expect.poll(async () => (await admin.get(`${AGENTS}/${agent.id}/tasks`)).data.results.map((t: any) => t.title))
      .toEqual(['Weekly digest'])
  })

  test('update_task shows the task before and after the change', async ({ page, goToWithAuth }) => {
    const agent = await createAgent()
    const task = (await admin.post(`${AGENTS}/${agent.id}/tasks`, digest)).data
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agent.id}`, 'test1-user1', { org: 'test1' })
    await ask(page, `call tool update_task ${JSON.stringify({ taskId: task.id, ...digest, title: 'Renamed digest' })}`)

    const card = page.getByTestId('approval-card')
    await expect(card).toBeVisible({ timeout: 15000 })
    await expect(card).toContainText('Before')
    await expect(card).toContainText('After')
    // The Before column is the task as stored, read from the API by the instructor.
    await expect(card).toContainText('Weekly digest')
    await expect(card).toContainText('Renamed digest')
  })

  test('a gated catalog call asks about its title, shows its description and "no arguments"', async ({ page, goToWithAuth }) => {
    const agentId = (await admin.post(AGENTS, {
      title: 'Gate probe', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true
    })).data.id
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    await ask(page, 'call tool wipe_everything {}')

    const card = page.getByTestId('approval-card')
    await expect(card).toBeVisible({ timeout: 15000 })
    await expect(card.getByTestId('approval-title')).toHaveText('Approve "Wipe everything"?')
    await expect(card.getByTestId('approval-description')).toHaveText('Declares destructive annotations, and does nothing')
    await expect(card).toContainText('no arguments')
    expect(await card.innerText()).not.toContain('{')
  })
})
