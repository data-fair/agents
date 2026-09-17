/**
 * Republishes the tool definitions from an OpenAI request as an in-process MCP
 * server the SDK can offer to the model.
 *
 * Two non-obvious choices:
 *  - the LOW-LEVEL `Server` is used, not the `McpServer` helper: the helper rejects
 *    raw JSON Schema and demands Zod, while a request hands us JSON Schema already.
 *  - handlers SUSPEND. `onCall` returns a promise the HTTP layer resolves when the
 *    client's next request delivers the tool result, so the same query — and its
 *    prompt cache — carries the whole conversation, and the model's tool_use is
 *    answered by a real tool_result rather than by user text.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { MCP_SERVER_NAME, type OpenAIToolDef } from './openai.ts'

// A suspended handler must outlive a slow client turn — a tool wired to a human
// action button can wait minutes. The default MCP timeout would abort it.
export const TOOL_TIMEOUT_MS = 600000

export function listToolsFor (tools: OpenAIToolDef[]) {
  return tools.map(t => ({
    name: t.function.name,
    description: t.function.description ?? '',
    inputSchema: t.function.parameters ?? { type: 'object', properties: {} }
  }))
}

export function createToolServer (
  tools: OpenAIToolDef[],
  onCall: (name: string, args: Record<string, unknown>) => Promise<string>
) {
  const instance = new Server({ name: MCP_SERVER_NAME, version: '1.0.0' }, { capabilities: { tools: {} } })
  instance.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: listToolsFor(tools) }))
  instance.setRequestHandler(CallToolRequestSchema, async (req) => {
    const text = await onCall(req.params.name, (req.params.arguments ?? {}) as Record<string, unknown>)
    return { content: [{ type: 'text', text }] }
  })
  return {
    type: 'sdk' as const,
    name: MCP_SERVER_NAME,
    instance,
    alwaysLoad: true as const,
    timeout: TOOL_TIMEOUT_MS
  }
}
