/**
 * service.ts contains the stateful side of the tool-output injection tripwire: the classifier calls, their
 * metering and telemetry, and what a trip leaves behind (a log line, an event for a configured agent).
 * docs/superpowers/specs/2026-11-02-tool-output-tripwire-design.md
 */
import mongo from '#mongo'
import config from '#config'
import { NoObjectGeneratedError, type LanguageModel, type LanguageModelUsage } from 'ai'
import log from '@data-fair/lib-node/log.js'
import type { AccountKeys } from '@data-fair/lib-express'
import type { ConversationRun, Settings } from '#types'
import type { UsageIdentity } from '../usage/operations.ts'
import { resolveRoleModel, resolveRoleEntry, type ResolvedRoleModel } from '../models/service.ts'
import { chargeModelCall } from '../usage/charge.ts'
import { recordCall } from '../conversations/turn-telemetry.ts'
import { newNonce, stage1Call, stage1Answer, stage2Call, meterGuardCall } from '../guard/service.ts'
import { isPersonalAgentId } from '../agent-session/personal-agent.ts'
import { pushTaskEvent } from '../tasks/notifications.ts'
import { withholdStoredResult, type StoredResultPlace } from '../conversations/service.ts'
import {
  tripwireVerdictSchema, buildTripwireSystemPrompt, tripwireMessage, capForScan, scanWindows, tripSource,
  injectionEvent, TRIPWIRE_TIMEOUT_MS, TRIPWIRE_HARD_TIMEOUT_MS, TRIPWIRE_EXCERPT_MAX_CHARS, TRIPWIRE_CONFIRM_FAILED_EXCERPT,
  TRIPWIRE_STAGE2_MAX_TOKENS,
  type TripRecord, type TripwireVerdict, type ScreenInput, type ScreenResult
} from './operations.ts'

type ClassifiedText = Pick<ScreenInput, 'server' | 'toolName'>

/** The tripwire's two stage calls (the shared engine's, with its policy, wrapper and schema). */
const tripwireStage1 = (model: LanguageModel, call: ClassifiedText, window: string, nonce: string, abortSignal: AbortSignal) => stage1Call({
  model,
  instructions: buildTripwireSystemPrompt(),
  content: tripwireMessage({ server: call.server, toolName: call.toolName, text: window, nonce }, 1),
  abortSignal
})
const tripwireStage2 = (model: LanguageModel, call: ClassifiedText, window: string, nonce: string, abortSignal: AbortSignal) => stage2Call({
  model,
  schema: tripwireVerdictSchema,
  maxOutputTokens: TRIPWIRE_STAGE2_MAX_TOKENS,
  instructions: buildTripwireSystemPrompt(),
  content: tripwireMessage({ server: call.server, toolName: call.toolName, text: window, nonce }, 2),
  abortSignal
})

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

