/**
 * Runs one turn of an autonomous agent, in this process, asynchronously.
 *
 * Deliberately not resumable: a restart marks an in-flight run `interrupted`
 * (sweepInterruptedRuns) rather than trying to continue it. The spec chose this over
 * distributed run leasing until concurrency demands otherwise.
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
import { STEP_LIMIT, repeatedCallGuard, loopGuardPrepareStep } from '@agents/shared/agent-loop-guards'
import { decideCompaction } from '@agents/shared/compaction-policy'
import { compactionSystemPrompt, recapMessage } from '@agents/shared/compaction-prompt'
import type { AutonomousAgent, AutonomousAgentMessage, AutonomousAgentRun } from '#types'
import { runStopReasonMessage, buildSystemPrompt, wrapToolResult, type RunStopReason } from './operations.ts'
import { appendMessage, updateMessage, finishRun, incrementRunSpend } from './service.ts'
import { getSettings } from '../settings/service.ts'
import { resolveRoleModel } from '../models/service.ts'
import { contextBudget } from '../models/operations.ts'
import { computeCreditBreakdown } from '../usage/operations.ts'
import { openAutonomousAgentTools } from '../mcp-servers/client.ts'
import { enforceQuotas, type UsageIdentity } from '../usage/enforce.ts'
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
 */
const liveRuns = new Map<string, AbortController>()

/** True when this process actually aborted a live turn. */
export const abortRun = (runId: string): boolean => {
  const controller = liveRuns.get(runId)
  if (!controller) return false
  controller.abort()
  return true
}

/** One conversation is one serialised timeline, so the lock is keyed on it. */
const conversationLockId = (conversationId: string) => `autonomous-agent-conversation:${conversationId}`

