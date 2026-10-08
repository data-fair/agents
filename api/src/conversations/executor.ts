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
import { isMediaToolResult, type MediaToolResult } from '@agents/shared/tool-result'
import { STEP_LIMIT, repeatedCallGuard, loopGuardPrepareStep, STREAM_IDLE_TIMEOUT_MS, createIdleWatchdog } from './loop-guards.ts'
import type { AutonomousAgent, ConversationRun } from '#types'
import {
  runStopReasonMessage, buildSystemPrompt, withProvenance,
  usageIdentityFor,
  boundToolResult, partsText, withAppendedText,
  type RunStopReason, type MessagePart,
  type ConversationTurnRun
} from './operations.ts'
import { checkQuotas, moderateTurn } from './turn-gates.ts'
import { moderationApplies } from '../moderation/operations.ts'
import {
  conversationTarget, closeConversationRunBare, settleApprovedWithoutRunning, unknownApprovedOutcome,
  type TurnTarget, type TurnResult, type TurnFailure
} from './turn-target.ts'
import { recordCall } from './turn-telemetry.ts'
import { appendMessage, updateMessage, finishRun, bufferRunWrites, incrementRunSpend, resolveAgent, setRunSystemPrompt, rejectPendingApprovals } from './service.ts'
import { getSettings } from '../settings/service.ts'
import { resolveRoleModel } from '../models/service.ts'
import { contextBudget, type ModelRole } from '../models/operations.ts'
import { computeCreditBreakdown } from '../usage/operations.ts'
import { openAutonomousAgentTools, type SessionProvider } from '../mcp-servers/client.ts'
import { applyApprovalPolicy, withoutGatedTools } from './approval-policy.ts'
import { securityKey } from '../cipher/service.ts'
import { getAutonomousAgentSession } from '../nhi/service.ts'
import { sessionFor } from '../agent-session/registry.ts'
import { isStandardAgentId } from '../agent-session/standard-agents.ts'
import { partitionSubAgents, subAgentDelegation } from '../agent-session/sub-agents.ts'
import type { ChatActivity } from '@agents/shared/agent-activity'
import { browserToolSet } from '../agent-session/browser-tools.ts'
import { waitHandover, repairWaitInput, WAIT_TOOL_NAME, WAIT_ACCEPTED } from '@agents/shared/host-events'
import { settlePendingWait } from './waits.ts'
import { PERSON_SPOKE, interruptedWaitResult, interruptReason } from './interrupted-turn.ts'
import { checkAccountCreditCap } from '../usage/enforce.ts'
import { recordUsage } from '../usage/service.ts'
import type { MemoryDocument } from '../memory/operations.ts'
import { buildServiceTools } from './service-tools.ts'
import { mayBePageTool } from './service-tool-names.ts'

const debug = Debug('df-agents:autonomous-agent-executor')

const LOCK_ORIGIN = 'autonomous-agent-executor'

/** Shown when the provider returns no text at all, so the turn never renders blank. */
const EMPTY_COMPLETION_MESSAGE = 'I was not able to produce a response for this turn. Please try rephrasing the request.'

/**
 * Live turns, by run id, so the abort route can stop one.
 *
 * In-process, like the executor: a run is not resumable and does not migrate, so only the process that
 * holds the turn can abort its controller. A stop received by ANOTHER process reaches it through the run
 * document instead — `abortRequestedAt`, which every live turn polls for (see watchStopRequests).
 *
 * The agent id travels with the controller so a whole agent can be stopped at once — see
 * abortRunsOfAgent.
 */
const liveRuns = new Map<string, { controller: AbortController, agentId: string, conversationId?: string, taskId?: string }>()

/** Whether this process is executing the run right now. */
export const isRunLive = (runId: string) => liveRuns.has(runId)

/** The abort reason of a turn whose agent was disabled or deleted: interruptReason reads it as `ended`. */
const AGENT_STOPPED = 'autonomous agent stopped'

/** The abort reason of a turn whose run document was deleted under it (its agent or conversation was). */
const RUN_DELETED = 'the run was deleted'

/** How often a live turn reads its own run for a stop requested through another process. */
export const STOP_POLL_MS = 2000

/**
 * Stop one run, wherever it is held. True when this process aborted it OR a stop was recorded on it.
 *
 * Aborted here when this process holds the turn; recorded on the run while it is still `running`, so
 * the process that does hold it stops it at its next poll (watchStopRequests). With no reason, like a
 * person's Stop: the settled calls say the reply was stopped. False for a run that has already ended.
 */
export const abortRun = async (runId: string): Promise<boolean> => {
  const live = liveRuns.get(runId)
  live?.controller.abort()
  const requested = await mongo.runs.updateOne(
    { id: runId, status: 'running' },
    { $set: { abortRequestedAt: new Date().toISOString() } }
  )
  return !!live || requested.modifiedCount > 0
}

/**
 * Stop the live turn of one conversation, so a new prompt can take the turn back.
 *
 * A person who writes while the assistant is still working means to redirect it: their message is
 * what the next turn answers, and letting the current one run on would answer the question before.
 * (A pending wait is not a live turn — the message answers it directly, see ./waits.ts.)
 *
 * Returns how many this process actually stopped; a conversation has at most one live turn, because
 * the conversation lock serialises them.
 */
