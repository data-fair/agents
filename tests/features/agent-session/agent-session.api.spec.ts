/**
 * The agent session over a REAL socket, through nginx.
 *
 * The unit spec covers correlation, timeouts and dispatch with a fake transport. This covers the things
 * only a real connection can: that nginx proxies the upgrade, that the path survives the deployment's
 * public prefix, that the session resolves from the cookie, that the SERVER-TO-BROWSER direction works
 * at all — the whole reason this endpoint exists rather than the pub/sub one — and that the existing
 * pub/sub socket still works now that this service routes upgrades itself.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { openAgentSession, openWsClient, type AgentSessionClient, type WsClient } from '../../support/ws.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

const cookieOf = async (ax: any) => await ax.cookieJar.getCookieString(directoryUrl)

test.describe('Agent session socket', () => {
  // Every socket is closed here: a leaked one holds a dev-api connection open AND would break the next
  // test's "exactly one live session" seam, which is how a leak would surface as an unrelated failure.
  const sockets: Array<AgentSessionClient | WsClient> = []
  const open = async (cookie?: string) => {
    const socket = await openAgentSession(cookie)
    sockets.push(socket)
    return socket
  }

  test.beforeEach(async () => { await clean() })
  test.afterEach(() => {
    for (const socket of sockets.splice(0)) socket.close()
  })

  const helloWith = (names: string[]) => ({
    type: 'hello',
    tools: names.map(name => ({ name, description: `the ${name} tool`, inputSchema: { type: 'object' } }))
  })

  /** Ask the server to call a page tool, as the loop will. Resolves to { ok, result } | { ok, error }. */
  const serverCalls = async (name: string, input: unknown) =>
    (await admin.post('/api/test-env/agent-session-call', { name, input })).data

  test('an authenticated browser connects through nginx and attaches', async () => {
    const session = await open(await cookieOf(orgAdmin))
    session.send({ ...helloWith(['select_row']), conversationId: 'c1' })
    assert.deepEqual(await session.next(), { type: 'attached', conversationId: 'c1', anonymous: false })
  })

  test('an anonymous browser is allowed, deliberately', async () => {
    // The chat is open to anonymous users, so the socket must be too. Asserted rather than assumed,
    // because "it happened to work" and "we decided it works" look identical until someone adds a
    // guard.
    const session = await open()
    session.send(helloWith(['select_row']))
    assert.equal((await session.next()).type, 'attached')
  })

  test('the server asks the browser to run a tool, and gets its answer back', async () => {
    // THE direction the pub/sub socket cannot do, over a real connection.
    const session = await open(await cookieOf(orgAdmin))
    session.send(helloWith(['select_row']))
    await session.next()

    const pending = serverCalls('select_row', { id: 7 })
    const asked = await session.next()
    assert.equal(asked.type, 'tool-call')
    assert.equal(asked.name, 'select_row')
    assert.deepEqual(asked.input, { id: 7 })
    session.send({ type: 'tool-result', callId: asked.callId, result: { selected: 7 } })

    assert.deepEqual(await pending, { ok: true, result: { selected: 7 } })
  })

  test('a browser-reported failure comes back as a failure, not as a result', async () => {
    const session = await open(await cookieOf(orgAdmin))
    session.send(helloWith(['select_row']))
    await session.next()

    const pending = serverCalls('select_row', {})
    const asked = await session.next()
    session.send({ type: 'tool-result', callId: asked.callId, error: 'there is no such row' })

    const outcome = await pending
    assert.equal(outcome.ok, false)
    assert.match(outcome.error, /there is no such row/)
  })

  test('closing the tab fails the call in flight rather than hanging the turn', async () => {
    // The person who closed the tab was the only thing that could have answered. Over a real socket
    // this is the `close` event doing it, which the unit spec can only simulate.
    const session = await open(await cookieOf(orgAdmin))
    session.send(helloWith(['select_row']))
    await session.next()

    const pending = serverCalls('select_row', {})
    await session.next()
    session.close()
    await session.closed()

    const outcome = await pending
    assert.equal(outcome.ok, false)
    assert.match(outcome.error, /closed before select_row answered/)
  })

  test('a tool the page never declared fails without reaching the browser', async () => {
    const session = await open(await cookieOf(orgAdmin))
    session.send(helloWith(['select_row']))
    await session.next()

    const outcome = await serverCalls('drop_database', {})
    assert.equal(outcome.ok, false)
    assert.match(outcome.error, /does not offer a tool named drop_database/)
    // And nothing was sent down the socket — asserted by the absence of any frame.
    await assert.rejects(session.next(500), /no agent-session message within timeout/)
  })

  test('a malformed frame is reported back, not silently dropped', async () => {
    const session = await open(await cookieOf(orgAdmin))
    session.send({ type: 'subscribe', channel: 'autonomous-agent-conversations/x' })
    const answer = await session.next()
    assert.equal(answer.type, 'error')
    // The pub/sub vocabulary is specifically NOT this protocol's, and the client is told which field
    // was wrong rather than left guessing.
    assert.match(answer.message, /unknown message type "subscribe"/)
  })

  test('the PUB/SUB socket still works now that this service routes upgrades', async () => {
    // The regression this design risked: `ws` with { server } and no path handles every upgrade, so the
    // two servers are now dispatched by path. If that routing were wrong, the existing conversation
    // notifications would break — and they are a different socket, on a different path, with a
    // different vocabulary.
    const pubSub = await openWsClient(await cookieOf(orgAdmin))
    sockets.push(pubSub)
    const answer = await pubSub.subscribe('autonomous-agent-conversations/does-not-exist')

    // The answer must identify WHICH SERVER sent it, which is the whole point. An earlier version of
    // this test accepted `{type:'error'}` — and the agent-session server answers an unknown message
    // type with exactly that, so it passed even with the path matcher stealing every upgrade. The
    // pub/sub server echoes `channel` and sets a `status`; this protocol's error carries neither.
    assert.equal(answer.channel, 'autonomous-agent-conversations/does-not-exist', `answered by the wrong server: ${JSON.stringify(answer)}`)
    assert.equal(typeof answer.status, 'number')
    // 403 for an unknown conversation is correct; what is being asserted is the provenance.
    assert.equal(answer.status, 403)
  })
})
