# Relaxing and reshaping history compaction

## Goal

History compaction currently fires far too early and destroys far too much. Make
it model-aware and much rarer, and make what survives useful:

- **Trigger** on a percentage of the assistant model's *context window* instead of
  a hardcoded character count.
- **Retain** recent turns verbatim instead of collapsing history to two messages.
- **Stop** re-summarizing summaries, and stop compacting when there is nothing
  worth reclaiming.
- **Account** for cached input correctly, since `cacheReadTokens` is already
  captured but billed at full input price.

This is an optimization, not a bug fix: no compaction failure has been diagnosed
in use. The motivation is that we are not using models near their capacity, in
context or in cache economics.

## Background — current behavior

- `ui/src/composables/use-agent-chat.ts:208` — `COMPACTION_THRESHOLD = 24_000`,
  measured as `JSON.stringify(history).length`. Roughly 6k tokens of content;
  against a 128k-window model that is ~5% of the window.
- `use-agent-chat.ts:416` (`compactHistory`) — when over threshold, history
  becomes exactly `[recapMessage, lastUserMessage]`. Every earlier turn is
  destroyed, including exact tool results and identifiers.
- The same function clears `promotedTools` and `announcedTools` wholesale, which
  `docs/architecture/tool-exploration.md:26` documents as a known limitation.
- Nothing guards against re-summarizing a previous recap: a long conversation
  re-crosses the threshold, summarizes its own summary, and compounds loss.
- `api/src/usage/operations.ts:73` — `computeCost` takes only input and output
  tokens. `cacheReadTokens` / `cacheWriteTokens` are extracted at
  `api/src/gateway/router.ts:26` and recorded into traces, but never priced.
- `api/src/models/router.ts` — every provider listing is normalized to
  `{ id, name }`; `context_length` and cache pricing reported by OpenRouter and
  Ollama are discarded.
- There is **no `cacheControl` anywhere in the codebase**. Anthropic caches
  nothing without explicit `cache_control` breakpoints, so Anthropic providers
  currently get zero prompt caching here. OpenAI, Google and vLLM-backed
  openai-compatible endpoints cache implicitly and already benefit.
- Sub-agents do not compact (`docs/architecture/sub-agents.md:204`) and are
  unaffected by everything below.

## Research — what other harnesses do

Every comparable harness triggers on a **percentage of the model's window**, not
an absolute size:

| Harness | Trigger |
|---|---|
| Claude Code | ~83–95% of window; `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` can only *lower* it; ~13k tokens reserved for the response |
| Roo Code / Kilo | user percentage slider, default 100% |
| Codex CLI | `auto_compact_limit` in tokens; guidance 150–200k on a 1M window (15–20%), "high enough to avoid premature resets" |
| **this project, today** | ~6k tokens ≈ **5%** of a 128k window |

None of them ask an admin to type the context window. Cline ships a `ModelInfo`
registry with `contextWindow`, `maxTokens`, `supportsPromptCache`, `inputPrice`,
`outputPrice`, `cacheWritesPrice`, `cacheReadsPrice`. [models.dev][modelsdev] is
the open-source equivalent (`limit.context`, `cost.input/output/cache_read/cache_write`).
OpenRouter's `/models` — which this project already calls — returns
`context_length` and `pricing.input_cache_read` / `input_cache_write`.

Compaction is understood across these sources as **cache-hostile**: cached reads
cost ~10% of input price, agent traffic runs roughly **100:1 input:output**, and
any edit to the prefix invalidates the cache from that point onward. Compaction
rewrites the prefix, so every compaction discards the whole cache, and the next
turn pays full price to rebuild it — on top of a blocking summarizer call and a
cache-miss TTFT penalty (~500ms → ~13s reported). The consensus rule is
**append-only history, evict from the tail not the head**: a dropped tool result
can be re-fetched, a destroyed cache prefix can only be rebuilt at full price.

