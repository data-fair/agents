import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { parseFlagsCookie, buildTraceRequestDoc, type BuildTraceInput } from '../../../api/src/traces/operations.ts'

const baseInput: BuildTraceInput = {
  owner: { type: 'user', id: 'u1' },
  conversationId: 'c1',
  contextId: 'turn:t1',
  modelRole: 'assistant',
  providerName: 'Mock',
  providerType: 'mock',
  resolvedModel: 'm',
  body: { messages: [], tools: [] },
  response: { content: '', toolCalls: [] },
  usage: { inputTokens: 0, outputTokens: 0 },
  timing: { durationMs: 1 }
}

test.describe('trace flags (unit)', () => {
  test('parses positive flags from the cookie header', () => {
    const cookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify({ toolExploration: true, subAgents: false, mermaid: true }))}; other=1`
    assert.deepEqual(parseFlagsCookie(cookie), { toolExploration: true, subAgents: false, mermaid: true })
  })
  test('subAgents defaults to true when the cookie key is missing it', () => {
    const cookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify({ mermaid: true }))}`
    assert.deepEqual(parseFlagsCookie(cookie), { toolExploration: false, subAgents: true, mermaid: true })
  })
  test('returns undefined for absent or malformed cookie', () => {
    assert.equal(parseFlagsCookie(undefined), undefined)
    assert.equal(parseFlagsCookie('other=1'), undefined)
    assert.equal(parseFlagsCookie('agent-chat-flags=not-json'), undefined)
  })
  test('builder includes flags only when present', () => {
    const withFlags = buildTraceRequestDoc({ ...baseInput, flags: { toolExploration: true, subAgents: true, mermaid: false } }, new Date())
    assert.deepEqual(withFlags.flags, { toolExploration: true, subAgents: true, mermaid: false })
    const withoutFlags = buildTraceRequestDoc(baseInput, new Date())
    assert.equal('flags' in withoutFlags, false)
  })
})
