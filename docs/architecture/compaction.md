# Conversation history compaction

History is compacted when the estimated prompt **fill** exceeds a **token budget**
derived from the assistant model's context window — never a fixed character count.

## The budget

The gateway computes the budget and advertises it to the client on every response,
via `contextBudget()` (`api/src/models/operations.ts`):

```
budget = floor(contextWindow × compaction.percent / 100)
```

- `compaction.percent` is an admin setting (`settings.compaction.percent`, default **70**).
  Higher means rarer compaction, better prompt-cache reuse, and more context kept.
- `contextWindow` resolves in this order: a per-role override in settings, then the
  context length snapshotted on the model when it was picked from the provider's
  listing, then a conservative fallback of **32000** tokens
  (`UNKNOWN_CONTEXT_WINDOW`) when neither is available.
- Only **OpenRouter** and the mock provider report a context length in their model
  listing today (`api/src/models/router.ts`, `fetchOpenRouterModels`). Every other
  provider — including **Ollama** — falls through to the override-or-32000 path:
  Ollama's `list()` response carries no `context_length` (that only lives in
  `show()`'s `model_info`, which is never called), so an Ollama-backed role always
  needs an explicit override to get a larger budget.
- The budget is always computed for the **`assistant`** role, whichever model role
  the request actually used — the client only ever compacts the main assistant
  history. The gateway sets it unconditionally, before any quota/moderation
  short-circuit, as the `x-context-budget` response header
  (`api/src/gateway/router.ts`). The client reads it in `noteStorageHeader`
  (`ui/src/composables/use-agent-chat.ts`) and stores it in `contextBudget`.

## Measuring fill

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

This all lives in the pure decision module
**`ui/src/utils/compaction-policy.ts`** (`decideCompaction`), which
`use-agent-chat.ts`'s `compactHistory` calls before every turn — it takes the
current `history`, `lastInputTokens`, `appendedChars` and `budget` and returns
either "don't compact" (with a reason) or a prefix to summarize plus a window to
retain. It is deliberately free of I/O so every branch is unit tested
(`tests/features/chat-hang/compaction-policy.unit.spec.ts`).

## What survives

When fill exceeds the budget, `decideCompaction` walks the history backwards from
the end, accumulating a **retained** tail sized at **30%** of the budget
(`RETENTION_SHARE`). That same 30% fill is the hysteresis: a fresh compaction lands
near it, so the very next turn cannot immediately re-trigger.

The cut point is then moved earlier, if needed, until it lands on a **turn
boundary** (`isTurnBoundary`): a point that never separates an assistant's
tool-call from the tool's result message. Providers reject a tool result whose
call is missing from the prompt, so this is a hard constraint, not a nicety.
Cutting earlier only ever retains more, so walking the boundary search backwards
from the tentative cut can never orphan anything the tail walk already accepted.

Everything before that cut becomes `prefixToSummarize`; the retained tail is kept
verbatim.

## Guards

Two conditions skip compaction even when the fill measure is over budget:

- **Nothing to compact** — fewer than two messages in history, or the walk finds no
  prefix left once the retained tail is subtracted (the whole history already fits
  the retention window; a huge measured prompt dominated by the system prompt and
  tool schemas also lands here, since there is no history left to reclaim).
- **Below the floor** — the prefix to summarize is under **20%** of the budget in
  tokens (`FLOOR_SHARE`), measured purely in tokens (no message-count clause: a
  message-count floor would refuse to compact a prefix that is a single enormous
  tool result, which is exactly the case that most needs compacting). Below that
  floor, a blocking summarizer call plus the prompt-cache invalidation it causes
  costs more than the context it would reclaim.

Compaction also **invalidates the provider's prompt cache**: rewriting the history
prefix into a summary means the provider can no longer reuse its cached prefix on
the next call. That's why compaction is deliberately late (a high default percent)
and rare (the retention hysteresis, the floor) rather than run on every turn.

## Re-summarizing a recap

A compacted history starts with a recap message, not raw dialogue. If a second
compaction is later needed, `compactHistory` tells the summarizer prompt that the
content it's given **begins with an earlier recap** and to merge rather than
re-digest it, so repeated compactions don't compound information loss.
`compactionGeneration` (an in-memory counter, reset alongside `history` on
`reset()`) tracks how many times this has happened; `decideCompaction` returns
`generation + 1` on every successful compaction.

## The summarizer call and tool-set pruning

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
  participant Chat as use-agent-chat (compactHistory)
  participant Policy as compaction-policy.decideCompaction
  participant LLM as Summarizer model (gateway)

  Chat->>Chat: budget = contextBudget.value (or sessionStorage override)
  Chat->>Policy: decideCompaction({ history, lastInputTokens, appendedChars, budget, generation })
  alt fill <= budget, or nothing left to compact, or prefix below floor
    Policy-->>Chat: { compact: false, reason }
    Chat->>Chat: proceed with the un-compacted history
  else over budget, prefix at or above the floor
    Policy-->>Chat: { compact: true, prefixToSummarize, retained, generation+1 }
    Chat->>LLM: generateText(summarizer model, prefixToSummarize [+ merge note if generation > 0])
    LLM-->>Chat: summary text
    Chat->>Chat: history = [recap(summary), ...retained]
    Chat->>Chat: prune promotedTools / announcedTools to retainedToolNames(retained)
    Chat->>Chat: lastInputTokens = 0; measuredChars = 0; compactionGeneration = generation+1
  end
```

## Testing override

`sessionStorage.setItem('agent-chat-compaction-threshold', ...)` still forces a
fixed budget for testing, bypassing the gateway-advertised value — but its unit is
now **tokens**, not characters, since the whole trigger is now token-based. A
saved override from before this change will be read as a token budget and so mean
something very different (typically a much larger effective threshold) than it did
under the old character-based trigger.

See `ui/src/utils/compaction-policy.ts` for the decision logic and
`tests/features/chat-hang/compaction-policy.unit.spec.ts` for its unit tests.

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