There is no "optimal context size" to discover. Anthropic describes degradation
as a "performance gradient — not a hard cliff", and Chroma's context-rot study
found degradation at every input-length increment across 18 frontier models. So
no threshold sits just below a knee; the lever that improves quality is *what is
retained*, not where the line is drawn.

Sources: [Roo Code][roo] · [Kilo][kilo] · [Claude Code autocompact][cc] ·
[Codex CLI prompt caching][codex] · [Prompt caching as a harness constraint][yage] ·
[Anthropic, effective context engineering][anthropic] · [Chroma, context rot][chroma] ·
[models.dev][modelsdev]

[roo]: https://docs.roocode.com/features/intelligent-context-condensing
[kilo]: https://kilo.ai/docs/customize/context/context-condensing
[cc]: https://www.turboai.dev/blog/claude-autocompact-pct-override-guide
[codex]: https://codex.danielvaughan.com/2026/04/21/codex-cli-prompt-caching-maximise-cache-hits-cost-reduction/
[yage]: https://yage.ai/share/prompt-caching-harness-constraint-en-20260404.html
[anthropic]: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
[chroma]: https://www.trychroma.com/research/context-rot
[modelsdev]: https://github.com/anomalyco/models.dev

## Approach

### Trigger

```
budget   = contextWindow × compaction.percent      (default 70%)
appended = charsAppendedSinceLastMeasure / 4       (rough token estimate)
fill     = lastTurn.usage.inputTokens + appended

compact if fill > budget
```

`contextWindow` is resolved per role as: the role's `contextWindow` override, else
the value snapshotted on the picked model, else **32 000**.

Using the previous turn's provider-reported `inputTokens` as the base is what
makes the measure honest: it counts the system prompt and tool schemas, which a
`JSON.stringify(history).length` measure misses entirely and which are
substantial here and grow as tools register. The estimate covers only the delta
appended since that measurement, so estimation error is wiped out by the next
real number rather than accumulating.

**70% and not Claude Code's ~83%** because our measure lags by one turn and a
single large tool result can land between measurements; 70 buys the slack that
Claude Code buys with an explicit ~13k reserve.

**32 000 as the unknown-window fallback** is deliberately conservative: it is the
case where the provider reports nothing and nobody overrode it, which in practice
means local or self-hosted openai-compatible models that really may be small. It
is still ~4× more relaxed than today's effective ~6k.

### What survives

```
[ recapOfOldPrefix, …recent turns verbatim…, lastUserMessage ]
```

Recent turns are sized by budget, not by a fixed count: walk backwards from the
end accumulating estimated size until ~30% of the budget is retained, then cut.

**The cut must land on a turn boundary.** Splitting a tool call from its tool
result orphans one half, and providers reject that. This is the most likely way
to ship a real bug here and gets a dedicated unit test.

Retaining ~30% of budget also supplies the hysteresis: immediately after
compacting, fill sits near 30% of budget, so the next turn cannot re-trigger.

### Two guards the current code lacks

**Do not summarize summaries.** Carry the previous recap forward as the *head* of
the next prefix-to-summarize, and instruct the summarizer that it is merging an
existing recap with newer history rather than digesting raw dialogue. A
`compactionGeneration` counter makes the depth visible in traces.

**Do not compact for nothing.** If the prefix that would be summarized is under
20% of budget, skip. Paying a blocking summarizer call and a full cache
invalidation to reclaim a sliver is a straight loss. The floor is measured in
tokens only — a message-count clause would refuse to compact a prefix consisting
of one enormous tool result, which is the case that most needs it.

### Tool exploration state

Stop clearing `promotedTools` / `announcedTools`. Because recent turns now
survive verbatim, prune both sets to the tools still referenced in the retained
window. This removes the limitation documented at
`docs/architecture/tool-exploration.md:26`.

### Cache-awareness is accounting, not policy

Caching deliberately does **not** get its own threshold regime:

1. Compaction destroys the cache in both regimes, so the correct policy in both
   is "compact as late as safely possible". There is no branch to write.