export const abortRunsOfConversation = (conversationId: string, why: 'spoke' | 'stop' = 'spoke'): number => {
  let stopped = 0
  for (const live of liveRuns.values()) {
    if (live.conversationId !== conversationId) continue
    // The reason is read back when the turn is settled (interruptReason), so it must be the constant.
    // A Stop carries none: the settled calls then say the reply was
    // stopped, rather than that the person wrote.
    live.controller.abort(why === 'spoke' ? new Error(PERSON_SPOKE) : undefined)
    stopped++
  }
  // A Stop for a turn this process is not running — the socket reconnected to another instance mid-turn,
  // which sticky sessions make rare — is left on the run for the instance that holds it
  // (watchStopRequests). Only for a Stop: a person who SPOKE starts the next turn here, and that needs
  // the previous one stopped where it runs, which is this process under the conversation's lock.
  if (!stopped && why === 'stop') {
    mongo.runs.updateMany({ conversationId, status: 'running' }, { $set: { abortRequestedAt: new Date().toISOString() } })
      .catch(err => console.error('could not record a stop request', err))
  }
  return stopped
}

/**
 * Stop every live turn of one autonomous agent. Returns how many this process actually stopped.
 *
 * The kill switch is not only checked at the START of a turn: disabling an agent — or deleting it —
 * must stop whatever it is already doing, tool calls included. An admin disabling a misbehaving agent
 * means now, not eventually.
 *
 * Every `running` run of the agent is also marked, so a turn held by another API process stops at its
 * next poll (watchStopRequests) with the same reason. abort() remains a request the provider may
 * ignore — the run's own deadline is the hard backstop.
 */
export const abortRunsOfAgent = async (agentId: string): Promise<number> => {
  let stopped = 0
  for (const live of liveRuns.values()) {
    if (live.agentId !== agentId) continue
    live.controller.abort(new Error(AGENT_STOPPED))
    stopped++
  }
  await mongo.runs.updateMany(
    { agentId, status: 'running' },
    { $set: { abortRequestedAt: new Date().toISOString(), abortReason: 'agent-stopped' } }
  )
  return stopped
}

/**
 * Abort this turn's controller when a stop is recorded on its run by another process (abortRun,
 * abortRunsOfAgent), or when its run document is gone — its agent or conversation was deleted. One read
 * of one run every STOP_POLL_MS for as long as the turn lives; the returned function stops watching.
 */
const watchStopRequests = (runId: string, controller: AbortController): (() => void) => {
  let reading = false
  const check = async () => {
    if (reading || controller.signal.aborted) return
    reading = true
    try {
      const stored = await mongo.runs.findOne({ id: runId }, { projection: { _id: 0, abortRequestedAt: 1, abortReason: 1 } })
      if (controller.signal.aborted) return
      // The reasons the local paths give, so the turn is settled the same wherever it was stopped.
      if (!stored) controller.abort(new Error(RUN_DELETED))
      else if (stored.abortRequestedAt) controller.abort(stored.abortReason === 'agent-stopped' ? new Error(AGENT_STOPPED) : undefined)
    } catch (err) {
      debug('could not read the stop requests of run %s: %o', runId, err)
    } finally {
      reading = false
    }
  }
  // Once at once, then on the clock: a stop recorded while the run was still queued (it waited for its
  // conversation's lock, or for recovery) must not let the turn start and fire tools until the first tick.
  check()
  const timer = setInterval(check, STOP_POLL_MS)
  timer.unref()
  return () => clearInterval(timer)
}

/**
 * The abort reason of a turn stopped by a LATE moderation block — a verdict that lands after the gate
 * failed open (it does not wait longer than MODERATION_GATE_TIMEOUT_MS for the classifier). The
 * executor's catch path recognises it and stores the refusal.
 */
const MODERATION_LATE_BLOCK = 'moderation: a late verdict blocked this message'

/** One conversation is one serialised timeline, so the lock is keyed on it. */
const conversationLockId = (conversationId: string) => `conversation:${conversationId}`

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
  ) as ConversationTurnRun | null
}

/**
 * Perform the turn itself: resolve the model, gather the agent's tools, and run the loop.
 *
 * An autonomous agent with no verified NHI cannot run at all — its whole tool surface is
 * reached as that identity — so this refuses early with an actionable message rather than
 * producing a toolless turn that looks like a capability problem.
 */