/** What one turn produced. The model loop replaces the body that fills this in. */
interface TurnResult {
  content: string
  reasoning?: string
  toolCalls?: NonNullable<AutonomousAgentMessage['toolCalls']>
  steps: number
  credits: number
  stopReason: RunStopReason
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
 * The conversation so far, as model messages.
 *
 * Tool calls are NOT replayed as tool-call/tool-result pairs: the runtime persists only
 * what a reader needs (which tools were called), not the full wire exchange, so a past
 * turn's tool traffic is summarised into its assistant text instead. Replaying partial
 * pairs would produce a history the provider rejects.
 */
const loadHistory = async (conversationId: string, upToSeq: number): Promise<ModelMessage[]> => {
  const messages = await mongo.autonomousAgentMessages
    .find({ conversationId, seq: { $lt: upToSeq } }, { projection: { _id: 0 } })
    .sort({ seq: 1 })
    .toArray()
  return messages
    .filter(m => (m.content ?? '').trim())
    .map(m => ({
      role: m.role,
      // A user turn carries WHO wrote it. The system prompt tells the model the timeline is
      // shared and to attribute requests to whoever actually made them, which it cannot do
      // from an undifferentiated stream of `user` turns. On a shared timeline that is also a
      // safety property: one instructor's paste must not read as another's request.
      content: m.role === 'user' && m.author?.userName
        ? `[from ${m.author.userName}${m.author.userId ? ` (${m.author.userId})` : ''}]\n${m.content as string}`
        : m.content as string
    }) as ModelMessage)
}

/**
 * Compact the history when it no longer fits the budget.
 *
 * Unlike the browser loop, this has no provider-reported measurement of a previous turn to
 * work from — there is no prior response object in hand — so the whole history counts as
 * unmeasured and the decision runs on the character estimate alone. That is conservative in
 * the safe direction: it can compact slightly early, never slightly late.
 *
 * A failure here is non-fatal. Continuing with the full history risks a context-overflow
 * error from the provider, which the caller turns into a message; losing the turn entirely
 * to a summarizer hiccup would be worse.
 */
const compactHistory = async (
  history: ModelMessage[],
  budget: number,
  settings: Awaited<ReturnType<typeof getSettings>>,
  abortSignal: AbortSignal
): Promise<ModelMessage[]> => {
  if (!budget) return history
  const decision = decideCompaction({
    history,
    lastInputTokens: 0,
    appendedChars: JSON.stringify(history).length,
    budget,
    generation: 0
  })
  if (!decision.compact) {
    debug('no compaction: %s', decision.reason)
    return history
  }
  try {
    const { model } = resolveRoleModel(settings, 'summarizer')
    const { text: summary } = await generateText({
      model,
      system: compactionSystemPrompt(decision.generation - 1),
      messages: [{ role: 'user', content: JSON.stringify(decision.prefixToSummarize) }],
      abortSignal
    })
    debug('compacted %d messages into a recap', decision.prefixToSummarize.length)
    return [recapMessage(summary), ...decision.retained]
  } catch (err) {
    if (abortSignal.aborted) throw err
    debug('compaction failed, continuing with the full history: %O', err)
    return history
  }
}

/**
 * Wrap each MCP tool so its result reaches the model inside a provenance envelope.
 *
 * The envelope has to be applied where the result is produced rather than when history is
 * rebuilt, because within a single turn the AI SDK feeds tool results straight back to the
 * model without passing through this module.
 */
const withProvenance = (tools: Record<string, Tool>, serverOf: (name: string) => string): Record<string, Tool> => {
  const wrapped: Record<string, Tool> = {}
  for (const [name, tool] of Object.entries(tools)) {
    wrapped[name] = {
      ...tool,
      execute: tool.execute
        ? async (args: any, opts: any) => {
          const result = await tool.execute!(args, opts)
          if (typeof result === 'string') return wrapToolResult(serverOf(name), name, result)
          // A media result is an envelope the rest of the stack rebuilds into real image
          // parts by its marker. Stringifying it would inline the base64 into text, lose the
          // marker, and can blow the context window in a single step — so wrap only its text
          // and keep the object shape intact.
          if (result && typeof result === 'object' && '_agentsMediaResult' in (result as any)) {
            const media = result as any
            return { ...media, text: wrapToolResult(serverOf(name), name, String(media.text ?? '')) }
          }
          return wrapToolResult(serverOf(name), name, JSON.stringify(result))
        }
        : undefined
    } as Tool
  }
  return wrapped
}

/**
 * Perform the turn itself: resolve the model, gather the agent's tools, and run the loop.
 *
 * An autonomous agent with no verified NHI cannot run at all — its whole tool surface is
 * reached as that identity — so this refuses early with an actionable message rather than
 * producing a toolless turn that looks like a capability problem.
 */
const performTurn = async (run: AutonomousAgentRun, upToSeq: number, abortSignal: AbortSignal): Promise<TurnResult> => {
  const autonomousAgent = await mongo.autonomousAgents.findOne(
    { id: run.autonomousAgentId },
    { projection: { _id: 0 } }
  ) as AutonomousAgent | null
  if (!autonomousAgent) throw new Error('the autonomous agent no longer exists')
  // The kill switch. Disabling an autonomous agent must actually stop it answering, calling
  // tools as its identity, and spending credits.
  if (autonomousAgent.enabled === false) {
    return {
      content: 'This autonomous agent is currently disabled, so it cannot act. An administrator can re-enable it.',
      steps: 0,
      credits: 0,
      stopReason: 'error'
    }
  }
  if (!autonomousAgent.nhi?.clientId) {
    return {
      content: 'This autonomous agent has no non-human identity enrolled, so it cannot reach any of its tools. An administrator needs to complete its enrolment before it can run.',
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
      content: `This autonomous agent could not run: ${violation.reason} (${violation.scope}, ${violation.period} limit ${violation.limit}, used ${violation.usage}). Resets at ${violation.resetsAt}.`,
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
  const { tools: rawTools, serverByTool, close: closeTools } = await openAutonomousAgentTools(autonomousAgent)
  const tools = withProvenance(rawTools, name => serverByTool.get(name) ?? 'unknown')

  try {
    return await runModelLoop({ run, upToSeq, abortSignal, model, entry, tools, settings, budget, serverByTool, autonomousAgent })
  } finally {
    // The turn is over (normally, by throw, or by abandonment): release the MCP connections.
    await closeTools()
  }
}

interface ModelLoopContext {
  run: AutonomousAgentRun
  upToSeq: number
  abortSignal: AbortSignal
  model: ReturnType<typeof resolveRoleModel>['model']
  entry: ReturnType<typeof resolveRoleModel>['entry']
  tools: Record<string, Tool>
  settings: Awaited<ReturnType<typeof getSettings>>
  budget: number
  serverByTool: Map<string, string>
  autonomousAgent: AutonomousAgent
}

const runModelLoop = async (ctx: ModelLoopContext): Promise<TurnResult> => {
  const { run, upToSeq, abortSignal, model, entry, tools, settings, budget, serverByTool, autonomousAgent } = ctx
  const identity = usageIdentityFor(autonomousAgent)

  const history = await compactHistory(
    await loadHistory(run.conversationId, upToSeq),
    budget,
    settings,
    abortSignal
  )

  // Credits spent so far this turn, accumulated per step so the budget can stop the loop
  // between steps rather than only reporting the overrun afterwards.
  let credits = 0
  let budgetExceeded = false

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
      if (credits >= config.autonomousAgentRunCredits) budgetExceeded = true
    },
    abortSignal
  })

