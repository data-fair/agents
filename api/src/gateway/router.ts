import { Router } from 'express'
import { generateText, streamText, tool, jsonSchema } from 'ai'
import { reqSessionAuthenticated } from '@data-fair/lib-express'
import { getRawSettings } from '../settings/service.ts'
import { createModel } from '../models/operations.ts'
import type { Settings } from '#types'
import type { Tool, ModelMessage } from 'ai'
import crypto from 'node:crypto'

const router = Router()
export default router

const MODEL_IDS = ['assistant', 'evaluator', 'summarizer'] as const
type ModelId = typeof MODEL_IDS[number]

function isValidModelId (id: string): id is ModelId {
  return MODEL_IDS.includes(id as ModelId)
}

async function getModelForGateway (settings: Settings, modelId: ModelId) {
  let modelConfig
  switch (modelId) {
    case 'assistant':
      modelConfig = settings.chatModel
      break
    case 'evaluator':
      modelConfig = settings.evaluatorModel || settings.chatModel
      break
    case 'summarizer':
      modelConfig = settings.summaryModel || settings.chatModel
      break
  }

  if (!modelConfig) throw new Error(`No model configured for ${modelId}`)

  const provider = settings.providers.find(p => p.id === modelConfig.provider.id)
  if (!provider) throw new Error('Provider not found')
  if (!provider.enabled) throw new Error('Provider is disabled')

  return createModel(provider, modelConfig.id)
}

type FinishReason = 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'

function mapFinishReason (reason: FinishReason): string {
  if (reason === 'tool-calls') return 'tool_calls'
  if (reason === 'content-filter') return 'content_filter'
  return reason
}

