import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { reconstructTrace } from '../../../ui/src/traces/reconstruct-trace.ts'

const upstream = {
  request: {
    url: 'http://x/v1/chat/completions',
    body: { model: 'glm' },
    bodyChars: 14
  },
  response: {
    status: 200,
    raw: 'reasoning bytes',
    rawChars: 15
  }
}

test('reconstructTrace passes upstream through to the physical request', () => {
  const trace = reconstructTrace([{
    owner: {
      type: 'user',
      id: 'u'
    },
    conversation: { id: 'c' },
    contextId: 'turn:1',
    contextKind: 'turn',
    modelRole: 'assistant',
    operation: { name: 'chat' },
    provider: {
      name: 'P',
      type: 'openai-compatible'
    },
    request: {
      model: 'glm',
      body: { messages: [{ role: 'user', content: 'hi' }] },
      messageCount: 1,
      toolCount: 0,
      bodyChars: 10
    },
    response: {
      content: 'x',
      toolCalls: [],
      finishReason: 'stop'
    },
    usage: {
      inputTokens: 1,
      outputTokens: 1
    },
    timing: { durationMs: 1 },
    upstream,
    createdAt: new Date(0)
  } as any])
  assert.deepEqual(trace.physicalRequests[0].upstream, upstream)
})
