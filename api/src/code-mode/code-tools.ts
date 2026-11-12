/**
 * THE MAP A SCRIPT CALLS (spec §6.3–6.5): the turn's callable tools as a script sees them.
 *
 * - Through the same call path as the model's calls (api/src/files/call-path.ts, mode 'code'): file
 *   arguments become signed URLs, links become stored files — the same call, as spec §4.4 promised.
 * - Without the provenance envelope: the script is not the model. Its RESULT reaches the model through the
 *   envelope (code_mode's own, model-loop.ts), since it may quote tool output verbatim.
 * - Data, not text (SourcedTool.codeExecute).
 * - Recorded: the package has no event for nested calls (vercel/ai#18144), so each call is recorded here, into a
 *   `data-trace` part under the code_mode call — streamed while the script runs, stored when it ends, left
 *   out of replay.
 * - Reviewed (api/src/approval-review/gate.ts): a configured agent's reviewed tools are judged before they run, as
 *   the model's own calls are — a script is no way around the reviewer. A deny fails the call. Every call that ran
 *   is noted, its output having entered the script.
 * - Paused for a person (`pauses`, a chat turn only): a call the person must decide on — the reviewer unsure, or
 *   allowing a class routed `reviewer+person`, or a tool asking by its own `needsApproval` — declares it through the
 *   package's `needsApproval`, and the script pauses there (./tool.ts). Without a person (a task run), unsure and
 *   such tools stay refused.
 * - A failure is rethrown as CodeModeToolError: the package replaces any other error with "Host tool failed."
 */
import { jsonSchema, type Tool } from 'ai'
import { CodeModeToolError, type CodeModeApprovalInterrupt } from '@ai-sdk/code-mode'
import type { MessagePart } from '@agents/shared/message-parts'
import { isMediaToolResult, scriptViewOfMedia } from '@agents/shared/tool-result'
import type { JSONObject } from '@ai-sdk/provider'
import type { ToolSet } from '../conversations/operations.ts'
import { asksPerson, type ReviewGate } from '../approval-review/gate.ts'
import { refusalTextOf, type ReviewRecord } from '../approval-review/operations.ts'
import { createPartsRecorder, resultSettlement, errorSettlement, boundRecordedInput, type CallSettlement } from '../conversations/parts-recorder.ts'
import { withCallPath, type CallPathContext } from '../files/call-path.ts'
import { CODE_MODE_TOOL_NAME, codeCallable, SCRIPT_TRANSFER_BYTES, bridgedBytes, transferRefusedMessage, transferExceededMessage, CODE_MODE_TURN_CALLS, turnCallsExceededMessage, rejectedCallMessage } from './operations.ts'

