/**
 * stateful API tests: a turn reuses the catalog's tool listings, and connects only to call a tool.
 *
 * Listing every catalog entry on every turn — connect, initialize, list — was half of an unloaded
 * turn's time to first token, and a large share of the CPU when turns start together (see
 * `TOOL_LISTING_TTL_MS` in api/src/mcp-servers/client.ts). The fixture counts the JSON-RPC methods
 * that reach it, so what each turn cost the MCP server is asserted, not inferred.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { openAgentSession, type AgentSessionClient } from '../../support/ws.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

test.describe('Tool listings across turns', () => {
  const sockets: AgentSessionClient[] = []
  let fixture: McpFixture

  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    // clean() also forgets the cached listings, so each test starts from a cold cache.
    await clean()
    await putMockSettings(admin, 'organization/test1')
    fixture.resetMethodCounts()
    fixture.resetInvokedTools()
  })
  test.afterEach(() => { for (const socket of sockets.splice(0)) socket.close() })

  const turn = async (socket: AgentSessionClient, content: string) => {
    socket.send({ type: 'prompt', content })
    for (;;) {
      const frame = await socket.next(15_000)
      if (frame.type === 'error') assert.fail(frame.message)
      if (frame.type === 'turn-end') return frame
    }
  }

  const personalSession = async () => {
    const conversation = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: 'personal', title: 't' })).data
    const socket = await openAgentSession(await orgAdmin.cookieJar.getCookieString(directoryUrl))
    sockets.push(socket)
    socket.send({ type: 'hello', conversationId: conversation.id, tools: [] })
    await socket.next()
    return socket
  }

  test('the second turn lists nothing and connects to nothing', async () => {
    const socket = await personalSession()
    await turn(socket, 'hello')
    const afterFirst = fixture.methodCounts()
    // The dev catalog points three entries at this fixture (public, session, api key): one listing each.
    assert.equal(afterFirst['tools/list'], 3)

    await turn(socket, 'hello')
    assert.deepEqual(fixture.methodCounts(), afterFirst, 'a second turn must reuse the listings, and call no server')
  })

  test('a turn that calls a tool connects once, to that tool\'s server, and the call goes through', async () => {
    const socket = await personalSession()
    await turn(socket, 'hello')
    const before = fixture.methodCounts()

    const end = await turn(socket, 'call tool echo {"value":"x"}')
    assert.equal(end.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['echo'])
    const after = fixture.methodCounts()
    assert.equal((after.initialize ?? 0) - (before.initialize ?? 0), 1)
    assert.equal(after['tools/list'], before['tools/list'])
  })

  test('turns starting together share one listing per server', async () => {
    const sockets = await Promise.all([personalSession(), personalSession(), personalSession(), personalSession()])
    await Promise.all(sockets.map(socket => turn(socket, 'hello')))
    assert.equal(fixture.methodCounts()['tools/list'], 3)
  })

  test('a fresh listing is still what the diagnostic endpoint shows', async () => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Diag', persona: 'p', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true
    })).data
    await admin.get(`/api/autonomous-agents/organization/test1/${agent.id}/tools`)
    await admin.get(`/api/autonomous-agents/organization/test1/${agent.id}/tools`)
    assert.equal(fixture.methodCounts()['tools/list'], 2)
  })
})
