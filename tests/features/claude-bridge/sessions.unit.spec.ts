/**
 * stateless unit tests for claude-bridge session continuity (spec §2.4).
 * The staleness guarantee lives here: any edit to history must become a cache
 * MISS, never a wrong answer from a superseded session.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { hashMessages, continuationOf, SessionStore, type LiveSession } from '../../../dev/claude-bridge/sessions.ts'
import type { OpenAIMessage } from '../../../dev/claude-bridge/openai.ts'

const opening: OpenAIMessage[] = [
  { role: 'system', content: 'be brief' },
  { role: 'user', content: 'weather in Paris?' }
]
const withCall: OpenAIMessage[] = [
  ...opening,
  { role: 'assistant', tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'get_weather', arguments: '{"city":"Paris"}' } }] },
  { role: 'tool', tool_call_id: 'call_1', content: '{"temp":17}' }
]

test.describe('hashing', () => {
  test('is stable for identical histories', () => {
    assert.equal(hashMessages(opening), hashMessages([...opening]))
  })

  test('changes when any message changes', () => {
    const edited: OpenAIMessage[] = [{ role: 'system', content: 'be brief' }, { role: 'user', content: 'weather in Lyon?' }]
    assert.notEqual(hashMessages(opening), hashMessages(edited))
  })
})

test.describe('continuation detection', () => {
  test('recognises assistant tool_calls answered by tool messages', () => {
    const c = continuationOf(withCall)
    assert.ok(c)
    assert.equal(c.key, hashMessages(opening))
    assert.deepEqual(c.toolResults, [{ id: 'call_1', content: '{"temp":17}' }])
  })

  test('handles parallel tool calls', () => {
    const parallel: OpenAIMessage[] = [
      ...opening,
      {
        role: 'assistant',
        tool_calls: [
          { id: 'call_1', type: 'function', function: { name: 'a', arguments: '{}' } },
          { id: 'call_2', type: 'function', function: { name: 'b', arguments: '{}' } }
        ]
      },
      { role: 'tool', tool_call_id: 'call_1', content: 'r1' },
      { role: 'tool', tool_call_id: 'call_2', content: 'r2' }
    ]
    const c = continuationOf(parallel)
    assert.ok(c)
    assert.equal(c.toolResults.length, 2)
    assert.equal(c.key, hashMessages(opening))
  })

  test('a plain new user message is not a continuation', () => {
    assert.equal(continuationOf([...opening, { role: 'assistant', content: 'it rains' }, { role: 'user', content: 'and tomorrow?' }]), null)
  })

  test('an unanswered tool call is not a continuation', () => {
    assert.equal(continuationOf(withCall.slice(0, 3)), null)
  })

  test('an edited earlier turn yields a different key, so it misses', () => {
    const edited = [{ role: 'system', content: 'be VERY brief' }, ...withCall.slice(1)] as OpenAIMessage[]
    const c = continuationOf(edited)
    assert.ok(c)
    assert.notEqual(c.key, hashMessages(opening))
  })
})

test.describe('session store lifecycle', () => {
  // lastSeen defaults to now: a session built at epoch 0 is already past the TTL,
  // so get() would correctly expire it before the test could observe anything.
  // The expiry test below sets lastSeen back to 0 deliberately.
  const make = (key: string, aborted: string[] = []): LiveSession =>
    ({ key, pending: new Map(), abort: () => aborted.push(key), lastSeen: Date.now() })

  test('stores and retrieves by key', () => {
    const store = new SessionStore()
    store.set(make('a'))
    assert.equal(store.get('a')?.key, 'a')
    assert.equal(store.get('missing'), undefined)
  })

  test('expired entries are swept and aborted', () => {
    const aborted: string[] = []
    const store = new SessionStore({ ttlMs: 1000 })
    const s = make('a', aborted)
    s.lastSeen = 0
    store.set(s)
    store.sweep(5000)
    assert.equal(store.get('a'), undefined)
    assert.deepEqual(aborted, ['a'])
  })

  test('evicts least-recently-used past the cap, aborting the evicted query', () => {
    const aborted: string[] = []
    const store = new SessionStore({ max: 2 })
    const a = make('a', aborted); a.lastSeen = 1
    const b = make('b', aborted); b.lastSeen = 2
    const c = make('c', aborted); c.lastSeen = 3
    store.set(a); store.set(b); store.set(c)
    assert.equal(store.size, 2)
    assert.equal(store.get('a'), undefined)
    assert.deepEqual(aborted, ['a'])
  })

  test('delete aborts the live query', () => {
    const aborted: string[] = []
    const store = new SessionStore()
    store.set(make('a', aborted))
    store.delete('a')
    assert.deepEqual(aborted, ['a'])
    assert.equal(store.size, 0)
  })

  test('rekey re-files a surviving session WITHOUT aborting it', () => {
    const aborted: string[] = []
    const store = new SessionStore()
    store.set(make('old', aborted))
    store.rekey('old', 'new')
    assert.deepEqual(aborted, [], 'a continuing session must not be aborted')
    assert.equal(store.get('old'), undefined)
    assert.equal(store.get('new')?.key, 'new')
  })
})
