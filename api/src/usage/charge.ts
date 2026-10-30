import type { AccountKeys } from '@data-fair/lib-express'
import config from '#config'
import type { ConversationRun } from '#types'
import type { LanguageModelUsage } from 'ai'
import { computeCreditBreakdown, tokenCountsOf, type CreditBreakdown, type UsageIdentity } from './operations.ts'
import type { CatalogModel, ModelRole } from '../models/operations.ts'
import { recordUsage } from './service.ts'
import { incrementRunSpend } from '../conversations/service.ts'
import { recordCall } from '../conversations/turn-telemetry.ts'

/**
 * Price one model call and record it everywhere it counts: the usage ledger (with the untrusted pool),
 * and the run's spend and telemetry when a run is given. Every model call goes through it, so each is
 * priced the same way (cache tokens included) and always reaches the untrusted pool.
 *
 * - `identity` null: the call is the account's own, with no caller (the admin moderation probe).
 * - `run.steps`: steps of the LEAD's loop this call was — 1 for a lead step, 0 (the default) for
 *   anything spent beside it (a worker step, a compaction, the moderator), so the step limit and the
 *   run's own record agree.
 * - `run.durationMs`: records the call's telemetry entry on the run. The lead omits it: it records ONE
 *   entry for its whole turn, aggregated over its steps (see the executor).
 *
 * Returns the breakdown, so a caller that bounds a budget keeps doing it.
 */
export async function chargeModelCall (input: {
  owner: AccountKeys
  identity: UsageIdentity | null
  modelRole: ModelRole
  entry: CatalogModel
  /** As the AI SDK reports it; undefined when the provider reported none. */
  usage: LanguageModelUsage | undefined
  finishReason?: string
  run?: { run: ConversationRun, steps?: number, durationMs?: number }
}): Promise<CreditBreakdown> {
  const { owner, identity, modelRole, entry, finishReason, run } = input
  const counts = tokenCountsOf(input.usage)
  const credits = computeCreditBreakdown(counts, entry, config.eurosPerCredit)
  const tokenCosts = { input: credits.input, cachedInput: credits.cachedInput, output: credits.output }
  // On the RUN as well as in usage, per call, so a turn stopped by its budget or its clock still shows
  // what it actually consumed, and the two never disagree.
  if (run) await incrementRunSpend(run.run.id, credits.total, run.steps ?? 0)
  if (run?.durationMs !== undefined) {
    recordCall(run.run, {
      modelRole,
      entry,
      usage: counts,
      credits: credits.total,
      creditBreakdown: tokenCosts,
      durationMs: run.durationMs,
      ...(finishReason ? { finishReason } : {})
    })
  }
  if (credits.total > 0) {
    await recordUsage(owner, {
      cost: credits.total,
      userId: identity?.usageUserId,
      userName: identity?.usageUserName,
      poolId: identity?.poolId,
      dimensions: { modelRole, model: entry.id, profile: identity?.role, tokenCosts }
    })
  }
  return credits
}
