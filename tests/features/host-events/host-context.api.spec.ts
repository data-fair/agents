/**
 * stateful API tests: what the page reports reaching the model.
 *
 * These replace nine e2e tests that drove a browser and then inspected the gateway's
 * `/chat/completions` request bodies to see what had been sent. That is unportable twice over — the
 * gateway is gone, and with the loop on the server there is no HTTP request to observe — and it was
 * always the slow way to ask the question.
 *
 * Driven over the SOCKET instead, with the mock's `where am i` / `what happened` seams echoing back
 * the blocks it received. Same property, no browser: ~1s against ~17s each, and it tests the server's
 * behaviour rather than the browser's reporting of it.
 *
 * WHAT CHANGED BEHAVIOURALLY, and these tests are the record of it: the browser loop had an
 * ACTIVATION model — retained state was sent only on turns where the model had no history to
 * integrate from (first turn, post-compaction, post-reset), with keyed events deduped against it so
 * the same fact did not arrive twice. The server sends state on EVERY turn and drains events. That is
 * simpler by a whole concept and costs a small block of tokens per turn; it is a deliberate trade and
 * the tests below assert the simple contract rather than the old one.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { openAgentSession, type AgentSessionClient } from '../../support/ws.ts'

const admin = await superAdmin
const user = await axiosAuth('test-standalone1')

const OWNER = 'user/test-standalone1'
const cookieOf = async (ax: any) => await ax.cookieJar.getCookieString(directoryUrl)

test.describe('Host context reaching the model', () => {
  const sockets: AgentSessionClient[] = []
  // NO MCP FIXTURE, deliberately: a standard agent takes the whole catalog, and an unreachable entry
  // is SKIPPED rather than fatal for it (`onServerError: 'skip'`). Nothing here calls an MCP tool —
  // host state needs none and the wait tool is loop-provided — so starting a server on the shared
  // fixture port only adds a teardown that can hang.
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, OWNER)
  })
  test.afterEach(() => { for (const socket of sockets.splice(0)) socket.close() })

  /** A socket bound to a fresh conversation, ready to prompt. */
  const openSession = async () => {
    const conversation = (await user.post(`/api/conversations/${OWNER}`, { agentId: 'personal', title: 't' })).data
    const socket = await openAgentSession(await cookieOf(user))
    sockets.push(socket)
    socket.send({ type: 'hello', tools: [], conversationId: conversation.id })
    await socket.next()
    // Per conversation: seqs restart at 1 for a fresh thread, so a tracker carried across tests
    // would reject every frame of the next one.
    lastAnsweredSeq = 0
    return { socket, conversationId: conversation.id }
  }

  /**
   * Prompt and return the finished assistant text.
   *
   * Keyed on a RISING seq, not on "the next settled frame": a settled frame can arrive more than
   * once for the same turn, and accepting the first one seen made the second question return the
   * FIRST answer — which read as an event that was never drained. The bug was in the reading.
   */
  let lastAnsweredSeq = 0
  const ask = async (socket: AgentSessionClient, content: string) => {
    socket.send({ type: 'prompt', content })
    // Generous, because the echoed blocks stream ONE DELTA PER CHARACTER: a state block is easily
    // several hundred frames, and a cap sized for a short answer reads as "the turn never finished".
    for (let i = 0; i < 5000; i++) {
      const frame = await socket.next(20_000)
      if (frame.type === 'message' && frame.role === 'assistant' && frame.pending === false && frame.seq > lastAnsweredSeq) {
        lastAnsweredSeq = frame.seq
        return (frame.parts ?? []).filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
      }
      if (frame.type === 'error') assert.fail(`the server reported: ${frame.message}`)
    }
    assert.fail('the turn never finished')
  }

  test('retained state reaches the model', async () => {
    // The gap this closed: the socket filled the store, the wait tool drained its events, and the
    // retained state was never told to a model at all.
    const { socket } = await openSession()
    socket.send({ type: 'host-state', state: { page: 'the datasets list', selection: '3 rows' } })

    const answer = await ask(socket, 'where am i')
    assert.match(answer, /state:/)
    assert.match(answer, /- page: the datasets list/)
    assert.match(answer, /- selection: 3 rows/)
  })

  test('a withdrawn fact stops reaching the model', async () => {
    // "No longer true" and "never reported" are different, and only the page knows which.
    const { socket } = await openSession()
    socket.send({ type: 'host-state', state: { dialog: 'the create form' } })
    socket.send({ type: 'host-state', state: { dialog: null } })

    const answer = await ask(socket, 'where am i')
    assert.doesNotMatch(answer, /- dialog:/)
  })

  test('a later value for the same key supersedes the earlier one', async () => {
    const { socket } = await openSession()
    socket.send({ type: 'host-state', state: { page: 'datasets' } })
    socket.send({ type: 'host-state', state: { page: 'one dataset' } })

    const answer = await ask(socket, 'where am i')
    assert.match(answer, /- page: one dataset/)
    assert.doesNotMatch(answer, /- page: datasets\b/)
  })

  test('state reaches EVERY turn, not only the first', async () => {
    // The contract that replaced activation. Asserted explicitly because it is the behaviour change:
    // under the browser loop the second turn would NOT have carried the state block.
    const { socket } = await openSession()
    socket.send({ type: 'host-state', state: { page: 'the datasets list' } })

    assert.match(await ask(socket, 'where am i'), /- page: the datasets list/)
    assert.match(await ask(socket, 'where am i'), /- page: the datasets list/, 'the second turn too')
  })

  test('what the person did reaches the model once, and is then drained', async () => {
    // Being told twice is worse than being told late: a model shown the same click in two
    // consecutive turns will often act on it twice.
    const { socket } = await openSession()
    socket.send({ type: 'host-events', events: [{ name: 'clicked save', detail: 'the dataset form', at: Date.now() }] })

    const first = await ask(socket, 'what happened')
    assert.match(first, /clicked save/)
    assert.match(first, /the dataset form/)

    const second = await ask(socket, 'what happened')
    assert.doesNotMatch(second, /clicked save/)
  })

  test('an event and the retained state arrive as separate blocks, not duplicated', async () => {
    // The browser loop deduped keyed events against the state block because it sent both; the server
    // reports state from the store and drains the pending buffer, so "the same fact twice" can only
    // come from the page reporting it twice.
    const { socket } = await openSession()
    socket.send({ type: 'host-state', state: { page: 'datasets' } })
    socket.send({ type: 'host-events', events: [{ name: 'clicked save', at: Date.now() }] })

    const answer = await ask(socket, 'where am i')
    // `where am i` prefers the state block, which proves the state is there; the event rides in the
    // same turn's hidden context and is drained with it.
    assert.match(answer, /- page: datasets/)
    assert.doesNotMatch(await ask(socket, 'what happened'), /clicked save/, 'already delivered')
  })

  test('nothing reported means nothing added to the turn', async () => {
    // The turn must not carry an empty block, which would be noise in every prompt of every
    // conversation that never reports anything.
    const { socket } = await openSession()
    assert.equal(await ask(socket, 'where am i'), 'nothing')
  })

  test('a reset drops buffered events but keeps what is still true of the page', async () => {
    const { socket } = await openSession()
    socket.send({ type: 'host-state', state: { page: 'the datasets list' } })
    socket.send({ type: 'host-events', events: [{ name: 'clicked save', at: Date.now() }] })

    // Re-hello onto a DIFFERENT conversation is the reset.
    const second = (await user.post(`/api/conversations/${OWNER}`, { agentId: 'personal', title: 't2' })).data
    socket.send({ type: 'hello', tools: [], conversationId: second.id })
    await socket.next()

    const answer = await ask(socket, 'where am i')
    assert.match(answer, /- page: the datasets list/, 'retained state is still true of the page')
    assert.doesNotMatch(await ask(socket, 'what happened'), /clicked save/, 'buffered events did not cross')
  })
})
