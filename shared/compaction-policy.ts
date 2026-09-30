/**
 * Pure decision layer for history compaction: when to compact, what to summarize
 * and what to keep verbatim. Deliberately free of I/O so every branch is unit
 * tested — the previous implementation lived inline in use-agent-chat and never was.
 *
 * The shape follows the append-only rule that prompt caching imposes: evict from
 * the head (old, re-fetchable) and keep the tail intact, because rewriting the
 * prefix discards the provider's cache of it.
 */

import type { ModelMessage } from 'ai'

/** Share of the budget kept verbatim after a compaction. Also the hysteresis: a
 *  fresh compaction lands near this fill, so the next turn cannot re-trigger. */
export const RETENTION_SHARE = 0.3
/** Below this share of budget, summarizing costs more (a blocking call plus a
 *  full prompt-cache invalidation) than the context it reclaims. */
export const FLOOR_SHARE = 0.2
export const CHARS_PER_TOKEN = 4

export interface CompactionInput {
  history: ModelMessage[]
  /** Provider-reported TOTAL input tokens for the previous turn; 0 if none yet. */
  lastInputTokens: number
  /** Characters appended to history since that measurement. */
  appendedChars: number
  budget: number
  generation: number
}

export type CompactionDecision =
  | { compact: false, reason: 'under-budget' | 'nothing-to-compact' | 'below-floor' }
  | { compact: true, prefixToSummarize: ModelMessage[], retained: ModelMessage[], generation: number }

export function estimateTokens (chars: number): number {
  return Math.ceil(chars / CHARS_PER_TOKEN)
}

export function estimateMessageTokens (message: ModelMessage): number {
  return estimateTokens(JSON.stringify(message).length)
}

function toolCallIdsIn (message: ModelMessage, type: 'tool-call' | 'tool-result'): string[] {
  if (!Array.isArray(message.content)) return []
  const ids: string[] = []
  for (const part of message.content as { type?: string, toolCallId?: string }[]) {
    if (part?.type === type && part.toolCallId) ids.push(part.toolCallId)
  }
  return ids
}

/**
 * True when history can be split at `index` (i.e. `history[index]` may start a new
 * window) without orphaning a tool result from the assistant message that called it.
 * Providers reject a tool result whose call is absent, so this is a hard constraint,
 * not a nicety.
 */
export function isTurnBoundary (history: ModelMessage[], index: number): boolean {
  if (index <= 0 || index >= history.length) return true
  // Walk forward over the tool results that belong to calls made before the cut.
  const pending = new Set<string>()
  for (let i = index; i < history.length; i++) {
    const msg = history[i]
    if (msg.role !== 'tool') break
    for (const id of toolCallIdsIn(msg, 'tool-result')) pending.add(id)
  }
  if (pending.size === 0) return true
  // Any of those calls issued before the cut means the cut orphans them.
  for (let i = index - 1; i >= 0; i--) {
    for (const id of toolCallIdsIn(history[i], 'tool-call')) {
      if (pending.has(id)) return false
    }
  }
  return true
}

function textOf (content: ModelMessage['content']): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    const textPart = (content as { type?: string, text?: string }[]).find(p => p?.type === 'text')
    if (textPart && typeof textPart.text === 'string') return textPart.text
  }
  return ''
}

/**
 * Exact tool names a retained window still references — the set that must stay
 * promoted/announced after a compaction. Two sources, both exact matches (never a
 * substring scan over the serialized window, which false-positives on any tool
 * name that happens to also be an ordinary word in the recap prose):
 *  - `toolName` on a `tool-call`/`tool-result` part of a retained message;
 *  - names listed inside a retained `<tools-available>` notice (see
 *    formatToolsAvailableMessage), read from the last non-empty line of the block
 *    and split on `,` so the notice's own wording can't affect the match.
 */
export function retainedToolNames (retained: ModelMessage[]): Set<string> {
  const names = new Set<string>()
  for (const message of retained) {
    if (Array.isArray(message.content)) {
      for (const part of message.content as { type?: string, toolName?: string }[]) {
        if ((part?.type === 'tool-call' || part?.type === 'tool-result') && part.toolName) {
          names.add(part.toolName)
        }
      }
    }

    const text = textOf(message.content)
    if (!text) continue
    const blockRe = /<tools-available>([\s\S]*?)<\/tools-available>/g
    let block: RegExpExecArray | null
    while ((block = blockRe.exec(text))) {
      const lines = block[1].split('\n').map(l => l.trim()).filter(Boolean)
      const namesLine = lines[lines.length - 1]
      if (!namesLine) continue
      for (const name of namesLine.split(',')) {
        const trimmed = name.trim()
        if (trimmed) names.add(trimmed)
      }
    }
  }
  return names
}

