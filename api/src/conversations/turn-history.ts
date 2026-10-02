/**
 * Building the model's context for a turn: loading the conversation, and bringing it back within
 * budget when it has outgrown it.
 *
 * Split out of the executor, which owned this as well as the gates, the telemetry and the model loop.
 * The two belong together and nowhere else: `loadHistory` reads the stored turns and the compaction
 * recap that covers their prefix, and `compactHistory` is what produces that recap.
 */

import mongo from '#mongo'
import config from '#config'
import { generateText, type ModelMessage } from 'ai'
import Debug from 'debug'
import type { ConversationRun } from '#types'
import type { UsageIdentity } from '../usage/enforce.ts'
import { decideContextManagement, clearOldToolResults } from './compaction-policy.ts'
import { compactionSystemPrompt, recapMessage } from './compaction-prompt.ts'
import { storedTurnsToModelMessages, alignCutToStoredMessage } from './operations.ts'
import { saveCompaction, incrementRunSpend } from './service.ts'
import { resolveRoleModel } from '../models/service.ts'
import { computeCreditBreakdown } from '../usage/operations.ts'
import { recordUsage } from '../usage/service.ts'
import { sessionFor } from '../agent-session/registry.ts'
import { recordCall } from './turn-telemetry.ts'
import type { getSettings } from '../settings/service.ts'

const debug = Debug('df-agents:turn-history')

/** The loaded window, plus the stored seq each model message came from. */
export interface LoadedHistory {
  messages: ModelMessage[]
  seqs: number[]
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
export const loadHistory = async (conversationId: string, upToSeq: number): Promise<LoadedHistory> => {
  const conversation = await mongo.conversations.findOne(
    { id: conversationId },
    { projection: { _id: 0, compaction: 1 } }
  )
  const recap = conversation?.compaction
  // Only what the recap does NOT already cover. The messages it covers stay in the store untouched —
  // this is a cache for the MODEL's context, not a trim of the conversation.
  const stored = await mongo.messages
    .find(
      { conversationId, seq: recap ? { $gt: recap.coversUpToSeq, $lt: upToSeq } : { $lt: upToSeq } },
      // Only what builds the model's context. The whole post-recap window is materialised for every
      // turn — bounded by compaction, but loaded in full — and `author`, `createdAt`, `updatedAt`,
      // `version`, `pending`, `runId` and `owner` were coming with it and reaching nothing. `id` and
      // `seq` stay: the replay reports which message it rejected, and `seqs` maps the compaction cut
      // back onto stored messages.
      { projection: { _id: 0, id: 1, role: 1, parts: 1, seq: 1 } }
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
export const compactHistory = async (
  run: ConversationRun,
  identity: UsageIdentity,
  loaded: LoadedHistory,
  budget: number,
  settings: Awaited<ReturnType<typeof getSettings>>,
  abortSignal: AbortSignal,
  // Only so the compaction's own trace is gated exactly like the turn's — a summarizer call is a
  // model call on the person's conversation, so it is the same disclosure.
  tracing: { agentId: string }
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

    // Recorded too, so its cost is attributable rather than appearing as unexplained spend on the
    // turn beside it.
    recordCall(run, {
      modelRole: 'summarizer',
      entry,
      usage: {
        inputTokens: generated.usage?.inputTokens ?? 0,
        outputTokens: generated.usage?.outputTokens ?? 0
      },
      credits: compactionCredits.total,
      creditBreakdown: { input: compactionCredits.input, cachedInput: compactionCredits.cachedInput, output: compactionCredits.output },
      durationMs: Date.now() - startedAt,
      finishReason: generated.finishReason
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
