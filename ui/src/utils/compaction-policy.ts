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
