/**
 * stateless unit tests for the compaction decision: when to compact, and where
 * to cut so a tool call is never separated from its tool result.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import type { ModelMessage } from 'ai'
import {
  decideCompaction,
  isTurnBoundary,
  estimateTokens,
  retainedToolNames,
  RETENTION_SHARE
} from '../../../ui/src/utils/compaction-policy.ts'

const userMsg = (text: string): ModelMessage => ({ role: 'user', content: text })
const asstMsg = (text: string): ModelMessage => ({ role: 'assistant', content: text })
const toolCall = (id: string): ModelMessage => ({
  role: 'assistant',
  content: [{ type: 'tool-call', toolCallId: id, toolName: 'search', input: {} }]
} as ModelMessage)
const toolResult = (id: string): ModelMessage => ({
  role: 'tool',
  content: [{ type: 'tool-result', toolCallId: id, toolName: 'search', output: { type: 'text', value: 'ok' } }]
} as ModelMessage)

/** n turns of user+assistant, each roughly `chars` characters. */
function conversation (turns: number, chars = 400): ModelMessage[] {
  const out: ModelMessage[] = []
  for (let i = 0; i < turns; i++) {
    out.push(userMsg(`q${i} `.padEnd(chars, 'x')))
    out.push(asstMsg(`a${i} `.padEnd(chars, 'y')))
  }
  return out
}

test.describe('decideCompaction — trigger', () => {
  test('under budget → no compaction', () => {
    const d = decideCompaction({
      history: conversation(3), lastInputTokens: 1000, appendedChars: 0, budget: 140000, generation: 0
    })
    assert.equal(d.compact, false)
    assert.equal(d.reason, 'under-budget')
  })

  test('the appended-chars estimate can push fill over budget on its own', () => {
    const d = decideCompaction({
      history: conversation(40), lastInputTokens: 900, appendedChars: 1200, budget: 1000, generation: 0
    })
    assert.equal(d.compact, true)
  })

  test('fill uses the provider total, not the serialized history length', () => {
    // ~32k tokens of history, but the trigger is the measured prompt (35k > 30k).
    // A character-only measure would also have to know about the system prompt and
    // tool schemas to reach the same conclusion; this one gets them for free.
    const d = decideCompaction({
      history: conversation(150), lastInputTokens: 35000, appendedChars: 0, budget: 30000, generation: 0
    })
    assert.equal(d.compact, true)
  })

  test('a huge measured prompt with a small history cannot be fixed by compacting', () => {
    // The prompt is dominated by the system prompt and tool schemas, not by history.
    // Compaction has nothing to reclaim and must not burn a summarizer call saying so.
    const d = decideCompaction({
      history: conversation(20), lastInputTokens: 150000, appendedChars: 0, budget: 140000, generation: 0
    })
    assert.equal(d.compact, false)
    assert.equal(d.reason, 'nothing-to-compact')
  })
})

test.describe('decideCompaction — guards', () => {
  test('empty history → nothing to compact', () => {
    const d = decideCompaction({
      history: [], lastInputTokens: 999999, appendedChars: 0, budget: 1000, generation: 0
    })
    assert.equal(d.compact, false)
    assert.equal(d.reason, 'nothing-to-compact')
  })

  test('a single user message → nothing to compact', () => {
    const d = decideCompaction({
      history: [userMsg('hello')], lastInputTokens: 999999, appendedChars: 0, budget: 1000, generation: 0
    })
    assert.equal(d.compact, false)
    assert.equal(d.reason, 'nothing-to-compact')
  })

  test('below the floor → skip rather than pay a summarizer call for a sliver', () => {
    // Over budget (2000 > 1500), but retention (30% of 1500 = 450 tokens) swallows
    // all but the first two messages, so the prefix is ~216 tokens — under the
    // 300-token floor. Summarizing that costs more than the context it reclaims.
    const d = decideCompaction({
      history: conversation(3), lastInputTokens: 2000, appendedChars: 0, budget: 1500, generation: 0
    })
    assert.equal(d.compact, false)
    assert.equal(d.reason, 'below-floor')
  })

  test('everything fitting in the retention window → nothing to compact', () => {
    const d = decideCompaction({
      history: conversation(2), lastInputTokens: 200000, appendedChars: 0, budget: 140000, generation: 0
    })
    assert.equal(d.compact, false)
    assert.equal(d.reason, 'nothing-to-compact')
  })
})

