/**
 * Memory reflection: an out-of-loop pass that reads a conversation of an agent with memory and updates
 * that memory (docs/architecture/agent-memory.md §5.2).
 *
 * It reads the STORED conversation, which is complete and never rewritten — so nothing has to be
 * flushed before the turn's context is compacted, and the person never waits for it. It writes through
 * the same `memory` tool as the agent, minus delete, so every change it makes is versioned and
 * attributed like any other and can be restored.
 *
 * ARCHIVED threads are reflected too (no `archivedAt` check): an audited thread is the organization's
 * record whatever the person did with it in their own list (Arch D2).
 */
import mongo from '#mongo'
import config from '#config'
import locks from '@data-fair/lib-node/locks.js'
import Debug from 'debug'
import { generateText, stepCountIs, type Tool } from 'ai'
import { isAuditedAgentId } from '@agents/shared/agent-audit'
import type { AutonomousAgent, Conversation, ConversationRun } from '#types'
import {
  agentStoreId, memoryEnabledFor, type MemoryAuthor, reflectionDue, reflectableMessages, transcriptForReflection, reflectionSystemPrompt, reflectionUserMessage,
  MemoryCommandError, MEMORY_TOOL_NAME, MEMORY_SERVER_ID, REFLECTION_STEP_LIMIT, REFLECT_IDLE_MINUTES, REFLECT_LOOKBACK_DAYS, REFLECT_RETRY_MINUTES
} from './operations.ts'
import { loadMemory } from './service.ts'
import { runAsMessages } from '../tasks/run-messages.ts'
import { createMemoryTool } from './tool.ts'
import { withProvenance, usageIdentityFor } from '../conversations/operations.ts'
import { getSettings } from '../settings/service.ts'
import { resolveRoleModel } from '../models/service.ts'
import { computeCreditBreakdown } from '../usage/operations.ts'
import { recordUsage } from '../usage/service.ts'
import { checkAccountCreditCap } from '../usage/enforce.ts'

const debug = Debug('df-agents:memory-reflection')
const LOCK_ORIGIN = 'memory-reflection'
/** A reflection is bounded by steps and input; this bounds a provider that hangs. */
const REFLECTION_TIMEOUT_MS = 120_000
/** Candidates per sweep pass; the next pass picks up the rest. */
const SWEEP_BATCH = 50

type ReflectionResult = { reflected: boolean, reason: string, toSeq?: number }

/** The agent as reflection needs it: still there, still enabled, memory still on. */
const findMemoryAgent = async (agentId: string, owner: Conversation['owner']) => {
  const agent = await mongo.autonomousAgents.findOne(
    { id: agentId, 'owner.type': owner.type, 'owner.id': owner.id },
    { projection: { _id: 0 } }
  )
  return agent && agent.enabled !== false && memoryEnabledFor(agent) ? agent : null
}

/** Thrown out of a memory write once the agent lost its memory mid-reflection: ends the pass, not a failure. */
class MemoryWithdrawnError extends Error {}

export const maybeReflect = async (conversationId: string, trigger: 'turn' | 'idle' | 'manual', now = new Date()): Promise<ReflectionResult> => {
  const conversation = await mongo.conversations.findOne({ id: conversationId }, { projection: { _id: 0 } })
  if (!conversation || conversation.anonymous || !isAuditedAgentId(conversation.agentId)) return { reflected: false, reason: 'not-audited' }
  // Re-read the agent every time: memory disabled, the agent disabled or deleted since the turn — all
  // mean no reflection, and nothing written (Review Focus 5).
  const agent = await findMemoryAgent(conversation.agentId, conversation.owner)
  if (!agent) return { reflected: false, reason: 'memory-off' }
  const due = reflectionDue(conversation, trigger, now)
  if (!due.due) return { reflected: false, reason: due.reason }

  const lockId = `memory-reflection:${conversationId}`
  if (!await locks.acquire(lockId, LOCK_ORIGIN)) return { reflected: false, reason: 'locked' }
  try {
    return await reflect(conversation, agent, now)
  } catch (err) {
    if (err instanceof MemoryWithdrawnError) return { reflected: false, reason: 'memory-off' }
    // Never surfaces in the conversation; backs off the automatic triggers (reflectionDue).
    console.error(`memory reflection failed for conversation ${conversationId}`, err)
    await mongo.conversations.updateOne({ id: conversationId }, { $set: { 'memoryReflection.failedAt': new Date().toISOString() } })
    return { reflected: false, reason: 'failed' }
  } finally {
    await locks.release(lockId)
  }
}

