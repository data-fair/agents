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
import { streamText, generateText, stepCountIs, type ModelMessage, type Tool } from 'ai'
import { STEP_LIMIT, repeatedCallGuard, loopGuardPrepareStep, STREAM_IDLE_TIMEOUT_MS } from '../agent-loop/agent-loop-guards.ts'
import { decideContextManagement, clearOldToolResults } from '../agent-loop/compaction-policy.ts'
import { summarizeToolArguments } from '@agents/shared/tool-arguments'
import { compactionSystemPrompt, recapMessage } from '../agent-loop/compaction-prompt.ts'
import type { AutonomousAgent, AutonomousAgentMessage, AutonomousAgentRun } from '#types'
import {
  runStopReasonMessage, buildSystemPrompt, withProvenance,
  storedTurnsToModelMessages, alignCutToStoredMessage,
  boundToolResult, partsText, withAppendedText,
  type RunStopReason, type UIPart
} from './operations.ts'
import { appendMessage, updateMessage, finishRun, incrementRunSpend, saveCompaction, resolveAgent } from './service.ts'
import { recordTraceRequest } from '../traces/service.ts'
import { getSettings } from '../settings/service.ts'
import { resolveRoleModel } from '../models/service.ts'
import { contextBudget } from '../models/operations.ts'
import { computeCreditBreakdown } from '../usage/operations.ts'
import { openAutonomousAgentTools } from '../mcp-servers/client.ts'
import { nhiSessionProvider, forwardedSessionProvider } from '../agent-identity/service.ts'
import { sessionFor } from '../agent-session/registry.ts'
import { isStandardAgentId } from '../agent-session/standard-agents.ts'
import type { AgentSession } from '../agent-session/session.ts'
import type { ChatActivity } from '@agents/shared/agent-activity'
import { browserToolSet } from '../agent-session/browser-tools.ts'
import { createWaitTool, withHostContext, WAIT_TOOL_NAME } from '@agents/shared/host-events'
import { enforceQuotas, checkAccountCreditCap, type UsageIdentity } from '../usage/enforce.ts'
import { recordUsage } from '../usage/service.ts'

/**
 * How an autonomous run's spend is attributed.
 *
 * resolveUsageIdentity needs an Express request, which an executor has not got, so the
 * identity is constructed here. Keyed on the AGENT, not on whoever sent the last message:
 * an autonomous agent is an org-owned service identity, not a person, and P2's scheduled
 * runs will have no instructing user at all. Keying per agent also makes the existing
 * per-user usage histogram read as spend per autonomous agent, which is what an org admin
 * needs. Content attribution stays per person, on each message's `author`.
 *
 * role 'admin' means no per-profile quota applies: the account credit cap and the per-run
 * budget are the real bounds, which is what the spec specifies for autonomous runs.
 */
const usageIdentityFor = (autonomousAgent: { id: string, title: string }): UsageIdentity => ({
  trackPerUser: true,
  usageUserId: `autonomous-agent:${autonomousAgent.id}`,
  usageUserName: autonomousAgent.title,
  role: 'admin',
  isUntrusted: false
})

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
const liveRuns = new Map<string, { controller: AbortController, autonomousAgentId: string }>()

