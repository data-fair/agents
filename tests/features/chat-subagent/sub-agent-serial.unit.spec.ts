/**
 * Unit tests for the same-name serialization gate. Concurrent acquisitions of the
 * SAME key run in arrival order (one fully completes before the next starts);
 * different keys run concurrently without waiting.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createSameNameGate } from '../../../ui/src/composables/sub-agent-serial.ts'

const tick = () => new Promise(resolve => setTimeout(resolve, 5))

test.describe('createSameNameGate', () => {
  test('same key: second call waits for the first to release', async () => {
    const gate = createSameNameGate()
    const order: string[] = []

    const a = (async () => {
      const release = await gate('x')
      order.push('a-start')
      await tick()
      order.push('a-end')
      release()
    })()
    const b = (async () => {
      const release = await gate('x')
      order.push('b-start')
      release()
    })()

    await Promise.all([a, b])
    assert.deepEqual(order, ['a-start', 'a-end', 'b-start'])
  })

  test('different keys run concurrently (no cross-key wait)', async () => {
    const gate = createSameNameGate()
    const order: string[] = []

    const a = (async () => {
      const release = await gate('x')
      order.push('a-start')
      await tick() // if keys were serialized, b could not start during this gap
      order.push('a-end')
      release()
    })()
    const b = (async () => {
      const release = await gate('y')
      order.push('b-start')
      release()
    })()

    await Promise.all([a, b])
    // b started before a finished → not serialized across keys
    assert.equal(order[0], 'a-start')
    assert.equal(order[1], 'b-start')
    assert.equal(order[2], 'a-end')
  })

  test('release after rejection does not deadlock the next same-key call', async () => {
    const gate = createSameNameGate()
    const order: string[] = []

    const a = (async () => {
      const release = await gate('x')
      try {
        order.push('a')
        throw new Error('boom')
      } finally {
        release()
      }
    })().catch(() => order.push('a-caught'))
    const b = (async () => {
      const release = await gate('x')
      order.push('b')
      release()
    })()

    await Promise.all([a, b])
    assert.deepEqual(order, ['a', 'a-caught', 'b'])
  })
})
