/**
 * operations-style module: pure, no #mongo / #config.
 *
 * CODE MODE (spec §6, docs/architecture/code-mode.md): the model writes one JavaScript script that
 * transforms text/JSON and calls the agent's own tools as async functions, so intermediate results never
 * enter its context. The sandbox is @ai-sdk/code-mode on vercel-labs `run` (QuickJS-ng in WASM workers);
 * this module holds what is ours around it: the limits, the console prelude, how a result and a failure
 * read to the model, and which tools a script may call.
 */
import { WAIT_TOOL_NAME } from '@agents/shared/agent-activity'
import { truncatedToolResultText } from '../conversations/compaction-policy.ts'

export const CODE_MODE_TOOL_NAME = 'code_mode'
/** The source a stored code_mode call names, and the server its result's envelope attributes it to. */
export const CODE_MODE_SERVER_ID = 'code-mode'
/** A script may call writing tools; what it can do is what those tools can do (each keeps its own annotations). */
export const CODE_MODE_ANNOTATIONS = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }

const MiB = 1024 * 1024
/**
 * The script's bounds (plan 4, decision 5). `timeoutMs` is WALL clock, tool waits included: a catalog query
 * and a download do not fit in the 10 s the spec set before scripts could call tools. CPU is bounded
 * separately by `run` (10 s, not exposed by the package). Tool input/output ≥ the 10 MB file bound plus JSON
 * escaping. `maxBridgeRequests` = the step limit: a script cannot make more calls than a turn could steps.
 */
export const CODE_MODE_POLICY = {
  timeoutMs: 120_000,
  memoryLimitBytes: 64 * MiB,
  maxStackSizeBytes: 2 * MiB,
  maxSourceBytes: 64 * 1024,
  maxResultBytes: MiB,
  maxConsoleOutputBytes: 64 * 1024,
  maxToolInputBytes: 16 * MiB,
  maxToolOutputBytes: 16 * MiB,
  maxBridgeRequests: 100,
  maxInFlightBridgeRequests: 8
}
export type CodeModePolicy = typeof CODE_MODE_POLICY

/** What the model reads of a script's return value, and of its console. */
export const SCRIPT_RESULT_CHARS = 20_000
export const SCRIPT_LOG_CHARS = 5_000

/**
 * The console, captured. The package writes `console.*` to the worker's stdout — the SERVER's logs — and
 * returns only the value, so a script's own diagnostics would leak into logs and never reach the model.
 * This prelude shadows `console` inside the script and returns `{ value, logs }`. All on the script's FIRST
 * line, so a syntax error or a stack names the line the model wrote.
 */
const PRELUDE = 'const __agentLogs = []; const __agentShow = (v) => { if (typeof v === "string") return v; try { return String(JSON.stringify(v)) } catch (e) { return String(v) } }; const __agentLog = (...values) => { __agentLogs.push(values.map(__agentShow).join(" ")) }; const console = { log: __agentLog, info: __agentLog, warn: __agentLog, error: __agentLog, debug: __agentLog }; return { value: await (async () => {'
export const wrapScript = (js: string): string => `${PRELUDE}${js}\n})(), logs: __agentLogs }`

/** What the model reads: the value (JSON unless a string), cut like any large result, then the console. */
export const renderScriptResult = (output: unknown): string => {
  const { value, logs } = output && typeof output === 'object' && Array.isArray((output as { logs?: unknown }).logs)
    ? output as { value: unknown, logs: string[] }
    : { value: output, logs: [] as string[] }
  const text = value === undefined ? 'The script returned nothing.' : typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  const shown = text.length > SCRIPT_RESULT_CHARS ? truncatedToolResultText(text.slice(0, SCRIPT_RESULT_CHARS), text.length) : text
  if (!logs.length) return shown
  const log = logs.join('\n')
  return `${shown}\n\nConsole output:\n${log.length > SCRIPT_LOG_CHARS ? `${log.slice(0, SCRIPT_LOG_CHARS)}…` : log}`
}

/**
 * A failure in words the model can act on. The package's and `run`'s errors by name (their classes are not all
 * exported); anything else keeps its own name and message — a SyntaxError, the guest's own throw, a tool's
 * CodeModeToolError.
 */
