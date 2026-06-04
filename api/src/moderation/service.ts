/**
 * service.ts contains high level stateful functions (uses #mongo via settings service)
 * it is tested by api integration tests
 */

import type { AccountKeys } from '@data-fair/lib-express'
import { generateText } from 'ai'
import { getRawSettings } from '../settings/service.ts'
import { createModel } from '../models/operations.ts'
import { buildModerationSystemPrompt, parseModerationVerdict, resolveModerationModelId } from './operations.ts'

export const MODERATION_TIMEOUT_MS = 1500

const DEFAULT_REFUSAL = "This request can't be processed as it falls outside what this assistant is meant to help with."

export interface ModerationResult {
  action: 'allow' | 'block'
  category?: string
  reason?: string
  refusalMessage?: string
  skipped?: boolean
}

export const isModerationEnabled = async (owner: AccountKeys): Promise<boolean> => {
  const settings = await getRawSettings(owner)
  return !!(settings?.moderation?.enabled && resolveModerationModelId(settings))
}

export const runModeration = async (owner: AccountKeys, message: string, mission?: string): Promise<ModerationResult> => {
  const settings = await getRawSettings(owner)
  if (!settings?.moderation?.enabled) return { action: 'allow', skipped: true }

  const modelId = resolveModerationModelId(settings)
  if (!modelId) return { action: 'allow', skipped: true }

  // modelId is the 'moderator' | 'summarizer' union, so we can read the typed slots directly
  const modelEntry = modelId === 'moderator' ? settings.models.moderator : settings.models.summarizer
  if (!modelEntry?.model) return { action: 'allow', skipped: true }

  const modelConfig = modelEntry.model
  const provider = settings.providers.find(p => p.id === modelConfig.provider.id)
  if (!provider || !provider.enabled) return { action: 'allow', skipped: true }

  const model = createModel(provider, modelConfig.id)
  const refusalMessage = settings.moderation.refusalMessage || DEFAULT_REFUSAL

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<ModerationResult>((resolve) => {
    timer = setTimeout(() => resolve({ action: 'allow', skipped: true }), MODERATION_TIMEOUT_MS)
  })

  // The inner try/catch must stay exhaustive: it converts every rejection to a
  // resolved fail-open value, so the losing promise of the race below can never
  // surface as an unhandledRejection after the timeout wins.
  const run = (async (): Promise<ModerationResult> => {
    try {
      const { text } = await generateText({
        model,
        system: buildModerationSystemPrompt(mission),
        messages: [{ role: 'user', content: message }]
      })
      const verdict = parseModerationVerdict(text)
      if (verdict.action === 'block') {
        return { action: 'block', category: verdict.category, reason: verdict.reason, refusalMessage }
      }
      return { action: 'allow' }
    } catch {
      return { action: 'allow', skipped: true }
    }
  })()

  try {
    return await Promise.race([run, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
