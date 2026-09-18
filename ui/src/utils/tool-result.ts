// Flattens an MCP CallToolResult into what the AI SDK tool wrapper returns.
//
// Text-only results stay a plain string. MCP carries an `isError` flag on the result,
// but the OpenAI-compatible wire protocol the chat uses to reach the gateway has no
// tool-error channel — a tool message is just `{ role: 'tool', content: string }`. So a
// failure has to be surfaced inside that string, here, where the flag still exists: we
// prefix the text so the model plainly sees the call failed and can react, instead of
// silently treating an error (or an empty error body) as a successful result.
//
// Results carrying MCP image parts return a `MediaToolResult` envelope object instead.
// The AI SDK serializes an object tool result as JSON into that same wire string, and
// the gateway recognizes the `_agentsMediaResult` marker to rebuild real image parts
// for the provider (see api/src/gateway/operations.ts). Kept pure for unit tests.

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