/**
 * The memory tool as reflection uses it: delete disabled (Arch D11 — losing information is the one
 * thing a consolidator must not do), and every command preceded by a re-check that the agent still
 * exists with memory on. A reflection in flight while its agent is deleted would otherwise write into a
 * store the cascade has just erased, leaving memory that outlives its agent. A refusal ABORTS the pass
 * rather than being handed to the model as a tool error: there is nothing left for it to do.
 *
 * A write already past its check when the agent is deleted can still land; that window is one
 * findOne wide, and the next reflection of that agent never comes.
 */
const reflectionMemoryTool = (agent: AutonomousAgent, owner: Conversation['owner'], author: MemoryAuthor, abort: AbortController): Tool => {
  const memoryTool = createMemoryTool({
    storeId: agentStoreId(agent.id),
    owner,
    allowDelete: false,
    author: () => author
  })
  return {
    ...memoryTool,
    execute: async (args: any, opts: any) => {
      if (!await findMemoryAgent(agent.id, owner)) {
        const err = new MemoryWithdrawnError(`memory was withdrawn from agent ${agent.id} during a reflection`)
        abort.abort(err)
        throw new MemoryCommandError('Memory is no longer enabled for this agent; nothing was written.')
      }
      return await memoryTool.execute!(args, opts)
    }
  }
}

/**
 * Stamp a pass that could not proceed, so automatic triggers back off it like a failure (reflectionDue)
 * and the sweep stops spending a slot on it every pass.
 */
const defer = async (conversationId: string, now: Date, reason: string): Promise<ReflectionResult> => {
  await mongo.conversations.updateOne({ id: conversationId }, { $set: { 'memoryReflection.deferredAt': now.toISOString() } })
  return { reflected: false, reason }
}

type TokenCounts = { inputTokens: number, outputTokens: number, noCacheTokens?: number, cacheReadTokens?: number, cacheWriteTokens?: number }
const addOptional = (a: number | undefined, b: number | undefined) => a === undefined && b === undefined ? undefined : (a ?? 0) + (b ?? 0)

/**
 * The model pass both paths share: run the reflection model over a transcript with the memory tool bound to
 * `author`, bill every completed step under the agent's identity, and abort (throwing) when the agent loses
 * its memory mid-pass. `onBilled` records the spend on whatever the pass reflects (a conversation or a run).
 */
const runReflectionPass = async (
  owner: Conversation['owner'],
  agent: AutonomousAgent,
  transcript: ReturnType<typeof transcriptForReflection>,
  author: MemoryAuthor,
  onBilled: (credits: number) => Promise<void>
) => {
  const settings = await getSettings(owner)
  const { model, entry } = resolveRoleModel(settings, 'tools')
  const documents = await loadMemory(agentStoreId(agent.id))
  const withdrawn = new AbortController()
  const tools = withProvenance({ [MEMORY_TOOL_NAME]: reflectionMemoryTool(agent, owner, author, withdrawn) }, () => MEMORY_SERVER_ID)

  // Accumulated per COMPLETED step and billed in `finally`: a pass that fails or is withdrawn after a
  // step has still spent that step's tokens, and model spend must always reach the ledger.
  const spent: TokenCounts = { inputTokens: 0, outputTokens: 0 }
  let generated
  try {
    generated = await generateText({
      model,
      system: reflectionSystemPrompt(agent.title),
      messages: [{ role: 'user', content: reflectionUserMessage(documents, transcript) }],
      tools,
      stopWhen: stepCountIs(REFLECTION_STEP_LIMIT),
      abortSignal: AbortSignal.any([withdrawn.signal, AbortSignal.timeout(REFLECTION_TIMEOUT_MS)]),
      onStepFinish: ({ usage }) => {
        const details = usage?.inputTokenDetails
        spent.inputTokens += usage?.inputTokens ?? 0
        spent.outputTokens += usage?.outputTokens ?? 0
        spent.noCacheTokens = addOptional(spent.noCacheTokens, details?.noCacheTokens)
        spent.cacheReadTokens = addOptional(spent.cacheReadTokens, details?.cacheReadTokens)
        spent.cacheWriteTokens = addOptional(spent.cacheWriteTokens, details?.cacheWriteTokens)
      }
    })
  } catch (err) {
    if (withdrawn.signal.aborted) throw withdrawn.signal.reason
    throw err
  } finally {
    await bill(owner, agent, entry, spent, onBilled).catch(err => console.error(`memory reflection usage not recorded for agent ${agent.id}`, err))
  }
  // Settled after a refusal that the model loop happened to swallow: still nothing more to record.
  if (withdrawn.signal.aborted) throw withdrawn.signal.reason
  return generated
}

