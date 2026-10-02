/**
 * stateless unit tests for the compaction decision: when to compact, and where
 * to cut so a tool call is never separated from its tool result.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { ModelMessage } from 'ai'
import {
  decideCompaction,
  isTurnBoundary,
  estimateTokens,
  retainedToolNames,
  RETENTION_SHARE,
  FLOOR_SHARE,
  CLEAR_AT_LEAST_SHARE,
  clearOldToolResults,
  decideContextManagement,
  KEEP_TOOL_RESULTS
} from '../../../api/src/agent-loop/compaction-policy.ts'

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

/*
 * Tier 1: clearing old tool results — the cheap remedy, applied before the summarizer.
 * See docs/architecture/context-management.md for the whole policy.
 */

/** A tool result carrying a real payload, so clearing it frees something measurable. */
const bigToolResult = (id: string, toolName: string, chars = 4000): ModelMessage => ({
  role: 'tool',
  content: [{ type: 'tool-result', toolCallId: id, toolName, output: { type: 'text', value: 'r'.repeat(chars) } }]
} as ModelMessage)

const resultTextOf = (message: ModelMessage): string =>
  ((message.content as Array<{ output?: { value?: string } }>)[0].output?.value) ?? ''

/** `n` call/result pairs, oldest first, each result large enough to be worth clearing. */
function toolConversation (n: number, chars = 4000): ModelMessage[] {
  const out: ModelMessage[] = []
  for (let i = 0; i < n; i++) {
    out.push(toolCall(`c${i}`))
    out.push(bigToolResult(`c${i}`, `tool${i}`, chars))
  }
  return out
}

test.describe('clearOldToolResults', () => {
  test('keeps the most recent `keep` results and clears the older ones', () => {
    const history = toolConversation(5)
    const d = clearOldToolResults(history, 10_000)
    assert.equal(d.clear, true)
    if (!d.clear) return
    assert.equal(d.clearedCount, 5 - KEEP_TOOL_RESULTS)
    // Oldest-first: the cleared ones are the earliest, and the last KEEP are untouched.
    const results = d.history.filter(m => m.role === 'tool')
    assert.deepEqual(
      results.map(m => resultTextOf(m).startsWith('[earlier result of')),
      [true, true, false, false, false]
    )
  })

  test('a cleared result keeps its CALL and leaves a placeholder naming the tool and the size', () => {
    // The whole difference from the SDK's pruneMessages, which removes the call together with the result
    // and leaves nothing: the model must know a result existed, what produced it, and that asking again
    // would fetch it.
    const history = toolConversation(4, 5000)
    const d = clearOldToolResults(history, 10_000)
    assert.equal(d.clear, true)
    if (!d.clear) return
    // The call survives, with its arguments — what makes the call auditable.
    assert.deepEqual(history[0], d.history[0])
    const cleared = resultTextOf(d.history[1])
    assert.match(cleared, /earlier result of tool0/)
    assert.match(cleared, /5000 chars/)
    assert.match(cleared, /call the tool again/i)
  })

  test('the message LIST is unchanged, so no tool result is orphaned from its call', () => {
    // Load-bearing beyond tidiness: the executor carries a parallel `seqs` array indexed by position,
    // and isTurnBoundary reasons about positions too.
    const history = toolConversation(5)
    const d = clearOldToolResults(history, 10_000)
    assert.equal(d.clear, true)
    if (!d.clear) return
    assert.equal(d.history.length, history.length)
    assert.deepEqual(d.history.map(m => m.role), history.map(m => m.role))
  })

  test('the input history is never mutated', () => {
    // The browser's live array and the executor's loaded window must not change under the caller.
    const history = toolConversation(5)
    const before = JSON.stringify(history)
    clearOldToolResults(history, 10_000)
    assert.equal(JSON.stringify(history), before)
  })

  test('excludeTools exempts a named tool even when it is the oldest', () => {
    const history = toolConversation(5)
    const d = clearOldToolResults(history, 10_000, { excludeTools: ['tool0'] })
    assert.equal(d.clear, true)
    if (!d.clear) return
    assert.match(resultTextOf(d.history[1]), /^r+$/, 'the excluded tool keeps its payload')
    assert.match(resultTextOf(d.history[3]), /earlier result of tool1/)
  })

  test('clearAtLeast suppresses a clear that would free too little', () => {
    const history = toolConversation(5, 4000)
    const freed = clearOldToolResults(history, 10_000)
    assert.equal(freed.clear, true)
    if (!freed.clear) return
    assert.equal(clearOldToolResults(history, 10_000, { clearAtLeast: freed.freedTokens + 1 }).clear, false)
  })

  test('a result smaller than its own placeholder is left alone', () => {
    // Needs no knob, and it is what keeps a short tool ERROR readable: clearing it would GROW the
    // context rather than shrink it.
    const history = [toolCall('c0'), toolResult('c0'), ...toolConversation(4)]
    const d = clearOldToolResults(history, 10_000)
    assert.equal(d.clear, true)
    if (!d.clear) return
    assert.equal(resultTextOf(d.history[1]), 'ok', 'the tiny result is untouched')
  })

  test('nothing to clear when every result is within the keep window', () => {
    assert.deepEqual(
      clearOldToolResults(toolConversation(KEEP_TOOL_RESULTS), 10_000),
      { clear: false, reason: 'nothing-to-clear' }
    )
  })

  test('the keep default is Anthropic\'s, so the vocabulary is borrowed rather than invented', () => {
    assert.equal(KEEP_TOOL_RESULTS, 3)
  })
})

