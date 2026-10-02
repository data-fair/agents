/**
 * What a turn has to get past before any model is called.
 *
 * Split out of the executor, which had grown to own the gates, the history, the telemetry, the
 * compaction and the model loop. The gates are one concern and they share one shape: each returns a
 * finished turn when the answer is "no", or undefined to carry on — so `runTurn` reads as a list of
 * them rather than as a sequence of early returns buried in a thousand lines.
 *
 * A refused turn must cost nothing, which is why they all run BEFORE the model call rather than
 * racing it.
 */

import mongo from '#mongo'
import type { AutonomousAgentRun } from '#types'
import type { UsageIdentity } from '../usage/enforce.ts'
import { enforceQuotas } from '../usage/enforce.ts'
import {
  extractLastUserMessage,
  buildModerationContext,
  MODERATION_CONTEXT_MAX_MESSAGES,
  MODERATION_REFUSAL
} from '../moderation/operations.ts'
import { startModeration, isStrikeCooldownActive, recordStrikeRefusal } from '../moderation/service.ts'
import { isStandardAgentId } from '../agent-session/standard-agents.ts'
import { partsText, textPart, type RunStopReason, type MessagePart } from './operations.ts'
import type { getSettings } from '../settings/service.ts'

/** What every gate returns when it refuses: a finished turn carrying the reason, and no spend. */
export interface RefusedTurn {
  parts: MessagePart[]
  steps: number
  credits: number
  stopReason: RunStopReason
}

type Settings = Awaited<ReturnType<typeof getSettings>>

const refuse = (text: string, stopReason: RunStopReason): RefusedTurn =>
  ({ parts: [textPart(text)], steps: 0, credits: 0, stopReason })

/**
 * The quota and credit-cap gate.
 *
 * `reason`/`scope`/`period` name WHAT was exceeded, because an org admin needs that to act — and the
 * wording follows the agent, since the standard assistant uses this path too and "this autonomous
 * agent could not run" is a confusing thing to say to a person who just asked a question.
 */
export const checkQuotas = async (
  run: AutonomousAgentRun,
  settings: Settings,
  identity: UsageIdentity,
  autonomousAgentId: string
): Promise<RefusedTurn | undefined> => {
  const violation = await enforceQuotas(run.owner, settings.quotas ?? {} as any, identity)
  if (!violation) return undefined
  const lead = isStandardAgentId(autonomousAgentId) ? 'I could not answer' : 'This autonomous agent could not run'
  return refuse(
    `${lead}: ${violation.reason} (${violation.scope}, ${violation.period} limit ${violation.limit}, used ${violation.usage}). Resets at ${violation.resetsAt}.`,
    'error'
  )
}

/**
 * Classify this turn's user message and refuse it when the verdict says so.
 *
 * Returns a turn result when the turn must not proceed, or undefined to carry on. A fail-open
 * (timeout or classifier error) carries on by design: the gate must not take the service down with
 * it, which is the trade the gateway made too and the reason the event records WHY it opened.
 */
export const moderateTurn = async (
  run: AutonomousAgentRun,
  settings: Awaited<ReturnType<typeof getSettings>>,
  identity: UsageIdentity
): Promise<RefusedTurn | undefined> => {
  // 'completed', not 'error', at both refusal points below. A turn that stopped for any reason other
  // than finishing has runStopReasonMessage's notice APPENDED to whatever it produced, and "This turn
  // failed and could not be completed" is false here and unhelpful: the turn did finish, and
  // declining was its answer. The block is recorded as a moderation event, which is where an admin
  // looks for it.
  // A standing cooldown refuses WITHOUT calling the classifier, let alone the model: someone who has
  // just been blocked five times should not be able to keep spending the account's moderator budget.
  if (identity.isUntrusted && identity.usageUserId && await isStrikeCooldownActive(run.owner, identity.usageUserId)) {
    // Recorded as its own action, distinct from a block: an admin reading the events needs to see
    // that this one cost no classifier call, rather than it looking like a sixth verdict.
    recordStrikeRefusal(run.owner, identity, 'assistant')
    return refuse(MODERATION_REFUSAL, 'completed')
  }

  // The last few turns, oldest first — enough for the classifier to read a short follow-up in
  // context. Reference only: the judged unit is the latest user message (see moderation/operations).
  const recent = (await mongo.autonomousAgentMessages
    .find({ conversationId: run.conversationId }, { projection: { _id: 0 } })
    .sort({ seq: -1 })
    .limit(MODERATION_CONTEXT_MAX_MESSAGES)
    .toArray())
    .reverse()
    .map(message => ({ role: message.role, content: partsText(message.parts ?? []) }))

  const message = extractLastUserMessage(recent)
  if (!message) return undefined

  const moderation = startModeration({
    settings,
    owner: run.owner,
    identity,
    message,
    context: buildModerationContext(recent),
    modelRole: 'assistant'
  })

  const result = await moderation.gate
  if (result.action !== 'block') return undefined

  // The strike itself is armed by startModeration, which owns strike accounting and swallows its own
  // failures so that accounting can never turn a refusal into an answer.
  return refuse(MODERATION_REFUSAL, 'completed')
}
