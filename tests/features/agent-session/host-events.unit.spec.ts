/**
 * stateless unit tests for host events arriving over the socket, and for the wait that depends on them.
 *
 * `wait_for_user_action` ends its turn; what the person does next on the page arrives here, and the
 * session reports it so a pending wait can be answered (api/src/conversations/waits.ts). Neither a
 * suspension nor a lock — a frame, and a callback.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createAgentSession } from '../../../api/src/agent-session/session.ts'
import { WAIT_TOOL_NAME } from '@agents/shared/agent-activity'
import { formatHostState, formatWaitAnswer, HostEventStore } from '../../../api/src/agent-session/host-events.ts'
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
  test('what the person does on the page is reported, and can answer a pending wait', () => {
    let reported = 0
    const session = createAgentSession({ send: () => {}, onHostEvents: () => { reported++ } })
    session.handle({ type: 'host-state', state: { wizard: 'step 2' } })
    // State alone is the page catching up: reported, but no answer to a wait.
    assert.equal(reported, 1)
    assert.equal(session.hostEvents.hasWaitAnswer(), false)
    session.handle({ type: 'host-events', events: [{ name: 'clicked save', detail: 'the dataset form', at: Date.now() }] })
    assert.equal(reported, 2)
    assert.equal(session.hostEvents.hasWaitAnswer(), true)
  })

  test('only the person\'s Stop declines a pending wait; a plain abort leaves it', () => {
    // Leaving a thread sends a plain abort, and must not answer the wait of the thread left behind.
    const aborts: boolean[] = []
    const session = createAgentSession({ send: () => {}, onAbort: dismissWait => { aborts.push(dismissWait) } })
    session.handle(parse({ type: 'abort' }) as any)
    session.handle(parse({ type: 'abort', dismissWait: true }) as any)
    assert.deepEqual(aborts, [false, true])
  })

  test('a wait is answered with what happened in the order it happened', () => {
    // A judged portal run: the answer listed « draft-validated » first, then the older « unpublished
    // changes » state, which reads as the current state once the validation is past.
    const store = new HostEventStore()
    store.push({ name: 'draft', key: 'draft', detail: 'unpublished changes', at: 1000 })
    store.push({ name: 'draft-validated', detail: '{"page":"x"}', at: 2000 })
    const answer = formatWaitAnswer(store.takeWaitAnswer()!)
    assert.ok(answer.indexOf('unpublished changes') < answer.indexOf('draft-validated'), answer)
  })

  test('the tool is named what the model is told it is named', () => {
    // The name travels into activeTools and into the stream-part handling, so a drift here is silent.
    assert.equal(WAIT_TOOL_NAME, 'wait_for_user_action')
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

  test('a hello for a FRESH thread is a reset too, and the thread its first prompt creates keeps what came before', () => {
    const session = sessionWith()
    session.handle({ type: 'hello', tools: [], conversationId: 'c1' })
    session.handle({ type: 'host-events', events: [{ name: 'clicked save', at: Date.now() }] })
    session.handle({ type: 'hello', tools: [] })
    assert.equal(session.hostEvents.hasPending(), false, 'the new thread does not open with the old one\'s events')

    // What the person did before their first message belongs to the thread that message starts.
    session.handle({ type: 'host-events', events: [{ name: 'clicked create', at: Date.now() }] })
    session.bind('c2')
    assert.equal(session.hostEvents.hasPending(), true)
  })
})
