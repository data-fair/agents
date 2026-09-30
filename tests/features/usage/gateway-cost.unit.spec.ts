import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createSseCostScanner, watchResponseCost } from '../../../ui/src/utils/gateway-cost.ts'
import { extractQuotaError } from '../../../ui/src/utils/error.ts'

const chunk = (obj: any) => `data: ${JSON.stringify(obj)}\n\n`

test.describe('createSseCostScanner', () => {
  test('reads usage.cost from the final chunk only', () => {
    const costs: number[] = []
    const s = createSseCostScanner(c => costs.push(c))
    s.push(chunk({ choices: [{ delta: { content: 'hi' } }] }))
    s.push(chunk({ choices: [{ delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 3, cost: 0.25 } }))
    s.push('data: [DONE]\n\n')
    assert.deepEqual(costs, [0.25])
  })

  test('a line split across two reads is parsed once', () => {
    const costs: number[] = []
    const s = createSseCostScanner(c => costs.push(c))
    const line = chunk({ choices: [], usage: { cost: 1.5 } })
    s.push(line.slice(0, 20))
    s.push(line.slice(20))
    assert.deepEqual(costs, [1.5])
  })

  test('ignores usage without cost, and malformed lines', () => {
    const costs: number[] = []
    const s = createSseCostScanner(c => costs.push(c))
    s.push(chunk({ usage: { prompt_tokens: 3 } }))
    s.push('data: {"usage": {"cost": \n\n')
    assert.deepEqual(costs, [])
  })
})

test.describe('watchResponseCost', () => {
  test('JSON body: reads usage.cost and leaves the body readable', async () => {
    const costs: number[] = []
    const res = new Response(JSON.stringify({ usage: { cost: 2 } }), { headers: { 'content-type': 'application/json' } })
    const out = await watchResponseCost(res, c => costs.push(c))
    assert.deepEqual(await out.json(), { usage: { cost: 2 } })
    assert.deepEqual(costs, [2])
  })

  test('SSE body: the consumer gets every byte and the cost is reported', async () => {
    const costs: number[] = []
    const body = chunk({ choices: [] }) + chunk({ usage: { cost: 0.5 } }) + 'data: [DONE]\n\n'
    const res = new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream', 'x-context-budget': '42' } })
    const out = await watchResponseCost(res, c => costs.push(c))
    assert.equal(out.headers.get('x-context-budget'), '42')
    assert.equal(await out.text(), body)
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.deepEqual(costs, [0.5])
  })

  test('SSE body that errors mid-way (abort) does not reject unhandled', async () => {
    const costs: number[] = []
    const stream = new ReadableStream({
      start (controller) {
        controller.enqueue(new TextEncoder().encode(chunk({ choices: [] })))
        controller.error(new DOMException('aborted', 'AbortError'))
      }
    })
    const out = await watchResponseCost(new Response(stream, { headers: { 'content-type': 'text/event-stream' } }), c => costs.push(c))
    await assert.rejects(out.text())
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.deepEqual(costs, [])
  })

  test('an error response is passed through untouched', async () => {
    const res = new Response('{"error":{}}', { status: 429, headers: { 'content-type': 'application/json' } })
    const out = await watchResponseCost(res, () => assert.fail('no cost on an error'))
    assert.equal(out.status, 429)
    assert.equal(await out.text(), '{"error":{}}')
  })
})

test.describe('extractQuotaError', () => {
  const body = { error: { message: 'Daily cost quota exceeded', type: 'rate_limit_error', scope: 'user', period: 'daily', resets_at: '2026-10-01T00:00:00.000Z' } }

  test('from parsed data deep in the cause chain', () => {
    const err = { message: 'wrapper', cause: { message: 'x', cause: { data: body } } }
    assert.deepEqual(extractQuotaError(err), { scope: 'user', period: 'daily', resetsAt: '2026-10-01T00:00:00.000Z', message: 'Daily cost quota exceeded' })
  })

  test('from a JSON string responseBody', () => {
    assert.equal(extractQuotaError({ responseBody: JSON.stringify(body) })?.scope, 'user')
  })

  test('from a RetryError-shaped error (lastError, not cause)', () => {
    const full = { error: { message: 'Daily cost quota exceeded', type: 'rate_limit_error', scope: 'user', period: 'daily', resets_at: '2026-10-01T00:00:00.000Z' } }
    const err = { message: 'Failed after 3 attempts', lastError: { statusCode: 429, data: { error: { type: 'rate_limit_error', message: 'Daily cost quota exceeded' } }, responseBody: JSON.stringify(full) } }
    assert.deepEqual(extractQuotaError(err), { scope: 'user', period: 'daily', resetsAt: '2026-10-01T00:00:00.000Z', message: 'Daily cost quota exceeded' })
  })

  test('lastError is checked even when a cause exists', () => {
    const err = { cause: { message: 'unrelated' }, lastError: { data: body } }
    assert.equal(extractQuotaError(err)?.scope, 'user')
  })

  test('truncated parsed data: the complete responseBody wins', () => {
    const err = { data: { error: { type: 'rate_limit_error', message: 'Daily cost quota exceeded' } }, responseBody: JSON.stringify(body) }
    assert.deepEqual(extractQuotaError(err), { scope: 'user', period: 'daily', resetsAt: '2026-10-01T00:00:00.000Z', message: 'Daily cost quota exceeded' })
  })

  test('null for any other error', () => {
    assert.equal(extractQuotaError(new Error('boom')), null)
    assert.equal(extractQuotaError({ data: { error: { message: 'no', type: 'invalid_request_error' } } }), null)
    assert.equal(extractQuotaError({ responseBody: '403 - Error: forbidden' }), null)
  })
})
