/**
 * The code_mode tool: @ai-sdk/code-mode's tool over a map WE pass (createCodeModeTool), not the tool-caller
 * form — so the script's tools can return data while the model's return enveloped text, and the tool follows
 * the live tool set (docs/architecture/code-mode.md, "Why not experimental_toolCallers").
 *
 * The package is touched only here and in ./code-tools.ts: its API is experimental.
 */
import { tool, jsonSchema, type Tool } from 'ai'
import { experimental_createCodeModeTool as createCodeModeTool, experimental_setMaxWorkers as setMaxWorkers } from '@ai-sdk/code-mode'
import { CODE_MODE_POLICY, SCRIPT_ARGUMENT_DESCRIPTION, WRAPPER_BYTES, wrapScript, renderScriptResult, scriptErrorMessage, describeScriptTool, type CodeModePolicy } from './operations.ts'

/** The process-wide worker pool's size (config.codeModeMaxWorkers): set once, at startup. */
export const configureCodeMode = (maxWorkers: number) => { setMaxWorkers(maxWorkers) }

export const createScriptTool = (tools: Record<string, Tool>, opts: { policy?: Partial<CodeModePolicy> } = {}): Tool => {
  const policy = { ...CODE_MODE_POLICY, ...opts.policy }
  // The source limit is the model's: what wrapScript adds (the console, papaparse) is checked here, not counted there.
  const inner = createCodeModeTool(tools, { executionPolicy: { ...policy, maxSourceBytes: policy.maxSourceBytes + WRAPPER_BYTES } })
  return tool({
    description: describeScriptTool(inner.description),
    // The package's own input, `{ js }`, with our description of it (SCRIPT_ARGUMENT_DESCRIPTION).
    inputSchema: jsonSchema<{ js: string }>({
      type: 'object',
      properties: { js: { type: 'string', description: SCRIPT_ARGUMENT_DESCRIPTION } },
      required: ['js'],
      additionalProperties: false
    }),
    execute: async (input: { js: string }, options) => {
      const js = String(input?.js ?? '')
      if (Buffer.byteLength(js) > policy.maxSourceBytes) throw new Error(scriptErrorMessage({ name: 'CodeModeSourceTooLargeError' }, policy))
      try {
        return renderScriptResult(await inner.execute!({ js: wrapScript(js) }, options))
      } catch (err) {
        // An abort is ours, not the script's: the loop must recognise it.
        if (options?.abortSignal?.aborted) throw err
        throw new Error(scriptErrorMessage(err, policy))
      }
    }
  }) as Tool
}
