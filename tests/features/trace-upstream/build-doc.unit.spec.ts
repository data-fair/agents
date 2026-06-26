import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { buildTraceRequestDoc, type BuildTraceInput } from '../../../api/src/traces/operations.ts'

function baseInput (): BuildTraceInput {
  return {
    owner: {
      type: 'user',
      id: 'u1'
    },
    conversationId: 'c1',
    contextId: 'turn:abc',
    modelRole: 'assistant',
    providerName: 'P',
    providerType: 'openai-compatible',
    resolvedModel: 'glm',
    body: {
      messages: [],
      tools: []
    },
    response: {
      content: '',
      toolCalls: [],
      finishReason: 'stop'
    },
    usage: {
      inputTokens: 1,
      outputTokens: 2
    },
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    timing: {
      durationMs: 5
    }
  }
}

test('buildTraceRequestDoc includes upstream when provided', () => {
  const input = {
    ...baseInput(),
    upstream: {
      request: {
        url: 'http://x/v1/chat/completions',
        body: {
          model: 'glm'
        },
        bodyChars: 14
      },
      response: {
        status: 200,
        raw: 'data: ...',
        rawChars: 9
      }
    }
  }
  const doc = buildTraceRequestDoc(input, new Date(0))
  assert.equal(doc.upstream?.request.url, 'http://x/v1/chat/completions')
  assert.equal(doc.upstream?.response.status, 200)
})

test('buildTraceRequestDoc omits upstream key when absent', () => {
  const doc = buildTraceRequestDoc(baseInput(), new Date(0))
  assert.equal('upstream' in doc, false)
})
