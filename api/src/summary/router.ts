import { Router } from 'express'
import { generateText } from 'ai'
import { type AccountKeys, reqSession, isAuthenticated } from '@data-fair/lib-express'
import { reqIp as _reqIp } from '@data-fair/lib-express/req-origin.js'
import { assertCanUseModel, assertRoleQuota, getEffectiveRole } from '../auth.ts'
import { getRawSettings } from '../settings/service.ts'
import { createModel } from '../models/operations.ts'
import { getUsage, getOwnerUsage, recordUsage } from '../usage/service.ts'
import { checkQuota, computeCost } from '../usage/operations.ts'
import type { Settings } from '#types'
import crypto from 'node:crypto'

function safeReqIp (req: import('express').Request): string {
  try { return _reqIp(req) } catch { return req.ip || '127.0.0.1' }
}

const router = Router()
export default router

interface SummaryRequest {
  prompt?: string
  content: string
}

function getSummaryPricing (settings: Settings) {
  const source = settings.models.summarizer?.model ? settings.models.summarizer : settings.models.assistant
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

    // Permission check via role-based quotas
    const quotas = settings.quotas ?? {}

    let trackPerUser: boolean
    let usageUserId: string | undefined
    let usageUserName: string | undefined

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

      assertCanUseModel(session as any, owner, quotas)
      usageUserId = trackPerUser ? session.user!.id : undefined
      usageUserName = trackPerUser ? session.user!.name : undefined
    }

    // Quota enforcement (same pattern as gateway)
    const accountLimits = settings.quotas.global

    if (!accountLimits.unlimited && accountLimits.monthlyLimit) {
      const accountUsage = await getOwnerUsage(owner)
      const quotaCheck = checkQuota(accountUsage, accountLimits, trackPerUser ? 'organization' : 'user')
      if (quotaCheck) {
        res.status(429).json({ error: quotaCheck.reason })
        return
      }
    }

    // Check role-based user quota
    if (trackPerUser) {
      const role = authenticated ? getEffectiveRole(sessionState as any, owner) : 'anonymous'
      const roleQuota = quotas[role]
      if (roleQuota && !roleQuota.unlimited && roleQuota.monthlyLimit) {
        const userUsage = await getUsage(owner, usageUserId)
        const quotaCheck = checkQuota(userUsage, roleQuota, 'user')
        if (quotaCheck) {
          res.status(429).json({ error: quotaCheck.reason })
          return
        }
      }
    }

    const model = await getSummaryModel(settings)
    const { inputPricePerMillion, outputPricePerMillion } = getSummaryPricing(settings)
    const system = body.prompt || 'Summarize the following content concisely:'

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
      await recordUsage(owner, cost, usageUserId, usageUserName)
    }

    res.json({ summary: text })
  } catch (err) {
    next(err)
  }
})
