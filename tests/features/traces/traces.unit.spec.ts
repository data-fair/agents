import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { parseContextId, buildTraceRequestDoc } from '../../../api/src/traces/operations.ts'

test.describe('traces operations (unit)', () => {
  test('parseContextId classifies the three kinds', () => {
    assert.deepEqual(parseContextId('turn:abc'), { kind: 'turn', uid: 'abc' })
    assert.deepEqual(parseContextId('compaction:xyz'), { kind: 'compaction', uid: 'xyz' })
    assert.deepEqual(parseContextId('sub:Researcher:2:uid9'), { kind: 'sub', uid: 'uid9', agent: { name: 'Researcher', index: 2 } })
    assert.deepEqual(parseContextId('weird'), { kind: 'unknown', uid: 'weird' })
  })

  test('parseContextId tolerates malformed sub contexts', () => {
    assert.deepEqual(parseContextId('sub:OnlyName'), { kind: 'sub', uid: '', agent: { name: 'OnlyName' } })
    assert.deepEqual(parseContextId('sub:Name:notanumber:uid'), { kind: 'sub', uid: 'uid', agent: { name: 'Name' } })
  })

  test('buildTraceRequestDoc sets TTL, agent and ordering fields', () => {
    const now = new Date('2026-06-08T00:00:00.000Z')
    const doc = buildTraceRequestDoc({
      owner: { type: 'user', id: 'u1' },
      userId: 'u1',
      userName: 'User One',
      conversationId: 'conv1',
      contextId: 'sub:Researcher:0:uid1',
      modelRole: 'assistant',
      providerName: 'Mock',
      providerType: 'mock',
      resolvedModel: 'mock-model',
      body: { model: 'assistant', messages: [{ role: 'user', content: 'hi' }], tools: [] },
      response: { content: 'world', toolCalls: [], finishReason: 'stop' },
      usage: { inputTokens: 0, outputTokens: 0 },
      timing: { durationMs: 12 },
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    }, now)

    assert.equal(doc.conversation.id, 'conv1')
    assert.equal(doc.contextKind, 'sub')
    assert.deepEqual(doc.agent, { name: 'Researcher', index: 0 })
    assert.equal(doc.request.messageCount, 1)
    assert.equal(doc.request.toolCount, 0)
    // createdAt is a BSON Date (the TTL index on it expires the doc after 30 days)
    assert.ok(doc.createdAt instanceof Date)
    assert.equal(doc.createdAt.getTime(), now.getTime())
  })

  test('buildTraceRequestDoc computes the cost breakdown from tokens and prices', () => {
    const now = new Date('2026-06-08T00:00:00.000Z')
    const doc = buildTraceRequestDoc({
      owner: { type: 'user', id: 'u1' },
      conversationId: 'c1',
      contextId: 'turn:t1',
      modelRole: 'assistant',
      providerName: 'OpenAI',
      providerType: 'openai',
      resolvedModel: 'gpt-5',
      body: { messages: [], tools: [] },
      response: { content: 'hi', toolCalls: [] },
      usage: { inputTokens: 1_000_000, outputTokens: 500_000 },
      timing: { durationMs: 10 },
      inputPricePerMillion: 3,
      outputPricePerMillion: 6
    }, now)
    assert.deepEqual(doc.cost, { input: 3, output: 3, total: 6 })
  })

  test('buildTraceRequestDoc yields zero cost when prices are zero', () => {
    const now = new Date('2026-06-08T00:00:00.000Z')
    const doc = buildTraceRequestDoc({
      owner: { type: 'user', id: 'u1' },
      conversationId: 'c1',
      contextId: 'turn:t1',
      modelRole: 'assistant',
      providerName: 'Mock',
      providerType: 'mock',
      resolvedModel: 'm',
      body: { messages: [], tools: [] },
      response: { content: '', toolCalls: [] },
      usage: { inputTokens: 100, outputTokens: 10 },
      timing: { durationMs: 1 },
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    }, now)
    assert.deepEqual(doc.cost, { input: 0, output: 0, total: 0 })
  })
})
