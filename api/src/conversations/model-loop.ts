/**
 * The model loop: one turn's streamText, its tools and guards, recorded as parts. It produces a turn and
 * knows nothing of what the turn is OF — the target (./turn-target.ts) reads the context and writes the
 * record, and the driver (./executor.ts, driveTurn) runs it to a terminal state.
 */

import config from '#config'
import Debug from 'debug'
import { streamText, isStepCount, type Tool } from 'ai'
// 'ai' does not re-export JSONObject; @ai-sdk/provider is where the library declares it.
import type { JSONObject } from '@ai-sdk/provider'
import { STEP_LIMIT, repeatedCallGuard, loopGuardPrepareStep, STREAM_IDLE_TIMEOUT_MS, createIdleWatchdog } from './loop-guards.ts'
import type { AutonomousAgent, ConversationRun } from '#types'
import { withCallPath, describeFileArguments, type CallPathContext } from '../files/call-path.ts'
import { buildSystemPrompt, modelTools, type ToolSet, usageIdentityFor, partsText, withAppendedText, type RunStopReason, type MessagePart } from './operations.ts'
import type { TurnTarget, TurnResult } from './turn-target.ts'
import { recordCall } from './turn-telemetry.ts'
import { setRunSystemPrompt } from './service.ts'
import { getSettings } from '../settings/service.ts'
import { resolveRoleModel } from '../models/service.ts'
import { CACHED_PREFIX_PROVIDER_OPTIONS, type ModelRole } from '../models/operations.ts'
import { securityKey } from '../cipher/service.ts'
import { partitionSubAgents, subAgentDelegation } from '../agent-session/sub-agents.ts'
import { WAIT_TOOL_NAME, type ChatActivity } from '@agents/shared/agent-activity'
import { toolDescription } from '@agents/shared/tool-description'
import { denyGoneApprovedTools, TOOL_NO_LONGER_AVAILABLE } from './approved-calls.ts'
import { browserToolSet } from '../agent-session/browser-tools.ts'
import { waitHandover, repairWaitInput, WAIT_ACCEPTED } from '../agent-session/host-events.ts'
import { checkAccountCreditCap } from '../usage/enforce.ts'
import { chargeModelCall } from '../usage/charge.ts'
import { createPartsRecorder, resultSettlement, errorSettlement } from './parts-recorder.ts'
import { tokenCountsOf } from '../usage/operations.ts'
import type { MemoryDocument } from '../memory/operations.ts'
import { mayBePageTool } from './service-tool-names.ts'
import { liveRuns } from './live-runs.ts'
import { renderGuidesBlock, workerGuides, type ServerGuide } from '../mcp-servers/guides.ts'
import { createReadSkillTool, READ_SKILL_TOOL_NAME } from '../mcp-servers/read-skill.ts'

const debug = Debug('df-agents:autonomous-agent-executor')

/** Shown when the provider returns no text at all, so the turn never renders blank. */
const EMPTY_COMPLETION_MESSAGE = 'I was not able to produce a response for this turn. Please try rephrasing the request.'

export interface ModelLoopContext {
  run: ConversationRun
  abortSignal: AbortSignal
  model: ReturnType<typeof resolveRoleModel>['model']
  entry: ReturnType<typeof resolveRoleModel>['entry']
  /** The turn's fixed tools: the catalog's, then the service's. The page's are added live (see assembleTools). */
  tools: ToolSet
  settings: Awaited<ReturnType<typeof getSettings>>
  budget: number
  /** The agent's memory as of run start, when it has one; rendered into the system prompt. */
  memory?: MemoryDocument[]
  autonomousAgent: AutonomousAgent
  /** The host of the site the turn acts on anonymously, when it is not one of the agent's own. */
  anonymousOn?: string
  unconfirmedOn?: string
  /** Where the turn reads its context from and writes its record to (see ./turn-target.ts). */
  target: TurnTarget
  /** The turn's call path: its files, and how it opens links (api/src/files/call-path.ts). */
  callPath: CallPathContext
  /** What the turn's tool servers say about their tools: rendered into the system prompt (api/src/mcp-servers/guides.ts). */
  guides?: ServerGuide[]
  /** How a skill of one of those servers is read: what a sub-agent worker's read_skill uses. */
  guidesRead?: (server: string, uri: string) => Promise<string>
}

