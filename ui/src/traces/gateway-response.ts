/**
 * Pure parser for the agents gateway's OpenAI-compatible responses.
 * Handles both the streaming SSE form (chat.completion.chunk events) and the
 * non-streaming JSON form (a single chat.completion object). Never throws.
 */

export interface GatewayResult {
  content: string
  toolCalls: { id: string; name: string; arguments: string }[]
  finishReason?: string
}

export interface GatewayUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

export function parseGatewayCompletion (raw: string): { result: GatewayResult; usage: GatewayUsage } {
  return raw.trimStart().startsWith('data:') ? parseSSE(raw) : parseJson(raw)
}

function parseSSE (raw: string): { result: GatewayResult; usage: GatewayUsage } {
  let content = ''
  const toolCalls: { id: string; name: string; arguments: string }[] = []
  let finishReason: string | undefined
  let inputTokens = 0
  let outputTokens = 0
  let cacheReadTokens = 0
  let cacheWriteTokens = 0

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) continue
    const data = trimmed.slice(5).trim()
    if (!data || data === '[DONE]') continue
    let chunk: any
    try { chunk = JSON.parse(data) } catch { continue }

    const choice = chunk.choices?.[0]
    const delta = choice?.delta
    if (typeof delta?.content === 'string') content += delta.content
    if (Array.isArray(delta?.tool_calls)) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0
        if (!toolCalls[idx]) toolCalls[idx] = { id: '', name: '', arguments: '' }
        if (tc.id) toolCalls[idx].id = tc.id
        if (tc.function?.name) toolCalls[idx].name = tc.function.name
        if (typeof tc.function?.arguments === 'string') toolCalls[idx].arguments += tc.function.arguments
      }
    }
    if (choice?.finish_reason) finishReason = choice.finish_reason
    if (chunk.usage) {
      inputTokens = chunk.usage.prompt_tokens ?? 0
      outputTokens = chunk.usage.completion_tokens ?? 0
      cacheReadTokens = chunk.usage.prompt_tokens_details?.cached_tokens ?? 0
      cacheWriteTokens = chunk.usage.prompt_tokens_details?.cache_creation_tokens ?? 0
    }
  }

  return { result: { content, toolCalls: toolCalls.filter(Boolean), finishReason }, usage: { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens } }
}

function parseJson (raw: string): { result: GatewayResult; usage: GatewayUsage } {
  let obj: any
  try { obj = JSON.parse(raw) } catch {
    return { result: { content: '', toolCalls: [], finishReason: undefined }, usage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 } }
  }
  const choice = obj.choices?.[0]
  const msg = choice?.message ?? {}
  const toolCalls = Array.isArray(msg.tool_calls)
    ? msg.tool_calls.map((tc: any) => ({ id: tc.id ?? '', name: tc.function?.name ?? '', arguments: tc.function?.arguments ?? '' }))
    : []
  return {
    result: { content: msg.content ?? '', toolCalls, finishReason: choice?.finish_reason },
    usage: {
      inputTokens: obj.usage?.prompt_tokens ?? 0,
      outputTokens: obj.usage?.completion_tokens ?? 0,
      cacheReadTokens: obj.usage?.prompt_tokens_details?.cached_tokens ?? 0,
      cacheWriteTokens: obj.usage?.prompt_tokens_details?.cache_creation_tokens ?? 0
    }
  }
}
