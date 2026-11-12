// Flattens an MCP CallToolResult into what the AI SDK tool wrapper returns.
//
// Text-only results stay a plain string. MCP carries an `isError` flag on the result,
// and the flag does not survive this flattening (the caller rethrows on it separately,
// see api/src/mcp-servers/client.ts). So a failure is also surfaced inside the string,
// here, where the flag still exists: we
// prefix the text so the model plainly sees the call failed and can react, instead of
// silently treating an error (or an empty error body) as a successful result.
//
// Results carrying MCP image parts return a `MediaToolResult` envelope object instead, which
// the server turns into real image parts for the model by its `_agentsMediaResult` marker
// (`mediaModelOutput` in api/src/conversations/operations.ts). Kept pure for unit tests.

export interface McpCallResult {
  content?: Array<{ type: string, text?: string, data?: string, mimeType?: string }>
  isError?: boolean
}

export interface MediaToolResult {
  _agentsMediaResult: true
  text?: string
  media: Array<{ data: string, mediaType: string }>
}

export type FormattedToolResult = string | MediaToolResult

export function isMediaToolResult (value: unknown): value is MediaToolResult {
  return typeof value === 'object' && value !== null &&
    (value as MediaToolResult)._agentsMediaResult === true &&
    Array.isArray((value as MediaToolResult).media)
}

export function formatMcpToolResult (callResult: McpCallResult): FormattedToolResult {
  const textParts = callResult.content?.filter(c => c.type === 'text').map(c => c.text)
  const media = (callResult.content ?? [])
    .filter(c => c.type === 'image' && typeof c.data === 'string' && typeof c.mimeType === 'string')
    .map(c => ({ data: c.data as string, mediaType: c.mimeType as string }))

  if (media.length === 0) {
    const text = textParts?.join('\n') ?? JSON.stringify(callResult)
    return callResult.isError ? `Tool execution failed: ${text}` : text
  }

  const joined = textParts?.length ? textParts.join('\n') : undefined
  const text = callResult.isError ? `Tool execution failed: ${joined ?? ''}` : joined
  return { _agentsMediaResult: true, ...(text !== undefined ? { text } : {}), media }
}

/** What a script gets from a media result (scriptViewOfMedia): its text and data, a note where the images were. */
export interface ScriptMediaView {
  text: string
  note: string
  [key: string]: unknown
}

/**
 * What a SCRIPT (code mode) gets from a result carrying images: the text and, when the tool sent one, its
 * structuredContent, with a note that the images were left out and how to see them. A script cannot look at an
 * image, and its base64 returned by the script would reach the model as JSON, not as an image. The data stays the
 * declared shape (structuredContent's own keys win), so a script typed on the tool's outputSchema still reads it.
 */
export function scriptViewOfMedia (toolName: string, result: MediaToolResult, structured?: unknown): ScriptMediaView {
  const n = result.media.length
  const note = `This result also carries ${n === 1 ? 'an image' : `${n} images`}, which a script cannot see. To look at ${n === 1 ? 'it' : 'them'}, call ${toolName} directly, outside code_mode.`
  const data = structured && typeof structured === 'object' && !Array.isArray(structured) ? structured as Record<string, unknown> : {}
  return { text: result.text ?? '', note, ...data }
}

/**
 * The formatted result, or a throw when the tool reported its own failure (`isError`). Throwing is what
 * the model loop treats as a failure (a `tool-error`, stored `output-error`); returned as a value, a failed
 * call looks exactly like a successful one. The page-tool path; the server's MCP clients do the same inline,
 * with their link handling.
 */
export function toolOutputOrThrow (callResult: McpCallResult): FormattedToolResult {
  const formatted = formatMcpToolResult(callResult)
  if (callResult.isError) throw new Error(typeof formatted === 'string' ? formatted : formatted.text ?? 'Tool execution failed')
  return formatted
}

/**
 * Replace the base64 payloads of a media envelope with small size placeholders.
 * Used wherever a tool result is embedded into text again (compaction prompts,
 * stored traces) — a base64 image there is pure token/storage waste.
 */
export function redactMediaToolResult<T> (value: T): T {
  if (!isMediaToolResult(value)) return value
  return {
    ...value,
    media: value.media.map(m => ({
      ...m,
      data: `[image ${m.mediaType} ~${Math.round(m.data.length * 3 / 4 / 1024)}kB omitted]`
    }))
  }
}

/** Redact media envelopes inside tool-result parts of a ModelMessage history, without mutating it. */
export function redactHistoryMediaToolResults<T extends { role: string, content: unknown }> (messages: T[]): T[] {
  return messages.map(msg => {
    if (msg.role !== 'tool' || !Array.isArray(msg.content)) return msg
    let changed = false
    const content = msg.content.map((part: any) => {
      if (part?.type === 'tool-result' && isMediaToolResult(part.output?.value)) {
        changed = true
        return { ...part, output: { ...part.output, value: redactMediaToolResult(part.output.value) } }
      }
      return part
    })
    return changed ? { ...msg, content } : msg
  })
}
