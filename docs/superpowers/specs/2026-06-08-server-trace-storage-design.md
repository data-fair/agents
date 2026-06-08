# Server-side trace storage — design

## Problem

Today tracing is **client-only and ephemeral**. `SessionRecorder`
(`ui/src/traces/session-recorder.ts`) builds a `SessionTrace` in the browser; it
is handed to the review page through `localStorage`
(`ui/src/traces/trace-handoff.ts`) or a JSON file upload, and is lost when the
tab closes. There is no way for an org to review what its assistant actually did
across sessions.

We want to **store chat traces on the server** so org admins can review them
later, while remaining:

- **Compatible with the existing trace viewer** (`trace-review.vue` →
  `SessionRecorder.fromTrace` → `TraceView` + `EvaluatorChat`), with no rewrite
  of the viewer.
- **GDPR compliant**: a defined data controller, data minimisation, a bounded
  retention period, and a right to erasure.
- **Subject to explicit acceptance** by the end user before anything is stored.

## What the architecture gives us

- The agent loop runs **client-side**; the **gateway is the proxy** for every
  model call (`api/src/gateway/router.ts`,
  `POST /:type/:id/v1/chat/completions`). The client builds its `SessionTrace`
  by intercepting the gateway `fetch` (`use-agent-chat.ts:281` `tracingFetch`,
  `:238` `capturePhysicalResponse`) — it reads exactly the `requestBody`
  (`messages` + `tools` + `model`) it sent and the streamed `result` it got
  back. **The gateway server receives the same data**, so it can record physical
  requests itself with no client upload.
- The gateway handler already has everything the recording needs: `reqSession`
  (`gateway/router.ts:85`) with the end-user id/name (already computed as
  `usageUserId`/`usageUserName`, `:147`), `req.body` (messages/tools/model,
  `:91`), the **resolved** model + provider from `getModelConfig`/`createModel`,
  and `getRawSettings(owner)` (`:118`) — so the org-enable check is free.
- The client already sends a per-context correlation header `x-trace-ctx`
  (`use-agent-chat.ts:233`, set per turn / sub-agent / compaction). We extend
  this channel rather than add requests.
- The trace viewer consumes a `SessionTrace` via `SessionRecorder.fromTrace`
  (`session-recorder.ts:279`) and rebuilds its overview purely by **sorting
  entries by timestamp** (`buildCache`, `:424`). So a faithful `SessionTrace`
  reconstructed from stored requests renders with zero viewer changes.
- The duplication observation holds: `turns/steps/toolCalls/subAgents` and
  `physicalRequests` are two views of the same data. Everything the structured
  view shows is derivable from the ordered sequence of physical requests (system
  prompt, tool snapshots, user messages, assistant steps, tool calls, tool
  results as `tool`-role messages in the next request, sub-agents by context,
  compaction, moderation verdicts).

## Approach (chosen: gateway-side recording + reconstruct-at-view)

The **gateway is the sole writer**. In the existing completions handler, at the
same point it records usage, it conditionally inserts **one document per
physical request** when `settings.storeTraces === true` **and** the end user has
given consent (a cookie). No client upload endpoint, no new request on the hot
path. A 30-day Mongo TTL index auto-deletes documents. At view time the admin
trace-review page fetches the stored requests for a conversation and a pure
`reconstructTrace()` function rebuilds a `SessionTrace` for the existing viewer.

```
client chat ──(gateway calls it already makes, + 2 headers)──▶ gateway handler
                                                                  │
            if (settings.storeTraces && consent cookie === 'yes')
                                                                  │ fire-and-forget insert
                                                                  ▼
                                                       mongo: traceRequests ──TTL 30d──▶ auto-delete
                                                                  ▲
   admin trace-review ──GET list / GET conversation──────────────┘
        │ reconstructTrace(requests[]) → SessionTrace
        ▼
   SessionRecorder.fromTrace → TraceView + EvaluatorChat   (unchanged)
```

### Why not the alternatives

- **Client uploads the full `SessionTrace`** — perfect fidelity and trivial
  reconstruction, but adds an authenticated upload request, ~doubles the payload
  (the duplication above), lets the client forge traces, and stores larger
  documents (worse minimisation).
- **Full OpenTelemetry / AI-SDK `experimental_telemetry`** — maximally standard,
  but OTel is an export-to-collector model whose nested-span tree does not map
  1:1 onto our flat turn/step viewer; AI-SDK telemetry at the gateway only sees
  per-call granularity (the orchestration is client-side), so it would require
  instrumenting the client **and** rebuilding the viewer. Rejected as
  over-scoped; we instead **align our vocabulary** to OTel (below).

## Vocabulary alignment with OpenTelemetry GenAI

We keep bespoke Mongo storage + reconstruction + the existing viewer, but name
and shape the stored document to mirror the OpenTelemetry **GenAI semantic
conventions** (`gen_ai.*`). This keeps us standard-aligned and **export-ready**
(a future "emit to Langfuse/OTel" feature becomes a thin mapper) at no extra
cost now. One stored physical-request document corresponds to one OTel GenAI
*inference span*.