test.describe('decideContextManagement — one threshold, two remedies, cheapest first', () => {
  const overBudget = (history: ModelMessage[], budget: number) => ({
    history,
    lastInputTokens: 0,
    appendedChars: JSON.stringify(history).length,
    budget,
    generation: 0
  })

  test('under budget, neither remedy runs', () => {
    const history = toolConversation(5)
    const d = decideContextManagement({ ...overBudget(history, 1_000_000) })
    assert.equal(d.clearing.clear, false)
    assert.equal(d.compaction.compact, false)
    assert.equal(d.history, history, 'the history is handed back untouched, not copied')
  })

  test('over budget, clearing alone can avoid the summarizer entirely', () => {
    // THE saving this tier exists for, asserted directly rather than assumed: a conversation whose bulk
    // is old tool payloads comes back under budget for free, so no blocking billed model call happens.
    const history = toolConversation(8, 4000)
    const budget = estimateTokens(JSON.stringify(history).length) - 100
    const d = decideContextManagement(overBudget(history, budget))
    assert.equal(d.clearing.clear, true)
    assert.equal(d.compaction.compact, false, 'clearing must have brought it back under budget')
    assert.equal(d.compaction.compact === false && d.compaction.reason, 'under-budget')
  })

  test('still over budget after clearing → it compacts, against the CLEARED history', () => {
    // The order matters both ways: the summarizer then summarises prose rather than payloads, which is a
    // change in the recap's character worth knowing about.
    // TOOL-HEAVY, with the traffic at the HEAD: the cleared results then land in the summarised prefix,
    // where they can be observed. A prose-heavy fixture would pass the assertions below on a prefix that
    // barely changed — which is itself correct behaviour, just not what this test is about.
    const history = [...toolConversation(20, 4000), ...conversation(5, 400)]
    const d = decideContextManagement(overBudget(history, 1000))
    assert.equal(d.clearing.clear, true)
    assert.equal(d.compaction.compact, true)
    if (!d.compaction.compact) return
    const summarised = JSON.stringify(d.compaction.prefixToSummarize)
    assert.match(summarised, /earlier result of/, 'the summarizer must be handed the CLEARED prefix')
    // And materially less of it: the point of ordering the tiers this way is that the billed call digests
    // placeholders rather than payloads. (Some payloads legitimately survive — `keep` counts the most
    // recent tool results in the WHOLE history, so with tool traffic only at the head the newest of them
    // are still old.)
    const originalPrefix = JSON.stringify(history.slice(0, d.compaction.prefixToSummarize.length))
    assert.ok(summarised.length < originalPrefix.length * 0.6,
      `expected the cleared prefix to be materially smaller, got ${summarised.length} vs ${originalPrefix.length}`)
  })

  test('with nothing to clear, it behaves exactly as decideCompaction alone', () => {
    const history = conversation(40, 4000)
    const input = overBudget(history, 2000)
    const d = decideContextManagement(input)
    assert.equal(d.clearing.clear, false)
    assert.deepEqual(d.compaction, decideCompaction(input))
  })
})

