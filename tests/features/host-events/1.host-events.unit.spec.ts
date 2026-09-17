import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  HostEventStore, RECENT_MAX, PENDING_MAX, STATE_MAX_KEYS,
  formatHostEvents, formatHostState, hasHostState, appendHostEvents,
  HOST_EVENTS_OPEN, HOST_EVENTS_CLOSE, HOST_STATE_OPEN, HOST_STATE_CLOSE, createWaitTool,
  LOCATION_KEY, resolvesWait
} from '../../../ui/src/composables/host-events.ts'
import { AGENT_LOCATION_KEY } from '../../../lib-vue/agent-location.ts'
import { wrapHiddenContext, splitHiddenContext } from '../../../ui/src/traces/hidden-context.ts'

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

  test('peekPending reads the buffer without draining it', () => {
    const s = new HostEventStore()
    s.push(ev('item-created', '1'))
    s.push(ev('wizard', 'a', 'wizard'))
    const peeked = s.peekPending()
    assert.deepEqual(peeked.map(e => e.name), ['item-created', 'wizard'])
    // Still there afterwards, and still there for a real drain.
    assert.equal(s.hasPending(), true)
    assert.deepEqual(s.peekPending().map(e => e.name), ['item-created', 'wizard'])
    assert.deepEqual(s.takePending().map(e => e.name), ['item-created', 'wizard'])
    assert.equal(s.hasPending(), false)
  })
})

