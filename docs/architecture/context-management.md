# Context management

What happens to a conversation as it grows past the model's window. **One policy, two surfaces**: the
in-browser agents and the server-side autonomous agents make the same decision, in the same place, and
differ only in how they apply it.

The decision is `decideContextManagement` in `api/src/conversations/compaction-policy.ts` — pure, stateless, and the
only thing either loop calls. That is deliberate: before it, two loops *happened* to agree because the
same constant had been copied into each, and every context bug on this branch came from one of the copies
having drifted.

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
  its call (which providers reject), `isTurnBoundary` still holds, and the executor's parallel `seqs`
  array — indexed by position — stays aligned.
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

## What differs between the two surfaces, and why that is fine

The decision is shared; the **application** is not, and forcing the two applications into one shape would
be worse than leaving them apart.

| | Browser | Autonomous executor |
| --- | --- | --- |
| Measurement | provider-reported input tokens of the previous turn, plus characters appended since | no prior response object in hand, so the whole history counts as unmeasured |
| History | an in-memory array, rewritten in place | rebuilt from stored parts each turn |
| Recap | held in memory for the session | **persisted** on the conversation (`compaction.summary`, `generation`, `coversUpToSeq`) |
| After the recap | tool promotion/announcement is pruned to what the retained window still references | the cut is aligned to a stored-message boundary so the recap can be keyed on a `seq` |

The measurement difference is a **parameter** to the shared decision (`lastInputTokens: 0`), not a second
implementation. It is conservative in the safe direction: the executor can compact slightly early, never
slightly late.

Only the executor persists a recap, and it must: compaction costs a model call, so without the cache a
conversation past the budget paid a full summarizer call on every turn for ever. Tier 1 needs no such
cache, because it is a pure function of the history and the parameters — recomputed every turn for free.
That asymmetry is exactly why ordering the cheap tier first costs nothing.

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

For a browser-resident loop the gateway computes the budget and advertises it to the client on every
response; the autonomous executor computes it directly, from the agent's own assistant model. Both call
the same `contextBudget()` (`api/src/models/operations.ts`):

```
budget = floor(contextWindow × compactionPercent / 100)
```

- `compactionPercent` is **deployment-global config**, not a per-account setting
  (`api/config/default.js`, env `COMPACTION_PERCENT`, default **70**). It is a
  tuning knob for operators — higher means rarer compaction, better prompt-cache
  reuse and more context kept — not something an org admin should have to reason
  about, so it is deliberately absent from the settings form. `contextBudget()`
  takes it as an argument so `models/operations.ts` stays pure.
- `contextWindow` resolves in this order: the **assistant role's** `contextWindow`
  field in settings, then the context length snapshotted on the model when it was
  picked from the provider's listing, then **128000** tokens
  (`UNKNOWN_CONTEXT_WINDOW`) when neither is available.
- The 128000 fallback is sized for the models actually put in the assistant seat —
  Claude Opus/Sonnet (200k), DeepSeek V4 Flash (1M), GLM 5.2 Flash — while sitting
  at or below the floor of that class, so it under-states rather than over-states.
  The trade-off is deliberate: a genuinely small self-hosted model that is never
  given an explicit window will now overflow its context and have the request
  rejected by the provider, rather than compacting early and silently. Set the
  assistant's `contextWindow` for those deployments.
- That field exists on the assistant role only, because the assistant is the sole
  role whose history is compacted — `contextBudget()` is always resolved for
  `'assistant'`. It is not merely an override: the snapshot on the model object is
  `readOnly` and populated by the autocomplete, so for every provider that reports
  no context length this field is the only way to supply one.
- Only **OpenRouter** and the mock provider report a context length in their model
  listing today (`api/src/models/router.ts`, `fetchOpenRouterModels`). Every other
  provider — including **Ollama** — falls through to the field-or-128000 path:
  Ollama's `list()` response carries no `context_length` (that only lives in
  `show()`'s `model_info`, which is never called), so an Ollama-backed role always
  needs an explicit override to get a larger budget.
- The budget is always computed for the **`assistant`** role, whichever model role
  the request actually used — the client only ever compacts the main assistant
  history. The gateway sets it unconditionally, before any quota/moderation
  short-circuit, as the `x-context-budget` response header
  (`api/src/gateway/router.ts`). The client reads it in `noteStorageHeader`
  (`ui/src/composables/use-agent-chat.ts`) and stores it in `contextBudget`.

## Reference: how fill is measured

Compaction cannot re-serialize the whole history to get an exact token count every
turn without defeating the point of avoiding extra work, so fill is an estimate:

```
fill = lastTurn.usage.inputTokens + estimateTokens(appendedChars)
```

- `lastTurn.usage.inputTokens` is the provider-reported total prompt size for the
  previous turn — it already counts the system prompt and tool schemas, which a
  measure over serialized history alone would miss entirely.
- `appendedChars` is how many characters have been pushed onto `history` since that
  measurement was taken (one snapshot of `JSON.stringify(history).length`, not
  per-message accounting), converted to a token estimate at a fixed 4 characters
  per token (`CHARS_PER_TOKEN`).

