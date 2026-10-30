/**
 * The evidence a run is judged on, beyond what was rendered: the conversation EXPORT.
 *
 * The same file a maintainer downloads to debug a real session (`GET /api/review/:type/:id/
 * :conversationId/export`), so a simulation is judged on exactly what a production incident would be,
 * and an improvement to one is an improvement to both. It replaced a capture of the browser's
 * requests to the model gateway, which went blind when the agent loop moved server-side: the browser
 * no longer talks to a model, so it recorded nothing for any surface while the run still read valid.
 *
 * The file is JSONL — line 1 `meta` (with a reading guide), line 2 `outline`, then messages, the blobs
 * lifted out of them, system prompts and runs. Only the pieces the metrics need are typed here; the
 * judge reads the file itself.
 */

/** One conversation's export, as the runner fetched it. */
export type ConversationExport = {
  conversationId: string
  agentId?: string
  /** The file's contents, verbatim. */
  jsonl: string
}

/** A stored message part, as far as the metrics read it. */
type ExportPart = {
  type?: string
  toolName?: string
  input?: unknown
  state?: string
  /** A part lifted into its own `blob` record keeps a stub with this. */
  __ref?: string
}

/** One model call of a run (the run schema's `calls`). */
export type ExportCall = {
  modelRole: string
  model: string
  inputTokens?: number
  outputTokens?: number
  credits?: number
  toolNames?: string[]
  hostBlockChars?: number
}

export type ParsedExport = {
  conversationId: string
  agentId?: string
  messages: Array<{ seq: number, role: string, parts: ExportPart[] }>
  /** `error` says why a failed run failed (a refused turn, a provider failure). */
  runs: Array<{ status?: string, stopReason?: string, error?: string, credits?: number, calls: ExportCall[] }>
  /** Blob values by `ref`, so a lifted part can be read back whole. */
  blobs: Map<string, unknown>
}

/** Parse an export. Throws on a file that is not one, rather than reporting zero activity. */
export function parseConversationExport (exported: ConversationExport): ParsedExport {
  const parsed: ParsedExport = { conversationId: exported.conversationId, agentId: exported.agentId, messages: [], runs: [], blobs: new Map() }
  const lines = exported.jsonl.split('\n').filter(line => line.trim())
  // Named, whatever went wrong: a bare JSON SyntaxError does not say which of a run's exports it was.
  const fail = (why: string) => new Error(`conversation ${exported.conversationId}: not a conversation export (${why})`)
  const parseLine = (line: string, index: number) => {
    try { return JSON.parse(line) } catch { throw fail(`line ${index + 1} is not JSON`) }
  }
  if (!lines.length || parseLine(lines[0], 0)?.type !== 'meta') throw fail('no meta record on line 1')
  for (const [index, line] of lines.entries()) {
    if (index === 0) continue
    const record = parseLine(line, index)
    if (record.type === 'message') parsed.messages.push({ seq: record.seq, role: record.role, parts: record.parts ?? [] })
    else if (record.type === 'run') parsed.runs.push({ status: record.status, stopReason: record.stopReason, error: record.error, credits: record.credits, calls: record.calls ?? [] })
    else if (record.type === 'blob') parsed.blobs.set(record.ref, record.value)
  }
  return parsed
}

/**
 * A tool call the conversation recorded: one `dynamic-tool` part, whatever state it ended in.
 *
 * `part` is that part whole, read back from its blob when it was lifted, for a host reading a field
 * this type does not name — an approval's decision, its state — without re-implementing the lifting.
 */
export type RecordedToolCall = { toolName: string, input: unknown, failed: boolean, part: Record<string, unknown> }

/** Every tool call of a conversation, in order, a lifted part read back from its blob. */
export function recordedToolCalls (parsed: ParsedExport): RecordedToolCall[] {
  const calls: RecordedToolCall[] = []
  for (const message of parsed.messages) {
    for (const stub of message.parts) {
      const part = (stub.__ref ? parsed.blobs.get(stub.__ref) as ExportPart | undefined : undefined) ?? stub
      if (part.type !== 'dynamic-tool' || !part.toolName) continue
      calls.push({ toolName: part.toolName, input: part.input, failed: part.state === 'output-error', part: part as Record<string, unknown> })
    }
  }
  return calls
}

/**
 * Why runs ended in error, from their own record. A provider failure does not throw: the turn
 * "completes" and the error lands in the transcript as if the assistant had said it. Never the
 * product's fault, so a run carrying one is not judgeable.
 */
export function runErrors (exports: ParsedExport[]): string[] {
  return exports.flatMap(exported => exported.runs.filter(run => run.status === 'error').map(run => run.error ?? run.stopReason ?? 'run ended in error'))
}
