import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  HostEventStore, RECENT_MAX,
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
