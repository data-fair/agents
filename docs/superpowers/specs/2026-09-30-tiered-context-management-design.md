# Tiered context management

**Status:** IMPLEMENTED 2026-09-30
**Date:** 2026-09-30
**Supersedes:** §2.3 of `2026-09-30-adopt-the-ai-sdk-message-model-design.md`, which relegated
`pruneMessages` to the compaction-failure path. That was wrong — see below.

## The problem

Context management here is a single lever. When the history exceeds 70% of the model's window, the
**summarizer runs** — and that is the only remedy available. It is also the most expensive one: a
blocking model call, billed, on the critical path to the first token.

Two things made that worse rather than better:

- **Tool results now dominate the history.** Storing them was correct (a conversation must be revivable),
  but a single result may be 100 000 characters — about a quarter of a default budget — where the
  replayed history used to be mostly prose. Conversations cross the threshold far sooner, so the
  expensive lever is pulled far more often.
- **`TOOL_RESULT_LIMIT` is a bare truncation.** A result over the bound is cut with a marker appended.
  Nothing decides whether cutting is the right response to a large result, or whether that result needed
  to enter the context at its full size at all.

An earlier revision rejected pruning old tool results on the grounds that the assistant's prose captures
tool findings unreliably. That reasoning does not survive contact: **compaction discards the raw text of
the same span** and pays a summarizer to do it. Pruning old results is strictly less lossy and free.
The real defect in `pruneMessages` is different, and narrower — see §3.

## The state of the art

Three tiers, escalating in cost, applied in order. This is the convergent practice, not an invention
here.

**Tier 0 — keep it out.** Bound or summarise an oversized result where it is produced; for very large
payloads, offload to a store and hand the model a handle rather than the bytes.

**Tier 1 — clear old tool results.** The lightest-touch compaction. Anthropic's
`clear_tool_uses_20250919` is the reference implementation, and its semantics are the ones to copy:

- clears the **oldest** tool results, chronologically;
- **keeps the tool-call block**, so the model still knows it made the call;
- **replaces the result with placeholder text telling the model it was removed** — not silent deletion;
- parameters: `trigger` (default 100k input tokens), `keep` (default 3 tool uses), `clear_at_least`,
  `exclude_tools`, `clear_tool_inputs` (default false);
- the response reports `appliedEdits` with how much was cleared.

**Tier 2 — summarise.** What we have. Anthropic's own guidance is that compaction is the primary
strategy and clearing is for *"specific scenarios where you need more fine-grained control"*, naming
heavy tool use — which is what an autonomous agent is.

Known refinements, **out of scope here but planned rather than dismissed** — both recorded so they are
picked up deliberately:

- **Anchored incremental summarisation** for Tier 2. The production consensus: maintain a persistent
  structured recap and extend it per evicted span, rather than regenerating from the originals (what we
  do — correct, no compounding loss, but paid repeatedly) or chaining summaries of summaries (cheaper,
  compounds loss).
- **On-the-fly compaction of an oversized tool result**, instead of the bare truncation
  `TOOL_RESULT_LIMIT` performs today: summarise it once where it is produced, and above some size
  offload it to a store and hand the model a handle rather than the bytes. This is the honest answer to
  "a single result can be a quarter of the budget"; truncation is the crudest form of it.

## Why we implement Tier 1 ourselves

`clear_tool_uses_20250919` is **Anthropic-only**, behind a beta header. This service supports openai,
anthropic, google, mistral, openrouter, scaleway, ollama, openai-compatible and mock. A provider-native
feature can therefore be an optimisation for one provider, never the mechanism.