const performTurn = async (run: ConversationRun, abortSignal: AbortSignal, target: TurnTarget): Promise<TurnResult> => {
  const autonomousAgent = await resolveAgent(run.owner, run.agentId)
  if (!autonomousAgent) throw new Error('the autonomous agent no longer exists')

  // The session watching this conversation as the turn started (looked up by its target), if any.
  // UNDEFINED IS NORMAL: a turn can run with nobody there — a tab closed mid-turn, and later a scheduled
  // run that never had one. Such a turn has no page tools and streams to nobody; the stored message is
  // still the record.
  //
  // This lookup is the whole of what colocation buys. The loop runs in the process holding the socket,
  // so "who is watching, and what can their page do?" is a Map read.
  const session = target.session
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
    // Moderation is a CHAT rule: it judges what a person wrote. A planned task's prompt is admin-authored
    // and its turn runs as the agent's own identity, so there is nothing of a person's to classify.
    // Within a chat, a wake or an approval continuation has no message of the person's either — they
    // acted on the page, or decided on a call — and moderating it would re-judge the message that started
    // the turn: a moderator call for nothing, and possibly a second strike for the same message.
    () => target.surface === 'chat' && run.trigger !== 'wake' && run.trigger !== 'approval' && moderationApplies(settings, identity.role)
      ? moderateTurn(run, settings, identity, () => liveRuns.get(run.id)?.controller.abort(new Error(MODERATION_LATE_BLOCK)))
      : undefined
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
  const sessionProvider: SessionProvider = autonomousAgent.nhi
    ? () => getAutonomousAgentSession(autonomousAgent)
    : async () => session?.sessionCookie()
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
  // THE APPROVAL GATE, on the catalog tools of a configured autonomous agent only. The personal assistant
  // has no policy, page tools act in the person's own browser, and service tools are the loop's own.
  // An UNATTENDED turn (a planned task's run) is offered only what the policy allows outright: nobody is
  // there to decide on a gated call. A standard agent has no tasks; its branch stays first regardless.
  const catalogTools = isStandardAgentId(autonomousAgent.id)
    ? rawTools
    : target.surface === 'task'
      ? withoutGatedTools(rawTools, annotationsByTool, autonomousAgent.approvals)
      : applyApprovalPolicy(rawTools, annotationsByTool, autonomousAgent.approvals)
  const tools = {
    ...withProvenance(catalogTools, name => serverByTool.get(name) ?? 'unknown'),
    ...(session ? browserToolSet(session) : {})
  }

  // The service's own tools, from the registry (./service-tools.ts): spread LAST, so a catalog tool that
  // happens to share a name cannot stand in for one, and recorded like a catalog call's source.
  const service = await buildServiceTools({
    agent: autonomousAgent,
    run,
    surface: target.surface,
    session,
    ...(target.reportOutcome ? { reportOutcome: target.reportOutcome } : {})
  })
  Object.assign(tools, service.tools)
  for (const [name, server] of service.serverByTool) serverByTool.set(name, server)
  for (const [name, annotations] of service.annotationsByTool) annotationsByTool.set(name, annotations)
  const memory = service.memory

  try {
    return await runModelLoop({ run, abortSignal, model, entry, tools, settings, budget, serverByTool, annotationsByTool, autonomousAgent, target, memory })
  } finally {
    // The turn is over (normally, by throw, or by abandonment): release the MCP connections.
    await closeTools()
  }
}

interface ModelLoopContext {
  run: ConversationRun
  abortSignal: AbortSignal
  model: ReturnType<typeof resolveRoleModel>['model']
  entry: ReturnType<typeof resolveRoleModel>['entry']
  tools: Record<string, Tool>
  settings: Awaited<ReturnType<typeof getSettings>>
  budget: number
  serverByTool: Map<string, string>
  annotationsByTool: Map<string, Record<string, unknown>>
  /** The agent's memory as of run start, when it has one; rendered into the system prompt. */
  memory?: MemoryDocument[]
  autonomousAgent: AutonomousAgent
  /** Where the turn reads its context from and writes its record to (see ./turn-target.ts). */
  target: TurnTarget
}

