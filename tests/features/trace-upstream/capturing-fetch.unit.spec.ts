import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createCapturingFetch, type UpstreamCaptureSink } from '../../../api/src/models/capturing-fetch.ts'

function streamResponse (body: string, status = 200) {
  const stream = new ReadableStream<Uint8Array>({
    start (c) { c.enqueue(new TextEncoder().encode(body)); c.close() }
  })
  return new Response(stream, { status })
}

test('captures request body+url and full streamed response, body passes through intact', async () => {
  const sink: UpstreamCaptureSink = {}
  const fetchImpl = createCapturingFetch(sink, { baseFetch: async () => streamResponse('hello-raw') })
  const res = await fetchImpl('http://x/v1/chat/completions', { method: 'POST', body: '{"model":"glm"}', headers: { authorization: 'Bearer secret' } })
  const seen = await res.text() // consumer drains the stream
  assert.equal(seen, 'hello-raw')
  assert.equal(sink.request?.url, 'http://x/v1/chat/completions')
  assert.deepEqual(sink.request?.body, { model: 'glm' })
  assert.equal(sink.response?.raw, 'hello-raw')
  assert.equal(sink.response?.rawChars, 9)
  assert.equal(sink.response?.status, 200)
  // headers (incl. authorization) are never recorded anywhere on the sink
  assert.equal(JSON.stringify(sink).includes('secret'), false)
})

test('truncates raw beyond the cap and flags it', async () => {
  const sink: UpstreamCaptureSink = {}
  const fetchImpl = createCapturingFetch(sink, { baseFetch: async () => streamResponse('abcdefghij'), cap: 4 })
  await (await fetchImpl('http://x', { body: '{}' })).text()
  assert.equal(sink.response?.raw, 'abcd')
  assert.equal(sink.response?.truncated, true)
  assert.equal(sink.response?.rawChars, 10)
})
