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
import { openAgentSession, newThreadHello, type AgentSessionClient } from '../../../dev/agent-session-client.ts'

const admin = await superAdmin
const user = await axiosAuth('test-standalone1')

const OWNER = 'user/test-standalone1'
const cookieOf = async (ax: any) => await ax.cookieJar.getCookieString(directoryUrl)

test.describe('Host context reaching the model', () => {
  const sockets: AgentSessionClient[] = []
  // NO MCP FIXTURE, deliberately: the personal assistant takes the whole catalog, and an unreachable entry
  // is SKIPPED rather than fatal for it (`onServerError: 'skip'`). Nothing here calls an MCP tool —
  // host state needs none and the wait tool is loop-provided — so starting a server on the shared
  // fixture port only adds a teardown that can hang.
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, OWNER)
  })
  test.afterEach(() => { for (const socket of sockets.splice(0)) socket.close() })

  /** A socket ready to start a fresh conversation, which its first prompt creates. */
  const openSession = async (hello: Record<string, unknown> = {}) => {
    const socket = await openAgentSession(await cookieOf(user))
    sockets.push(socket)
    socket.send(newThreadHello(OWNER, hello))
    await socket.next()
    // Per conversation: seqs restart at 1 for a fresh thread, so a tracker carried across tests
    // would reject every frame of the next one.
    lastAnsweredSeq = 0
    return { socket }
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
    // A keyed report is retained as state AND buffered as an event, so both blocks used to carry it and
    // the model read the same fact twice in one turn. The state block alone reports it now (unkeyed
    // events still go in the events block): see withHostContext, and its unit test for the exact rule.
    const { socket } = await openSession()
    socket.send({ type: 'host-state', state: { page: 'datasets' } })
    socket.send({ type: 'host-events', events: [{ name: 'clicked save', at: Date.now() }] })

    const answer = await ask(socket, 'where am i')
    // `where am i` prefers the state block, which proves the state is there; the event rides in the
    // same turn's hidden context and is drained with it.
    assert.match(answer, /- page: datasets/)
    assert.doesNotMatch(await ask(socket, 'what happened'), /clicked save/, 'already delivered')
  })

  test('the run records what the page said and what the model could call', async () => {
    // Neither is in the conversation: host blocks are folded in at call time and not stored, and the
    // stored turn records the calls made, never the tools offered. So the run's telemetry is the only
    // place a reader — the export, a simulation judge — can learn either.
    const { socket } = await openSession({ tools: [{ name: 'select_row', description: 'selects a row', inputSchema: { type: 'object' } }] })
    socket.send({ type: 'host-state', state: { page: 'the datasets list' } })
    await ask(socket, 'hello')
    const conversationId = socket.conversationId()
    // The answer's settled frame is sent by the loop, BEFORE the run's close writes its telemetry;
    // `turn-end` is the frame that promises the record is written.
    for (let i = 0; i < 100 && (await socket.next(20_000)).type !== 'turn-end'; i++);

    const runs = (await user.get(`/api/conversations/${OWNER}/${conversationId}/runs`)).data.results as any[]
    const call = runs[0].calls.find((c: any) => c.modelRole === 'assistant')
    assert.ok(call.hostBlockChars > 'the datasets list'.length, `host blocks measured, got ${call.hostBlockChars}`)
    assert.ok(call.toolNames.includes('wait_for_user_action'), `the offered tools, got ${JSON.stringify(call.toolNames)}`)
    assert.deepEqual(call.toolNames, [...call.toolNames].sort())
    // And where each came from, which the names alone cannot say (shared/tool-source.ts).
    assert.deepEqual(call.toolSources.select_row, { kind: 'page' })
    assert.equal(call.toolSources.wait_for_user_action.kind, 'service')
    assert.deepEqual(Object.keys(call.toolSources).sort(), call.toolNames)
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

    // A hello for a fresh thread is the reset, as the chat's "new conversation" sends it.
    socket.send(newThreadHello(OWNER))
    await socket.next()

    const answer = await ask(socket, 'where am i')
    assert.match(answer, /- page: the datasets list/, 'retained state is still true of the page')
    assert.doesNotMatch(await ask(socket, 'what happened'), /clicked save/, 'buffered events did not cross')
  })
})