test.describe('HostEventStore waits', () => {
  test('resolves on the next push and does not buffer it', async () => {
    const s = new HostEventStore()
    const p = s.waitForEvent({ timeoutMs: 1000 })
    assert.equal(s.isWaiting(), true)
    s.push(ev('item-created', '1'))
    const out = await p
    assert.equal((out as any).name, 'item-created')
    assert.equal(s.hasPending(), false)
    assert.equal(s.isWaiting(), false)
  })

  test('resolves immediately with the oldest pending event', async () => {
    const s = new HostEventStore()
    s.push(ev('a'))
    s.push(ev('b'))
    const out = await s.waitForEvent({ timeoutMs: 1000 })
    assert.equal((out as any).name, 'a')
    assert.deepEqual(s.takePending().map(e => e.name), ['b'])
  })

  test('times out', async () => {
    const s = new HostEventStore()
    assert.equal(await s.waitForEvent({ timeoutMs: 10 }), 'timeout')
    assert.equal(s.isWaiting(), false)
  })

  test('aborts through the signal', async () => {
    const s = new HostEventStore()
    const ac = new AbortController()
    const p = s.waitForEvent({ timeoutMs: 1000, signal: ac.signal })
    ac.abort()
    assert.equal(await p, 'aborted')
    assert.equal(s.isWaiting(), false)
  })

  test('a second concurrent wait rejects', async () => {
    const s = new HostEventStore()
    const p = s.waitForEvent({ timeoutMs: 50 })
    await assert.rejects(s.waitForEvent({ timeoutMs: 50 }), /already-waiting/)
    await p
  })

  test('a wait declared on an already-aborted signal resolves aborted without consuming a pending event', async () => {
    const s = new HostEventStore()
    s.push(ev('item-created', '1'))
    const ac = new AbortController()
    ac.abort()
    const out = await s.waitForEvent({ timeoutMs: 1000, signal: ac.signal })
    assert.equal(out, 'aborted')
    // The immediate-resolution path (a pending event ready to hand back) must not run
    // ahead of the abort check, or the event would be silently consumed here instead
    // of staying owed to the model.
    assert.equal(s.hasPending(), true)
    assert.deepEqual(s.takePending().map(e => e.name), ['item-created'])
  })

  test('cancelWait settles an outstanding wait as aborted and is idempotent', async () => {
    const s = new HostEventStore()
    // A no-op when nothing is waiting.
    s.cancelWait()
    const p = s.waitForEvent({ timeoutMs: 1000 })
    s.cancelWait()
    assert.equal(await p, 'aborted')
    assert.equal(s.isWaiting(), false)
    // Calling it again afterwards, and with no wait ever having started, must not throw.
    s.cancelWait()
    s.cancelWait()
  })

  test('cancelWait leaves the pending buffer and retention untouched', () => {
    const s = new HostEventStore()
    s.push(ev('wizard', 'a', 'wizard'))
    s.push(ev('item-created', '1'))
    s.cancelWait()
    assert.equal(s.hasPending(), true)
    assert.equal(s.snapshot().state.length, 1)
  })

  test('clearPending drops the buffer and keeps retention', () => {
    const s = new HostEventStore()
    s.push(ev('wizard', 'a', 'wizard'))
    s.clearPending()
    assert.equal(s.hasPending(), false)
    assert.equal(s.snapshot().state.length, 1)
  })

  test('clearPending settles an outstanding wait as aborted', async () => {
    const s = new HostEventStore()
    const p = s.waitForEvent({ timeoutMs: 1000 })
    s.clearPending()
    assert.equal(await p, 'aborted')
    assert.equal(s.isWaiting(), false)
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
  const exec = (t: any, args: any, options?: any) => t.execute(args, options ?? {})

  test('resolves with the event block and drains followers', async () => {
    const store = new HostEventStore()
    const waiting: string[] = []
    let done = 0
    const t = createWaitTool({ store, onWaiting: e => waiting.push(e), onDone: () => done++ })
    const p = exec(t, { expecting: 'a click' })
    store.push(ev('item-created', '{"id":"1"}'))
    store.push(ev('navigated', '/x', 'location'))
    const out = await p as string
    assert.deepEqual(waiting, ['a click'])
    assert.equal(done, 1)
    assert.match(out, /item-created/)
    assert.match(out, /navigated: \/x/)
    assert.equal(store.hasPending(), false)
  })

  test('times out with the verbatim text', async () => {
    const store = new HostEventStore()
    const t = createWaitTool({ store })
    const out = await exec(t, { expecting: 'x', timeoutSeconds: 1 })
    assert.equal(out, 'No user action within 1 seconds. End your reply now and let the user act; you will be told what they did when the conversation continues.')
  })

  test('abort returns the cancel text', async () => {
    const store = new HostEventStore()
    const t = createWaitTool({ store })
    const ac = new AbortController()
    const p = exec(t, { expecting: 'x' }, { abortSignal: ac.signal })
    ac.abort()
    assert.equal(await p, 'Wait cancelled.')
  })

  test('a second call while pending returns immediately', async () => {
    const store = new HostEventStore()
    const t = createWaitTool({ store })
    const p = exec(t, { expecting: 'x', timeoutSeconds: 1 })
    assert.equal(await exec(t, { expecting: 'y' }), 'Already waiting for the user.')
    await p
  })
})

test.describe('createWaitTool blocks at most once per turn', () => {
  // Two judged runs burned minutes on this. In one, a keyed state re-emission
  // caused by the assistant's OWN tool call resolved the wait instantly, so the
  // assistant re-issued the identical wait and sat through the full timeout. In
  // another it declared three waits in a row with reworded `expecting` strings,
  // costing six minutes and producing two "take your time" bubbles. The person
  // cannot act while the turn is still open, so a second block in one turn can
  // only ever time out.
  const exec = (t: any, args: any, options?: any) => t.execute(args, options ?? {})

  test('the second wait of a turn returns at once instead of blocking', async () => {
    const store = new HostEventStore()
    const turn = 'turn-1'
    const t = createWaitTool({ store, turnId: () => turn })
    const first = exec(t, { expecting: 'a click' })
    store.push(ev('item-created', '{"id":"1"}'))
    await first
    const started = Date.now()
    const out = await exec(t, { expecting: 'the same click, reworded', timeoutSeconds: 30 }) as string
    assert.ok(Date.now() - started < 1000, 'must not block')
    assert.match(out, /already/i)
  })

  test('a new turn may wait again', async () => {
    const store = new HostEventStore()
    let turn = 'turn-1'
    const t = createWaitTool({ store, turnId: () => turn })
    const first = exec(t, { expecting: 'a click' })
    store.push(ev('item-created', '{"id":"1"}'))
    await first
    turn = 'turn-2'
    const second = exec(t, { expecting: 'another click' })
    store.push(ev('navigated', '/x', 'location'))
    assert.match(await second as string, /navigated/)
  })

  test('a timed-out wait also counts, so it cannot be retried in the same turn', async () => {
    const store = new HostEventStore()
    const t = createWaitTool({ store, turnId: () => 'turn-1' })
    await exec(t, { expecting: 'x', timeoutSeconds: 1 })
    const started = Date.now()
    await exec(t, { expecting: 'x again', timeoutSeconds: 30 })
    assert.ok(Date.now() - started < 1000, 'must not block twice')
  })

  test('without a turnId the tool keeps its old unlimited behaviour', async () => {
    // Hosts that never wired turnId must not silently lose the ability to wait.
    const store = new HostEventStore()
    const t = createWaitTool({ store })
    const first = exec(t, { expecting: 'a' })
    store.push(ev('item-created', '{"id":"1"}'))
    await first
    const second = exec(t, { expecting: 'b' })
    store.push(ev('navigated', '/x', 'location'))
    assert.match(await second as string, /navigated/)
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

test.describe('the per-turn cap only counts a wait that really blocked', () => {
  // The cap exists to stop wait->wait loops. But a wait is also satisfied
  // instantly by an event already in the pending buffer — including a keyed
  // state re-emission caused by the assistant's OWN tool call. Counting that
  // against the allowance meant the first "wait" was eaten by a wizard
  // ready:true transition and the real wait for the user's click was then
  // REFUSED: a judged run showed the person told three times to click a button
  // the assistant had no way to observe, through two 120s timeouts.
  const exec = (t: any, args: any, options?: any) => t.execute(args, options ?? {})

  test('a wait answered from the pending buffer leaves the allowance intact', async () => {
    // The person clicked before the wait was armed: the transition is already
    // pending, so the wait is answered at once without ever blocking — and must
    // not spend the turn's one allowed block, or the assistant could not wait
    // for the step that follows. (A pending keyed REFRESH is a different thing:
    // it is context, never an answer — see resolvesWait.)
    const store = new HostEventStore()
    const t = createWaitTool({ store, turnId: () => 'turn-1' })
    store.push(ev('item-created', '{"id":"1"}'))
    const first = await exec(t, { expecting: 'the user clicks Create' }) as string
    assert.match(first, /item-created/)
    assert.equal(store.lastWaitBlocked, false)

    // The next wait must still be available, and must actually block.
    const second = exec(t, { expecting: 'the user reaches the detail page' })
    store.push(ev('navigated', '{"path":"/detail"}', 'location'))
    assert.match(await second as string, /navigated/)
  })

  test('a wait that blocked still consumes the allowance', async () => {
    const store = new HostEventStore()
    const t = createWaitTool({ store, turnId: () => 'turn-1' })
    const first = exec(t, { expecting: 'a click' })
    store.push(ev('item-created', '{"id":"1"}'))
    await first
    const started = Date.now()
    const out = await exec(t, { expecting: 'reworded', timeoutSeconds: 30 }) as string
    assert.ok(Date.now() - started < 1000)
    assert.match(out, /already/i)
  })

  test('a timed-out wait consumes it too', async () => {
    const store = new HostEventStore()
    const t = createWaitTool({ store, turnId: () => 'turn-1' })
    await exec(t, { expecting: 'x', timeoutSeconds: 1 })
    const started = Date.now()
    await exec(t, { expecting: 'x again', timeoutSeconds: 30 })
    assert.ok(Date.now() - started < 1000)
  })
})

test.describe('a timed-out wait does not block again until something happens', () => {
  // The per-turn cap cannot reach this: each new turn gets a fresh allowance, so
  // an assistant that waits, times out, and waits again on the next turn blocks
  // for the full timeout every time. A judged data-fair run spent 480s of a 567s
  // run in four such timeouts, writing a new "I'm still waiting" line after each
  // — while the timeout result already told it to end its reply and let the user
  // act. Blocking again before the person has done ANYTHING cannot help.
  const exec = (t: any, args: any, options?: any) => t.execute(args, options ?? {})

  test('refuses to block again while the application has reported nothing', async () => {
    const store = new HostEventStore()
    let turn = 1
    const t = createWaitTool({ store, turnId: () => `turn-${turn}` })
    await exec(t, { expecting: 'the user clicks Create', timeoutSeconds: 1 })

    turn = 2
    const started = Date.now()
    const out = await exec(t, { expecting: 'the user clicks Create', timeoutSeconds: 30 }) as string
    assert.ok(Date.now() - started < 1000, 'must not block a second time')
    assert.match(out, /nothing|still|no action/i)
  })

  test('waits again once the person has actually done something', async () => {
    const store = new HostEventStore()
    let turn = 1
    const t = createWaitTool({ store, turnId: () => `turn-${turn}` })
    await exec(t, { expecting: 'a click', timeoutSeconds: 1 })

    // The person acts; that event is delivered by the normal path.
    store.push(ev('item-created', '{"id":"1"}'))
    store.takePending()

    turn = 2
    const second = exec(t, { expecting: 'the next step', timeoutSeconds: 30 })
    store.push(ev('navigated', '/detail', 'location'))
    assert.match(await second as string, /navigated/)
  })

  test('the very first wait of a conversation still blocks', async () => {
    const store = new HostEventStore()
    const t = createWaitTool({ store, turnId: () => 'turn-1' })
    const first = exec(t, { expecting: 'a click' })
    store.push(ev('item-created', '{"id":"1"}'))
    assert.match(await first as string, /item-created/)
  })

  test('a host that wires no turnId is unaffected', async () => {
    const store = new HostEventStore()
    const t = createWaitTool({ store })
    await exec(t, { expecting: 'x', timeoutSeconds: 1 })
    const second = exec(t, { expecting: 'y', timeoutSeconds: 30 })
    store.push(ev('item-created', '{"id":"1"}'))
    assert.match(await second as string, /item-created/)
  })
})

test.describe('what resolves a wait is a kind of event, not a moment', () => {
  // A wait means "tell me when the person does something". The store already
  // separates the two kinds of event: an unkeyed transition is something that
  // happened, keyed state is what is true now — and state refreshes for many
  // reasons, including the assistant's own action finishing late. A judged run
  // had advance_to_confirmation report {ready:false} on its result, then
  // {ready:true} once a title-conflict API check came back; the wait took that
  // refresh as the user acting, the model retried, and the retry blocked 120s.
  // Timing cannot tell those apart — the refresh lands before or after the wait
  // depending on network latency — so the rule is by kind. `location` is the one
  // keyed change that means the person left, and it cancels a wait.
  const wait = (s: HostEventStore, ms = 5000) => s.waitForEvent({ timeoutMs: ms })

  test('a keyed refresh already pending is context, and the wait keeps waiting', async () => {
    const s = new HostEventStore()
    s.push(ev('wizard', '{"ready":true}', 'wizard'))
    const p = wait(s)
    s.push(ev('dataset-created', '{"id":"d1"}'))
    const out = await p
    assert.equal((out as any).name, 'dataset-created', 'the transition resolves it, not the refresh')
    // The refresh is still owed to the model, as a follower.
    assert.deepEqual(s.takePending().map(e => e.key), ['wizard'])
  })

  test('a transition already pending resolves at once — the person acted early', async () => {
    const s = new HostEventStore()
    s.push(ev('dataset-created', '{"id":"d1"}'))
    const out = await wait(s)
    assert.equal((out as any).name, 'dataset-created')
    assert.equal(s.lastWaitBlocked, false)
  })

  test('a keyed refresh arriving mid-wait does not resolve it either', async () => {
    const s = new HostEventStore()
    const p = wait(s)
    s.push(ev('wizard', '{"ready":true}', 'wizard'))
    s.push(ev('item-created', '{"id":"1"}'))
    assert.equal((await p as any).name, 'item-created')
    assert.deepEqual(s.takePending().map(e => e.key), ['wizard'])
  })

  test('a navigation cancels a wait, whatever it expected', async () => {
    const s = new HostEventStore()
    const p = wait(s)
    s.push(ev('navigated', '{"path":"/elsewhere"}', 'location'))
    assert.equal((await p as any).key, 'location')
  })

  test('a navigation already pending resolves at once too', async () => {
    const s = new HostEventStore()
    s.push(ev('navigated', '{"path":"/elsewhere"}', 'location'))
    assert.equal((await wait(s) as any).key, 'location')
  })

  test('only refreshes, and the wait runs to its timeout', async () => {
    const s = new HostEventStore()
    const p = wait(s, 300)
    s.push(ev('wizard', '{"ready":true}', 'wizard'))
    s.push(ev('detail', '{"id":"1"}', 'detail'))
    assert.equal(await p, 'timeout')
    assert.deepEqual(s.takePending().map(e => e.key), ['wizard', 'detail'])
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
