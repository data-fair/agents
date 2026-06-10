# Moderation v3: gateway-enforced, untrusted-only, observable

**Date:** 2026-06-10
**Branch:** feat-better-moderation
**Status:** approved, pre-implementation

## Context

The current moderation system (v2, "fold into the gateway, always-on") is a proof of
concept that does not hold up in production:

- The verdict is a full LLM round-trip racing a flat client-side 1.5s timeout. On slow
  providers it silently fails open — moderation does nothing exactly when needed, and
  nobody can tell.
- It is client-orchestrated, so direct gateway calls are never covered. It is advisory,
  not a boundary.
- Every user message pays a second metered gateway call, even for the overwhelming
  majority of messages that are trivially fine — and even for fully trusted users.
- The verdict is parsed from free-form model text with a regex, which misfires when the
  fallback chain resolves to a chatty assistant model.

## Decisions

- **Gateway-enforced.** Moderation runs inside `POST /:type/:id/v1/chat/completions`,
  server-side. It covers every caller and becomes a real boundary for untrusted traffic.
- **Untrusted callers only.** Only requests with `identity.isUntrusted` (roles
  `anonymous` and `external`, same definition as the untrusted pool quota) are moderated.
  Trusted roles (owner, org admin/contrib/user) pay zero cost and zero latency.
- **Moderator LLM only — no local heuristics tier.** Multilingual lexicons and
  injection regexes were considered and rejected: high curation cost (French profanity
  ambiguity, obfuscation, Scunthorpe-class false positives), trivially bypassed, and they
  buy no latency in this design because the LLM check races the assistant stream anyway.
- **Race, don't gate.** The moderation call and the assistant call start concurrently;
  outgoing content is buffered until the verdict or a 2.5s cap. Fail-open is repaired by
  a late abort: a verdict that arrives after the cap can still cut the stream.
- **Strikes with cooldown.** 5 blocks within 24h → 1h cooldown during which the caller
  is refused outright with zero LLM calls.
- **Observable by construction.** Every check writes a verdict event; an admin-only API
  and UI page expose stats (incl. fail-open rate), recent blocks, and a live test probe.
  This — not moderating admins' own messages — is how dysfunction becomes visible.
- **`moderator` is no longer a public model id.** It is removed from the gateway's
  `MODEL_IDS`; moderation is internal machinery. The settings slot and the
  `moderator → summarizer → assistant` fallback in `getModelConfig` remain.
- **OpenAI-compatible refusal shape.** Blocks surface as `finish_reason:
  "content_filter"`, plus a vendor-extension `moderation` field. No custom error
  vocabulary.

## Architecture

### Request flow (untrusted completions call)

```
resolveUsageIdentity (existing)
  │
  ├─ 0. strike check: moderation-strikes findOne(owner, usageUserId)
  │     in cooldown? → immediate content_filter refusal, no quota consumed,
  │                    no LLM calls, event action=strike-refusal
  ├─ enforceQuotas (existing), model resolution (existing)
  │
  ├─ 1. start BOTH concurrently:
  │     • moderateMessage(): generateObject on the moderator chain
  │     • streamText()/generateText(): the requested call
  │
  ├─ 2. streaming: send headers + initial role chunk immediately;
  │     buffer content-bearing chunks until verdict, max 2500ms
  │     non-streaming: hold the response for the verdict (same race)
  │
  ├─ allow          → flush buffer, stream normally; moderation field on final chunk
  ├─ block          → abort upstream stream, discard buffer, emit one chunk with
  │                   finish_reason "content_filter" + moderation field; record strike
  ├─ timeout/error  → FAIL OPEN: flush and continue; the verdict promise keeps
  │                   running — a late "block" aborts mid-stream (late-block) and
  │                   still records a strike
```

Trusted calls skip step 0–2 entirely — the handler is unchanged for them.

### What is moderated

The **last user-role message** of the request (all model roles, not just `assistant` —
guarding only `assistant` would leave `model: 'tools'` as an unmoderated direct-API
path). If the request contains no user message (tool-result continuation steps), the
check is skipped silently. Long messages are truncated to first 2000 + last 1000 chars
before being sent to the moderator.

A small in-memory LRU keyed by `(ownerKey, sha256(truncated message))`, TTL 10 min,
absorbs repeats: continuation steps and sub-agent calls within a turn re-derive from the
same last user message and hit the cache instead of paying a second verdict. Cached
verdicts still write an event (flagged `cached: true`, excluded from latency stats).
Per-instance only — a cost optimization, not state.

### The moderator call

New internal module `api/src/moderation/` (no public router for the check itself):

- `operations.ts` (pure): prompt building, message truncation, excerpt truncation,
  strike window/cooldown arithmetic, verdict normalization.
