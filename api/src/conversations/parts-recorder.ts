/**
 * operations-style module: pure, no #mongo / #config.
 *
 * A model stream recorded as stored message parts: the bookkeeping the lead's loop (executor.ts) and a
 * sub-agent's worker loop (../agent-session/sub-agents.ts) share. What each loop does AROUND it — the
 * lead's waits, approvals and provenance, the worker's panel — stays in the loop.
 */
import type { JSONObject } from '@ai-sdk/provider'
import type { MessagePart } from '@agents/shared/message-parts'
import { isMediaToolResult, type MediaToolResult } from '@agents/shared/tool-result'
import { boundToolResult, TOOL_RESULT_LIMIT } from './operations.ts'

/** How a call is completed: its result or its error, already bounded. */
export type CallSettlement =
  | { state: 'output-available', output: string | MediaToolResult, truncated?: { totalChars: number } }
  | { state: 'output-error', errorText: string }

/**
 * A tool's result as it is stored and replayed: bounded, and an image-bearing result kept AS its
 * envelope with only its text bounded — stringified, the base64 was cut at the result limit and replayed
 * as text, the image lost from the record and garbage to the model on the next turn (see mediaModelOutput).
 */
export const resultSettlement = (output: unknown): CallSettlement => {
  const media = isMediaToolResult(output)
  const text = media
    ? String(output.text ?? '')
    : typeof output === 'string'
      ? output
      : (output && typeof output === 'object' && 'value' in output)
          ? String((output as { value: unknown }).value)
          : JSON.stringify(output ?? '')
  const bounded = boundToolResult(text)
  return {
    state: 'output-available',
    output: media ? { ...output, text: bounded.result } : bounded.result,
    ...(bounded.truncated ? { truncated: bounded.truncated } : {})
  }
}

/** A tool's failure as it is stored: its message, bounded like a result. */
export const errorSettlement = (error: unknown): CallSettlement =>
  ({ state: 'output-error', errorText: boundToolResult(error instanceof Error ? error.message : String(error)).result })

/** What a recorded input keeps of each of its strings, and of itself as JSON (boundRecordedInput). */
export const RECORDED_INPUT_STRING_CHARS = 10_000

/**
 * A call's arguments as a TRACE records them, when nothing replays them: a script's nested calls (code mode).
 * A script may pass a tool megabytes (write_file takes 10 MB from code), and the trace is stored on the
 * message and re-sent in every frame — verbatim, a few such calls would pass MongoDB's 16 MB document cap.
 * Each string is cut at RECORDED_INPUT_STRING_CHARS with its length named; an input still larger than a
 * stored result (many small strings) is kept as its JSON's head. The model's own calls are not bounded:
 * a revived turn replays the call the model actually made.
 */
export const boundRecordedInput = (input: unknown): unknown => {
  const cut = (value: unknown): unknown => {
    if (typeof value === 'string') return value.length > RECORDED_INPUT_STRING_CHARS ? `${value.slice(0, RECORDED_INPUT_STRING_CHARS)}… [cut in this record — ${value.length} chars in total]` : value
    if (Array.isArray(value)) return value.map(cut)
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, cut(v)]))
    return value
  }
  const bounded = cut(input)
  const json = JSON.stringify(bounded) ?? ''
  return json.length > TOOL_RESULT_LIMIT ? { input: `${json.slice(0, RECORDED_INPUT_STRING_CHARS)}… [cut in this record — ${json.length} chars in total]` } : bounded
}

export const createPartsRecorder = () => {
  const parts: MessagePart[] = []
  const callOf = (toolCallId: string) => {
    const call = parts.find(part => part.type === 'dynamic-tool' && part.toolCallId === toolCallId)
    return call?.type === 'dynamic-tool' ? call : undefined
  }
  return {
    /** The turn's parts, in the order the model produced them. */
    parts,
    /**
     * Merged into the trailing part of the same kind rather than pushed per delta, or a turn would store
     * thousands of one-token parts.
     */
    appendText (kind: 'text' | 'reasoning', delta: string) {
      const last = parts[parts.length - 1]
      if (last && last.type === kind) { last.text = String(last.text ?? '') + delta; return }
      parts.push({ type: kind, text: delta })
    },
    /**
     * ONE part per tool call, moved through the library's states — not a call part followed by a result
     * part. That pairing is what `convertToModelMessages` reconstructs the assistant/tool message pair
     * from, and it is why a failed call is not shaped like a successful one: the failure is the part's
     * STATE, which nothing downstream can drop. The real arguments, not a summary: a revived turn replays
     * the call the model actually made.
     */
    openCall (call: { toolCallId: string, toolName: string, input: unknown, toolMetadata?: JSONObject }) {
      parts.push({ type: 'dynamic-tool', state: 'input-available', ...call })
    },
    /** Whether the call is one of these parts — a replayed approval settles a call of an EARLIER turn. */
    hasCall: (toolCallId: string) => !!callOf(toolCallId),
    /**
     * Complete a call in place, by its id: a step may issue several calls in parallel, and their results
     * arrive interleaved. A call the stream never announced cannot be settled — appending a resultless
     * part would produce a history the provider rejects — so the update is dropped.
     */
    settleCall (toolCallId: string, settled: CallSettlement) {
      const call = callOf(toolCallId)
      if (!call) return
      const { truncated, ...rest } = settled as CallSettlement & { truncated?: { totalChars: number } }
      Object.assign(call, rest)
      // Metadata, beside the provenance: a review must be able to tell the result was cut.
      if (truncated) call.toolMetadata = { ...call.toolMetadata, truncated: { totalChars: truncated.totalChars } }
    }
  }
}
