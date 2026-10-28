/**
 * A page's skills in a turn: declared with its tools on the agent session, listed in the Skills index
 * under the page's server label, and loaded with read_skill (docs/architecture/mcp-tools.md, "Page
 * skills"). Only for an agent that works through its page, as for the page's tools.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { MongoClient } from 'mongodb'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { openAgentSession, newThreadHello, type AgentSessionClient } from '../../../dev/agent-session-client.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const cookieOf = async (ax: any) => await ax.cookieJar.getCookieString(directoryUrl)

const skill = { name: 'fill-form', description: 'How to fill the page form', uri: 'skill://fill-form/SKILL.md', body: '# Filling the page form\n\nRead the form first.' }
const pageTools = [{ name: 'describe_form', description: 'describes the form', inputSchema: { type: 'object', properties: {} } }]

test.describe('Page skills', () => {
  const sockets: AgentSessionClient[] = []
  let fixture: McpFixture
  let mongo: MongoClient
  test.beforeAll(async () => {
    fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30)
    mongo = await MongoClient.connect(`mongodb://localhost:${process.env.MONGO_PORT}/data-fair-agents-development`)
  })
  test.afterAll(async () => { await fixture.close(); await mongo.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })
  test.afterEach(() => { for (const socket of sockets.splice(0)) socket.close() })

  /** One turn on a fresh thread whose hello declares the page's tools and skills; the stored run and assistant message. */
  const turn = async (content: string, hello: Record<string, unknown> = {}) => {
    const session = await openAgentSession(await cookieOf(orgAdmin))
    sockets.push(session)
    session.send(newThreadHello('organization/test1', { tools: pageTools, skills: [skill], ...hello }))
    assert.equal((await session.next()).type, 'attached')
    session.send({ type: 'prompt', content })
    for (;;) {
      const frame = await session.next(15000)
      if (frame.type === 'turn-end') break
    }
    const conversationId = session.conversationId()!
    const run = await mongo.db().collection('runs').findOne({ conversationId }, { sort: { createdAt: -1 } })
    const messages = (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`)).data.results
    return { run: run as any, assistant: messages.find((m: any) => m.role === 'assistant') }
  }

  test('the personal assistant is shown the page\'s skill in its Skills index', async () => {
    const { run } = await turn('hello')
    assert.match(run.systemPrompt, /- the-page · fill-form — How to fill the page form \(skill:\/\/fill-form\/SKILL\.md\)/)
    assert.doesNotMatch(run.systemPrompt, /Read the form first/, 'the body is loaded on demand, not listed')
  })

  test('read_skill loads the page\'s skill body', async () => {
    const { assistant } = await turn('call tool read_skill {"server":"the-page","uri":"skill://fill-form/SKILL.md"}')
    const call = (assistant.parts ?? []).find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'read_skill')
    assert.equal(call?.state, 'output-available')
    assert.match(String(call.output), /Read the form first/)
  })

  test('a configured agent is shown none of the page\'s skills, as none of its tools', async () => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'No page', persona: 'x', mcpServers: [], enabled: true })).data
    const { run } = await turn('hello', { agentId: agent.id })
    assert.doesNotMatch(run.systemPrompt ?? '', /the-page · fill-form/)
  })
})