export const scriptErrorMessage = (err: unknown, policy: CodeModePolicy = CODE_MODE_POLICY): string => {
  const e = err as { name?: string, code?: string, message?: string }
  switch (e?.name) {
    case 'RunCpuTimeoutError': return 'The script used more than 10 s of CPU time and was stopped. Do less work in one script: filter earlier, or split it.'
    // A nested call is aborted with the script, but one already sent may have completed on its server (docs/architecture/code-mode.md).
    case 'CodeModeTimeoutError': return `The script ran for more than ${policy.timeoutMs / 1000} s, tool calls included, and was stopped. A tool call it had already sent may still have completed: check before repeating a write.`
    case 'CodeModeBridgeLimitError': return `The script made more than ${policy.maxBridgeRequests} tool calls, the most one script may make.`
    case 'CodeModeDetachedBridgeRequestError': return 'The script started a tool call it did not wait for. await every tool call (or Promise.all them) before returning.'
    case 'CodeModeConcurrencyError': return 'Too many scripts are running on this server right now. Try again in a moment, or call the tools directly.'
    case 'CodeModeSourceTooLargeError': return `The script is longer than ${policy.maxSourceBytes / 1024} KiB. Write a shorter one.`
  }
  if (e?.code === 'CODE_MODE_SERIALIZATION_ERROR') return `The script's result is larger than ${policy.maxResultBytes / (1024 * 1024)} MiB. Return less: write the data to a file with write_file and return its path.`
  const message = e?.message ?? String(err)
  return e?.name && !message.startsWith(e.name) ? `${e.name}: ${message}` : message
}

/**
 * The package's description without its examples block (one call per tool: it grows with the set), and our part:
 * the conventions of what a tool returns to a script, since most signatures cannot say (an MCP server rarely
 * declares an output schema), and what a script cannot call.
 */
/** The `js` argument's description: the package's promises "call examples", which describeScriptTool drops. */
export const SCRIPT_ARGUMENT_DESCRIPTION = 'The script: JavaScript calling the global `tools` API whose signatures this tool\'s description lists. TypeScript syntax is stripped, not checked.'

export const describeScriptTool = (packageDescription: string): string => {
  const head = packageDescription.split('\nTool call examples:')[0].trimEnd()
  return [
    head,
    'console.log output is returned after the result. A tool failure is an exception carrying the tool\'s message.',
    'What a tool returns, when its signature says `unknown`: an MCP tool returns its structured result as an object when it has one, otherwise its text as a string (JSON.parse it if it is JSON). A tool whose result carries files returns { text, files: [{ file_path, mimeType, size }] }. read_file returns the whole text of the file.',
    'Check what you got before writing or importing it: a parse that yields nothing should throw, not write an empty file.',
    'Tools that need approval, wait_for_user_action, the access and planning requests, read_skill and sub-agents can only be called directly.'
  ].join('\n\n')
}

/**
 * Tools a script may NOT call, whatever the turn offers (spec §6.3, plan 4 decision 4): the handover ends the
 * turn; the access and planning requests ask an administrator; read_skill is guidance for the model, which in a
 * script would be data nobody reads; and code_mode itself. Names restated, not imported, to keep this module pure
 * of the service tools' modules — a unit test pins them against the real constants.
 */
const DIRECT_ONLY = new Set([WAIT_TOOL_NAME, 'request_web_access', 'request_mcp_access', 'plan_task', 'update_task', 'delete_task', 'read_skill', CODE_MODE_TOOL_NAME])

/**
 * Whether a script may call this tool. Never one needing approval: the package refuses it without an approval
 * callback (and its docs say not to expose one), and a script cannot pause for a person — lifting this goes
 * through `run`'s signed continuations, upstream vercel/ai#18143. Never a sub-agent delegation: a model loop
 * inside a script (vercel/ai#18145), and its trace is keyed on the model's own call.
 */
export const codeCallable = (name: string, tool: { needsApproval?: unknown }): boolean =>
  !tool.needsApproval && !DIRECT_ONLY.has(name) && !name.startsWith('subagent_')
