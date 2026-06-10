# Tracing

The agent loop runs almost entirely in the browser: the UI composable orchestrates
turns, sub-agents, tool calls and compaction, and only the raw LLM
completions cross the network (through the [gateway](./gateway.md)). Tracing makes that
flow inspectable in two complementary ways:

- a **client-side trace viewer** that reconstructs a session from stored data, and
- **server-side storage** of the physical LLM requests, written by the gateway, opt-in
  per org and consent-gated per user.

There is no longer an always-on in-browser recorder that captures the live conversation:
the gateway is now the single writer, and the stored requests are the single source of
truth for review. The browser only *reconstructs* a `SessionTrace` for display.

## Server-side storage (source of truth)

Storage is **off by default** and only happens when two conditions both hold:

1. **The org enables it.** A `storeTraces` boolean (default `false`) on the account
   settings (`api/types/settings/schema.js:89`). Its description states the contract:
   *"conversations of consenting users are stored on the server for 30 days for admin
   review. Each user must explicitly accept."* The gateway reads it from the already
   fetched settings, so no extra request is needed.
2. **The user consents.** The browser stores a 1-year `agent-chat-trace-consent` cookie
   (`yes` / `no`), managed by `ui/src/traces/trace-consent.ts`. The cookie is **not**
   read server-side; instead the client forwards its value as an **`x-trace-consent`
   header** on every gateway call (`use-agent-chat.ts:222` `traceHeaders`). The gateway
   stores a request only when `settings.storeTraces === true` **and**
   `x-trace-consent === 'yes'` (`api/src/gateway/router.ts:144-147`).

When `storeTraces` is on, the gateway advertises this to the client with a response
header **`x-trace-storage: available`** (`gateway/router.ts:145`); the client flips the
reactive `traceStorageAvailable` flag (`use-agent-chat.ts:233`) which drives the consent
toggle in the chat. Storage only begins on turns sent *after* the user accepts — the
pre-consent turn is never stored.

### What the gateway writes

Inside the completions handler, at the point usage is recorded, the gateway records
**one MongoDB document per physical LLM request**, **fire-and-forget**: the insert runs
in a `try/catch` that swallows all errors so trace recording can never block or fail the
user's response (`api/src/traces/service.ts:11` `recordTraceRequest`). Each document is
assembled by the pure `buildTraceRequestDoc` (`api/src/traces/operations.ts:48`) and
captures (see `api/src/traces/types.ts` for the full shape):

- `owner` (the GDPR data controller, mirroring settings/usage), optional `userId` /
  `userName` (omitted for anonymous sessions — data minimisation);
- `conversation.id` (from the `x-trace-conversation` header, a stable id generated once
  per `useAgentChat` session, `use-agent-chat.ts:117`);
- `contextId` / `contextKind` / optional `agent` — parsed from the `x-trace-ctx` header
  (`turn:<uid>` / `sub:<name>:<idx>:<uid>` / `compaction:<uid>`) by
  `parseContextId` (`operations.ts:16`), preserving sub-agent identity and ordering that
  the request body alone does not carry;
- `modelRole` (`assistant` / `tools` / `summarizer` / `evaluator`),
  resolved `provider` (name + type) and resolved `request.model`;
- optional `moderation` — the gateway-side [moderation](./moderation.md) verdict
  (`action`, `category`, `reason`, `latencyMs`, `failOpen`), embedded when the check had
  settled by the time the request was recorded (untrusted callers only);
- `request.body` — the raw OpenAI request body (system + messages + tools) — plus derived
  `messageCount` / `toolCount` / `bodyChars`;
- `response` (assistant content, tool calls, finish reason), `usage` (input/output and
  optional cache read/write tokens), and `timing` (duration, optional time-to-first-chunk);
- `createdAt` — a BSON `Date` that is **both** the ordering key and the TTL target.

The document model is intentionally aligned in spirit with the OpenTelemetry **GenAI
semantic conventions** (`gen_ai.*`): one stored physical request maps to one GenAI
inference span (`conversation.id`, `operation.name: 'chat'`, `request.model`,
`provider.name`, `response.finishReason`, `usage.*`, sub-agent `agent.name`). The stored
field names stay bespoke (`request` / `response` / `usage` / `provider`) rather than the
literal `gen_ai.*` keys, keeping a future export-to-OTel feature a thin mapper while
adding no cost now.

### Collection, retention and GDPR controls

Documents live in the **`trace-requests`** MongoDB collection
(`api/src/mongo.ts:26`). Retention is a **fixed 30-day TTL**: a TTL index on `createdAt`
with `expireAfterSeconds = RETENTION_SECONDS` (`api/src/mongo.ts:50`), where
`RETENTION_SECONDS = 30 * 24 * 60 * 60` (`api/src/traces/operations.ts:8`). Mongo
auto-deletes expired documents; no application cleanup job is needed.

Reads and deletes are an **admin-only** CRUD layer (`api/src/traces/router.ts`), every
route guarded by `assertAccountRole(session, owner, 'admin')`:

- `GET /traces/:type/:id` — paginated, newest-first list of conversations
  (`conversationId`, `preview` of the first user message, `userName`, `userId`,
  `startedAt`, `requestCount`), via a Mongo aggregation grouping by `conversation.id`.
- `GET /traces/:type/:id/:conversationId` — the raw stored requests for one conversation,
  ordered by `createdAt`.
- `GET /traces/conversation/:conversationId` — fetch a conversation by its globally
  unique id, resolving the owning account *from the stored documents* and authorizing
  against it (used by the account-less review route). Registered **before** the
  `/:type/:id` param route so the literal `conversation` segment is not shadowed.
