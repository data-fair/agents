/**
 * stateful API tests: a turn the person interrupts keeps its work in the history the model is sent.
 *
 * Port of main's #73/#75 coverage. There, the e2e test read the browser's /chat/completions request
 * to see what the model was sent; that request no longer exists, so the mock's `what did you see`
 * seam reports the same facts from the request the SERVER builds: the calls in the history, their
 * results, which results say they were interrupted, and whether the reminder reached the person's
 * message.
 *
 * The failure this guards is concrete. A call with no result is dropped on replay, so a turn stopped
 * mid-wait vanished from the model's view: judged runs saw the person's two messages with nothing
 * between, denied work they had done and redid it — and, told to wait again only in a result that sat
 * before the new question, answered the question and never waited again.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { openAgentSession, type AgentSessionClient } from '../../support/ws.ts'

const admin = await superAdmin
const user = await axiosAuth('test-standalone1')

const OWNER = 'user/test-standalone1'
const SPOKE_DURING_WAIT = 'Interrupted: the person wrote to you while you were waiting for them (you to click Create).'
const STOPPED = 'Interrupted: the person stopped the reply before this finished.'

test.describe('An interrupted turn in the history sent next', () => {
  const sockets: AgentSessionClient[] = []

  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, OWNER)
  })
  test.afterEach(() => { for (const socket of sockets.splice(0)) socket.close() })

  const openSession = async () => {
    const conversation = (await user.post(`/api/conversations/${OWNER}`, { agentId: 'personal', title: 't' })).data
    const socket = await openAgentSession(await user.cookieJar.getCookieString(directoryUrl))
    sockets.push(socket)
    socket.send({ type: 'hello', tools: [], conversationId: conversation.id })
    await socket.next()
    return { socket, conversationId: conversation.id as string }
  }

  /** Frames until `done` holds for everything seen so far (publication order is not a contract). */
  const collect = async (socket: AgentSessionClient, done: (frames: any[]) => boolean, cap = 5000) => {
    const frames: any[] = []
    for (let i = 0; i < cap; i++) {
      frames.push(await socket.next(20_000))
      if (done(frames)) return frames
    }
    assert.fail(`never saw what was waited for; last was ${JSON.stringify(frames.at(-1))}`)
  }
  const sawWaiting = (frames: any[]) => frames.some(f => f.type === 'activity' && f.activity?.kind === 'waiting')

  /** The `what did you see` answer of the latest settled assistant message, parsed. */
  const seen = (frames: any[]) => {
    const settled = frames.filter(f => f.type === 'message' && f.role === 'assistant' && f.pending === false)
    for (const frame of [...settled].reverse()) {
      const text = (frame.parts ?? []).filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
      try { return JSON.parse(text) } catch { /* not the report */ }
    }
    return undefined
  }

  const assistantMessages = async (conversationId: string) =>
    (await user.get(`/api/conversations/${OWNER}/${conversationId}/messages`)).data.results
      .filter((m: any) => m.role === 'assistant')

  test('speaking during a wait: the wait keeps a result, and the reminder is the last thing read', async () => {
    const { socket, conversationId } = await openSession()
    socket.send({ type: 'prompt', content: 'wait for me' })
    await collect(socket, sawWaiting)

    // The person writes instead of pressing the button. That aborts the waiting turn and starts one.
    socket.send({ type: 'prompt', content: 'what did you see' })
    const frames = await collect(socket, all => seen(all) !== undefined)
    const report = seen(frames)

    assert.deepEqual(report.calls, ['wait_for_user_action'], 'the interrupted call is still in the history')
    assert.ok(report.results >= 1, 'and it has a result, or replay would have dropped it')
    assert.deepEqual(report.interrupted, [SPOKE_DURING_WAIT], 'saying it was interrupted, and by what')
    assert.equal(report.reminder, true, 'the new turn carries the reminder to wait again')

    // In the record too: the wait is settled, and no "turn was stopped" notice was written as the
    // assistant's words — the person's message is what answers it.
    const [interrupted] = await assistantMessages(conversationId)
    const wait = interrupted.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'wait_for_user_action')
    assert.equal(wait.state, 'output-available')
    assert.equal(wait.output, SPOKE_DURING_WAIT)
    assert.ok(!JSON.stringify(interrupted.parts).includes('This turn was stopped'))
  })

  test('the reminder is for the turn right after, not every turn since', async () => {
    const { socket } = await openSession()
    socket.send({ type: 'prompt', content: 'wait for me' })
    await collect(socket, sawWaiting)
    socket.send({ type: 'prompt', content: 'what did you see' })
    await collect(socket, all => seen(all) !== undefined)

    // The interruption has been answered; repeating "you were waiting" on every later turn would tell
    // the model to wait for something it may already have learned happened.
    socket.send({ type: 'prompt', content: 'what did you see' })
    const later = await collect(socket, all => seen(all) !== undefined)
    assert.equal(seen(later).reminder, false)
  })

  test('Stop during a wait: the wait keeps a result saying the reply was stopped, and no reminder', async () => {
    const { socket, conversationId } = await openSession()
    socket.send({ type: 'prompt', content: 'wait for me' })
    await collect(socket, sawWaiting)

    const runs = (await user.get(`/api/conversations/${OWNER}/${conversationId}/runs`)).data.results
    const running = runs.find((r: any) => r.status === 'running')
    assert.ok(running, 'the waiting turn is a running run')
    await user.post(`/api/runs/${OWNER}/${running.id}/abort`)
    await collect(socket, all => all.some(f => f.type === 'turn-end'))

    const [stopped] = await assistantMessages(conversationId)
    const wait = stopped.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'wait_for_user_action')
    assert.equal(wait.state, 'output-available')
    assert.equal(wait.output, STOPPED)
    // Stop keeps its notice: unlike speaking, nothing the person sends next explains it.
    assert.ok(JSON.stringify(stopped.parts).includes('This turn was stopped'))

    socket.send({ type: 'prompt', content: 'what did you see' })
    const report = seen(await collect(socket, all => seen(all) !== undefined))
    assert.deepEqual(report.interrupted, [STOPPED])
    assert.equal(report.reminder, false, 'Stop is not the person answering by writing')
  })
})
