/**
 * service.ts contains the stateful side of the tool-output injection tripwire: the classifier calls, their
 * metering and telemetry, and what a trip leaves behind (a log line, an event for a configured agent).
 * docs/superpowers/specs/2026-11-02-tool-output-tripwire-design.md
 */
import mongo from '#mongo'
import config from '#config'
import { generateObject } from 'ai'
import log from '@data-fair/lib-node/log.js'
import type { AccountKeys } from '@data-fair/lib-express'
import type { ConversationRun, Settings } from '#types'
import type { UsageIdentity } from '../usage/operations.ts'
import { resolveRoleModel, type ResolvedRoleModel } from '../models/service.ts'
import { chargeModelCall } from '../usage/charge.ts'
import { recordCall } from '../conversations/turn-telemetry.ts'
import { withReasoningDisabled } from '../moderation/service.ts'
import { isPersonalAgentId } from '../agent-session/personal-agent.ts'
import { pushTaskEvent } from '../tasks/notifications.ts'
import { withholdStoredResult, type StoredResultPlace } from '../conversations/service.ts'
import {
  tripwireVerdictSchema, buildTripwireSystemPrompt, formatTripwireInput, capForScan, scanWindows, tripSource,
  injectionEvent, TRIPWIRE_TIMEOUT_MS, TRIPWIRE_HARD_TIMEOUT_MS, TRIPWIRE_EXCERPT_MAX_CHARS,
  type TripRecord, type TripwireVerdict, type ScreenInput, type ScreenResult
} from './operations.ts'

export interface TurnTripwire {
  /** Classify one tool result; `text` on a pass is the scanned text (capped, see capForScan). */
  screen (call: ScreenInput): Promise<ScreenResult>
  /** The first trip of the turn. */
  readonly tripped: TripRecord | undefined
  recordOf (toolCallId: string): TripRecord | undefined
  /**
   * The turn is over and its record is stored where given: every late trip so far, and every later one, is
   * applied to the stored part (withholdStoredResult).
   */
  closed (where: StoredResultPlace): void
}

// What one window's classification came to. 'timeout' and 'error' both pass (fail open); a timed-out window
// keeps its verdict to come, for a late trip.
type WindowOutcome =
  | { status: 'verdict', verdict: TripwireVerdict, window: string }
  | { status: 'timeout', late: Promise<TripwireVerdict> }
  | { status: 'error' }

/**
 * One tripwire per turn, created by the loop. Undefined when the deployment switched it off or no moderator
 * model resolves: then results pass unscanned, as before the tripwire existed.
 */
