import { Router } from 'express'
import { generateText } from 'ai'
import { type AccountKeys, reqSessionAuthenticated } from '@data-fair/lib-express'
import { assertCanUseModel } from '../auth.ts'
import { getRawSettings } from '../settings/service.ts'
import { createModel } from '../models/operations.ts'
import { getUsage, getOwnerUsage, recordUsage, checkQuota } from '../usage/service.ts'
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

router.post('/:type/:id', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = req.params as unknown as AccountKeys

    const body = req.body as SummaryRequest
    if (!body.content) {
      res.status(400).json({ error: 'content is required' })
      return
    }

    const settings = await getRawSettings(owner)
    if (!settings?.models?.assistant?.model) {
      res.status(404).json({ error: 'Agent not configured' })
      return
    }

    // Permission check — use summarizer entry if it exists, fall back to assistant
    const modelEntry = settings.models.summarizer || settings.models.assistant
    assertCanUseModel(session, owner, modelEntry)

    // Quota enforcement (same pattern as gateway)
    const isSameAccount = session.account.type === owner.type && session.account.id === owner.id
    const trackPerUser = owner.type === 'organization' || !isSameAccount
    const accountLimits = settings.limits
    const userLimits = trackPerUser ? settings.userLimits : undefined

    if (accountLimits.dailyTokenLimit || accountLimits.monthlyTokenLimit) {
      const accountUsage = trackPerUser ? await getOwnerUsage(owner) : await getUsage(owner)
      const quotaCheck = checkQuota(accountUsage, accountLimits, trackPerUser ? 'organization' : 'user')
      if (quotaCheck) {
        res.status(429).json({ error: quotaCheck.reason })
        return
      }
    }

    if (trackPerUser && (userLimits?.dailyTokenLimit || userLimits?.monthlyTokenLimit)) {
      const userUsage = await getUsage(owner, session.user.id)
      const quotaCheck = checkQuota(userUsage, userLimits, 'user')
      if (quotaCheck) {
        res.status(429).json({ error: quotaCheck.reason })
        return
      }
    }

    const model = await getSummaryModel(settings)
    const system = body.prompt || 'Summarize the following content concisely:'

    const { text, usage } = await generateText({
      model,
      system,
      messages: [{ role: 'user' as const, content: body.content }]
    })

    // Record usage after completion
    const inputTokens = usage?.inputTokens ?? 0
    const outputTokens = usage?.outputTokens ?? 0
    if (inputTokens || outputTokens) {
      await recordUsage(owner, inputTokens, outputTokens, trackPerUser ? session.user.id : undefined)
    }

    res.json({ summary: text })
  } catch (err) {
    next(err)
  }
})
