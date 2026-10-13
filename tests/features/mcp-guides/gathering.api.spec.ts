/**
 * What a tool server says about its own tools — its instructions and its skills (SEP-2640) — gathered
 * with its tools, shown in the system prompt and loaded with read_skill (docs/architecture/mcp-tools.md,
 * "Server instructions and skills").
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { startTurnOverSocket, runOf } from '../../../dev/socket-turn.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

const createAgent = async (over: any = {}) =>
  (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Guides probe', persona: 'x', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true, ...over })).data

/** One turn of an agent's new thread, waited for; the run and the thread's messages. */
const runTurn = async (agentId: string, content: string) => {
  const { runId, conversationId } = await startTurnOverSocket(orgAdmin, { agentId }, content)
  let run
  for (let i = 0; i < 100; i++) {
    run = await runOf(orgAdmin, conversationId, runId)
    if (run.status !== 'running') break
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  const messages = (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`)).data.results
  return { conversationId, run, assistant: messages.find((m: any) => m.role === 'assistant' && m.runId === runId) }
}

const toolCall = (assistant: any, name: string) => (assistant.parts ?? []).find((p: any) => p.type === 'dynamic-tool' && p.toolName === name)

test.describe('Server instructions and skills', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.failSkillsList(false)
    await putMockSettings(admin, 'organization/test1')
  })

  test('a turn lists the server\'s skills with its tools, never reads a body, and declares the skills capability', async () => {
    const agent = await createAgent()
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    fixture.resetMethodCounts()
    const { run } = await runTurn(agent.id, 'hello')
    assert.equal(run.status, 'done')
    const counts = fixture.methodCounts()
    assert.equal(counts['skills/list'], 1)
    assert.equal(counts['resources/read'] ?? 0, 0)
    assert.ok(fixture.lastInitializeCapabilities()?.extensions?.['io.modelcontextprotocol/skills'])
  })

  test('a failing skills/list keeps the server\'s tools', async () => {
    fixture.failSkillsList(true)
    const agent = await createAgent()
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    const { run, assistant } = await runTurn(agent.id, 'call tool list_road_closures {"district":"riverside"}')
    assert.equal(run.status, 'done')
    const call = toolCall(assistant, 'list_road_closures')
    assert.equal(call?.state, 'output-available')
    assert.match(JSON.stringify(call.output), /Quai des Chartrons/)
  })
})
