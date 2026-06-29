import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createDebugFetch } from '../../../api/src/models/debug-fetch.ts'

const provider = { type: 'openai', id: 'abc-123' }

test('returns the base fetch unchanged when the namespace is disabled (zero overhead)', () => {
  const base = (async () => new Response('x')) as unknown as typeof fetch
  const wrapped = createDebugFetch(provider, base, { enabled: false })
  assert.equal(wrapped, base)
})

test('logs request and streamed response, passing the body through unchanged', async () => {
  const logs: string[] = []
  const logger = (msg: string, ...args: any[]) => logs.push([msg, ...args].join(' '))

  const upstreamBody = 'data: {"a":1}\n\ndata: [DONE]\n\n'
  const base = (async () => {
    const stream = new ReadableStream<Uint8Array>({
      start (c) { c.enqueue(new TextEncoder().encode(upstreamBody)); c.close() }
    })
    return new Response(stream, { status: 200 })
  }) as unknown as typeof fetch

  const wrapped = createDebugFetch(provider, base, { enabled: true, logger })
  const res = await wrapped('https://api.example.com/v1/chat/completions', {
    method: 'POST',
    body: '{"model":"gpt"}',
    headers: { authorization: 'Bearer secret' }
  } as any)

  // body passes through byte-for-byte
  const received = await res.text()
  assert.equal(received, upstreamBody)

  const joined = logs.join('\n')
  // request url + body logged...
  assert.ok(joined.includes('https://api.example.com/v1/chat/completions'))
  assert.ok(joined.includes('{"model":"gpt"}'))
  // ...response status + raw body logged...
  assert.ok(joined.includes('200'))
  assert.ok(joined.includes('[DONE]'))
  // ...but never the request headers (no API-key leakage)
  assert.ok(!joined.includes('Bearer secret'))
})
