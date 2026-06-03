# Physical-request tracing — design

## Problem

The current trace (`ui/src/traces/session-recorder.ts`) is **semantic and
incremental**: per step it stores the assistant's *response* messages, its tool
calls, per-step `usage` and `finishReason`, recursing into subagents. It reads
like a transcript because that is what it models.

What it does **not** capture is the **cumulative payload actually put on the
wire** for each request. `StepTrace.messages` holds the output that a step
produced, never the system + full message history + tool definitions that were
*re-sent* to produce it. So today you cannot answer:

- How big was the context on step 7, and what filled it?
- How much are we paying to re-send the same prefix every step?
- How long did each physical request take; how did context grow over the run?

These are exactly the questions needed to optimise context construction and
compaction, and to review harness/subagent behaviour against the reality of an
LLM (cumulative context, not a bidirectional exchange). This is a *complementary*
view, not a replacement: the semantic trace stays as the readable sequence; the
physical trace is high-verbosity and read on demand.

## What the architecture gives us

- Each `useAgentChat` instance builds **one** AI-SDK provider via
  `createOpenAI({ baseURL, apiKey })` (`use-agent-chat.ts:208`). `createOpenAI`
  accepts a documented `fetch?: FetchFunction` middleware option, passed to
  every model instance. The main agent (`streamText`, `use-agent-chat.ts:503`)
  and every subagent (`ToolLoopAgent`, `use-agent-chat.ts:397`) share this one
  provider — so a single wrapped `fetch` intercepts **all** of a session's
  physical requests.
- Each tool-loop step is exactly one `doStream()` → one HTTP POST to the
  gateway's OpenAI-compatible `/chat/completions`. `init.body` is the fully
  serialised request (system + entire message array + tools) — the cumulative
  payload, verbatim, with no reconstruction.
- `streamText` and `ToolLoopAgent.stream()` both accept a per-call `headers`
  option that reaches the custom fetch's `init.headers` (verified against
  `ai@6.0.116`: `stream-text.ts:307→1678`, `tool-loop-agent.ts` spreads
  `...options` into `streamText`). This gives us a precise correlation channel.
- The response is an SSE stream. `response.clone()` lets us read a copy without
  consuming the SDK's stream; the terminal SSE `finish` chunk already carries
  `usage` (the exact input/output token counts).
- There is **one** `SessionRecorder` per `AgentChat.vue` and it records the
  **subject** session only (`AgentChat.vue:154`). The evaluator is a *separate*
  `useAgentChat` instance created **without** the `recorder` option
  (`AgentChat.vue:192-200`); it only reads the subject recorder through
  `buildEvaluatorTools(recorder)`.

## Approach

Capture physical requests **client-side**, in memory, via the custom `fetch`
middleware on the recording provider. This keeps the whole feature inside the
existing in-memory / client-only / ephemeral tracing model — no server
persistence, no new Mongo collection, no retention/PII surface.

Three decisions follow from the wiring:

1. **Capture is gated on `options.recorder`.** The wrapped `fetch` is installed
   only when a recorder is present. The subject instance has one → its provider
   captures. The evaluator instance has none → its provider uses plain `fetch`.
   Therefore **the recorder only ever sees the subject provider's traffic**:
   none of the evaluator's activity — assistant turns, tool calls, or the
   summary call (below) — can ever be recorded. Exclusion is architectural, not
   a per-call special case.

2. **Correlation via an injected `x-trace-ctx` header**, not an ambient
   pointer. Subagents within the subject session legitimately go through the
   capturing provider, and tool calls may run in parallel, so an ambient
   "current context" pointer would be ambiguous. Instead each call site injects
   `x-trace-ctx` identifying the turn (main agent) or the subagent call; the
   wrapper reads it from `init.headers` and a per-context counter gives step
   order.

3. **Response kept as reassembled result + timing**, not raw SSE. We parse the
   cloned stream into the final message + `usage` + lightweight streaming
   metrics (time-to-first-chunk, chunk count, stream duration). Raw SSE is
   bulky for little analytical gain.

Rejected alternatives:

- **Server-side capture at the gateway + Mongo persistence.** The cleanest
  physical chokepoint, but it conflicts with the deliberate client-only/
  ephemeral design and introduces storage volume, retention and PII concerns
  for full conversation + tool-data payloads at rest. Out of scope by choice.
- **Ambient current-context pointer for correlation.** Simpler, but ambiguous
  under parallel subagent tool calls. The header is robust and nearly free.
- **Per-call header to "skip the summarizer" in the trace.** Obsolete once
  capture is recorder-gated — the entire evaluator context is excluded by
  construction, so no call-type ever needs special handling.
- **Raw SSE retention.** Reassembled result + timing answers the perf and
  composition questions without the memory cost.

## Data captured per physical request

`PhysicalRequestTrace`:

- `contextId` (turn id or subagent-call id), `stepOrder`, `timestamp`,
  `modelRole` (`assistant` / `tools` / `summarizer` / …, from the body `model`)
- `requestBody` — the raw serialised payload (system + messages + tools)
- `result` — reassembled final message (text + tool calls), `finishReason`
- **metrics**:
  - `inputTokens` — from the response `usage`; the *authoritative* context size
    (exact, free), preferred over char estimates
  - `outputTokens`
  - `messageCount`, `toolCount`, `systemChars`, `bodyChars`
  - `durationMs`, `timeToFirstChunkMs`, `chunkCount`

