/**
 * Unit tests for the trace handoff bridge
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { writeHandoff, readHandoff } from '../../../ui/src/traces/trace-handoff.ts'
import type { SessionTrace } from '../../../ui/src/traces/session-recorder.ts'

const fakeStorage = (): Storage => {
  const map = new Map<string, string>()
  return {
    get length () { return map.size },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v) },
    removeItem: (k: string) => { map.delete(k) }
  } as Storage
}

const sampleTrace = (): SessionTrace => ({
  systemPrompt: 's',
  toolSnapshots: [],
  toolChanges: [],
  turns: [{ userMessage: 'hi', timestamp: new Date(), steps: [] }],
  physicalRequests: []
})

test.describe('trace handoff', () => {
  test('writeHandoff then readHandoff round-trips, revives dates, and clears the key', () => {
    const storage = fakeStorage()
    assert.equal(writeHandoff(sampleTrace(), storage), true)
    const read = readHandoff(storage)
    assert.ok(read)
    assert.equal(read!.turns[0].userMessage, 'hi')
    assert.ok(read!.turns[0].timestamp instanceof Date)
    // reading consumes the key
    assert.equal(readHandoff(storage), null)
  })

  test('readHandoff returns null when nothing was written', () => {
    assert.equal(readHandoff(fakeStorage()), null)
  })

  test('writeHandoff returns false when storage throws (quota)', () => {
    const storage = { setItem: () => { throw new Error('quota') } } as unknown as Storage
    assert.equal(writeHandoff(sampleTrace(), storage), false)
  })
})