`@ai-sdk/anthropic` does expose it (request side, plus `contextManagement.appliedEdits` on the response,
and Anthropic's server-side compaction), so delegating Tier 1 when the provider is Anthropic stays
available as a later optimisation.

The SDK's provider-agnostic `pruneMessages` is close but not sufficient: verified, it removes the call
**and** the result with **no placeholder**. That is the blunt version of the strategy, and it is what the
earlier revision was reacting to without naming. We use it where its semantics fit and add the
placeholder ourselves where they do not.

## Design

Everything below affects **only what the model is sent**. The stored message log remains the
conversation of record and is never rewritten — the same rule the recap cache follows.

### One threshold, two remedies, in order

A second tunable threshold is not worth its weight. The existing budget (70% of the context window) is
the trigger; what changes is what happens when it fires:

1. **clear** old tool results (Tier 1);
2. **re-measure**;
3. **compact** only if still over budget (Tier 2).

So the summarizer becomes the second resort. For many conversations it should stop running at all.

### Tier 1 parameters

Anthropic's vocabulary, so the concepts are borrowed rather than reinvented:

| Parameter | Default | Note |
| --- | --- | --- |
| `keep` | 3 tool results | Anthropic's default. The most recent results are the ones still being reasoned about. |
| `clearAtLeast` | a small fraction of the budget | Avoids churn for a trivial saving; becomes load-bearing once prompt caching lands (below). |
| `excludeTools` | none | Per-agent configuration is a schema change and is deferred; the parameter exists so adding it later is not a redesign. |
| `clearToolInputs` | false | Arguments are small and are what makes a call auditable. Never cleared. |

**The placeholder is the load-bearing part.** A cleared result is replaced by text naming the tool, the
server, and that the payload was removed with its original size — so the model knows a result existed,
what produced it, and that it can call again if it needs the content. Silent deletion is what makes
pruning feel lossy; a marker makes it legible.

### Tier 1 needs no cache

Clearing is a **pure function of the stored history and the parameters**, so it is recomputed every turn
at zero cost. This is the structural difference from compaction, which needs the persisted recap
precisely because it costs a model call. No new stored state.

### Tier 0: bound at production

`TOOL_RESULT_LIMIT` keeps its value, but the cut becomes the same placeholder shape as a cleared result
rather than a bare `… [truncated]`, so one vocabulary covers both. Summarising an oversized result
instead of cutting it, and offloading very large payloads to a store, are **out of scope** — noted
because they are the honest answer to "a single result is a quarter of the budget", and they need their
own decision.

## Prompt caching

Clearing **invalidates the cached prompt prefix** — that is exactly why `clear_at_least` exists
upstream. We do not yet place cache breakpoints (a deferred item recorded as the bigger win), so today
this costs nothing. When caching lands, `clearAtLeast` stops being churn-avoidance and becomes the knob
that decides whether a clear is worth a cache write. Stated now so it is not rediscovered then.

## Requirement: one policy, both loops, written down

This is a requirement of the work, not an aspiration for later. There must be **one** context-management
policy, shared by the in-browser agents and the server-side autonomous agents, and it must be documented
so a reader can state what happens to a conversation as it grows without reading two implementations.

That rules out the shape this codebase already has elsewhere: two loops that *happen* to agree because
the same constant was copied. Concretely:

- **The decision is a pure function in `shared/`**, taking a history and the parameters and returning
  what to clear and what to summarise. It holds no state and touches no store, so both callers can use
  it unchanged.
- **Each loop keeps only its own application** of that decision — the browser rebuilds an in-memory
  history, the executor rebuilds from stored parts and persists a recap. Those are genuinely different
  and must stay separate; what must not differ is *when* and *what*.
- **A drift test pins that both loops route through the shared decision**, in the shape already used for
  `STREAM_IDLE_TIMEOUT_MS` and the chat driver's selectors: assert the call, not just the import, because
  an imported-and-unused function passes a weaker check while changing nothing.
- **`docs/architecture/context-management.md`** is part of the deliverable: the three tiers, the single
  threshold, what a placeholder means, and the caching interaction. The autonomous-agents subsystem is
  already the only concern in the repo with no topical architecture doc; this policy must not add a
  second undocumented one.

## Deviations from this spec, as implemented

- **The shared entry point is `decideContextManagement`**, which composes clearing, the re-measure and
  `decideCompaction` into one call. The spec described the clearing decision alone; making the whole
  ordered sequence the shared thing is what actually makes "one policy" enforceable — a loop can no
  longer route through tier 1 and then apply tier 2 on its own terms. The drift test asserts neither loop
  calls `decideCompaction` directly.
- **The placeholder names the server only when the provenance envelope is present.** The model messages
  carry a tool's name but not its server; the envelope inside the result text carries both, so the policy
  reads it opportunistically rather than requiring it.
- **A result smaller than its own placeholder is skipped.** Not anticipated here: clearing such a result
  would GROW the context. It falls out as the right treatment for a short tool error, with no extra knob.
- **`docs/architecture/compaction.md` was MERGED into `context-management.md` rather than left beside
  it.** The spec called the new doc new and did not notice the existing one; two docs on one policy is
  the duplication this work exists to remove. The merged doc keeps the old one's budget-resolution and
  fill-measurement detail, and fixes its stale claim that the policy lives under `ui/src/utils/`.
- **The compaction-failure fallback is now a tier-1 clear with `keep: 0`**, replacing `pruneMessages`
  entirely. §2.3 of the message-model spec had kept prune for exactly this path; clearing is strictly
  better there for the same reason it is better everywhere — it leaves the calls and a placeholder
  instead of nothing.

## Scope

- `shared/compaction-policy.ts` — the clearing decision and the placeholder, pure, beside
  `decideCompaction`. This is the single source of truth for both loops.
- `api/src/autonomous-agent-runtime/executor.ts` — apply clearing, re-measure, then compact.
- `api/src/autonomous-agent-runtime/operations.ts` — `boundToolResult` adopts the placeholder shape.
- `ui/src/composables/use-agent-chat.ts` — applies the same decision to its in-memory history. Required,
  not optional: a policy that only one loop follows is not a policy.
- `docs/architecture/context-management.md` — new.

## Testing

- Clearing keeps the `keep` most recent results intact and clears older ones oldest-first.
- A cleared result leaves its **call** in place and a placeholder naming the tool and the cleared size —
  asserted on the model messages, since that is the thing the model reads.
- `excludeTools` exempts a named tool even when it is the oldest.
- `clearAtLeast` suppresses a clear that would free too little.
- The store is untouched: the same conversation still replays completely through `loadHistory` with
  clearing disabled, so revival and audit are unaffected.
- A conversation that crossed the budget and is brought back under it by clearing alone makes **no
  summarizer call** — the saving is the point, so it is asserted directly rather than assumed.
- A conversation still over budget after clearing compacts as before.
- **Both loops route through the shared decision** — asserted against each call site, not merely its
  import, so a loop that diverges fails rather than drifting quietly.
- The documented behaviour matches the code: the architecture doc's threshold and `keep` default are
  pinned against the constants, the way AGENTS.md's claims about the NHI fixtures now are.

## Risks

- **It changes what the model sees on every turn past the threshold.** The mitigation is the placeholder:
  the model is told what is missing rather than being quietly given less.
- **Tier 1 and Tier 2 interact.** Clearing removes exactly the bulk that compaction would have
  summarised, so a later compaction summarises prose over payloads — better for the recap's quality, and
  a change in its character worth watching.
- **Two mechanisms where there was one.** Justified only because they are ordered and the cheap one runs
  first; if the ordering were ever reversed the cost saving disappears and the complexity remains.
