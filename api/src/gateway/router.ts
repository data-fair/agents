import { Router } from 'express'
import { generateText, streamText, type LanguageModelUsage } from 'ai'
import { type AccountKeys, reqSession, isAuthenticated } from '@data-fair/lib-express'
import { getRawSettings, defaultQuotas } from '../settings/service.ts'
import { createModel } from '../models/operations.ts'
import { recordUsage } from '../usage/service.ts'
import { computeCost } from '../usage/operations.ts'
import { resolveUsageIdentity, enforceQuotas } from '../usage/enforce.ts'
import { convertOpenAITools, convertOpenAIMessages, convertToolChoice, mapFinishReason } from './operations.ts'
import type { Settings } from '#types'
import type { OpenAIMessage, OpenAIToolDefinition, OpenAIToolChoice, FinishReason } from './operations.ts'
import { recordTraceRequest } from '../traces/service.ts'
import crypto from 'node:crypto'

// Build an OpenAI-compatible usage object, surfacing cache token details when the
// provider reports them (Anthropic cache read/write, OpenAI cached_tokens, etc.).
// The AI SDK normalizes these into usage.inputTokenDetails regardless of provider,
// so the gateway can forward them uniformly for the debug trace.
function buildUsage (usage: LanguageModelUsage | undefined) {
  if (!usage) return undefined
  const promptTokens = usage.inputTokens ?? 0
  const completionTokens = usage.outputTokens ?? 0
  const cacheRead = usage.inputTokenDetails?.cacheReadTokens
  const cacheWrite = usage.inputTokenDetails?.cacheWriteTokens
  const result: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    prompt_tokens_details?: { cached_tokens: number, cache_creation_tokens: number }
  } = {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens
  }
  if (cacheRead != null || cacheWrite != null) {
    result.prompt_tokens_details = { cached_tokens: cacheRead ?? 0, cache_creation_tokens: cacheWrite ?? 0 }
  }
  return result
}

const router = Router()
export default router

const MODEL_IDS = ['assistant', 'evaluator', 'summarizer', 'tools', 'moderator'] as const
type ModelId = typeof MODEL_IDS[number]

function isValidModelId (id: string): id is ModelId {
  return MODEL_IDS.includes(id as ModelId)
}

function getModelConfig (settings: Settings, modelId: ModelId) {
  // moderator prefers a cheap dedicated model, then the summarizer, then the
  // assistant as a guaranteed last resort; every other role falls back straight
  // to the assistant.
  const chain = modelId === 'moderator'
    ? [settings.models?.moderator, settings.models?.summarizer, settings.models?.assistant]
    : [settings.models?.[modelId], settings.models?.assistant]
  const source = chain.find(entry => entry?.model)
  if (!source?.model) throw new Error(`No model configured for ${modelId}`)
  return {
    modelConfig: source.model,
    inputPricePerMillion: source.inputPricePerMillion ?? 0,
    outputPricePerMillion: source.outputPricePerMillion ?? 0
  }
}

async function getModelForGateway (settings: Settings, modelId: ModelId) {
  const { modelConfig } = getModelConfig(settings, modelId)

  const provider = settings.providers.find(p => p.id === modelConfig.provider.id)
  if (!provider) throw new Error('Provider not found')
  if (!provider.enabled) throw new Error('Provider is disabled')

  return createModel(provider, modelConfig.id)
}

