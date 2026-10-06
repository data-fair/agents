/**
 * Runs one turn of an autonomous agent, in this process, asynchronously.
 *
 * A turn that has BEGUN is deliberately not resumable: recovery marks it `interrupted`
 * (recoverOwnerlessRuns) rather than continuing it, because its tool calls may already have fired and
 * re-running them would execute those side effects twice. A run that never began — no assistant message
 * yet, so nothing can have happened — is resumed instead. That one rule replaced two mechanisms which
 * took opposite actions on the identical population. The spec chose this over distributed run leasing
 * until concurrency demands otherwise.
 *
 * Two invariants hold for every path through this module:
 *  - a run always reaches a terminal status, and
 *  - a run always leaves exactly one assistant message.
 * "Failure is a message, not a silence": a conversation that simply stops, or a turn that
 * appears to think forever, is the failure mode the spec forbids.
 */

import mongo from '#mongo'
import config from '#config'
import locks from '@data-fair/lib-node/locks.js'
import Debug from 'debug'
import { streamText, stepCountIs, type Tool } from 'ai'
// 'ai' does not re-export JSONObject; @ai-sdk/provider is where the library declares it.
import type { JSONObject } from '@ai-sdk/provider'
import { STEP_LIMIT, repeatedCallGuard, loopGuardPrepareStep, STREAM_IDLE_TIMEOUT_MS } from './loop-guards.ts'
import type { AutonomousAgent, ConversationMessage, ConversationRun } from '#types'
import {
  runStopReasonMessage, buildSystemPrompt, withProvenance,
  usageIdentityFor,
  boundToolResult, partsText, withAppendedText,
  type RunStopReason, type MessagePart
} from './operations.ts'
import { checkQuotas, moderateTurn } from './turn-gates.ts'
import { moderationApplies } from '../moderation/operations.ts'
import { loadHistory, compactHistory } from './turn-history.ts'
import { recordCall } from './turn-telemetry.ts'
import { appendMessage, updateMessage, finishRun, incrementRunSpend, resolveAgent, setRunSystemPrompt, conversationCost } from './service.ts'
import { getSettings } from '../settings/service.ts'
import { resolveRoleModel } from '../models/service.ts'
import { contextBudget, type ModelRole } from '../models/operations.ts'
import { computeCreditBreakdown } from '../usage/operations.ts'
import { openAutonomousAgentTools } from '../mcp-servers/client.ts'
import { nhiSessionProvider, forwardedSessionProvider } from '../agent-identity/service.ts'
import { sessionFor } from '../agent-session/registry.ts'
import { isStandardAgentId } from '../agent-session/standard-agents.ts'
import { partitionSubAgents, subAgentDelegation } from '../agent-session/sub-agents.ts'
import type { AgentSession } from '../agent-session/session.ts'
import type { ChatActivity } from '@agents/shared/agent-activity'
import { browserToolSet } from '../agent-session/browser-tools.ts'
import { createWaitTool, withHostContext, waitHandover, WAIT_TOOL_NAME } from '@agents/shared/host-events'
import { PERSON_SPOKE, interruptReason, settleInterruptedParts, pendingWaitReminder } from './interrupted-turn.ts'
import { checkAccountCreditCap } from '../usage/enforce.ts'
import { recordUsage } from '../usage/service.ts'

const debug = Debug('df-agents:autonomous-agent-executor')

const LOCK_ORIGIN = 'autonomous-agent-executor'

/** Shown when the provider returns no text at all, so the turn never renders blank. */
const EMPTY_COMPLETION_MESSAGE = 'I was not able to produce a response for this turn. Please try rephrasing the request.'

/**
 * Live turns, by run id, so the abort route can stop one.
 *
 * In-process only, which matches the executor: a run is not resumable and does not migrate,
 * so the process that holds the turn is the only one that can stop it. An abort for a run
 * this process is not running is reported as such rather than silently accepted.
 *
 * The agent id travels with the controller so a whole agent can be stopped at once — see
 * abortRunsOfAgent.
 */
const liveRuns = new Map<string, { controller: AbortController, agentId: string, conversationId: string }>()

/** True when this process actually aborted a live turn. */
export const abortRun = (runId: string): boolean => {
  const live = liveRuns.get(runId)
  if (!live) return false
  live.controller.abort()
  return true
}

/**
 * Stop the live turn of one conversation, so a new prompt can take the turn back.
 *
 * The case this exists for: the assistant called `wait_for_user_action` and the person, instead of
 * clicking what it asked for, typed something. Without this the wait runs out its clock — up to ten
 * minutes — while the person watches their own message do nothing. Speaking IS the answer to
 * "waiting for the user", so it ends the wait.
 *
 * Returns how many this process actually stopped; a conversation has at most one live turn, because
 * the conversation lock serialises them.
 */
export const abortRunsOfConversation = (conversationId: string, why: 'spoke' | 'stop' = 'spoke'): number => {
  let stopped = 0
  for (const live of liveRuns.values()) {
    if (live.conversationId !== conversationId) continue
    // The reason is read back when the turn is settled (interruptReason), so it must be the constant.
    // A Stop carries none, like the HTTP route's abort: the settled calls then say the reply was
    // stopped, rather than that the person wrote.
    live.controller.abort(why === 'spoke' ? new Error(PERSON_SPOKE) : undefined)
    stopped++
  }
  return stopped
}

/**
 * Stop every live turn of one autonomous agent. Returns how many this process actually stopped.
 *
 * The kill switch used to be checked only at the START of a turn, so disabling an agent — or deleting
 * it — left whatever it was already doing running to completion, tool calls included. For a control
 * whose entire purpose is "make it stop", the gap between "stop" and "stops eventually" is the bug: an
 * admin disabling a misbehaving agent means now.
 *
 * Best-effort by the same reasoning as abortRun: only this process's turns, and abort() is a request
 * the provider may ignore — the run's own deadline is the hard backstop.
 */
export const abortRunsOfAgent = (agentId: string): number => {
  let stopped = 0
  for (const live of liveRuns.values()) {
    if (live.agentId !== agentId) continue
    live.controller.abort(new Error('autonomous agent stopped'))
    stopped++
  }
  return stopped
}

/**
 * Tell a watching page what its conversation has cost so far (see the `cost` frame). Only when
 * someone is watching: the aggregate is cheap, but there is no reason to run it for nobody.
 */
const sendConversationCost = async (conversationId: string) => {
  const session = sessionFor(conversationId)
  if (!session) return
  session.send({ type: 'cost', conversationCost: await conversationCost(conversationId) })
}

/** One conversation is one serialised timeline, so the lock is keyed on it. */
const conversationLockId = (conversationId: string) => `conversation:${conversationId}`

/** What one turn produced. The model loop replaces the body that fills this in. */
interface TurnResult {
  /** The turn's ordered parts — the record itself, not a rendering of it. */
  parts: MessagePart[]
  steps: number
  credits: number
  stopReason: RunStopReason
  /** Which ceiling stopped it, when the stop reason alone would be ambiguous. */
  stopDetail?: string
  /**
   * Set when the parts ALREADY say what went wrong, so no stop-reason notice is appended.
   *
   * One turn, one explanation. An empty completion is the case: it reports `error` — the run must
   * record a fault, and a test and an admin both read that — while its message already carries the
   * "I was not able to produce a response" fallback. Without this the person got both that sentence
   * and a generic "this turn failed", which reads as two different failures.
   */
  selfExplained?: boolean
  /**
   * Set when the model loop already published the settled message frame.
   *
   * EXACTLY ONE settled frame per turn, which is a contract and not an optimisation: a client reads
   * `pending: false` as "this turn is done", so a second identical frame is an extra end-of-turn
   * signal. A test helper that returns on the first one then reads the duplicate as the NEXT turn's
   * answer — which is how a passing suite turned into a drained-events failure that had nothing to do
   * with draining.
   *
   * The paths that return before any model call (moderation, quotas, a missing identity) leave this
   * unset, and `runTurn` publishes for them.
   */
  published?: boolean
}

