/**
 * stateful API tests: the run history of an agent, one run with its content, and a task run's export.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean, axiosAuth } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const member = await axiosAuth('test1-user1', { org: 'test1' })
const daily = { type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
const agentBase = (agentId: string) => `/api/autonomous-agents/organization/test1/${agentId}`

const awaitRun = async (runId: string) => {
  for (let i = 0; i < 150; i++) {
    const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
    if (run.status !== 'running') return run
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('run never ended')
}

test.describe('Run history', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('list filters, one run with content, and the JSONL export', async () => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Historian', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true
    })).data
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    const create = async (prompt: string) => (await admin.post(`${agentBase(agent.id)}/tasks`, { title: 'Probe', prompt, scheduling: [daily] })).data
    const run = async (task: any) => {
      const id = (await admin.post(`${agentBase(agent.id)}/tasks/${task.id}/run`)).data.runId as string
      await awaitRun(id)
      return id
    }
    const attention = await run(await create('call tool report_outcome {"status":"needs-attention","summary":"look"}'))
    const plain = await run(await create('hello'))

    const list = (await orgAdmin.get(`${agentBase(agent.id)}/runs`)).data
    assert.deepEqual(list.results.map((r: any) => r.id), [plain, attention])
    assert.ok(list.results.every((r: any) => r.parts === undefined && r.prompt === undefined))

    const flagged = (await orgAdmin.get(`${agentBase(agent.id)}/runs`, { params: { outcome: 'needs-attention' } })).data
    assert.deepEqual(flagged.results.map((r: any) => r.id), [attention])
    const future = (await orgAdmin.get(`${agentBase(agent.id)}/runs`, { params: { since: new Date(Date.now() + 3600_000).toISOString() } })).data
    assert.equal(future.count, 0)
    const past = (await orgAdmin.get(`${agentBase(agent.id)}/runs`, { params: { since: new Date(Date.now() - 3600_000).toISOString() } })).data
    assert.equal(past.count, 2)

    const one = (await orgAdmin.get(`${agentBase(agent.id)}/runs/${plain}`)).data
    assert.equal(one.prompt, 'hello')
    assert.ok(Array.isArray(one.parts) && one.parts.length > 0)
    await assert.rejects(orgAdmin.get(`${agentBase(agent.id)}/runs/no-such-run`), { status: 404 })

    const exported = await orgAdmin.get(`${agentBase(agent.id)}/runs/${attention}/export`, { responseType: 'text', transformResponse: r => r })
    assert.match(exported.headers['content-disposition'], new RegExp(`task-run-${attention}\\.jsonl`))
    const lines = (exported.data as string).trim().split('\n').map(line => JSON.parse(line))
    assert.equal(lines[0].type, 'meta')
    assert.equal(lines[0].conversation.kind, 'task')
    const messages = lines.filter(line => line.type === 'message')
    assert.deepEqual(messages.map(m => m.role), ['user', 'assistant'])
    assert.match(messages[0].parts[0].text, /report_outcome/)
    assert.ok(messages[1].parts.some((p: any) => p.type === 'dynamic-tool' && p.toolName === 'report_outcome'))
    const runs = lines.filter(line => line.type === 'run')
    assert.equal(runs.length, 1)
    assert.equal(runs[0].id, attention)
    assert.equal(runs[0].parts, undefined)

    await assert.rejects(member.get(`${agentBase(agent.id)}/runs/${attention}/export`), { status: 403 })
    await assert.rejects(member.get(`${agentBase(agent.id)}/runs/${attention}`), { status: 403 })
  })
})
