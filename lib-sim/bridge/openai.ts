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

/**
 * Claude Code cuts an MCP tool's description at 2048 characters ("… [truncated]"), silently, and the bridge
 * serves every tool to it as an MCP tool. A product whose descriptions run longer (code_mode lists every tool's
 * signature, then its own conventions after them) was simulated without their end: scripts ignored a library and
 * a time-zone rule they never saw, while the product sends them whole to a real provider. So a longer description
 * is cut HERE, with a pointer, and given whole in the system prompt (systemPromptFor), which is not cut.
 */
export const MCP_DESCRIPTION_LIMIT = 2048
const continuedNote = (name: string) => `… (continued in the system prompt, under "Full description of the ${name} tool")`

/** A tool's description as the MCP listing carries it: whole, or cut to fit with a pointer to the rest. */
export function listedDescription (name: string, description: string): string {
  if (description.length <= MCP_DESCRIPTION_LIMIT) return description
  const note = continuedNote(name)
  return description.slice(0, MCP_DESCRIPTION_LIMIT - note.length) + note
}

/** The system prompt, then the whole description of every tool the listing had to cut. */
export function systemPromptFor (messages: OpenAIMessage[], tools: OpenAIToolDef[]): string {
  const long = tools.filter(t => (t.function.description ?? '').length > MCP_DESCRIPTION_LIMIT)
  return [
    extractSystemPrompt(messages),
    ...long.map(t => `# Full description of the ${t.function.name} tool\n\n${t.function.description}`)
  ].join('\n\n')
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
// Each message in its own tag, not a « role: » line: continued as a script, a role-prefixed
// transcript taught the model to write the next « user: » line itself — judged haiku runs
// invented the person's turns and the application's host-event blocks, then answered them.
// A real provider receives structured messages and never sees such a transcript.
export function renderTranscript (messages: OpenAIMessage[]): string {
  const lines: string[] = ['<conversation_history>']
  for (const m of messages) {
    if (m.role === 'system') continue
    if (m.role === 'tool') {
      lines.push(`<tool_result id="${m.tool_call_id}">\n${m.content ?? ''}\n</tool_result>`)
      continue
    }
    if (m.role === 'assistant') {
      for (const c of m.tool_calls ?? []) {
        lines.push(`<tool_call id="${c.id}" name="${c.function.name}">\n${c.function.arguments}\n</tool_call>`)
      }
      if (m.content) lines.push(`<assistant_message>\n${m.content}\n</assistant_message>`)
      continue
    }
    lines.push(`<user_message>\n${m.content ?? ''}\n</user_message>`)
  }
  lines.push('</conversation_history>')
  lines.push('')
  lines.push("Write only the assistant's next reply, as the assistant: never write a user message or an application event, they come from the person and the application alone.")
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
 * One whole `chat.completion`, folded from the chunks a streamed answer is made of — for a request that
 * did not ask to stream. A client calling without streaming (the AI SDK's generateText: memory
 * reflection, for one) parses the body as a single JSON value, and an event stream fails it with "Invalid
 * JSON response". Folding keeps ONE turn logic for both: the turn writes chunks either way.
 *
 * An error chunk anywhere makes the whole answer that error.
 */
export function completionOf (id: string, model: string, chunks: object[]):
  { completion: object } | { error: ReturnType<typeof errorBody> } {
  let content = ''
  const toolCalls: OpenAIToolCall[] = []
  let finishReason: string | null = null
  let usage: object | undefined
  for (const chunk of chunks as any[]) {
    if (chunk.error) return { error: chunk }
    const choice = chunk.choices?.[0]
    if (typeof choice?.delta?.content === 'string') content += choice.delta.content
    for (const call of choice?.delta?.tool_calls ?? []) toolCalls.push({ id: call.id, type: 'function', function: call.function })
    if (choice?.finish_reason) finishReason = choice.finish_reason
    if (chunk.usage) usage = chunk.usage
  }
  return {
    completion: {
      id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: content || null, ...(toolCalls.length ? { tool_calls: toolCalls } : {}) },
        finish_reason: finishReason ?? 'stop'
      }],
      ...(usage ? { usage } : {})
    }
  }
}

/**
 * The SDK also reports total_cost_usd, deliberately not forwarded: it is list-price
 * bookkeeping, while consumption is actually against the plan's rate limits. Showing
 * it in the usage UI would invite reading it as real spend.
 */
export function mapUsage (usage: { input_tokens?: number, output_tokens?: number, cache_read_input_tokens?: number, cache_creation_input_tokens?: number } | undefined) {
  if (!usage) return undefined
  // Anthropic's `input_tokens` is only the UNCACHED remainder, and Claude Code caches nearly every
  // prompt — so on its own it reported a handful of tokens for calls carrying a whole system prompt
  // and tool list. OpenAI's `prompt_tokens` is the whole prompt, with the cached share broken out.
  const cached = usage.cache_read_input_tokens ?? 0
  const prompt = (usage.input_tokens ?? 0) + cached + (usage.cache_creation_input_tokens ?? 0)
  const completion = usage.output_tokens ?? 0
  return {
    prompt_tokens: prompt,
    completion_tokens: completion,
    total_tokens: prompt + completion,
    ...(cached ? { prompt_tokens_details: { cached_tokens: cached } } : {})
  }
}

export function errorBody (message: string, type = 'api_error') {
  return { error: { message, type } }
}
