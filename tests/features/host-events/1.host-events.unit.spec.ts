import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  HostEventStore, RECENT_MAX, PENDING_MAX, STATE_MAX_KEYS,
  formatHostEvents, formatHostState, hasHostState, appendHostEvents,
  HOST_EVENTS_OPEN, HOST_EVENTS_CLOSE, HOST_STATE_OPEN, HOST_STATE_CLOSE, createWaitTool
} from '../../../ui/src/composables/host-events.ts'
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