- `service.ts`: `moderateMessage()` — resolves the model via the existing
  `getModelConfig(settings, 'moderator')` chain, calls `generateObject` with schema
  `{ action: 'allow' | 'block', category?: string, reason?: string }`,
  `temperature: 0`, `maxOutputTokens: 100`; meters cost via `computeCost` +
  `recordUsage` with the resolved moderator pricing and the caller's identity/pool.
  Also owns the strike read/write and event recording.

The system prompt judges against a **generic server-side mission** ("an assistant
embedded in a data platform: data exploration, visualization, open-data Q&A") — the
request's own `system` prompt is attacker-controlled for direct API calls and is
deliberately not trusted for scoping. The `MODERATION_TASK` marker is kept so the mock
provider can recognize moderation requests. Block categories: profanity/hate/sexual/
harassment · prompt injection & persona override · clearly off-scope heavy tasks
(essays, code generation, general-purpose LLM use unrelated to the platform).

### Strikes

Collection `moderation-strikes`, one doc per offender:
`{ owner, userId, count, windowStartedAt, cooldownUntil?, updatedAt }` — atomic `$inc`
upsert on each block, TTL index expiring docs 48h after `updatedAt` (outlives
window + cooldown). Identity reuses the usage scheme
(`anon:<ipHash>` / external user id). Constants in api config (not settings, v1):

- `STRIKE_THRESHOLD = 5` blocks within `STRIKE_WINDOW = 24h` → `COOLDOWN = 1h`
- `MODERATION_TIMEOUT = 2500ms`

During cooldown the gateway answers `content_filter` immediately; these refusals are
recorded as `strike-refusal` events so a hammering abuser stays visible.

## Observability

### Verdict events

Every check writes one doc to `moderation-events`, TTL 30 days:

```
{ owner, ts, action: allow | block | late-block | fail-open-timeout
          | fail-open-error | strike-refusal,
  category?, reason?, latencyMs, cached?, role: anonymous | external,
  userId, modelRole, messageExcerpt? }
```

Privacy rule: `allow` and fail-open events store **no message content**. Only `block` /
`late-block` events keep a ~500-char excerpt — that excerpt is the review payload.
Events are written regardless of trace consent: storing abuse attempts for security
review is a legitimate-interest justification distinct from consensual trace review;
same 30-day retention.

### Admin API — `/api/moderation` (admin-only, unlike its v1 ancestor)

All routes `reqSessionAuthenticated` + `assertAccountRole(owner, 'admin')`:

- `GET /:type/:id/stats?days=30` — counts by action (per day + totals), average and p95
  verdict latency (excluding cached), fail-open rate.
- `GET /:type/:id/events?action=block&page=…` — paginated recent events for
  false-positive review.
- `POST /:type/:id/probe` — runs three canned messages (benign / injection / profanity)
  through the live moderator config; returns `[{ probe, action, category, latencyMs }]`.
  Metered as normal usage; **not** written to events (would pollute stats).

### Admin UI

One new admin page (sibling of the trace-review page, en/fr i18n): stat cards (checks,
blocks, fail-open rate, average latency — last 30 days), recent-blocks table
(ts, category, reason, excerpt, caller), and a "test moderation" button rendering probe
results inline. Warning banner when fail-open rate over the last 24h exceeds 20% with at
least 10 checks — the "it's silently broken" alarm.

## Trace review integration

Moderation becomes an **embedded field on the stored trace request**, not a sibling
physical request:

- `StoredTraceRequest` gains `moderation?: { action, category?, reason?, latencyMs,
  failOpen? }`, written by the gateway when trace storage is active for the call (same
  consent gating as today).
- **Blocked turns are no longer orphans.** The gateway records the blocked request with
  `response: { content: '', toolCalls: [], finishReason: 'content_filter' }` plus the
  verdict — even though nothing was forwarded to the provider.
- `reconstruct-trace.ts`: moderation steps are read directly from `request.moderation`;
  the `moderation:<turnId>` context matching, orphan-turn synthesis, and re-parsing via
  `parseModerationVerdict` are deleted. **Clean break:** old stored moderation-context
  requests render as unknown-context requests for at most 30 days (TTL); the
  `moderation` `contextKind` is dropped from parsing.
- Client-side live trace: the response's `moderation` vendor field (final chunk /
  completion JSON: `{ action, category?, failOpen?, latencyMs }` — `reason` and excerpts
  stay server-only) feeds the session recorder's existing `moderation` entry type, so
  allow / block / fail-open all remain visible in the in-chat debug dialog.
  `TraceView.vue` keeps its allow/block/skip chips with a shape adaptation.