export const runModelLoop = async (ctx: ModelLoopContext): Promise<TurnResult> => {
  const { run, abortSignal, model, entry, tools, settings, budget, autonomousAgent, target, memory, anonymousOn, unconfirmedOn, callPath, guides, guidesRead } = ctx
  // The page in front of the person as the turn started: its tools (below) and host events (folded into
  // the history by the target).
  const session = target.session
  // Computed ONCE: the prompt the model gets and the prompt recorded on the run must be the same string.
  const systemPrompt = buildSystemPrompt(autonomousAgent, memory, target.surface, { anonymousOn, unconfirmedOn, guides })
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
  // Accumulated per token class so the turn's telemetry can show WHERE the cost went, which is the
  // only way to see that cache reads were priced at the cached rate.
  const creditBreakdown = { input: 0, cachedInput: 0, output: 0 }
  /**
   * After a step was billed: the ACCOUNT cap (when `readAccount`), then the per-run budget. The account
   * cap first, so that when one step crosses both, the reader is told the one an admin can act on.
   */
  const checkCeilings = async (readAccount: boolean) => {
    const accountCap = readAccount ? await checkAccountCreditCap(run.owner) : undefined
    if (accountCap) {
      budgetExceeded = true
      stopDetail = `${accountCap.reason} (${accountCap.scope}, ${accountCap.period} limit ${accountCap.limit}, used ${accountCap.usage}). Resets at ${accountCap.resetsAt}.`
    } else if (credits >= config.turnCredits) {
      budgetExceeded = true
    }
  }
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
  /** A worker's final transcript, onto the lead's message: its results are already bounded as it records them. */
  const storeSubAgentTrace = (trace: { parentToolCallId: string, name: string, parts: MessagePart[] }) => {
    const stored = { type: 'data-subagent', data: { parentToolCallId: trace.parentToolCallId, name: trace.name, parts: trace.parts } } as MessagePart
    const at = parts.findIndex(part => part.type === 'data-subagent' && (part as any).data?.parentToolCallId === trace.parentToolCallId)
    if (at === -1) parts.push(stored)
    else parts[at] = stored
  }
  const buildDelegation: Parameters<typeof partitionSubAgents>[1] = (name, workerConfig, workerTools) => {
    const pinned = workerConfig.model as ModelRole | undefined
    const seat: ModelRole = pinned && WORKER_SEATS.includes(pinned) ? pinned : 'tools'
    const worker = seatFor(seat)
    // The worker uses the tools it reserves, so it reads what their servers say about them, and may load
    // their skills — its read_skill limited to those servers. Added unwrapped: workerTools are already the
    // model's tools, and read_skill envelopes its own result.
    const own = workerGuides(guides ?? [], Object.keys(workerTools), tools)
    const block = renderGuidesBlock(own)
    const config = block ? { ...workerConfig, prompt: [workerConfig.prompt, block].join('\n\n') } : workerConfig
    const ownTools = block && guidesRead
      ? { ...workerTools, [READ_SKILL_TOOL_NAME]: createReadSkillTool({ guides: own, read: guidesRead }) }
      : workerTools
    return subAgentDelegation({
      name,
      config,
      workerTools: ownTools,
      model: worker.model,
      abortSignal: AbortSignal.any([abortSignal, workerAbort.signal]),
      // The worker's transcript, streamed to its panel. The lead never sees it — it gets the summary.
      onTrace: trace => {
        // The FINAL transcript is also STORED, on the lead's message, so a reloaded thread and the
        // review page show what the worker did, where a streamed-only transcript would be
        // empty after a reload. As a `data-subagent` part, which the replay leaves out of what the
        // model is sent — the lead keeps seeing only the summary, the point of delegating.
        if (!trace.pending) storeSubAgentTrace(trace)
        target.frames.subAgent({ parentToolCallId: trace.parentToolCallId, name: trace.name, parts: trace.parts, pending: trace.pending })
      },
      onPhase: (parentToolCallId, phase) => {
        target.frames.activity(phase ? { kind: 'subagent', name, phase } : null, parentToolCallId)
      },
      // EVERY worker step is billed, exactly as a lead step is: against the run's budget, against the
      // account's credit cap, and into the usage histogram under the seat that served it (`tools`
      // unless the sub-agent pins another), so the spend is attributable to it. A delegated turn is often most of the work; leaving it
      // unmetered would have let any page with a sub-agent spend without limit.
      onUsage: async (usage, finishReason) => {
        // 0 steps: the spend is real, but a worker step is not a step of the LEAD's loop. With its own
        // telemetry entry, so review and the export show the delegated work rather than a turn whose
        // cost exceeds the calls that explain it.
        const stepCredits = await chargeModelCall({
          owner: run.owner,
          identity,
          modelRole: seat,
          entry: worker.entry,
          usage,
          finishReason,
          run: { run, durationMs: Date.now() - startedAt }
        })
        credits += stepCredits.total
        // The two ceilings, checked where the money was just spent. The lead's own `onStepEnd` does
        // this between ITS steps, which is too late to stop a worker that is still looping.
        await checkCeilings(true)
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
   * It works because the AI SDK re-reads the `tools` object it was given on every step — AI SDK 7 builds
   * each step's advertised and executable tools from it AFTER `prepareStep` — so a map refreshed IN PLACE
   * between steps is the live set, with no second loop and no fork of the SDK. Replacing the object would
   * do nothing; mutating it is the mechanism (pinned by tests/features/autonomous-agents/live-tool-set.unit.spec.ts).
   *
   * Only the PAGE's part moves. The catalog's MCP tools and the loop-provided wait tool are fixed for
   * the turn, so they are set aside once and the page's current tools are laid over them. The
   * sub-agent partition is re-run on the result, because a newly mounted component may declare a
   * sub-agent or a tool one reserves — and it is re-run only when the page's tool NAMES changed,
   * because each pass reads every sub-agent's config over the socket.
   */
  const pageToolNames = () => (session?.tools() ?? []).map(descriptor => descriptor.name).sort().join('\n')
  const fixedTools = modelTools(tools, sourced => withCallPath(sourced, callPath))
  const liveTools: Record<string, Tool> = {}
  const assembleTools = async () => {
    // The service's own tools are never page tools, even when a page registers one by that name
    // (./service-tool-names.ts): the page's would answer under the service's name.
    const mainTools = await partitionSubAgents(
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
    instructions: systemPrompt,
    messages: history,
    // Always the live map, even empty: `undefined` would freeze "no tools" for the whole turn, while an
    // empty object is "no tools for this step" and fills in when the page registers one.
    tools: liveTools,
    // Each step resends the turn so far, and the next turn the conversation: worth caching.
    providerOptions: CACHED_PREFIX_PROVIDER_OPTIONS,
    // Signs each approval request when it is issued and verifies it on replay, so a stored
    // `approved: true` that did not come through the decision route fails instead of executing.
    experimental_toolApprovalSecret: securityKey,
    // An approved call whose tool is gone is denied by name: the SDK would otherwise skip it silently.
    toolApproval: denyGoneApprovedTools(history, liveTools),
    stopWhen: [
      isStepCount(STEP_LIMIT),
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
    // No SDK `timeout`: the run's deadline (driveTurn) bounds the whole turn, stream included, and its
    // abort reaches the stream through abortSignal. The IDLE bound is ours (idleWatchdog below), not the
    // SDK's `chunkMs`, which counted a running tool as silence.
    onStepEnd: async (step) => {
      // Billed per step, not once per turn: a turn stopped by the budget or the clock must still bill
      // what it actually consumed. Its telemetry entry is the turn's, recorded once after the loop.
      const stepCredits = await chargeModelCall({
        owner: run.owner,
        identity,
        modelRole: 'assistant',
        entry,
        usage: step.usage,
        run: { run, steps: 1 }
      })
      credits += stepCredits.total
      creditBreakdown.input += stepCredits.input
      creditBreakdown.cachedInput += stepCredits.cachedInput
      creditBreakdown.output += stepCredits.output
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
      await checkCeilings(step.finishReason === 'tool-calls')
    },
    abortSignal: AbortSignal.any([abortSignal, idleAbort.signal])
  })

  // The turn's parts, in the order the model produced them. This IS the record: everything the model
  // saw has to end up here, or a revived conversation is a different conversation.
  const recorder = createPartsRecorder()
  const { parts, appendText } = recorder
  const live = liveRuns.get(run.id)
  if (live) live.parts = () => parts

  /**
   * Stream to the browser, if one is watching.
   *
   * The text is not persisted as it streams — the store gets it at the end, and a page attaching
   * mid-turn is served from ./live-runs.ts — so this is the only way it reaches anyone before then. The
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
  const sendMessageFrame = () => {
    target.frames.message(parts)
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

  try {
    for await (const part of result.stream) {
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
          // The activity is deliberately left alone. The wait may already have set "Waiting for …" by the
          // time this loop reads its call (AI SDK 7 runs a step's tools once the model call has finished,
          // not in step with this loop) — clearing the label here, as the first text-delta does, would
          // erase exactly that.
          }
        }
        recorder.openCall({
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          input: part.input,
          // Built by spreading presence rather than assigning possibly-undefined values: the library
          // types this slot as a JSONObject, which has no room for `undefined`, and a browser tool has
          // no catalog server to name.
          toolMetadata: {
            ...(tools[part.toolName]?.server ? { serverId: tools[part.toolName].server } : {}),
            ...(tools[part.toolName]?.annotations ? { annotations: tools[part.toolName].annotations } : {})
          } as JSONObject
        })
        // Immediately, not on the persist clock: a tool chip appearing is what tells the person the
        // assistant is doing something, and a call can take seconds. Waiting for the next token would
        // show the chip after the work it describes.
        sendMessageFrame()
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
          // The tool's own description, so the card can say what the call will do: the person deciding
          // reads it, and a reload or a reviewer reads the same words from the record. Gated calls only —
          // every other call would carry a copy of its tool's description for nobody.
          const description = toolDescription(liveTools[part.toolCall.toolName])
          // The files a gated call would send, as the person deciding reads them: path, type, size (spec §4.3).
          const files = await describeFileArguments(tools[part.toolCall.toolName]?.fileArgs, part.toolCall.input, callPath.files)
          Object.assign(call, {
            state: 'approval-requested',
            approval: { id: part.approvalId, ...(part.signature ? { signature: part.signature } : {}) },
            ...(description || files ? { toolMetadata: { ...call.toolMetadata, ...(description ? { description } : {}), ...(files ? { files } : {}) } } : {})
          })
          sendMessageFrame()
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
          recorder.settleCall(part.toolCallId, { state: 'output-available', output: 'Already waiting for the user.' })
          sendMessageFrame()
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
        const settled = resultSettlement(part.output)
        if (!recorder.hasCall(part.toolCallId)) {
          await target.settleEarlierCall(part.toolCallId, settled)
          continue
        }
        recorder.settleCall(part.toolCallId, settled)
        sendMessageFrame()
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
        const settled = errorSettlement(part.error)
        if (!recorder.hasCall(part.toolCallId)) {
          await target.settleEarlierCall(part.toolCallId, settled)
          continue
        }
        recorder.settleCall(part.toolCallId, settled)
        sendMessageFrame()
        await persistStructure()
        debug('tool failed tool=%s error=%o', part.toolName, part.error)
      }
      // AN APPROVED CALL WHOSE TOOL IS GONE (removed, denied since, or filtered out of an unattended run),
      // denied by name through `toolApproval` (./approved-calls.ts): a `tool-output-denied` part, not a throw
      // and not a `tool-error`. Stored as an error on the call's own part: left `approval-responded`, every
      // later replay would carry an approved call with no result after it. A call denied by the person never
      // comes through here, its stored `output-denied` already replays with its result. A call whose class was
      // relaxed to `allow` since the request is deliberately NOT denied: the person approved it and the policy
      // now requires less, so it runs.
      if (part.type === 'tool-output-denied' && !recorder.hasCall(part.toolCallId)) {
        await target.settleEarlierCall(part.toolCallId, { state: 'output-error', errorText: TOOL_NO_LONGER_AVAILABLE })
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
    // The SDK's own sum of the steps' usage: the same reports each step was billed from.
    usage: tokenCountsOf(await result.usage),
    credits,
    creditBreakdown,
    durationMs: Date.now() - startedAt,
    finishReason,
    steps,
    messageCount: history.length,
    ...(target.messageSeq !== undefined ? { historyUpToSeq: target.messageSeq } : {}),
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
    console.warn(`[empty completion] treated as a bug: ${run.kind} run ${run.id} of ${of} produced no text (model ${entry.id}, ${steps} step(s))`)
  }
  // No settled frame from here: the target's close sends the one a turn gets, once the message is
  // closed in the store (see TurnFrames).
  return {
    parts: finalParts,
    steps,
    credits,
    stopDetail,
    ...(handover ? { handover } : {}),
    ...(awaitingApproval ? { awaitingApproval: true as const } : {}),
    ...(idleAbort.signal.aborted ? { idleAborted: true as const } : {}),
    stopReason: emptyCompletion ? 'error' : stopReason,
    // The fallback above IS the explanation; a generic notice on top would be a second one.
    ...(emptyCompletion ? { selfExplained: true } : {})
  }
}
