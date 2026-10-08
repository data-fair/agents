/**
 * stateful API tests for `wait_for_user_action` over the socket.
 *
 * The wait is a HANDOVER, not a pause: calling it ends the turn with the call left open, and what the
 * person does next settles it — an action on the page wakes a new turn that continues from what they
 * did, a message answers it as interrupted, Stop declines it. Nothing is held open in between: no run,
 * no lock, no clock (api/src/conversations/waits.ts).
 *
 * The page emitting an event on click is genuinely browser work and keeps its e2e; the loop's half
 * does not need a browser.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { openAgentSession, newThreadHello, type AgentSessionClient } from '../../../dev/agent-session-client.ts'

const admin = await superAdmin
const user = await axiosAuth('test-standalone1')

const OWNER = 'user/test-standalone1'
const STOPPED = 'Interrupted: the person stopped the reply before this finished.'

test.describe('wait_for_user_action over the socket', () => {
  const sockets: AgentSessionClient[] = []

  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, OWNER)
  })
  test.afterEach(() => { for (const socket of sockets.splice(0)) socket.close() })

  const cookie = async () => await user.cookieJar.getCookieString(directoryUrl)

  /** A socket bound to this thread, or ready to start one: its first prompt creates it. */
  const openSession = async (conversationId?: string) => {
    const socket = await openAgentSession(await cookie())
    sockets.push(socket)
    socket.send(conversationId ? { type: 'hello', tools: [], conversationId } : newThreadHello(OWNER))
    await socket.next()
    return { socket }
  }

  /**
   * Collect frames until `done` is satisfied by everything seen so far.
   *
   * The predicate takes the ACCUMULATED frames rather than the latest one, because publication is
   * event-driven and the relative order of independent frames is not part of the contract.
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
  const turnEnds = (frames: any[]) => frames.filter(f => f.type === 'turn-end')
  const toolParts = (frames: any[]) => frames
    .filter(f => f.type === 'message' && f.role === 'assistant')
    .flatMap(f => (f.parts ?? []).filter((p: any) => p.type === 'dynamic-tool'))
  const waitPart = (frames: any[], state: string) => toolParts(frames).find(p => p.toolName === 'wait_for_user_action' && p.state === state)

  const conversation = async (id: string) =>
    (await user.get(`/api/conversations/${OWNER}?agentId=personal`)).data.results.find((c: any) => c.id === id)
  const runs = async (id: string) => (await user.get(`/api/conversations/${OWNER}/${id}/runs`)).data.results as any[]

  /** Hand over: prompt the mock's wait seam, and return once the handover turn has ended. */
  const handOver = async () => {
    const session = await openSession()
    session.socket.send({ type: 'prompt', content: 'wait for me' })
    const frames = await collect(session.socket, all => sawWaiting(all) && turnEnds(all).length > 0)
    return { ...session, conversationId: session.socket.conversationId()!, frames }
  }

  test('the wait is announced with WHAT it is waiting for', async () => {
    // Both halves, because they are rendered from different places and either can be empty on its
    // own: the activity line drives the host's "waiting for the user" signal, and the stored tool
    // call is what the chip in the transcript is labelled from.
    const { frames } = await handOver()
    const waiting = frames.find(f => f.type === 'activity' && f.activity?.kind === 'waiting')
    assert.equal(waiting.activity.expecting, 'you to click Create', 'the activity must say what it waits for')
    const call = toolParts(frames).find(p => p.toolName === 'wait_for_user_action')
    // `message` is the model's handover to the person; `expecting` is only the status label.
    assert.deepEqual(call.input, { message: 'Ready: click Create.', expecting: 'you to click Create' }, 'stored WITH its input, or a client cannot label it')
    // Before turn-end: there must be no instant where the chat reads as simply done.
    assert.ok(frames.indexOf(waiting) < frames.indexOf(turnEnds(frames)[0]))
  })

  test('the handover message is shown to the person, before the call, and stored', async () => {
    const { frames } = await handOver()
    const streamed = frames.filter(f => f.type === 'delta' && f.kind === 'text').map(f => f.text).join('')
    assert.match(streamed, /Ready: click Create\./)

    // In the record, as text BEFORE the wait call: after it, the text would be replayed to the model
    // as a separate message it never wrote.
    const last = frames.filter(f => f.type === 'message' && f.role === 'assistant').at(-1)
    const types = last.parts.map((p: any) => p.type)
    const textAt = last.parts.findIndex((p: any) => p.type === 'text' && /Ready: click Create\./.test(p.text))
    const waitAt = last.parts.findIndex((p: any) => p.type === 'dynamic-tool' && p.toolName === 'wait_for_user_action')
    assert.ok(textAt !== -1, `the handover must be in the stored parts: ${JSON.stringify(types)}`)
    assert.ok(textAt < waitAt, `and come before the call: ${JSON.stringify(types)}`)
    assert.equal(last.parts.filter((p: any) => p.type === 'text' && /Ready: click Create\./.test(p.text)).length, 1)
  })

  test('the handover ENDS the turn: the call stays open and the conversation waits, holding nothing', async () => {
    const { frames, conversationId } = await handOver()
    assert.equal(turnEnds(frames)[0].stopReason, 'waiting')
    assert.ok(waitPart(frames, 'input-available'), 'the call is left open for the person to answer')

    const [run] = await runs(conversationId)
    assert.equal(run.status, 'done', 'no run is held open while the person thinks')
    assert.equal(run.stopReason, 'waiting')
    const waiting = await conversation(conversationId)
    assert.equal(waiting.pendingWait.expecting, 'you to click Create')
    assert.equal(waiting.pendingWait.triggeredBy.userId, 'test-standalone1')
  })

  test('the person acting wakes a new turn, which continues from what they did', async () => {
    const { socket, conversationId } = await handOver()
    socket.send({ type: 'host-events', events: [{ name: 'clicked Create', detail: 'the wizard', at: Date.now() }] })

    const frames = await collect(socket, all => turnEnds(all).length > 0)
    assert.equal(turnEnds(frames)[0].stopReason, 'completed')
    // The wake turn's own bubble is announced BEFORE its first words: a client adds a delta to the last
    // assistant bubble it has, which here would be the handover's, and the reply was shown glued onto it.
    const firstDelta = frames.findIndex(f => f.type === 'delta')
    const announced = frames.findIndex(f => f.type === 'message' && f.role === 'assistant' && f.pending === true && f.parts.length === 0)
    assert.ok(announced !== -1 && announced < firstDelta, 'the new turn\'s message comes before its text')
    const settled = waitPart(frames, 'output-available')
    assert.ok(settled, 'the wait is settled')
    assert.match(String(settled.output), /clicked Create/, 'with what the person did')
    // The mock answers a settled wait with "You did: <its result>": the wake turn saw that result.
    const answer = frames.filter(f => f.type === 'message' && f.role === 'assistant' && f.pending === false).at(-1)
    assert.match(JSON.stringify(answer.parts), /You did:.*clicked Create/)

    const all = await runs(conversationId)
    assert.equal(all.length, 2)
    const wake = all.find(r => r.trigger === 'wake')
    assert.ok(wake, 'a wake run, not a user one: the person said nothing')
    assert.equal(wake.triggeredBy.userId, 'test-standalone1', 'billed as the person who handed over')
    assert.equal((await conversation(conversationId)).pendingWait, undefined)
    // Exactly one message of the person's: a wake adds none.
    const messages = (await user.get(`/api/conversations/${OWNER}/${conversationId}/messages`)).data.results
    assert.equal(messages.filter((m: any) => m.role === 'user').length, 1)
  })

  test('the waiting label clears once the wait is answered', async () => {
    const { socket } = await handOver()
    socket.send({ type: 'host-events', events: [{ name: 'clicked Create', at: Date.now() }] })
    const frames = await collect(socket, all => turnEnds(all).length > 0)
    const cleared = frames.findIndex(f => f.type === 'activity' && f.activity === null)
    assert.ok(cleared !== -1, 'the waiting label must be cleared')
  })

  test('an action taken as the turn hands over still wakes it', async () => {
    // The moment the wait call shows, the turn has not closed yet: the click may land before the
    // conversation records what it waits on. It is buffered, and the closing turn answers with it.
    // (An action before the call is not an answer at all: it reaches the model as context.)
    const { socket } = await openSession()
    socket.send({ type: 'prompt', content: 'wait for me' })
    const early = await collect(socket, all => !!waitPart(all, 'input-available'))
    const conversationId = socket.conversationId()!
    socket.send({ type: 'host-events', events: [{ name: 'clicked Create', at: Date.now() }] })
    const frames = [...early, ...await collect(socket, all => turnEnds([...early, ...all]).length >= 2)]
    assert.deepEqual(turnEnds(frames).map(f => f.stopReason), ['waiting', 'completed'])
    assert.match(String(waitPart(frames, 'output-available')?.output), /clicked Create/)
    assert.equal((await conversation(conversationId)).pendingWait, undefined)
  })

  test('a message written as the turn hands over leaves no stale wait behind', async () => {
    // The post lands while the handing-over turn is still finishing: it finds no pending wait to settle,
    // and the turn's close then records one. The user run that answers the message settles it at its start.
    // The window is narrow, so this is also a regression guard for that start-of-run settle.
    const { socket } = await openSession()
    socket.send({ type: 'prompt', content: 'wait for me' })
    const early = await collect(socket, all => !!waitPart(all, 'input-available'))
    const conversationId = socket.conversationId()!
    socket.send({ type: 'prompt', content: 'never mind' })
    await collect(socket, all => turnEnds([...early, ...all]).length >= 2)
    // let any trailing run close out
    for (let i = 0; i < 100; i++) {
      if ((await runs(conversationId)).every(r => r.status !== 'running')) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.equal((await conversation(conversationId)).pendingWait, undefined, 'no wait is left pending')
    const messages = (await user.get(`/api/conversations/${OWNER}/${conversationId}/messages`)).data.results
    const open = messages.flatMap((m: any) => m.parts ?? []).filter((p: any) => p.toolName === 'wait_for_user_action' && p.state === 'input-available')
    assert.equal(open.length, 0, 'no wait call is left open')

    const before = (await runs(conversationId)).length
    socket.send({ type: 'host-events', events: [{ name: 'clicked Create', at: Date.now() }] })
    await new Promise(resolve => setTimeout(resolve, 1500))
    assert.equal((await runs(conversationId)).length, before, 'a later page action wakes nothing')
  })

  test('a keyed refresh is the page catching up: it does not wake, and rides along with the answer', async () => {
    const { socket, conversationId } = await handOver()
    socket.send({ type: 'host-state', state: { wizard: '{"ready":true}' } })
    await new Promise(resolve => setTimeout(resolve, 500))
    assert.ok((await conversation(conversationId)).pendingWait, 'still waiting')
    assert.equal((await runs(conversationId)).length, 1, 'no turn was started')

    socket.send({ type: 'host-events', events: [{ name: 'clicked Create', at: Date.now() }] })
    const frames = await collect(socket, all => turnEnds(all).length > 0)
    const output = String(waitPart(frames, 'output-available')?.output)
    assert.match(output, /clicked Create/)
    assert.match(output, /ready/, 'the refresh is delivered as a follower')
  })

  test('Stop declines it: settled as stopped, and no model call', async () => {
    const { socket, conversationId } = await handOver()
    socket.send({ type: 'abort', dismissWait: true })
    const frames = await collect(socket, all => !!waitPart(all, 'output-available') && all.some(f => f.type === 'activity' && f.activity === null))
    assert.equal(waitPart(frames, 'output-available').output, STOPPED)
    assert.equal((await conversation(conversationId)).pendingWait, undefined)
    assert.equal((await runs(conversationId)).length, 1, 'nothing ran')
    // And a later click finds no wait to answer.
    socket.send({ type: 'host-events', events: [{ name: 'clicked Create', at: Date.now() }] })
    await new Promise(resolve => setTimeout(resolve, 500))
    assert.equal((await runs(conversationId)).length, 1)
  })

  test('a plain abort — leaving the thread — leaves the wait pending', async () => {
    const { socket, conversationId } = await handOver()
    socket.send({ type: 'abort' })
    await new Promise(resolve => setTimeout(resolve, 500))
    assert.ok((await conversation(conversationId)).pendingWait)
  })

  test('a page reloaded during the wait re-announcing where it was does not answer it; leaving does', async () => {
    const { socket: first } = await openSession()
    first.send({ type: 'host-state', state: { location: '/datasets' } })
    first.send({ type: 'prompt', content: 'wait for me' })
    await collect(first, all => sawWaiting(all) && turnEnds(all).length > 0)
    const conversationId = first.conversationId()!

    // The reload: a new socket, whose page reports the same location on mount.
    const reloaded = await openSession(conversationId)
    reloaded.socket.send({ type: 'host-state', state: { location: '/datasets' } })
    await new Promise(resolve => setTimeout(resolve, 500))
    assert.ok((await conversation(conversationId)).pendingWait, 'still waiting')
    assert.equal((await runs(conversationId)).length, 1)

    reloaded.socket.send({ type: 'host-state', state: { location: '/elsewhere' } })
    const frames = await collect(reloaded.socket, all => turnEnds(all).length > 0)
    assert.match(String(waitPart(frames, 'output-available')?.output), /elsewhere/)
  })

  test('a thread reopened while waiting says so', async () => {
    const { conversationId } = await handOver()
    const reopened = await openSession(conversationId)
    const frames = await collect(reopened.socket, sawWaiting)
    assert.equal(frames.find(f => f.type === 'activity').activity.expecting, 'you to click Create')
    // And the reopened page's action answers it.
    reopened.socket.send({ type: 'host-events', events: [{ name: 'clicked Create', at: Date.now() }] })
    const after = await collect(reopened.socket, all => turnEnds(all).length > 0)
    assert.equal(turnEnds(after)[0].stopReason, 'completed')
  })
})
