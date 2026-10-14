/**
 * stateful API tests: a planned task started by its trigger URL (docs/architecture/planned-tasks.md, "Webhook triggers").
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean, axiosAuth } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const daily = { type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
const base = (agentId: string) => `/api/autonomous-agents/organization/test1/${agentId}/tasks`

const createAgent = async () => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'Hooked', persona: 'You answer briefly.', mcpServers: [], enabled: true
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}
const createTask = async (agentId: string, prompt = 'hello', scheduling: any[] = [daily]) =>
  (await admin.post(base(agentId), { title: 'Hook', prompt, scheduling })).data
const keyOf = async (agentId: string, taskId: string) => (await admin.get(`${base(agentId)}/${taskId}/webhook-key`)).data as string

test.describe('Webhook triggers', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('the key is 16 url-safe characters, read by an admin, regenerated, and absent from every task read', async () => {
    const agent = await createAgent()
    const created = await createTask(agent.id)
    assert.equal(created.webhookKey, undefined)
    const key = await keyOf(agent.id, created.id)
    assert.match(key, /^[A-Za-z0-9_-]{16}$/)
    assert.equal((await admin.get(`${base(agent.id)}/${created.id}`)).data.webhookKey, undefined)
    assert.ok((await admin.get(base(agent.id))).data.results.every((t: any) => t.webhookKey === undefined && t.pendingTriggers === undefined))
    const regenerated = (await admin.delete(`${base(agent.id)}/${created.id}/webhook-key`)).data
    assert.notEqual(regenerated, key)
    assert.equal(await keyOf(agent.id, created.id), regenerated)
  })

  test('the key routes need the write access of task routes', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id)
    const member = await axiosAuth('test1-user1', { org: 'test1' })
    await assert.rejects(member.get(`${base(agent.id)}/${task.id}/webhook-key`), { status: 403 })
  })
})
