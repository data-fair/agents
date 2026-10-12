import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { HostEventStore, RECENT_MAX, PENDING_MAX, STATE_MAX_KEYS, formatHostEvents, formatHostState, hasHostState, appendHostEvents, HOST_EVENTS_OPEN, HOST_EVENTS_CLOSE, HOST_STATE_OPEN, HOST_STATE_CLOSE, createWaitTool, WAIT_ACCEPTED, LOCATION_KEY, resolvesWait } from '../../../api/src/agent-session/host-events.ts'
import { AGENT_LOCATION_KEY } from '../../../lib-vue/agent-location.ts'
import { wrapHiddenContext, splitHiddenContext } from '../../../shared/hidden-context.ts'

const ev = (name: string, detail?: string, key?: string, at = 1000) => ({ name, ...(detail ? { detail } : {}), ...(key ? { key } : {}), at })

test.describe('HostEventStore retention', () => {
  test('keeps the last event per key, in first-seen key order', () => {
    const s = new HostEventStore()
    s.push(ev('wizard', 'a', 'wizard'))
    s.push(ev('navigated', '/x', 'location'))
    s.push(ev('wizard', 'b', 'wizard'))
    assert.deepEqual(s.snapshot().state.map(e => [e.key, e.detail]), [['wizard', 'b'], ['location', '/x']])
  })

  test('keeps a ring of the last RECENT_MAX unkeyed events', () => {
    const s = new HostEventStore()
    for (let i = 0; i < RECENT_MAX + 3; i++) s.push(ev('saved', String(i)))
    const recent = s.snapshot().recent
    assert.equal(recent.length, RECENT_MAX)
    assert.equal(recent[0].detail, '3')
  })

  test('withdraw removes a key from retention only', () => {
    const s = new HostEventStore()
    s.push(ev('wizard', 'a', 'wizard'))
    s.withdraw('wizard')
    assert.deepEqual(s.snapshot().state, [])
    assert.equal(s.hasPending(), true) // the event is still owed to the model
  })

  test('caps distinct retention keys, dropping the oldest', () => {
    const s = new HostEventStore()
    for (let i = 0; i < STATE_MAX_KEYS + 3; i++) s.push(ev(`row-${i}`, String(i), `row-${i}`))
    const state = s.snapshot().state
    assert.equal(state.length, STATE_MAX_KEYS)
    // The first 3 keys (row-0..row-2) were evicted to make room for the last 3.
    assert.equal(state[0].key, 'row-3')
    assert.ok(!state.some(e => e.key === 'row-0'))
    assert.ok(state.some(e => e.key === `row-${STATE_MAX_KEYS + 2}`))
  })

  test('updating an existing key never evicts it, however many times it changes', () => {
    const s = new HostEventStore()
    for (let i = 0; i < STATE_MAX_KEYS * 2; i++) s.push(ev('wizard', String(i), 'wizard'))
    assert.equal(s.snapshot().state.length, 1)
    assert.equal(s.snapshot().state[0].detail, String(STATE_MAX_KEYS * 2 - 1))
  })
})

test.describe('HostEventStore pending buffer', () => {
  test('coalesces keyed events in place, keeps unkeyed ones in order', () => {
    const s = new HostEventStore()
    s.push(ev('wizard', 'a', 'wizard'))
    s.push(ev('item-created', '1'))
    s.push(ev('wizard', 'b', 'wizard'))
    const pending = s.takePending()
    assert.deepEqual(pending.map(e => e.detail), ['b', '1'])
    assert.equal(s.hasPending(), false)
  })

  test('caps undelivered unkeyed events, dropping the oldest', () => {
    const s = new HostEventStore()
    for (let i = 0; i < PENDING_MAX + 3; i++) s.push(ev('saved', String(i)))
    const pending = s.takePending()
    assert.equal(pending.length, PENDING_MAX)
    assert.equal(pending[0].detail, '3')
    assert.equal(pending[pending.length - 1].detail, String(PENDING_MAX + 2))
  })

  test('the unkeyed ring does not touch coalesced keyed entries', () => {
    const s = new HostEventStore()
    s.push(ev('wizard', 'initial', 'wizard'))
    for (let i = 0; i < PENDING_MAX + 3; i++) s.push(ev('saved', String(i)))
    const pending = s.takePending()
    // One keyed slot (last value) plus the capped unkeyed ring, not evicted by it.
    assert.equal(pending.filter(e => e.key === 'wizard').length, 1)
    assert.equal(pending.filter(e => !e.key).length, PENDING_MAX)
  })
})

