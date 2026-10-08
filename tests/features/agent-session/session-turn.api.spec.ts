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
import { putMockSettings, mockModels, mockModelMapping } from '../../support/settings.ts'
import { openAgentSession, newThreadHello, type AgentSessionClient } from '../../../dev/agent-session-client.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { turnOverSocket } from '../../../dev/socket-turn.ts'
import { CONSENT_COOKIE, CONSENT_YES } from '../../../ui/src/traces/trace-consent.ts'
import { MongoClient } from 'mongodb'

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

  /** A thread with the PERSONAL assistant that already has a turn in it, started by its first prompt. */
  const personalConversation = async () =>
    (await turnOverSocket(orgAdmin, { agentId: 'personal', title: 'personal' }, 'hello')).conversationId

  /** The stored conversation, as its owner lists it. */
  const storedConversation = async (id: string) =>
    (await orgAdmin.get('/api/conversations/organization/test1?agentId=personal')).data.results.find((c: any) => c.id === id)

  /** Collect frames until one of `type` arrives, returning everything seen. */
  const collectUntil = async (socket: AgentSessionClient, type: string, timeoutMs = 15000) => {
    const frames: any[] = []
    for (;;) {
      const frame = await socket.next(timeoutMs)
      frames.push(frame)
      if (frame.type === type) return frames
    }
  }

  test('the first prompt creates the thread, and the attached frame names it', async () => {
    // One way to start a conversation: a hello naming the agent binds to nothing, and the thread exists
    // from the first message on — so opening a chat and leaving it creates nothing.
    const session = await open(await cookieOf(orgAdmin))
    session.send(newThreadHello())
    const hello = await session.next()
    assert.equal(hello.type, 'attached')
    assert.equal(hello.conversationId, undefined, 'nothing is created by the hello')
    assert.equal((await orgAdmin.get('/api/conversations/organization/test1?agentId=personal')).data.count, 0)

    // The title travels with the prompt that creates the thread: the chat stamps it at send time.
    session.send({ type: 'prompt', content: 'hello', title: 'personal' })
    const created = await session.next()
    assert.equal(created.type, 'attached')
    assert.ok(created.conversationId, 'the attached frame names the new thread')
    const frames = await collectUntil(session, 'turn-end')
    assert.equal(frames[frames.length - 1].stopReason, 'completed')

    // The personal assistant exists without being stored, and a thread with it belongs to its user.
    const conversation = await storedConversation(created.conversationId)
    assert.equal(conversation.agentId, 'personal')
    assert.equal(conversation.userId, 'test1-admin1')
    assert.equal(conversation.title, 'personal')
  })

  test('a person who may not talk to the agent is refused at the hello and at the first prompt, and nothing is created', async () => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Not theirs', persona: 'x', mcpServers: [], enabled: true })).data
    const session = await open(await cookieOf(orgMember))
    session.send(newThreadHello('organization/test1', { agentId: agent.id }))
    assert.equal((await session.next()).type, 'attached')
    // Right away, so the chat can say so when it opens.
    const atHello = await session.next()
    assert.equal(atHello.type, 'error')
    assert.match(atHello.message, /not allowed to instruct/)
    assert.equal(atHello.status, 403)

    session.send({ type: 'prompt', content: 'hello' })
    const atPrompt = await session.next()
    assert.equal(atPrompt.type, 'error')
    assert.match(atPrompt.message, /not allowed to instruct/)
    assert.equal(atPrompt.status, 403)

    const left = (await admin.get(`/api/test-env/autonomous-agent-data/${agent.id}`)).data
    assert.equal(left.conversations, 0)
  })

  test('the consent said in the hello makes the thread reviewable; the cookie alone does not', async () => {
    // The browser keeps the answer in its cookie and SAYS it: the server reads only what it is told.
    const consentCookie = `${await cookieOf(orgAdmin)}; ${CONSENT_COOKIE}=${CONSENT_YES}`
    const startThread = async (hello: Record<string, unknown>) => {
      const session = await open(consentCookie)
      session.send(newThreadHello('organization/test1', hello))
      session.send({ type: 'prompt', content: 'hello' })
      await collectUntil(session, 'turn-end')
      return await storedConversation(session.conversationId()!)
    }
    assert.equal((await startThread({ traceConsent: true })).consentedToReview, true)
    assert.notEqual((await startThread({})).consentedToReview, true, 'a consent cookie on the upgrade is not read')
  })

  test('a prompt runs a turn server-side and streams it to the browser', async () => {
    // The mock answers "hello" with "world". What is being asserted is the PATH: a prompt over the
    // socket starts a server-side turn, whose tokens arrive as deltas and whose end is announced —
    // none of which the browser loop was doing, and none of which needs polling.
    const session = await open(await cookieOf(orgAdmin))
    session.send(newThreadHello())
    assert.equal((await session.next()).type, 'attached')

    session.send({ type: 'prompt', content: 'hello' })
    const frames = await collectUntil(session, 'turn-end')
    const conversation = { id: session.conversationId() }

    const text = frames.filter(f => f.type === 'delta' && f.kind === 'text').map(f => f.text).join('')
    assert.equal(text, 'world', 'the answer must arrive as a token stream, not as one lump at the end')
    assert.equal(frames[frames.length - 1].stopReason, 'completed')

    // And it is stored, because the conversation is the record whether or not anyone was watching.
    const messages = (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${conversation.id}/messages`)).data.results
    assert.deepEqual(messages.map((m: any) => m.role), ['user', 'assistant'])
  })

  test('the turn calls a PAGE tool, and the page\'s answer reaches the model', async () => {
    // The bridge inside a real turn: the model asks for a tool the page declared, the server asks the
    // browser, the browser answers, and the model continues from that answer. The mock's `call tool`
    // seam drives it.
    const session = await open(await cookieOf(orgAdmin))
    session.send(newThreadHello('organization/test1', {
      tools: [{ name: 'select_row', description: 'selects a row on this page', inputSchema: { type: 'object', properties: { id: { type: 'number' } } } }]
    }))
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
    const messages = (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${session.conversationId()}/messages`)).data.results
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
    const session = await open(await cookieOf(orgAdmin))
    session.send(newThreadHello())
    await session.next()
    session.send({ type: 'prompt', content: 'hello' })
    // Gone as soon as the thread exists: its turn has been asked for, not yet started.
    const created = await session.next()
    assert.equal(created.type, 'attached')
    const conversation = { id: created.conversationId }
    session.close()
    await session.closed()

    for (let i = 0; i < 100; i++) {
      const messages = (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${conversation.id}/messages`)).data.results
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
    const first = await open(await cookieOf(orgAdmin))
    first.send(newThreadHello())
    await first.next()
    first.send({ type: 'prompt', content: 'hello' })
    for (;;) { if ((await first.next(15000)).type === 'turn-end') break }
    first.close()
    await first.closed()

    const second = await open(await cookieOf(orgAdmin))
    second.send({ type: 'hello', conversationId: first.conversationId(), tools: [] })
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
    const conversationId = await personalConversation()
    const intruder = await open(await cookieOf(orgMember))
    intruder.send({ type: 'hello', conversationId, tools: [] })
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
    assert.equal(error.status, 403)
    assert.equal(frames.filter(f => f.type === 'message').length, 0, 'and no history may leak')
  })

  test('the page is told what the assistant is doing, in the vocabulary it already renders', async () => {
    // `ChatActivity` straight from shared/agent-activity.ts, so the server produces exactly what
    // `activityLabelKey` consumes and there is no translation layer to drift. The server also knows it
    // better than the browser loop did: it sees the step boundaries and tool results directly rather
    // than inferring them from a stream.
    const session = await open(await cookieOf(orgAdmin))
    session.send(newThreadHello('organization/test1', {
      tools: [{ name: 'select_row', description: 'selects a row', inputSchema: { type: 'object' } }]
    }))
    await session.next()
    session.send({ type: 'prompt', content: 'call tool select_row {}' })

    const activities: any[] = []
    for (;;) {
      const frame = await session.next(15000)
      if (frame.type === 'activity') activities.push(frame.activity)
      if (frame.type === 'tool-call') session.send({ type: 'tool-result', callId: frame.callId, result: 'row selected' })
      if (frame.type === 'turn-end') break
    }

    // A result came back, so the model had something to read.
    assert.ok(activities.some(a => a?.kind === 'analyzing'), `expected an analyzing label, got ${JSON.stringify(activities)}`)
    // And the label is cleared once there is visible output, because then it has nothing left to explain.
    assert.ok(activities.includes(null), 'the label must be cleared when text starts arriving')
  })

  test('a second connection takes the conversation over, and the first is told', async () => {
    // A reload, a second tab, a reconnect — all look the same, and the newest connection is the one the
    // person is looking at. The displaced tab is told rather than silently going deaf.
    const conversationId = await personalConversation()
    const first = await open(await cookieOf(orgAdmin))
    first.send({ type: 'hello', conversationId, tools: [] })
    await first.next()

    const second = await open(await cookieOf(orgAdmin))
    second.send({ type: 'hello', conversationId, tools: [] })

    // Past whatever the attach sent (the history, the conversation's cost): the next ERROR is the one.
    let displaced = await first.next()
    while (displaced.type !== 'error') displaced = await first.next()
    assert.match(displaced.message, /opened somewhere else/)
    assert.equal(displaced.status, 409)
  })

  test('an error frame carries the status of its refusal', async () => {
    const session = await open(await cookieOf(orgAdmin))
    // 400: a malformed frame, refused with the field that was wrong.
    session.send({ type: 'prompt', content: '   ' })
    assert.deepEqual(await session.next(), { type: 'error', status: 400, message: 'content must be a non-blank string' })
    // 404: a conversation that does not exist.
    session.send({ type: 'hello', conversationId: 'no-such-conversation', tools: [] })
    assert.equal((await session.next()).type, 'attached')
    assert.deepEqual(await session.next(), { type: 'error', status: 404, message: 'unknown conversation' })
  })

  test('a hello and two prompts sent back to back make one thread, with both messages in order', async () => {
    // The client does not wait for `attached` before its first prompt, and a person can type twice:
    // frames are handled in order, so only the first prompt creates the thread.
    const session = await open(await cookieOf(orgAdmin))
    session.send(newThreadHello())
    session.send({ type: 'prompt', content: 'slow hello' })
    session.send({ type: 'prompt', content: 'second' })
    // The first answers slowly, so it is still running — live, or still waiting for the
    // conversation's lock — when the second message arrives, which takes the turn back.
    const frames: any[] = []
    const isSecond = (f: any) => f.type === 'message' && f.role === 'user' && f.parts.some((p: any) => p.text === 'second')
    for (;;) {
      const frame = await session.next(15000)
      frames.push(frame)
      if (frame.type === 'turn-end' && frames.some(isSecond) && frame.stopReason === 'completed') break
    }
    const threads = frames.filter(f => f.type === 'attached' && f.conversationId).map(f => f.conversationId)
    assert.equal(new Set(threads).size, 1, 'one thread')
    const listed = (await orgAdmin.get('/api/conversations/organization/test1?agentId=personal')).data.results
    assert.deepEqual(listed.map((c: any) => c.id), [threads[0]])
    const messages = (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${threads[0]}/messages`)).data.results
    const userTexts = messages.filter((m: any) => m.role === 'user').map((m: any) => m.parts.find((p: any) => p.type === 'text')?.text)
    assert.deepEqual(userTexts, ['slow hello', 'second'])
    // The first turn was stopped by the second message, not left to answer the question before.
    const runs = (await orgAdmin.get(`/api/conversations/organization/test1/${threads[0]}/runs`)).data.results
      .sort((a: any, b: any) => a.startedAt.localeCompare(b.startedAt))
    assert.deepEqual(runs.map((r: any) => r.status), ['aborted', 'done'])
    const interrupted = messages.find((m: any) => m.role === 'assistant')
    assert.ok(interrupted, 'the stopped turn still leaves its assistant message')
  })

  test('a run stopped while still queued runs no gate: the next message is moderated once', async () => {
    // The back-to-back case above, forced into the state it usually takes and that its timing cannot
    // guarantee: the first run is stopped by the second message BEFORE it is dequeued. Such a run
    // used to pass its gates anyway, and moderation classifies the conversation's LATEST message —
    // the second one, which its own run classifies again: billed twice, and a block was two strikes.
    // The account moderates its admins here, with the deterministic mock moderator, so the gate runs.
    const moderator = { id: 'mock-moderator', name: 'Mock Moderator', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }
    await putMockSettings(admin, 'organization/test1', {
      models: [...mockModels(), { model: moderator, usage: ['moderator'], inputPricePerMillion: 0, outputPricePerMillion: 0 }],
      modelMapping: { ...mockModelMapping, moderator: { provider: 'mock-provider', id: 'mock-moderator', name: 'Mock Moderator' } },
      moderation: { enabled: true, categories: ['admin'] }
    })
    const conversationId = await personalConversation()
    const runsOf = async () => (await orgAdmin.get(`/api/conversations/organization/test1/${conversationId}/runs`)).data.results
    const events = async () => (await admin.get('/api/moderation/organization/test1/events')).data.results
    // Events are written fire-and-forget: wait for the first turn's one before counting from it.
    let before: any[] = []
    for (let i = 0; i < 40 && !before.length; i++) {
      before = await events()
      if (!before.length) await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.equal(before.length, 1, 'the first turn was moderated, so the gate is on')

    // Held, so neither prompt's run can start: both stay queued, and the second stops the first.
    await admin.post('/api/test-env/lock-conversation', { conversationId })
    const session = await open(await cookieOf(orgAdmin))
    try {
      session.send({ type: 'hello', conversationId, tools: [] })
      session.send({ type: 'prompt', content: 'first' })
      session.send({ type: 'prompt', content: 'second' })
      for (let i = 0; i < 50 && (await runsOf()).length < 3; i++) await new Promise(resolve => setTimeout(resolve, 100))
      assert.equal((await runsOf()).length, 3)
    } finally {
      await admin.post('/api/test-env/unlock-conversation', { conversationId })
    }
    // Recovery picks the queued runs up, oldest first: the stopped one, then the second message's.
    await admin.post('/api/test-env/recover-ownerless-runs', {})
    let runs: any[] = []
    for (let i = 0; i < 100; i++) {
      runs = await runsOf()
      if (runs.every((r: any) => r.status !== 'running')) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    const [, stopped, answered] = runs
    assert.equal(stopped.status, 'aborted')
    assert.equal(answered.status, 'done')
    assert.deepEqual(stopped.calls ?? [], [], 'the stopped run made no model call, the moderator included')
    assert.ok(!stopped.credits, 'and spent nothing')
    assert.ok(answered.calls.some((c: any) => c.modelRole === 'moderator'), 'the answering run did moderate')
    await new Promise(resolve => setTimeout(resolve, 500))
    assert.equal((await events()).length, 2, 'one moderation of the second message, not two')
    // One assistant message per run still holds for the run that did nothing.
    const messages = (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`)).data.results
    assert.equal(messages.filter((m: any) => m.role === 'assistant' && m.runId === stopped.id).length, 1)
  })

  test('the history does not list a thread that has no message', async () => {
    // A backstop: a thread whose first prompt's socket closed mid-creation is created but never
    // spoken in. Written straight to the store, since that window cannot be hit reliably from here.
    const listedId = await personalConversation()
    const client = new MongoClient(`mongodb://localhost:${process.env.MONGO_PORT}/data-fair-agents-development`)
    try {
      await client.db().collection('conversations').insertOne({
        id: 'test-empty-thread',
        agentId: 'personal',
        owner: { type: 'organization', id: 'test1' },
        userId: 'test1-admin1',
        title: 'never spoken in',
        createdAt: new Date().toISOString(),
        messageSeq: 0,
        credits: 0
      })
    } finally {
      await client.close()
    }
    const listed = (await orgAdmin.get('/api/conversations/organization/test1')).data.results.map((c: any) => c.id)
    assert.deepEqual(listed, [listedId])
  })
})
