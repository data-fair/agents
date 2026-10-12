# Context management

What happens to a conversation as it grows past the model's window. **One policy, one loop**: the
server-side loop (`runModelLoop` in `api/src/conversations/model-loop.ts`) serves both the in-page chat's
personal assistant and configured autonomous agents, and the browser does no history management or
compaction at all.

The decision is `decideContextManagement` in `api/src/conversations/compaction-policy.ts` — pure,
stateless, and the only thing the loop calls. That is deliberate: before it, two loops (the browser's and
the server's) *happened* to agree because the same constant had been copied into each, and every context
bug on this branch came from one of the copies having drifted. There is one loop now, which settles that
by construction.

**Everything here affects only what the MODEL IS SENT.** The stored conversation is the record and is
never rewritten. A conversation whose context has been cleared and compacted a dozen times still replays
in full from the store.

## One threshold, three tiers, cheapest first

The trigger is a single number: the history no longer fits the **budget**, which is
`compactionPercent` (deployment config, default 70) percent of the assistant model's context window —
`contextBudget()` in `api/src/models/operations.ts`. What changed is what happens when it fires: it used
to be "run the summarizer", the most expensive remedy available and the only one.

| Tier | What it does | Cost |
| --- | --- | --- |
| **0 — keep it out** | Bound an oversized tool result where it is produced (`boundToolResult`, `TOOL_RESULT_LIMIT` = 100 000 chars) | free, and never reaches the context |
| **1 — clear** | Replace the payloads of old tool results with placeholders, keeping their calls | free, pure function of the history |
| **2 — compact** | Summarise the head of the history into a recap | a blocking, billed model call |

On each turn that crosses the threshold: **clear → re-measure → compact only if still over**. So the
summarizer is the second resort. For a tool-heavy conversation it should stop running at all, which is
the saving the ordering exists for.

## Tier 1, in detail

`clearOldToolResults` walks every tool result in the history, oldest first.

| Parameter | Default | Why |
| --- | --- | --- |
| `keep` | `KEEP_TOOL_RESULTS` = 3 | Anthropic's default. The newest results are the ones still being reasoned about. |
| `clearAtLeast` | `CLEAR_AT_LEAST_SHARE` = 2% of the budget | Clearing rewrites the head of the prompt, invalidating the provider's cached prefix. Below this, it is not worth the cache write. |
| `excludeTools` | none | Per-agent configuration is deferred; the parameter exists so adding it later is not a redesign. |
| tool inputs | **never cleared** | A call's arguments are small, and they are what makes the call auditable and a prompt injection visible. |

Three properties it holds, each load-bearing rather than incidental:

- **The message LIST is never changed**, only a payload inside it. So no tool result is orphaned from
  its call (which providers reject), `isTurnBoundary` still holds, and the loaded history's parallel
  `seqs` array — indexed by position — stays aligned.
- **All eligible results are cleared, not merely enough to get back under budget.** Upstream does the
  same. Clearing the minimum would invalidate the cached prefix again next turn for another small saving.
- **A result smaller than its own placeholder is skipped**, because clearing it would grow the context.
  That needs no knob and is what keeps a short tool error readable.

### The placeholder is the load-bearing part

A cleared result is replaced by text naming the tool, the server it came from when the provenance
envelope is present, the original size, and the fact that calling again would fetch it:

```
[earlier result of list_road_closures from dev-public-mcp removed to free context — 41203 chars.
 Call the tool again if you still need it.]
```

This is the whole difference from the SDK's `pruneMessages`, which — verified — removes the call
*together with* the result and leaves nothing behind, so the model reasons as though it had never asked.
Silent deletion is what makes pruning feel lossy; a marker makes it legible. Tier 0's truncation uses the
same vocabulary, so a reader and the model meet one wording for "part of this is gone, you can ask
again" rather than two.

### Why we implement it rather than configure it

Anthropic's `clear_tool_uses_20250919` is the reference implementation and the source of the parameter
vocabulary above, but it is **Anthropic-only, behind a beta header**, and this service supports openai,
anthropic, google, mistral, openrouter, scaleway, ollama, openai-compatible and mock. A provider-native
feature can be an optimisation for one provider, never the mechanism. `@ai-sdk/anthropic` does expose it,
so delegating tier 1 when the provider is Anthropic stays available later.

## Tier 2, in detail

`decideCompaction` walks backwards from the end of the history, keeping a tail worth
`RETENTION_SHARE` (30%) of the budget verbatim, then moves the cut earlier until it lands on a turn
boundary. Cutting earlier only ever retains more, so it can never orphan a tool result the walk had
already accepted. A prefix worth less than `FLOOR_SHARE` (20%) of the budget is not summarised at all:
below that, the blocking call plus the cache invalidation cost more than the context they reclaim.

Retaining 30% is also the hysteresis — a fresh compaction lands near that fill, so the next turn cannot
immediately re-trigger.

## Where it is applied

Each turn, `runModelLoop` calls `loadHistory` then `compactHistory`
(`api/src/conversations/turn-history.ts`) once, before the first model step; context is not
re-evaluated between the steps of a turn.

- **History is rebuilt from stored parts** every turn (`storedTurnsToModelMessages`), starting after the
  persisted recap when there is one, together with a parallel `seqs` array mapping each model message
  back to its stored message.
- **Measurement**: there is no prior response object in hand, so the decision is called with
  `lastInputTokens: 0` and the whole rebuilt history counted as unmeasured characters. It is
  conservative in the safe direction: the loop can compact slightly early, never slightly late.
- **The recap is persisted** on the conversation (`compaction.summary`, `generation`, `coversUpToSeq`,
  via `saveCompaction`), and the cut is aligned to a stored-message boundary (`alignCutToStoredMessage`)
  so the recap can be keyed on a `seq`.

The recap must be persisted: compaction costs a model call, so without the cache a conversation past the
budget paid a full summarizer call on every turn for ever. Tier 1 needs no such cache, because it is a
pure function of the history and the parameters — recomputed every turn for free. That asymmetry is
exactly why ordering the cheap tier first costs nothing.

Sub-agent workers are stateless single-shot runs (see [sub-agents](./sub-agents.md)) and are never
compacted.

## Prompt caching

Clearing **invalidates the cached prompt prefix** — that is why `clear_at_least` exists upstream. We do
not place cache breakpoints yet, so today this costs nothing and `clearAtLeast` is pure churn-avoidance.
When caching lands it becomes the knob deciding whether a clear is worth a cache write. Stated here so it
is not rediscovered then.

## Planned, and explicitly not done

Both are recorded so they are picked up deliberately rather than rediscovered:

- **Anchored incremental summarisation** for tier 2. The production consensus: maintain a persistent
  structured recap and *extend* it per evicted span. We currently re-summarise from the originals each
  time the window slides — correct, no compounding loss, but paid repeatedly. Chaining summaries of
  summaries is cheaper and compounds loss; anchored is the middle path.
- **On-the-fly compaction of an oversized tool result**, instead of tier 0's bare cut: summarise it once
  where it is produced, and above some size offload it to a store and hand the model a handle rather
  than the bytes. This is the honest answer to "a single result can be a quarter of the budget";
  truncation is the crudest form of it.

## Reference: how the budget is resolved

`performTurn` (`api/src/conversations/executor.ts`) resolves the assistant model for the turn and
computes the budget from it with `contextBudget()` (`api/src/models/operations.ts`):

```
budget = floor(contextWindow × compactionPercent / 100)
```

- `compactionPercent` is **deployment-global config**, not a per-account setting
  (`api/config/default.js`, env `COMPACTION_PERCENT`, default **70**). It is a
  tuning knob for operators — higher means rarer compaction, better prompt-cache
  reuse and more context kept — not something an org admin should have to reason
  about, so it is deliberately absent from the settings form. `contextBudget()`
  takes it as an argument so `models/operations.ts` stays pure.
- `contextWindow` is resolved on the catalog entry (`getModelCatalog`): for an org
  model, the entry's own `contextWindow` field in settings, then the context length
  snapshotted on the model when it was picked from the provider's listing, then
  **128000** tokens (`UNKNOWN_CONTEXT_WINDOW`); for a global model, its configured
  `contextWindow`, then 128000. A 0 means unset and falls through.
- The 128000 fallback is sized for the models actually put in the assistant seat —
  Claude Opus/Sonnet (200k), DeepSeek V4 Flash (1M), GLM 5.2 Flash — while sitting
  at or below the floor of that class, so it under-states rather than over-states.
  The trade-off is deliberate: a genuinely small self-hosted model that is never
  given an explicit window will overflow its context and have the request
  rejected by the provider, rather than compacting early and silently. Set the
  model's `contextWindow` for those deployments.
- The field belongs to the model entry, not to a role, so any entry may carry it;
  only the assistant's matters today, because the assistant is the sole seat whose
  history is compacted — the budget is always computed from the `'assistant'`
  entry. It is not merely an override: the snapshot on the model object is
  `readOnly` and populated by the autocomplete, so for every provider that reports
  no context length this field is the only way to supply one.
- Only **OpenRouter** and the mock provider report a context length in their model
  listing today (`api/src/models/router.ts`, `fetchOpenRouterModels`). Every other
  provider — including **Ollama** — falls through to the field-or-128000 path:
  Ollama's `list()` response carries no `context_length` (that only lives in
  `show()`'s `model_info`, which is never called), so an Ollama-backed model always
  needs an explicit value to get a larger budget.

## Reference: how fill is measured

The decision estimates fill rather than counting tokens exactly:

```
fill = lastInputTokens + estimateTokens(appendedChars)
```

`estimateTokens` converts characters at a fixed 4 per token (`CHARS_PER_TOKEN`). The formula can take a
provider-reported measurement of a previous turn (`lastInputTokens`, which would include the system prompt
and tool schemas), but the server loop never has one: it passes `lastInputTokens: 0` and the length of the
whole serialized rebuilt history as `appendedChars`. So in practice fill is an estimate over the history
alone, which leaves out the system prompt and tool schemas — another reason the budget sits well below the
window. After a tier-1 clear the policy re-measures the cleared history the same way.

The decision module is free of I/O so every branch is unit tested
(`tests/features/chat-hang/compaction-policy.unit.spec.ts`). It takes `history`, `lastInputTokens`,
`appendedChars`, `budget` and `generation` and returns the history to send (with any cleared payloads
applied) plus either "don't compact" (with a reason) or a prefix to summarise and a window to retain.

## Reference: the summarizer call

The summarizer call is an ordinary `generateText` against the model resolved for the `summarizer` role,
with `compactionSystemPrompt(generation - 1)` as system prompt — which adds a merge instruction from the
second compaction on — and the serialized prefix as a single user message. It shares the turn's abort
signal, so Stop and an agent's kill switch cancel it. A watching page is sent a `compacting` activity
label only once a compaction is actually going to run.

It is billed like any model call: its credits seed the run's credit budget, are recorded as usage under
`modelRole: 'summarizer'`, and appear as their own entry in the run's `calls`.

On success, history becomes `[recap, ...retained]`, where `recap` (`recapMessage`) is a single user
message wrapping the summary text (framed as a condensed record of the conversation so the model doesn't
mistake it for a fresh request — some providers also require history to start with a user message), and
the recap is persisted against `coversUpToSeq`.

A failure other than an abort is non-fatal, and does not fall back to the full history: every tool result
is cleared instead (`clearOldToolResults` with `keep: 0, clearAtLeast: 0`), keeping each call and its
placeholder, and the turn continues.

```mermaid
sequenceDiagram
  participant Loop as runModelLoop
  participant Hist as turn-history
  participant Policy as decideContextManagement
  participant LLM as Summarizer model
  participant Store as Mongo (conversations, messages)

  Loop->>Hist: loadHistory(conversationId, messageSeq)
  Hist->>Store: recap + messages after coversUpToSeq
  Hist-->>Loop: { messages, seqs, generation }
  Loop->>Hist: compactHistory(loaded, budget)
  Hist->>Policy: decideContextManagement({ history, lastInputTokens: 0, appendedChars, budget, generation })
  alt fill <= budget
    Policy-->>Hist: nothing to do
  else over budget
    Policy->>Policy: tier 1 — clear tool results older than the last `keep`, leaving placeholders
    Policy->>Policy: re-measure the cleared history from characters
    alt now under budget, or nothing left to compact, or prefix below floor
      Policy-->>Hist: { history: cleared, compact: false, reason }
      Hist-->>Loop: cleared history — NO model call, nothing billed
    else still over budget
      Policy-->>Hist: { history: cleared, compact: true, prefixToSummarize, generation+1 }
      Hist->>Hist: align the cut to a stored-message boundary
      Hist->>LLM: generateText(summarizer, prefix [+ merge note if generation > 0])
      LLM-->>Hist: summary text
      Hist->>Store: saveCompaction({ summary, generation, coversUpToSeq })
      Hist-->>Loop: [recap(summary), ...retained] + credits spent
    end
  end
  Loop->>Loop: add host context to the last user turn, then streamText
```

`retainedToolNames` (the exact tool names a retained window still references) is still exported from the
policy module and unit tested, but nothing calls it: it served the browser loop's tool-exploration
bookkeeping, and tool exploration is not implemented on the server loop (see
[tool exploration](./tool-exploration.md)).

## Testing

There is no runtime override of the budget: it comes from the assistant model, so a test sets a small
`contextWindow` on that model in settings instead (`tests/features/agents/compaction.e2e.spec.ts`). The
browser's former `sessionStorage` `agent-chat-compaction-threshold` knob went with the browser loop.

## Where the code is

- `api/src/conversations/compaction-policy.ts` — `decideContextManagement`, `clearOldToolResults`, `decideCompaction`,
  the placeholders, and every constant named above. The single source of truth.
- `api/src/conversations/compaction-prompt.ts` — the summarizer's system prompt and the recap message.
- `api/src/conversations/turn-history.ts` — `loadHistory` (rebuild from stored parts after the recap) and
  `compactHistory`: applies the decision, bills the summarizer call, persists the recap.
- `api/src/conversations/executor.ts` and `model-loop.ts` — `performTurn` computes the budget; `runModelLoop` calls the two
  above before the first step.
- `api/src/conversations/operations.ts` — `boundToolResult`, tier 0, applied as each tool result is stored.
- `tests/features/chat-hang/compaction-policy.unit.spec.ts` — the policy, including that the loop routes
  through it and that the numbers in this document match the constants.