export interface CodeTrace {
  record<T> (toolCallId: string, toolName: string, input: unknown, run: () => Promise<T>): Promise<T>
  /** Metadata onto a nested call still open (its review). */
  annotate (toolCallId: string, toolMetadata: JSONObject): void
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
    annotate (toolCallId, toolMetadata) {
      const parent = parentOf(toolCallId)
      if (finished.has(parent)) return
      const call = traces.get(parent)?.recorder.parts.find(part => part.type === 'dynamic-tool' && part.toolCallId === toolCallId)
      if (call?.type === 'dynamic-tool') call.toolMetadata = { ...call.toolMetadata, ...toolMetadata }
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

/**
 * The calls the scripts of one turn have made, against CODE_MODE_TURN_CALLS. Created once per turn and passed to
 * every step's map: the map is rebuilt every step.
 */
export interface TurnCalls { count: number, max?: number }

/** What a script's calls go through in a configured agent's turn: its review gate. The personal assistant has none. */
export type NestedReview = Pick<ReviewGate, 'reviewNested' | 'noteNested'>

/** The person's decision on one call a script paused on. */
export interface ScriptDecision { toolCallId: string, approved: boolean, reason?: string }

/**
 * A paused script to resume: its continuation, and EVERY decision made on it so far, the latest on the call it
 * stopped at. Several calls can be pending in one continuation (parallel calls): the package answers the earlier
 * decisions without running anything, and runs those calls only once the last is decided — each must then still
 * find its own decision (a rejection throwing, an approval not reviewed again).
 */
export interface ScriptResume { interrupt: CodeModeApprovalInterrupt, decisions: ScriptDecision[] }

/**
 * What one script had used before it paused, carried to its resume: `run` answers the calls made before the pause from
 * its record, through none of our wrappers, so the resumed turn would otherwise count them as never made. `calls`
 * against CODE_MODE_TURN_CALLS, `bytes` against SCRIPT_TRANSFER_BYTES, `ran` the tools whose output entered the script
 * (the review gate's exposure, `noteNested`).
 */
export interface ScriptSpent { calls: number, bytes: number, ran: string[] }
export const noScriptSpent = (): ScriptSpent => ({ calls: 0, bytes: 0, ran: [] })

/**
 * THE SCRIPTS OF A TURN THAT WAIT FOR A PERSON (a chat turn only), shared by every step's map and code_mode tool:
 * `paused`, the continuations of the scripts that paused this turn, by code_mode call id (the loop makes each a
 * card); `resumes`, the decided ones this turn resumes, by code_mode call id (model-loop.ts, before its first step);
 * `keep`, where a pause is stored (api/src/code-mode/pauses.ts, through the turn's target).
 */
export interface ScriptPauses {
  paused: Map<string, CodeModeApprovalInterrupt>
  resumes: Map<string, ScriptResume>
  /** What each script of the turn has used so far, by code_mode call id: kept with its pause, seeded on its resume. */
  spent: Map<string, ScriptSpent>
  /**
   * Store a pause's continuation, with the decisions made on it so far and what the script had used, where the next
   * decision will find it; false when too large to keep.
   */
  keep: (toolCallId: string, interrupt: CodeModeApprovalInterrupt, decisions: ScriptDecision[], spent: ScriptSpent) => Promise<boolean>
}
export const createScriptPauses = (keep: ScriptPauses['keep']): ScriptPauses => ({ paused: new Map(), resumes: new Map(), spent: new Map(), keep })

export const codeFacingTools = (opts: { names: string[], fixed: ToolSet, page: Record<string, Tool>, callPath: CallPathContext, trace: CodeTrace, turnCalls?: TurnCalls, review?: NestedReview, pauses?: ScriptPauses }): Record<string, Tool> => {
  const out: Record<string, Tool> = {}
  // A person can decide in this turn: a call needing one pauses the script instead of being refused.
  const person = !!opts.pauses
  // A call of a resumed script the person decided: neither reviewed again nor asked about.
  const resumedCall = (toolCallId: string): ScriptDecision | undefined => {
    for (const resume of opts.pauses?.resumes.values() ?? []) {
      const decision = resume.decisions.find(d => d.toolCallId === toolCallId)
      if (decision) return decision
    }
  }
  // A review made to decide whether to pause (needsApproval), read again by the call it decided (execute).
  const records = new Map<string, ReviewRecord>()
  const turnCalls = opts.turnCalls ?? { count: 0 }
  const maxTurnCalls = turnCalls.max ?? CODE_MODE_TURN_CALLS
  // What each script has used so far (ScriptSpent), keyed like the trace. The map is rebuilt every step and a running
  // script keeps the one it started with, so this lives as long as the scripts that use it; where a script can pause,
  // in the turn's ScriptPauses, which keeps it with the pause and seeds it again on the resume.
  const spent = opts.pauses?.spent ?? new Map<string, ScriptSpent>()
  const spentOf = (toolCallId: string): ScriptSpent => {
    const parent = toolCallId.replace(/:tool-\d+$/, '')
    let used = spent.get(parent)
    if (!used) { used = noScriptSpent(); spent.set(parent, used) }
    return used
  }
  const spend = (toolCallId: string, bytes: number, message: string) => {
    const used = spentOf(toolCallId)
    if (used.bytes + bytes > SCRIPT_TRANSFER_BYTES) throw new Error(message)
    used.bytes += bytes
  }
  for (const name of opts.names) {
    const sourced = opts.fixed[name]
    const base = sourced ? withCallPath(sourced, opts.callPath, 'code') : opts.page[name]
    if (!base?.execute || !codeCallable(name, sourced?.tool ?? base, { person })) continue
    const execute = base.execute
    // Who decides this tool's calls when a person can: the reviewer first for a reviewed tool, the person for a tool
    // asking by its own needsApproval (the personal assistant's writes).
    const asksFirst = person && (sourced?.review || (sourced?.tool ?? base).needsApproval)
    out[name] = {
      ...base,
      // What the script receives, as the return type of its signature in code_mode's description: the package
      // renders `outputSchema` there, and a tool without one reads `Promise<unknown>` (SourcedTool.codeOutputSchema).
      ...(sourced?.codeOutputSchema ? { outputSchema: jsonSchema(sourced.codeOutputSchema) } : {}),
      // Its own description and input when the script's tool differs from the model's (SourcedTool.codeDescription).
      ...(sourced?.codeDescription ? { description: sourced.codeDescription } : {}),
      ...(sourced?.codeInputSchema ? { inputSchema: jsonSchema(sourced.codeInputSchema) } : {}),
      // Whether the script pauses on this call for a person (./tool.ts): the package asks before `execute`, and not
      // for the call a resumed script stopped at. Without a person, never: the package would refuse the call.
      needsApproval: asksFirst
        ? async (input: any, options: any) => {
          // Refused anyway (execute below): no review to spend, no person to ask.
          if (turnCalls.count >= maxTurnCalls) return false
          if (!sourced?.review) return true
          if (!opts.review) return false
          // The script's input, before the call path's file/URL transformation: as a direct call is reviewed.
          const record = await opts.review.reviewNested(options.toolCallId, name, input)
          records.set(options.toolCallId, record)
          return asksPerson(record, sourced.review.route)
        }
        : undefined,
      execute: async (input: any, options: any) => await opts.trace.record(options.toolCallId, name, input, async () => {
        try {
          if (turnCalls.count >= maxTurnCalls) throw new Error(turnCallsExceededMessage(maxTurnCalls))
          turnCalls.count++
          spentOf(options.toolCallId).calls++
          spend(options.toolCallId, bridgedBytes(input), transferRefusedMessage)
          const resumed = resumedCall(options.toolCallId)
          // A person's rejection, resumed as an approval (the package fails a rejected continuation before the
          // script could catch it, ./tool.ts): the call throws, inside the script.
          if (resumed && !resumed.approved) throw new Error(rejectedCallMessage(name, resumed.reason))
          if (sourced?.review && !resumed) {
            // A reviewed tool without a gate to judge it is refused, never run unjudged.
            if (!opts.review) throw new Error(`${name} needs a review this turn cannot give`)
            // Reviewed already when a person could have been asked (needsApproval above); otherwise now.
            const record = records.get(options.toolCallId) ?? await opts.review.reviewNested(options.toolCallId, name, input)
            records.delete(options.toolCallId)
            opts.trace.annotate(options.toolCallId, { review: record as unknown as JSONObject })
            if (record.outcome !== 'allow') throw new Error(refusalTextOf(record))
          }
          let output
          try {
            output = await execute(input, options)
          } finally {
            opts.review?.noteNested(name)
            const used = spentOf(options.toolCallId)
            if (!used.ran.includes(name)) used.ran.push(name)
          }
          // A page tool's image result arrives as the envelope the model would get: the script gets its text (as an
          // MCP tool's, ../mcp-servers/client.ts), never the base64.
          if (isMediaToolResult(output)) output = scriptViewOfMedia(name, output)
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
