/**
 * A turn, run server-side, streamed to the browser, calling the page's own tools.
 *
 * This is the prototype's central claim in one place: the SAME loop that serves a configured agent
 * serves the personal assistant, which has no non-human identity and acts as the person whose socket
 * it is — differing by one lookup rather than by a second implementation.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { openAgentSession, type AgentSessionClient } from '../../support/ws.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const orgMember = await axiosAuth('test1-user1', { org: 'test1' })

const cookieOf = async (ax: any) => await ax.cookieJar.getCookieString(directoryUrl)

test.describe('A turn over the agent session', () => {
  const sockets: AgentSessionClient[] = []
  // The personal assistant reaches EVERY catalog entry, so the dev catalog's servers have to be up for
  // its turns to work at all — see the `one unreachable catalog entry` test below, which is about
  // exactly that coupling.
  let fixture: McpFixture

  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })
  test.afterEach(() => { for (const socket of sockets.splice(0)) socket.close() })

  const open = async (cookie?: string) => {
    const socket = await openAgentSession(cookie)
    sockets.push(socket)
    return socket
  }

  /** A conversation with the PERSONAL assistant — the reserved agent id, resolved rather than stored. */
  const personalConversation = async () =>
    (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', {
      autonomousAgentId: 'personal', title: 'personal'
    })).data

  /** Collect frames until one of `type` arrives, returning everything seen. */
  const collectUntil = async (socket: AgentSessionClient, type: string, timeoutMs = 15000) => {
    const frames: any[] = []
    for (;;) {
      const frame = await socket.next(timeoutMs)
      frames.push(frame)
      if (frame.type === type) return frames
    }
  }

  test('the personal assistant exists without being stored, and a thread with it belongs to its user', async () => {
    const conversation = await personalConversation()
    assert.equal(conversation.autonomousAgentId, 'personal')
    assert.equal(conversation.userId, 'test1-admin1')
  })

  test('a prompt runs a turn server-side and streams it to the browser', async () => {
    // The mock answers "hello" with "world". What is being asserted is the PATH: a prompt over the
    // socket starts a server-side turn, whose tokens arrive as deltas and whose end is announced —
    // none of which the browser loop was doing, and none of which needs polling.
    const conversation = await personalConversation()
    const session = await open(await cookieOf(orgAdmin))
    session.send({ type: 'hello', conversationId: conversation.id, tools: [] })
    assert.equal((await session.next()).type, 'attached')

    session.send({ type: 'prompt', content: 'hello' })
    const frames = await collectUntil(session, 'turn-end')

    const text = frames.filter(f => f.type === 'delta' && f.kind === 'text').map(f => f.text).join('')
    assert.equal(text, 'world', 'the answer must arrive as a token stream, not as one lump at the end')
    assert.equal(frames[frames.length - 1].stopReason, 'completed')

    // And it is stored, because the conversation is the record whether or not anyone was watching.
    const messages = (await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1/${conversation.id}/messages`)).data.results
    assert.deepEqual(messages.map((m: any) => m.role), ['user', 'assistant'])
  })

  test('the turn calls a PAGE tool, and the page\'s answer reaches the model', async () => {
    // The bridge inside a real turn: the model asks for a tool the page declared, the server asks the
    // browser, the browser answers, and the model continues from that answer. The mock's `call tool`
    // seam drives it.
    const conversation = await personalConversation()
    const session = await open(await cookieOf(orgAdmin))
    session.send({
      type: 'hello',
      conversationId: conversation.id,
      tools: [{ name: 'select_row', description: 'selects a row on this page', inputSchema: { type: 'object', properties: { id: { type: 'number' } } } }]
    })
    await session.next()

    session.send({ type: 'prompt', content: 'call tool select_row {"id":7}' })

    // Answer the call when it comes, then keep collecting to the end of the turn.
    let asked: any
    const frames: any[] = []
    for (;;) {
      const frame = await session.next(15000)
      frames.push(frame)
      if (frame.type === 'tool-call') {
        asked = frame
        session.send({ type: 'tool-result', callId: frame.callId, result: 'row 7 is selected' })
      }
      if (frame.type === 'turn-end') break
    }

    assert.ok(asked, 'the server must have asked the browser to run the page tool')
    assert.equal(asked.name, 'select_row')
    assert.deepEqual(asked.input, { id: 7 })

    // The record proves the model got the answer: the stored call carries the page's result, inside the
    // provenance envelope, exactly as an MCP tool's would.
    const messages = (await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1/${conversation.id}/messages`)).data.results
    const assistant = messages.find((m: any) => m.role === 'assistant')
    const call = (assistant.parts ?? []).find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'select_row')
    assert.ok(call, 'the page tool call must be in the conversation record')
    assert.equal(call.state, 'output-available')
    assert.match(String(call.output), /row 7 is selected/)
    assert.match(String(call.output), /<tool-result server="the-page" tool="select_row">/)
  })

  test('losing the socket before the turn starts costs it its session-authenticated tools, SILENTLY', async () => {
    // Finding 1, as it actually behaves once unreachable catalog entries are skipped rather than fatal.
    //
    // For the personal assistant the credential IS the socket. A tab closed before the turn begins
    // leaves it with no session, so every entry whose auth is `nhi-session` is refused — and now
    // SKIPPED rather than failing the turn. So the turn completes and answers, with fewer tools than it
    // would have had, and nothing in the answer says so.
    //
    // That is a real trade and not obviously the right one: failing loudly told the person something
    // was wrong, where this quietly narrows what the assistant can do. Recorded in §5b rather than
    // resolved here, because the skip decision currently conflates "the server is down" with "we have
    // no credential for it", and only the first is an availability event.
    const conversation = await personalConversation()
    const session = await open(await cookieOf(orgAdmin))
    session.send({ type: 'hello', conversationId: conversation.id, tools: [] })
    await session.next()
    session.send({ type: 'prompt', content: 'hello' })
    session.close()
    await session.closed()

    for (let i = 0; i < 100; i++) {
      const messages = (await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1/${conversation.id}/messages`)).data.results
      const assistant = messages.find((m: any) => m.role === 'assistant')
      if (assistant && assistant.pending === false) {
        const text = assistant.parts.find((p: any) => p.type === 'text')?.text ?? ''
        // The invariant holds whatever happened: a terminal message, never a silence.
        assert.ok(text.length > 0, 'a blank bubble is the silence this forbids')
        assert.equal(text, 'world', 'the turn completes — the capability loss is what is silent')
        return
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error('the turn never reached a terminal state with nobody watching')
  })

  test('attaching replays the transcript so far, as ordinary message frames', async () => {
    // Needed for any port of the real chat: the socket only carries what happens from now on, so
    // without this a reload shows an empty pane. Replayed as `message` frames so a client has one code
    // path for "render this turn" whether it arrived live or was loaded.
    const conversation = await personalConversation()
    const first = await open(await cookieOf(orgAdmin))
    first.send({ type: 'hello', conversationId: conversation.id, tools: [] })
    await first.next()
    first.send({ type: 'prompt', content: 'hello' })
    for (;;) { if ((await first.next(15000)).type === 'turn-end') break }
    first.close()
    await first.closed()

    const second = await open(await cookieOf(orgAdmin))
    second.send({ type: 'hello', conversationId: conversation.id, tools: [] })
    const frames: any[] = []
    for (let i = 0; i < 6; i++) {
      frames.push(await second.next(5000))
      if (frames.filter(f => f.type === 'message').length >= 2) break
    }
    const messages = frames.filter(f => f.type === 'message')
    assert.deepEqual(messages.map(m => m.role), ['user', 'assistant'])
    assert.deepEqual(messages.map(m => m.pending), [false, false], 'a finished turn must not replay as pending')
    const assistant = messages.find(m => m.role === 'assistant')
    assert.equal((assistant.parts as any[]).find(p => p.type === 'text')?.text, 'world')
  })

  test('someone elses conversation cannot be attached to', async () => {
    // The ownership check the HTTP routes apply, applied on the socket too — and reported rather than
    // leaving the client to guess why no history arrived.
    const conversation = await personalConversation()
    const intruder = await open(await cookieOf(orgMember))
    intruder.send({ type: 'hello', conversationId: conversation.id, tools: [] })
    // Collected until the refusal, rather than a fixed count: only `attached` and the error arrive, so
    // reading a third frame would time out on a passing run.
    const frames: any[] = []
    for (let i = 0; i < 4; i++) {
      const frame = await intruder.next(5000)
      frames.push(frame)
      if (frame.type === 'error') break
    }
    const error = frames.find(f => f.type === 'error')
    assert.ok(error, `expected a refusal, got ${JSON.stringify(frames)}`)
    assert.match(error.message, /belongs to someone else/)
    assert.equal(frames.filter(f => f.type === 'message').length, 0, 'and no history may leak')
  })

  test('a second connection takes the conversation over, and the first is told', async () => {
    // A reload, a second tab, a reconnect — all look the same, and the newest connection is the one the
    // person is looking at. The displaced tab is told rather than silently going deaf.
    const conversation = await personalConversation()
    const first = await open(await cookieOf(orgAdmin))
    first.send({ type: 'hello', conversationId: conversation.id, tools: [] })
    await first.next()

    const second = await open(await cookieOf(orgAdmin))
    second.send({ type: 'hello', conversationId: conversation.id, tools: [] })

    const displaced = await first.next()
    assert.equal(displaced.type, 'error')
    assert.match(displaced.message, /opened somewhere else/)
  })
})
