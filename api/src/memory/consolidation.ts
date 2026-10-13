/**
 * Memory consolidation: a periodic, per-agent pass that tidies an agent's memory and records what people
 * asked it to remember but it did not (docs/architecture/agent-memory.md).
 *
 * Memory is written by the agent itself, during its runs. This pass runs at most once a day per agent,
 * and only after activity. It reads what people wrote and what the agent answered in the conversations
 * since the previous pass — never tool calls or results, so content from outside the organization reaches
 * memory only through a write the agent made in a run. It writes through the same `memory` tool as the
 * agent, so every change is versioned, attributed (to the consolidation) and can be restored.
 *
 * ARCHIVED threads are read too: an audited thread is the organization's record whatever the person did
 * with it in their own list.
 */
import mongo from '#mongo'
import locks from '@data-fair/lib-node/locks.js'
import Debug from 'debug'
import { generateText, isStepCount, type Tool } from 'ai'
import type { AutonomousAgent } from '#types'
import {
  agentStoreId, memoryEnabledFor, type MemoryAuthor, type ConsolidationConversation, consolidationDue, conversationsForConsolidation,
  consolidationSystemPrompt, consolidationUserMessage, MemoryCommandError, MEMORY_TOOL_NAME, MEMORY_SERVER_ID,
  CONSOLIDATION_STEP_LIMIT, CONSOLIDATE_LOOKBACK_DAYS
} from './operations.ts'
import { loadMemory } from './service.ts'
import { createMemoryTool } from './tool.ts'
import { withProvenance, usageIdentityFor } from '../conversations/operations.ts'
import { getSettings } from '../settings/service.ts'
import { resolveRoleModel } from '../models/service.ts'
import { CACHED_PREFIX_PROVIDER_OPTIONS } from '../models/operations.ts'
import { chargeModelCall } from '../usage/charge.ts'
import { checkAccountCreditCap } from '../usage/enforce.ts'

const debug = Debug('df-agents:memory-consolidation')
const LOCK_ORIGIN = 'memory-consolidation'
/** A pass is bounded by steps and input; this bounds a provider that hangs. */
const CONSOLIDATION_TIMEOUT_MS = 180_000
/** Conversations one pass reads at most, the most recently active; the transcript budget usually ends it first. */
const MAX_CONVERSATIONS = 100

type ConsolidationResult = { consolidated: boolean, reason: string }
type Owner = AutonomousAgent['owner']

/** The agent as consolidation needs it: still there, still enabled, memory still on. */
const findMemoryAgent = async (agentId: string, owner?: Owner) => {
  const agent = await mongo.autonomousAgents.findOne(
    { id: agentId, ...(owner ? { 'owner.type': owner.type, 'owner.id': owner.id } : {}) },
    { projection: { _id: 0 } }
  )
  return agent && agent.enabled !== false && memoryEnabledFor(agent) ? agent : null
}

/** Thrown out of a memory write once the agent lost its memory mid-pass: ends the pass, not a failure. */
class MemoryWithdrawnError extends Error {}

/**
 * When the agent last ran (its latest run's end): a conversation turn or a planned task's run. A task run is activity too even
 * though its content is not read: the agent may have written memory in it, which then needs tidying.
 */
const lastActivityAt = async (agentId: string): Promise<string | undefined> => {
  const run = await mongo.runs.findOne({ agentId }, { projection: { _id: 0, startedAt: 1, endedAt: 1 }, sort: { startedAt: -1 } })
  // Its end, when it has one: a turn still running when a pass read up to its start is then new again.
  return run ? (run.endedAt ?? run.startedAt) : undefined
}

export const maybeConsolidate = async (agentId: string, now = new Date()): Promise<ConsolidationResult> => {
  // Re-read the agent every time: memory disabled, the agent disabled or deleted — all mean no pass.
  const agent = await findMemoryAgent(agentId)
  if (!agent) return { consolidated: false, reason: 'memory-off' }
  const due = consolidationDue(agent.memoryConsolidation, await lastActivityAt(agent.id), now)
  if (!due.due) return { consolidated: false, reason: due.reason }

  const lockId = `memory-consolidation:${agent.id}`
  if (!await locks.acquire(lockId, LOCK_ORIGIN)) return { consolidated: false, reason: 'locked' }
  try {
    return await consolidate(agent, now)
  } catch (err) {
    if (err instanceof MemoryWithdrawnError) return { consolidated: false, reason: 'memory-off' }
    console.error(`memory consolidation failed for agent ${agent.id}`, err)
    await mongo.autonomousAgents.updateOne({ id: agent.id }, { $set: { 'memoryConsolidation.failedAt': new Date().toISOString() } })
    return { consolidated: false, reason: 'failed' }
  } finally {
    await locks.release(lockId)
  }
}

/**
 * The memory tool as consolidation uses it, every command preceded by a re-check that the agent still
 * exists with memory on: a pass in flight while its agent is deleted would otherwise write into a store
 * the cascade has just erased. A refusal ABORTS the pass rather than being handed to the model. Delete is
 * allowed: pruning is the pass's job, and a deleted document stays restorable from its versions.
 */
const consolidationMemoryTool = (agent: AutonomousAgent, author: MemoryAuthor, abort: AbortController): Tool => {
  const memoryTool = createMemoryTool({ storeId: agentStoreId(agent.id), owner: agent.owner, allowDelete: true, author: () => author })
  return {
    ...memoryTool,
    execute: async (args: any, opts: any) => {
      if (!await findMemoryAgent(agent.id, agent.owner)) {
        const err = new MemoryWithdrawnError(`memory was withdrawn from agent ${agent.id} during a consolidation`)
        abort.abort(err)
        throw new MemoryCommandError('Memory is no longer enabled for this agent; nothing was written.')
      }
      return await memoryTool.execute!(args, opts)
    }
  }
}