/** Convert OpenAI tool definitions to AI SDK tools (without execute) */
function convertOpenAITools (openaiTools: any[]): Record<string, Tool> {
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
function convertOpenAIMessages (messages: any[]): ModelMessage[] {
  const result: ModelMessage[] = []
  // Track tool call names for tool-result messages
  const toolCallNames: Record<string, string> = {}

  for (const msg of messages) {
    if (msg.role === 'system') {
      // system messages are handled separately
      continue
    } else if (msg.role === 'user') {
      result.push({ role: 'user', content: msg.content })
    } else if (msg.role === 'assistant') {
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        // Assistant message with tool calls
        const content: any[] = []
        if (msg.content) {
          content.push({ type: 'text', text: msg.content })
        }
        for (const tc of msg.tool_calls) {
          const parsedInput = typeof tc.function.arguments === 'string'
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments
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
      // Tool result message
      const toolName = toolCallNames[msg.tool_call_id] || 'unknown'
      let outputValue: any
      try {
        outputValue = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content
      } catch {
        outputValue = msg.content
      }
      result.push({
        role: 'tool',
        content: [{
          type: 'tool-result',
          toolCallId: msg.tool_call_id,
          toolName,
          output: { type: 'json', value: outputValue }
        }]
      } as any)
    }
  }
  return result
}

/** Map AI SDK toolChoice string to the format expected */
function convertToolChoice (toolChoice: any) {
  if (!toolChoice) return undefined
  if (toolChoice === 'none') return 'none' as const
  if (toolChoice === 'auto') return 'auto' as const
  if (toolChoice === 'required') return 'required' as const
  if (typeof toolChoice === 'object' && toolChoice.type === 'function') {
    return { type: 'tool' as const, toolName: toolChoice.function.name }
  }
  return undefined
}

// OpenAI-compatible chat completions endpoint
router.post('/v1/chat/completions', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = session.account

    const {
      model: modelId, messages, stream, temperature,
      max_tokens: maxTokens, top_p: topP, stop,
      tools: openaiTools, tool_choice: toolChoice
    } = req.body

    if (!modelId || !isValidModelId(modelId)) {
      res.status(400).json({
        error: { message: `Invalid model. Must be one of: ${MODEL_IDS.join(', ')}`, type: 'invalid_request_error' }
      })
      return
    }

    const settings = await getRawSettings(owner)
    if (!settings?.chatModel) {
      res.status(404).json({
        error: { message: 'Chat model not configured', type: 'invalid_request_error' }
      })
      return
    }

    const model = await getModelForGateway(settings, modelId)

    // Extract system message from OpenAI messages array
    const systemMessages = messages.filter((m: any) => m.role === 'system')
    const system = systemMessages.length > 0 ? systemMessages.map((m: any) => m.content).join('\n') : undefined

    // Convert messages and tools
    const aiMessages = convertOpenAIMessages(messages)
    const tools = convertOpenAITools(openaiTools)
    const hasTools = Object.keys(tools).length > 0

    const completionId = `chatcmpl-${crypto.randomUUID()}`
    const created = Math.floor(Date.now() / 1000)

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const result = await streamText({
        model,
        system,
        messages: aiMessages,
        temperature,
        maxOutputTokens: maxTokens,
        topP,
        stopSequences: stop,
        ...(hasTools ? { tools, toolChoice: convertToolChoice(toolChoice) } : {})
      })

      // Send initial chunk with role
      res.write(`data: ${JSON.stringify({
        id: completionId,
        object: 'chat.completion.chunk',
        created,
        model: modelId,
        choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }]
      })}\n\n`)

      for await (const part of result.fullStream) {
        if (part.type === 'text-delta') {
          res.write(`data: ${JSON.stringify({
            id: completionId,
            object: 'chat.completion.chunk',
            created,
            model: modelId,
            choices: [{ index: 0, delta: { content: part.text }, finish_reason: null }]
          })}\n\n`)
        } else if (part.type === 'tool-input-start') {
          res.write(`data: ${JSON.stringify({
            id: completionId,
            object: 'chat.completion.chunk',
            created,
            model: modelId,
            choices: [{
              index: 0,
              delta: {
                tool_calls: [{
                  index: 0,
                  id: part.id,
                  type: 'function',
                  function: { name: part.toolName, arguments: '' }
                }]
              },
              finish_reason: null
            }]
          })}\n\n`)
        } else if (part.type === 'tool-input-delta') {
          res.write(`data: ${JSON.stringify({
            id: completionId,
            object: 'chat.completion.chunk',
            created,
            model: modelId,
            choices: [{
              index: 0,
              delta: {
                tool_calls: [{
                  index: 0,
                  function: { arguments: part.delta }
                }]
              },
              finish_reason: null
            }]
          })}\n\n`)
        } else if (part.type === 'finish') {
          res.write(`data: ${JSON.stringify({
            id: completionId,
            object: 'chat.completion.chunk',
            created,
            model: modelId,
            choices: [{ index: 0, delta: {}, finish_reason: mapFinishReason(part.finishReason) }],
            usage: part.totalUsage
              ? {
                  prompt_tokens: part.totalUsage.inputTokens ?? 0,
                  completion_tokens: part.totalUsage.outputTokens ?? 0,
                  total_tokens: (part.totalUsage.inputTokens ?? 0) + (part.totalUsage.outputTokens ?? 0)
                }
              : undefined
          })}\n\n`)
        }
      }

      res.write('data: [DONE]\n\n')
      res.end()
    } else {
      const result = await generateText({
        model,
        system,
        messages: aiMessages,
        temperature,
        maxOutputTokens: maxTokens,
        topP,
        stopSequences: stop,
        ...(hasTools ? { tools, toolChoice: convertToolChoice(toolChoice) } : {})
      })

      // Build response message
      const responseMessage: any = { role: 'assistant', content: result.text || null }

      // Include tool calls if present
      if (result.toolCalls && result.toolCalls.length > 0) {
        responseMessage.tool_calls = result.toolCalls.map((tc: any) => ({
          id: tc.toolCallId,
          type: 'function',
          function: {
            name: tc.toolName,
            arguments: JSON.stringify(tc.args ?? {})
          }
        }))
      }

      res.json({
        id: completionId,
        object: 'chat.completion',
        created,
        model: modelId,
        choices: [{
          index: 0,
          message: responseMessage,
          finish_reason: mapFinishReason(result.finishReason)
        }],
        usage: {
          prompt_tokens: result.usage?.inputTokens ?? 0,
          completion_tokens: result.usage?.outputTokens ?? 0,
          total_tokens: (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0)
        }
      })
    }
  } catch (err) {
    next(err)
  }
})
