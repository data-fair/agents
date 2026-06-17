// Flattens an MCP CallToolResult into the string the AI SDK tool wrapper returns.
//
// MCP carries an `isError` flag on the result, but the OpenAI-compatible wire protocol
// the chat uses to reach the gateway has no tool-error channel — a tool message is just
// `{ role: 'tool', content: string }`. So a failure has to be surfaced inside that string,
// here, where the flag still exists: we prefix the text so the model plainly sees the call
// failed and can react, instead of silently treating an error (or an empty error body) as
// a successful result. Kept pure so this behaviour stays unit-testable.

export interface McpCallResult {
  content?: Array<{ type: string, text?: string }>
  isError?: boolean
}

export function formatMcpToolResult (callResult: McpCallResult): string {
  const textParts = callResult.content?.filter(c => c.type === 'text').map(c => c.text)
  const text = textParts?.join('\n') ?? JSON.stringify(callResult)
  return callResult.isError ? `Tool execution failed: ${text}` : text
}