const reflect = async (conversation: Conversation, agent: AutonomousAgent, now: Date): Promise<ReflectionResult> => {
  const fromSeq = conversation.memoryReflection?.upToSeq ?? 0
  const unread = await mongo.messages
    .find({ conversationId: conversation.id, seq: { $gt: fromSeq }, pending: { $ne: true } }, { projection: { _id: 0, seq: 1, role: 1, parts: 1 } })
    .sort({ seq: 1 })
    .toArray()
  // Up to, excluding, a step whose approved result is still to be written into its own seq.
  const messages = reflectableMessages(unread)
  // reflectionDue saw unreflected messages, so none being readable means they are blocked (an approval
  // still to decide or run, a message still being written): deferred, not merely empty.
  if (!messages.length) return await defer(conversation.id, now, 'nothing-new')
  const toSeq = messages[messages.length - 1].seq

  // A reflection is a real model call billed to the organization, so it never runs past the cap.
  if (await checkAccountCreditCap(conversation.owner)) return await defer(conversation.id, now, 'credit-cap')

  const generated = await runReflectionPass(
    conversation.owner, agent, transcriptForReflection(messages),
    { kind: 'reflection', agentId: agent.id, conversationId: conversation.id, fromSeq: fromSeq + 1, toSeq },
    async credits => { await mongo.conversations.updateOne({ id: conversation.id }, { $inc: { 'memoryReflection.credits': credits } }) }
  )
  await mongo.conversations.updateOne(
    { id: conversation.id },
    {
      $set: { 'memoryReflection.upToSeq': toSeq, 'memoryReflection.at': new Date().toISOString() },
      $unset: { 'memoryReflection.failedAt': '', 'memoryReflection.deferredAt': '' }
    }
  )
  // A refused write is the model's to handle (it is told why), so it does not fail the pass — but it
  // leaves no trace anywhere else.
  const refused = generated.steps.flatMap(step => step.content).filter(part => part.type === 'tool-error').length
  debug('reflected conversation %s seq %d..%d in %d step(s), %d refused write(s)', conversation.id, fromSeq + 1, toSeq, generated.steps.length, refused)
  return { reflected: true, reason: 'done', toSeq }
}

/**
 * At the tools model's prices, under the agent's own identity — the accounting compaction uses
 * (turn-history.ts), minus the run: a reflection has none, so its cost lives in usage and on what it reflected.
 */
const bill = async (owner: Conversation['owner'], agent: AutonomousAgent, entry: ReturnType<typeof resolveRoleModel>['entry'], spent: TokenCounts, onBilled: (credits: number) => Promise<void>) => {
  const credits = computeCreditBreakdown(spent, entry, config.eurosPerCredit)
  if (!(credits.total > 0)) return
  const identity = usageIdentityFor(agent, { owner })
  await recordUsage(owner, {
    cost: credits.total,
    userId: identity.usageUserId,
    userName: identity.usageUserName,
    poolId: identity.poolId,
    dimensions: {
      modelRole: 'tools',
      model: entry.id,
      profile: identity.role,
      tokenCosts: { input: credits.input, cachedInput: credits.cachedInput, output: credits.output }
    }
  })
  await onBilled(credits.total)
}

/**
 * The idle trigger: every thread of an agent with memory that went quiet inside the lookback and has
 * unreflected messages. Bounded per pass, oldest activity first — the threads closest to leaving the
 * lookback — and the next pass picks up the rest. `batch` is a parameter for tests only.
 */
