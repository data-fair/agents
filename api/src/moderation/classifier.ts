/**
 * Moderation's two stage calls: the shared engine's (api/src/guard/service.ts) with moderation's policy, wrapper
 * and schema. Kept apart from service.ts, which needs mongo and config, so the classifier eval (dev/guard-eval)
 * runs exactly these calls.
 */
import type { LanguageModel } from 'ai'
import { stage1Call, stage2Call } from '../guard/service.ts'
import { buildModerationSystemPrompt, moderationMessage, verdictSchema, MODERATION_STAGE2_MAX_TOKENS, type ModerationInput } from './operations.ts'

export const moderationStages = (model: LanguageModel, input: ModerationInput) => {
  const instructions = buildModerationSystemPrompt()
  return {
    stage1: (abortSignal: AbortSignal) => stage1Call({ model, instructions, content: moderationMessage(input, 1), abortSignal }),
    stage2: (abortSignal: AbortSignal) => stage2Call({
      model,
      schema: verdictSchema,
      maxOutputTokens: MODERATION_STAGE2_MAX_TOKENS,
      instructions,
      content: moderationMessage(input, 2),
      abortSignal
    })
  }
}