/** True when this process actually aborted a live turn. */
export const abortRun = (runId: string): boolean => {
  const live = liveRuns.get(runId)
  if (!live) return false
  live.controller.abort()
  return true
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
export const abortRunsOfAgent = (autonomousAgentId: string): number => {
  let stopped = 0
  for (const live of liveRuns.values()) {
    if (live.autonomousAgentId !== autonomousAgentId) continue
    live.controller.abort(new Error('autonomous agent stopped'))
    stopped++
  }
  return stopped
}

/** One conversation is one serialised timeline, so the lock is keyed on it. */
const conversationLockId = (conversationId: string) => `autonomous-agent-conversation:${conversationId}`

/** What one turn produced. The model loop replaces the body that fills this in. */
interface TurnResult {
  /** The turn's ordered parts — the record itself, not a rendering of it. */
  parts: UIPart[]
  steps: number
  credits: number
  stopReason: RunStopReason
  /** Which ceiling stopped it, when the stop reason alone would be ambiguous. */
  stopDetail?: string
}

/**
 * The oldest run of this conversation that still needs doing.
 *
 * This is what stops a message from being dropped: a post that arrives while another turn
 * holds the lock leaves its run `running`, and the holder comes back for it here.
 */
const nextPendingRun = async (conversationId: string) => {
  return await mongo.autonomousAgentRuns.findOne(
    { conversationId, status: 'running' },
    { projection: { _id: 0 }, sort: { startedAt: 1 } }
  )
}

/**
 * Record one model call of an autonomous run, when the org has asked for traces.
 *
 * Gated on `settings.storeTraces` alone, with no consent header — unlike the gateway. That
 * second gate exists because an in-page chat's messages live only in the user's browser, so
 * storing them server-side is a new disclosure needing the person's consent. An autonomous
 * conversation is ALREADY stored server-side by design, so a trace adds prompt/response detail
 * about data the org already holds, not a new category of it. There is also no browser in the
 * loop to ask, and scheduled runs will have no instructing user at all.
 *
 * Fire-and-forget with a logged catch, exactly as the gateway treats it: a trace is diagnostic,
 * and losing one must never cost a turn.
 */
const recordAutonomousTrace = (
  settings: Awaited<ReturnType<typeof getSettings>>,
  input: {
    run: AutonomousAgentRun
    identity: UsageIdentity
    contextId: string
    modelRole: string
    entry: ReturnType<typeof resolveRoleModel>['entry']
    body: unknown
    response: { content: string, toolCalls: { id: string, name: string, arguments: string }[], finishReason?: string }
    usage: { inputTokens: number, outputTokens: number, noCacheTokens?: number, cacheReadTokens?: number, cacheWriteTokens?: number }
    durationMs: number
  }
) => {
  if (settings.storeTraces !== true) return
  recordTraceRequest({
    owner: input.run.owner,
    userId: input.identity.usageUserId,
    userName: input.identity.usageUserName,
    // The conversation id, so a run's traces are retrievable beside its messages.
    conversationId: input.run.conversationId,
    contextId: input.contextId,
    modelRole: input.modelRole,
    providerName: input.entry.provider.name,
    providerType: input.entry.provider.type,
    resolvedModel: input.entry.id,
    body: input.body,
    response: input.response,
    usage: input.usage,
    prices: {
      inputPricePerMillion: input.entry.inputPricePerMillion,
      outputPricePerMillion: input.entry.outputPricePerMillion,
      cachedInputPricePerMillion: input.entry.cachedInputPricePerMillion
    },
    eurosPerCredit: config.eurosPerCredit,
    timing: { durationMs: input.durationMs }
  }).catch(err => console.error('autonomous agent trace could not be recorded', err))
}

/** The model's context for a turn, with the stored seq behind each message (see loadHistory). */
interface LoadedHistory {
  messages: ModelMessage[]
  seqs: number[]
  /** How many times this conversation has already been compacted. */
  generation: number
}

/**
 * The conversation so far, as model messages.
 *
 * A straight mapping, deliberately: the stored parts ARE the wire exchange, so reconstructing them
 * needs no inference and no second source. Completeness is structural rather than something this
 * function has to be careful about.
 *
 * It replaced a lossy flattening that stored tool calls without their RESULTS and dropped any turn
 * with no text — so a resumed conversation replayed `{role:'assistant',content:'done'}` for a turn
 * that had called a tool, and the model saw neither the result nor the fact that it had acted. See
 * storedTurnsToModelMessages for how a turn's steps are grouped back into assistant/tool pairs.
 */
const loadHistory = async (conversationId: string, upToSeq: number): Promise<LoadedHistory> => {
  const conversation = await mongo.autonomousAgentConversations.findOne(
    { id: conversationId },
    { projection: { _id: 0, compaction: 1 } }
  )
  const recap = conversation?.compaction
  // Only what the recap does NOT already cover. The messages it covers stay in the store untouched —
  // this is a cache for the MODEL's context, not a trim of the conversation.
  const stored = await mongo.autonomousAgentMessages
    .find(
      { conversationId, seq: recap ? { $gt: recap.coversUpToSeq, $lt: upToSeq } : { $lt: upToSeq } },
      { projection: { _id: 0 } }
    )
    .sort({ seq: 1 })
    .toArray()
  const { messages, seqs } = await storedTurnsToModelMessages(stored)
  if (!recap) return { messages, seqs, generation: 0 }
  // The recap is tagged with the last seq it covers, so alignCutToStoredMessage never tries to merge it
  // with the message after it (whose seq is strictly greater).
  return {
    messages: [recapMessage(recap.summary), ...messages],
    seqs: [recap.coversUpToSeq, ...seqs],
    generation: recap.generation
  }
}

/**
 * Bring the history back within budget: clear old tool results, re-measure, then summarise if needed.
 *
 * The decision is `decideContextManagement` in `shared/`, which the browser loop calls too — one policy,
 * not two that happen to agree. Only the APPLICATION is local: this rebuilds from stored parts and
 * persists a recap, the browser rewrites an in-memory array. See
 * docs/architecture/context-management.md.
 *
 * Unlike the browser loop, this has no provider-reported measurement of a previous turn to
 * work from — there is no prior response object in hand — so the whole history counts as
 * unmeasured and the decision runs on the character estimate alone. That is conservative in
 * the safe direction: it can compact slightly early, never slightly late. Expressed as a
 * PARAMETER to the shared decision (`lastInputTokens: 0`), not as a second implementation.
 *
 * A failure here is non-fatal. Continuing with the full history risks a context-overflow
 * error from the provider, which the caller turns into a message; losing the turn entirely
 * to a summarizer hiccup would be worse.
 */
const compactHistory = async (
  run: AutonomousAgentRun,
  identity: UsageIdentity,
  loaded: LoadedHistory,
  budget: number,
  settings: Awaited<ReturnType<typeof getSettings>>,
  abortSignal: AbortSignal
): Promise<{ messages: ModelMessage[], credits: number }> => {
  if (!budget) return { messages: loaded.messages, credits: 0 }
  const { history, clearing, compaction: decision } = decideContextManagement({
    history: loaded.messages,
    lastInputTokens: 0,
    appendedChars: JSON.stringify(loaded.messages).length,
    budget,
    // The REAL generation, read from the persisted recap. It was hardcoded to 0, which told the
    // summarizer every time that it was seeing raw exchanges — so a chained compaction was asked to
    // re-digest an existing recap instead of merging it, which is what compounds loss.
    generation: loaded.generation
  })
  // Clearing leaves the message LIST untouched — only payloads inside it — so `loaded.seqs` still lines
  // up with `history` and the cut alignment below is unaffected.
  if (clearing.clear) {
    debug('cleared %d old tool results, freeing ~%d tokens', clearing.clearedCount, clearing.freedTokens)
  }
  if (!decision.compact) {
    // The saving tier 1 exists for: over budget, brought back under it without a model call.
    debug('no compaction: %s', decision.reason)
    return { messages: history, credits: 0 }
  }
  // The recap is cached against a STORED MESSAGE boundary, so the cut has to land on one.
  const cut = alignCutToStoredMessage(loaded.seqs, decision.prefixToSummarize.length)
  if (cut <= 0) {
    debug('no compaction: the cut aligned away to nothing')
    return { messages: history, credits: 0 }
  }
  const prefixToSummarize = history.slice(0, cut)
  const retained = history.slice(cut)
  const coversUpToSeq = loaded.seqs[cut - 1]
  // Labelled only when a compaction is ACTUALLY going to happen — this point is past every reason not
  // to. An unconditional label before the decision would tell the person the assistant was compacting
  // on every turn, which is both wrong and the kind of thing nobody would notice was wrong.
  const watching = sessionFor(run.conversationId)
  watching?.send({ type: 'activity', activity: { kind: 'compacting' } })
  try {
    const { model, entry } = resolveRoleModel(settings, 'summarizer')
    const startedAt = Date.now()
    const system = compactionSystemPrompt(decision.generation - 1)
    const body = { messages: [{ role: 'user', content: JSON.stringify(prefixToSummarize) }] }
    const generated = await generateText({
      model,
      system,
      messages: body.messages as any,
      abortSignal
    })
    const summary = generated.text

    // A compaction is a real model call, so it is BILLED like one. It used to record only a trace —
    // itself gated on settings.storeTraces, which is off by default — so summarizer tokens reached no
    // ledger at all: not the run, not the account credit cap, not the usage histogram. The executor
    // talks to the provider directly rather than through the gateway, so nothing else would have.
    const compactionCredits = computeCreditBreakdown(
      {
        inputTokens: generated.usage?.inputTokens ?? 0,
        outputTokens: generated.usage?.outputTokens ?? 0
      },
      entry,
      config.eurosPerCredit
    )
    // 0 steps: the spend is real but a compaction is not a step of the turn, and inflating the step
    // count would make the step limit and the run's own record disagree.
    await incrementRunSpend(run.id, compactionCredits.total, 0)
    if (compactionCredits.total > 0) {
      await recordUsage(run.owner, {
        cost: compactionCredits.total,
        userId: identity.usageUserId,
        userName: identity.usageUserName,
        dimensions: {
          modelRole: 'summarizer',
          model: entry.id,
          profile: identity.role,
          tokenCosts: { input: compactionCredits.input, cachedInput: compactionCredits.cachedInput, output: compactionCredits.output }
        }
      })
    }

    // Traced too, so its cost is attributable rather than appearing as unexplained spend on the
    // turn beside it.
    recordAutonomousTrace(settings, {
      run,
      identity,
      contextId: `compaction:${run.id}`,
      modelRole: 'summarizer',
      entry,
      body: { system, messages: body.messages },
      response: { content: summary, toolCalls: [], finishReason: generated.finishReason },
      usage: {
        inputTokens: generated.usage?.inputTokens ?? 0,
        outputTokens: generated.usage?.outputTokens ?? 0
      },
      durationMs: Date.now() - startedAt
    })
    // PERSISTED, so the next turn does not re-summarise the same prefix. Without this, a conversation
    // past the budget paid a full summarizer call on every turn, for ever: nothing was stored, so the
    // next turn loaded everything again and was over budget again. Storing tool results made that bite
    // much sooner, since a single result can be a quarter of the budget.
    //
    // After this, the next turn's context is [recap, ...messages after coversUpToSeq], which is small —
    // so compaction stays quiet until the retained tail itself outgrows the budget.
    await saveCompaction(run.conversationId, {
      summary,
      generation: decision.generation,
      coversUpToSeq
    })
    debug('compacted %d messages into a recap (generation %d, covers up to seq %d)', prefixToSummarize.length, decision.generation, coversUpToSeq)
    watching?.send({ type: 'activity', activity: null })
    return { messages: [recapMessage(summary), ...retained], credits: compactionCredits.total }
  } catch (err) {
    if (abortSignal.aborted) throw err
    // A failed compaction used to return the FULL history, which the comment above admits risks a
    // context-overflow error from the provider. Clear EVERY tool result instead — the same tier-1
    // mechanism, with `keep: 0` and no minimum, because in this branch the alternative is failing the
    // turn outright.
    //
    // This replaced `pruneMessages`, which removes each call together with its result and leaves nothing
    // in their place: the model then reasons as though it had never asked. Clearing keeps every call and
    // every placeholder, so it can see what it did and that the payload is re-fetchable. The store keeps
    // everything either way; this is only about what the model can still see.
    watching?.send({ type: 'activity', activity: null })
    const fallback = clearOldToolResults(history, budget, { keep: 0, clearAtLeast: 0 })
    const cleared = fallback.clear ? fallback.history : history
    debug(
      'compaction failed, continuing with every tool result cleared (%d -> %d chars): %O',
      JSON.stringify(history).length,
      JSON.stringify(cleared).length,
      err
    )
    return { messages: cleared, credits: 0 }
  }
}

/**
 * Perform the turn itself: resolve the model, gather the agent's tools, and run the loop.
 *
 * An autonomous agent with no verified NHI cannot run at all — its whole tool surface is
 * reached as that identity — so this refuses early with an actionable message rather than
 * producing a toolless turn that looks like a capability problem.
 */
const performTurn = async (run: AutonomousAgentRun, messageSeq: number, messageId: string, abortSignal: AbortSignal): Promise<TurnResult> => {
  const autonomousAgent = await resolveAgent(run.owner, run.autonomousAgentId)
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

  // Before any model call: a refused turn must cost nothing. The identity is per agent —
  // see usageIdentityFor.
  const identity = usageIdentityFor(autonomousAgent)
  const violation = await enforceQuotas(run.owner, settings.quotas ?? {} as any, identity)
  if (violation) {
    return {
      // reason/scope/period name WHAT was exceeded; an org admin needs that to act.
      parts: [{ type: 'text', text: `This autonomous agent could not run: ${violation.reason} (${violation.scope}, ${violation.period} limit ${violation.limit}, used ${violation.usage}). Resets at ${violation.resetsAt}.` }],
      steps: 0,
      credits: 0,
      stopReason: 'error'
    }
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
            onWaiting: expecting => { session.send({ type: 'activity', activity: { kind: 'waiting', expecting } }) },
            onDone: () => { session.send({ type: 'activity', activity: null }) }
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

/** How often the growing answer is written back, at most. */
const PARTIAL_PERSIST_INTERVAL_MS = 250

interface ModelLoopContext {
  run: AutonomousAgentRun
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
  const identity = usageIdentityFor(autonomousAgent)

  const compacted = await compactHistory(
    run,
    identity,
    await loadHistory(run.conversationId, messageSeq),
    budget,
    settings,
    abortSignal
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
  const history = session ? withHostContext(compacted.messages, session.hostEvents) : compacted.messages

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
  // The cache detail too: priceTokens reads noCacheTokens/cacheReadTokens/cacheWriteTokens, so
  // dropping them makes a trace price cache reads at the full input tariff and contradict what
  // was actually billed — the exact regression traces/operations.ts documents having fixed once.
  let noCacheTokens = 0
  let cacheReadTokens = 0
  let cacheWriteTokens = 0
  const startedAt = Date.now()

  const result = streamText({
    model,
    system: buildSystemPrompt(autonomousAgent),
    messages: history,
    tools: Object.keys(tools).length ? tools : undefined,
    stopWhen: [
      stepCountIs(STEP_LIMIT),
      repeatedCallGuard(),
      // Appended to the guards, never replacing them: a turn can be stopped by any of the
      // three and each has its own stop reason.
      () => budgetExceeded
    ],
    prepareStep: loopGuardPrepareStep,
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
      noCacheTokens += details?.noCacheTokens ?? 0
      cacheReadTokens += details?.cacheReadTokens ?? 0
      cacheWriteTokens += details?.cacheWriteTokens ?? 0
      credits += stepCredits.total
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
  const parts: UIPart[] = []
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
   * UNTHROTTLED, unlike the persistence below, and the difference is the point. Persisting every token
   * would be thousands of writes a turn, so that is throttled and the client refetches; a socket frame
   * costs a syscall, so the person sees the answer arrive token by token. That is the thing the delta
   * protocol this branch deleted was trying to do over HTTP.
   *
   * Best-effort: send already checks the socket is open, and a person who closed the tab mid-turn must
   * not fail the turn — it finishes and is stored.
   */
  const stream = (kind: 'text' | 'reasoning', delta: string) => {
    session?.send({ type: 'delta', kind, text: delta })
  }

  /**
   * What the assistant is doing, in the vocabulary the chat already renders.
   *
   * The server is the only thing that knows this now, and it knows it better than the browser loop did:
   * it sees the step boundaries, the tool results and the compaction directly rather than inferring
   * them from a stream. `null` clears the label.
   */
  const activity = (value: ChatActivity | null) => {
    session?.send({ type: 'activity', activity: value })
  }

  /**
   * Complete a tool call in place, by its id.
   *
   * By ID rather than "the last part": a step may issue several calls in parallel, and their results
   * arrive interleaved. A call with no matching part cannot happen — the stream always announces the
   * call first — but if it ever did, appending a resultless part would produce a history the provider
   * rejects, so the update is simply dropped.
   */
  const settleToolPart = (toolCallId: string, settled: Record<string, unknown>) => {
    const call = parts.find(p => p.type === 'dynamic-tool' && p.toolCallId === toolCallId)
    if (!call) return
    const { truncated, ...rest } = settled
    Object.assign(call, rest)
    if (truncated) call.toolMetadata = { ...(call.toolMetadata as object), truncated }
  }

  // Live text: the growing content is PERSISTED, throttled, rather than published. Each write
  // advances the conversation version, which notifies subscribers, who then fetch the record over
  // HTTP. That makes the partial answer real — a client refetching mid-turn sees the text so far
  // instead of an empty message — and keeps every websocket payload fixed-size.
  let sawText = false
  let lastPersistAt = 0
  let lastPersistedLength = -1
  const persistPartial = async () => {
    const now = Date.now()
    if (now - lastPersistAt < PARTIAL_PERSIST_INTERVAL_MS) return
    const length = partsText(parts).length
    if (length === lastPersistedLength) return
    lastPersistAt = now
    lastPersistedLength = length
    await updateMessage(messageId, { parts: parts as any, pending: true })
    sendMessageFrame(true)
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
    session?.send({ type: 'message', seq: messageSeq, role: 'assistant', parts: parts as unknown[], pending })
  }

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
      parts.push({
        type: 'dynamic-tool',
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        state: 'input-available',
        // The real arguments, not a summary of them: the stored conversation is the reference copy,
        // so a revived turn has to replay the call the model actually made. The summary is for the
        // trace, which is a description rather than a record.
        input: (part as any).input,
        toolMetadata: {
          serverId: serverByTool.get(part.toolName),
          ...(annotationsByTool.get(part.toolName) ? { annotations: annotationsByTool.get(part.toolName) } : {})
        }
      })
      // Immediately, not on the persist clock: a tool chip appearing is what tells the person the
      // assistant is doing something, and a call can take seconds. Waiting for the next token would
      // show the chip after the work it describes.
      sendMessageFrame(true)
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
      debug('tool failed tool=%s error=%s', part.toolName, detail)
    }
  }

  const content = partsText(parts)
  const toolCalls = parts.filter(p => p.type === 'dynamic-tool')

  const steps = (await result.steps).length
  const finishReason = await result.finishReason

  recordAutonomousTrace(settings, {
    run,
    identity,
    contextId: `turn:${run.id}`,
    modelRole: 'assistant',
    entry,
    // The request DESCRIBED, not duplicated: the system prompt, the tool names advertised, and a
    // REFERENCE to the history rather than the history itself.
    //
    // This is the conversation/trace separation. The stored conversation is now the complete wire
    // exchange, tool results included, so copying `history` in here would (a) duplicate the
    // conversation in a second place, quadratically since every request resends the whole thing, and
    // (b) put MCP payloads into traces, which are a different storage decision — opt-in, consent-gated
    // and TTL'd — and which were deliberately kept free of fetched data. The conversation id and the
    // seq bound below are enough to fetch the exact history this request sent.
    body: {
      system: buildSystemPrompt(autonomousAgent),
      messageCount: history.length,
      historyUpToSeq: messageSeq,
      tools: Object.keys(tools)
    },
    response: {
      content,
      toolCalls: toolCalls.map(call => ({
        id: String(call.toolCallId ?? ''),
        name: String(call.toolName ?? ''),
        arguments: summarizeToolArguments(call.input)
      })),
      finishReason
    },
    usage: { inputTokens, outputTokens, noCacheTokens, cacheReadTokens, cacheWriteTokens },
    durationMs: Date.now() - startedAt
  })
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
  const emptyCompletion = stopReason === 'completed' && content.trim().length === 0
  const finalParts = emptyCompletion ? withAppendedText(parts, EMPTY_COMPLETION_MESSAGE) : parts
  // The last word on this turn's structure, with pending cleared — so a page stops rendering it as in
  // progress without having to infer that from `turn-end`.
  session?.send({ type: 'message', seq: messageSeq, role: 'assistant', parts: finalParts as unknown[], pending: false })
  return {
    parts: finalParts,
    steps,
    credits,
    stopDetail,
    stopReason: emptyCompletion ? 'error' : stopReason
  }
}

/**
 * Run one turn to a terminal state.
 *
 * The assistant message is created BEFORE the turn runs, `pending: true`, for two reasons:
 * a reader sees the turn exists while it is being produced, and a throw still has a message
 * to write the failure into rather than needing to invent one afterwards.
 */
export const runTurn = async (run: AutonomousAgentRun): Promise<void> => {
  const conversation = await mongo.autonomousAgentConversations.findOne(
    { id: run.conversationId },
    { projection: { _id: 0 } }
  )
  if (!conversation) {
    // The conversation was deleted under us; there is nowhere to put a message, so the run
    // is all that can be closed out.
    await finishRun(run.id, { status: 'error', stopReason: 'error', error: 'conversation no longer exists' })
    return
  }

  const abortController = new AbortController()
  liveRuns.set(run.id, { controller: abortController, autonomousAgentId: run.autonomousAgentId })

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

  let message: AutonomousAgentMessage | undefined

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
    const notice = result.stopReason === 'completed' ? '' : runStopReasonMessage(result.stopReason, result.stopDetail)
    await updateMessage(message.id, {
      parts: (notice ? withAppendedText(result.parts, notice) : result.parts) as any,
      pending: false
    })

    // A run stopped by a guard or a budget is still a completed run: it did work and said
    // so. But a turn that REFUSED — no enrolled identity, an exhausted credit cap — returns
    // stopReason 'error' without throwing, and must not be reported as done.
    // steps/credits are not written here: incrementRunSpend owns them, so a turn abandoned
    // at its deadline cannot end up reporting less than it actually spent.
    await finishRun(run.id, {
      status: result.stopReason === 'error' ? 'error' : 'done',
      stopReason: result.stopReason
    })
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
    // A failed turn ends the same way for a watcher as a successful one: the page must stop waiting
    // whatever happened. "Failure is a message, not a silence" applies to the socket too.
    sessionFor(run.conversationId)?.send({ type: 'turn-end', stopReason, detail })
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
      const persisted = await mongo.autonomousAgentMessages
        .findOne({ id: message.id }, { projection: { _id: 0, parts: 1 } })
        .catch(() => null)
      await updateMessage(message.id, {
        parts: withAppendedText((persisted?.parts ?? []) as any, runStopReasonMessage(stopReason, detail)) as any,
        pending: false
      })
        .catch(updateErr => console.error('autonomous agent message could not be finalised', updateErr))
    }
    await finishRun(run.id, {
      status: stopReason === 'timeout' ? 'error' : aborted ? 'aborted' : 'error',
      stopReason,
      error: detail
    }).catch(finishErr => console.error('autonomous agent run could not be closed out', finishErr))
  } finally {
    if (timeout) clearTimeout(timeout)
    liveRuns.delete(run.id)
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
export const startRun = async (run: AutonomousAgentRun): Promise<void> => {
  const lockId = conversationLockId(run.conversationId)
  while (true) {
    if (!await locks.acquire(lockId, LOCK_ORIGIN)) return
    try {
      let current: AutonomousAgentRun | null = await nextPendingRun(run.conversationId)
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
  const candidates = await mongo.autonomousAgentRuns
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
    const existing = await mongo.autonomousAgentMessages.findOne(
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
    await updateMessage(existing.id, {
      parts: withAppendedText(existing.parts as any, notice),
      pending: false
    })
    await finishRun(run.id, { status: 'interrupted', stopReason: 'error', error: 'interrupted by a restart' })
  }

  if (interrupted) console.log(`[autonomous-agents] interrupted ${interrupted} started run(s) left behind by a dead process`)
  if (resumed) console.log(`[autonomous-agents] resumed ${resumed} run(s) that had not started yet`)
  if (skipped) console.log(`[autonomous-agents] left ${skipped} running run(s) alone: another instance holds their conversation`)
  return { interrupted, resumed, skipped }
}
