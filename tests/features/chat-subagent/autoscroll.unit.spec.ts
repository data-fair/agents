/**
 * Stateless unit tests for the chat autoscroll / sub-agent panel helpers.
 *
 * These pin down the two behaviours that were previously flaky:
 *   - `streamedLength` must grow while a SUB-AGENT streams (not only when the
 *     parent assistant message's own content grows), so stick-to-bottom keeps
 *     following the tail during delegation.
 *   - `latestSubAgentPanel` must always point at the newest sub-agent panel, so
 *     it opens deterministically and switching to the next one collapses the
 *     previous — independent of any scroll state.
 *
 * The helpers take a structural subset of the real `ChatMessage`, so the test
 * data only carries the fields the helpers actually read.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { streamedLength, latestSubAgentPanel, type ScrollMessage } from '../../../ui/src/components/agent-chat/auto-scroll.ts'

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
    // Parent message text never changes; only the nested sub-agent grows.
    const base: ScrollMessage = { content: 'Delegating…', toolInvocations: [sub('data_analyst')] }
    const early: ScrollMessage[] = [{ ...base, subAgentMessages: [{ content: 'analy' }] }]
    const later: ScrollMessage[] = [{ ...base, subAgentMessages: [{ content: 'analysis complete' }] }]
    assert.ok(
      streamedLength(later) > streamedLength(early),
      'growth signal must move while the sub-agent streams, otherwise autoscroll freezes'
    )
  })

  test('grows when a sub-agent gains a tool chip', () => {
    const base: ScrollMessage = { content: 'go', toolInvocations: [sub('data_analyst')] }
    const before: ScrollMessage[] = [{ ...base, subAgentMessages: [{ content: 's' }] }]
    const after: ScrollMessage[] = [{
      ...base,
      subAgentMessages: [{ content: 's', toolInvocations: [{ toolName: 'get_schema' }] }]
    }]
    assert.ok(streamedLength(after) > streamedLength(before))
  })
})

test.describe('latestSubAgentPanel (auto-open target)', () => {
  test('undefined message → undefined', () => {
    assert.equal(latestSubAgentPanel(undefined), undefined)
  })

  test('no tool invocations → undefined', () => {
    assert.equal(latestSubAgentPanel({ content: 'hi' }), undefined)
  })

  test('only non-subagent tools → undefined (no panel)', () => {
    assert.equal(latestSubAgentPanel({ content: 'x', toolInvocations: [{ toolName: 'set_display' }] }), undefined)
  })

  test('single sub-agent → index 0', () => {
    assert.equal(latestSubAgentPanel({ content: 'x', toolInvocations: [sub('data_analyst')] }), 0)
  })

  test('multiple sub-agents → latest index (count - 1), collapsing the previous', () => {
    const message: ScrollMessage = {
      content: 'x',
      toolInvocations: [sub('data_analyst'), sub('writer'), sub('reviewer')]
    }
    assert.equal(latestSubAgentPanel(message), 2)
  })

  test('ignores interleaved non-subagent tools when counting panels', () => {
    const message: ScrollMessage = {
      content: 'x',
      toolInvocations: [sub('data_analyst'), { toolName: 'set_display' }, sub('writer')]
    }
    assert.equal(latestSubAgentPanel(message), 1)
  })
})
