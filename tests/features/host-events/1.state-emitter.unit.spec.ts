import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  serializeDetail, buildAgentEvent, createStateEmitter,
  EVENT_DETAIL_MAX_CHARS, TRUNCATED_MARKER
} from '../../../lib-vue/host-events.ts'

test.describe('serializeDetail / buildAgentEvent', () => {
  test('objects are JSON, strings pass through, empty is undefined', () => {
    assert.equal(serializeDetail({ a: 1 }), '{"a":1}')
    assert.equal(serializeDetail('plain'), 'plain')
    assert.equal(serializeDetail(undefined), undefined)
    assert.equal(serializeDetail(null), undefined)
  })

  test('detail is capped with a marker', () => {
    const long = 'x'.repeat(EVENT_DETAIL_MAX_CHARS + 50)
    const out = serializeDetail(long)!
    assert.equal(out.length, EVENT_DETAIL_MAX_CHARS)
    assert.ok(out.endsWith(TRUNCATED_MARKER))
  })

  test('buildAgentEvent omits absent fields', () => {
    const e = buildAgentEvent('saved', undefined, undefined, 123)
    assert.deepEqual(e, { name: 'saved', at: 123 })
    const k = buildAgentEvent('navigated', { to: '/x' }, 'location', 5)
    assert.deepEqual(k, { name: 'navigated', detail: '{"to":"/x"}', key: 'location', at: 5 })
  })
})

test.describe('createStateEmitter', () => {
  test('emits a keyed event on change only', () => {
    const posted: any[] = []
    const em = createStateEmitter('wizard', m => posted.push(m))
    em.update({ step: 'type' })
    em.update({ step: 'type' })   // unchanged: no post
    em.update({ step: 'params' })
    assert.equal(posted.length, 2)
    assert.equal(posted[0].type, 'agent-event')
    assert.equal(posted[0].event.key, 'wizard')
    assert.equal(posted[0].event.name, 'wizard')
    assert.equal(posted[1].event.detail, '{"step":"params"}')
  })

  test('empty values are not emitted', () => {
    const posted: any[] = []
    const em = createStateEmitter('wizard', m => posted.push(m))
    em.update(undefined)
    em.update(null)
    assert.equal(posted.length, 0)
  })

  test('resend re-posts the last value, nothing before any value', () => {
    const posted: any[] = []
    const em = createStateEmitter('location', m => posted.push(m))
    em.resend()
    assert.equal(posted.length, 0)
    em.update('/a')
    em.resend()
    assert.equal(posted.length, 2)
    assert.equal(posted[1].event.detail, '/a')
  })

  test('dispose posts a withdrawal for the key', () => {
    const posted: any[] = []
    const em = createStateEmitter('detail', m => posted.push(m))
    em.dispose()
    assert.deepEqual(posted, [{ type: 'agent-state-withdrawn', key: 'detail' }])
  })
})
