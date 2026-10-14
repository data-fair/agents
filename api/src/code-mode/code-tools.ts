/**
 * THE MAP A SCRIPT CALLS (spec §6.3–6.5): the turn's callable tools as a script sees them.
 *
 * - Through the same call path as the model's calls (api/src/files/call-path.ts, mode 'code'): file
 *   arguments become signed URLs, links become stored files — the same call, as spec §4.4 promised.
 * - Without the provenance envelope: the script is not the model. Its RESULT reaches the model through the
 *   envelope (code_mode's own, model-loop.ts), since it may quote tool output verbatim.
 * - Data, not text (SourcedTool.codeExecute).
 * - Recorded: the package has no event for nested calls (vercel/ai#18144), so each call is recorded here, into a
 *   `data-subagent` trace under the code_mode call — streamed while the script runs, stored when it ends, left
 *   out of replay like a worker's trace.
 * - A failure is rethrown as CodeModeToolError: the package replaces any other error with "Host tool failed."
 */
import { jsonSchema, type Tool } from 'ai'
import { CodeModeToolError } from '@ai-sdk/code-mode'
import type { MessagePart } from '@agents/shared/message-parts'
import type { ToolSet } from '../conversations/operations.ts'
import { createPartsRecorder, resultSettlement, errorSettlement, boundRecordedInput, type CallSettlement } from '../conversations/parts-recorder.ts'
import { withCallPath, type CallPathContext } from '../files/call-path.ts'
import { CODE_MODE_TOOL_NAME, codeCallable, SCRIPT_TRANSFER_BYTES, bridgedBytes, transferRefusedMessage, transferExceededMessage } from './operations.ts'

export interface CodeTrace {
  record<T> (toolCallId: string, toolName: string, input: unknown, run: () => Promise<T>): Promise<T>
  finish (parentToolCallId: string): void
}

/** Pending frames of one script are merged within this window, like the session's text deltas (DELTA_FLUSH_MS). */
export const TRACE_FLUSH_MS = 25
/** What a call still open when its script ends is recorded as: the script no longer waits for it. */
export const STOPPED_CALL_MESSAGE = 'stopped: the script ended before this call answered'

/**
 * The nested calls of each code_mode call, keyed by its id: the package names a nested call `<outer>:tool-<n>`.
 *
 * - Inputs are recorded bounded (boundRecordedInput): a script may pass a tool megabytes.
 * - Pending frames are coalesced (TRACE_FLUSH_MS): each one carries the whole trace, so one per open and
 *   settle made a script's frame traffic quadratic in its calls.
 * - `finish` closes the trace: a call still open is settled as stopped, the final frame is sent, and anything
 *   that answers afterwards is ignored — a call the package stopped waiting for (a timeout, an abort) may still
 *   complete, and a frame after the final one would replace the finished trace with an empty pending one.
 */
export const createCodeTrace = (onTrace: (trace: { parentToolCallId: string, name: string, parts: MessagePart[], pending: boolean }) => void): CodeTrace => {
  const traces = new Map<string, { recorder: ReturnType<typeof createPartsRecorder>, timer?: NodeJS.Timeout }>()
  const finished = new Set<string>()
  const parentOf = (toolCallId: string) => toolCallId.replace(/:tool-\d+$/, '')
  const traceOf = (parent: string) => {
    let trace = traces.get(parent)
    if (!trace) { trace = { recorder: createPartsRecorder() }; traces.set(parent, trace) }
    return trace
  }
  const send = (parent: string, pending: boolean) => onTrace({ parentToolCallId: parent, name: CODE_MODE_TOOL_NAME, parts: [...traceOf(parent).recorder.parts], pending })
  const schedule = (parent: string) => {
    const trace = traceOf(parent)
    trace.timer ??= setTimeout(() => { trace.timer = undefined; if (!finished.has(parent)) send(parent, true) }, TRACE_FLUSH_MS)
  }
  return {
    async record (toolCallId, toolName, input, run) {
      const parent = parentOf(toolCallId)
      if (finished.has(parent)) return await run()
      const { recorder } = traceOf(parent)
      recorder.openCall({ toolCallId, toolName, input: boundRecordedInput(input) })
      schedule(parent)
      const settle = (settled: CallSettlement) => {
        if (finished.has(parent)) return
        recorder.settleCall(toolCallId, settled)
        schedule(parent)
      }
      try {
        const output = await run()
        settle(resultSettlement(output))
        return output
      } catch (err) {
        settle(errorSettlement(err))
        throw err
      }
    },
    finish (parent) {
      const trace = traces.get(parent)
      if (!trace) return
      clearTimeout(trace.timer)
      for (const part of trace.recorder.parts) {
        if (part.type === 'dynamic-tool' && part.state === 'input-available') trace.recorder.settleCall(part.toolCallId, errorSettlement(STOPPED_CALL_MESSAGE))
      }
      send(parent, false)
      traces.delete(parent)
      finished.add(parent)
    }
  }
}

/**
 * A tool's failure as the script sees it, with a code of its own. The package keeps every CodeModeError a call
 * threw and, when the script fails, reports the first one with the failure's `code` (findPreservedCodeModeError):
 * with the class's shared code, a script that caught one failure and died of a later one was reported as the
 * first. The code is per call, so the failure reported is the one that killed the script.
 */
const toolError = (err: unknown, toolCallId: string) => {
  const error = new CodeModeToolError(err instanceof Error ? err.message : String(err))
  ;(error as { code: string }).code = `${error.code}:${toolCallId}`
  return error
}

export const codeFacingTools = (opts: { names: string[], fixed: ToolSet, page: Record<string, Tool>, callPath: CallPathContext, trace: CodeTrace }): Record<string, Tool> => {
  const out: Record<string, Tool> = {}
  // What each script has moved so far (SCRIPT_TRANSFER_BYTES), keyed like the trace. The map is rebuilt every step
  // and a running script keeps the one it started with, so this lives as long as the scripts that use it.
  const moved = new Map<string, number>()
  const spend = (toolCallId: string, bytes: number, message: string) => {
    const parent = toolCallId.replace(/:tool-\d+$/, '')
    const total = (moved.get(parent) ?? 0) + bytes
    if (total > SCRIPT_TRANSFER_BYTES) throw new Error(message)
    moved.set(parent, total)
  }
  for (const name of opts.names) {
    const sourced = opts.fixed[name]
    const base = sourced ? withCallPath(sourced, opts.callPath, 'code') : opts.page[name]
    if (!base?.execute || !codeCallable(name, sourced?.tool ?? base)) continue
    const execute = base.execute
    out[name] = {
      ...base,
      // What the script receives, as the return type of its signature in code_mode's description: the package
      // renders `outputSchema` there, and a tool without one reads `Promise<unknown>` (SourcedTool.codeOutputSchema).
      ...(sourced?.codeOutputSchema ? { outputSchema: jsonSchema(sourced.codeOutputSchema) } : {}),
      // A script's tool never asks for approval (codeCallable keeps those out); stated so the package never prompts.
      needsApproval: undefined,
      execute: async (input: any, options: any) => await opts.trace.record(options.toolCallId, name, input, async () => {
        try {
          spend(options.toolCallId, bridgedBytes(input), transferRefusedMessage)
          const output = await execute(input, options)
          spend(options.toolCallId, bridgedBytes(output), transferExceededMessage)
          return output
        } catch (err) {
          if (options?.abortSignal?.aborted) throw err
          throw toolError(err, options.toolCallId)
        }
      })
    } as Tool
  }
  return out
}
