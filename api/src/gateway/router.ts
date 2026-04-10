import { Router } from 'express'
import { generateText, streamText } from 'ai'
import { type AccountKeys, reqSession, isAuthenticated } from '@data-fair/lib-express'
import { reqIp as _reqIp } from '@data-fair/lib-express/req-origin.js'
import { assertCanUseModel, assertRoleQuota, getEffectiveRole } from '../auth.ts'
import { getRawSettings } from '../settings/service.ts'
import { createModel } from '../models/operations.ts'
import { getUsage, getOwnerUsage, recordUsage, checkQuota } from '../usage/service.ts'
import { convertOpenAITools, convertOpenAIMessages, convertToolChoice, mapFinishReason } from './operations.ts'
import type { Settings } from '#types'
import type { OpenAIMessage, OpenAIToolDefinition, OpenAIToolChoice, FinishReason } from './operations.ts'
import crypto from 'node:crypto'

function safeReqIp (req: import('express').Request): string {
  try { return _reqIp(req) } catch { return req.ip || '127.0.0.1' }
}

const router = Router()
export default router

const MODEL_IDS = ['assistant', 'evaluator', 'summarizer', 'tools'] as const
type ModelId = typeof MODEL_IDS[number]

function isValidModelId (id: string): id is ModelId {
  return MODEL_IDS.includes(id as ModelId)
}

function getModelConfig (settings: Settings, modelId: ModelId) {
  const modelEntry = settings.models[modelId]
  const modelConfig = modelEntry?.model || settings.models.assistant?.model
  if (!modelConfig) throw new Error(`No model configured for ${modelId}`)
  return { modelConfig, ratio: modelEntry?.ratio ?? settings.models.assistant?.ratio ?? 1 }
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

    const quotas = settings.quotas ?? {}

    let trackPerUser: boolean
    let usageUserId: string | undefined

    if (!authenticated) {
      // Anonymous path
      assertRoleQuota('anonymous', quotas)
      const ipHash = crypto.createHash('sha256').update(safeReqIp(req)).digest('hex').slice(0, 16)
      usageUserId = `anon:${ipHash}`
      trackPerUser = true
    } else {
      // Authenticated path
      const session = sessionState
      const isSameAccount = session.account!.type === owner.type && session.account!.id === owner.id
      trackPerUser = owner.type === 'organization' || !isSameAccount

      // Permission check via role-based quotas
      assertCanUseModel(session as any, owner, quotas)
      usageUserId = trackPerUser ? session.user!.id : undefined
    }

    // Check account limits against account usage
    const accountLimits = settings.quotas.global

    if (!accountLimits.unlimited && (accountLimits.dailyTokenLimit || accountLimits.monthlyTokenLimit)) {
      const accountUsage = await getOwnerUsage(owner)
      const quotaCheck = checkQuota(accountUsage, accountLimits, trackPerUser ? 'organization' : 'user')
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
    }

    // Check role-based user quota
    if (trackPerUser) {
      const role = authenticated ? getEffectiveRole(sessionState as any, owner) : 'anonymous'
      const roleQuota = quotas[role]
      if (roleQuota && !roleQuota.unlimited && (roleQuota.dailyTokenLimit || roleQuota.monthlyTokenLimit)) {
        const userUsage = await getUsage(owner, usageUserId)
        const quotaCheck = checkQuota(userUsage, roleQuota, 'user')
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
      }
    }

    const { ratio } = getModelConfig(settings, modelId)
    const model = await getModelForGateway(settings, modelId)

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

      try {
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
            // Record usage for streaming responses (apply ratio for quota accounting)
            const inputTokens = Math.round((part.totalUsage?.inputTokens ?? 0) * ratio)
            const outputTokens = Math.round((part.totalUsage?.outputTokens ?? 0) * ratio)
            if (inputTokens || outputTokens) {
              await recordUsage(owner, inputTokens, outputTokens, usageUserId)
            }

            res.write(`data: ${JSON.stringify({
              id: completionId,
              object: 'chat.completion.chunk',
              created,
              model: modelId,
              choices: [{ index: 0, delta: {}, finish_reason: mapFinishReason(part.finishReason as FinishReason) }],
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

      // Record usage (apply ratio for quota accounting)
      const inputTokens = Math.round((result.usage?.inputTokens ?? 0) * ratio)
      const outputTokens = Math.round((result.usage?.outputTokens ?? 0) * ratio)
      if (inputTokens || outputTokens) {
        await recordUsage(owner, inputTokens, outputTokens, usageUserId)
      }

      // Build response message
      const responseMessage: { role: string, content: string | null, tool_calls?: Array<{ id: string, type: string, function: { name: string, arguments: string } }> } = {
        role: 'assistant',
        content: result.text || null
      }

      // Include tool calls if present
      if (result.toolCalls && result.toolCalls.length > 0) {
        responseMessage.tool_calls = result.toolCalls.map((tc: { toolCallId: string, toolName: string, args?: unknown }) => ({
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
          finish_reason: mapFinishReason(result.finishReason as FinishReason)
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