export const sweepIdleReflections = async (now = new Date(), batch = SWEEP_BATCH, scope: Record<string, unknown> = {}): Promise<number> => {
  const agents = await mongo.autonomousAgents.find({ 'memory.enabled': true, enabled: { $ne: false }, ...scope }, { projection: { _id: 0, id: 1 } }).toArray()
  if (!agents.length) return 0
  const idleBefore = new Date(now.getTime() - REFLECT_IDLE_MINUTES * 60000).toISOString()
  const notBefore = new Date(now.getTime() - REFLECT_LOOKBACK_DAYS * 24 * 60 * 60000).toISOString()
  const retryAfter = new Date(now.getTime() - REFLECT_RETRY_MINUTES * 60000).toISOString()
  const candidates = await mongo.conversations.find({
    agentId: { $in: agents.map(agent => agent.id) },
    lastMessageAt: { $lt: idleBefore, $gte: notBefore },
    // A thread in its failure or deferral backoff would be refused anyway; left in, a batch of them
    // could fill every slot of the pass and starve the threads that are due.
    'memoryReflection.failedAt': { $not: { $gte: retryAfter } },
    'memoryReflection.deferredAt': { $not: { $gte: retryAfter } },
    $expr: { $gt: ['$messageSeq', { $ifNull: ['$memoryReflection.upToSeq', 0] }] }
  }, { projection: { _id: 0, id: 1 } }).sort({ lastMessageAt: 1 }).limit(batch).toArray()
  let reflected = 0
  for (const candidate of candidates) {
    if ((await maybeReflect(candidate.id, 'idle', now)).reflected) reflected++
  }
  return reflected
}

/**
 * A task run is reflected ONCE, at its end (spec, "Boundary with agent memory"): its content is one
 * prompt and one answer, so there is no range to track — `memoryReflection.at` on the run is the mark.
 * A failed reflection is logged and the run stays as it closed.
 */
export const maybeReflectTaskRun = async (runId: string, closing?: Partial<ConversationRun>): Promise<ReflectionResult> => {
  const stored = await mongo.runs.findOne({ id: runId, kind: 'task' }, { projection: { _id: 0 } })
  // `closing` is what the run is about to be closed with: the task target follows up BEFORE the close, so
  // the stored run still reads `running` with its last streamed parts.
  const run = stored && { ...stored, ...closing }
  if (!run || run.status !== 'done') return { reflected: false, reason: 'not-reflectable' }
  if (run.memoryReflection?.at) return { reflected: false, reason: 'already-reflected' }
  const agent = await findMemoryAgent(run.agentId, run.owner)
  if (!agent) return { reflected: false, reason: 'memory-off' }

  const lockId = `memory-reflection:run:${runId}`
  if (!await locks.acquire(lockId, LOCK_ORIGIN)) return { reflected: false, reason: 'locked' }
  try {
    return await reflectTaskRun(run, agent)
  } catch (err) {
    if (err instanceof MemoryWithdrawnError) return { reflected: false, reason: 'memory-off' }
    console.error(`memory reflection failed for task run ${runId}`, err)
    return { reflected: false, reason: 'failed' }
  } finally {
    await locks.release(lockId)
  }
}

// A deferred (credit cap) or failed task-run reflection is deliberately not retried: "once, at its end".
const reflectTaskRun = async (run: ConversationRun, agent: AutonomousAgent): Promise<ReflectionResult> => {
  if (await checkAccountCreditCap(run.owner)) return { reflected: false, reason: 'credit-cap' }
  await runReflectionPass(
    run.owner, agent, transcriptForReflection(runAsMessages(run)),
    { kind: 'reflection', agentId: agent.id, runId: run.id, ...(run.taskId ? { taskId: run.taskId } : {}) },
    async credits => { await mongo.runs.updateOne({ id: run.id }, { $inc: { 'memoryReflection.credits': credits } }) }
  )
  await mongo.runs.updateOne({ id: run.id }, { $set: { 'memoryReflection.at': new Date().toISOString() } })
  debug('reflected task run %s', run.id)
  return { reflected: true, reason: 'done' }
}
