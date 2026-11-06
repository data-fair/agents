/**
 * The code_mode tool: @ai-sdk/code-mode's tool over a map WE pass (createCodeModeTool), not the tool-caller
 * form — so the script's tools can return data while the model's return enveloped text, and the tool follows
 * the live tool set (docs/architecture/code-mode.md, "Why not experimental_toolCallers").
 *
 * The package is touched only here and in ./code-tools.ts: its API is experimental.
 */
import { tool, jsonSchema, type Tool } from 'ai'
import {
  experimental_createCodeModeTool as createCodeModeTool,
  experimental_setMaxWorkers as setMaxWorkers,
  experimental_setCodeModeContinuationSigningKey as setContinuationSigningKey,
  experimental_continueCodeModeApproval as continueCodeModeApproval,
  experimental_unwrapCodeModeResult as unwrapCodeModeResult,
  experimental_isCodeModeApprovalInterrupt as isCodeModeApprovalInterrupt,
  type CodeModeOptions
} from '@ai-sdk/code-mode'
import { CODE_MODE_POLICY, withoutPrototypeKeys, MAX_BRACKET_DEPTH, SCRIPT_ARGUMENT_DESCRIPTION, bracketDepth, bracketDepthMessage, WRAPPER_BYTES, wrapScript, renderScriptResult, scriptErrorMessage, describeScriptTool, PAUSED_SCRIPT_MAX_AGE_MS, SCRIPT_RESUME_FAILED_MESSAGE, scriptPauseTooLargeMessage, type CodeModePolicy } from './operations.ts'
import type { ScriptPauses } from './code-tools.ts'
import { LoopSignal } from '../conversations/operations.ts'

/**
 * Set once, at startup: the process-wide worker pool's size (config.codeModeMaxWorkers), and the key signing a paused
 * script's continuation (config.codeMode.continuationSecret), the same on every instance so the decision resumes it
 * wherever it lands, and after a restart, for PAUSED_SCRIPT_MAX_AGE_MS.
 */
export const configureCodeMode = (maxWorkers: number, continuationSecret: string) => {
  setMaxWorkers(maxWorkers)
  setContinuationSigningKey(continuationSecret, { maxAgeMs: PAUSED_SCRIPT_MAX_AGE_MS })
}

/**
 * A script paused on a call that needs a person: thrown, not returned, so the loop reads it as no result (a result
 * would be screened and read by the model). Its continuation is in the turn's ScriptPauses; the loop makes it a card.
 */
export class ScriptPausedError extends LoopSignal {
  constructor () { super('The script is paused for the person\'s approval.') }
}

/**
 * `reviewed`: the turn's writes pass the approval reviewer, whose time counts in the script's (describeScriptTool).
 * `pauses`: a person can decide in this turn (a chat): a call needing one pauses the script (the package's
 * interrupt mode), and a decided pause is resumed instead of run afresh.
 */
export const createScriptTool = (tools: Record<string, Tool>, opts: { policy?: Partial<CodeModePolicy>, reviewed?: boolean, pauses?: ScriptPauses } = {}): Tool => {
  const policy = { ...CODE_MODE_POLICY, ...opts.policy }
  const pauses = opts.pauses
  // The source limit is the model's: what wrapScript adds (the console, papaparse) is checked here, not counted there.
  // Every tool gets its input as the script built it, minus the keys that pollute a prototype.
  const cleaned = Object.fromEntries(Object.entries(tools).map(([name, t]) => [name, t.execute
    ? { ...t, execute: (input: unknown, options: any) => t.execute!(withoutPrototypeKeys(input), options) }
    : t])) as Record<string, Tool>
  const options: CodeModeOptions = {
    executionPolicy: { ...policy, maxSourceBytes: policy.maxSourceBytes + WRAPPER_BYTES },
    ...(pauses ? { approval: { mode: 'interrupt' as const } } : {})
  }
  const inner = createCodeModeTool(cleaned, options)
  /**
   * A decided pause, resumed from its continuation: the calls before it are replayed from `run`'s record, not made
   * again. Always as an approval: 1.0.116 fails a rejected continuation before the script runs (assertNoDeniedApproval),
   * so the rejected call throws inside the script instead (./code-tools.ts, `resumedCall`). A continuation the package
   * refuses (expired, tampered, the tools changed since) never ran anything: that is the error the model reads.
   */
  const resume = async (resumed: NonNullable<ReturnType<ScriptPauses['resumes']['get']>>, executionOptions: any) => {
    try {
      return await continueCodeModeApproval({ interrupt: resumed.interrupt, approvalResponse: { approvalId: resumed.interrupt.interruptId, approved: true }, tools: cleaned as any, options, toolExecutionOptions: executionOptions })
    } catch (err) {
      if ((err as { name?: string })?.name === 'CodeModeProtocolError' && !/Continuation state exceeds/.test((err as Error).message)) throw new Error(SCRIPT_RESUME_FAILED_MESSAGE)
      throw err
    }
  }
  return tool({
    description: describeScriptTool(inner.description, { reviewed: opts.reviewed, timeoutMs: policy.timeoutMs, person: !!pauses }),
    // The package's own input, `{ js }`, with our description of it (SCRIPT_ARGUMENT_DESCRIPTION).
    inputSchema: jsonSchema<{ js: string }>({
      type: 'object',
      properties: { js: { type: 'string', description: SCRIPT_ARGUMENT_DESCRIPTION } },
      required: ['js'],
      additionalProperties: false
    }),
    execute: async (input: { js: string }, executionOptions) => {
      const js = String(input?.js ?? '')
      if (Buffer.byteLength(js) > policy.maxSourceBytes) throw new Error(scriptErrorMessage({ name: 'CodeModeSourceTooLargeError' }, policy))
      if (bracketDepth(js) > MAX_BRACKET_DEPTH) throw new Error(bracketDepthMessage)
      const resumed = pauses?.resumes.get(executionOptions.toolCallId)
      let result: unknown
      try {
        result = resumed ? await resume(resumed, executionOptions) : await inner.execute!({ js: wrapScript(js) }, executionOptions)
      } catch (err) {
        // An abort is ours, not the script's: the loop must recognise it.
        if (executionOptions?.abortSignal?.aborted) throw err
        if ((err as Error)?.message === SCRIPT_RESUME_FAILED_MESSAGE) throw err
        throw new Error(scriptErrorMessage(err, policy))
      }
      if (!pauses) return renderScriptResult(result)
      const unwrapped = unwrapCodeModeResult(result)
      if (unwrapped.status === 'completed') return renderScriptResult(unwrapped.output)
      // Only approvals interrupt here: no tool of ours requests any other interrupt.
      if (!isCodeModeApprovalInterrupt(unwrapped.interrupt)) throw new Error(scriptErrorMessage(new Error('the script was interrupted for something other than an approval'), policy))
      // Stored before the step ends, so the loop stops on it (stopWhen) only once it can resume.
      if (!await pauses.keep(executionOptions.toolCallId, unwrapped.interrupt)) throw new Error(scriptPauseTooLargeMessage(unwrapped.interrupt.toolName))
      pauses.paused.set(executionOptions.toolCallId, unwrapped.interrupt)
      throw new ScriptPausedError()
    }
  }) as Tool
}
