/**
 * Per-model-call telemetry, recorded on the run.
 *
 * Split out of the executor with the gates. It is the one thing the deleted `trace-requests`
 * collection held that a conversation cannot: a turn is N model calls while the conversation keeps
 * one message for the whole turn.
 */

import type { ConversationRun } from '#types'
import { appendRunCall } from './service.ts'
import type { resolveRoleModel } from '../models/service.ts'

/**
 * Record one model call's telemetry on the run.
 *
 * This replaces a `trace-requests` collection that stored a COPY of the exchange under its own TTL,
 * consent gate, five indexes and router. It was redundant once the conversation itself became the
 * record: the only thing it held that a conversation cannot is per-CALL detail, because a turn is N
 * model calls while the conversation keeps one message for the whole turn. So that is all this keeps,
 * and it keeps it on the run, which is already the per-turn record.
 *
 * Unconditional — no `storeTraces` setting, no consent check. This is operational telemetry about
 * the account's own spend, not content: a model id, a token count, a duration. What consent governs
 * is whether an ADMIN MAY READ THE CONVERSATION, which is one flag on the conversation now
 * (`consentedToReview`) rather than the same question asked in two places.
 *
 * Fire-and-forget with a logged catch: telemetry must never cost a turn.
 */
export const recordCall = (
  run: ConversationRun,
  call: {
    modelRole: string
    entry: ReturnType<typeof resolveRoleModel>['entry']
    usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }
    credits: number
    creditBreakdown?: { input: number, cachedInput: number, output: number }
    durationMs: number
    finishReason?: string
    steps?: number
    messageCount?: number
    historyUpToSeq?: number
  }
) => {
  appendRunCall(run.id, {
    modelRole: call.modelRole,
    model: call.entry.id,
    provider: call.entry.provider.name,
    providerType: call.entry.provider.type,
    inputTokens: call.usage.inputTokens,
    outputTokens: call.usage.outputTokens,
    ...(call.usage.cacheReadTokens !== undefined ? { cacheReadTokens: call.usage.cacheReadTokens } : {}),
    ...(call.usage.cacheWriteTokens !== undefined ? { cacheWriteTokens: call.usage.cacheWriteTokens } : {}),
    credits: call.credits,
    ...(call.creditBreakdown
      ? {
          creditsInput: call.creditBreakdown.input,
          creditsCachedInput: call.creditBreakdown.cachedInput,
          creditsOutput: call.creditBreakdown.output
        }
      : {}),
    durationMs: call.durationMs,
    ...(call.finishReason ? { finishReason: call.finishReason } : {}),
    ...(call.steps !== undefined ? { steps: call.steps } : {}),
    ...(call.messageCount !== undefined ? { messageCount: call.messageCount } : {}),
    ...(call.historyUpToSeq !== undefined ? { historyUpToSeq: call.historyUpToSeq } : {})
  }).catch(err => console.error('could not record run telemetry', err))
}