export function decideCompaction (input: CompactionInput): CompactionDecision {
  const { history, lastInputTokens, appendedChars, budget, generation } = input

  const fill = lastInputTokens + estimateTokens(appendedChars)
  if (fill <= budget) return { compact: false, reason: 'under-budget' }
  if (history.length < 2) return { compact: false, reason: 'nothing-to-compact' }

  // Walk backwards accumulating the tail we want to keep verbatim, then move the
  // cut earlier until it lands on a legal boundary. Cutting earlier only ever
  // retains more, so it can never orphan anything the walk already accepted.
  const retentionBudget = budget * RETENTION_SHARE
  let cut = history.length - 1
  let kept = estimateMessageTokens(history[cut])
  while (cut > 0) {
    const next = estimateMessageTokens(history[cut - 1])
    if (kept + next > retentionBudget) break
    cut--
    kept += next
  }
  while (cut > 0 && !isTurnBoundary(history, cut)) cut--

  const prefixToSummarize = history.slice(0, cut)
  const retained = history.slice(cut)

  if (prefixToSummarize.length === 0) return { compact: false, reason: 'nothing-to-compact' }

  // Floor measured in tokens only. A message-count clause would refuse to compact a
  // prefix that is a single enormous tool result, which is exactly the case that most
  // needs compacting.
  const prefixTokens = prefixToSummarize.reduce((n, m) => n + estimateMessageTokens(m), 0)
  if (prefixTokens < budget * FLOOR_SHARE) return { compact: false, reason: 'below-floor' }

  return { compact: true, prefixToSummarize, retained, generation: generation + 1 }
}

/*
 * ---------------------------------------------------------------------------
 * Tier 1: clearing old tool results.
 *
 * The cheap remedy, applied BEFORE the expensive one. Everything above decides what to summarise; the
 * rest of this file decides what can simply be dropped, which costs nothing. See
 * docs/architecture/context-management.md for the whole policy in one place.
 * ---------------------------------------------------------------------------
 */

/**
 * How many of the most recent tool results are never cleared. Anthropic's `clear_tool_uses_20250919`
 * default, kept deliberately: the newest results are the ones still being reasoned about.
 */
export const KEEP_TOOL_RESULTS = 3

/**
 * Minimum share of the budget a clear must free to be worth doing.
 *
 * Clearing rewrites the head of the prompt, which INVALIDATES the provider's cached prefix — that is why
 * `clear_at_least` exists upstream. We do not place cache breakpoints yet, so today this only avoids
 * churn; once caching lands it becomes the knob deciding whether a clear is worth a cache write.
 */
export const CLEAR_AT_LEAST_SHARE = 0.02

export interface ClearingOptions {
  /** Most recent tool results to leave intact. */
  keep?: number
  /** Tool names never cleared. Per-agent configuration is deferred; the parameter exists so adding it later is not a redesign. */
  excludeTools?: string[]
  /** Absolute token floor for applying a clear at all. Defaults to CLEAR_AT_LEAST_SHARE of the budget. */
  clearAtLeast?: number
}

/**
 * What the model is told in place of a payload that was dropped.
 *
 * THE LOAD-BEARING PART of tier 1, and the whole difference from the SDK's `pruneMessages` (verified:
 * it removes the call together with the result and leaves nothing behind). The model has to know that a
 * result EXISTED, what produced it, and that calling again would fetch it — otherwise it reasons as
 * though it had never asked. Silent deletion is what makes pruning feel lossy; a marker makes it legible.
 *
 * The server is named when the provenance envelope is present, and simply omitted when it is not: the
 * policy reads the envelope opportunistically rather than requiring it, so it stays usable for a result
 * that never went through one.
 */
export function clearedToolResultText (toolName: string, totalChars: number, originalText?: string): string {
  const server = originalText?.slice(0, 200).match(/<tool-result server="([^"]*)"/)?.[1]
  const from = server ? ` from ${server}` : ''
  return `[earlier result of ${toolName}${from} removed to free context — ${totalChars} chars. Call the tool again if you still need it.]`
}

/** The same vocabulary for a result bounded where it was PRODUCED, so one wording covers both tiers. */
export function truncatedToolResultText (headText: string, totalChars: number): string {
  return `${headText}… [rest of this result dropped to free context — ${totalChars} chars in total. Call the tool again with a narrower request if you need the rest.]`
}

/** The text of a tool-result part's output, whatever shape the output takes. */
function toolResultText (output: unknown): string {
  if (output == null) return ''
  if (typeof output === 'string') return output
  const value = (output as { value?: unknown }).value
  if (typeof value === 'string') return value
  return JSON.stringify(value ?? output)
}

interface ToolResultRef {
  /** Index into history. */
  message: number
  /** Index into that message's content array. */
  part: number
  toolName: string
  text: string
}

/** Every tool result in the history, in chronological order. */
function toolResultsIn (history: ModelMessage[]): ToolResultRef[] {
  const refs: ToolResultRef[] = []
  history.forEach((message, messageIndex) => {
    if (message.role !== 'tool' || !Array.isArray(message.content)) return
    ;(message.content as Array<{ type?: string, toolName?: string, output?: unknown }>).forEach((part, partIndex) => {
      if (part?.type !== 'tool-result') return
      refs.push({
        message: messageIndex,
        part: partIndex,
        toolName: part.toolName ?? 'a tool',
        text: toolResultText(part.output)
      })
    })
  })
  return refs
}