test.describe('one policy, one loop', () => {
  // The requirement this design was held to was that two loops not agree only by coincidence, because
  // a constant had been copied into each — the shape every context bug on this branch came from. There
  // is ONE loop now, which settles that requirement by construction rather than by assertion.
  //
  // What survives is the half that is still falsifiable: the loop must route through the shared policy
  // instead of reimplementing it, and the doc must state the numbers the code uses. The browser-loop
  // half went with the browser loop; it was not relaxed.
  // turn-history.ts, not executor.ts: the loop's context management was split out of the executor
  // when it had grown to own the gates, the telemetry, the compaction and the model loop. This guard
  // follows the concern rather than the file it used to live in.
  const executor = readFileSync(new URL('../../../api/src/autonomous-agent-runtime/turn-history.ts', import.meta.url), 'utf8')
  const doc = readFileSync(new URL('../../../docs/architecture/context-management.md', import.meta.url), 'utf8')

  test('the executor routes through decideContextManagement', () => {
    assert.match(
      executor,
      /decideContextManagement[\s\S]{0,160}?from '\.\.\/agent-loop\/compaction-policy.ts'/,
      'the executor must import the decision from shared/'
    )
    // Assert the CALL, not only the import: an imported-and-unused function passes a weaker check
    // while changing nothing.
    assert.match(executor, /decideContextManagement\(\{/, 'the executor must actually CALL it')
    // And it must not reach past it to the tier it would otherwise apply alone: calling
    // decideCompaction directly is how a loop skips clearing and quietly diverges.
    assert.doesNotMatch(executor, /[^e]decideCompaction\(/, 'the executor must not call decideCompaction directly')
  })

  test('the loop keeps no copy of a policy constant', () => {
    assert.doesNotMatch(executor, /const (KEEP_TOOL_RESULTS|CLEAR_AT_LEAST_SHARE|RETENTION_SHARE|FLOOR_SHARE)\s*=/, 'executor')
  })

  test('the architecture doc states the numbers the code actually uses', () => {
    // The doc is part of the deliverable — a policy nobody can state without reading two implementations
    // is not established. Pinned so it cannot go stale silently.
    assert.match(doc, new RegExp(`KEEP_TOOL_RESULTS\`? = ${KEEP_TOOL_RESULTS}`))
    assert.match(doc, new RegExp(`CLEAR_AT_LEAST_SHARE\`? = ${CLEAR_AT_LEAST_SHARE * 100}%`))
    assert.match(doc, new RegExp(`RETENTION_SHARE\`? \\(${RETENTION_SHARE * 100}%\\)`))
    assert.match(doc, new RegExp(`FLOOR_SHARE\`? \\(${FLOOR_SHARE * 100}%\\)`))
    // The trigger itself, which lives in deployment config rather than in the policy module.
    const compactionPercent = readFileSync(new URL('../../../api/config/default.js', import.meta.url), 'utf8')
      .match(/compactionPercent:\s*(\d+)/)?.[1]
    assert.match(doc, new RegExp(`default ${compactionPercent}`))
  })
})
