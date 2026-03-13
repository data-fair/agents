import { Router } from 'express'
import { generateText, streamText } from 'ai'
import { reqSessionAuthenticated } from '@data-fair/lib-express'
import { getRawSettings } from '../settings/service.ts'
import { createModel } from '../models/operations.ts'
import type { Settings } from '#types'
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

// OpenAI-compatible chat completions endpoint
router.post('/v1/chat/completions', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = session.account

    const { model: modelId, messages, stream, temperature, max_tokens: maxTokens, top_p: topP, stop } = req.body

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
    const nonSystemMessages = messages.filter((m: any) => m.role !== 'system')
    const system = systemMessages.length > 0 ? systemMessages.map((m: any) => m.content).join('\n') : undefined

    const completionId = `chatcmpl-${crypto.randomUUID()}`
    const created = Math.floor(Date.now() / 1000)

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const result = await streamText({
        model,
        system,
        messages: nonSystemMessages,
        temperature,
        maxOutputTokens: maxTokens,
        topP,
        stopSequences: stop
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
        messages: nonSystemMessages,
        temperature,
        maxOutputTokens: maxTokens,
        topP,
        stopSequences: stop
      })

      res.json({
        id: completionId,
        object: 'chat.completion',
        created,
        model: modelId,
        choices: [{
          index: 0,
          message: { role: 'assistant', content: result.text },
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
