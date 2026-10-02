/**
 * stateful API tests for `wait_for_user_action` over the socket.
 *
 * The suspension that the earlier two-platform design rejected this whole reversal over. With the
 * loop colocated with the socket it is neither distributed nor a lock: an in-process promise settled
 * by the next frame on the same connection. That property is unit-tested; what needs a real turn is
 * everything around it — that the call is STORED with its input so a client can label it, that the
 * activity says what is being waited for, and that the next frame resumes the same turn.
 *
 * Replaces e2e tests that clicked a button on a dev page. The page emitting an event on click is
 * genuinely browser work and keeps one e2e; the loop's half does not need a browser.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { openAgentSession, type AgentSessionClient } from '../../support/ws.ts'

const admin = await superAdmin
const user = await axiosAuth('test-standalone1')

const OWNER = 'user/test-standalone1'

test.describe('wait_for_user_action over the socket', () => {
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
    return socket
  }

  /**
   * Collect frames until `done` is satisfied by everything seen so far.
   *
   * The predicate takes the ACCUMULATED frames rather than the latest one, because publication is
   * event-driven: the waiting activity and the message frame carrying the tool call are two separate
   * frames and their order is not part of the contract. A predicate on the latest frame alone stops
   * at whichever arrives first and then asserts about the other.
   */
  const collect = async (socket: AgentSessionClient, done: (frames: any[]) => boolean, cap = 5000) => {
    const frames: any[] = []
    for (let i = 0; i < cap; i++) {
      frames.push(await socket.next(20_000))
      if (done(frames)) return frames
    }
    assert.fail(`never saw what was waited for; last was ${JSON.stringify(frames[frames.length - 1])}`)
  }

  const sawWaiting = (frames: any[]) => frames.some(f => f.type === 'activity' && f.activity?.kind === 'waiting')
  const sawTurnEnd = (frames: any[]) => frames.some(f => f.type === 'turn-end')

  const toolParts = (frames: any[]) => frames
    .filter(f => f.type === 'message' && f.role === 'assistant')
    .flatMap(f => (f.parts ?? []).filter((p: any) => p.type === 'dynamic-tool'))

  test('the wait is announced with WHAT it is waiting for', async () => {
    // Both halves, because they are rendered from different places and either can be empty on its
    // own: the activity line drives the host's "waiting for the user" signal, and the stored tool
    // call is what the chip in the transcript is labelled from.
    const socket = await openSession()
    socket.send({ type: 'prompt', content: 'wait for me' })

    // Both, in whatever order they arrive.
    const frames = await collect(socket, fs =>
      sawWaiting(fs) && toolParts(fs).some(p => p.toolName === 'wait_for_user_action'))
    const waiting = frames.find(f => f.type === 'activity' && f.activity?.kind === 'waiting')
    assert.equal(waiting.activity.expecting, 'you to click Create', 'the activity must say what it waits for')

    const call = toolParts(frames).find(p => p.toolName === 'wait_for_user_action')
    assert.ok(call, 'the wait must be stored as a tool call')
    assert.deepEqual(call.input, { expecting: 'you to click Create' }, 'stored WITH its input, or a client cannot label it')
  })

  test('the next host event resumes the SAME turn', async () => {
    const socket = await openSession()
    socket.send({ type: 'prompt', content: 'wait for me' })
    await collect(socket, sawWaiting)

    // The person acts. One frame on the same connection settles an in-process promise — no routing,
    // no lock, no rendezvous, which is the claim.
    socket.send({ type: 'host-events', events: [{ name: 'clicked Create', detail: 'the wizard', at: Date.now() }] })

    const frames = await collect(socket, sawTurnEnd)
    assert.equal(frames.find(f => f.type === 'turn-end').stopReason, 'completed')

    const settled = toolParts(frames).find(p => p.toolName === 'wait_for_user_action' && p.state === 'output-available')
    assert.ok(settled, 'the wait must settle rather than hang')
    assert.match(JSON.stringify(settled.output), /clicked Create/, 'and carry what the person did')
  })

  test('the waiting activity is cleared once the wait resolves', async () => {
    // What drives the host's waiting-user/working indicator back off. A wait that resolved but left
    // the label up reads to the person as still waiting on them.
    const socket = await openSession()
    socket.send({ type: 'prompt', content: 'wait for me' })
    await collect(socket, sawWaiting)
    socket.send({ type: 'host-events', events: [{ name: 'clicked Create', at: Date.now() }] })

    const frames = await collect(socket, sawTurnEnd)
    const afterWait = frames.filter(f => f.type === 'activity')
    assert.ok(afterWait.some(f => f.activity === null), 'the waiting label must be cleared')
  })

  test('a wait nobody answers times out and ENDS the turn', async () => {
    // The lesson a judged run taught: four timeouts burned 480 of 567 seconds while the model wrote
    // "I'm still waiting" after each one, because the timeout result did not tell it to stop.
    const socket = await openSession()
    socket.send({ type: 'prompt', content: 'wait briefly' })

    const frames = await collect(socket, sawTurnEnd)
    const settled = toolParts(frames).find(p => p.toolName === 'wait_for_user_action' && p.state === 'output-available')
    assert.ok(settled)
    assert.match(JSON.stringify(settled.output), /No user action within/)
    assert.match(JSON.stringify(settled.output), /End your reply now/)
  })
})