export const createTurnTripwire = (ctx: {
  run: ConversationRun
  agent: { id: string, title?: string }
  owner: AccountKeys
  identity: UsageIdentity
  /** The account's settings, to resolve the moderator role model (moderator → summarizer → assistant). */
  settings: Settings | null
  abortSignal: AbortSignal
  /** Each classifier call's credits, for the turn's budget. */
  onCredits: (credits: number) => void
  /**
   * A result that passed on a timeout and was then judged suspected, while the turn has not closed: the loop
   * withholds it on its own parts. After closed(), the stored part is changed instead.
   */
  onLate?: (toolCallId: string, record: TripRecord) => void
}): TurnTripwire | undefined => {
  if (!config.tripwire?.enabled) return undefined
  let resolved: ResolvedRoleModel
  try {
    resolved = resolveRoleModel(ctx.settings, 'moderator')
  } catch {
    return undefined
  }
  const { model, entry } = resolved
  const records = new Map<string, TripRecord>()
  let tripped: TripRecord | undefined

  // A classification that left no verdict: the result passed unscanned. Recorded on the run, so a broken
  // moderator model shows up in its telemetry rather than as a silent hole.
  const recordFailOpen = (durationMs: number) => {
    if (ctx.abortSignal.aborted) return
    recordCall(ctx.run, { modelRole: 'moderator', entry, usage: { inputTokens: 0, outputTokens: 0 }, credits: 0, durationMs, note: 'tripwire-fail-open' })
  }

  const classifyWindow = (call: ScreenInput, window: string): Promise<WindowOutcome> => {
    const startedAt = Date.now()
    let timedOut = false
    const generated = withReasoningDisabled(extra => generateObject({
      model,
      schema: tripwireVerdictSchema,
      temperature: 0,
      maxOutputTokens: 300,
      instructions: buildTripwireSystemPrompt(),
      messages: [{ role: 'user' as const, content: formatTripwireInput({ server: call.server, toolName: call.toolName, text: window }) }],
      abortSignal: AbortSignal.any([ctx.abortSignal, AbortSignal.timeout(TRIPWIRE_HARD_TIMEOUT_MS)]),
      ...extra
    }))
    // Metered beside the verdict, not before it: the timeout races the model call, not the usage write. As
    // moderation does, a call settling after its window was counted as a pass is in the usage ledger only, the
    // turn has moved on. A late "suspected" is still acted on (lateTrip, below).
    generated.then(async ({ usage }) => {
      const onTime = !timedOut
      const credits = await chargeModelCall({
        owner: ctx.owner,
        identity: ctx.identity,
        modelRole: 'moderator',
        entry,
        usage,
        ...(onTime ? { run: { run: ctx.run, durationMs: Date.now() - startedAt } } : {})
      })
      if (onTime) ctx.onCredits(credits.total)
    }, () => { /* a failed call is the verdict's fail open, below */ }).catch(err => {
      if (!ctx.abortSignal.aborted) log.error('a tripwire call could not be metered', { code: 'tool-output-tripwire-charge', err })
    })
    const verdict = generated.then(({ object }) => object)
    return Promise.race([
      verdict.then(
        (v): WindowOutcome => ({ status: 'verdict', verdict: v, window }),
        (): WindowOutcome => {
          if (!timedOut) recordFailOpen(Date.now() - startedAt)
          return { status: 'error' }
        }
      ),
      new Promise<WindowOutcome>(resolve => {
        const timer = setTimeout(() => {
          timedOut = true
          recordFailOpen(Date.now() - startedAt)
          resolve({ status: 'timeout', late: verdict })
        }, TRIPWIRE_TIMEOUT_MS)
        timer.unref?.()
        verdict.finally(() => clearTimeout(timer)).catch(() => {})
      })
    ])
  }

  const logTrip = (record: TripRecord) => {
    log.warn(record.late
      ? 'a tool result was judged a prompt injection after the model had read it: withheld from the record'
      : 'a tool result looked like a prompt injection and was withheld from the model', {
      code: 'tool-output-tripwire',
      runId: ctx.run.id,
      conversationId: ctx.run.conversationId,
      agentId: ctx.agent.id,
      source: record.source
    })
  }
  const notifyTrip = async (record: TripRecord) => {
    // A personal assistant answers someone who is there to see the notice; a configured agent's owner is told.
    if (isPersonalAgentId(ctx.agent.id)) return
    const agent = await mongo.autonomousAgents.findOne({ id: ctx.agent.id }, { projection: { _id: 0, 'nhi.siteUrl': 1 } })
    pushTaskEvent(injectionEvent(ctx.agent, ctx.run, record.source, agent?.nhi?.siteUrl))
  }

  // One event per turn, a late trip's included, and it never holds the turn up.
  let notified = false
  const notifyOnce = (record: TripRecord) => {
    if (notified) return
    notified = true
    notifyTrip(record).catch(err => log.error('a tripwire notification failed', { code: 'tool-output-tripwire-notify', err }))
  }
  const recordFor = (call: ScreenInput, verdict: TripwireVerdict, window: string): TripRecord => ({
    verdict: 'suspected',
    excerpt: (verdict.excerpt || window).slice(0, TRIPWIRE_EXCERPT_MAX_CHARS),
    ...(verdict.reason ? { reason: verdict.reason } : {}),
    model: entry.id,
    source: tripSource(call.toolName, call.server, call.input)
  })

  // Where the turn's record is stored, once it closed: from then on a late trip changes the stored part.
  let storedAt: StoredResultPlace | undefined
  const applyStored = (where: StoredResultPlace, toolCallId: string, record: TripRecord) => {
    withholdStoredResult(where, toolCallId, record)
      .catch(err => log.error('a late tripwire verdict could not be applied', { code: 'tool-output-tripwire-late', runId: ctx.run.id, err }))
  }
  /**
   * A window that timed out, then answered suspected: the result already reached the model, so the turn is not
   * stopped (spec: recorded only), but the record is switched to the placeholder so later turns, a reload and a
   * transcript no longer carry it. One record per call, whichever of its windows answers first.
   */
  const lateTrip = (call: ScreenInput, verdict: TripwireVerdict, window: string) => {
    if (records.has(call.toolCallId)) return
    const record: TripRecord = { ...recordFor(call, verdict, window), late: true }
    records.set(call.toolCallId, record)
    logTrip(record)
    notifyOnce(record)
    if (storedAt) applyStored(storedAt, call.toolCallId, record)
    else ctx.onLate?.(call.toolCallId, record)
  }

  return {
    async screen (call) {
      const { text, cut } = capForScan(call.text)
      const windows = scanWindows(text)
      const outcomes = await Promise.all(windows.map(window => classifyWindow(call, window)))
      const hit = outcomes.find(o => o.status === 'verdict' && o.verdict.suspected)
      if (hit?.status !== 'verdict') {
        windows.forEach((window, i) => {
          const outcome = outcomes[i]
          if (outcome.status !== 'timeout') return
          outcome.late.then(verdict => { if (verdict.suspected && !ctx.abortSignal.aborted) lateTrip(call, verdict, window) }, () => {})
        })
        return { withheld: false, text, ...(cut ? { truncated: { totalChars: call.text.length } } : {}) }
      }
      const record = recordFor(call, hit.verdict, hit.window)
      records.set(call.toolCallId, record)
      logTrip(record)
      if (!tripped) tripped = record
      notifyOnce(record)
      return { withheld: true, record }
    },
    get tripped () { return tripped },
    recordOf: (toolCallId) => records.get(toolCallId),
    closed (where) {
      if (storedAt) return
      storedAt = where
      for (const [toolCallId, record] of records) if (record.late) applyStored(where, toolCallId, record)
    }
  }
}
