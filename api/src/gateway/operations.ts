/**
 * operations.ts contains pure stateless functions for the OpenAI-compatible gateway
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

import { tool, jsonSchema } from 'ai'
import type { Tool, ModelMessage } from 'ai'

// OpenAI-compatible types for incoming requests

export interface OpenAIFunction {
  name: string
  description?: string
  parameters?: Record<string, unknown>
}

export interface OpenAIToolDefinition {
  type: 'function'
  function: OpenAIFunction
}

export interface OpenAIToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: OpenAIToolCall[]
  tool_call_id?: string
}

export interface OpenAIToolChoiceObject {
  type: 'function'
  function: { name: string }
}

export type OpenAIToolChoice = 'none' | 'auto' | 'required' | OpenAIToolChoiceObject

export type FinishReason = 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'

export function mapFinishReason (reason: FinishReason): string {
  if (reason === 'tool-calls') return 'tool_calls'
  if (reason === 'content-filter') return 'content_filter'
  return reason
}

/** Convert OpenAI tool definitions to AI SDK tools (without execute) */
export function convertOpenAITools (openaiTools: OpenAIToolDefinition[]): Record<string, Tool> {
  const tools: Record<string, Tool> = {}
  if (!openaiTools) return tools
  for (const t of openaiTools) {
    if (t.type !== 'function' || !t.function) continue
    const fn = t.function
    tools[fn.name] = tool({
      description: fn.description || '',
      inputSchema: jsonSchema(fn.parameters || { type: 'object', properties: {} })
    })
  }
  return tools
}

// Media tool results. The browser↔gateway wire is OpenAI chat-completions, where a
// tool message is a plain string — so a tool that returned MCP image parts sends them
// as a JSON "media envelope" in that string (built by ui/src/utils/tool-result.ts).
// The gateway rebuilds real image parts from it here.

interface MediaEnvelope {
  _agentsMediaResult: true
  text?: string
  media: Array<{ data: string, mediaType: string }>
}

type ToolResultContentPart = { type: 'text', text: string } | { type: 'image-data', data: string, mediaType: string }
type ToolResultOutput =
  | { type: 'json', value: unknown }
  | { type: 'text', value: string }
  | { type: 'content', value: ToolResultContentPart[] }

function isMediaEnvelope (value: unknown): value is MediaEnvelope {
  return typeof value === 'object' && value !== null &&
    (value as MediaEnvelope)._agentsMediaResult === true &&
    Array.isArray((value as MediaEnvelope).media)
}

function mediaEnvelopeToContentOutput (envelope: MediaEnvelope): ToolResultOutput {
  const value: ToolResultContentPart[] = []
  if (envelope.text !== undefined) value.push({ type: 'text', text: envelope.text })
  for (const m of envelope.media) value.push({ type: 'image-data', data: m.data, mediaType: m.mediaType })
  return { type: 'content', value }
}

/**
 * Whether the AI SDK provider used for this provider type forwards image parts in tool
 * results to the model. Verified against the installed providers: anthropic (tool_result
 * image blocks), openai (Responses API input_image) and google (inlineData) do;
 * the chat-completions paths (mistral, and @ai-sdk/openai-compatible's .chatModel used
 * for scaleway/ollama/"compatible" mode) JSON.stringify the parts — a base64 token bomb —
 * and openrouter is a third-party provider we haven't verified, so those get the
 * user-message fallback (injectMediaAsUserMessages) instead.
 */
export function supportsMediaToolResults (providerType: string, compatibility?: string): boolean {
  if (providerType === 'openai-compatible') return compatibility !== 'compatible'
  return ['openai', 'anthropic', 'google', 'mock'].includes(providerType)
}

/**
 * Fallback for providers whose tool-result channel is text-only: downgrade each media
 * tool result to a text output that announces the attachment, and inject one user
 * message carrying the images right after the containing run of tool messages (never
 * between tool messages of the same tool_calls group, which would break call/result
 * pairing on strict providers). Stateless: the client never sees this rewrite, so it is
 * re-derived identically on every request.
 */
