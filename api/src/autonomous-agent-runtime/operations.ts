/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

export type RunStatus = 'running' | 'done' | 'error' | 'aborted' | 'interrupted'
export type RunStopReason = 'completed' | 'step-limit' | 'repeated-calls' | 'budget' | 'timeout' | 'aborted' | 'error'

/**
 * Monotonic per-conversation sequence. Starts at 1, never 0: C2's live delta stream
 * detects a dropped message by a gap in this sequence, and 0 would be
 * indistinguishable from "no messages yet".
 */
export function nextMessageSeq (conversation: { messageSeq?: number }): number {
  return (conversation.messageSeq ?? 0) + 1
}

export function isRunTerminal (status: RunStatus): boolean {
  return status !== 'running'
}

/**
 * The user-facing sentence appended as a terminal assistant message when a run ends.
 *
 * Every branch must return something non-empty: a conversation that simply stops with no
 * explanation is the failure the spec forbids ("failure is a message, not a silence"), and
 * a run can end for a reason the reader cannot otherwise see — a budget, a step cap, a
 * provider error.
 */
export function runStopReasonMessage (stopReason: RunStopReason, detail?: string): string {
  const base: Record<RunStopReason, string> = {
    completed: 'Done.',
    'step-limit': 'I reached my step budget for this turn and stopped. Everything I gathered up to that point is above.',
    'repeated-calls': 'I kept repeating the same tool call without making progress, so I stopped. Everything I gathered up to that point is above.',
    budget: 'This turn reached its credit budget and stopped before finishing.',
    timeout: 'This turn took too long and was stopped. Please try again.',
    aborted: 'This turn was stopped.',
    error: 'This turn failed and could not be completed.'
  }
  // A detail is optional, and an EMPTY detail must not produce a dangling separator —
  // the same bare-prefix wart that formatMcpToolResult has ("Tool execution failed: ").
  return detail ? `${base[stopReason]} (${detail})` : base[stopReason]
}