/**
 * The oldest run of this conversation that still needs doing.
 *
 * This is what stops a message from being dropped: a post that arrives while another turn
 * holds the lock leaves its run `running`, and the holder comes back for it here.
 */
const nextPendingRun = async (conversationId: string) => {
  return await mongo.runs.findOne(
    { conversationId, status: 'running' },
    { projection: { _id: 0 }, sort: { startedAt: 1 } }
  )
}

/**
 * Perform the turn itself: resolve the model, gather the agent's tools, and run the loop.
 *
 * An autonomous agent with no verified NHI cannot run at all — its whole tool surface is
 * reached as that identity — so this refuses early with an actionable message rather than
 * producing a toolless turn that looks like a capability problem.
 */
const performTurn = async (run: ConversationRun, messageSeq: number, messageId: string, abortSignal: AbortSignal): Promise<TurnResult> => {
  const autonomousAgent = await resolveAgent(run.owner, run.agentId)
  if (!autonomousAgent) throw new Error('the autonomous agent no longer exists')

  // The session watching this conversation, if any. UNDEFINED IS NORMAL: a turn can run with nobody
  // there — a tab closed mid-turn, and later a scheduled run that never had one. Such a turn has no
  // page tools and streams to nobody; the stored message is still the record.
  //
  // This lookup is the whole of what colocation buys. The loop runs in the process holding the socket,
  // so "who is watching, and what can their page do?" is a Map read.
  const session = sessionFor(run.conversationId)
  // The kill switch. Disabling an autonomous agent must actually stop it answering, calling
  // tools as its identity, and spending credits.
  if (autonomousAgent.enabled === false) {
    return {
      parts: [{ type: 'text', text: 'This autonomous agent is currently disabled, so it cannot act. An administrator can re-enable it.' }],
      steps: 0,
      credits: 0,
      stopReason: 'error'
    }
  }
  // A CONFIGURED agent with no enrolment cannot run: its whole tool surface is reached as that
  // identity, so a toolless turn would look like a capability problem rather than a setup one.
  //
  // A STANDARD agent is the deliberate exception — it has no non-human identity BY DESIGN and acts as
  // the person whose socket it is. This guard predates them and would have refused every such turn
  // with a message about enrolment, which is how the first end-to-end test failed.
  if (!isStandardAgentId(autonomousAgent.id) && !autonomousAgent.nhi?.clientId) {
    return {
      parts: [{ type: 'text', text: 'This autonomous agent has no non-human identity enrolled, so it cannot reach any of its tools. An administrator needs to complete its enrolment before it can run.' }],
      steps: 0,
      credits: 0,
      stopReason: 'error'
    }
  }

  const settings = await getSettings(run.owner)

  // BEFORE ANY MODEL CALL: a refused turn must cost nothing.
  //
  // Read as a list, which is what extracting them bought. The identity is per agent — a configured
  // agent bills as itself, a standard one as the person using it (see usageIdentityFor).
  const identity = usageIdentityFor(autonomousAgent, run)
  for (const gate of [
    () => checkQuotas(run, settings, identity, autonomousAgent.id),
    () => moderationApplies(settings, identity.role) ? moderateTurn(run, settings, identity) : undefined
  ]) {
    const refusal = await gate()
    if (refusal) return refusal
  }

  const { model, entry } = resolveRoleModel(settings, 'assistant')
  // resolveRoleModel already resolved the catalog entry; no need to resolve it twice.
  const budget = contextBudget(entry, config.compactionPercent)

  // Connections stay OPEN for the whole turn: a tool's execute closes over its client, and
  // the MCP SDK's close() clears the transport, so closing early makes every call reject
  // with 'Not connected'. Released in the finally below.
  // WHO IT ACTS AS — the one port. A configured agent has a non-human identity and acts as itself; the
  // personal assistant has none and acts as the person whose socket this is.
  const sessionProvider = autonomousAgent.nhi
    ? nhiSessionProvider(autonomousAgent)
    : forwardedSessionProvider(session?.sessionCookie())
  // A standard agent takes the WHOLE catalog, so an unreachable entry is an availability event rather
  // than a misconfiguration: it is skipped and reported instead of failing the turn. A configured
  // agent's selection is deliberate, so for it a failure still throws.
  const { tools: rawTools, serverByTool, annotationsByTool, skippedServers, close: closeTools } =
    await openAutonomousAgentTools(autonomousAgent, sessionProvider, {
      onServerError: isStandardAgentId(autonomousAgent.id) ? 'skip' : 'throw'
    })
  if (skippedServers.length) {
    debug('skipped %d unreachable server(s): %o', skippedServers.length, skippedServers)
  }
  // The catalog's tools, plus whatever the page in front of the person can do. Both already carry the
  // provenance envelope, and from here on the loop cannot tell them apart — which is the claim.
  const tools = {
    ...withProvenance(rawTools, name => serverByTool.get(name) ?? 'unknown'),
    ...(session ? browserToolSet(session) : {}),
    // `wait_for_user_action`, available only when someone is actually there to act. It is loop-provided
    // rather than page-provided — the page feeds the store, the loop owns the tool — which is why it
    // had to move with the loop. The activity callbacks are the store's own, so the label the chat
    // shows while waiting comes from the same place the wait does.
    ...(session
      ? {
          [WAIT_TOOL_NAME]: createWaitTool({
            store: session.hostEvents,
            onWaiting: expecting => { sessionFor(run.conversationId)?.send({ type: 'activity', activity: { kind: 'waiting', expecting } }) },
            onDone: () => { sessionFor(run.conversationId)?.send({ type: 'activity', activity: null }) }
          })
        }
      : {})
  }

  try {
    return await runModelLoop({ run, messageSeq, messageId, abortSignal, model, entry, tools, settings, budget, serverByTool, annotationsByTool, autonomousAgent, session })
  } finally {
    // The turn is over (normally, by throw, or by abandonment): release the MCP connections.
    await closeTools()
  }
}

/** How often the growing answer is written back, at most, for a turn no agent session watches. */
const PARTIAL_PERSIST_INTERVAL_MS = 2_000

/**
 * The answer each live turn is producing, by conversation — what a page attaching mid-turn is shown.
 *
 * The growing answer is NOT written back while an agent session watches it: that browser receives
 * every token, and the store gets the answer at the end (a turn followed only over HTTP is written on
 * a clock, see `persistPartial`). This registry is what replaces the write for the watcher's side: a
 * page reloaded, or a second tab opened, mid-turn gets the answer so far on attach and the rest live —
 * the turn sends to whoever watches the conversation NOW (`watcher` in runModelLoop), not to the
 * session it started with — and a turn stopped or failing is settled from it. What is given up: a
 * restart mid-answer loses the text of the step in progress. Tool calls and their results are still
 * written as they happen (`persistStructure`), and those are the work worth keeping.
 *
 * In-process, like the sessions themselves: the turn runs in the process holding the socket.
 */
const liveTurns = new Map<string, { messageSeq: number, parts: () => MessagePart[] }>()