const runModelLoop = async (ctx: ModelLoopContext): Promise<TurnResult> => {
  const { run, abortSignal, model, entry, tools, settings, budget, serverByTool, annotationsByTool, autonomousAgent, target, memory } = ctx
  // The page in front of the person as the turn started: its tools (below) and host events (folded into
  // the history by the target).
  const session = target.session
  // Computed ONCE: the prompt the model gets and the prompt recorded on the run must be the same string.
  const systemPrompt = buildSystemPrompt(autonomousAgent, memory, target.surface)
  const identity = usageIdentityFor(autonomousAgent, run)

  const { messages: history, credits: compactionCredits, hostBlockChars } = await target.history({ identity, budget, settings, abortSignal, agentId: autonomousAgent.id })

  // Every tool offered on any step of the turn, for its telemetry (see the run schema's `toolNames`).
  const offeredTools = new Set<string>()

  // Credits spent so far this turn, accumulated per step so the budget can stop the loop
  // between steps rather than only reporting the overrun afterwards.
  //
  // SEEDED with what compaction just cost, so the per-run budget bounds everything the run spent
  // rather than only the assistant's steps. A compaction is charged to the account either way; this is
  // what makes it count against the ceiling too.
  let credits = compactionCredits
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
  /** A worker's final transcript, onto the lead's message — bounded like the lead's own tool results. */
  const storeSubAgentTrace = (trace: { parentToolCallId: string, name: string, parts: unknown[] }) => {
    const bounded = (trace.parts as any[]).map(part => {
      if (part?.type !== 'dynamic-tool') return part
      const settled = { ...part }
      if (settled.output !== undefined && !isMediaToolResult(settled.output)) {
        settled.output = boundToolResult(typeof settled.output === 'string' ? settled.output : JSON.stringify(settled.output)).result
      }
      if (typeof settled.errorText === 'string') settled.errorText = boundToolResult(settled.errorText).result
      return settled
    })
    const stored = { type: 'data-subagent', data: { parentToolCallId: trace.parentToolCallId, name: trace.name, parts: bounded } } as MessagePart
    const at = parts.findIndex(part => part.type === 'data-subagent' && (part as any).data?.parentToolCallId === trace.parentToolCallId)
    if (at === -1) parts.push(stored)
    else parts[at] = stored
  }
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
        // The FINAL transcript is also STORED, on the lead's message, so a reloaded thread and the
        // review page show what the worker did, where a streamed-only transcript would be
        // empty after a reload. As a `data-subagent` part, which the replay leaves out of what the
        // model is sent — the lead keeps seeing only the summary, the point of delegating.
        if (!trace.pending) storeSubAgentTrace(trace)
        target.frames.subAgent({ parentToolCallId: trace.parentToolCallId, name: trace.name, parts: trace.parts as MessagePart[], pending: trace.pending })
      },
      onPhase: (parentToolCallId, phase) => {
        target.frames.activity(phase ? { kind: 'subagent', name, phase } : null, parentToolCallId)
      },
      // EVERY worker step is billed, exactly as a lead step is: against the run's budget, against the
      // account's credit cap, and into the usage histogram under the seat that served it (`tools`
      // unless the sub-agent pins another), so the spend is attributable to it. A delegated turn is often most of the work; leaving it
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
            // The untrusted pool too (anonymous + external combined): without it, their chat spend never
            // reached the pool, and its cap counted only moderation and the summary endpoint.
            poolId: identity.poolId,
            dimensions: {
              modelRole: seat,
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
        } else if (credits >= config.turnCredits) {
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
   * the component registers a tool — and the page reports it with `tools-changed`. The tool set is
   * re-read before every step, so the agent can call the tool it had just caused to exist in the SAME
   * turn. Built once, it could not: a real model would meet "tool set_display is not available" right
   * after opening a panel.
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
  // The service's own tools are never page tools, even when a page registers one by that name
  // (./service-tool-names.ts): the page's would answer under the service's name.
  const fixedTools = Object.fromEntries(Object.entries(tools).filter(([name]) => !startingPageTools.has(name) || !mayBePageTool(name)))
  const liveTools: Record<string, Tool> = {}
  const assembleTools = async () => {
    const { mainTools } = await partitionSubAgents(
      { ...fixedTools, ...(session ? Object.fromEntries(Object.entries(browserToolSet(session)).filter(([name]) => mayBePageTool(name))) : {}) },
      buildDelegation
    )
    for (const name of Object.keys(liveTools)) if (!(name in mainTools)) delete liveTools[name]
    Object.assign(liveTools, mainTools)
  }
  await assembleTools()
  let assembledFrom = pageToolNames()

  // A provider that accepted the request and then went quiet would otherwise hold the conversation's
  // lock until the run ceiling. Paused while a tool runs: that silence is the tool's, not the model's.
  const idleAbort = new AbortController()
  const idleWatchdog = createIdleWatchdog(STREAM_IDLE_TIMEOUT_MS, () => {
    idleAbort.abort(new Error(`the model stream went silent for ${STREAM_IDLE_TIMEOUT_MS / 1000}s`))
  })
  const result = streamText({
    model,
    system: systemPrompt,
    messages: history,
    // Always the live map, even empty: `undefined` would freeze "no tools" for the whole turn, while an
    // empty object is "no tools for this step" and fills in when the page registers one.
    tools: liveTools,
    // Signs each approval request when it is issued and verifies it on replay, so a stored
    // `approved: true` that did not come through the decision route fails instead of executing.
    experimental_toolApprovalSecret: securityKey,
    stopWhen: [
      stepCountIs(STEP_LIMIT),
      repeatedCallGuard(),
      // A HANDOVER ENDS THE TURN: the wait was accepted, so the next step is the person's. Read from the
      // step's own results rather than from state the stream loop below sets, which may not have
      // consumed that part yet when the SDK asks.
      ({ steps }) => steps[steps.length - 1]?.toolResults.some(result => result.toolName === WAIT_TOOL_NAME && result.output === WAIT_ACCEPTED) ?? false,
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
      for (const name of Object.keys(liveTools)) offeredTools.add(name)
      return loopGuardPrepareStep(options)
    },
    // totalMs is defence in depth. The outer Promise.race in runTurn still exists and is not redundant:
    // it covers the whole turn — resolving the agent, opening MCP connections, compaction — whereas this
    // bounds only the model stream. The IDLE bound is ours (idleWatchdog below), not the SDK's
    // `chunkMs`, which counted a running tool as silence.
    timeout: {
      totalMs: config.turnTimeoutSeconds * 1000
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
          // The untrusted pool too (anonymous + external combined): without it, their chat spend never
          // reached the pool, and its cap counted only moderation and the summary endpoint.
          poolId: identity.poolId,
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
      //
      // Only when another step is coming: after a step that answered rather than called a tool, the
      // turn ends anyway, and reading the cap to stop it is a query for nothing — which, for a plain
      // question, was every turn's second read of the same document the gate had just read.
      const accountCap = step.finishReason === 'tool-calls' ? await checkAccountCreditCap(run.owner) : undefined
      if (accountCap) {
        budgetExceeded = true
        stopDetail = `${accountCap.reason} (${accountCap.scope}, ${accountCap.period} limit ${accountCap.limit}, used ${accountCap.usage}). Resets at ${accountCap.resetsAt}.`
      } else if (credits >= config.turnCredits) {
        budgetExceeded = true
      }
    },
    abortSignal: AbortSignal.any([abortSignal, idleAbort.signal])
  })

  // The turn's parts, in the order the model produced them. This IS the record: everything the model
  // saw has to end up here, or a revived conversation is a different conversation.
  const parts: MessagePart[] = []
  target.track(() => parts)
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
   * mid-turn is served from the target's `track` — so this is the only way it reaches anyone before then. The
   * session merges deltas only within `DELTA_FLUSH_MS`, below a display frame, so the person still
   * sees the answer arrive as it is produced. That is the thing the delta protocol this branch deleted
   * was trying to do over HTTP.
   *
   * Best-effort: send already checks the socket is open, and a person who closed the tab mid-turn must
   * not fail the turn — it finishes and is stored.
   */
  const stream = (kind: 'text' | 'reasoning', delta: string) => {
    target.frames.delta(kind, delta)
  }

  /**
   * What the assistant is doing, in the vocabulary the chat already renders.
   *
   * The server sees the step boundaries, the tool results and the compaction directly. `null` clears
   * the label.
   */
  const activity = (value: ChatActivity | null) => {
    target.frames.activity(value)
  }

  // The wait this turn handed over on, if it did. The first accepted one; a second in the same step is
  // settled at once as redundant rather than left as a second open call nothing will answer.
  let handover: { toolCallId: string, expecting?: string } | undefined
  let awaitingApproval = false

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
      | { state: 'output-available', output: string | MediaToolResult, truncated?: { totalChars: number } }
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
    target.frames.message(parts, pending)
  }

  /**
   * Persist the turn's structure NOW, when a call opens or settles — the only writes before the end.
   *
   * Two readers need it. A turn interrupted mid-call is settled from the STORED parts (runTurn's catch
   * path has nothing else), so a call not yet written would be invisible there and replay would drop
   * it — the model would never learn what it had been doing. And a page reloaded mid-turn has to show
   * the calls already made. Calls are few per turn, so this costs a write per call, not per token.
   */
  const persistStructure = async () => {
    await target.persist(parts)
  }

  // THINKING, from the moment the turn is handed to the model until it says something.
  //
  // The label is cleared on the first token, so it must be set before: the gap before that token is the
  // only time it has anything to explain, and a slow provider would otherwise leave a still, silent chat.
  activity({ kind: 'thinking' })

  const isThisTurns = (toolCallId: string) => parts.some(p => p.type === 'dynamic-tool' && p.toolCallId === toolCallId)

  try {
    for await (const part of result.fullStream) {
      idleWatchdog.activity()
      if (part.type === 'tool-call') idleWatchdog.toolStarted(part.toolCallId)
      if (part.type === 'tool-result' || part.type === 'tool-error') idleWatchdog.toolEnded(part.toolCallId)
      // 'error' parts do NOT throw — an unhandled one is how a conversation silently dropped
      // before. Turn it into a real failure so the caller reports it.
      if (part.type === 'error') throw part.error instanceof Error ? part.error : new Error(String(part.error))
      if (part.type === 'text-delta') {
      // Visible output means the label has nothing left to explain.
        if (!sawText) { sawText = true; activity(null) }
        appendText('text', part.text)
        stream('text', part.text)
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
      // THE GATE STOPPED A CALL. The SDK has not executed it and will not this turn; it ends the turn
      // itself (finishReason 'other'). The call part already exists (the 'tool-call' part came first):
      // it becomes `approval-requested`, carrying the id and the signature the decision must present.
      if (part.type === 'tool-approval-request') {
        // The turn awaits approval WHATEVER happens below: the SDK has stopped the call either way, and a
        // run recorded `completed` would tell the person there was nothing left to do.
        awaitingApproval = true
        const call = parts.find(p => p.type === 'dynamic-tool' && p.toolCallId === part.toolCall.toolCallId)
        if (call && call.type === 'dynamic-tool') {
          Object.assign(call, {
            state: 'approval-requested',
            approval: { id: part.approvalId, ...(part.signature ? { signature: part.signature } : {}) }
          })
          sendMessageFrame(true)
          await persistStructure()
        } else {
          // Unreachable while the stream announces a call before asking about it — LOUD if that ever
          // changes, because the person then has nothing on screen to decide.
          console.error(`[approval gate] run ${run.id}: approval ${part.approvalId} names call ${part.toolCall.toolCallId}, which this turn never announced`)
        }
        continue
      }
      if (part.type === 'tool-result' && part.toolName === WAIT_TOOL_NAME && (part as any).output === WAIT_ACCEPTED) {
        if (!handover) {
          // Left OPEN: the person's answer is its result, and it comes in a later turn (./waits.ts).
          const call = parts.find(p => p.type === 'dynamic-tool' && p.toolCallId === part.toolCallId)
          handover = { toolCallId: part.toolCallId, expecting: repairWaitInput(call?.type === 'dynamic-tool' ? call.input : undefined).expecting }
        } else {
          settleToolPart(part.toolCallId, { state: 'output-available', output: 'Already waiting for the user.' })
          sendMessageFrame(true)
          await persistStructure()
        }
        continue
      }
      // The RESULT, stored because the conversation is revivable: without it a later turn replays a
      // call with no answer, which providers reject — so the old shape had to drop the call too, and
      // the model resumed unable to see either the data or the fact that it had acted.
      //
      // Stored as the model received it, envelope included (withProvenance wraps before this point),
      // because the guarantee is that a revived conversation reproduces what the model saw.
      if (part.type === 'tool-result') {
        const output = (part as any).output
        // An image-bearing result is stored AS its envelope, only its text bounded: stringified, the base64
        // was cut at the result limit and replayed as text — the image lost from the record and garbage to
        // the model on the next turn (see mediaModelOutput).
        const media = isMediaToolResult(output)
        const text = media
          ? String(output.text ?? '')
          : typeof output === 'string'
            ? output
            : (output && typeof output === 'object' && 'value' in output)
                ? String((output as any).value)
                : JSON.stringify(output ?? '')
        const bounded = boundToolResult(text)
        if (!isThisTurns(part.toolCallId)) {
          await target.settleEarlierCall(part.toolCallId, {
            state: 'output-available',
            output: media ? { ...output, text: bounded.result } : bounded.result,
            ...(bounded.truncated ? { truncated: bounded.truncated } : {})
          })
          continue
        }
        settleToolPart(part.toolCallId, {
          state: 'output-available',
          output: media ? { ...output, text: bounded.result } : bounded.result,
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
        if (!isThisTurns(part.toolCallId)) {
          await target.settleEarlierCall(part.toolCallId, { state: 'output-error', errorText: boundToolResult(detail).result })
          continue
        }
        settleToolPart(part.toolCallId, { state: 'output-error', errorText: boundToolResult(detail).result })
        sendMessageFrame(true)
        await persistStructure()
        debug('tool failed tool=%s error=%s', part.toolName, detail)
      }
      // AN APPROVED CALL THE SDK REFUSED TO RUN on replay. It re-checks every approved call against the
      // tools of THIS turn and denies, rather than executes, one whose tool is gone (its class was set to
      // `deny` since) or no longer needs approval (set to `allow`) — a `tool-output-denied` part, not a
      // throw and not a `tool-error`. Stored as an error on the call's own part: left `approval-responded`,
      // every later replay would carry an approved call with no result after it. A call denied by the
      // person never comes through here, its stored `output-denied` already replays with its result.
      if (part.type === 'tool-output-denied' && !isThisTurns(part.toolCallId)) {
        await target.settleEarlierCall(part.toolCallId, {
          state: 'output-error',
          errorText: part.toolName in liveTools
            ? 'the approval policy of this tool changed since the request, so the approved call was not run'
            : 'this tool is no longer available'
        })
      }
    }
  } finally {
    idleWatchdog.stop()
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
    ...(target.historyUpToSeq !== undefined ? { historyUpToSeq: target.historyUpToSeq } : {}),
    toolNames: [...offeredTools].sort(),
    hostBlockChars
  })
  // The instructions, recorded ONCE per run rather than on every call: they do not change within a
  // turn, and they are what a reviewer needs that the conversation does not contain.
  setRunSystemPrompt(run.id, systemPrompt)
    .catch(err => console.error('could not record the run system prompt', err))
  // A guard-stopped turn is a truncation, not a provider error: the model still wanted to
  // call tools when a cap cut it off. The budget is checked first because it is the reason
  // that is not otherwise visible from the finish reason.
  // All three of budget/step-limit/repeated-calls mean the same thing — the model wanted to
  // keep going and was stopped — which is why they all hang off finishReason 'tool-calls'.
  // A turn that answered and finished is `completed` even if its last step happened to
  // cross the budget: reporting 'budget' there would tell a reader the answer was cut off
  // when it was not.
  // A handover first: it stops on a tool call by design, which the guards' reading below would take for
  // a turn cut off.
  const stopReason: RunStopReason = handover
    ? 'waiting'
    : awaitingApproval
      ? 'awaiting-approval'
      : finishReason === 'tool-calls'
        ? (budgetExceeded ? 'budget' : steps >= STEP_LIMIT ? 'step-limit' : 'repeated-calls')
        : 'completed'

  // An empty completion is a known provider failure mode with its own mock seam. Without a
  // fallback the turn persists a blank message and a green run — the "conversation that simply stops" this module forbids.
  //
  // Only when the turn OTHERWISE COMPLETED, though: a turn cut off by a guard, a budget or
  // the clock has no text by nature (it was mid-tool-chain), and runTurn appends that stop
  // reason's notice as its content. Treating those as empty completions would relabel every
  // truncation as a provider error.
  const emptyCompletion = stopReason === 'completed' && partsText(parts).trim().length === 0
  const finalParts = emptyCompletion ? withAppendedText(parts, EMPTY_COMPLETION_MESSAGE) : parts
  if (emptyCompletion) {
    // LOGGED, because it is a provider anomaly rather than a normal turn, and the person only ever
    // sees the generic fallback, so the operator's log is where it belongs. Ids only — no content, since
    // this line is for diagnosis, not for a second copy of the conversation.
    const of = run.kind === 'task' ? `task ${run.taskId}` : `conversation ${run.conversationId}`
    console.warn(`[empty completion] treated as a bug: ${run.kind ?? 'conversation'} run ${run.id} of ${of} produced no text (model ${entry.id}, ${steps} step(s))`)
  }
  // The last word on this turn's structure, with pending cleared — so a page stops rendering it as in
  // progress without having to infer that from `turn-end`.
  //
  // Except when it asks for an approval: the message is closed only by finishTurn, and a decision is
  // refused until then (see decideApproval), so the card must not offer one before. runTurn sends the
  // closed frame once the message really is.
  target.frames.message(finalParts, awaitingApproval)
  return {
    parts: finalParts,
    steps,
    credits,
    stopDetail,
    // The frame above was the settled one; runTurn must not send a second.
    published: true,
    ...(handover ? { handover } : {}),
    ...(awaitingApproval ? { awaitingApproval: true as const } : {}),
    ...(idleAbort.signal.aborted ? { idleAborted: true as const } : {}),
    stopReason: emptyCompletion ? 'error' : stopReason,
    // The fallback above IS the explanation; a generic notice on top would be a second one.
    ...(emptyCompletion ? { selfExplained: true } : {})
  }
}

/**
 * Run one turn to a terminal state, whatever it is a turn OF.
 *
 * What every kind of run needs lives here: the abort controller the abort routes reach, the buffered
 * telemetry, the deadline, the turn itself, and the classification of a throw — abort, timeout, a late
 * moderation block or a genuine error. What the turn's record IS lives behind the target (see
 * ./turn-target.ts): writing it, closing the run, telling a watcher.
 *
 * `open` runs inside the try, because opening the record can fail (appending a conversation's message);
 * `closeBare` closes the run from the classified failure when no target was ever opened.
 */
export const driveTurn = async (
  run: ConversationRun,
  open: () => Promise<TurnTarget>,
  closeBare: (failure: TurnFailure) => Promise<unknown>
): Promise<void> => {
  const abortController = new AbortController()
  liveRuns.set(run.id, { controller: abortController, agentId: run.agentId, conversationId: run.conversationId, taskId: run.taskId })
  // A stop received by another API process reaches this turn through its run document.
  const stopWatching = watchStopRequests(run.id, abortController)
  // The run's telemetry and spend are held from here until finishTurn writes them (see bufferRunWrites).
  bufferRunWrites(run.id)

  // The ceiling has to be enforced twice over, because abort() is only a REQUEST.
  // abortController.signal asks the provider and the MCP client to stop, which is what a
  // well-behaved fetch-based client does; but a client that ignores the signal would hold
  // the conversation's lock until the lock's own TTL expired. So the turn is also raced
  // against the deadline and abandoned if it overruns. Abandoning is safe: performTurn only
  // returns a value, it never writes — all persistence happens in the target's close and fail.
  let timeout: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      abortController.abort(new Error('run timeout'))
      reject(new Error(`run exceeded its ${config.turnTimeoutSeconds}s ceiling`))
    }, config.turnTimeoutSeconds * 1000)
  })

  let target: TurnTarget | undefined

  try {
    // Inside the try: opening can fail (the conversation vanished, a duplicate seq, a transient mongo
    // error) and that must still close the run out rather than escape and leave it `running` forever.
    target = await open()
    const result = await Promise.race([performTurn(run, abortController.signal, target), deadline])
    await target.close(result)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    // An abort is not a failure of the turn: distinguish the clock from a caller pressing
    // stop, and from a genuine error, because a reader reacts differently to each.
    const aborted = abortController.signal.aborted
    const timedOut = aborted && /timeout/i.test(String((abortController.signal as any).reason?.message ?? ''))
    // Refused, not failed: declining WAS the answer, as for an on-time block (see turn-gates).
    const lateBlocked = aborted && (abortController.signal as any).reason?.message === MODERATION_LATE_BLOCK
    const stopReason: RunStopReason = lateBlocked ? 'completed' : timedOut ? 'timeout' : aborted ? 'aborted' : 'error'
    const status = lateBlocked ? 'done' : stopReason === 'timeout' ? 'error' : aborted ? 'aborted' : 'error'
    const failure: TurnFailure = {
      stopReason,
      status,
      ...(lateBlocked ? {} : { error: detail }),
      detail,
      aborted,
      lateBlocked,
      interrupt: aborted ? interruptReason((abortController.signal as AbortSignal & { reason?: unknown }).reason) : 'ended',
      cause: err
    }
    // No target if opening itself failed; the run then carries the failure alone.
    if (target) await target.fail(failure)
    else await closeBare(failure)
  } finally {
    if (timeout) clearTimeout(timeout)
    stopWatching()
    liveRuns.delete(run.id)
  }
}

