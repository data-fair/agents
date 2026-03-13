import { Router } from 'express'
import { generateText, streamText } from 'ai'
import { reqSessionAuthenticated } from '@data-fair/lib-express'
import { getRawSettings } from '../settings/service.ts'
import { createModel } from '../models/operations.ts'
import { getUsage, recordUsage, checkQuota } from '../usage/service.ts'
import { convertOpenAITools, convertOpenAIMessages, convertToolChoice, mapFinishReason } from './operations.ts'
import type { Settings } from '#types'
import type { OpenAIMessage, OpenAIToolDefinition, OpenAIToolChoice, FinishReason } from './operations.ts'
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

function setUsageHeaders (res: import('express').Response, usage: Awaited<ReturnType<typeof getUsage>>, limits?: Settings['limits']) {
  res.setHeader('X-Token-Usage-Daily', usage.daily.totalTokens)
  res.setHeader('X-Token-Usage-Monthly', usage.monthly.totalTokens)
  if (limits?.dailyTokenLimit) res.setHeader('X-Token-Limit-Daily', limits.dailyTokenLimit)
  if (limits?.monthlyTokenLimit) res.setHeader('X-Token-Limit-Monthly', limits.monthlyTokenLimit)
}

// OpenAI-compatible chat completions endpoint
router.post('/v1/chat/completions', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = session.account

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
    if (!settings?.chatModel) {
      res.status(404).json({
        error: { message: 'Chat model not configured', type: 'invalid_request_error' }
      })
      return
    }

    // Two-level quota enforcement
    const isOrgContext = session.account.type === 'organization'
    const accountLimits = settings.limits
    let userLimits: Settings['limits'] | undefined

    if (isOrgContext) {
      const userSettings = await getRawSettings({ type: 'user', id: session.user.id })
      userLimits = userSettings?.limits
    }

    // Check account limits against account usage
    if (accountLimits.dailyTokenLimit || accountLimits.monthlyTokenLimit) {
      const accountUsage = await getUsage(owner)
      const quotaCheck = checkQuota(accountUsage, accountLimits, isOrgContext ? 'organization' : 'user')
      if (quotaCheck) {
        setUsageHeaders(res, accountUsage, accountLimits)
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

    // Check user limits against user's total personal usage
    if (isOrgContext && (userLimits?.dailyTokenLimit || userLimits?.monthlyTokenLimit)) {
      const userOwner = { type: 'user' as const, id: session.user.id }
      const userUsage = await getUsage(userOwner)
      const quotaCheck = checkQuota(userUsage, userLimits, 'user')
      if (quotaCheck) {
        setUsageHeaders(res, userUsage, userLimits)
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

      // Set usage headers before streaming starts (pre-request usage)
      if (accountLimits.dailyTokenLimit || accountLimits.monthlyTokenLimit) {
        const preUsage = await getUsage(owner)
        setUsageHeaders(res, preUsage, accountLimits)
      }

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
          // Record usage for streaming responses
          const inputTokens = part.totalUsage?.inputTokens ?? 0
          const outputTokens = part.totalUsage?.outputTokens ?? 0
          if (inputTokens || outputTokens) {
            const recordings = [recordUsage(owner, inputTokens, outputTokens)]
            if (isOrgContext) {
              recordings.push(recordUsage({ type: 'user', id: session.user.id }, inputTokens, outputTokens))
            }
            await Promise.all(recordings)
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

      // Record usage
      const inputTokens = result.usage?.inputTokens ?? 0
      const outputTokens = result.usage?.outputTokens ?? 0
      if (inputTokens || outputTokens) {
        const recordings = [recordUsage(owner, inputTokens, outputTokens)]
        if (isOrgContext) {
          recordings.push(recordUsage({ type: 'user', id: session.user.id }, inputTokens, outputTokens))
        }
        await Promise.all(recordings)
      }

      // Set usage headers
      if (accountLimits.dailyTokenLimit || accountLimits.monthlyTokenLimit) {
        const updatedUsage = await getUsage(owner)
        setUsageHeaders(res, updatedUsage, accountLimits)
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
