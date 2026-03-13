import { Router } from 'express'
import { generateText, streamText } from 'ai'
import { reqSessionAuthenticated } from '@data-fair/lib-express'
import { getRawSettings } from '../settings/service.ts'
import { createModel } from '../models/operations.ts'
import type { Settings } from '#types'

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

interface GenerateRequest {
  system?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  tools?: any
}

interface StreamRequest {
  system?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

router.post('/:modelId/generate', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = session.account
    const { modelId } = req.params

    if (!isValidModelId(modelId)) {
      res.status(400).json({ error: `Invalid modelId. Must be one of: ${MODEL_IDS.join(', ')}` })
      return
    }

    const settings = await getRawSettings(owner)
    if (!settings?.chatModel) {
      res.status(404).json({ error: 'Chat model not configured' })
      return
    }

    const model = await getModelForGateway(settings, modelId)
    const body = req.body as GenerateRequest

    const result = await generateText({
      model,
      system: body.system,
      messages: body.messages,
      tools: body.tools
    })

    res.json({
      text: result.text,
      finishReason: result.finishReason,
      usage: result.usage,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults
    })
  } catch (err) {
    next(err)
  }
})

router.post('/:modelId/stream', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = session.account
    const { modelId } = req.params

    if (!isValidModelId(modelId)) {
      res.status(400).json({ error: `Invalid modelId. Must be one of: ${MODEL_IDS.join(', ')}` })
      return
    }

    const settings = await getRawSettings(owner)
    if (!settings?.chatModel) {
      res.status(404).json({ error: 'Chat model not configured' })
      return
    }

    const model = await getModelForGateway(settings, modelId)

    const body = req.body as StreamRequest | undefined
    const system = body?.system
    const messages = body?.messages
    const prompt = typeof req.query.prompt === 'string' ? req.query.prompt : undefined

    if (!prompt && !messages) {
      res.status(400).json({ error: 'Either prompt query param or messages in body is required' })
      return
    }

    const result = prompt
      ? await streamText({ model, system, prompt })
      : await streamText({ model, system, messages: messages! })

    res.setHeader('Content-Type', 'text/event-stream')
    res.write('event: start\ndata:\n\n')
    for await (const chunk of result.fullStream) {
      res.write(`event: chunk\ndata: ${JSON.stringify(chunk)}\n\n`)
    }
    res.write('event: done\ndata:\n\n')
    res.end()
  } catch (err) {
    next(err)
  }
})