test.describe('decideCompaction — what survives', () => {
  test('keeps the last user message and recent turns verbatim', () => {
    const history = [...conversation(60), userMsg('the latest question')]
    const d = decideCompaction({
      history, lastInputTokens: 200000, appendedChars: 0, budget: 20000, generation: 0
    })
    assert.equal(d.compact, true)
    if (!d.compact) return
    assert.deepEqual(d.retained[d.retained.length - 1], userMsg('the latest question'))
    assert.ok(d.retained.length > 1, 'more than the last message survives')
    assert.ok(d.prefixToSummarize.length > 0)
  })

  test('prefix and retained partition the history exactly, in order', () => {
    const history = [...conversation(60), userMsg('latest')]
    const d = decideCompaction({
      history, lastInputTokens: 200000, appendedChars: 0, budget: 20000, generation: 0
    })
    assert.equal(d.compact, true)
    if (!d.compact) return
    assert.deepEqual([...d.prefixToSummarize, ...d.retained], history)
  })

  test('retention stays near its share of budget', () => {
    const history = [...conversation(200), userMsg('latest')]
    const budget = 20000
    const d = decideCompaction({
      history, lastInputTokens: 200000, appendedChars: 0, budget, generation: 0
    })
    assert.equal(d.compact, true)
    if (!d.compact) return
    const retainedTokens = d.retained.reduce((n, m) => n + estimateTokens(JSON.stringify(m).length), 0)
    assert.ok(retainedTokens <= budget * RETENTION_SHARE * 1.5, `retained ${retainedTokens}`)
  })

  test('generation increments', () => {
    const history = [...conversation(60), userMsg('latest')]
    const d = decideCompaction({
      history, lastInputTokens: 200000, appendedChars: 0, budget: 20000, generation: 2
    })
    assert.equal(d.compact, true)
    if (!d.compact) return
    assert.equal(d.generation, 3)
  })
})

test.describe('retainedToolNames — exact match only, drop when unsure', () => {
  test('extracts a name from a tool-call part', () => {
    const retained = [userMsg('q'), toolCall('c1'), toolResult('c1')]
    const names = retainedToolNames(retained)
    assert.ok(names.has('search'))
  })

  test('extracts names listed inside a <tools-available> notice', () => {
    const notice = userMsg(
      '<tools-available>\n' +
      'Not yet callable — pass your intent to explore_tools to activate the ones you need:\n' +
      'browse_web, fetch_page\n' +
      '</tools-available>'
    )
    const names = retainedToolNames([notice])
    assert.ok(names.has('browse_web'))
    assert.ok(names.has('fetch_page'))
  })

  test('a tool name that only appears as an ordinary word in recap prose is NOT retained (false-positive guard)', () => {
    // "search" is a real tool name elsewhere, but here it shows up only inside the
    // summarizer's recap text — never as a toolName on a tool-call/tool-result part,
    // and never inside a <tools-available> notice. A substring scan over the
    // serialized window would wrongly keep it; the exact-match extraction must not.
    const recap = userMsg('[Automatic recap] The user asked us to search for a restaurant and we did a quick search of the area.')
    const names = retainedToolNames([recap])
    assert.equal(names.has('search'), false)
  })
})

test.describe('turn boundaries — a tool call is never split from its result', () => {
  test('isTurnBoundary rejects a cut between a tool call and its result', () => {
    const history = [userMsg('q'), toolCall('c1'), toolResult('c1'), asstMsg('a')]
    assert.equal(isTurnBoundary(history, 2), false)
    assert.equal(isTurnBoundary(history, 3), true)
  })

  test('isTurnBoundary accepts a cut before a user message', () => {
    const history = [userMsg('q1'), asstMsg('a1'), userMsg('q2')]
    assert.equal(isTurnBoundary(history, 2), true)
  })

  test('the chosen cut never orphans a tool result', () => {
    const history: ModelMessage[] = []
    for (let i = 0; i < 40; i++) {
      history.push(userMsg(`q${i} `.padEnd(400, 'x')))
      history.push(toolCall(`c${i}`))
      history.push(toolResult(`c${i}`))
      history.push(asstMsg(`a${i} `.padEnd(400, 'y')))
    }
    history.push(userMsg('latest'))

    const d = decideCompaction({
      history, lastInputTokens: 500000, appendedChars: 0, budget: 20000, generation: 0
    })
    assert.equal(d.compact, true)
    if (!d.compact) return
    // No retained tool message may reference a call that stayed behind in the prefix.
    const retainedCallIds = new Set<string>()
    for (const m of d.retained) {
      if (m.role !== 'assistant' || !Array.isArray(m.content)) continue
      for (const part of m.content as any[]) {
        if (part.type === 'tool-call') retainedCallIds.add(part.toolCallId)
      }
    }
    for (const m of d.retained) {
      if (m.role !== 'tool' || !Array.isArray(m.content)) continue
      for (const part of m.content as any[]) {
        assert.ok(retainedCallIds.has(part.toolCallId), `orphaned tool result ${part.toolCallId}`)
      }
    }
  })

  test('the retained window always starts on a turn boundary', () => {
    const history: ModelMessage[] = []
    for (let i = 0; i < 40; i++) {
      history.push(userMsg(`q${i} `.padEnd(400, 'x')))
      history.push(toolCall(`c${i}`))
      history.push(toolResult(`c${i}`))
      history.push(asstMsg(`a${i} `.padEnd(400, 'y')))
    }
    history.push(userMsg('latest'))
    const d = decideCompaction({
      history, lastInputTokens: 500000, appendedChars: 0, budget: 20000, generation: 0
    })
    assert.equal(d.compact, true)
    if (!d.compact) return
    assert.equal(isTurnBoundary(history, d.prefixToSummarize.length), true)
  })
})