2. With no `cacheControl` implemented, a per-model "supports caching" flag would
   describe behavior we do not have on Anthropic.

Cached and cache-write pricing therefore feed **cost and quota accounting only**.

### Rejected alternatives

- **Per-model compaction threshold.** Rejected: with no knee in the degradation
  curve, any per-model number is invented, and it multiplies configuration
  surface across five roles for no decision the percentage cannot express.
- **Hard window + separate internal fraction.** Rejected: hides the effective
  trigger in code and creates a second thing to tune.
- **models.dev lookup.** Viable and richer, but adds a third-party runtime
  dependency and model-id matching problems for self-hosted models. Reconsider if
  the provider-listing route proves too sparse in practice.
- **Keeping the cliff, triggered later.** Rejected: still loses all verbatim
  detail and still compounds summaries in long conversations.
- **Runtime lookup of the context window** via `getModelsForOwner`. Rejected: it
  is memoized for only 5 minutes, so a chat turn would occasionally block on a
  live provider listing fetch that can fail. Snapshot at pick time instead.

## Settings schema (`api/types/settings/schema.js`)

Each of the five role objects (`assistant`, `tools`, `summarizer`, `evaluator`,
`moderator`) gains three optional numbers, keeping the role cards symmetric:

- `contextWindow` — override; empty means "use what the provider reported".
- `cachedInputPricePerMillion` — default 0.
- ~~`cacheWritePricePerMillion`~~ — **removed after implementation** (2026-09-14).
  It was inert: nothing sets `cache_control`, so no provider reports write tokens.
  Cache-write tokens are billed at the plain input price instead of being dropped,
  since both `@ai-sdk/anthropic` and `@ai-sdk/openai` exclude them from `noCache`.
  Re-add the tariff when breakpoints land. Original rationale below.
- `cacheWritePricePerMillion` — default 0. Anthropic charges **1.25×** for cache
  writes, so omitting this under-bills. Inert until breakpoints land, but
  included now to avoid reopening the schema later.

`definitions.Model` gains an optional `contextWindow`, populated from the listing
when the admin picks a model in the autocomplete.

New top-level `compaction: { percent }`, default `70`, mirroring the existing
`moderation` block exactly: same `layout.if: 'parent.data.providers?.length'`, a
`defaultCompaction` in `api/src/settings/service.ts`, and
`body.compaction ?? defaultCompaction` in `api/src/settings/router.ts`.

This mirrors a proven shape on purpose. The settings form reports spurious
Save-button diffs when hidden sections and schema defaults disagree; no new shape
is invented here.

## Carrying the data through

`api/src/models/router.ts`: widen `CoreModelInfo` beyond `{ id, name }` and keep
what each provider reports.

- OpenRouter → `context_length` / `top_provider.context_length`,
  `pricing.input_cache_read`, `pricing.input_cache_write`
- Ollama → nothing usable. Its `list()` response carries only `parent_model`/`format`/`family`/`parameter_size`/`quantization_level`; the context length lives solely in `show()`'s `model_info` map, one extra HTTP call per model. Not worth it — and the advertised value is the model's maximum, whereas an Ollama server actually serves `num_ctx` (commonly 4096), so the number would mislead the budget. Ollama falls back to the 32000 default plus the admin override.
- OpenAI, Anthropic, Google, Mistral → report nothing; leave `undefined`

**Getting the budget to the client.** Compaction runs in
`ui/src/composables/use-agent-chat.ts`, which knows only role *names* and has no
idea which model or window backs `assistant`. Rather than add a public endpoint,
reuse the existing precedent — the gateway already advertises capability through
a response header that `noteStorageHeader` reads (`x-trace-storage: available`).
Add `x-context-budget: <tokens>` alongside it, computed for the assistant role.
It is absent before the first turn, which is harmless: compaction cannot be
needed before the first turn.

## Accounting

`computeCost` (`api/src/usage/operations.ts:73`) grows cached-read and
cache-write terms. Both token counts are already extracted at all three gateway
call sites and in `api/src/summary/router.ts`, so this is wiring, not new
capture. `getSummaryPricing` gets the same treatment.