| Stored field | OTel GenAI attribute | Notes |
|---|---|---|
| `conversation.id` | `gen_ai.conversation.id` | stable per chat session |
| `operation.name` | `gen_ai.operation.name` | `"chat"` |
| `request.model` | `gen_ai.request.model` | **resolved** model id (server-known) |
| `provider.name` | `gen_ai.provider.name` | `anthropic` / `openai` / … |
| `request.systemInstructions` | `gen_ai.system_instructions` | system message |
| `request.messages` | `gen_ai.input.messages` | provider-native JSON (semantic, not byte-for-byte the OTel event schema) |
| `request.tools` | (tool definitions) | available tools at this call |
| `response.finishReasons` | `gen_ai.response.finish_reasons` | |
| `response.messages` | `gen_ai.output.messages` | assistant content + tool calls |
| `usage.inputTokens` / `outputTokens` | `gen_ai.usage.input_tokens` / `output_tokens` | |
| `agent.name` | `gen_ai.agent.name` | sub-agent name (else absent → main agent) |

`modelRole` (our `assistant`/`tools`/`summarizer`/`moderator`/`evaluator` slot)
and cache-token / latency fields are kept as documented non-standard extensions.

## Data model — new `traceRequests` collection

One document per physical request:

```
owner: { type, id, department? }       // GDPR data controller (mirrors settings/usage)
userId?: string                        // end user; omitted for anonymous sessions
userName?: string                      // included per product decision
conversation: { id: string }           // from x-trace-conversation header
contextId: string                      // enriched x-trace-ctx: "turn" | "sub:<name>:<idx>" | "compaction"
modelRole: string                      // assistant | tools | summarizer | moderator | evaluator
operation: { name: 'chat' }
provider: { name: string }
agent?: { name: string, index?: number } // sub-agent identity (parsed from contextId)
request: { model, systemInstructions?, messages, tools? }
response: { finishReasons?: string[], messages }   // content + toolCalls
usage: { inputTokens, outputTokens, cacheReadTokens?, cacheWriteTokens? }
timing: { durationMs, timeToFirstChunkMs? }
createdAt: string                      // ISO; server timestamp — also the ordering key
expiresAt: Date                        // TTL index target; createdAt + 30 days
```

Indexes (in `api/src/mongo.ts` `init()`):

- `{ 'owner.type': 1, 'owner.id': 1, 'conversation.id': 1, createdAt: 1 }` —
  group a conversation and order it.
- `{ 'owner.type': 1, 'owner.id': 1, createdAt: -1 }` — list recent
  conversations.
- `{ expiresAt: 1 }`, `{ expireAfterSeconds: 0 }` — **TTL auto-deletion**.

Retention is a **fixed 30-day TTL**. Ordering for reconstruction uses
`createdAt` (server-monotonic enough; the viewer already sorts entries by
timestamp). Each request body is cumulative (it re-includes prior messages) —
that is inherent to physical-request tracing; the TTL bounds total volume.

## Recording path (gateway)

In `POST /:type/:id/v1/chat/completions`, after the model result is available
(the same place usage is recorded):

1. Compute `shouldStore = settings.storeTraces === true && consent === 'yes'`,
   where `consent` is read from the `agent-chat-trace-consent` cookie on the
   request. If false, do nothing.
2. Assemble the document from `req.body` (system/messages/tools/model role), the
   resolved model + provider, the collected `result` (content, tool calls,
   finish reason — the gateway already accumulates enough for usage; extend to
   capture content + tool calls + timing), `usageUserId`/`usageUserName`,
   `conversation.id` from `x-trace-conversation`, `contextId` from
   `x-trace-ctx`, and `expiresAt = now + 30d`.
3. Insert **fire-and-forget** inside `try/catch` — recording must never block or
   fail the user's response.

The gateway adds a response header **`x-trace-storage: available`** whenever
`settings.storeTraces` is on, so the client knows to surface the consent prompt
(below). This rides on the response the client already receives.

### Client header changes (no new requests)

- Add `x-trace-conversation`: a stable id generated once per `useAgentChat`
  session, attached to every gateway call (alongside the existing `x-trace-ctx`).
- Enrich `x-trace-ctx` so sub-agent calls carry `sub:<name>:<turnIndex>` and
  compaction carries `compaction` — preserving sub-agent name + ordering that
  request bodies alone do not contain.

## Consent & org-enable flow

- **Org enable.** Add a `storeTraces: boolean` (default `false`) to the settings
  schema (`api/types/settings/schema.js`); it renders automatically in the
  existing settings page and rides in the already-fetched settings — no new
  endpoint. The gateway reads `settings.storeTraces`.