/**
 * The conversations active since `since`, with the text of their messages up to `until` — which stops
 * before the oldest message still being written: a turn's answer is created when the turn starts and
 * filled in as it runs, so reading past it would skip it for good once `until` moves on.
 */
const conversationsSince = async (agentId: string, since: string, now: Date): Promise<{ until: string, conversations: ConsolidationConversation[] }> => {
  const active = await mongo.conversations
    .find({ agentId, anonymous: { $ne: true }, lastMessageAt: { $gt: since } }, { projection: { _id: 0, id: 1, title: 1 } })
    .sort({ lastMessageAt: -1 }).limit(MAX_CONVERSATIONS).toArray()
  const writing = active.length
    ? await mongo.messages.findOne({ conversationId: { $in: active.map(c => c.id) }, pending: true, createdAt: { $gt: since } }, { projection: { _id: 0, createdAt: 1 }, sort: { createdAt: 1 } })
    : null
  const until = writing?.createdAt && writing.createdAt < now.toISOString() ? new Date(Date.parse(writing.createdAt) - 1).toISOString() : now.toISOString()
  const conversations: ConsolidationConversation[] = []
  for (const conversation of active.reverse()) {
    const messages = await mongo.messages
      .find({ conversationId: conversation.id, createdAt: { $gt: since, $lte: until } }, { projection: { _id: 0, role: 1, createdAt: 1, parts: 1 } })
      .sort({ seq: 1 }).toArray()
    if (messages.length) conversations.push({ id: conversation.id, ...(conversation.title ? { title: conversation.title } : {}), messages: messages as ConsolidationConversation['messages'] })
  }
  return { until, conversations }
}

const consolidate = async (agent: AutonomousAgent, now: Date): Promise<ConsolidationResult> => {
  // A pass is a real model call billed to the organization, so it never runs past the cap.
  if (await checkAccountCreditCap(agent.owner)) {
    await mongo.autonomousAgents.updateOne({ id: agent.id }, { $set: { 'memoryConsolidation.deferredAt': now.toISOString() } })
    return { consolidated: false, reason: 'credit-cap' }
  }
  const since = agent.memoryConsolidation?.until ?? new Date(now.getTime() - CONSOLIDATE_LOOKBACK_DAYS * 24 * 60 * 60000).toISOString()
  const { until, conversations } = await conversationsSince(agent.id, since, now)
  const transcript = conversationsForConsolidation(conversations)

  const settings = await getSettings(agent.owner)
  const { model, entry } = resolveRoleModel(settings, 'tools')
  const documents = await loadMemory(agentStoreId(agent.id))
  const withdrawn = new AbortController()
  const author: MemoryAuthor = { kind: 'consolidation', agentId: agent.id, since, until }
  const tools = withProvenance({ [MEMORY_TOOL_NAME]: consolidationMemoryTool(agent, author, withdrawn) }, () => MEMORY_SERVER_ID)

  // Billed per COMPLETED step, like a turn's: a pass that fails or is withdrawn after a step has still
  // spent that step's tokens. At the tools model's prices, under the agent's own identity, and with no
  // run: a consolidation has none, so its cost lives in usage only.
  const identity = usageIdentityFor(agent, { owner: agent.owner })
  let generated
  try {
    generated = await generateText({
      model,
      instructions: consolidationSystemPrompt(agent.title),
      messages: [{ role: 'user', content: consolidationUserMessage(documents, transcript) }],
      tools,
      // Up to CONSOLIDATION_STEP_LIMIT steps over the same transcript.
      providerOptions: CACHED_PREFIX_PROVIDER_OPTIONS,
      stopWhen: isStepCount(CONSOLIDATION_STEP_LIMIT),
      abortSignal: AbortSignal.any([withdrawn.signal, AbortSignal.timeout(CONSOLIDATION_TIMEOUT_MS)]),
      onStepEnd: async ({ usage }) => {
        await chargeModelCall({ owner: agent.owner, identity, modelRole: 'tools', entry, usage })
          .catch(err => console.error(`memory consolidation usage not recorded for agent ${agent.id}`, err))
      }
    })
  } catch (err) {
    if (withdrawn.signal.aborted) throw withdrawn.signal.reason
    throw err
  }
  // Settled after a refusal that the model loop happened to swallow: still nothing more to record.
  if (withdrawn.signal.aborted) throw withdrawn.signal.reason

  await mongo.autonomousAgents.updateOne(
    { id: agent.id },
    {
      $set: { 'memoryConsolidation.at': new Date().toISOString(), 'memoryConsolidation.until': until },
      $unset: { 'memoryConsolidation.failedAt': '', 'memoryConsolidation.deferredAt': '' }
    }
  )
  // A refused write is the model's to handle (it is told why), so it does not fail the pass.
  debug('consolidated agent %s over %s..%s in %d step(s)', agent.id, since, until, generated.steps.length)
  return { consolidated: true, reason: 'done' }
}

/**
 * The periodic trigger: every enabled agent with memory, each consolidated when due (consolidationDue).
 * Not batched: deciding is two indexed reads per agent, and a batch would let agents that are never due
 * hold every slot. `scope` narrows the agents, for tests only.
 */
export const sweepConsolidations = async (now = new Date(), scope: Record<string, unknown> = {}): Promise<number> => {
  const agents = await mongo.autonomousAgents
    .find({ 'memory.enabled': true, enabled: { $ne: false }, ...scope }, { projection: { _id: 0, id: 1 } })
    .toArray()
  let consolidated = 0
  for (const agent of agents) {
    if ((await maybeConsolidate(agent.id, now)).consolidated) consolidated++
  }
  return consolidated
}
