import type { ModelMessage } from 'ai'

/** What the step still streaming when the turn was interrupted had produced so far. */
export interface OpenStep {
  text: string
  calls: { toolCallId: string, toolName: string, input: unknown }[]
  /** Results that did arrive before the interruption, by call id. */
  results: Record<string, unknown>
}

export const INTERRUPTED_RESULT = 'Interrupted: the person sent a new message before this finished. Read it and continue from there.'

/**
 * History entries for an interrupted turn's unfinished step.
 *
 * A turn that is aborted never reaches `result.response`, so without this its work was
 * simply gone: the next request carried the person's two messages and nothing between,
 * and the assistant said it had done nothing and started over. The step that was still
 * open — typically the one declaring wait_for_user_action — is recorded with a result
 * saying why it never completed, so every tool call in history keeps its result.
 */
export function interruptedStepMessages (step: OpenStep): ModelMessage[] {
  if (!step.calls.length) {
    return step.text ? [{ role: 'assistant', content: step.text }] : []
  }
  return [
    {
      role: 'assistant',
      content: [
        ...(step.text ? [{ type: 'text' as const, text: step.text }] : []),
        ...step.calls.map(c => ({ type: 'tool-call' as const, toolCallId: c.toolCallId, toolName: c.toolName, input: c.input }))
      ]
    },
    {
      role: 'tool',
      content: step.calls.map(c => ({
        type: 'tool-result' as const,
        toolCallId: c.toolCallId,
        toolName: c.toolName,
        output: c.toolCallId in step.results
          ? toOutput(step.results[c.toolCallId])
          : { type: 'text' as const, value: INTERRUPTED_RESULT }
      }))
    }
  ]
}

function toOutput (result: unknown) {
  return typeof result === 'string'
    ? { type: 'text' as const, value: result }
    : { type: 'json' as const, value: (result ?? null) as any }
}
