/**
 * The agent session over a REAL socket, through nginx.
 *
 * The unit spec covers correlation, timeouts and dispatch with a fake transport. This covers the things
 * only a real connection can: that nginx proxies the upgrade, that the path survives the deployment's
 * public prefix, that the session resolves from the cookie, that the SERVER-TO-BROWSER direction works
 * at all — the whole reason this endpoint exists — and that an upgrade on any other path is refused.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl, getAnonymousActionToken } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import WebSocket from 'ws'
import { openAgentSession, type AgentSessionClient } from '../../../dev/agent-session-client.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

const cookieOf = async (ax: any) => await ax.cookieJar.getCookieString(directoryUrl)

test.describe('Agent session socket', () => {
  // Every socket is closed here: a leaked one holds a dev-api connection open AND would break the next
  // test's "exactly one live session" seam, which is how a leak would surface as an unrelated failure.
  const sockets: AgentSessionClient[] = []
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
    assert.deepEqual(await session.next(), { type: 'attached', conversationId: 'c1', anonymous: false, reviewOffered: false })
  })

  test('an anonymous browser is allowed, deliberately', async () => {
    // The chat is open to anonymous users, so the socket must be too. Asserted rather than assumed,
    // because "it happened to work" and "we decided it works" look identical until someone adds a
    // guard. On an account open to them, with an action token: anonymous-chat.api.spec.ts covers
    // the refusals.
    await putMockSettings(admin, 'organization/test1', { quotas: { anonymous: { unlimited: true, monthlyLimit: 0 } } })
    const session = await open()
    session.send({ ...helloWith(['select_row']), account: { type: 'organization', id: 'test1' }, anonymousToken: await getAnonymousActionToken() })
    const attached = await session.next()
    assert.equal(attached.type, 'attached')
    assert.equal(attached.anonymous, true)
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

    // Field-wise rather than deepEqual: the seam also reports durationMs, which the latency reading
    // uses and which must not make every assertion here brittle.
    const outcome = await pending
    assert.equal(outcome.ok, true)
    assert.deepEqual(outcome.result, { selected: 7 })
    assert.equal(typeof outcome.durationMs, 'number')
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
    session.send({ type: 'subscribe', channel: 'conversations/x' })
    const answer = await session.next()
    assert.equal(answer.type, 'error')
    // The pub/sub vocabulary is specifically NOT this protocol's, and the client is told which field
    // was wrong rather than left guessing.
    assert.match(answer.message, /unknown message type "subscribe"/)
  })

  test('a frame over the payload cap closes the socket rather than being read', async () => {
    // ws accepts 100 MiB frames by default, all of it parsed on the main thread.
    const ws = new WebSocket(`ws://localhost:${process.env.NGINX_PORT}/agents/api/agent-session`, {
      headers: { cookie: await cookieOf(orgAdmin) }
    })
    await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject) })
    const closed = new Promise<number>(resolve => ws.once('close', code => resolve(code)))
    ws.send(JSON.stringify({ type: 'prompt', content: 'x'.repeat(4 * 1024 * 1024) }))
    assert.equal(await closed, 1009, 'message too big')
  })

  test('an upgrade on any other path is refused, not left hanging', async () => {
    // This service owns every upgrade on the HTTP server (`noServer` plus its own `upgrade` handler), so
    // one it does not serve has to be answered by it too — or the client waits until it gives up.
    const ws = new WebSocket(`ws://localhost:${process.env.DEV_API_PORT}/api/not-a-socket`, {
      headers: { cookie: await cookieOf(orgAdmin) }
    })
    const status = await new Promise<number | undefined>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('the upgrade was left hanging')), 3000)
      ws.once('unexpected-response', (_req, res) => { clearTimeout(timer); resolve(res.statusCode) })
      ws.once('open', () => { clearTimeout(timer); ws.close(); resolve(101) })
      ws.once('error', () => { clearTimeout(timer); resolve(undefined) })
    })
    assert.equal(status, 404)
  })
})
