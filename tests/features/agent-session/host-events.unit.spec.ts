/**
 * stateless unit tests for host events arriving over the socket, and for the wait that depends on them.
 *
 * The wait is the point. `wait_for_user_action` is the "distributed suspension holding a conversation
 * lock" that the earlier two-platform design rejected this reversal over. With the loop colocated with
 * the socket it is neither distributed nor a lock: it is an in-process promise resolved by the next
 * frame, which is what these tests show.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createAgentSession } from '../../../api/src/agent-session/session.ts'
import { createWaitTool, formatHostState, WAIT_TOOL_NAME } from '@agents/shared/host-events'
import { parseClientMessage } from '@agents/shared/agent-session-protocol'

const sessionWith = () => createAgentSession({ send: () => {} })
const parse = (value: unknown) => parseClientMessage(JSON.stringify(value))

test.describe('host frames on the wire', () => {
  test('an event needs a name and a numeric timestamp', () => {
    // These reach the model's context as prose and `at` orders the coalescing, so a malformed event
    // corrupts what the model is told rather than merely being dropped.
    assert.equal(parse({ type: 'host-events', events: [{ name: 'saved', at: 1 }] }).type, 'host-events')
    assert.equal(parse({ type: 'host-events', events: [{ name: 'saved' }] }).type, 'invalid')
    assert.equal(parse({ type: 'host-events', events: [{ at: 1 }] }).type, 'invalid')
    assert.equal(parse({ type: 'host-events', events: [{ name: '', at: 1 }] }).type, 'invalid')
    assert.equal(parse({ type: 'host-events', events: 'nope' }).type, 'invalid')
  })

  test('state must be an object of keyed facts', () => {
    assert.equal(parse({ type: 'host-state', state: { page: 'datasets' } }).type, 'host-state')
    assert.equal(parse({ type: 'host-state', state: [] }).type, 'invalid')
  })
})

test.describe('the session store', () => {
  test('reported state becomes retained, keyed facts the model can be told', () => {
    const session = sessionWith()
    session.handle({ type: 'host-state', state: { page: 'the datasets list', selection: '3 rows' } })
    const text = formatHostState(session.hostEvents.snapshot())
    assert.match(text, /- page: the datasets list/)
    assert.match(text, /- selection: 3 rows/)
  })

  test('a later value for the same key supersedes the earlier one', () => {
    // Retention answers "what is true NOW", so two reports of the same key must not read as a history.
    const session = sessionWith()
    session.handle({ type: 'host-state', state: { page: 'datasets' } })
    session.handle({ type: 'host-state', state: { page: 'one dataset' } })
    const text = formatHostState(session.hostEvents.snapshot())
    assert.match(text, /- page: one dataset/)
    assert.doesNotMatch(text, /- page: datasets\b/)
  })

  test('a null value WITHDRAWS a fact rather than reporting it as empty', () => {
    // "No longer true" and "never reported" are different, and only the page knows which.
    const session = sessionWith()
    session.handle({ type: 'host-state', state: { dialog: 'the create form' } })
    session.handle({ type: 'host-state', state: { dialog: null } })
    // Anchored on the ENTRY LINE, not the bare word: the formatter's own preamble mentions dialogs,
    // so /dialog/ matches the boilerplate and the test would pass whatever the store held.
    assert.doesNotMatch(formatHostState(session.hostEvents.snapshot()), /- dialog:/)
    assert.deepEqual(session.hostEvents.snapshot().state, [])
  })

  test('events the person caused are buffered until the model is told', () => {
    const session = sessionWith()
    assert.equal(session.hostEvents.hasPending(), false)
    session.handle({ type: 'host-events', events: [{ name: 'clicked save', at: Date.now() }] })
    assert.equal(session.hostEvents.hasPending(), true)
    assert.deepEqual(session.hostEvents.takePending().map(e => e.name), ['clicked save'])
    assert.equal(session.hostEvents.hasPending(), false)
  })
})

test.describe('wait_for_user_action, server-side', () => {
  test('a wait resolves with what the person did next, from a socket frame', async () => {
    // THE SUSPENSION, discharged. Colocation makes it an in-process promise: the loop waits, the next
    // frame on the same connection in the same process settles it. No routing, no lock, no rendezvous.
    const session = sessionWith()
    const wait = createWaitTool({ store: session.hostEvents })

    const pending = wait.execute!({ message: 'Ready: save the form.', expecting: 'you to save', timeoutSeconds: 5 } as never, { toolCallId: 'w1', messages: [] })
    // The person acts, reported over the socket.
    session.handle({ type: 'host-events', events: [{ name: 'clicked save', detail: 'the dataset form', at: Date.now() }] })

    const outcome = String(await pending)
    assert.match(outcome, /clicked save/)
    assert.match(outcome, /the dataset form/)
  })

  test('a wait that nobody answers times out, and says so', async () => {
    const session = sessionWith()
    const wait = createWaitTool({ store: session.hostEvents })
    const outcome = String(await wait.execute!({ message: 'Ready: save the form.', expecting: 'you to save', timeoutSeconds: 1 } as never, { toolCallId: 'w1', messages: [] }))
    // The turn must END rather than appear to keep waiting — the lesson a judged run taught, where four
    // timeouts burned 480 seconds while the model wrote "I'm still waiting" after each.
    assert.match(outcome, /No user action within 1 seconds/)
    // And it tells the model to STOP rather than to keep waiting, which is the lesson the judged run
    // taught: four timeouts burned 480 of 567 seconds while the model wrote "I'm still waiting" after
    // each one, the timeout result already telling it to end its reply.
    assert.match(outcome, /End your reply now/)
  })

  test('the tool is named what the model is told it is named', () => {
    // The name travels into activeTools and into the stream-part handling, so a drift here is silent.
    assert.equal(WAIT_TOOL_NAME, 'wait_for_user_action')
  })

  test('a second wait while one is pending is refused rather than queued', async () => {
    // Two waits on one store would both consume the next event, and the model would be told the same
    // action twice.
    const session = sessionWith()
    const wait = createWaitTool({ store: session.hostEvents })
    const first = wait.execute!({ message: 'Ready.', expecting: 'a', timeoutSeconds: 2 } as never, { toolCallId: 'w1', messages: [] })
    const second = String(await wait.execute!({ message: 'Ready.', expecting: 'b', timeoutSeconds: 2 } as never, { toolCallId: 'w2', messages: [] }))
    assert.match(second, /already waiting/i)
    session.handle({ type: 'host-events', events: [{ name: 'done', at: Date.now() }] })
    await first
  })
})

test.describe('reset, as a rebind', () => {
  test('re-attaching to a DIFFERENT conversation drops buffered events but keeps page state', () => {
    // Retained state is still true of the page, so it survives; anything buffered for a model that will
    // never see it is dropped, or the first turn of the new thread would open with the old one's events.
    const session = sessionWith()
    session.handle({ type: 'hello', tools: [], conversationId: 'c1' })
    session.handle({ type: 'host-state', state: { page: 'the datasets list' } })
    session.handle({ type: 'host-events', events: [{ name: 'clicked save', at: Date.now() }] })
    assert.equal(session.hostEvents.hasPending(), true)

    session.handle({ type: 'hello', tools: [], conversationId: 'c2' })
    assert.equal(session.hostEvents.hasPending(), false, 'buffered events must not cross into a new thread')
    assert.match(formatHostState(session.hostEvents.snapshot()), /- page: the datasets list/)
  })

  test('re-attaching to the SAME conversation keeps what is buffered', () => {
    // A reconnect is not a reset. Dropping the buffer here would lose what the person did while the
    // socket was down — which is exactly what the buffer exists to carry.
    const session = sessionWith()
    session.handle({ type: 'hello', tools: [], conversationId: 'c1' })
    session.handle({ type: 'host-events', events: [{ name: 'clicked save', at: Date.now() }] })
    session.handle({ type: 'hello', tools: [], conversationId: 'c1' })
    assert.equal(session.hostEvents.hasPending(), true)
  })
})
