/**
 * stateful API tests for the approval gate. Whether a tool ran is read from the MCP fixture's own
 * record of calls (`invokedTools`), never from what the model says.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const BASE = '/api/conversations/organization/test1'

export const createGatedAgent = async (over: any = {}) => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'Gate probe', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true, ...over
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}

export const awaitRun = async (runId: string) => {
  for (let i = 0; i < 120; i++) {
    const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
    if (run.status !== 'running') return run
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('run never ended')
}

export const turn = async (conversationId: string, content: string) => {
  const { runId } = (await orgAdmin.post(`${BASE}/${conversationId}/messages`, { content })).data
  const run = await awaitRun(runId)
  const messages = (await orgAdmin.get(`${BASE}/${conversationId}/messages`)).data.results
  return { run, messages, assistant: messages.find((m: any) => m.role === 'assistant' && m.runId === runId) }
}

export const callPart = (message: any, toolName: string) =>
  message.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === toolName)

test.describe('The approval gate', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
  })

  test('a destructive call is stopped by default: the turn ends awaiting approval and nothing ran', async () => {
    const agent = await createGatedAgent()
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { run, assistant } = await turn(conv.id, 'call tool wipe_everything {}')
    assert.equal(run.status, 'done')
    assert.equal(run.stopReason, 'awaiting-approval')
    const part = callPart(assistant, 'wipe_everything')
    assert.equal(part.state, 'approval-requested')
    assert.ok(part.approval?.id, 'the request carries its approval id')
    assert.deepEqual(fixture.invokedTools(), [], 'the tool must not have run')
  })

  test('allow runs the call as before', async () => {
    const agent = await createGatedAgent({ approvals: { destructive: 'allow' } })
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { run } = await turn(conv.id, 'call tool wipe_everything {}')
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything'])
  })

  test('deny removes the tool from what the model is offered', async () => {
    const agent = await createGatedAgent({ approvals: { write: 'deny' } })
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { run } = await turn(conv.id, 'call tool echo {"value":"x"}')
    const offered = run.calls.flatMap((c: any) => c.toolNames ?? [])
    assert.ok(!offered.includes('echo'), 'a denied write tool is never offered')
    assert.ok(offered.includes('wipe_everything'), 'the destructive one, still on approve, is offered')
    assert.deepEqual(fixture.invokedTools(), [])
  })
})