/**
 * Run one turn of a conversation to a terminal state.
 *
 * The assistant message is created BEFORE the turn runs, `pending: true`, for two reasons:
 * a reader sees the turn exists while it is being produced, and a throw still has a message
 * to write the failure into rather than needing to invent one afterwards.
 */
export const runTurn = async (run: ConversationTurnRun): Promise<void> => {
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

  await driveTurn(run, async () => {
    // A turn answering the person's MESSAGE rejects whatever approval is still pending, again. Posting
    // already did, but the turn that asked may then still have been finishing — its own last writes put
    // `approval-requested` back, and the card reappeared in a message that is no longer the last. Here,
    // under the conversation's lock, that turn has closed its message. Idempotent: usually there is
    // nothing left to reject.
    if (run.trigger === 'user') await rejectPendingApprovals(run.conversationId)

    // And a wait handed over by a turn that was still finishing when the message was posted: the post found
    // no `pendingWait` to settle, then that turn's close wrote one. The person answered it by writing.
    if (run.trigger === 'user') await settlePendingWait(run.conversationId, wait => interruptedWaitResult(wait.expecting))

    // Can fail (the conversation vanished between the findOne above and the $inc, a duplicate seq, a
    // transient mongo error): the driver then closes the run bare.
    const message = await appendMessage(conversation, {
      role: 'assistant',
      parts: [],
      runId: run.id,
      pending: true
    })

    // Announced at once, empty and pending, so the turn's first streamed words land in ITS bubble. The
    // client adds a delta to the last assistant bubble it has; a turn that follows another assistant
    // message with no message of the person's between — a wake, after a handover — had its reply
    // glued onto the handover's bubble, then shown again once its own frame arrived.
    sessionFor(run.conversationId)?.send({ type: 'message', seq: message.seq, role: 'assistant', parts: [], pending: true })

    // The assistant message's own seq bounds the history: it was created before the turn
    // (empty, pending), so it must not be fed back to the model as an empty turn.
    return conversationTarget(run, message, conversation)
  }, failure => closeConversationRunBare(run, failure))
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
export const startRun = async (run: ConversationTurnRun): Promise<void> => {
  const lockId = conversationLockId(run.conversationId)
  while (true) {
    if (!await locks.acquire(lockId, LOCK_ORIGIN)) return
    try {
      let current: ConversationTurnRun | null = await nextPendingRun(run.conversationId)
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
    .find({ status: 'running', kind: { $ne: 'task' } }, { projection: { _id: 0 } })
    .toArray() as ConversationTurnRun[]

  const heldLocks = new Set(
    (await mongo.db.collection<{ _id: string }>('locks')
      .find({ _id: { $regex: `^${conversationLockId('')}` } }, { projection: { _id: 1 } }).toArray())
      .map(doc => String(doc._id).slice(conversationLockId('').length))
  )
  const ownerless = candidates.filter(run => !heldLocks.has(run.conversationId!) && !liveRuns.has(run.id))
  const skipped = candidates.length - ownerless.length

  let interrupted = 0
  let resumed = 0
  for (const run of ownerless) {
    // Within the run's conversation, so the lookup rides the {conversationId, seq} index rather than
    // scanning every message for a runId nothing indexes.
    const existing = await mongo.messages.findOne(
      { conversationId: run.conversationId, runId: run.id, role: 'assistant' },
      { projection: { _id: 0 } }
    )
    if (!existing) {
      resumed++
      // Not awaited as a group: each acquires the conversation lock itself and drains from there.
      startRun(run).catch(err => console.error('autonomous agent run failed to resume', err))
      continue
    }
    interrupted++
    // An approval run cut by the restart leaves no approved call without a result either: the rule
    // runTurn applies on both of its own paths. Nothing else would ever settle it — a new message only
    // touches calls still awaiting a decision — and every later replay would carry a call with no result,
    // which providers reject: the conversation would fail on every turn from then on. Outcome UNKNOWN,
    // not "did not run": the process may have died after the tool did its work.
    if (run.trigger === 'approval') {
      // Caught: one conversation's failure must not stop the others being recovered. The replay's own
      // safety net (storedTurnsToModelMessages) still keeps such a call from reaching a provider bare.
      await settleApprovedWithoutRunning(run.conversationId, existing.seq, unknownApprovedOutcome('interrupted by a restart'))
        .catch(err => console.error('approved calls of an interrupted run could not be settled', err))
    }
    // stopReason has no 'interrupted' member — the status carries that — so the reason is
    // 'error' with the restart named as the detail.
    const notice = runStopReasonMessage('error', 'interrupted by a restart')
    await updateMessage(run.conversationId, existing.seq, {
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