// Logged once per process: a deployment with no small model classifies every scanned result with the assistant
// model, always on, which is slow (mostly failing open at the timeout) and costly.
let assistantModelLogged = false
const logAssistantModel = (entry: { id: string, provider: { id: string } }) => {
  if (assistantModelLogged) return
  assistantModelLogged = true
  log.warn('the tool-output tripwire classifies with the assistant model: configure a small moderator model', {
    code: 'tripwire-assistant-model', model: entry.id, provider: entry.provider.id
  })
}

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
  try {
    const assistant = resolveRoleEntry(ctx.settings, 'assistant')
    if (assistant.id === entry.id && assistant.provider.id === entry.provider.id) logAssistantModel(entry)
  } catch { /* the assistant's own resolution fails the turn elsewhere */ }
  const records = new Map<string, TripRecord>()
  let tripped: TripRecord | undefined

  // A classification that left no verdict: the result passed unscanned. Recorded on the run, so a broken
  // moderator model shows up in its telemetry rather than as a silent hole.
  // Logged too, at warn with a static code, so df_logs counts it: a fail-open rate near 100% means the tripwire is
  // effectively off (a misconfigured or failing moderator model), which only operations can notice and fix.
  const recordFailOpen = (durationMs: number) => {
    if (ctx.abortSignal.aborted) return
    log.warn('a tool result passed the tripwire unscanned: the classifier failed or timed out', { code: 'tool-output-tripwire-fail-open', runId: ctx.run.id, agentId: ctx.agent.id, model: entry.id, durationMs })
    recordCall(ctx.run, { modelRole: 'moderator', entry, usage: { inputTokens: 0, outputTokens: 0 }, credits: 0, durationMs, note: 'tripwire-fail-open' })
  }

  // Each classifier call metered beside its answer, not before it: the timeout races the model call, not the
  // usage write. As moderation does, a call settling after its window was counted as a pass is in the usage
  // ledger only, the turn has moved on. A late "suspected" is still acted on (lateTrip, below).
  const meter = (generated: Promise<{ usage: LanguageModelUsage }>, startedAt: number, onTime: () => boolean) => {
    const charge = async (usage: LanguageModelUsage) => {
      const charged = onTime()
      const credits = await chargeModelCall({
        owner: ctx.owner,
        identity: ctx.identity,
        modelRole: 'moderator',
        entry,
        usage,
        ...(charged ? { run: { run: ctx.run, durationMs: Date.now() - startedAt } } : {})
      })
      if (charged) ctx.onCredits(credits.total)
    }
    // An unparseable answer is charged too (meterGuardCall); other failures are handled by their stage.
    meterGuardCall(generated, charge).catch(err => {
      if (!ctx.abortSignal.aborted) log.error('a tripwire call could not be metered', { code: 'tool-output-tripwire-charge', err })
    })
  }

  const callSignal = () => AbortSignal.any([ctx.abortSignal, AbortSignal.timeout(TRIPWIRE_HARD_TIMEOUT_MS)])

  /**
   * Stage 2, only after a stage-1 yes: the same policy and wrapped content, asked to confirm or clear. Once
   * stage 1 flagged, the bias is toward flagging: a confirmation that errs, times out or answers unparseable
   * text counts as suspected. `onTime` is whether the turn waits for it (its credits then count in the run's).
   */
  const confirm = (call: ScreenInput, window: string, nonce: string, onTime: boolean): Promise<TripwireVerdict> => {
    const startedAt = Date.now()
    const signal = callSignal()
    const generated = tripwireStage2(model, call, window, nonce, signal)
    meter(generated, startedAt, () => onTime)
    return generated.then(({ object }) => object, (err): TripwireVerdict => {
      // The turn was stopped: it gets the abort (withProvenance), not a trip nobody caused.
      if (ctx.abortSignal.aborted) throw err
      const cause = signal.aborted
        ? 'it timed out'
        : NoObjectGeneratedError.isInstance(err) ? 'its answer could not be parsed' : 'the model call failed'
      log.warn('the tripwire confirmation step failed: the flagged result counts as suspected', { code: 'tool-output-tripwire-confirm-failed', runId: ctx.run.id, agentId: ctx.agent.id, model: entry.id, cause })
      recordCall(ctx.run, { modelRole: 'moderator', entry, usage: { inputTokens: 0, outputTokens: 0 }, credits: 0, durationMs: Date.now() - startedAt, note: 'tripwire-confirm-failed' })
      return { suspected: true, excerpt: TRIPWIRE_CONFIRM_FAILED_EXCERPT, reason: `The first screening flagged this result and the confirmation step failed: ${cause}.` }
    })
  }

  /**
   * Stage 1, every window: one word, erring toward flagging, awaited TRIPWIRE_TIMEOUT_MS. "no" passes; an
   * error or an answer that is not one yes or no fails open. "yes" holds the result until stage 2 settles.
   * A yes after the timeout goes through stage 2 too, for a late trip.
   */
  const classifyWindow = (call: ScreenInput, window: string): Promise<WindowOutcome> => {
    const startedAt = Date.now()
    // The wrapper's tag, unknown to whoever wrote the content: it cannot close it.
    const nonce = newNonce()
    let timedOut = false
    const generated = tripwireStage1(model, call, window, nonce, callSignal())
    meter(generated, startedAt, () => !timedOut)
    const flagged = stage1Answer(generated)
    return Promise.race([
      flagged.then(
        async (yes): Promise<WindowOutcome> => {
          // Lost the race to the timer: the late verdict below runs stage 2, not this branch.
          if (timedOut) return { status: 'error' }
          return { status: 'verdict', verdict: yes ? await confirm(call, window, nonce, true) : { suspected: false }, window }
        },
        (): WindowOutcome => {
          if (!timedOut) recordFailOpen(Date.now() - startedAt)
          return { status: 'error' }
        }
      ),
      new Promise<WindowOutcome>(resolve => {
        const timer = setTimeout(() => {
          timedOut = true
          recordFailOpen(Date.now() - startedAt)
          resolve({ status: 'timeout', late: flagged.then(yes => yes ? confirm(call, window, nonce, false) : { suspected: false }) })
        }, TRIPWIRE_TIMEOUT_MS)
        timer.unref?.()
        flagged.finally(() => clearTimeout(timer)).catch(() => {})
      })
    ])
  }

  // `alert`, not `warn`: lib-node's level for events that are not failures but deserve the scrutiny of errors,
  // mostly security ones. A suspected injection is one; df_logs counts it under this static code.
  const logTrip = (record: TripRecord) => {
    log.alert(record.late
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
  const lateTrip = (call: ScreenInput, verdict: TripwireVerdict, window: string, durationMs: number) => {
    if (records.has(call.toolCallId)) return
    const record: TripRecord = { ...recordFor(call, verdict, window), late: true }
    records.set(call.toolCallId, record)
    // On the run too, beside the fail open the timeout recorded: its usage is in the ledger (metered above).
    recordCall(ctx.run, { modelRole: 'moderator', entry, usage: { inputTokens: 0, outputTokens: 0 }, credits: 0, durationMs, note: 'tripwire-late-suspected' })
    logTrip(record)
    notifyOnce(record)
    if (storedAt) applyStored(storedAt, call.toolCallId, record)
    else ctx.onLate?.(call.toolCallId, record)
  }

  return {
    async screen (call) {
      const { text, cut } = capForScan(call.text)
      const startedAt = Date.now()
      const windows = scanWindows(text)
      const outcomes = await Promise.all(windows.map(window => classifyWindow(call, window)))
      const hit = outcomes.find(o => o.status === 'verdict' && o.verdict.suspected)
      if (hit?.status !== 'verdict') {
        windows.forEach((window, i) => {
          const outcome = outcomes[i]
          if (outcome.status !== 'timeout') return
          outcome.late.then(verdict => { if (verdict.suspected && !ctx.abortSignal.aborted) lateTrip(call, verdict, window, Date.now() - startedAt) }, () => {})
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