test.describe('HostEventStore wait answers', () => {
  // A pending wait is answered from the buffer, by the first thing the person did: the store no
  // longer holds a waiter, because the wait no longer blocks a turn (see api/src/conversations/waits.ts).
  test('takes the first thing the person did, then everything else pending as followers', () => {
    const s = new HostEventStore()
    s.push(ev('wizard', 'a', 'wizard'))
    s.push(ev('item-created', '1'))
    s.push(ev('navigated', '/x', 'location'))
    assert.equal(s.hasWaitAnswer(), true)
    assert.deepEqual(s.takeWaitAnswer()?.map(e => e.name), ['item-created', 'wizard', 'navigated'])
    assert.equal(s.hasPending(), false)
  })

  test('nothing the person did means no answer, and the buffer is left alone', () => {
    const s = new HostEventStore()
    s.push(ev('wizard', 'a', 'wizard'))
    assert.equal(s.hasWaitAnswer(), false)
    assert.equal(s.takeWaitAnswer(), null)
    assert.deepEqual(s.takePending().map(e => e.key), ['wizard'])
  })

  test('restorePending puts an answer back ahead of anything newer', () => {
    const s = new HostEventStore()
    s.push(ev('item-created', '1'))
    const taken = s.takeWaitAnswer()!
    s.push(ev('later', '2'))
    s.restorePending(taken)
    assert.deepEqual(s.takePending().map(e => e.name), ['item-created', 'later'])
  })

  test('clearPending drops the buffer and keeps retention', () => {
    const s = new HostEventStore()
    s.push(ev('wizard', 'a', 'wizard'))
    s.clearPending()
    assert.equal(s.hasPending(), false)
    assert.equal(s.snapshot().state.length, 1)
  })
})

test.describe('formatting', () => {
  test('host-events block lists time, name and detail', () => {
    const out = formatHostEvents([ev('item-created', '{"id":"1"}'), ev('saved')])
    assert.ok(out.startsWith(HOST_EVENTS_OPEN + '\n'))
    assert.ok(out.endsWith('\n' + HOST_EVENTS_CLOSE))
    assert.match(out, /^- \d{2}:\d{2}:\d{2} item-created: \{"id":"1"\}$/m)
    assert.match(out, /^- \d{2}:\d{2}:\d{2} saved$/m)
  })

  test('host-state block lists keys then recent actions', () => {
    const out = formatHostState({ state: [ev('navigated', '/x', 'location')], recent: [ev('saved')] })
    assert.ok(out.startsWith(HOST_STATE_OPEN + '\n'))
    assert.ok(out.endsWith('\n' + HOST_STATE_CLOSE))
    assert.match(out, /^- location: \/x$/m)
    assert.match(out, /^Recent actions:$/m)
    assert.match(out, /^- \d{2}:\d{2}:\d{2} saved$/m)
    assert.equal(hasHostState({ state: [], recent: [] }), false)
  })

  test('events block survives the hidden-context wrapper', () => {
    const block = formatHostEvents([ev('saved')])
    const { visible, hidden } = splitHiddenContext(wrapHiddenContext(block, 'hello'))
    assert.equal(visible, 'hello')
    assert.equal(hidden, block)
  })

  test('appendHostEvents handles string, media envelope, object and nothing', () => {
    assert.equal(appendHostEvents('ok', []), 'ok')
    const s = appendHostEvents('ok', [ev('saved')]) as string
    assert.ok(s.startsWith('ok\n\n' + HOST_EVENTS_OPEN))
    const media = appendHostEvents({ _agentsMediaResult: true, media: [] }, [ev('saved')]) as any
    assert.ok(media.text.startsWith(HOST_EVENTS_OPEN))
    assert.equal(media._agentsMediaResult, true)
    const obj = appendHostEvents({ success: true }, [ev('saved')]) as string
    assert.ok(obj.startsWith('{"success":true}\n\n' + HOST_EVENTS_OPEN))
  })
})

test.describe('wait_for_user_action advertising gate', () => {
  // use-agent-chat.ts registers the tool only when
  // `hasHostState(hostEvents.snapshot()) || hostEvents.hasPending()` — this pins that
  // predicate's truth table directly against the store, since the registration site
  // itself lives inside a large closure that isn't practical to unit-test in isolation.
  const gate = (s: HostEventStore) => hasHostState(s.snapshot()) || s.hasPending()

  test('false for a host that has never published anything', () => {
    assert.equal(gate(new HostEventStore()), false)
  })

  test('true once any event has been heard — keyed, unkeyed, or merely pending', () => {
    const keyed = new HostEventStore()
    keyed.push(ev('wizard', 'a', 'wizard'))
    assert.equal(gate(keyed), true)

    const unkeyed = new HostEventStore()
    unkeyed.push(ev('item-created', '1'))
    assert.equal(gate(unkeyed), true) // lands in `recent`, which counts as host state too
  })
})

test.describe('createWaitTool', () => {
  // It does not block: it accepts the handover, and the executor ends the turn on that.
  const exec = (t: any, args: any) => t.execute(args, {})

  test('refuses a wait with no message for the person, so the model retries with one', async () => {
    const t = createWaitTool()
    assert.match(await exec(t, {}), /message is required/)
    assert.match(await exec(t, { message: '  ', expecting: 'a click' }), /message is required/)
  })

  test('accepts a handover at once', async () => {
    const started = Date.now()
    assert.equal(await exec(createWaitTool(), { message: 'Ready.', expecting: 'a click' }), WAIT_ACCEPTED)
    assert.ok(Date.now() - started < 100)
  })

  test('offers no clock: a wait lasts until the person acts, writes or declines', () => {
    const schema = (createWaitTool() as any).inputSchema.jsonSchema
    assert.deepEqual(Object.keys(schema.properties).sort(), ['expecting', 'message'])
  })
})