export function injectMediaAsUserMessages (messages: ModelMessage[]): ModelMessage[] {
  const result: ModelMessage[] = []
  let pending: Array<{ type: 'text', text: string } | { type: 'image', image: string, mediaType: string }> = []

  const flush = () => {
    if (pending.length === 0) return
    result.push({
      role: 'user',
      content: [
        { type: 'text', text: '[Automatic message: image(s) returned by the preceding tool call(s), attached here because this model receives tool images as user content]' },
        ...pending
      ]
    })
    pending = []
  }

  for (const msg of messages) {
    if (msg.role !== 'tool' || !Array.isArray(msg.content)) {
      flush()
      result.push(msg)
      continue
    }
    let changed = false
    const content = msg.content.map(part => {
      if (part.type !== 'tool-result') return part
      const output = part.output as ToolResultOutput
      if (output?.type !== 'content') return part
      const images = output.value.filter(p => p.type === 'image-data')
      if (images.length === 0) return part
      changed = true
      pending.push({ type: 'text', text: `Image${images.length > 1 ? 's' : ''} returned by tool "${part.toolName}":` })
      for (const img of images) pending.push({ type: 'image', image: img.data, mediaType: img.mediaType })
      const texts = output.value.filter(p => p.type === 'text').map(p => p.text)
      const note = `[The tool returned ${images.length} image${images.length > 1 ? 's' : ''}, attached in the user message below]`
      return { ...part, output: { type: 'text' as const, value: texts.length ? `${texts.join('\n')}\n\n${note}` : note } }
    })
    result.push(changed ? { ...msg, content } as ModelMessage : msg)
  }
  flush()
  return result
}

/** Convert OpenAI messages (including tool_calls and tool role) to AI SDK ModelMessage[] */
export function convertOpenAIMessages (messages: OpenAIMessage[]): ModelMessage[] {
  const result: ModelMessage[] = []
  const toolCallNames: Record<string, string> = {}

  for (const msg of messages) {
    if (msg.role === 'system') {
      continue
    } else if (msg.role === 'user') {
      result.push({ role: 'user', content: msg.content || '' })
    } else if (msg.role === 'assistant') {
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        const content: Array<{ type: 'text', text: string } | { type: 'tool-call', toolCallId: string, toolName: string, input: unknown }> = []
        if (msg.content) {
          content.push({ type: 'text', text: msg.content })
        }
        for (const tc of msg.tool_calls) {
          let parsedInput: unknown
          try {
            parsedInput = typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : tc.function.arguments
          } catch {
            parsedInput = {}
          }
          toolCallNames[tc.id] = tc.function.name
          content.push({
            type: 'tool-call',
            toolCallId: tc.id,
            toolName: tc.function.name,
            input: parsedInput
          })
        }
        result.push({ role: 'assistant', content })
      } else {
        result.push({ role: 'assistant', content: msg.content || '' })
      }
    } else if (msg.role === 'tool') {
      const toolName = toolCallNames[msg.tool_call_id || ''] || 'unknown'
      // Type the tool output faithfully: a result that parses as JSON is sent as `json`,
      // anything else (plain text, or a tool that failed to produce JSON) is sent as
      // `text` rather than mislabeled as `json`. Mislabeling lies to the model about the
      // shape of the data and makes a JSON round-trip wrap plain strings in quotes.
      // A media envelope (a tool that returned MCP image parts, serialized to JSON by
      // the client — see ui/src/utils/tool-result.ts) becomes real image parts again.
      let output: ToolResultOutput
      if (typeof msg.content === 'string') {
        try {
          const parsed = JSON.parse(msg.content)
          output = isMediaEnvelope(parsed) ? mediaEnvelopeToContentOutput(parsed) : { type: 'json', value: parsed }
        } catch {
          output = { type: 'text', value: msg.content }
        }
      } else {
        output = { type: 'json', value: msg.content }
      }
      result.push({
        role: 'tool',
        content: [{
          type: 'tool-result',
          toolCallId: msg.tool_call_id || '',
          toolName,
          output
        }]
      } as ModelMessage)
    }
  }
  return result
}

/** Map OpenAI toolChoice to AI SDK format */
export function convertToolChoice (toolChoice: OpenAIToolChoice | undefined) {
  if (!toolChoice) return undefined
  if (toolChoice === 'none') return 'none' as const
  if (toolChoice === 'auto') return 'auto' as const
  if (toolChoice === 'required') return 'required' as const
  if (typeof toolChoice === 'object' && toolChoice.type === 'function') {
    return { type: 'tool' as const, toolName: toolChoice.function.name }
  }
  return undefined
}
