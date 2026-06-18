# Input moderation guard

A gateway-enforced, per-message guard protects the platform from abuse — profanity, prompt-injection attempts, persona override, and using the assistant as a free general-purpose tool unrelated to the platform's data (general chatbot use, essays, writing substantial general-purpose software). The off-scope criterion is scoped to that misuse: data exploration/analysis/visualization, working with dataset and file content, small scripts that consume the platform's data or API, and delegated sub-agent tasks all stay in scope even when detailed or technical, so legitimate work (notably sub-agent task delegations) is not blocked as off-platform. Writing general-purpose code is out of scope, but a small data/API-consuming script is allowed, and the ambiguous middle resolves to allow. Moderation is **opt-in per organization**: an admin enables it and chooses which user categories it applies to (any of `anonymous`, `external`, `user`, `contrib`, `admin`). It is off by default; categories that aren't selected are never checked — zero cost, zero latency for them.

```mermaid
sequenceDiagram
  participant Client
  participant GW as Gateway (/v1/chat/completions)
  participant Mod as Moderator model
  participant LLM as Requested model

  Client->>GW: POST (moderated caller)
  GW->>GW: strike cooldown? → immediate content_filter
  par race
    GW->>Mod: generateObject(verdict), metered
  and
    GW->>LLM: streamText(), SSE buffered
  end
  alt verdict allow (≤3.5s)
    GW-->>Client: flush + stream normally
  else verdict block
    GW->>LLM: abort
    GW-->>Client: finish_reason: content_filter
  else timeout
    GW-->>Client: fail open (flush); a late block aborts mid-stream
  end
```

**Enforced in the gateway, for all model roles.** A completions call is checked when the caller's effective role is in the account's configured moderation categories (see [quotas-usage](./quotas-usage.md) for role resolution); the decision is made by the pure helper `moderationApplies(settings, role)` in `operations.ts`, shared with the summary endpoint. When it applies, the last user message of the request, truncated head+tail, judged by `generateObject` against a **generic server-side mission** (the request's own system prompt is attacker-controlled and not trusted for scoping). The `moderator` model id is internal-only (not in the public `MODEL_IDS`); it resolves **moderator → summarizer → assistant** (`getModelConfig`) and is metered like any call. A small in-memory verdict cache (10 min TTL) absorbs repeats within a turn.

**Race, don't gate.** The verdict races the model call; content-bearing chunks (text and tool calls alike) are buffered server-side for at most 3.5s (`MODERATION_TIMEOUT_MS`). Fail-open is repaired by a **late abort**: a block verdict arriving after the gate failed open still cuts the stream with `finish_reason: "content_filter"` (a hard 30s cap ensures every check eventually settles and writes exactly one event).

**Strikes (untrusted only).** The gate itself blocks individual messages for every moderated category, but the strike/cooldown lockout is an anti-abuse measure reserved for **untrusted** callers (anonymous/external): only their blocks accrue strikes, and only they can be cooldown-refused. A moderated trusted member (e.g. an org `user`/`contrib`) gets each abusive message blocked but is never locked out. 5 blocks within 24h arm a 1h cooldown (`moderation-strikes` collection, keyed by the usage identity `anon:<ip-hash>` / user id) during which the caller is refused with zero LLM calls.

**Observable by construction.** Every check writes exactly one event to `moderation-events` (TTL 30 days): `allow`, `block`, `late-block`, `fail-open-timeout`, `fail-open-error`, or `strike-refusal`, with verdict latency. Only block events keep a ~500-char message excerpt (the review payload). Admin-only endpoints (`/api/moderation/:type/:id/stats|events|probe`) and a section on the activity page expose totals, fail-open rate (with a >20%/24h warning banner), recent blocks, and a live 3-message test probe. The events collection is the authoritative record: a verdict that has not settled when a trace is recorded appears only there. Stats use MongoDB's `$percentile` (requires MongoDB ≥ 7.0).

**Probe.** The admin activity page can run a one-off check against the moderator model via `POST /api/moderation/:type/:id/probe` (`runProbe`): it sends 3 canned messages directly to the moderator model, is metered at account level, and writes **no** events — so stats reflect only real traffic. It is independent of the gate (no header, no strikes).

**Trace embedding.** When [trace storage](./tracing.md) is active, the verdict is embedded as a `moderation` field on the stored request — blocked requests are recorded by the gateway itself (`finish_reason: "content_filter"`), so blocked turns appear in the review page with their verdict chip. A streaming turn cut by a late block aborts before any finish event, so it appears in the events collection only — events, not traces, are the authoritative moderation record.

**Client is passive.** The browser performs no moderation; it reacts to `finish_reason: "content_filter"` by dropping the turn from context and showing a localized refusal. A content_filter on a sub-agent call surfaces as that sub-agent's output instead of aborting the turn.

**Input only (v1).** No output moderation, no tool-result / indirect-injection coverage, no multi-turn jailbreak detection. The `/api/summary` endpoint is not verdict-checked, but it shares the moderation posture for **untrusted** callers (anonymous/external): strike cooldowns apply and its system prompt is pinned server-side (a caller-supplied prompt would be an unmoderated jailbreak vector). On a fail-open turn a tool call may execute before a late block lands; the impact is bounded — tools run client-side with the user's own permissions and are assistive/non-destructive (never validated writes — see [mcp-tools](./mcp-tools.md#execution-context--safety)).