This is the browser's measurement. The autonomous executor has no prior response object in hand, so it
passes `lastInputTokens: 0` and counts the whole rebuilt history as unmeasured — the same decision, a
different parameter. Both live in the pure decision module **`api/src/conversations/compaction-policy.ts`**
(`decideContextManagement`), which each loop's own `compactHistory` calls before every turn — it takes the
current `history`, `lastInputTokens`, `appendedChars` and `budget` and returns the history to send (with
any cleared payloads applied) plus either "don't compact" (with a reason) or a prefix to summarise and a
window to retain. It is deliberately free of I/O so every branch is unit tested
(`tests/features/chat-hang/compaction-policy.unit.spec.ts`).

## Reference: the summarizer call and tool-set pruning

The summarizer call is an ordinary `generateText` against `provider.chatModel('summarizer')`
— the same gateway `/v1/chat/completions` route as any other model role, not a
separate endpoint. It is abortable (the shared per-turn `AbortController` also
covers this call, so Stop and the idle watchdog can cancel it) and best-effort: any
failure other than an abort is swallowed and the turn continues with the
uncompacted history.

On success, history becomes `[recap, ...retained]`, where `recap` is a single user
message wrapping the summary text (framed as a condensed record of the
conversation so the model doesn't mistake it for a fresh request — some providers
also require history to start with a user message).

`promotedTools` and `announcedTools` (the tool-exploration bookkeeping — see
[Progressive tool disclosure](./tool-exploration.md)) are **not cleared wholesale**.
They are pruned to `retainedToolNames(retained)`: the set of tool names the
retained window still provably references, matched by **exact** name only —
either a `toolName` on a retained `tool-call`/`tool-result` part, or a name listed
in a retained `<tools-available>` notice. A name that only appears as an ordinary
word in the recap's prose (e.g. "search" used as a verb) is dropped, never kept by
a substring match. Dropping a name that's actually still needed just costs a few
tokens to re-announce it; keeping one that isn't provably referenced risks
misleading the model about what's callable.

```mermaid
sequenceDiagram
  participant Loop as either loop (compactHistory)
  participant Policy as api/src/conversations/compaction-policy.decideContextManagement
  participant LLM as Summarizer model

  Loop->>Policy: decideContextManagement({ history, lastInputTokens, appendedChars, budget, generation })
  alt fill <= budget
    Policy-->>Loop: nothing to do
  else over budget
    Policy->>Policy: tier 1 — clear tool results older than the last `keep`, leaving placeholders
    Policy->>Policy: re-measure the cleared history from characters
    alt now under budget, or nothing left to compact, or prefix below floor
      Policy-->>Loop: { history: cleared, compact: false, reason }
      Loop->>Loop: send the cleared history — NO model call, nothing billed
    else still over budget
      Policy-->>Loop: { history: cleared, compact: true, prefixToSummarize, retained, generation+1 }
      Loop->>LLM: generateText(summarizer, prefixToSummarize [+ merge note if generation > 0])
      LLM-->>Loop: summary text
      Loop->>Loop: history = [recap(summary), ...retained]
      Loop->>Loop: browser: prune promotedTools / announcedTools to retainedToolNames(retained)
      Loop->>Loop: executor: bill the call, persist the recap against a stored-message boundary
    end
  end
  Loop->>Loop: after any rewrite: lastInputTokens = 0, measuredChars = 0
```

## Testing override (browser only)

`sessionStorage.setItem('agent-chat-compaction-threshold', ...)` still forces a
fixed budget for testing, bypassing the gateway-advertised value — but its unit is
now **tokens**, not characters, since the whole trigger is now token-based. A
saved override from before this change will be read as a token budget and so mean
something very different (typically a much larger effective threshold) than it did
under the old character-based trigger.

The autonomous executor has no equivalent override: its budget comes from the agent's assistant model,
so a test sets a small `contextWindow` on that model in settings instead.

## Known limitations

- **The evaluator chat compacts against the assistant's budget, not its own.** The
  budget is always computed for the `assistant` role and advertised as
  `x-context-budget` on every gateway response, regardless of which model role the
  request actually used (see "The budget" above). `ui/src/components/EvaluatorChat.vue`
  passes `modelName: 'evaluator'`, but the header it reads back was still sized off
  `contextBudget(settings, 'assistant')`, so the evaluator chat's history is
  compacted against the assistant model's context window rather than the
  evaluator model's. This is the correct default behavior, not a bug to fix:
  computing the budget per-request-role would let the summarizer's own turn (which
  also goes through the gateway) overwrite the assistant's budget with the
  summarizer's, corrupting the value the main chat relies on. Left as-is until the
  budget is tracked per-role on the client.

## Where the code is

- `api/src/conversations/compaction-policy.ts` — `decideContextManagement`, `clearOldToolResults`, `decideCompaction`,
  the placeholders, and every constant named above. The single source of truth for both loops.
- `api/src/conversations/compaction-prompt.ts` — the summarizer's system prompt and the recap message.
- `api/src/conversations/executor.ts` — `compactHistory`: applies the decision, bills the
  summarizer call, persists the recap.
- `api/src/conversations/operations.ts` — `boundToolResult`, tier 0.
- `ui/src/composables/use-agent-chat.ts` — `compactHistory`: applies the decision to its in-memory
  history and re-prunes tool announcements.
- `tests/features/chat-hang/compaction-policy.unit.spec.ts` — the policy, including that both loops
  route through it and that the numbers in this document match the constants.