Request-derivable fields (`requestBody`, `messageCount`, `toolCount`,
`systemChars`, `bodyChars`, `timestamp`, `modelRole`, `contextId`) are recorded
**at send time** so the entry's timestamp slots correctly *before* the
`assistant-step` it produces. Response-derived fields (`result`, `inputTokens`,
`outputTokens`, `finishReason`, `durationMs`, timing) are patched onto the same
entry when the cloned stream finishes.

## Changes

### 1. `ui/src/composables/use-agent-chat.ts`

- When `options.recorder` is present, build a capturing `fetch` and pass it to
  `createOpenAI({ ..., fetch })`. When absent, omit it (plain `fetch`).
- The wrapper:
  - parse `init.body` (JSON string) → request payload;
  - read `x-trace-ctx` from `init.headers`;
  - call `recorder.recordPhysicalRequestStart(ctx, payload)` → returns an entry
    handle (records request-side fields + timestamp + step order);
  - start a timer; `const res = await fetch(...)`;
  - `res.clone()` and read the clone in a background async task, accumulating
    chunks to compute timing and reassemble the final message + `usage`, then
    call `recorder.recordPhysicalRequestFinish(handle, { result, usage, ... })`;
  - return the original `res` untouched to the SDK.
- Extract the SSE reassembly into a **pure helper** (e.g.
  `reassembleChatCompletionStream(chunks)`) so it is unit-testable in isolation.
- Inject `headers: { 'x-trace-ctx': <id> }`:
  - main agent `streamText` (line 503) → the turn's context id;
  - subagent `ToolLoopAgent`/`subAgent.stream(...)` (lines 397, 445-462) → a
    context id derived from the turn + `parentToolCallId`.
- Add a small context-id scheme; the per-context step counter lives in the
  recorder.

### 2. `ui/src/traces/session-recorder.ts`

- Add `PhysicalRequestTrace` and `physicalRequests: PhysicalRequestTrace[]` on
  `SessionTrace`.
- Add `recordPhysicalRequestStart(ctx, payload)` and
  `recordPhysicalRequestFinish(handle, response)`; maintain a per-`contextId`
  step counter.
- Add `'physical-request'` to the trace-entry type union (near line 59).
- In the overview/cache builder, merge `physicalRequests` into the flat
  sequence by timestamp/correlation, emitting a `'physical-request'` entry whose
  **label/preview carries the metrics inline** (e.g.
  `12.4k in · 320 out · 18 msgs · 6 tools · 1.2s`). Its detail returns the raw
  `requestBody` (+ metrics block), lazy-loaded like other entries.
- `getTraceEntry(index)` returns the raw physical payload for a
  `'physical-request'` entry (the "read raw for small contexts" path).

### 3. `ui/src/components/agent-chat/AgentChatDebugDialog.vue`

- Add a colour and a render branch for `'physical-request'` entries: collapsed
  by default, metrics line in the header/preview, detail showing the metrics
  block + raw payload (lazy via the existing `loadTraceEntry` path).
- No change to how other entry types render.

### 4. `ui/src/traces/evaluator-tools.ts` (+ `AgentChat.vue` call site)

- `getTraceOverview` already returns the merged overview, so physical-request
  entries with inline metrics appear to the evaluator with no new listing tool.
- `getTraceEntry` already returns the raw payload for small contexts.
- Add tool **`summarizePhysicalRequest(index)`**: read the entry's raw payload
  from the recorder, `POST` to the existing backend
  `/summary/{accountType}/{accountId}` (`api/src/summary/router.ts`) with an
  **analytical system prompt** + the payload as `content`, return the summary
  text. Because this goes through the summary endpoint (server-side, summarizer
  model) and never the subject provider, it is inherently outside the trace.
- The analytical prompt asks the summarizer to produce: **(a) context
  composition** (system size, message count/roles, tool-definition bulk, tool-
  result payloads), **(b) waste / optimisation signals** (stale tool results,
  repeated boilerplate, large rarely-used schemas, compaction candidates), and
  **(c) a faithful content digest** of the actual conversation in the request.
- `buildEvaluatorTools` gains `{ accountType, accountId, apiPath }` so the tool
  can address the summary endpoint; update the call at `AgentChat.vue:196`.

### 5. Tests — `tests/features/agents/`

- **Reassembly helper** unit test: feed representative SSE chunks, assert the
  reassembled final message, `usage`, and timing/chunk metrics.
- **Recorder** unit test: drive `recordPhysicalRequestStart`/`Finish` across a
  main turn plus a subagent context; assert the overview interleaves
  `physical-request` entries at the right positions (before their
  `assistant-step` / `sub-agent-step`), with correct inline metrics, and that
  `getTraceEntry` returns the raw payload.

## Out of scope

- Server-side persistence / surviving page reloads / export.
- "Delta vs previous request" summaries (not selected; can be added later).
- Capturing the post-conversion provider-side payload — we capture the
  gateway-received request, which is what the harness constructed.
- Raw SSE retention.

## Verification

- `npm run lint-fix`, `npm run check-types`, `docker build -t agents .`.
- `npm run test` for the new reassembly + recorder unit specs.
- Manual: enable tracing (`agent-chat-trace=1`), run a chat that delegates to a
  subagent. Confirm:
  - interleaved `physical-request` entries appear with metrics inline and the
    raw cumulative payload on expand;
  - context size (input tokens) grows across steps as expected;
  - the evaluator sees physical-request entries in `getTraceOverview`, can
    `getTraceEntry` a small one and `summarizePhysicalRequest` a large one;
  - **none of the evaluator's own requests appear in the trace.**
