import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { reconstructTrace } from '../../../ui/src/traces/reconstruct-trace.ts'
import { SessionRecorder } from '../../../ui/src/traces/session-recorder.ts'

const upstream = {
  request: {
    url: 'http://x/v1/chat/completions',
    body: { model: 'glm' },
    bodyChars: 14
  },
  response: {
    status: 200,
    raw: 'reasoning bytes here',
    rawChars: 20
  }
}

function recorder () {
  const trace = reconstructTrace([{
    owner: { type: 'user', id: 'u' },
    conversation: { id: 'c' },
    contextId: 'turn:1',
    contextKind: 'turn',
    modelRole: 'assistant',
    operation: { name: 'chat' },
    provider: { name: 'P', type: 'openai-compatible' },
    request: {
      model: 'glm',
      body: { messages: [{ role: 'user', content: 'hi' }] },
      messageCount: 1,
      toolCount: 0,
      bodyChars: 10
    },
    response: { content: 'x', toolCalls: [], finishReason: 'stop' },
    usage: { inputTokens: 1, outputTokens: 1 },
    timing: { durationMs: 1 },
    upstream,
    createdAt: new Date(0)
  } as any])
  return SessionRecorder.fromTrace(trace)
}

test('physical-request entry carries a compact upstream ref without the raw bytes', () => {
  const rec = recorder()
  const pr = rec.getTraceOverview().find(e => e.type === 'physical-request')!
  const entry = rec.getTraceEntry(pr.index)!
  assert.equal(entry.content.upstream.request.url, 'http://x/v1/chat/completions')
  assert.equal(entry.content.upstream.response.rawChars, 20)
  assert.equal('raw' in entry.content.upstream.response, false)
})

test('getUpstreamExchange returns the full upstream by entry index', () => {
  const rec = recorder()
  const pr = rec.getTraceOverview().find(e => e.type === 'physical-request')!
  assert.equal(rec.getUpstreamExchange(pr.index)?.response.raw, 'reasoning bytes here')
  assert.equal(rec.getUpstreamExchange(99999), null)
})
