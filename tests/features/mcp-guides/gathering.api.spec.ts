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

const issuer = `http://localhost:${process.env.NGINX_PORT}/agents/api/nhi`

/** The system prompt a run had, as the review page reads it (a configured agent's thread is audited). */
const systemPromptOf = async (conversationId: string, runId: string) =>
  (await orgAdmin.get(`/api/review/organization/test1/${conversationId}`)).data.runs.find((r: any) => r.id === runId).systemPrompt as string

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

  test('the run\'s system prompt carries the server\'s instructions and its skill index', async () => {
    const agent = await createAgent()
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    const { conversationId, run } = await runTurn(agent.id, 'hello')
    const prompt = await systemPromptOf(conversationId, run.id)
    assert.match(prompt, /<server-instructions server="dev-public-mcp">\nRoad closures: always give the district/)
    assert.match(prompt, /- dev-public-mcp · closures — How to answer questions about road closures/)
    assert.doesNotMatch(prompt, /hidden/)
  })

  test('a skill whose tools the toolFilter removed is not offered', async () => {
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp', toolFilter: ['echo'] }] })
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    const { conversationId, run } = await runTurn(agent.id, 'hello')
    const prompt = await systemPromptOf(conversationId, run.id)
    assert.match(prompt, /Road closures: always give the district/)
    assert.doesNotMatch(prompt, /dev-public-mcp · closures/)
  })

  test('read_skill returns a listed skill in its envelope, and an unlisted one through skills/get', async () => {
    const agent = await createAgent()
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    const listed = await runTurn(agent.id, 'call tool read_skill {"server":"dev-public-mcp","uri":"skill://fixture/closures/SKILL.md"}')
    const call = toolCall(listed.assistant, 'read_skill')
    assert.equal(call?.state, 'output-available')
    assert.match(call.output, /^<skill server="dev-public-mcp" uri="skill:\/\/fixture\/closures\/SKILL\.md">/)
    assert.match(call.output, /Call list_road_closures with the district/)
    assert.doesNotMatch(call.output, /<tool-result/)
    assert.equal(call.toolMetadata.serverId, 'agent-skills')
    fixture.resetMethodCounts()
    const unlisted = await runTurn(agent.id, 'call tool read_skill {"server":"dev-public-mcp","uri":"skill://fixture/hidden/SKILL.md"}')
    assert.match(toolCall(unlisted.assistant, 'read_skill').output, /Hidden procedure\./)
    assert.equal(fixture.methodCounts()['skills/get'], 1)
  })

  test('read_skill over a session entry presents the agent\'s own session', async () => {
    await admin.post('/api/test-env/autonomous-agent', {
      id: 'test-fixture',
      owner: { type: 'organization', id: 'test1' },
      clientId: 'test-autonomous-agent-nhi',
      siteUrl: `http://localhost:${process.env.NGINX_PORT}`,
      issuer,
      autonomousAgent: { title: 'Guides probe', persona: 'x', mcpServers: [{ serverId: 'dev-session-mcp' }], enabled: true }
    })
    const { assistant } = await runTurn('test-fixture', 'call tool read_skill {"server":"dev-session-mcp","uri":"skill://fixture/closures/SKILL.md"}')
    assert.equal(toolCall(assistant, 'read_skill')?.state, 'output-available')
    assert.match(String(fixture.lastHeaders().cookie ?? ''), /id_token=/)
  })

  test('read_skill never reads from a server outside the turn: a wrong label falls back to the turn\'s server listing the URI, or reads nothing', async () => {
    const agent = await createAgent()
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    const listed = await runTurn(agent.id, 'call tool read_skill {"server":"dev-session-mcp","uri":"skill://fixture/closures/SKILL.md"}')
    assert.match(toolCall(listed.assistant, 'read_skill').output, /^<skill server="dev-public-mcp"/)
    fixture.resetMethodCounts()
    const { assistant } = await runTurn(agent.id, 'call tool read_skill {"server":"dev-session-mcp","uri":"skill://fixture/hidden/SKILL.md"}')
    const call = toolCall(assistant, 'read_skill')
    assert.equal(call?.state, 'output-error')
    assert.match(call.errorText, /not one of your tool servers this turn \(agent, dev-public-mcp\)/)
    assert.equal(fixture.methodCounts()['resources/read'] ?? 0, 0)
  })

  test('a configured agent lists its own earlier-work skill first, and read_skill loads it', async () => {
    const agent = await createAgent({ mcpServers: [] })
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    const { conversationId, run, assistant } = await runTurn(agent.id, 'call tool read_skill {"server":"agent","uri":"skill://agent/earlier-work/SKILL.md"}')
    const prompt = await systemPromptOf(conversationId, run.id)
    assert.match(prompt, /- agent · earlier-work — When someone refers to something said or done in an earlier conversation/)
    const call = toolCall(assistant, 'read_skill')
    assert.equal(call?.state, 'output-available')
    assert.match(call.output, /^<skill server="agent" uri="skill:\/\/agent\/earlier-work\/SKILL\.md">/)
    assert.match(call.output, /list_my_runs/)
  })
})
