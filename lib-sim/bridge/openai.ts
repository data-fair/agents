/**
 * Pure translation between the OpenAI chat-completions wire format the agents
 * gateway speaks and what the Claude Agent SDK accepts. No I/O, no SDK import —
 * everything here is unit-tested.
 */

export type OpenAIToolCall = {
  id: string
  type: 'function'
  function: { name: string, arguments: string }
}

export type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string | null
  tool_calls?: OpenAIToolCall[]
  tool_call_id?: string
}

export type OpenAIToolDef = {
  type: 'function'
  function: { name: string, description?: string, parameters?: Record<string, unknown> }
}

// Tools reach the model namespaced by their MCP server, so every name makes a
// round trip through this prefix and must be mapped back before it is emitted.
export const MCP_SERVER_NAME = 'bridge'
const PREFIX = `mcp__${MCP_SERVER_NAME}__`

export function toolNameToMcp (name: string): string {
  return PREFIX + name
}

export function mcpNameToTool (name: string): string {
  return name.startsWith(PREFIX) ? name.slice(PREFIX.length) : name
}

export function extractSystemPrompt (messages: OpenAIMessage[]): string {
  return messages
    .filter(m => m.role === 'system')
    .map(m => m.content ?? '')
    .join('\n\n')
}

/**
 * Render the conversation as a single prompt, for the replay path (a fresh
 * session). The continuation path never comes through here — it delivers tool
 * results into a query that is already holding the history.
 */
export function renderTranscript (messages: OpenAIMessage[]): string {
  const lines: string[] = ['<conversation_history>']
  for (const m of messages) {
    if (m.role === 'system') continue
    if (m.role === 'tool') {
      lines.push(`tool result (id=${m.tool_call_id}): ${m.content ?? ''}`)
      continue
    }
    if (m.role === 'assistant' && m.tool_calls?.length) {
      for (const c of m.tool_calls) {
        lines.push(`assistant called tool (id=${c.id}) ${c.function.name} with ${c.function.arguments}`)
      }
      if (m.content) lines.push(`assistant: ${m.content}`)
      continue
    }
    lines.push(`${m.role}: ${m.content ?? ''}`)
  }
  lines.push('</conversation_history>')
  lines.push('')
  lines.push('Continue this conversation: produce the next assistant turn.')
  return lines.join('\n')
}

const base = (id: string, model: string) => ({
  id,
  object: 'chat.completion.chunk',
  created: Math.floor(Date.now() / 1000),
  model
})

export function textChunk (id: string, model: string, text: string) {
  return { ...base(id, model), choices: [{ index: 0, delta: { content: text }, finish_reason: null }] }
}

export function toolCallsChunk (id: string, model: string, calls: OpenAIToolCall[]) {
  return {
    ...base(id, model),
    choices: [{
      index: 0,
      delta: { tool_calls: calls.map((c, index) => ({ index, id: c.id, type: 'function', function: c.function })) },
      finish_reason: null
    }]
  }
}

export function finalChunk (id: string, model: string, finishReason: 'stop' | 'tool_calls', usage?: object) {
  return {
    ...base(id, model),
    choices: [{ index: 0, delta: {}, finish_reason: finishReason }],
    ...(usage ? { usage } : {})
  }
}

/**
 * The SDK also reports total_cost_usd, deliberately not forwarded: it is list-price
 * bookkeeping, while consumption is actually against the plan's rate limits. Showing
 * it in the usage UI would invite reading it as real spend.
 */
export function mapUsage (usage: { input_tokens?: number, output_tokens?: number } | undefined) {
  if (!usage) return undefined
  const prompt = usage.input_tokens ?? 0
  const completion = usage.output_tokens ?? 0
  return { prompt_tokens: prompt, completion_tokens: completion, total_tokens: prompt + completion }
}

export function errorBody (message: string, type = 'api_error') {
  return { error: { message, type } }
}
