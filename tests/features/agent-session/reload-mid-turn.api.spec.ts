/**
 * stateful API tests: a page that attaches while a turn is streaming — a reload, a second tab.
 *
 * The answer is written to the store at the end, not as it streams. What makes that safe is that the
 * turn sends to whoever watches the conversation NOW: a page attaching mid-turn gets the answer so
 * far from memory, then the rest live, then the turn's end. It used to get neither — the turn kept
 * sending to the session it started with, so the reloaded page waited on a pending message forever.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { openAgentSession, type AgentSessionClient } from '../../support/ws.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const OWNER = 'organization/test1'

test.describe('Attaching mid-turn', () => {
  const sockets: AgentSessionClient[] = []

  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, OWNER)
  })
  test.afterEach(() => { for (const socket of sockets.splice(0)) socket.close() })

  const open = async () => {
    const socket = await openAgentSession(await orgAdmin.cookieJar.getCookieString(directoryUrl))
    sockets.push(socket)
    return socket
  }

  const until = async (socket: AgentSessionClient, match: (frame: any) => boolean, seen: any[] = []) => {
    for (;;) {
      const frame = await socket.next(15_000)
      seen.push(frame)
      if (match(frame)) return seen
    }
  }
  const textOf = (parts: any[]) => parts.filter(p => p.type === 'text').map(p => p.text).join('')

  test('a second tab gets the answer so far, then the rest live, then the end', async () => {
    const conversation = (await orgAdmin.post(`/api/conversations/${OWNER}`, { agentId: 'personal', title: 't' })).data
    const first = await open()
    first.send({ type: 'hello', conversationId: conversation.id, tools: [] })
    first.send({ type: 'prompt', content: 'long answer' })
    // A good part of the answer in: the mock streams a character every 10ms.
    let streamed = ''
    await until(first, frame => {
      if (frame.type === 'delta' && frame.kind === 'text') streamed += frame.text
      return streamed.length > 100
    })

    // While it streams, the store holds the pending message without the text: nothing is rewritten
    // per token or on a timer.
    const midway = (await orgAdmin.get(`/api/conversations/${OWNER}/${conversation.id}/messages`)).data.results
    const pending = midway.find((m: any) => m.role === 'assistant')
    assert.equal(pending.pending, true)
    assert.equal(textOf(pending.parts ?? []), '')

    const second = await open()
    second.send({ type: 'hello', conversationId: conversation.id, tools: [] })
    const frames = await until(second, frame => frame.type === 'turn-end')

    // The history replays the STORED pending message first; the live one follows it, same seq, and is
    // the one the client keeps.
    const firstDelta = frames.findIndex(f => f.type === 'delta')
    const live = frames.slice(0, firstDelta === -1 ? frames.length : firstDelta)
      .filter(f => f.type === 'message' && f.role === 'assistant' && f.pending === true).pop()
    assert.ok(live, 'the attach must carry the live answer')
    const sofar = textOf(live.parts)
    assert.ok(sofar.length >= 100, `expected the answer so far, got ${sofar.length} characters`)

    // The rest arrives on THIS socket, and joins up with what the attach carried.
    const rest = frames.filter(f => f.type === 'delta' && f.kind === 'text').map(f => f.text).join('')
    const settled = frames.filter(f => f.type === 'message' && f.role === 'assistant' && f.pending === false).pop()
    assert.ok(settled, 'the settled answer must reach the page that is open')
    assert.equal(sofar + rest, textOf(settled.parts))

    const stored = (await orgAdmin.get(`/api/conversations/${OWNER}/${conversation.id}/messages`)).data.results
    assert.equal(textOf(stored.find((m: any) => m.role === 'assistant').parts), textOf(settled.parts))
  })

  test('a reply stopped mid-sentence keeps what it had said, in the record', async () => {
    // The text is written at the end, so the stop path settles from the turn's memory — reading the
    // store instead would record the reply as nothing but the stop notice.
    const conversation = (await orgAdmin.post(`/api/conversations/${OWNER}`, { agentId: 'personal', title: 't' })).data
    const socket = await open()
    socket.send({ type: 'hello', conversationId: conversation.id, tools: [] })
    socket.send({ type: 'prompt', content: 'long answer' })
    let streamed = ''
    await until(socket, frame => {
      if (frame.type === 'delta' && frame.kind === 'text') streamed += frame.text
      return streamed.length > 100
    })
    socket.send({ type: 'abort' })
    const frames = await until(socket, frame => frame.type === 'turn-end')
    // Stopped for real, on the server: the frame used to be dropped, and the turn ran to the end.
    assert.equal(frames[frames.length - 1].stopReason, 'aborted')

    const stored = (await orgAdmin.get(`/api/conversations/${OWNER}/${conversation.id}/messages`)).data.results
    const answer = stored.find((m: any) => m.role === 'assistant')
    assert.equal(answer.pending, false)
    const text = textOf(answer.parts)
    assert.ok(text.startsWith(streamed), `the stored reply must begin with what was streamed, got: ${text.slice(0, 80)}`)
    // ...and not the whole answer: the mock's is ~450 characters.
    assert.ok(text.length < 400 + 200, `expected a truncated reply plus the stop notice, got ${text.length} characters`)
  })

  test('a socket that only NAMES someone else\'s conversation cannot stop its turn', async () => {
    const conversation = (await orgAdmin.post(`/api/conversations/${OWNER}`, { agentId: 'personal', title: 't' })).data
    const owner = await open()
    owner.send({ type: 'hello', conversationId: conversation.id, tools: [] })
    owner.send({ type: 'prompt', content: 'hello' })

    const other = await axiosAuth('test1-user1', { org: 'test1' })
    const intruder = await openAgentSession(await other.cookieJar.getCookieString(directoryUrl))
    sockets.push(intruder)
    intruder.send({ type: 'hello', conversationId: conversation.id, tools: [] })
    intruder.send({ type: 'abort' })

    const frames = await until(owner, frame => frame.type === 'turn-end')
    assert.equal(frames[frames.length - 1].stopReason, 'completed')

    // Nor watch it: naming the conversation used to register the intruder as its watcher, the
    // ownership check gating only the history — so the owner's next turn streamed to them.
    const intruderSaw: any[] = []
    for (;;) {
      const frame = await intruder.next(500).catch(() => undefined)
      if (!frame) break
      intruderSaw.push(frame)
    }
    assert.deepEqual(intruderSaw.filter(f => ['delta', 'message', 'activity', 'turn-end', 'cost'].includes(f.type)), [])
    assert.ok(intruderSaw.some(f => f.type === 'error'), 'the intruder is told it may not open the conversation')
  })
})