## Client changes

The browser stops orchestrating moderation:

- Delete `ui/src/composables/moderation.ts`; remove from `use-agent-chat.ts` the
  parallel moderator call, first-byte withholding, and the 1.5s timeout.
- New behavior: **any chunk or result with `finish_reason: 'content_filter'`** (first
  chunk, mid-stream late block, main turn or sub-agent loop) → stop the turn, discard
  partial assistant text, drop the user message from model context, show the existing
  localized refusal (same en/fr strings).
- The recorder logs the moderation trace entry from the response's `moderation` field.

## Mock provider

`mock-model.ts` updated: the mock moderator answers `generateObject` (structured
output), recognizes the `MODERATION_TASK` marker, blocks on trigger keywords (e.g.
"jailbreak", a canned profanity), and delays the verdict ~4s when the message contains
a slow-moderation trigger phrase — making fail-open and late-block testable.

## Error handling

Every internal failure resolves to **allow** and is named in the events stream:

- moderator timeout → `fail-open-timeout` (+ `late-block` with stream abort if the
  verdict eventually says block)
- provider error / schema-invalid output / no resolvable model → `fail-open-error`
  (when no model resolves at all, the main call fails on its own anyway)
- moderation usage is metered but never independently 429s — the caller already passed
  the quota gate; a strike-cooldown refusal consumes no quota
- MongoDB unavailability propagates exactly as it does for quota checks today

## Settings / schema

No settings changes in v1. The `moderator` model slot keeps working. Thresholds,
timeout, and the refusal message stay hardcoded.

## Tests

Rewrite `tests/features/moderation/`:

- **Unit:** prompt building (generic mission, no request-system-prompt trust),
  head+tail truncation, verdict normalization, strike window/cooldown arithmetic,
  verdict-cache behavior, excerpt truncation.
- **API:** anonymous abusive → `content_filter` + block event with excerpt; anonymous
  benign → normal stream + contentless allow event; org member abusive → not moderated
  (no event, normal response); slow moderator → flush then late abort
  (`fail-open-timeout` + `late-block`); 5 blocks → 6th request refused with zero mock
  invocations (`strike-refusal`); verdict cache → second identical message, one mock
  invocation, two events; admin stats/events/probe + 403 for non-admins;
  `model: 'moderator'` from outside → 400; blocked request stored in traces with
  embedded verdict when consent given.
- **E2E (lean):** anonymous user sends abusive message → localized refusal bubble,
  user message dropped from context; admin moderation page shows stats + the block +
  probe results.

## Docs

Rewrite `docs/architecture.md` §8 for: gateway-enforced, untrusted-only, race +
late-abort, strikes, events/admin page, trace embedding.

## Out of scope (unchanged from v2)

- Output moderation; tool-result / indirect prompt-injection coverage; multi-turn
  jailbreak detection (single-message checks only).
- Configurable thresholds, role lists, or refusal text.
- The `/api/summary` endpoint is not moderated: its content has already passed the
  gateway gate when originally submitted by the user. Direct abuse of the summary
  endpoint as a generic LLM is bounded by its fixed summarization prompt and quotas.

## Amendments (2026-06-10, plan-time)

Exploration during planning corrected four points:

1. **No vendor `moderation` field on gateway responses.** Live in-browser trace
   recording no longer exists (the 2026-06-09 trace simplification made
   `SessionRecorder` a read-only viewer over server-reconstructed traces), so the
   client needs nothing beyond `finish_reason: "content_filter"`. The review page
   and in-chat debug dialog both read the verdict from the `moderation` field
   embedded in stored trace requests.
2. **One event per check.** A check that times out and later resolves `allow`
   records a single `fail-open-timeout` event (with the real settle latency); one
   that times out and later resolves `block` records a single `late-block` event.
   No double counting. A check whose verdict has not settled by the time a trace
   request is recorded simply has no `moderation` field on that trace doc — the
   events collection remains the authoritative record.
3. **Sub-agent blocks degrade gracefully.** A `content_filter` on a sub-agent's
   gateway call surfaces the refusal as that sub-agent's output (visible to the
   main agent and the UI) instead of aborting the whole turn; only a block on the
   main turn's call aborts the turn. Sub-agent task texts are written by the
   assistant, so blocks there are rare false positives — degrading beats nuking.
4. **Admin UI placement and stats shape.** The moderation admin UI is a section on
   the existing `/:type/:id/activity` page (the established admin surface), not a
   new page. The stats endpoint returns per-action totals, avg/p95 verdict latency,
   and a last-24h fail-open sample — no per-day series in v1. Old stored
   `moderation:<turnId>` context requests are dropped from reconstruction entirely
   (they expire within 30 days).