// OpenAI-compatible chat completions endpoint
router.post('/:type/:id/v1/chat/completions', async (req, res, next) => {
  try {
    const sessionState = reqSession(req)
    const authenticated = isAuthenticated(sessionState)
    const owner = req.params as unknown as AccountKeys

    const {
      model: modelId,
      messages,
      stream,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stop,
      tools: openaiTools,
      tool_choice: toolChoice
    } = req.body as {
      model: string
      messages: OpenAIMessage[]
      stream?: boolean
      temperature?: number
      max_tokens?: number
      top_p?: number
      stop?: string[]
      tools?: OpenAIToolDefinition[]
      tool_choice?: OpenAIToolChoice
    }

    if (!modelId || !isValidModelId(modelId)) {
      res.status(400).json({
        error: { message: `Invalid model. Must be one of: ${MODEL_IDS.join(', ')}`, type: 'invalid_request_error' }
      })
      return
    }

    const settings = await getRawSettings(owner)
    if (!settings?.models?.assistant?.model) {
      res.status(404).json({
        error: { message: 'Agent not configured', type: 'invalid_request_error' }
      })
      return
    }

    const quotas = settings.quotas ?? defaultQuotas

    const identity = await resolveUsageIdentity(req, owner, quotas, sessionState, authenticated)
    const { usageUserId, usageUserName, poolId } = identity

    const quotaCheck = await enforceQuotas(owner, quotas, identity)
    if (quotaCheck) {
      res.status(429).json({
        error: {
          message: quotaCheck.reason,
          type: 'rate_limit_error',
          scope: quotaCheck.scope,
          usage: quotaCheck.usage,
          limit: quotaCheck.limit,
          resets_at: quotaCheck.resetsAt
        }
      })
      return
    }

    const { modelConfig, inputPricePerMillion, outputPricePerMillion } = getModelConfig(settings, modelId)
    const model = await getModelForGateway(settings, modelId)

    const storeTraces = settings.storeTraces === true
    if (storeTraces) res.setHeader('x-trace-storage', 'available')
    const consented = req.get('x-trace-consent') === 'yes'
    const shouldStoreTrace = storeTraces && consented
    const traceConversationId = req.get('x-trace-conversation') || undefined
    const traceContextId = req.get('x-trace-ctx') || 'unknown'
    const traceStart = Date.now()
    const recordTrace = (response: { content: string, toolCalls: { id: string, name: string, arguments: string }[], finishReason?: string }, usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }, timeToFirstChunkMs?: number) => {
      if (!shouldStoreTrace || !traceConversationId) return
      recordTraceRequest({
        owner,
        userId: usageUserId,
        userName: usageUserName,
        conversationId: traceConversationId,
        contextId: traceContextId,
        modelRole: modelId,
        providerName: modelConfig.provider.name,
        providerType: modelConfig.provider.type,
        resolvedModel: modelConfig.id,
        body: req.body,
        response,
        usage,
        timing: { durationMs: Date.now() - traceStart, ...(timeToFirstChunkMs != null ? { timeToFirstChunkMs } : {}) }
      })
    }

    // Extract system message from OpenAI messages array
    const systemMessages = messages.filter(m => m.role === 'system')
    const system = systemMessages.length > 0 ? systemMessages.map(m => m.content).join('\n') : undefined

    // Convert messages and tools
    const aiMessages = convertOpenAIMessages(messages)
    const tools = openaiTools ? convertOpenAITools(openaiTools) : {}
    const hasTools = Object.keys(tools).length > 0

    const completionId = `chatcmpl-${crypto.randomUUID()}`
    const created = Math.floor(Date.now() / 1000)

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')

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

      // Parallel tool calls are distinguished in the OpenAI streaming wire format only by
      // their `index`. Assign a stable incrementing index per tool call id so the client
      // does not collapse several calls into a single index-0 slot.
      const toolCallIndexes = new Map<string, number>()

      try {
        let streamedText = ''
        let ttfc: number | undefined
        const streamedToolCalls = new Map<string, { id: string, name: string, arguments: string }>()
        for await (const part of result.fullStream) {
          if (part.type === 'text-delta') {
            streamedText += part.text
            if (ttfc === undefined) ttfc = Date.now() - traceStart
            res.write(`data: ${JSON.stringify({
              id: completionId,
              object: 'chat.completion.chunk',
              created,
              model: modelId,
              choices: [{ index: 0, delta: { content: part.text }, finish_reason: null }]
            })}\n\n`)
          } else if (part.type === 'tool-input-start') {
            const toolCallIndex = toolCallIndexes.size
            toolCallIndexes.set(part.id, toolCallIndex)
            streamedToolCalls.set(part.id, { id: part.id, name: part.toolName, arguments: '' })
            res.write(`data: ${JSON.stringify({
              id: completionId,
              object: 'chat.completion.chunk',
              created,
              model: modelId,
              choices: [{
                index: 0,
                delta: {
                  tool_calls: [{
                    index: toolCallIndex,
                    id: part.id,
                    type: 'function',
                    function: { name: part.toolName, arguments: '' }
                  }]
                },
                finish_reason: null
              }]
            })}\n\n`)
          } else if (part.type === 'tool-input-delta') {
            const toolCallIndex = toolCallIndexes.get(part.id) ?? 0
            const entry = streamedToolCalls.get(part.id)
            if (entry) entry.arguments += part.delta
            res.write(`data: ${JSON.stringify({
              id: completionId,
              object: 'chat.completion.chunk',
              created,
              model: modelId,
              choices: [{
                index: 0,
                delta: {
                  tool_calls: [{
                    index: toolCallIndex,
                    function: { arguments: part.delta }
                  }]
                },
                finish_reason: null
              }]
            })}\n\n`)
          } else if (part.type === 'finish') {
            // Record usage for streaming responses (money cost)
            const inputTokens = part.totalUsage?.inputTokens ?? 0
            const outputTokens = part.totalUsage?.outputTokens ?? 0
            const cost = computeCost(inputTokens, outputTokens, inputPricePerMillion, outputPricePerMillion)
            if (cost > 0) {
              await recordUsage(owner, cost, usageUserId, usageUserName, poolId)
            }

            res.write(`data: ${JSON.stringify({
              id: completionId,
              object: 'chat.completion.chunk',
              created,
              model: modelId,
              choices: [{ index: 0, delta: {}, finish_reason: mapFinishReason(part.finishReason as FinishReason) }],
              usage: buildUsage(part.totalUsage)
            })}\n\n`)

            recordTrace(
              { content: streamedText, toolCalls: [...streamedToolCalls.values()], finishReason: mapFinishReason(part.finishReason as FinishReason) },
              { inputTokens, outputTokens, cacheReadTokens: part.totalUsage?.inputTokenDetails?.cacheReadTokens, cacheWriteTokens: part.totalUsage?.inputTokenDetails?.cacheWriteTokens },
              ttfc
            )
          }
        }

        res.write('data: [DONE]\n\n')
        res.end()
      } catch (streamErr: any) {
        const message = streamErr?.message || 'Stream error'
        res.write(`data: ${JSON.stringify({
          error: { message, type: 'server_error', code: null }
        })}\n\n`)
        res.write('data: [DONE]\n\n')
        res.end()
      }
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

      // Record usage (money cost)
      const inputTokens = result.usage?.inputTokens ?? 0
      const outputTokens = result.usage?.outputTokens ?? 0
      const cost = computeCost(inputTokens, outputTokens, inputPricePerMillion, outputPricePerMillion)
      if (cost > 0) {
        await recordUsage(owner, cost, usageUserId, usageUserName, poolId)
      }

      // Build response message
      const responseMessage: { role: string, content: string | null, tool_calls?: Array<{ id: string, type: string, function: { name: string, arguments: string } }> } = {
        role: 'assistant',
        content: result.text || null
      }

      // Include tool calls if present
      if (result.toolCalls && result.toolCalls.length > 0) {
        responseMessage.tool_calls = result.toolCalls.map((tc: { toolCallId: string, toolName: string, input?: unknown }) => ({
          id: tc.toolCallId,
          type: 'function',
          function: {
            name: tc.toolName,
            arguments: JSON.stringify(tc.input ?? {})
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
          finish_reason: mapFinishReason(result.finishReason as FinishReason)
        }],
        usage: buildUsage(result.usage)
      })

      recordTrace(
        {
          content: result.text || '',
          toolCalls: (result.toolCalls ?? []).map((tc: { toolCallId: string, toolName: string, input?: unknown }) => ({ id: tc.toolCallId, name: tc.toolName, arguments: JSON.stringify(tc.input ?? {}) })),
          finishReason: mapFinishReason(result.finishReason as FinishReason)
        },
        { inputTokens, outputTokens, cacheReadTokens: result.usage?.inputTokenDetails?.cacheReadTokens, cacheWriteTokens: result.usage?.inputTokenDetails?.cacheWriteTokens }
      )
    }
  } catch (err) {
    next(err)
  }
})