/** The answer a live turn of this conversation has produced so far, if one is running here. */
export const liveTurnOf = (conversationId: string) => {
  const live = liveTurns.get(conversationId)
  return live && { messageSeq: live.messageSeq, parts: structuredClone(live.parts()) }
}

interface ModelLoopContext {
  run: ConversationRun
  /**
   * The assistant message being produced — created by runTurn, empty and pending, before the turn
   * starts. The seq doubles as the history bound: the message must not be fed back to the model as
   * an empty turn, so history is everything strictly before it.
   */
  messageSeq: number
  messageId: string
  abortSignal: AbortSignal
  model: ReturnType<typeof resolveRoleModel>['model']
  entry: ReturnType<typeof resolveRoleModel>['entry']
  tools: Record<string, Tool>
  settings: Awaited<ReturnType<typeof getSettings>>
  budget: number
  serverByTool: Map<string, string>
  annotationsByTool: Map<string, Record<string, unknown>>
  /** The browser watching this conversation, if one is. */
  session?: AgentSession
  autonomousAgent: AutonomousAgent
}

const runModelLoop = async (ctx: ModelLoopContext): Promise<TurnResult> => {
  const { run, messageSeq, messageId, abortSignal, model, entry, tools, settings, budget, serverByTool, annotationsByTool, autonomousAgent, session } = ctx
  // WHO SEES THIS TURN: whoever watches the conversation now, read at each send. `session` is the one
  // the turn started with, and still what its page tools and host events belong to; but a reload or a
  // second tab replaces it mid-turn, and a turn sending to the session it began with went silent for
  // the page actually open — not even its `turn-end` arrived.
  const watcher = () => sessionFor(run.conversationId)
  const identity = usageIdentityFor(autonomousAgent, run)

  const compacted = await compactHistory(
    run,
    identity,
    await loadHistory(run.conversationId, messageSeq),
    budget,
    settings,
    abortSignal,
    { agentId: autonomousAgent.id }
  )
  // What the page has reported, folded into the last user turn at CALL time.
  //
  // This closes a gap the prototype had: the socket collected host state and host events into the
  // store, `wait_for_user_action` consumed the events, and the retained state was never told to the
  // model at all — so an assistant asked "what am I looking at?" had the answer in memory beside it
  // and no way to read it.
  //
  // In the last USER message rather than in the system prompt, which is where the browser loop put it
  // and for the same two reasons: the system prompt is the stable, cacheable prefix and page state
  // changes every turn, and state presented as a standing instruction reads to the model as a rule
  // rather than as an observation. Not persisted — it decorates this request only, so the stored
  // conversation stays a record of what was said rather than of what was on screen each time.
  //
  // Plus, when the person's latest message interrupted a wait, the reminder that they were waited on
  // (port of main's #75): LAST in the hidden block, so it is the final thing the model reads before
  // their words. In the interrupted wait's own result it sat in history ahead of the new question, and
  // judged runs answered the question and never waited again.
  const reminder = pendingWaitReminder(compacted.messages)
  const history = session || reminder
    ? withHostContext(compacted.messages, session?.hostEvents ?? null, reminder ? [reminder] : [])
    : compacted.messages

  // Credits spent so far this turn, accumulated per step so the budget can stop the loop
  // between steps rather than only reporting the overrun afterwards.
  //
  // SEEDED with what compaction just cost, so the per-run budget bounds everything the run spent
  // rather than only the assistant's steps. A compaction is charged to the account either way; this is
  // what makes it count against the ceiling too.
  let credits = compacted.credits
  // Why the loop stopped spending, when it did. The per-run budget and the ACCOUNT cap both stop the
  // turn, and a reader needs to know which: one is this turn being greedy, the other is the
  // organization being out of credit, and only the second is actionable by an admin.
  let stopDetail: string | undefined
  let budgetExceeded = false
  // Turn totals for the trace, taken from the same place spend comes from so the trace, the
  // usage records and the run cannot disagree.
  let inputTokens = 0
  let outputTokens = 0
  // The cache detail, which the run's telemetry reports so a reviewer can see that cache reads were
  // billed at the cached rate. `noCacheTokens` is not accumulated: it was only ever needed to reprice
  // a trace document from scratch, and the credits are now computed once, where they are charged.
  let cacheReadTokens = 0
  let cacheWriteTokens = 0
  // Accumulated per token class so the turn's telemetry can show WHERE the cost went, which is the
  // only way to see that cache reads were priced at the cached rate.
  const creditBreakdown = { input: 0, cachedInput: 0, output: 0 }
  const startedAt = Date.now()

  /**
   * Sub-agents, discovered in the tool set and replaced by delegations that run HERE.
   *
   * This was the missing half of moving the loop: `partitionSubAgents` and `subAgentDelegation`
   * existed and were unit-tested, and nothing called them — so a `subagent_*` page tool went to the
   * model as an ordinary tool, the model called it, the browser answered with the sub-agent's JSON
   * CONFIG, and the lead treated that config as the result. No worker ever ran, the reserved tools
   * stayed reachable by the lead, and the panel showed "Sub-agent finished." over nothing.
   *
   * Inside the loop body rather than beside the other tools, because a worker's spend has to land in
   * the same accumulators as the lead's: `credits` bounds the whole run, and `budgetExceeded` stops
   * it. Those live here.
   *
   * WORKERS RUN ON THE `tools` SEAT by default: a worker exists to chain tool calls and hand back a
   * summary, which is that seat's definition, and a deployment maps it to its cheaper
   * structured-output model.
   *
   * A config may PIN A ROLE instead (`model: 'summarizer'`, as lib-vue's `useAgentSubAgent` writes
   * it), and that is honoured — the value names a ROLE, not a model, so which model serves it stays
   * the organization's choice and the pin only says what kind of work this worker does. An unknown
   * value falls back to `tools` rather than failing the turn. Whichever seat it lands on, the spend is
   * billed and recorded under THAT role, so a pinned worker is as accounted for as any other call.
   */
  // One resolution per seat, reused across delegations: resolving walks the catalog and a turn may
  // delegate several times.
  const seats = new Map<ModelRole, ReturnType<typeof resolveRoleModel>>()
  const seatFor = (role: ModelRole) => {
    const held = seats.get(role)
    if (held) return held
    const resolved = resolveRoleModel(settings, role)
    seats.set(role, resolved)
    return resolved
  }
  // `moderator` is excluded: it is the gate's own seat, internal to this service, and not something a
  // page may send work to.
  const WORKER_SEATS: ModelRole[] = ['assistant', 'tools', 'summarizer']
  // Aborts a worker that is still looping when a ceiling is crossed. `budgetExceeded` stops the LEAD
  // between its steps, which does nothing for a worker mid-delegation — so the overshoot would be
  // bounded only by the worker's own step limit. Composed with the run's signal, so a worker also dies
  // with the turn; once it is aborted every later delegation in this turn fails immediately, which is
  // correct when the turn is already stopping.
  const workerAbort = new AbortController()
  const buildDelegation: Parameters<typeof partitionSubAgents>[1] = (name, workerConfig, workerTools) => {
    const pinned = workerConfig.model as ModelRole | undefined
    const seat: ModelRole = pinned && WORKER_SEATS.includes(pinned) ? pinned : 'tools'
    const worker = seatFor(seat)
    return subAgentDelegation({
      name,
      config: workerConfig,
      workerTools,
      model: worker.model,
      abortSignal: AbortSignal.any([abortSignal, workerAbort.signal]),
      // The worker's transcript, streamed to its panel. The lead never sees it — it gets the summary.
      onTrace: trace => {
        watcher()?.send({
          type: 'subagent',
          parentToolCallId: trace.parentToolCallId,
          name: trace.name,
          parts: trace.parts as MessagePart[],
          pending: trace.pending
        })
      },
      onPhase: (parentToolCallId, phase) => {
        watcher()?.send({
          type: 'activity',
          activity: phase ? { kind: 'subagent', name, phase } : null,
          parentToolCallId
        })
      },
      // EVERY worker step is billed, exactly as a lead step is: against the run's budget, against the
      // account's credit cap, and into the usage histogram under the `tools` role so the spend is
      // attributable to the seat that made it. A delegated turn is often most of the work; leaving it
      // unmetered would have let any page with a sub-agent spend without limit.
      onUsage: async usage => {
        const stepCredits = computeCreditBreakdown(
          {
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            cacheReadTokens: usage.cacheReadTokens,
            cacheWriteTokens: usage.cacheWriteTokens
          },
          worker.entry,
          config.eurosPerCredit
        )
        credits += stepCredits.total
        // 0 steps: the spend is real, but a worker step is not a step of the LEAD's loop, and inflating
        // the count would make the step limit and the run's own record disagree. Same call the
        // summarizer makes for the same reason.
        await incrementRunSpend(run.id, stepCredits.total, 0)
        if (stepCredits.total > 0) {
          await recordUsage(run.owner, {
            cost: stepCredits.total,
            userId: identity.usageUserId,
            userName: identity.usageUserName,
            dimensions: {
              modelRole: 'tools',
              model: worker.entry.id,
              profile: identity.role,
              tokenCosts: { input: stepCredits.input, cachedInput: stepCredits.cachedInput, output: stepCredits.output }
            }
          })
        }
        // One telemetry entry per worker step, so review and the export show the delegated work rather
        // than a turn whose cost exceeds the calls that explain it.
        recordCall(run, {
          modelRole: seat,
          entry: worker.entry,
          usage: {
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            ...(usage.cacheReadTokens !== undefined ? { cacheReadTokens: usage.cacheReadTokens } : {}),
            ...(usage.cacheWriteTokens !== undefined ? { cacheWriteTokens: usage.cacheWriteTokens } : {})
          },
          credits: stepCredits.total,
          creditBreakdown: { input: stepCredits.input, cachedInput: stepCredits.cachedInput, output: stepCredits.output },
          durationMs: Date.now() - startedAt,
          ...(usage.finishReason ? { finishReason: usage.finishReason } : {})
        })
        // The two ceilings, checked where the money was just spent. The lead's own `onStepFinish` does
        // this between ITS steps, which is too late to stop a worker that is still looping.
        const accountCap = await checkAccountCreditCap(run.owner)
        if (accountCap) {
          budgetExceeded = true
          stopDetail = `${accountCap.reason} (${accountCap.scope}, ${accountCap.period} limit ${accountCap.limit}, used ${accountCap.usage}). Resets at ${accountCap.resetsAt}.`
        } else if (credits >= config.autonomousAgentRunCredits) {
          budgetExceeded = true
        }
        if (budgetExceeded) workerAbort.abort()
      }
    })
  }

  /**
   * THE TOOL SET IS LIVE FOR THE WHOLE TURN, not frozen when it starts.
   *
   * A page's tools change while a turn runs — the agent opens a panel, the panel mounts a component,
   * the component registers a tool — and the page reports it with `tools-changed`. The browser loop
   * re-read its tools before every step, so the agent could call the tool it had just caused to exist
   * in the SAME turn. Built once on the server, it could not: the mock's chain seam said "tool
   * set_display is not available", which is exactly what a real model meets after opening a panel.
   *
   * It works because the AI SDK re-reads the `tools` object it was given on every step — the per-step
   * advertisement is `Object.entries(tools)` and execution looks up `tools[name]` at call time — so a
   * map refreshed IN PLACE between steps is the live set, with no second loop and no fork of the SDK.
   * Replacing the object would do nothing; mutating it is the mechanism.
   *
   * Only the PAGE's part moves. The catalog's MCP tools and the loop-provided wait tool are fixed for
   * the turn, so they are set aside once and the page's current tools are laid over them. The
   * sub-agent partition is re-run on the result, because a newly mounted component may declare a
   * sub-agent or a tool one reserves — and it is re-run only when the page's tool NAMES changed,
   * because each pass reads every sub-agent's config over the socket.
   */
  const pageToolNames = () => (session?.tools() ?? []).map(descriptor => descriptor.name).sort().join('\n')
  const startingPageTools = new Set((session?.tools() ?? []).map(descriptor => descriptor.name))
  const fixedTools = Object.fromEntries(Object.entries(tools).filter(([name]) => !startingPageTools.has(name)))
  const liveTools: Record<string, Tool> = {}
  const assembleTools = async () => {
    const { mainTools } = await partitionSubAgents(
      { ...fixedTools, ...(session ? browserToolSet(session) : {}) },
      buildDelegation
    )
    for (const name of Object.keys(liveTools)) if (!(name in mainTools)) delete liveTools[name]
    Object.assign(liveTools, mainTools)
  }
  await assembleTools()
  let assembledFrom = pageToolNames()

  const result = streamText({
    model,
    system: buildSystemPrompt(autonomousAgent),
    messages: history,
    // Always the live map, even empty: `undefined` would freeze "no tools" for the whole turn, while an
    // empty object is "no tools for this step" and fills in when the page registers one.
    tools: liveTools,
    stopWhen: [
      stepCountIs(STEP_LIMIT),
      repeatedCallGuard(),
      // Appended to the guards, never replacing them: a turn can be stopped by any of the
      // three and each has its own stop reason.
      () => budgetExceeded
    ],
    prepareStep: async options => {
      const current = pageToolNames()
      if (current !== assembledFrom) {
        assembledFrom = current
        await assembleTools()
        debug('tool set refreshed mid-turn: %d tool(s)', Object.keys(liveTools).length)
      }
      return loopGuardPrepareStep(options)
    },
    // The SDK's own bounds, which are finer than the wall clock this turn is also raced against:
    //
    //  - chunkMs is an IDLE watchdog, and it closes a real gap. The browser loop has had one all along
    //    (it arms a timer per stream part); the server had only the whole-turn ceiling, so a provider
    //    that accepted the request and then went quiet held the conversation's lock for the full
    //    autonomousAgentRunTimeoutSeconds. Same constant on both sides, from shared/.
    //  - totalMs is defence in depth. The outer Promise.race in runTurn still exists and is not
    //    redundant: it covers the whole turn — resolving the agent, opening MCP connections, compaction
    //    — whereas this bounds only the model stream.
    timeout: {
      totalMs: config.autonomousAgentRunTimeoutSeconds * 1000,
      chunkMs: STREAM_IDLE_TIMEOUT_MS
    },
    onStepFinish: async (step) => {
      const usage = step.usage
      const details = (usage as any)?.inputTokenDetails
      const stepCredits = computeCreditBreakdown(
        {
          inputTokens: usage?.inputTokens ?? 0,
          outputTokens: usage?.outputTokens ?? 0,
          noCacheTokens: details?.noCacheTokens,
          cacheReadTokens: details?.cacheReadTokens,
          cacheWriteTokens: details?.cacheWriteTokens
        },
        entry,
        config.eurosPerCredit
      )
      inputTokens += usage?.inputTokens ?? 0
      outputTokens += usage?.outputTokens ?? 0
      cacheReadTokens += details?.cacheReadTokens ?? 0
      cacheWriteTokens += details?.cacheWriteTokens ?? 0
      credits += stepCredits.total
      creditBreakdown.input += stepCredits.input
      creditBreakdown.cachedInput += stepCredits.cachedInput
      creditBreakdown.output += stepCredits.output
      // On the RUN as well as in usage, per step, so an abandoned turn's later steps still
      // show up and the two never disagree.
      await incrementRunSpend(run.id, stepCredits.total, 1)
      if (stepCredits.total > 0) {
        // Recorded per step, not once per turn: a turn stopped by the budget or the clock
        // must still bill what it actually consumed.
        await recordUsage(run.owner, {
          cost: stepCredits.total,
          userId: identity.usageUserId,
          userName: identity.usageUserName,
          dimensions: {
            modelRole: 'assistant',
            model: entry.id,
            profile: identity.role,
            tokenCosts: { input: stepCredits.input, cachedInput: stepCredits.cachedInput, output: stepCredits.output }
          }
        })
      }
      // The ACCOUNT cap, re-read after recording this step. enforceQuotas ran once before the loop, so
      // a turn that was under the cap when it started could spend its whole per-run budget past an
      // exhausted one — and since nothing caps concurrent runs, N conversations posted together each
      // overshot by that much. Checking between steps bounds the overshoot to about one step per run.
      //
      // Deliberately only the account cap, not all of enforceQuotas: the role and pool checks are about
      // the caller and cannot change mid-run, while this is the shared resource other runs are draining.
      //
      // Checked BEFORE the per-run budget so that when both ceilings are crossed by the same step, the
      // reader is told the one an admin can act on. Either way the turn stops.
      const accountCap = await checkAccountCreditCap(run.owner)
      if (accountCap) {
        budgetExceeded = true
        stopDetail = `${accountCap.reason} (${accountCap.scope}, ${accountCap.period} limit ${accountCap.limit}, used ${accountCap.usage}). Resets at ${accountCap.resetsAt}.`
      } else if (credits >= config.autonomousAgentRunCredits) {
        budgetExceeded = true
      }
    },
    abortSignal
  })

  // The turn's parts, in the order the model produced them. This IS the record: everything the model
  // saw has to end up here, or a revived conversation is a different conversation.
  const parts: MessagePart[] = []
  liveTurns.set(run.conversationId, { messageSeq, parts: () => parts })
  const appendText = (kind: 'text' | 'reasoning', delta: string) => {
    const last = parts[parts.length - 1]
    // Merged into the trailing part of the same kind rather than pushed per delta, or a turn would
    // store thousands of one-token parts.
    if (last && last.type === kind) { last.text = String(last.text ?? '') + delta; return }
    parts.push({ type: kind, text: delta })
  }

  /**
   * Stream to the browser, if one is watching.
   *
   * The text is not persisted as it streams — the store gets it at the end, and a page attaching
   * mid-turn is served from `liveTurns` — so this is the only way it reaches anyone before then. The
   * session merges deltas only within `DELTA_FLUSH_MS`, below a display frame, so the person still
   * sees the answer arrive as it is produced. That is the thing the delta protocol this branch deleted
   * was trying to do over HTTP.
   *
   * Best-effort: send already checks the socket is open, and a person who closed the tab mid-turn must
   * not fail the turn — it finishes and is stored.
   */
  const stream = (kind: 'text' | 'reasoning', delta: string) => {
    watcher()?.send({ type: 'delta', kind, text: delta })
  }

  /**
   * What the assistant is doing, in the vocabulary the chat already renders.
   *
   * The server is the only thing that knows this now, and it knows it better than the browser loop did:
   * it sees the step boundaries, the tool results and the compaction directly rather than inferring
   * them from a stream. `null` clears the label.
   */
  const activity = (value: ChatActivity | null) => {
    // WHILE A WAIT IS PENDING, THE WAIT OWNS THE LABEL. The SDK runs a tool as soon as it parses the
    // call, ahead of this loop reading the stream, so the loop's own updates arrive late: a result
    // from the step before, read after the wait has started, set "Analyzing tool result…" over
    // "Waiting for …", and the person was no longer told the turn was theirs. The wait sets and
    // clears its own label (createWaitTool's onWaiting/onDone, which do not go through here).
    if (session?.hostEvents.isWaiting()) return
    watcher()?.send({ type: 'activity', activity: value })
  }

  /**
   * Complete a tool call in place, by its id.
   *
   * By ID rather than "the last part": a step may issue several calls in parallel, and their results
   * arrive interleaved. A call with no matching part cannot happen — the stream always announces the
   * call first — but if it ever did, appending a resultless part would produce a history the provider
   * rejects, so the update is simply dropped.
   */
  const settleToolPart = (
    toolCallId: string,
    // Typed rather than `Record<string, unknown>`: the two callers settle a call with exactly these
    // shapes, and a loose record is how `truncated` arrived as `unknown` and had to be cast back.
    settled:
      | { state: 'output-available', output: string, truncated?: { totalChars: number } }
      | { state: 'output-error', errorText: string }
  ) => {
    // Narrowed to the dynamic-tool variant rather than indexed blindly: `toolMetadata` exists only
    // there, and under the old open `UIPart` this read compiled against any part at all.
    const call = parts.find(part => part.type === 'dynamic-tool' && part.toolCallId === toolCallId)
    if (!call || call.type !== 'dynamic-tool') return
    const { truncated, ...rest } = settled as { truncated?: { totalChars: number } } & Record<string, unknown>
    Object.assign(call, rest)
    // `as JSONObject` and not `as any`: the values here ARE json (a server id, a char count, MCP
    // annotations), but they arrive typed as `Record<string, unknown>` from the MCP client and TS
    // cannot see through that to the library's JSONValue. The cast is about the declaration, not
    // about the data.
    // Written field by field rather than spread: the library types this slot as a JSONObject, and a
    // spread of the destructured value widens to {} which no longer overlaps it.
    if (truncated) call.toolMetadata = { ...call.toolMetadata, truncated: { totalChars: truncated.totalChars } }
  }

  let sawText = false

  // The growing text, written back on a clock ONLY WHEN NO AGENT SESSION WATCHES. A watching socket
  // has every token already, and a page attaching to it mid-turn is served from `liveTurns`; but a
  // reader following over HTTP — an autonomous agent's thread page, which refetches `?sinceVersion=`
  // on each notification — has only the store, and would otherwise see the answer appear at the end.
  // So a chat turn writes its text once, and a thread followed over HTTP still sees it grow.
  let lastPersistAt = 0
  let lastPersistedLength = -1
  const persistPartial = async () => {
    if (watcher()) return
    const now = Date.now()
    if (now - lastPersistAt < PARTIAL_PERSIST_INTERVAL_MS) return
    const length = partsText(parts).length
    if (length === lastPersistedLength) return
    lastPersistAt = now
    lastPersistedLength = length
    await updateMessage(run.conversationId, messageId, { parts, pending: true })
  }

  /**
   * Push the turn's STRUCTURE to a watching page: the stored parts as they stand.
   *
   * One frame type rather than a parallel stream vocabulary. What a client renders is the conversation
   * of record, so the same mapper serves the live chat and a thread reopened later and there is no
   * second format to keep in step. `stream` stays for token-level smoothness; this carries tool calls
   * and their states, step boundaries and reasoning — which change per tool call, not per token, so it
   * rides the persist clock rather than the delta one.
   */
  const sendMessageFrame = (pending: boolean) => {
    watcher()?.send({ type: 'message', seq: messageSeq, role: 'assistant', parts, pending })
  }

  /**
   * Persist the turn's structure NOW, when a call opens or settles — the only writes before the end.
   *
   * Two readers need it. A turn interrupted mid-call is settled from the STORED parts (runTurn's catch
   * path has nothing else), so a wait not yet written would be invisible there
   * and replay would drop it — the model would never learn it had been waiting. And a page reloaded
   * during a wait has to show the wait. Calls are few per turn, so this costs a write per call, not
   * per token.
   */
  const persistStructure = async () => {
    await updateMessage(run.conversationId, messageId, { parts, pending: true })
  }

  // THINKING, from the moment the turn is handed to the model until it says something.
  //
  // The loop cleared this label on the first token and never set it, so the gap before that token —
  // the only time it has anything to explain — showed nothing at all: a person who asked a question of
  // a slow provider watched a still, silent chat. The browser loop set it locally, which is why the
  // regression survived the move: the frame it replaced was never sent.
  activity({ kind: 'thinking' })

  for await (const part of result.fullStream) {
    // 'error' parts do NOT throw — an unhandled one is how a conversation silently dropped
    // before. Turn it into a real failure so the caller reports it.
    if (part.type === 'error') throw part.error instanceof Error ? part.error : new Error(String(part.error))
    if (part.type === 'text-delta') {
      // Visible output means the label has nothing left to explain.
      if (!sawText) { sawText = true; activity(null) }
      appendText('text', part.text)
      stream('text', part.text)
      await persistPartial()
    }
    if (part.type === 'reasoning-delta') {
      appendText('reasoning', part.text)
      stream('reasoning', part.text)
    }
    // A step boundary, recorded as a part. LOAD-BEARING, not decoration: it is what
    // `convertToModelMessages` splits the turn's assistant messages on, so without it text the model
    // produced AFTER a tool result is replayed inside the assistant message that made the call —
    // before the tool message answering it. A leading one is harmless; it emits no empty message.
    if (part.type === 'start-step') parts.push({ type: 'step-start' })
    // ONE part per tool call, moved through the library's states — not a call part followed by a
    // result part. That pairing is what `convertToModelMessages` reconstructs the
    // assistant/tool message pair from, and it is why a failed call is no longer shaped like a
    // successful one: the failure is the part's STATE, which nothing downstream can drop.
    if (part.type === 'tool-call') {
      // A WAIT HANDS THE TURN TO THE PERSON, and its `message` is what tells them what to do: it is
      // added to the step's own text, just before the call, unless the step already says it. Stored,
      // not only streamed, so a reloaded thread and a reviewed one show the same handover — and
      // before the call rather than after it, because text after a tool call is replayed to the model
      // as a separate message it never wrote.
      if (part.toolName === WAIT_TOOL_NAME) {
        const stepStart = parts.map(p => p.type).lastIndexOf('step-start')
        const stepText = partsText(parts.slice(stepStart + 1))
        const handover = waitHandover(stepText, part.input)
        if (handover) {
          // The step's text as main's builder left it: trailing whitespace dropped, so the separator
          // is exactly one blank line.
          const last = parts[parts.length - 1]
          if (last?.type === 'text') last.text = String(last.text ?? '').trimEnd()
          appendText('text', handover)
          stream('text', handover)
          // The activity is deliberately left alone. The SDK starts executing a tool before this loop
          // reads its call from the stream, so the wait has usually already set "Waiting for …" by
          // now — clearing the label here, as the first text-delta does, erased exactly that.
        }
      }
      parts.push({
        type: 'dynamic-tool',
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        state: 'input-available',
        // The real arguments, not a summary of them: the stored conversation is the reference copy,
        // so a revived turn has to replay the call the model actually made. The summary is for the
        // trace, which is a description rather than a record.
        input: part.input,
        // Built by spreading presence rather than assigning possibly-undefined values: the library
        // types this slot as a JSONObject, which has no room for `undefined`, and a browser tool has
        // no catalog server to name.
        toolMetadata: {
          ...(serverByTool.get(part.toolName) ? { serverId: serverByTool.get(part.toolName) } : {}),
          ...(annotationsByTool.get(part.toolName) ? { annotations: annotationsByTool.get(part.toolName) } : {})
        } as JSONObject
      })
      // Immediately, not on the persist clock: a tool chip appearing is what tells the person the
      // assistant is doing something, and a call can take seconds. Waiting for the next token would
      // show the chip after the work it describes.
      sendMessageFrame(true)
      await persistStructure()
      if (part.toolName.startsWith('subagent_')) activity({ kind: 'subagent', name: part.toolName, phase: 'starting' })
    }
    // The RESULT, stored because the conversation is revivable: without it a later turn replays a
    // call with no answer, which providers reject — so the old shape had to drop the call too, and
    // the model resumed unable to see either the data or the fact that it had acted.
    //
    // Stored as the model received it, envelope included (withProvenance wraps before this point),
    // because the guarantee is that a revived conversation reproduces what the model saw.
    if (part.type === 'tool-result') {
      const output = (part as any).output
      const text = typeof output === 'string'
        ? output
        : (output && typeof output === 'object' && 'value' in output)
            ? String((output as any).value)
            : JSON.stringify(output ?? '')
      const bounded = boundToolResult(text)
      settleToolPart(part.toolCallId, {
        state: 'output-available',
        output: bounded.result,
        truncated: bounded.truncated
      })
      sendMessageFrame(true)
      await persistStructure()
      // The model now has a result to read. `subAgent` is set when the tool WAS a delegation, so the
      // label can name it — the one case where the bottom line says more than "analyzing".
      activity({
        kind: 'analyzing',
        ...(part.toolName.startsWith('subagent_') ? { subAgent: part.toolName } : {})
      })
    }
    // A tool that failed does not stop the turn — the model sees the error and usually keeps
    // talking — so without recording it a failed call reads exactly like a successful one.
    // That is not hypothetical: it hid a broken tool path for the whole of this plan.
    //
    // `output-error` is the library's own state for it, so the distinction survives every conversion:
    // the previous shape carried it as an extra `failed` flag on a result part, which
    // `convertToModelMessages` has no reason to look at.
    if (part.type === 'tool-error') {
      const detail = (part as any).error instanceof Error ? (part as any).error.message : String((part as any).error)
      settleToolPart(part.toolCallId, { state: 'output-error', errorText: boundToolResult(detail).result })
      sendMessageFrame(true)
      await persistStructure()
      debug('tool failed tool=%s error=%s', part.toolName, detail)
    }
  }

  const steps = (await result.steps).length
  const finishReason = await result.finishReason

  // The turn's own model call. `content` and the tool calls are NOT recorded here: they are the
  // assistant message, already persisted as the conversation. Recording them again is exactly the
  // duplication the `trace-requests` collection was.
  recordCall(run, {
    modelRole: 'assistant',
    entry,
    usage: { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens },
    credits,
    creditBreakdown,
    durationMs: Date.now() - startedAt,
    finishReason,
    steps,
    messageCount: history.length,
    historyUpToSeq: messageSeq
  })
  // The instructions, recorded ONCE per run rather than on every call: they do not change within a
  // turn, and they are what a reviewer needs that the conversation does not contain.
  setRunSystemPrompt(run.id, buildSystemPrompt(autonomousAgent))
    .catch(err => console.error('could not record the run system prompt', err))
  // A guard-stopped turn is a truncation, not a provider error: the model still wanted to
  // call tools when a cap cut it off. The budget is checked first because it is the reason
  // that is not otherwise visible from the finish reason.
  // All three of budget/step-limit/repeated-calls mean the same thing — the model wanted to
  // keep going and was stopped — which is why they all hang off finishReason 'tool-calls'.
  // A turn that answered and finished is `completed` even if its last step happened to
  // cross the budget: reporting 'budget' there would tell a reader the answer was cut off
  // when it was not.
  const stopReason: RunStopReason = finishReason === 'tool-calls'
    ? (budgetExceeded ? 'budget' : steps >= STEP_LIMIT ? 'step-limit' : 'repeated-calls')
    : 'completed'

  // An empty completion is a known provider failure mode with its own mock seam, and the
  // browser loop has a fallback for it. Without one here the turn persists a blank message
  // and a green run — the "conversation that simply stops" this module forbids.
  //
  // Only when the turn OTHERWISE COMPLETED, though: a turn cut off by a guard, a budget or
  // the clock has no text by nature (it was mid-tool-chain), and runTurn appends that stop
  // reason's notice as its content. Treating those as empty completions would relabel every
  // truncation as a provider error.
  const emptyCompletion = stopReason === 'completed' && partsText(parts).trim().length === 0
  const finalParts = emptyCompletion ? withAppendedText(parts, EMPTY_COMPLETION_MESSAGE) : parts
  if (emptyCompletion) {
    // LOGGED, because it is a provider anomaly rather than a normal turn, and the person only ever
    // sees the generic fallback. The browser loop warned to the devtools console for exactly this
    // reason; on the server the operator's log is where that belongs. Ids only — no content, since
    // this line is for diagnosis, not for a second copy of the conversation.
    console.warn(`[empty completion] treated as a bug: run ${run.id} of conversation ${run.conversationId} produced no text (model ${entry.id}, ${steps} step(s))`)
  }
  // The last word on this turn's structure, with pending cleared — so a page stops rendering it as in
  // progress without having to infer that from `turn-end`.
  watcher()?.send({ type: 'message', seq: messageSeq, role: 'assistant', parts: finalParts, pending: false })
  return {
    parts: finalParts,
    steps,
    credits,
    stopDetail,
    // The frame above was the settled one; runTurn must not send a second.
    published: true,
    stopReason: emptyCompletion ? 'error' : stopReason,
    // The fallback above IS the explanation; a generic notice on top would be a second one.
    ...(emptyCompletion ? { selfExplained: true } : {})
  }
}

