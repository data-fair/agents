/**
 * service.ts contains the stateful side of the approval reviewer: the model it runs on, its two stage calls
 * through the shared guard engine, their metering and telemetry. One reviewer per turn, created by the loop
 * and handed to the gate (./gate.ts). docs/superpowers/specs/2026-11-03-auto-approval-design.md
 *
 * It never throws and never allows on a failure: no model, an error, a timeout or an unparseable answer is the
 * `review-failed` record, unsure (reviewOutcomeToRecord) — a card in a chat, a deny elsewhere.
 */
import type { LanguageModelUsage } from 'ai'
import log from '@data-fair/lib-node/log.js'
import type { AccountKeys } from '@data-fair/lib-express'
import type { ConversationRun, Settings } from '#types'
import { tokenCountsOf, type UsageIdentity } from '../usage/operations.ts'
import { resolveRoleModel, type ResolvedRoleModel } from '../models/service.ts'
import { chargeModelCall } from '../usage/charge.ts'
import { recordCall } from '../conversations/turn-telemetry.ts'
import { newNonce, meterGuardCall, classifyTwoStage } from '../guard/service.ts'
import {
  reviewOutcomeToRecord, REVIEW_CLEARED, REVIEW_STAGE1_TIMEOUT_MS, REVIEW_STAGE2_TIMEOUT_MS,
  type Exposure, type ProposedCall, type ReviewIntent, type ReviewRecord, type ReviewVerdict
} from './operations.ts'
import { reviewStage1, reviewStage2 } from './classifier.ts'

export type TurnReviewer = (call: ProposedCall, exposure: Exposure) => Promise<ReviewRecord>

export const createTurnReviewer = (ctx: {
  run: ConversationRun
  agent: { id: string }
  owner: AccountKeys
  identity: UsageIdentity
  /** The account's settings, to resolve the moderator role model (moderator → summarizer → assistant). */
  settings: Settings | null
  abortSignal: AbortSignal
  /** Each reviewer call's credits, for the turn's budget. */
  onCredits: (credits: number) => void
  /** What the people asked, the agent's persona and instructions, a webhook run's events. */
  intent: ReviewIntent
}): TurnReviewer => {
  const logFailure = (record: ReviewRecord, call: ProposedCall, model?: string) => {
    if (ctx.abortSignal.aborted) return
    // A static code, so df_logs counts it: a failing moderator model turns every review into a card or a deny.
    log.warn('an approval review failed: the call counts as unsure', {
      code: 'review-failed', runId: ctx.run.id, agentId: ctx.agent.id, toolName: call.toolName, ...(model ? { model } : {}), failure: record.failure
    })
  }

  let resolved: ResolvedRoleModel
  try {
    resolved = resolveRoleModel(ctx.settings, 'moderator')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return async (call, exposure) => {
      const record = reviewOutcomeToRecord({ kind: 'stage1-failed', cause: 'error', message }, exposure.exposed, new Date().toISOString())
      logFailure(record, call)
      return record
    }
  }
  const { model, entry } = resolved

  // Metered as the tripwire's calls are: the usage ledger and the run's spend through chargeModelCall, the run's
  // telemetry entry here, noted as a review. An unparseable answer is charged too (meterGuardCall).
  const meter = async (generated: Promise<{ usage: LanguageModelUsage }>, startedAt: number) => {
    await meterGuardCall(generated, async usage => {
      const credits = await chargeModelCall({ owner: ctx.owner, identity: ctx.identity, modelRole: 'moderator', entry, usage, run: { run: ctx.run } })
      recordCall(ctx.run, {
        modelRole: 'moderator',
        entry,
        usage: tokenCountsOf(usage),
        credits: credits.total,
        creditBreakdown: { input: credits.input, cachedInput: credits.cachedInput, output: credits.output },
        durationMs: Date.now() - startedAt,
        note: 'review'
      })
      ctx.onCredits(credits.total)
    }).catch(err => {
      if (!ctx.abortSignal.aborted) log.error('an approval review call could not be metered', { code: 'review-charge', err })
    })
  }

  // The turn's abort reaches each stage call beside the engine's own timeout.
  const withTurn = (signal: AbortSignal) => AbortSignal.any([signal, ctx.abortSignal])

  return async (call, exposure) => {
    const input = { intent: ctx.intent, call, exposure, nonce: newNonce() }
    // A destructive call and a grant always reach stage 2: a stage-1 "no" may stand as an allow for a write only.
    const confirmationOnly = call.cls === 'destructive' || call.kind === 'grant'
    const outcome = await classifyTwoStage<ReviewVerdict>({
      ...(confirmationOnly ? {} : { stage1: (signal: AbortSignal) => reviewStage1(model, input, withTurn(signal)) }),
      stage2: signal => reviewStage2(model, input, withTurn(signal)),
      cleared: REVIEW_CLEARED,
      hardTimeoutMs: REVIEW_STAGE1_TIMEOUT_MS,
      stage2TimeoutMs: REVIEW_STAGE2_TIMEOUT_MS,
      meter
    })
    const record = reviewOutcomeToRecord(outcome, exposure.exposed, new Date().toISOString())
    if (record.code === 'review-failed') logFailure(record, call, entry.id)
    return record
  }
}
