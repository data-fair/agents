/**
 * The tripwire's two stage calls: the shared engine's (api/src/guard/service.ts) with the tripwire's policy,
 * wrapper and schema. Kept apart from service.ts, which needs mongo and config, so the classifier eval
 * (dev/guard-eval) runs exactly these calls.
 */
import type { LanguageModel } from 'ai'
import { stage1Call, stage2Call } from '../guard/service.ts'
import { tripwireVerdictSchema, buildTripwireSystemPrompt, tripwireMessage, TRIPWIRE_STAGE2_MAX_TOKENS, type ScreenInput } from './operations.ts'

export type ClassifiedText = Pick<ScreenInput, 'server' | 'toolName'>

export const tripwireStage1 = (model: LanguageModel, call: ClassifiedText, window: string, nonce: string, abortSignal: AbortSignal) => stage1Call({
  model,
  instructions: buildTripwireSystemPrompt(),
  content: tripwireMessage({ server: call.server, toolName: call.toolName, text: window, nonce }, 1),
  abortSignal
})

export const tripwireStage2 = (model: LanguageModel, call: ClassifiedText, window: string, nonce: string, abortSignal: AbortSignal) => stage2Call({
  model,
  schema: tripwireVerdictSchema,
  maxOutputTokens: TRIPWIRE_STAGE2_MAX_TOKENS,
  instructions: buildTripwireSystemPrompt(),
  content: tripwireMessage({ server: call.server, toolName: call.toolName, text: window, nonce }, 2),
  abortSignal
})
