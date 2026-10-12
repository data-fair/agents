/**
 * Pure decision for what a delegated sub-agent reports back to the main agent.
 *
 * The main agent never sees the sub-agent's full trace — only this single text
 * value, returned by the delegation tool's `execute`. The trailing sub-agent message can carry
 * a flag that changes what the lead should be told, so this is not a plain
 * "last message content" read:
 *  - `stepLimitReached`  → the worker exhausted its step cap while still calling tools.
 *    A forced close-out turn (see subAgentDelegation) usually recovers a best-effort answer,
 *    carried as the message content: the lead gets that answer, prefixed so it treats it
 *    as possibly incomplete. Only when nothing was recovered (empty content) does it fall
 *    back to the standalone notice — without which it would report a truncation as success.
 */

// Handed to the main agent when a sub-agent stops because it hit its step limit
// while still calling tools — i.e. truncated mid-work, not finished.
export const SUBAGENT_STEP_LIMIT_NOTICE = 'The sub-agent reached its step limit before completing the task — this is a truncation, not a success, and any result so far is partial. Consider delegating a narrower, more focused task, breaking it into smaller delegations, or completing the remaining work yourself. Do not assume the task is done.'

// Fallback when the worker finished cleanly but its last message carried no text
// (e.g. ended on a tool result). A genuine, if uninformative, completion.
export const SUBAGENT_DONE_FALLBACK = 'Task completed.'

// Prepended to a recovered close-out answer. The worker exceeded its step budget, but a
// final no-tools turn synthesized a best-effort answer from what it had already gathered.
// The lead receives that answer flagged as possibly incomplete, so it can use the data
// without treating it as authoritative or assuming the task fully succeeded.
export const SUBAGENT_PARTIAL_PREFIX = '[Partial result — the sub-agent reached its step budget. The findings below are what it gathered; treat them as possibly incomplete and verify before relying on them.]'

/**
 * The text a delegated sub-agent reports back to the main agent: its final text, or, when it was
 * stopped by a guard or the step limit, what it managed flagged as partial.
 */
export function subAgentModelOutput (output: { text?: string, stepLimitReached?: boolean }): string {
  if (output.stepLimitReached) {
    // The forced close-out turn (subAgentDelegation) carries its synthesized answer as the
    // message content. Hand that to the lead, prefixed as possibly incomplete. Only when
    // the close-out produced nothing (content empty/missing) do we fall back to the
    // standalone notice — i.e. report the truncation rather than fabricate a result.
    const body = output.text?.trim()
    return body ? `${SUBAGENT_PARTIAL_PREFIX}\n\n${body}` : SUBAGENT_STEP_LIMIT_NOTICE
  }
  return output.text || SUBAGENT_DONE_FALLBACK
}
