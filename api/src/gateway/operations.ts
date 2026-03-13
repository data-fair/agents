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
      let outputValue: unknown
      try {
        outputValue = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content
      } catch {
        outputValue = msg.content
      }
      result.push({
        role: 'tool',
        content: [{
          type: 'tool-result',
          toolCallId: msg.tool_call_id || '',
          toolName,
          output: { type: 'json', value: outputValue }
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