**Resolved: `ai@6` normalizes the provider difference away.** Providers do
disagree natively (OpenAI's `prompt_tokens` includes `cached_tokens`, Anthropic's
`input_tokens` excludes `cache_read_input_tokens`), but `LanguageModelUsage` in
`node_modules/ai/dist/index.d.ts:266` exposes the split directly, so no probe is
needed:

- `usage.inputTokens` — **total** input tokens, inclusive of cache reads. This is
  also the fill measure used by the compaction trigger.
- `usage.inputTokenDetails.noCacheTokens` — the non-cached portion; bill this at
  the full input price.
- `usage.inputTokenDetails.cacheReadTokens` / `cacheWriteTokens`.

```
cost = (noCache × input + cacheRead × cachedInput
        + cacheWrite × cacheWritePrice + output × output) / 1e6
```

When `noCacheTokens` is undefined (older provider versions, the mock model),
fall back to `max(inputTokens − cacheRead − cacheWrite, 0)`. Never subtract when
`noCacheTokens` is present — take it verbatim.

Note `api/src/gateway/router.ts:24` currently reads `usage.inputTokens` as the
billable input. That is the *total*, so once cached pricing exists it would
double-count the cached portion; it must switch to `noCacheTokens`.

## Refactor

The policy is ~60 inline lines inside a ~1000-line composable, which is why it
has never been unit-tested. Extract the decision into a pure module,
`ui/src/utils/compaction-policy.ts`:

```ts
decideCompaction({ history, lastInputTokens, appendedChars, budget, generation })
  → { compact: false }
  | { compact: true, prefixToSummarize, retained, generation }
```

`compactHistory` keeps only the I/O: call the summarizer, splice the result,
update trace state.

## Testing

**unit** (alongside `tests/features/settings/1.settings.unit.spec.ts`)

- under budget → no compaction
- over budget → cut lands on a turn boundary
- **never splits a tool call from its tool result**
- floor guard: prefix under 20% of budget → skip
- recap carry-forward: `generation` increments, the old recap is not re-digested
- unknown window → 32k fallback
- `computeCost` with cached-read and cache-write tokens

**api**

- settings PUT/GET round-trip with the new fields
- `x-context-budget` present on gateway responses
- mock-provider listing carries `contextWindow`

**e2e**

- the settings form saves the new fields with **no spurious Save-button diff**
- a mock-provider conversation crossing a lowered threshold compacts and keeps
  its recent turns verbatim (the `sessionStorage` override stays for this)

## Migration and rollback

No migration script. Stored settings without `compaction` take
`{ percent: 70 }`; models without a snapshotted window fall back to 32k — still
~4× more relaxed than today — and self-heal when the admin next saves.

Rollback knob is the account-wide percent: if long conversations start hitting
provider context-length errors, dial it down with no deploy. The
`agent-chat-compaction-threshold` sessionStorage override is retained for tests.

## Docs to update

`docs/architecture/compaction.md` (rewrite), `providers.md` (roles table),
`tool-exploration.md:26` (limitation removed), `sub-agents.md:237` (references
the 24k threshold).

## Out of scope

- **Anthropic `cache_control` breakpoints** and the prefix-stability audit they
  require. This is the larger cost win — cache reads at ~0.1× turn a quadratic
  input bill roughly linear, with reported hit rates of 80–90% giving ~57% total
  cost reduction — but it is separate work with its own failure modes. This
  codebase actively fights prefix stability today: `<tools-available>` notices
  are injected into history, tools can register mid-turn (adbe558),
  `explore_tools` promotions mutate the advertised tool set, and tool definitions
  are not deterministically ordered. Cache hit rate is measurable before and
  after from the `cacheReadTokens` already in traces.
- Per-role compaction percentages.
- Re-litigating where the summarizer system prompt is pinned (deferred decision
  from the moderation work).
