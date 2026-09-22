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
      prices: { inputPricePerMillion: 0, outputPricePerMillion: 0 },
      eurosPerCredit: 0.4
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

  test('buildTraceRequestDoc computes the credit breakdown from tokens and prices', () => {
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
      // a peg of exactly 1 keeps these exact: dividing by 0.4 would yield
      // 2.9999999999999996, which deepEqual rejects. The peg itself is covered by
      // the cache test below, whose expectation is built from the same operations.
      prices: { inputPricePerMillion: 3, outputPricePerMillion: 12 },
      eurosPerCredit: 1
    }, now)
    // input: 1e6 × 3 / 1e6 = 3 ; output: 500 000 × 12 / 1e6 = 6
    assert.deepEqual(doc.cost, { input: 3, output: 6, total: 9 })
  })

  test('buildTraceRequestDoc yields zero cost when the model is priced at zero', () => {
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
      prices: { inputPricePerMillion: 0, outputPricePerMillion: 0 },
      eurosPerCredit: 0.4
    }, now)
    assert.deepEqual(doc.cost, { input: 0, output: 0, total: 0 })
  })

  test('buildTraceRequestDoc bills cache reads at the cache price', () => {
    // The breakdown and the billed total come from one computation, so a cached turn
    // cannot show a trace cost higher than what was actually charged.
    const now = new Date('2026-06-08T00:00:00.000Z')
    const doc = buildTraceRequestDoc({
      owner: { type: 'user', id: 'u1' },
      conversationId: 'c1',
      contextId: 'turn:t1',
      modelRole: 'assistant',
      providerName: 'Scaleway',
      providerType: 'scaleway',
      resolvedModel: 'deepseek-v4-flash-0731',
      body: { messages: [], tools: [] },
      response: { content: 'hi', toolCalls: [] },
      // 1M total input tokens, 900k cache reads, 100k freshly written
      usage: { inputTokens: 1_000_000, outputTokens: 0, cacheReadTokens: 900_000, cacheWriteTokens: 100_000 },
      timing: { durationMs: 10 },
      prices: { inputPricePerMillion: 0.4, cachedInputPricePerMillion: 0.08, outputPricePerMillion: 0.8 },
      eurosPerCredit: 0.4
    }, now)
    // noCache = 0, so euros = 100k write @0.40 + 900k read @0.08 = 0.04 + 0.072
    const expectedInput = (0.04 + 0.072) / 0.4
    assert.deepEqual(doc.cost, { input: expectedInput, output: 0, total: expectedInput })
  })
})