export type ClearingDecision =
  | { clear: false, reason: 'nothing-to-clear' | 'below-clear-at-least' }
  | { clear: true, history: ModelMessage[], clearedCount: number, freedTokens: number }

/**
 * Replace the payloads of the OLDEST tool results with placeholders, keeping their calls.
 *
 * Pure, and a pure function of the history plus the parameters — so it is recomputed every turn at zero
 * cost and needs no persisted state. That is the structural difference from compaction, which needs the
 * recap cache precisely because it costs a model call, and it is why ordering the cheap tier first is
 * nearly free.
 *
 * The MESSAGE LIST IS NEVER CHANGED, only a payload inside it: the tool message stays, so no tool result
 * is orphaned from its call, `isTurnBoundary` still holds, and the executor's parallel `seqs` array stays
 * aligned. That is also why the tool CALL is untouched — its arguments are small and are what make the
 * call auditable.
 *
 * All eligible results are cleared, not merely enough to get under budget. Upstream does the same, and
 * clearing the minimum would invalidate the cached prefix again on the next turn for another small
 * saving.
 */
export function clearOldToolResults (
  history: ModelMessage[],
  budget: number,
  options: ClearingOptions = {}
): ClearingDecision {
  const keep = options.keep ?? KEEP_TOOL_RESULTS
  const excluded = new Set(options.excludeTools ?? [])
  const clearAtLeast = options.clearAtLeast ?? Math.ceil(budget * CLEAR_AT_LEAST_SHARE)

  const refs = toolResultsIn(history)
  const eligible = refs
    .slice(0, Math.max(refs.length - keep, 0))
    .filter(ref => !excluded.has(ref.toolName))
    // A result already smaller than its own placeholder would GROW the context, which is the case for a
    // short tool error. Skipping it needs no knob and keeps that error's text readable.
    .filter(ref => ref.text.length > clearedToolResultText(ref.toolName, ref.text.length, ref.text).length)

  if (!eligible.length) return { clear: false, reason: 'nothing-to-clear' }

  const freedTokens = eligible.reduce((total, ref) => {
    const placeholder = clearedToolResultText(ref.toolName, ref.text.length, ref.text)
    return total + estimateTokens(ref.text.length - placeholder.length)
  }, 0)
  if (freedTokens < clearAtLeast) return { clear: false, reason: 'below-clear-at-least' }

  // Copied down to the parts touched, never mutated: the caller's history — the browser's live array,
  // the executor's loaded window — must not change under it.
  const cleared = history.slice()
  for (const ref of eligible) {
    const message = cleared[ref.message]
    const content = (message.content as unknown[]).slice()
    const part = { ...(content[ref.part] as object) } as { output?: unknown, toolName?: string }
    part.output = { type: 'text', value: clearedToolResultText(ref.toolName, ref.text.length, ref.text) }
    content[ref.part] = part
    cleared[ref.message] = { ...message, content } as ModelMessage
  }
  return { clear: true, history: cleared, clearedCount: eligible.length, freedTokens }
}

export interface ContextDecisionInput extends CompactionInput {
  clearing?: ClearingOptions
}

export type ContextDecision = {
  /** The history to send, with any cleared payloads already applied. */
  history: ModelMessage[]
  clearing: ClearingDecision
  compaction: CompactionDecision
}

/**
 * THE context-management policy: one threshold, two remedies, cheapest first.
 *
 * Both loops call this and nothing else, which is the point — the previous shape was two loops that
 * happened to agree because the same constant had been copied into each, and every context bug on this
 * branch came from one of them having drifted.
 *
 * 1. clear old tool results (free);
 * 2. re-measure;
 * 3. compact only if still over budget (a blocking, billed model call).
 *
 * So the summarizer becomes the SECOND resort. For many conversations it should stop running at all.
 *
 * Nothing here decides anything about the STORE: whatever this returns affects only what the model is
 * sent. The stored message log remains the conversation of record and is never rewritten — the same rule
 * the recap cache follows.
 */
export function decideContextManagement (input: ContextDecisionInput): ContextDecision {
  const fill = input.lastInputTokens + estimateTokens(input.appendedChars)
  if (fill <= input.budget) {
    return { history: input.history, clearing: { clear: false, reason: 'nothing-to-clear' }, compaction: { compact: false, reason: 'under-budget' } }
  }

  const clearing = clearOldToolResults(input.history, input.budget, input.clearing)
  const history = clearing.clear ? clearing.history : input.history

  // RE-MEASURED from characters, not adjusted by the freed estimate: a clear invalidates the basis of
  // `lastInputTokens`, since the prefix it measured no longer exists. Counting the rebuilt history is
  // the only honest measurement available, and it is what both loops already fall back to after a
  // compaction.
  const compaction = decideCompaction(clearing.clear
    ? { ...input, history, lastInputTokens: 0, appendedChars: JSON.stringify(history).length }
    : input)

  return { history, clearing, compaction }
}