/**
 * Run one turn to a terminal state.
 *
 * The assistant message is created BEFORE the turn runs, `pending: true`, for two reasons:
 * a reader sees the turn exists while it is being produced, and a throw still has a message
 * to write the failure into rather than needing to invent one afterwards.
 */
export const runTurn = async (run: ConversationRun): Promise<void> => {
  const conversation = await mongo.conversations.findOne(
    { id: run.conversationId },
    { projection: { _id: 0 } }
  )
  if (!conversation) {
    // The conversation was deleted under us; there is nowhere to put a message, so the run
    // is all that can be closed out.
    await finishRun(run, { status: 'error', stopReason: 'error', error: 'conversation no longer exists' })
    return
  }

  const abortController = new AbortController()
  liveRuns.set(run.id, { controller: abortController, agentId: run.agentId, conversationId: run.conversationId })

  // The ceiling has to be enforced twice over, because abort() is only a REQUEST.
  // abortController.signal asks the provider and the MCP client to stop, which is what a
  // well-behaved fetch-based client does; but a client that ignores the signal would hold
  // the conversation's lock until the lock's own TTL expired. So the turn is also raced
  // against the deadline and abandoned if it overruns. Abandoning is safe: performTurn only
  // returns a value, it never writes — all persistence happens here.
  let timeout: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      abortController.abort(new Error('run timeout'))
      reject(new Error(`run exceeded its ${config.autonomousAgentRunTimeoutSeconds}s ceiling`))
    }, config.autonomousAgentRunTimeoutSeconds * 1000)
  })

  let message: ConversationMessage | undefined

  try {
    // Inside the try: appendMessage can fail (the conversation vanished between the findOne
    // above and the $inc, a duplicate seq, a transient mongo error) and that must still
    // close the run out rather than escape and leave it `running` forever.
    message = await appendMessage(conversation, {
      role: 'assistant',
      author: { kind: 'autonomous-agent', userName: conversation.title },
      parts: [],
      runId: run.id,
      pending: true
    })

    // The assistant message's own seq bounds the history: it was created before the turn
    // (empty, pending), so it must not be fed back to the model as an empty turn.
    const result = await Promise.race([performTurn(run, message.seq, message.id, abortController.signal), deadline])
    // A turn that stopped for a reason other than finishing explains itself, appended to
    // whatever it did manage to produce.
    const notice = result.stopReason === 'completed' || result.selfExplained
      ? ''
      : runStopReasonMessage(result.stopReason, result.stopDetail)
    const finalParts = notice ? withAppendedText(result.parts, notice) : result.parts
    await updateMessage(run.conversationId, message.id, {
      parts: finalParts as any,
      pending: false
    })
    // PUBLISHED FOR THE PATHS THE LOOP NEVER REACHED: a moderation block, a quota refusal and a
    // missing non-human identity all return their refusal before any model call, so the loop's own
    // settled frame never ran — the text was stored and the watching page was told nothing. A blocked
    // message showed the person an empty turn and a stopped spinner, with the refusal they were
    // supposed to read sitting in the database until a reload.
    if (!result.published) {
      sessionFor(run.conversationId)?.send({
        type: 'message',
        seq: message.seq,
        role: 'assistant',
        parts: finalParts as any,
        pending: false
      })
    }

    // A run stopped by a guard or a budget is still a completed run: it did work and said
    // so. But a turn that REFUSED — no enrolled identity, an exhausted credit cap — returns
    // stopReason 'error' without throwing, and must not be reported as done.
    // steps/credits are not written here: incrementRunSpend owns them, so a turn abandoned
    // at its deadline cannot end up reporting less than it actually spent.
    await finishRun(run, {
      status: result.stopReason === 'error' ? 'error' : 'done',
      stopReason: result.stopReason
    })
    // The conversation's total, now including this turn, then the end-of-turn signal — so a page that
    // refreshes on turn-end already holds the new figure.
    // Best-effort: a figure for a display must never turn a finished turn into a failed one.
    await sendConversationCost(run.conversationId).catch(() => {})
    // The end-of-turn signal, so a watching page stops its spinner without polling for it.
    sessionFor(run.conversationId)?.send({
      type: 'turn-end',
      stopReason: result.stopReason,
      ...(result.stopDetail ? { detail: result.stopDetail } : {})
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    // An abort is not a failure of the turn: distinguish the clock from a caller pressing
    // stop, and from a genuine error, because a reader reacts differently to each.
    const aborted = abortController.signal.aborted
    const timedOut = aborted && /timeout/i.test(String((abortController.signal as any).reason?.message ?? ''))
    const stopReason: RunStopReason = timedOut ? 'timeout' : aborted ? 'aborted' : 'error'
    // The message is finalised FIRST, and the run closed after, because the terminal `run`
    // event is the end-of-turn signal a subscriber stops listening on: closing the run first
    // would leave every failed, aborted and timed-out turn showing a message stuck `pending`.
    //
    // This does NOT give up the guarantee that sent these two the other way round originally —
    // that whatever brought us here (a mongo blip, a shutdown) is likely to fail the message
    // write too, and a run left `running` is worse than a message left without its notice,
    // since the run is what every reader and the boot sweep key on. That is preserved by
    // CATCHING the message write rather than by ordering it last: finishRun still runs.
    //
    // No message exists if appendMessage itself failed; the run then carries the failure alone.
    if (message) {
      // APPENDED to what was persisted, not replacing it. `message` is the empty document created
      // before the turn, so the partial text and the tool traffic the executor has since written live
      // only in the store — replacing the parts here would delete the record of everything the turn
      // actually did, which is exactly what must survive a failure.
      // From MEMORY when the turn ran here, which is the common case: the answer's text is written
      // only at the end, so the store holds the tool traffic but not what was said around it — a
      // reply stopped mid-sentence would lose its words from the record. The store is the fallback for
      // a turn that never got as far as producing parts.
      const live = liveTurns.get(run.conversationId)
      const persisted = live && live.messageSeq === message.seq
        ? { parts: structuredClone(live.parts()) }
        : await mongo.messages
          .findOne({ id: message.id }, { projection: { _id: 0, parts: 1 } })
          .catch(() => null)
      // Every call still open gets a result saying why it never completed (port of main's #73): a call
      // with no result is dropped on replay, so the model would never learn what it had been doing —
      // judged runs then denied work they had done and redid it.
      const reason = aborted ? interruptReason((abortController.signal as AbortSignal & { reason?: unknown }).reason) : 'ended'
      const settled = settleInterruptedParts((persisted?.parts ?? []) as MessagePart[], reason)
      await updateMessage(run.conversationId, message.id, {
        // No stop notice when the person SPOKE: their message follows and answers it, and the notice
        // would be replayed to the model as its own words. Stop, the clock and errors keep theirs.
        parts: (reason === 'message' ? settled : withAppendedText(settled, runStopReasonMessage(stopReason, detail))) as any,
        pending: false
      })
        .catch(updateErr => console.error('autonomous agent message could not be finalised', updateErr))
      // Same reason as the success path: the notice explaining the failure has to reach the page that
      // is watching, not only the store. `turn-end` alone stops the spinner without saying why.
      const finalised = await mongo.messages
        .findOne({ id: message.id }, { projection: { _id: 0, parts: 1, seq: 1 } })
        .catch(() => null)
      if (finalised) {
        sessionFor(run.conversationId)?.send({
          type: 'message',
          seq: finalised.seq,
          role: 'assistant',
          parts: (finalised.parts ?? []) as any,
          pending: false
        })
      }
    }
    await finishRun(run, {
      status: stopReason === 'timeout' ? 'error' : aborted ? 'aborted' : 'error',
      stopReason,
      error: detail
    }).catch(finishErr => console.error('autonomous agent run could not be closed out', finishErr))
    // A failed turn ends the same way for a watcher as a successful one: the page must stop waiting
    // whatever happened. "Failure is a message, not a silence" applies to the socket too.
    //
    // LAST, as on the success path, and that order is the contract: `turn-end` means "the record is
    // final". It used to go out first, before the message was settled — so anything reacting to it,
    // a client refetching or a test reading the record, could see an interrupted turn's calls still
    // open. Found by the interrupted-turn api spec, which passed alone and failed in sequence.
    await sendConversationCost(run.conversationId).catch(() => {})
    sessionFor(run.conversationId)?.send({ type: 'turn-end', stopReason, detail })
  } finally {
    if (timeout) clearTimeout(timeout)
    liveRuns.delete(run.id)
    // Only now: the catch path above settles the turn FROM it. Keyed by the message, so a later turn
    // of the same conversation that already registered is left alone.
    if (message && liveTurns.get(run.conversationId)?.messageSeq === message.seq) liveTurns.delete(run.conversationId)
  }
}

/**
 * Kick a turn. Callers do NOT await this — the message route returns as soon as the user
 * message is persisted, and the run document is how a caller follows along.
 *
 * When the lock is already held, this returns immediately and leaves the run `running`:
 * the holder picks it up through nextPendingRun. Nobody is rejected and no message is
 * dropped. The outer loop exists because a post can land between the holder's last
 * nextPendingRun check and its release, which would otherwise orphan that run forever.
 */
export const startRun = async (run: ConversationRun): Promise<void> => {
  const lockId = conversationLockId(run.conversationId)
  while (true) {
    if (!await locks.acquire(lockId, LOCK_ORIGIN)) return
    try {
      let current: ConversationRun | null = await nextPendingRun(run.conversationId)
      while (current) {
        await runTurn(current)
        current = await nextPendingRun(run.conversationId)
      }
    } finally {
      // In a finally so a throw cannot wedge the conversation permanently.
      await locks.release(lockId)
    }
    if (!await nextPendingRun(run.conversationId)) return
  }
}

/**
 * Recover runs that are `running` with nobody running them.
 *
 * ONE function with ONE rule, because there are two correct answers and which applies depends on
 * whether the turn had already begun:
 *
 *  - it HAS an assistant message  -> it started, so its tool calls may already have fired. Mark it
 *    `interrupted`. Re-running it would execute those side effects a second time (at-least-once on a
 *    catalog that may contain writes) and append a second assistant message for one run.
 *  - it has NO assistant message  -> it died between createRun and appendMessage, so nothing can have
 *    happened yet. Resume it: interrupting would throw away a turn the instructor is waiting for.
 *
 * `runTurn` appends that message before `performTurn` opens the agent's tools, which is what makes the
 * test exact rather than a guess.
 *
 * This replaced two mechanisms that took OPPOSITE actions on the identical population — a boot sweep
 * marking them `interrupted` and a 30s reaper resuming them — where only ordering (the sweep runs
 * first) kept a single-instance deployment from noticing.
 *
 * A held conversation lock means another instance is executing that conversation right now, so those
 * are skipped entirely. Because a lock's TTL is refreshed only by its holder, a dead process's lock
 * expires and its runs are recovered on a later pass.
 */
export const recoverOwnerlessRuns = async (): Promise<{ interrupted: number, resumed: number, skipped: number }> => {
  const candidates = await mongo.runs
    .find({ status: 'running' }, { projection: { _id: 0 } })
    .toArray()

  const heldLocks = new Set(
    (await mongo.db.collection<{ _id: string }>('locks')
      .find({ _id: { $regex: `^${conversationLockId('')}` } }, { projection: { _id: 1 } }).toArray())
      .map(doc => String(doc._id).slice(conversationLockId('').length))
  )
  const ownerless = candidates.filter(run => !heldLocks.has(run.conversationId) && !liveRuns.has(run.id))
  const skipped = candidates.length - ownerless.length

  let interrupted = 0
  let resumed = 0
  for (const run of ownerless) {
    const existing = await mongo.messages.findOne(
      { runId: run.id, role: 'assistant' },
      { projection: { _id: 0 } }
    )
    if (!existing) {
      resumed++
      // Not awaited as a group: each acquires the conversation lock itself and drains from there.
      startRun(run).catch(err => console.error('autonomous agent run failed to resume', err))
      continue
    }
    interrupted++
    // stopReason has no 'interrupted' member — the status carries that — so the reason is
    // 'error' with the restart named as the detail.
    const notice = runStopReasonMessage('error', 'interrupted by a restart')
    await updateMessage(run.conversationId, existing.id, {
      parts: withAppendedText(existing.parts, notice),
      pending: false
    })
    await finishRun(run, { status: 'interrupted', stopReason: 'error', error: 'interrupted by a restart' })
  }

  if (interrupted) console.log(`[autonomous-agents] interrupted ${interrupted} started run(s) left behind by a dead process`)
  if (resumed) console.log(`[autonomous-agents] resumed ${resumed} run(s) that had not started yet`)
  if (skipped) console.log(`[autonomous-agents] left ${skipped} running run(s) alone: another instance holds their conversation`)
  return { interrupted, resumed, skipped }
}
