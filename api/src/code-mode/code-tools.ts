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
import type { Tool } from 'ai'
import { CodeModeToolError } from '@ai-sdk/code-mode'
import type { MessagePart } from '@agents/shared/message-parts'
import type { ToolSet } from '../conversations/operations.ts'
import { createPartsRecorder, resultSettlement, errorSettlement } from '../conversations/parts-recorder.ts'
import { withCallPath, type CallPathContext } from '../files/call-path.ts'
import { CODE_MODE_TOOL_NAME, codeCallable } from './operations.ts'

export interface CodeTrace {
  record<T> (toolCallId: string, toolName: string, input: unknown, run: () => Promise<T>): Promise<T>
  finish (parentToolCallId: string): void
}

/** The nested calls of each code_mode call, keyed by its id: the package names a nested call `<outer>:tool-<n>`. */
export const createCodeTrace = (onTrace: (trace: { parentToolCallId: string, name: string, parts: MessagePart[], pending: boolean }) => void): CodeTrace => {
  const recorders = new Map<string, ReturnType<typeof createPartsRecorder>>()
  const parentOf = (toolCallId: string) => toolCallId.replace(/:tool-\d+$/, '')
  const recorderOf = (parent: string) => {
    let recorder = recorders.get(parent)
    if (!recorder) { recorder = createPartsRecorder(); recorders.set(parent, recorder) }
    return recorder
  }
  const emit = (parent: string, pending: boolean) => onTrace({ parentToolCallId: parent, name: CODE_MODE_TOOL_NAME, parts: [...recorderOf(parent).parts], pending })
  return {
    async record (toolCallId, toolName, input, run) {
      const parent = parentOf(toolCallId)
      const recorder = recorderOf(parent)
      recorder.openCall({ toolCallId, toolName, input })
      emit(parent, true)
      try {
        const output = await run()
        recorder.settleCall(toolCallId, resultSettlement(output))
        return output
      } catch (err) {
        recorder.settleCall(toolCallId, errorSettlement(err))
        throw err
      } finally {
        emit(parent, true)
      }
    },
    finish (parent) {
      if (!recorders.has(parent)) return
      emit(parent, false)
      recorders.delete(parent)
    }
  }
}

export const codeFacingTools = (opts: { names: string[], fixed: ToolSet, page: Record<string, Tool>, callPath: CallPathContext, trace: CodeTrace }): Record<string, Tool> => {
  const out: Record<string, Tool> = {}
  for (const name of opts.names) {
    const sourced = opts.fixed[name]
    const base = sourced ? withCallPath(sourced, opts.callPath, 'code') : opts.page[name]
    if (!base?.execute || !codeCallable(name, sourced?.tool ?? base)) continue
    const execute = base.execute
    out[name] = {
      ...base,
      // A script's tool never asks for approval (codeCallable keeps those out); stated so the package never prompts.
      needsApproval: undefined,
      execute: async (input: any, options: any) => await opts.trace.record(options.toolCallId, name, input, async () => {
        try {
          return await execute(input, options)
        } catch (err) {
          if (options?.abortSignal?.aborted) throw err
          throw new CodeModeToolError(err instanceof Error ? err.message : String(err))
        }
      })
    } as Tool
  }
  return out
}