  let content = ''
  let reasoning = ''
  const toolCalls: NonNullable<AutonomousAgentMessage['toolCalls']> = []
  for await (const part of result.fullStream) {
    // 'error' parts do NOT throw — an unhandled one is how a conversation silently dropped
    // before. Turn it into a real failure so the caller reports it.
    if (part.type === 'error') throw part.error instanceof Error ? part.error : new Error(String(part.error))
    if (part.type === 'text-delta') content += part.text
    if (part.type === 'reasoning-delta') reasoning += part.text
    if (part.type === 'tool-call') {
      toolCalls.push({ toolCallId: part.toolCallId, toolName: part.toolName, serverId: serverByTool.get(part.toolName) })
    }
    // A tool that failed does not stop the turn — the model sees the error and usually keeps
    // talking — so without recording it a failed call reads exactly like a successful one.
    // That is not hypothetical: it hid a broken tool path for the whole of this plan.
    if (part.type === 'tool-error') {
      const failedCall = toolCalls.find(c => c.toolCallId === part.toolCallId)
      const detail = (part as any).error instanceof Error ? (part as any).error.message : String((part as any).error)
      if (failedCall) {
        failedCall.failed = true
        failedCall.error = detail
      }
      debug('tool failed tool=%s error=%s', part.toolName, detail)
    }
  }

