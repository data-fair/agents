/**
 * Stateless unit tests for the chat autoscroll / sub-agent panel helpers.
 *
 * These pin down the two behaviours that were previously flaky:
 *   - `streamedLength` must grow while a SUB-AGENT streams (not only when the
 *     parent assistant message's own content grows), so stick-to-bottom keeps
 *     following the tail during delegation.
 *   - panels no longer auto-open; only `streamedLength` is exercised here.
 *
 * The helpers take a structural subset of the real `ChatMessage`, so the test
 * data only carries the fields the helpers actually read.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { streamedLength, type ScrollMessage } from '../../../ui/src/components/agent-chat/auto-scroll.ts'

const sub = (name: string) => ({ toolName: `subagent_${name}` })

test.describe('streamedLength (autoscroll growth signal)', () => {
  test('empty transcript → 0', () => {
    assert.equal(streamedLength([]), 0)
  })

  test('counts each message and its top-level content', () => {
    const messages: ScrollMessage[] = [
      { content: 'hi' }, // 1 + 2
      { content: 'world' } // 1 + 5
    ]
    assert.equal(streamedLength(messages), 9)
  })

  test('grows when tool-invocation chips are added', () => {
    const before: ScrollMessage[] = [{ content: 'x' }]
    const after: ScrollMessage[] = [{
      content: 'x',
      toolInvocations: [{ toolName: 'set_display' }, { toolName: 'query_data' }]
    }]
    assert.ok(streamedLength(after) > streamedLength(before))
  })

  test('REGRESSION: grows while a sub-agent streams even though parent content is static', () => {
    // Parent message text never changes; only the nested sub-agent panel grows.
    const base: ScrollMessage = { content: 'Delegating…', toolInvocations: [sub('data_analyst')] }
    const early: ScrollMessage[] = [{ ...base, subAgentPanels: { c1: { messages: [{ content: 'analy' }] } } }]
    const later: ScrollMessage[] = [{ ...base, subAgentPanels: { c1: { messages: [{ content: 'analysis complete' }] } } }]
    assert.ok(
      streamedLength(later) > streamedLength(early),
      'growth signal must move while the sub-agent streams, otherwise autoscroll freezes'
    )
  })

  test('grows when a sub-agent gains a tool chip', () => {
    const base: ScrollMessage = { content: 'go', toolInvocations: [sub('data_analyst')] }
    const before: ScrollMessage[] = [{ ...base, subAgentPanels: { c1: { messages: [{ content: 's' }] } } }]
    const after: ScrollMessage[] = [{
      ...base,
      subAgentPanels: { c1: { messages: [{ content: 's', toolInvocations: [{ toolName: 'get_schema' }] }] } }
    }]
    assert.ok(streamedLength(after) > streamedLength(before))
  })

  test('grows when a second concurrent panel streams under the same message', () => {
    const base: ScrollMessage = { content: 'go', toolInvocations: [sub('data_analyst'), sub('data_summarizer')] }
    const one: ScrollMessage[] = [{ ...base, subAgentPanels: { c1: { messages: [{ content: 'aa' }] } } }]
    const two: ScrollMessage[] = [{
      ...base,
      subAgentPanels: { c1: { messages: [{ content: 'aa' }] }, c2: { messages: [{ content: 'bb' }] } }
    }]
    assert.ok(streamedLength(two) > streamedLength(one), 'a second concurrent panel must also grow the signal')
  })
})
