/**
 * The approval reviewer's two stage calls: the shared engine's (api/src/guard/service.ts) with the reviewer's
 * policy, wrappers and schema. Kept apart from the reviewer's service, which needs mongo and config, so the
 * classifier eval (dev/guard-eval) can run exactly these calls. Unlike the other guards, stage 2 reasons.
 */
import type { LanguageModel } from 'ai'
import { stage1Call, stage2Call } from '../guard/service.ts'
import { reviewVerdictSchema, buildReviewSystemPrompt, reviewMessage, REVIEW_STAGE2_MAX_TOKENS, type ReviewInput } from './operations.ts'

export const reviewStage1 = (model: LanguageModel, input: ReviewInput, abortSignal: AbortSignal) => stage1Call({
  model,
  instructions: buildReviewSystemPrompt(input.call.kind),
  content: reviewMessage(input, 1),
  abortSignal
})

export const reviewStage2 = (model: LanguageModel, input: ReviewInput, abortSignal: AbortSignal) => stage2Call({
  model,
  schema: reviewVerdictSchema,
  maxOutputTokens: REVIEW_STAGE2_MAX_TOKENS,
  reasoning: true,
  instructions: buildReviewSystemPrompt(input.call.kind),
  content: reviewMessage(input, 2),
  abortSignal
})
