import { Router } from 'express'
import { generateText } from 'ai'
import { assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import { getRawSettings } from '../settings/service.ts'
import { createModel } from '../models/operations.ts'
import type { Settings } from '#types'

const router = Router()
export default router

interface SummaryRequest {
  prompt?: string
  content: string
}

async function getSummaryModel (settings: Settings) {
  const modelConfig = settings.models.summarizer?.model || settings.models.assistant?.model
  if (!modelConfig) throw new Error('No model configured')

  const provider = settings.providers.find(p => p.id === modelConfig.provider.id)
  if (!provider) throw new Error('Provider not found')
  if (!provider.enabled) throw new Error('Provider is disabled')

  return createModel(provider, modelConfig.id)
}

router.post('/', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = session.account
    assertAccountRole(session, owner, 'admin')

    const body = req.body as SummaryRequest

    if (!body.content) {
      res.status(400).json({ error: 'content is required' })
      return
    }

    const settings = await getRawSettings(owner)
    if (!settings?.models?.assistant?.model) {
      res.status(404).json({ error: 'Assistant model not configured' })
      return
    }

    const model = await getSummaryModel(settings)

    const system = body.prompt || 'Summarize the following content concisely:'

    const { text } = await generateText({
      model,
      system,
      messages: [{ role: 'user' as const, content: body.content }]
    })

    res.json({ summary: text })
  } catch (err) {
    next(err)
  }
})