- `DELETE /traces/:type/:id/:conversationId` — erase one conversation.
- `DELETE /traces/:type/:id?userId=…` — erase all of one user's traces (GDPR right to
  erasure).

## The client-side trace viewer

The browser does not record traces during a chat; it **reconstructs** one at view time.
The pure function `reconstructTrace(requests)` (`ui/src/traces/reconstruct-trace.ts:85`)
takes the ordered stored requests for a conversation and rebuilds a full `SessionTrace`:

- maps each stored request 1:1 into `physicalRequests[]` (model role, body, token/timing
  entries);
- takes the `systemPrompt` from the first request's system message;
- derives `toolSnapshots` / `toolChanges` by diffing `request.tools` across requests
  (reflecting [tool exploration](./tool-exploration.md) enabling/disabling tools);
- rebuilds `turns → steps → toolCalls / tool results` by diffing successive
  `request.messages` and reading each `response`;
- groups sub-agent requests by `contextId` into [sub-agent](./sub-agents.md) blocks;
- maps embedded `moderation` verdicts to [moderation](./moderation.md) entries and the
  `compaction` context to a compaction entry.

The output feeds `SessionRecorder.fromTrace()` (`ui/src/traces/session-recorder.ts:129`).
`SessionRecorder` is now trimmed to `fromTrace` plus the read-only accessors the viewer
needs (`getTraceOverview`, which sorts entries by timestamp into a flat overview); the
old live-capture methods that fed an in-memory trace during chat have been removed. The
single source of truth means there is **no duplicate upload**: the data the viewer shows
is exactly what the gateway already stored.

Known fidelity gap: a moderation verdict that has not settled when the request is
recorded (and a late block, which aborts before any finish event) appears only in the
`moderation-events` collection — events, not traces, are the authoritative moderation
record (see [moderation](./moderation.md)).

```mermaid
flowchart LR
  chat["client chat\n(gateway calls)"] -->|"+ x-trace-conversation,\nx-trace-ctx, x-trace-consent"| gw["gateway handler"]
  gw -->|"if storeTraces && consent\n(fire-and-forget insert)"| mongo["mongo: trace-requests\n(TTL 30d → auto-delete)"]
  mongo -->|"GET list / GET conversation\n(admin only)"| view["reconstructTrace()\n→ SessionRecorder.fromTrace"]
  view --> tv["TraceView + EvaluatorChat"]
```

## Viewing

Two pages consume the stored traces, both admin-gated:

- **Activity page** — `ui/src/pages/[type]/[id]/activity.vue`, route
  `/:type/:id/activity`. Read-only, for any admin of the account (`isAdmin`:
  site-admin or `admin` role on the account, redirects to chat otherwise,
  `activity.vue:119` / `:143`). It shows a read-only configuration/limits summary and a
  paginated list of recent stored conversations (`GET /traces/:type/:id`), with per-row
  delete and per-user erase actions; each row links to the review page.
- **Trace review page** — `ui/src/pages/traces/[id]/review.vue`, route
  `/traces/:id/review` (`:id` = `conversationId`). It fetches
  `GET /traces/conversation/:id` (which resolves the owner and asserts the requester is
  an admin of it), runs `reconstructTrace` → `SessionRecorder.fromTrace`, and renders the
  two-pane `TraceView` + `EvaluatorChat` for analysis. The chat debug dialog surfaces a
  link to the current conversation's review only when the viewer is an admin and trace
  storage is available and consented (`AgentChatDebugDialog.vue:228`).

> Historical note: an earlier always-on in-browser recorder, a chat "trace" tab, and an
> upload/`localStorage`-handoff review page (the now-removed
> `ui/src/pages/[type]/[id]/trace-review.vue`) have been replaced by the server-stored,
> reconstruct-at-view model described above.

## Key files

- `api/types/settings/schema.js:89` — the `storeTraces` org setting (default `false`).
- `ui/src/traces/trace-consent.ts:3` — `agent-chat-trace-consent` cookie + `consentRef` /
  `traceStorageAvailable`.
- `ui/src/composables/use-agent-chat.ts:222` — `traceHeaders` (sends `x-trace-conversation`,
  `x-trace-ctx`, `x-trace-consent`); `conversationId` at `:117`; storage-available flag at `:233`.
- `api/src/gateway/router.ts:144` — gateway opt-in + consent check, `x-trace-storage`
  header, and fire-and-forget `recordTrace`.
- `api/src/traces/service.ts:11` — `recordTraceRequest` (fire-and-forget insert).
- `api/src/traces/operations.ts:48` — `buildTraceRequestDoc`; `RETENTION_SECONDS` at `:8`;
  `parseContextId` at `:16`.
- `api/src/traces/types.ts:1` — stored `TraceRequest` document shape.
- `api/src/traces/router.ts:15` — admin-only list / get / delete routes (incl.
  `/conversation/:id` and per-user erasure).
- `api/src/mongo.ts:26` — `trace-requests` collection; TTL index at `:50`.
- `ui/src/traces/reconstruct-trace.ts:85` — `reconstructTrace()` (stored requests →
  `SessionTrace`).
- `ui/src/traces/session-recorder.ts:129` — `SessionRecorder.fromTrace` + read accessors.
- `ui/src/pages/[type]/[id]/activity.vue:119` — admin activity page (trace list, deletes).
- `ui/src/pages/traces/[id]/review.vue:73` — admin trace review page (reconstruct + view).
- `ui/src/components/agent-chat/AgentChatDebugDialog.vue:228` — in-chat consent toggle and
  review link.
</content>
</invoke>