- **Client consent.** Mirror the portals cookie pattern
  (`portals/portal/app/components/accept-cookies.vue`): a cookie
  `agent-chat-trace-consent` ∈ `{yes, no}`, 1-year expiry, revocable.
  - When the gateway response carries `x-trace-storage: available` **and** the
    cookie is unset, show a consent notice in the chat (bottom-sheet) explaining
    **what is stored, the 30-day retention, that the org is the data
    controller, and how to withdraw**. Accept/decline writes the cookie.
  - A toggle in the chat's existing Settings tab lets the user revisit the
    choice.
  - The cookie is same-origin and sent automatically on gateway calls, so the
    gateway reads it without any extra request.
- The **first turn before acceptance is not stored** (we cannot store
  pre-consent — this is GDPR-correct); storage begins on the next turn after
  acceptance.

## Reconstruction (`ui/src/traces/reconstruct-trace.ts`)

A pure function `reconstructTrace(requests: StoredTraceRequest[]): SessionTrace`,
run **client-side** at view time so the API stays a thin CRUD layer and the
viewer is untouched. It:

- maps each stored request 1:1 into `physicalRequests[]` (token/timing entries),
  rebuilding the `requestBody` the viewer's detail pane expects from
  `request.{model, systemInstructions, messages, tools}`;
- takes `systemPrompt` from the first request's system instructions;
- derives `toolSnapshots` / `toolChanges` by diffing `request.tools` across
  requests;
- rebuilds `turns → steps → toolCalls / tool results` by diffing successive
  `request.messages` and reading each `response`;
- groups sub-agent requests by `contextId` (`sub:<name>:<idx>`) into `subAgent`
  blocks (name + turn index from the contextId);
- maps `moderator`-role requests to moderation entries and the `compaction`
  context to a compaction entry.

Output feeds the existing `SessionRecorder.fromTrace()`. Known fidelity gap:
**skipped** moderation decisions produce no physical request and so do not
appear server-side (accepted — they are no-ops).

## API read/delete surface (`api/src/traces/`)

New module following the `settings` pattern (`router.ts` + `service.ts` +
`operations.ts`), all reads/deletes **admin-gated** via
`assertAccountRole(session, owner, 'admin')`:

- `GET /traces/:type/:id` → list conversations: `{ conversationId, preview
  (first user message), userName, startedAt, requestCount }`, paginated, newest
  first.
- `GET /traces/:type/:id/:conversationId` → the raw stored requests for one
  conversation (ordered by `createdAt`), for reconstruction.
- `DELETE /traces/:type/:id/:conversationId` → erase one conversation.
- `DELETE /traces/:type/:id?userId=…` → erase all of one user's traces (GDPR
  right to erasure).

The recording **write** lives in the gateway, not here; this module is
read/delete only.

## Viewer integration (`trace-review.vue`)

Add a third trace source beside the existing upload + `localStorage` handoff: a
**stored-traces list** for the account. The admin picks a conversation → fetch
raw docs → `reconstructTrace` → `SessionRecorder.fromTrace` → the existing
two-pane `TraceView` + `EvaluatorChat`. Per-row **delete** and a per-user
**erase** action surface the GDPR deletes.

## GDPR posture (summary)

- Explicit, revocable consent (cookie, 1-year) **before** any storage; the org
  account is the data controller (mirrors `settings`/`usage`).
- Data minimisation: only `userId` + `userName` beyond trace content; anonymous
  sessions store no user id.
- Bounded retention: 30-day TTL auto-deletion, plus admin manual and per-user
  erasure.
- Access restricted to org admins.
- Consent notice states what is stored, the controller, retention, and how to
  withdraw.

## Testing (unit / api / e2e)

- **unit** — `reconstructTrace` round-trips a known physical-request sequence
  into the expected `SessionTrace`, covering sub-agent grouping, compaction,
  moderation, tool-call/result pairing, and tool-snapshot diffing.
- **api** — the gateway stores a document only when `storeTraces` **and**
  consent cookie are both present; `expiresAt`/TTL is set; the resolved
  model/provider and user id/name are captured; anonymous sessions omit
  `userId`; list/get/delete endpoints enforce the admin role; per-user erasure
  deletes only that user's documents.
- **e2e** — the consent bottom-sheet appears only when the org has enabled
  storage; accepting then chatting produces a stored trace that is listed and
  correctly reconstructed in the admin trace-review page; declining stores
  nothing.

## Risks / open questions

- **Cumulative body size**: each stored request re-includes the full prior
  message history. Bounded by the 30-day TTL; revisit with a delta scheme only
  if volume proves a problem.
- **Reconstruction fidelity** is the main new logic and the chief risk; the unit
  test suite is the guard. Skipped-moderation loss is accepted.
- **Cookie reading server-side**: confirm cookie parsing is available on the
  gateway route during implementation (header fallback `x-trace-consent` if not).
- **Ordering under concurrency**: sub-agent calls may share a millisecond; the
  viewer's timestamp sort tolerates this, but verify sub-agent blocks reconstruct
  correctly when interleaved.
```
