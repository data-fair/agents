/**
 * stateful API tests: an anonymous visitor chats over the agent session.
 *
 * The gateway served anonymous chat until the loop moved to the server; the socket then refused it.
 * An anonymous thread is stored (the loop reads and writes through the collections) but scoped to the
 * socket that created it: only that socket can use it, and it is purged when the socket closes. Its
 * turns are charged per IP, in the untrusted pool, like the gateway's were.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean, defaultQuotas, getAnonymousActionToken, nginxAx } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'
import { openAgentSession, type AgentSessionClient } from '../../support/ws.ts'

const admin = await superAdmin

const OWNER = { type: 'user', id: 'test-standalone1' } as const
const OWNER_PATH = 'user/test-standalone1'

const settingsData = (quotas: any = {}) => ({
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: [{
    model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
    usage: ['assistant'],
    inputPricePerMillion: 8_000,
    outputPricePerMillion: 8_000
  }],
  modelMapping: { assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' } },
  quotas: { ...defaultQuotas, anonymous: { unlimited: false, monthlyLimit: 100_000 }, ...quotas }
})

test.describe('Anonymous chat over the agent session', () => {
  const sockets: AgentSessionClient[] = []

  test.beforeEach(async () => {
    await clean()
    await putSettings(admin, OWNER_PATH, settingsData())
  })
  test.afterEach(() => { for (const socket of sockets.splice(0)) socket.close() })

  const open = async () => {
    const socket = await openAgentSession()
    sockets.push(socket)
    return socket
  }

  /** Frames until one matches, failing on an error frame unless that is what is awaited. */
  const until = async (socket: AgentSessionClient, match: (frame: any) => boolean) => {
    for (let i = 0; i < 500; i++) {
      const frame = await socket.next(20_000)
      if (match(frame)) return frame
      if (frame.type === 'error') assert.fail(`unexpected error frame: ${frame.message}`)
    }
    assert.fail('never saw the awaited frame')
  }

  const hello = async (socket: AgentSessionClient, extra: Record<string, unknown> = {}) => {
    socket.send({ type: 'hello', tools: [], account: OWNER, anonymousToken: await getAnonymousActionToken(), ...extra })
  }

  /** The thread as an admin sees it: 404 once purged. */
  const adminReads = async (conversationId: string) =>
    (await admin.get(`/api/conversations/${OWNER_PATH}/${conversationId}/messages`).catch((err: any) => err.response ?? err)).status

  test('a visitor gets a thread of their own and an answer', async () => {
    const socket = await open()
    await hello(socket)
    // Prompted straight after the hello, as the chat does: the frames are handled in order, so the
    // prompt finds the thread the hello is still creating.
    socket.send({ type: 'prompt', content: 'hello' })
    const attached = await until(socket, f => f.type === 'attached')
    assert.equal(attached.anonymous, true)
    assert.ok(attached.conversationId && attached.conversationId !== 'pending')

    const answer = await until(socket, f => f.type === 'message' && f.role === 'assistant' && f.pending === false)
    const text = answer.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
    assert.equal(text, 'world')
    await until(socket, f => f.type === 'turn-end')
  })

  test('the thread is gone once the socket closes', async () => {
    const socket = await open()
    await hello(socket)
    socket.send({ type: 'prompt', content: 'hello' })
    const { conversationId } = await until(socket, f => f.type === 'attached')
    await until(socket, f => f.type === 'turn-end')
    assert.equal(await adminReads(conversationId), 200)

    socket.close()
    for (let i = 0; i < 50 && await adminReads(conversationId) !== 404; i++) await new Promise(resolve => setTimeout(resolve, 100))
    assert.equal(await adminReads(conversationId), 404)
  })

  test('another socket cannot bind to the thread: naming it starts a thread of its own', async () => {
    const first = await open()
    await hello(first)
    const { conversationId } = await until(first, f => f.type === 'attached')

    const second = await open()
    await hello(second, { conversationId })
    const attached = await until(second, f => f.type === 'attached')
    assert.notEqual(attached.conversationId, conversationId)
  })

  test('a new hello on the same socket is a reset: the previous thread is purged', async () => {
    const socket = await open()
    await hello(socket)
    const first = await until(socket, f => f.type === 'attached')
    await hello(socket)
    const second = await until(socket, f => f.type === 'attached')
    assert.notEqual(second.conversationId, first.conversationId)
    assert.equal(await adminReads(first.conversationId), 404)
  })

  test('without an anonymous action token the hello is refused', async () => {
    const socket = await open()
    socket.send({ type: 'hello', tools: [], account: OWNER })
    const frame = await socket.next(10_000)
    assert.equal(frame.type, 'error')
    assert.match(frame.message, /anonymous action token/)
  })

  test('an account closed to anonymous visitors refuses the hello', async () => {
    await putSettings(admin, OWNER_PATH, settingsData({ anonymous: { unlimited: false, monthlyLimit: 0 } }))
    const socket = await open()
    await hello(socket)
    const frame = await socket.next(10_000)
    assert.equal(frame.type, 'error')
    assert.match(frame.message, /permission/)
  })

  test('only a standard agent', async () => {
    const socket = await open()
    await hello(socket, { agentId: 'some-configured-agent' })
    const frame = await socket.next(10_000)
    assert.equal(frame.type, 'error')
    assert.match(frame.message, /standard agent/)
  })

  test('the turn is charged per IP, where the self-usage route reads it back', async () => {
    const socket = await open()
    await hello(socket)
    socket.send({ type: 'prompt', content: 'hello' })
    await until(socket, f => f.type === 'turn-end')

    // Through nginx like the socket, so the per-IP key is derived from the same forwarded address.
    const self = await nginxAx.get(`/api/usage/${OWNER_PATH}/self`, { headers: { 'x-anonymous-token': await getAnonymousActionToken() } })
    assert.equal(self.data.role, 'anonymous')
    assert.ok(self.data.quota.daily.used > 0)
  })
})
