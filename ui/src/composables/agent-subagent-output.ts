/**
 * Pure decision for what a delegated sub-agent reports back to the main agent.
 *
 * The main agent never sees the sub-agent's full trace — only this single text
 * value (via the tool's `toModelOutput`). The trailing sub-agent message can carry
 * flags that change what the lead should be told, so this is not a plain
 * "last message content" read:
 *  - `moderationBlocked` → a content-policy decision, not a finished task.
 *  - `stepLimitReached`  → the worker was truncated at its step cap mid-tool-chain;
 *    the trailing message is empty, so without this it would fall through to the
 *    'Task completed.' fallback and report a truncation as a success.
 */

// Handed to the main agent when the sub-agent's own gateway call was blocked by
// moderation. Actionable for the lead rather than the user-facing refusal text.
export const SUBAGENT_MODERATION_NOTICE = 'This delegated sub-agent task was blocked by content moderation — a content-policy decision, not a tool error. If the task is legitimate platform work (for example editing a resource\'s title, description, summary or other metadata), rephrase it more precisely and delegate again, or carry it out yourself if you have the necessary tools. Otherwise, briefly tell the user the request was declined by moderation. Do not resubmit the same task wording unchanged.'

// Handed to the main agent when a sub-agent stops because it hit its step limit
// while still calling tools — i.e. truncated mid-work, not finished.
export const SUBAGENT_STEP_LIMIT_NOTICE = 'The sub-agent reached its step limit before completing the task — this is a truncation, not a success, and any result so far is partial. Consider delegating a narrower, more focused task, breaking it into smaller delegations, or completing the remaining work yourself. Do not assume the task is done.'

// Fallback when the worker finished cleanly but its last message carried no text
// (e.g. ended on a tool result). A genuine, if uninformative, completion.
export const SUBAGENT_DONE_FALLBACK = 'Task completed.'

interface SubAgentOutputMessage {
  content?: string
  moderationBlocked?: boolean
  stepLimitReached?: boolean
}

/** The text a delegated sub-agent reports back to the main agent. */
export function subAgentModelOutput (output: unknown): string {
  const messages = Array.isArray(output) ? output as SubAgentOutputMessage[] : []
  const lastMsg = messages.length ? messages[messages.length - 1] : null
  if (lastMsg?.moderationBlocked) return SUBAGENT_MODERATION_NOTICE
  if (lastMsg?.stepLimitReached) return SUBAGENT_STEP_LIMIT_NOTICE
  return lastMsg?.content || SUBAGENT_DONE_FALLBACK
}