  const steps = (await result.steps).length
  const finishReason = await result.finishReason
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
  return {
    content: emptyCompletion ? EMPTY_COMPLETION_MESSAGE : content,
    reasoning: reasoning || undefined,
    toolCalls: toolCalls.length ? toolCalls : undefined,
    steps,
    credits,
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
  liveRuns.set(run.id, abortController)

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
      content: '',
      runId: run.id,
      pending: true
    })

    // The assistant message's own seq bounds the history: it was created before the turn
    // (empty, pending), so it must not be fed back to the model as an empty turn.
    const result = await Promise.race([performTurn(run, message.seq, abortController.signal), deadline])
    // A turn that stopped for a reason other than finishing explains itself, appended to
    // whatever it did manage to produce.
    const notice = result.stopReason === 'completed' ? '' : runStopReasonMessage(result.stopReason)
    const content = [result.content, notice].filter(Boolean).join('\n\n')
    await updateMessage(message.id, {
      content,
      reasoning: result.reasoning,
      toolCalls: result.toolCalls,
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
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    // An abort is not a failure of the turn: distinguish the clock from a caller pressing
    // stop, and from a genuine error, because a reader reacts differently to each.
    const aborted = abortController.signal.aborted
    const timedOut = aborted && /timeout/i.test(String((abortController.signal as any).reason?.message ?? ''))
    const stopReason: RunStopReason = timedOut ? 'timeout' : aborted ? 'aborted' : 'error'
    // finishRun FIRST: whatever sent us here (a mongo blip, a shutdown) is likely to make
    // the message write fail too, and a run left `running` is worse than a message left
    // without its notice — the run is what every reader and the boot sweep key on. The
    // spend comes from `progress`, since a turn that threw never returned a result.
    await finishRun(run.id, {
      status: stopReason === 'timeout' ? 'error' : aborted ? 'aborted' : 'error',
      stopReason,
      error: detail
    }).catch(finishErr => console.error('autonomous agent run could not be closed out', finishErr))
    // No message exists if appendMessage itself failed; there is then nothing to update, and
    // the run above already carries the failure.
    if (message) {
      await updateMessage(message.id, { content: runStopReasonMessage(stopReason, detail), pending: false })
        .catch(updateErr => console.error('autonomous agent message could not be finalised', updateErr))
    }
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
 * Close out runs orphaned by a restart.
 *
 * The executor is in-process and non-resumable, so any run still marked `running` at boot
 * belongs to a process that is gone. Marking it `interrupted` gives a reader an honest
 * terminal state instead of a turn that appears to be thinking forever.
 *
 * Reuses the assistant message the run already created rather than appending a second one.
 */
export const sweepInterruptedRuns = async (): Promise<number> => {
  const candidates = await mongo.autonomousAgentRuns
    .find({ status: 'running' }, { projection: { _id: 0 } })
    .toArray()

  // A `running` run does NOT always belong to a dead process: with several API instances (a
  // rolling restart, or replicas) one of them may be executing it right now. A held
  // conversation lock is the evidence that someone is, so skip those — and because the lock
  // doc's TTL is refreshed only by its own holder, a genuinely dead process's lock expires
  // and its run is swept on a later pass.
  const heldLocks = new Set(
    (await mongo.db.collection<{ _id: string }>('locks')
      .find({ _id: { $regex: '^autonomous-agent-conversation:' } }, { projection: { _id: 1 } }).toArray())
      .map(doc => String(doc._id).replace('autonomous-agent-conversation:', ''))
  )
  const orphaned = candidates.filter(run => !heldLocks.has(run.conversationId))
  const skipped = candidates.length - orphaned.length

  for (const run of orphaned) {
    const existing = await mongo.autonomousAgentMessages.findOne(
      { runId: run.id, role: 'assistant' },
      { projection: { _id: 0 } }
    )
    // stopReason has no 'interrupted' member — the status carries that — so the reason is
    // 'error' with the restart named as the detail.
    const notice = runStopReasonMessage('error', 'interrupted by a restart')
    if (existing) {
      await updateMessage(existing.id, {
        content: existing.content ? `${existing.content}\n\n${notice}` : notice,
        pending: false
      })
    } else {
      const conversation = await mongo.autonomousAgentConversations.findOne(
        { id: run.conversationId },
        { projection: { _id: 0 } }
      )
      if (conversation) {
        await appendMessage(conversation, {
          role: 'assistant',
          author: { kind: 'autonomous-agent', userName: conversation.title },
          content: notice,
          runId: run.id,
          pending: false
        })
      }
    }
    await finishRun(run.id, { status: 'interrupted', stopReason: 'error', error: 'interrupted by a restart' })
  }

  if (orphaned.length) {
    console.log(`[autonomous-agents] swept ${orphaned.length} run(s) left running by a previous process`)
  }
  if (skipped) {
    console.log(`[autonomous-agents] left ${skipped} running run(s) alone: their conversation lock is still held, so another instance is executing them`)
  }
  return orphaned.length
}

/**
 * Recover a conversation whose run is queued with nobody to run it.
 *
 * `startRun` returns silently when the lock is held, trusting the holder to come back for the
 * run. If the holder died, its lock lingers for up to the lock TTL and then vanishes — at
 * which point nothing is watching, and the run would sit `running` until somebody happened to
 * post to that conversation again. This picks those up: a run whose conversation lock is NOT
 * held and which no live turn in this process owns.
 */
export const resumeQueuedRuns = async (): Promise<number> => {
  const queued = await mongo.autonomousAgentRuns
    .find({ status: 'running' }, { projection: { _id: 0 } })
    .toArray()
  let resumed = 0
  for (const run of queued) {
    if (liveRuns.has(run.id)) continue
    const locked = await mongo.db.collection<{ _id: string }>('locks')
      .findOne({ _id: `autonomous-agent-conversation:${run.conversationId}` })
    if (locked) continue
    resumed++
    // Not awaited as a group: each acquires the lock itself and drains its conversation.
    startRun(run).catch(err => console.error('autonomous agent queued run failed to resume', err))
  }
  return resumed
}
