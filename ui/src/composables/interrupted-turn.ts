import type { ModelMessage } from 'ai'
import { WAIT_TOOL_NAME } from './agent-stream-parts.ts'

/** What the step still streaming when the turn was interrupted had produced so far. */
export interface OpenStep {
  text: string
  calls: { toolCallId: string, toolName: string, input: unknown }[]
  /** Results that did arrive before the interruption, by call id. */
  results: Record<string, unknown>
}

export type InterruptReason = 'message' | 'stop'

/**
 * The result of a wait the person interrupted by writing. The action it waited for is
 * usually still to come: a judged run answered the person's question, never waited
 * again, and so never learned the list it had prepared was created.
 */
export function interruptedWaitResult (expecting: unknown): string {
  const what = typeof expecting === 'string' && expecting.trim() ? expecting.trim() : 'act'
  return `Interrupted: the person wrote to you while you were waiting for them (${what}). Answer them; if that action is still to come, declare ${WAIT_TOOL_NAME} again.`
}

export const INTERRUPTED_RESULTS: Record<InterruptReason, string> = {
  message: 'Interrupted: the person sent a new message before this finished. Read it and continue from there.',
  stop: 'Interrupted: the person stopped the reply before this finished.'
}

/** A tool result as the model receives it, the way the SDK builds it for a finished step. */
export type ToolResultOutput = { type: 'text', value: string } | { type: 'json', value: any } | { type: 'content', value: any[] }

/**
 * The SDK's own rule (createToolModelOutput, not exported): the tool's toModelOutput when
 * it has one, else text for a string and JSON for anything else. Synchronous because it
 * runs while the next turn waits to push its message; a toModelOutput returning a promise
 * falls back to the default shape.
 */
export function toolResultOutput (output: unknown, toModelOutput?: (o: { toolCallId: string, input: unknown, output: unknown }) => unknown, call?: { toolCallId: string, input: unknown }): ToolResultOutput {
  if (toModelOutput && call) {
    const formatted = toModelOutput({ toolCallId: call.toolCallId, input: call.input, output })
    if (formatted && typeof (formatted as any).then !== 'function') return formatted as ToolResultOutput
  }
  return typeof output === 'string' ? { type: 'text', value: output } : { type: 'json', value: output ?? null }
}

/** Every tool call id already present in history-bound messages. */
function toolCallIds (messages: ModelMessage[]): Set<string> {
  const ids = new Set<string>()
  for (const m of messages) {
    if (m.role !== 'assistant' || typeof m.content === 'string') continue
    for (const part of m.content) if (part.type === 'tool-call') ids.add(part.toolCallId)
  }
  return ids
}

/**
 * History entries for an interrupted turn's unfinished step.
 *
 * A turn that is aborted never reaches `result.response`, so without this its work was
 * simply gone: the next request carried the person's two messages and nothing between,
 * and the assistant said it had done nothing and started over. The step that was still
 * open — typically the one declaring wait_for_user_action — is recorded with a result
 * saying why it never completed, so every tool call in history keeps its result.
 *
 * `finished` is what the SDK reported for the steps that did complete. It is reported
 * from the SDK's side of the stream, which can run ahead of the loop reading the parts:
 * a step can be finished there while its parts still sit in `step`. Those are dropped
 * here, since sending one call id twice would get the next request rejected.
 */
export function interruptedStepMessages (
  step: OpenStep,
  opts: { finished?: ModelMessage[], reason?: InterruptReason, format?: (call: OpenStep['calls'][number], output: unknown) => ToolResultOutput } = {}
): ModelMessage[] {
  const done = toolCallIds(opts.finished ?? [])
  const calls = step.calls.filter(c => !done.has(c.toolCallId))
  // A step whose calls all belong to a finished step is that finished step, text included.
  if (step.calls.length && !calls.length) return []
  if (!calls.length) {
    return step.text ? [{ role: 'assistant', content: step.text }] : []
  }
  const format = opts.format ?? ((_c, output) => toolResultOutput(output))
  const reason = opts.reason ?? 'message'
  const interrupted = (c: OpenStep['calls'][number]) => reason === 'message' && c.toolName === WAIT_TOOL_NAME
    ? interruptedWaitResult((c.input as { expecting?: unknown } | undefined)?.expecting)
    : INTERRUPTED_RESULTS[reason]
  return [
    {
      role: 'assistant',
      content: [
        ...(step.text ? [{ type: 'text' as const, text: step.text }] : []),
        ...calls.map(c => ({ type: 'tool-call' as const, toolCallId: c.toolCallId, toolName: c.toolName, input: c.input }))
      ]
    },
    {
      role: 'tool',
      content: calls.map(c => ({
        type: 'tool-result' as const,
        toolCallId: c.toolCallId,
        toolName: c.toolName,
        output: c.toolCallId in step.results
          ? format(c, step.results[c.toolCallId])
          : { type: 'text' as const, value: interrupted(c) }
      }))
    }
  ] as ModelMessage[]
}
