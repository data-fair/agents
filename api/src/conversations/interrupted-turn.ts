/**
 * A turn the person interrupted — by writing during it, or by pressing Stop — and what the model is
 * told about it.
 *
 * Ported from main's ui/src/composables/interrupted-turn.ts (#73, #75), which did this for the
 * browser loop. The wording is main's, unchanged: judged runs are what tuned it. What changed is
 * where the work happens. The browser had to rebuild an aborted turn's messages from the stream it
 * had seen, because an aborted SDK call never reaches `result.response`. The server STORES every turn
 * as it goes, so an aborted turn's work is already in the record — except for the calls still open
 * when it stopped, which have no result. A call with no result is dropped on replay
 * (`ignoreIncompleteToolCalls`), so without this the model never learned it had been waiting: judged
 * runs saw the person's two messages with nothing between, denied work they had done and redid it.
 *
 * Pure (no #mongo, no #config) so both halves are unit-testable. Server-only, so not in shared/: that
 * workspace holds only what the browser consumes too (see the shared-contract unit spec).
 */
import type { ModelMessage } from 'ai'
import type { MessagePart } from '@agents/shared/message-parts'
import { WAIT_TOOL_NAME } from '@agents/shared/host-events'

/**
 * Why a run was aborted, as the abort reason the executor passes. A constant rather than a string
 * literal in two places, because `interruptReason` reads it back and a typo would silently turn
 * "the person spoke" into a generic stop.
 */
export const PERSON_SPOKE = 'the person spoke'

/**
 * - `message`: the person wrote during the turn, which takes it back.
 * - `stop`: the person pressed Stop.
 * - `ended`: anything else — the clock, an agent being disabled. Not main's: the browser had no such
 *   cause, but the server does, and telling the model "the person stopped the reply" would be false.
 */
export type InterruptReason = 'message' | 'stop' | 'ended'

export const INTERRUPTED_RESULTS: Record<InterruptReason, string> = {
  message: 'Interrupted: the person sent a new message before this finished. Read it and continue from there.',
  stop: 'Interrupted: the person stopped the reply before this finished.',
  ended: 'Interrupted: this turn ended before this finished.'
}

function waitedFor (expecting: unknown): string {
  return typeof expecting === 'string' && expecting.trim() ? expecting.trim() : 'an action on the page'
}

/** The result of a wait the person interrupted: what it was waiting for, nothing more. */
export function interruptedWaitResult (expecting: unknown): string {
  return `Interrupted: the person wrote to you while you were waiting for them (${waitedFor(expecting)}).`
}

/**
 * Carried by the turn the person's message starts, just before that message. The same instruction
 * in the interrupted wait's tool result sat in history ahead of the new question; judged runs answered
 * the question and never waited again, so a list they had prepared was created unseen. Here it is the
 * last thing the model reads.
 */
export function interruptedWaitReminder (expecting: unknown): string {
  return `You were waiting for the person (${waitedFor(expecting)}) when they wrote the message below instead. Answer it; then, if that action is still to come, declare wait_for_user_action again so you learn when they do it.`
}

/** Which interruption an abort was, from the reason the run's controller was aborted with. */
export function interruptReason (abortReason: unknown): InterruptReason {
  if (abortReason instanceof Error && abortReason.message === PERSON_SPOKE) return 'message'
  // `abort()` with no argument — the Stop button's path — leaves the platform's own AbortError.
  if (abortReason === undefined || (abortReason as { name?: unknown })?.name === 'AbortError') return 'stop'
  return 'ended'
}

/**
 * The parts of an interrupted turn with every still-open call settled, each with a result saying why
 * it never completed — so every call in the record keeps a result, and replay keeps it.
 *
 * Settled as `output-available`, not `output-error`: nothing failed, and an error would invite the
 * model to retry a wait the person has already answered by writing.
 */
export function settleInterruptedParts (parts: MessagePart[], reason: InterruptReason): MessagePart[] {
  return parts.map(part => {
    if (part.type !== 'dynamic-tool') return part
    if (part.state !== 'input-streaming' && part.state !== 'input-available') return part
    const input = (part.input ?? {}) as { expecting?: unknown }
    const output = reason === 'message' && part.toolName === WAIT_TOOL_NAME
      ? interruptedWaitResult(input.expecting)
      : INTERRUPTED_RESULTS[reason]
    return { ...part, state: 'output-available', input: part.input ?? {}, output } as MessagePart
  })
}

const isInterruptedWaitOutput = (output: unknown): boolean => {
  const text = typeof output === 'string'
    ? output
    : (output as { value?: unknown } | undefined)?.value
  return typeof text === 'string' && text.startsWith('Interrupted: the person wrote to you while you were waiting')
}

/**
 * The reminder the next request carries, when the turn before the person's latest message ended on a
 * wait they interrupted by writing. Null otherwise.
 *
 * Read from the history rather than remembered: the next turn runs after the interrupted one has
 * finished settling (the conversation lock serialises them), so the settled wait is in the record by
 * then, with the call's own `expecting` beside it. Only the stretch since the previous user message
 * is searched — an older interruption has already been answered.
 */
export function pendingWaitReminder (history: ModelMessage[]): string | null {
  const last = history.map(message => message.role).lastIndexOf('user')
  if (last <= 0) return null
  const previous = history.slice(0, last).map(message => message.role).lastIndexOf('user')
  const stretch = history.slice(previous + 1, last)

  for (const message of [...stretch].reverse()) {
    if (message.role !== 'tool' || !Array.isArray(message.content)) continue
    const settled = message.content.find(part => part.type === 'tool-result' && part.toolName === WAIT_TOOL_NAME && isInterruptedWaitOutput(part.output))
    if (!settled || settled.type !== 'tool-result') continue
    const call = stretch
      .filter(m => m.role === 'assistant' && Array.isArray(m.content))
      .flatMap(m => m.content as Array<{ type: string, toolCallId?: string, input?: unknown }>)
      .find(part => part.type === 'tool-call' && part.toolCallId === settled.toolCallId)
    return interruptedWaitReminder((call?.input as { expecting?: unknown } | undefined)?.expecting)
  }
  return null
}
