import { Router } from 'express'
import { generateText } from 'ai'
import { type AccountKeys, reqSession, isAuthenticated } from '@data-fair/lib-express'
import config from '#config'
import { getSettings, defaultQuotas } from '../settings/service.ts'
import { resolveRoleModel, type ResolvedRoleModel } from '../models/service.ts'
import { recordUsage } from '../usage/service.ts'
import { computeCredits } from '../usage/operations.ts'
import { resolveUsageIdentity, enforceQuotas } from '../usage/enforce.ts'
import { isStrikeCooldownActive, recordStrikeRefusal } from '../moderation/service.ts'

const router = Router()
export default router

interface SummaryRequest {
  content: string
}

// The summarizer system prompt is always pinned server-side. The endpoint is
// publicly mounted and accepts arbitrary content; a caller-supplied system
// prompt would be a fully unmoderated injection vector. Callers that need
// specific instructions (e.g. the trace evaluator) frame them into `content`.
const SUMMARY_SYSTEM_PROMPT = 'Summarize the following content concisely:'

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

    const settings = await getSettings(owner)
    let resolved: ResolvedRoleModel
    try {
      resolved = resolveRoleModel(settings, 'summarizer')
    } catch {
      res.status(404).json({ error: 'Agent not configured' })
      return
    }
    const { model, entry } = resolved

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
    // calls too (the content is still unmoderated here).
    if (identity.isUntrusted && identity.usageUserId && await isStrikeCooldownActive(owner, identity.usageUserId)) {
      recordStrikeRefusal(owner, identity, 'summarizer')
      res.status(403).json({ error: 'Temporarily blocked by moderation' })
      return
    }

    const { text, usage } = await generateText({
      model,
      system: SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: 'user' as const, content: body.content }]
    })

    // Record usage after completion (credits)
    const inputTokens = usage?.inputTokens ?? 0
    const outputTokens = usage?.outputTokens ?? 0
    const cost = computeCredits(inputTokens, outputTokens, entry.multiplier, config.outputTokenWeight)
    if (cost > 0) {
      await recordUsage(owner, cost, usageUserId, usageUserName, poolId)
    }

    res.json({ summary: text })
  } catch (err) {
    next(err)
  }
})
