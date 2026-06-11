import { Router } from 'express'
import { generateText } from 'ai'
import { type AccountKeys, reqSession, isAuthenticated } from '@data-fair/lib-express'
import { getRawSettings, defaultQuotas } from '../settings/service.ts'
import { createModel } from '../models/operations.ts'
import { recordUsage } from '../usage/service.ts'
import { computeCost } from '../usage/operations.ts'
import { resolveUsageIdentity, enforceQuotas } from '../usage/enforce.ts'
import { isStrikeCooldownActive, recordStrikeRefusal } from '../moderation/service.ts'
import { moderationApplies } from '../moderation/operations.ts'
import type { Settings } from '#types'

const router = Router()
export default router

interface SummaryRequest {
  prompt?: string
  content: string
}

function getSummaryPricing (settings: Settings) {
  const source = settings.models?.summarizer?.model ? settings.models.summarizer : settings.models?.assistant
  return {
    modelConfig: source?.model,
    inputPricePerMillion: source?.inputPricePerMillion ?? 0,
    outputPricePerMillion: source?.outputPricePerMillion ?? 0
  }
}

async function getSummaryModel (settings: Settings) {
  const { modelConfig } = getSummaryPricing(settings)
  if (!modelConfig) throw new Error('No model configured')

  const provider = settings.providers.find(p => p.id === modelConfig.provider.id)
  if (!provider) throw new Error('Provider not found')
  if (!provider.enabled) throw new Error('Provider is disabled')

  return createModel(provider, modelConfig.id)
}

router.post('/:type/:id', async (req, res, next) => {
  try {
    const sessionState = reqSession(req)
    const authenticated = isAuthenticated(sessionState)
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

    // Permission check + quota enforcement (shared with the gateway)
    const quotas = settings.quotas ?? defaultQuotas

    const identity = await resolveUsageIdentity(req, owner, quotas, sessionState, authenticated)
    const { usageUserId, usageUserName, poolId } = identity

    const quotaCheck = await enforceQuotas(owner, quotas, identity)
    if (quotaCheck) {
      res.status(429).json({ error: quotaCheck.reason })
      return
    }

    // Moderation posture for untrusted callers: a strike cooldown blocks summary
    // calls too, and the system prompt is pinned server-side (a caller-supplied
    // prompt would be an unmoderated jailbreak vector).
    if (moderationApplies(settings, identity.role) && identity.usageUserId && await isStrikeCooldownActive(owner, identity.usageUserId)) {
      recordStrikeRefusal(owner, identity, 'summarizer')
      res.status(403).json({ error: 'Temporarily blocked by moderation' })
      return
    }

    const model = await getSummaryModel(settings)
    const { inputPricePerMillion, outputPricePerMillion } = getSummaryPricing(settings)
    const system = (!identity.isUntrusted && body.prompt) || 'Summarize the following content concisely:'

    const { text, usage } = await generateText({
      model,
      system,
      messages: [{ role: 'user' as const, content: body.content }]
    })

    // Record usage after completion (money cost)
    const inputTokens = usage?.inputTokens ?? 0
    const outputTokens = usage?.outputTokens ?? 0
    const cost = computeCost(inputTokens, outputTokens, inputPricePerMillion, outputPricePerMillion)
    if (cost > 0) {
      await recordUsage(owner, cost, usageUserId, usageUserName, poolId)
    }

    res.json({ summary: text })
  } catch (err) {
    next(err)
  }
})
