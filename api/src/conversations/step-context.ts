/**
 * operations-style module: pure.
 *
 * CONTEXT BETWEEN THE STEPS OF A TURN (docs/architecture/context-management.md). The turn's history is
 * compacted once, before the first step (turn-history.ts); a turn of many steps — code mode, files, a task run
 * of tens of minutes — can outgrow the window on its own. Before each step:
 *
 * - tier 0: every tool result bounded to TOOL_RESULT_LIMIT, as the record already is (parts-recorder.ts), so the
 *   live model and a replay see the same thing;
 * - tier 1: when the step would exceed the budget, the oldest results replaced by placeholders
 *   (clearOldToolResults: keep 3, clear_at_least) — Anthropic's clear_tool_uses, LangChain's ClearToolUsesEdit;
 *   observation masking, which matches summarization at about half the cost (Lindenbauer et al., "The Complexity
 *   Trap", arXiv 2508.21433). No summarization mid-turn: a blocking, billed call, keyed on stored messages.
 *
 * STICKY: the loop guards rebuild each step from the full responses (loop-guards.ts), so a result cleared at
 * step N arrives whole at step N+1. The cleared ids are kept and re-applied with the same deterministic
 * placeholder (computed from the tier-0 bounded text both times), so the prefix is byte-identical from step to
 * step and the provider's cache of it survives. Nothing here touches the record.
 *
 * Only `{type:'text'}` outputs are BOUNDED (tier 0). `json`, `content` (media) and error variants are left as the
 * tools produced them (no honest string cut; media is excluded from the fill by redactModelMedia), but can still be
 * CLEARED by tier 1, and stay cleared, from the same text clearOldToolResults reads.
 */
import type { ModelMessage } from 'ai'
import { boundToolResult, redactModelMedia } from './operations.ts'
import { clearOldToolResults, clearedToolResultText, estimateTokens, toolResultText } from './compaction-policy.ts'

type ResultPart = { type: 'tool-result', toolCallId: string, toolName: string, output: { type: string, value?: unknown } }

const textOf = (output: ResultPart['output']) => output?.type === 'text' && typeof output.value === 'string' ? output.value : undefined

/** Each tool-result part through `rewrite` (copied, never mutated: the SDK's response messages are shared). */
const mapResults = (messages: ModelMessage[], rewrite: (part: ResultPart) => ResultPart): ModelMessage[] =>
  messages.map(message => {
    if (message.role !== 'tool' || !Array.isArray(message.content)) return message
    let changed = false
    const content = (message.content as unknown as ResultPart[]).map(part => {
      if (part?.type !== 'tool-result') return part
      const next = rewrite(part)
      if (next !== part) changed = true
      return next
    })
    return changed ? { ...message, content } as ModelMessage : message
  })

export const createStepContext = (budget: number) => {
  const cleared = new Set<string>()
  // The cleared ids re-applied to the tier-0 bounded messages; the placeholder depends on the bounded text only.
  const applyCleared = (bounded: ModelMessage[]) => cleared.size === 0
    ? bounded
    : mapResults(bounded, part => {
      if (!cleared.has(part.toolCallId)) return part
      // Any output shape: clearOldToolResults clears a json result too, from the same text.
      const text = toolResultText(part.output)
      return { ...part, output: { type: 'text', value: clearedToolResultText(part.toolName, text.length, text) } }
    })
  return (messages: ModelMessage[]): ModelMessage[] => {
    const bounded = mapResults(messages, part => {
      const text = textOf(part.output)
      if (text === undefined) return part
      const result = boundToolResult(text).result
      return result !== text ? { ...part, output: { type: 'text', value: result } } : part
    })
    const sticky = applyCleared(bounded)
    if (!budget) return sticky
    if (estimateTokens(JSON.stringify(redactModelMedia(sticky)).length) <= budget) return sticky
    // Decided on the UNCLEARED messages: clearing a placeholder again would rewrite its length.
    const decision = clearOldToolResults(bounded, budget)
    if (!decision.clear) return sticky
    for (const id of decision.clearedToolCallIds) cleared.add(id)
    return applyCleared(bounded)
  }
}