test.describe('the host blocks admit what they do not cover', () => {
  // The blocks used to claim the model was kept up to date and must never ask
  // what is on screen. Event coverage is partial by construction — a page
  // publishes what it chose to publish, and nothing reports dialogs or
  // overlays — so on a screen the events do not describe, the only ways out
  // were to break the instruction or to invent. A judged run did both, guessing
  // "scroll to the bottom" and "press F5" at a person who could see neither.
  // Inventing is the harm; saying "I cannot see that" has to be allowed.
  test('state tells the model to say what it cannot see rather than guess', () => {
    const out = formatHostState({ state: [ev('wizard', 'step 2', 'wizard')], recent: [] })
    assert.match(out, /cannot see/i)
    assert.ok(!/never ask/i.test(out), 'an absolute ban leaves inventing as the only way out')
  })

  test('it still says the reports arrive on their own, so nothing invites a needless question', () => {
    const out = formatHostState({ state: [ev('wizard', 'step 2', 'wizard')], recent: [] })
    assert.match(out, /automatic/i)
  })

  test('the events block carries the same footing', () => {
    const out = formatHostEvents([ev('item-created', '{"id":"1"}')])
    assert.match(out, /cannot see/i)
    assert.ok(!/never ask/i.test(out))
  })
})

test.describe('what answers a wait is a kind of event, not a moment', () => {
  // A wait means "tell me when the person does something". The store already
  // separates the two kinds of event: an unkeyed transition is something that
  // happened, keyed state is what is true now — and state refreshes for many
  // reasons, including the assistant's own action finishing late. A judged run
  // had advance_to_confirmation report {ready:false} on its result, then
  // {ready:true} once a title-conflict API check came back; the wait took that
  // refresh as the user acting, the model retried, and the retry blocked 120s.
  // Timing cannot tell those apart — the refresh lands before or after the
  // handover depending on network latency — so the rule is by kind. `location` is
  // the one keyed change that means the person left, and it answers a wait.
  test('a keyed refresh is context, not an answer', () => {
    const s = new HostEventStore()
    s.push(ev('wizard', '{"ready":true}', 'wizard'))
    s.push(ev('detail', '{"id":"1"}', 'detail'))
    assert.equal(s.takeWaitAnswer(), null)
  })

  test('a transition answers it, with the refreshes delivered as followers', () => {
    const s = new HostEventStore()
    s.push(ev('wizard', '{"ready":true}', 'wizard'))
    s.push(ev('dataset-created', '{"id":"d1"}'))
    const answer = s.takeWaitAnswer()!
    assert.equal(answer[0].name, 'dataset-created', 'the transition answers it, not the refresh')
    assert.deepEqual(answer.slice(1).map(e => e.key), ['wizard'])
  })

  test('a navigation answers it, whatever it expected', () => {
    const s = new HostEventStore()
    s.push(ev('navigated', '{"path":"/elsewhere"}', 'location'))
    assert.equal(s.takeWaitAnswer()?.[0].key, 'location')
  })

  test('an event the caller rules out as not news is passed over, and stays as context', () => {
    // A reloaded page re-announcing the location it was already at is not the person leaving.
    const s = new HostEventStore()
    s.push(ev('navigated', '/same', 'location'))
    const notNews = (e: { key?: string, detail?: string }) => e.key === 'location' && e.detail === '/same'
    assert.equal(s.hasWaitAnswer(notNews), false)
    assert.equal(s.takeWaitAnswer(notNews), null)
    s.push(ev('item-created', '1'))
    assert.deepEqual(s.takeWaitAnswer(notNews)?.map(e => e.name), ['item-created', 'navigated'])
  })
})

test.describe('the location key is one string on both sides of the channel', () => {
  // The chat cannot import lib-vue's value at runtime (the node unit runner has no
  // built package entry), so it carries its own copy of the wire constant. This is
  // what keeps that copy honest: a rename on either side fails here, instead of
  // silently turning navigation into a refresh that no longer cancels a wait.
  test('the chat and lib-vue agree', () => {
    assert.equal(LOCATION_KEY, AGENT_LOCATION_KEY)
  })

  test('and a navigation published under it resolves a wait', () => {
    assert.equal(resolvesWait({ name: 'navigated', key: AGENT_LOCATION_KEY, at: 1 }), true)
    assert.equal(resolvesWait({ name: 'wizard', key: 'wizard', at: 1 }), false)
    assert.equal(resolvesWait({ name: 'item-created', at: 1 }), true)
  })
})
