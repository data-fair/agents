# Adopt the AI SDK's message model, and the ecosystem around it

Part 1 replaces the hand-built message shape with the library's. Part 2 covers the rest of the
"are we reinventing this?" question — what the SDK and its ecosystem already provide, what to take,
and what was evaluated and rejected.

**Status:** Part 1 IMPLEMENTED 2026-09-30. Part 2: 2.4 adopted, 2.1 postponed, 2.2 reversed, 2.3
superseded — each recorded in its own section.
**Date:** 2026-09-30
**Supersedes:** the `parts` shape introduced by
`2026-09-29-conversation-storage-as-the-logical-reference-design.md` (that document's *principle* stands
unchanged; only the shape it invented is replaced)

## Why reopen a model that just landed

The previous spec was right that a stored conversation must be complete by construction. It built the
shape by hand. The AI SDK (`ai` 6.0.277, already a dependency) ships that shape, its conversion, and its
validator — and ships them in a form that makes two of the defects found in review structurally
impossible rather than fixed.

What was hand-built and what the library provides:

| Hand-built here | Library |
| --- | --- |
| `parts: (text \| reasoning \| tool-call \| tool-result)[]` | `UIMessagePart`: `TextUIPart`, `ReasoningUIPart`, `ToolUIPart` |
| `storedTurnsToModelMessages` (~60 lines) | `convertToModelMessages` |
| "drop a call whose result is missing" | `ignoreIncompleteToolCalls: true` |
| `StoredPart` + `StoredAutonomousAgentPart` + the JSON schema (three declarations, already drifted) | one library type |
| call↔result joined by `toolCallId` in three readers | one `ToolUIPart` per invocation |
| P1's approval gate, to be designed | `needsApproval`, `approval-requested` / `approval-responded` / `output-denied`, `lastAssistantMessageIsCompleteWithApprovalResponses` |

Verified empirically, not from the types: `convertToModelMessages` emits the same
`assistant(tool-call) → tool(tool-result) → assistant(text)` sequence in the same order; with
`ignoreIncompleteToolCalls: true` an unanswered call is dropped whole; and an `output-error` part becomes
`output: { type: 'error-text', value }` — **a different output type from a success**, where the
hand-rolled version made a failure indistinguishable in shape from a success.

## What this dissolves rather than fixes

From the branch review, these stop being defects because the shape no longer permits them:

- **A failing tool recorded as a success.** `output-available` and `output-error` are different states;
  `errorText` is required on one and forbidden on the other.
- **Three declarations of the parts union**, already three-way drifted (`annotations` missing from two,
  `truncated` from one).
- **Three readers re-deriving the call↔result join**, one of them an untyped Vue computed.
- **Five `as any` casts** at the boundary between the hand-written type and the generated one.
- **The approval gate P1 planned to build**, along with the question of where `annotations`
  (readOnlyHint / destructiveHint) belongs: it is the input to `needsApproval`.

## Where this project's extras live

Both slots are part of the library types, verified:

- **Per message** → `metadata`: `seq`, `version`, `owner`, `author`, `runId`, `pending`.
  `validateUIMessages({ messages, metadataSchema })` takes a `FlexibleSchema`, so the project's
  convention survives intact: **we keep a JSON schema for the metadata and generate its type as usual**;
  the library owns and validates the parts.
- **Per tool invocation** → `toolMetadata?: JSONObject`: `serverId`, and the `truncated` marker.

Nothing has to be bolted onto a closed union, and nothing about the parts needs a hand-written schema.

## Decisions

1. **The stored document becomes `UIMessage`-shaped**: `id`, `role`, `parts`, `metadata`. `seq` stays the
   ordering key and the incremental cursor stays `version` — the live-update protocol does not change.
2. **`loadHistory` becomes `convertToModelMessages(..., { ignoreIncompleteToolCalls: true })`**, and
   `storedTurnsToModelMessagesWithSeqs` is deleted. The seq-per-model-message mapping compaction needs is
   rebuilt around the library call rather than inside a bespoke reconstruction (see Risks).
3. **Validation on read** uses `safeValidateUIMessages` with our `metadataSchema`, and **without**
   `tools`. Passing `tools` would validate historical tool inputs against today's schemas, so a tool
   whose schema changed would invalidate old conversations. Structure-only is what revival needs.
4. **One shape, two consumers.** `ChatMessage` (`shared/chat-message.ts`) is itself a hand-rolled
   flattening of `UIMessage`, and `shared/autonomous-agent-chat-message.ts` exists only to bridge the two.
   Both go. The browser chat's migration is **out of scope here** but becomes a mechanical follow-up
   rather than a second model, which is the real answer to "how many conversation models are there".
5. **`toolMetadata` carries `serverId`**, so the provenance envelope keeps its source of truth and the
   audit record keeps naming which server ran a tool.
6. **`annotations` is wired now, into `toolMetadata`**, because it is the input the approval gate will
   read. It is currently declared in the schema and never written.

## What stays ours, deliberately

Checked against the installed SDK rather than assumed:

- **Compaction.** The SDK has no summarisation. Its middlewares are `defaultSettings`,
  `extractReasoning`, `extractJson`, `simulateStreaming`, `addToolInputExamples`. `compaction-policy.ts`,
  `compaction-prompt.ts` and the recap cache stay.
  `pruneMessages({ reasoning, toolCalls: 'before-last-N-messages' })` is a *complement* worth evaluating
  later — dropping old tool payloads is cheaper than summarising them — but it is not compaction and is
  not in this change.
- **The MCP client.** `experimental_createMCPClient` does not exist in v6 (0 references) and there is no
  `@ai-sdk/mcp`. `api/src/mcp-servers/client.ts` is required, not a reinvention.
- **The provenance envelope, the repeated-call guard, quotas/credits/usage**, and the
  websocket-notification + HTTP-refetch protocol (the SDK's path assumes one browser drives the stream;
  this is server-side execution with several watchers).

## What this does NOT fix

Stated so the change is not oversold. These remain open and are unaffected:

- the reaper re-firing tools on a dead-holder run;
- the NHI session expiring mid-turn;
- compaction spend unmetered;
- the credit cap overshoot across parallel conversations;
- **attribution forgery on the shared timeline** — `[from …]` is our own in-band marker and needs the
  `attributeSafe` treatment regardless of the message shape;
- the tool result being unbounded in the turn (bounding must move to the point of production).

## Deviations from this spec, as implemented

Three, each recorded where a reader would otherwise be misled by the text above:

1. **The stored document is a SUPERSET of `UIMessage`, not `{ id, role, parts, metadata }`.** `seq`,
   `version` and `conversationId` stay TOP-LEVEL because they are indexed, with a unique index on
   `{conversationId, seq}`; moving them under `metadata` would have rewritten the indexes and the
   live-update cursor for no gain. `safeValidateUIMessages` ignores the extra fields — verified — so
   only `parts` migrated. There is consequently no `metadataSchema`, and Decision 3's metadata clause
   does not apply; the validation is structure-only, which is what it says revival needs.
2. **`step-start` parts are recorded, and are load-bearing.** Not anticipated here. Without them
   `convertToModelMessages` puts text produced AFTER a tool result inside the assistant message that
   made the call, ahead of the tool message answering it.
3. **Two subtractions stay ours**, applied to what is sent while the record keeps everything: reasoning
   is never replayed (no signature to offer), and a blank text part is dropped rather than sent as an
   empty block. Both are provider constraints; the library replays both as-is.

Also: `summarizeToolArguments` moved to `shared/`, because the stored `input` became the real arguments
and both the trace and the run-status strip now need the same bounded rendering of it.

## Scope

- `api/types/conversation-message/schema.js` — reduced to `metadata` plus a loose `parts` array; the
  parts contract moves to the library.
- `api/src/conversations/executor.ts` — stream accumulation builds `UIMessagePart`s;
  `loadHistory` calls `convertToModelMessages`; `compactHistory` keeps its cut alignment.
- `api/src/conversations/operations.ts` — delete `StoredPart`,
  `storedTurnsToModelMessages(WithSeqs)`; keep `boundToolResult`, `partsText`, `withAppendedText`,
  `attributedUserText` (retargeted at the new shape).
- `shared/autonomous-agent-chat-message.ts` — deleted.
- `ui/src/components/ConversationRunStatus.vue`, `.../[agentId].vue` — render `UIMessage` parts;
  the failed-tool list reads `state === 'output-error'` instead of joining two parts.
- `api/src/mcp-servers/client.ts` — carry `annotations` through to `toolMetadata`.

## Testing

- `convertToModelMessages` round-trip: a stored turn with a tool invocation reproduces the exact model
  messages, asserted against the real library call rather than a reimplementation.
- A tool failure is `output-error` with `errorText`, and reaches the model as
  `output.type === 'error-text'`. **This requires a fixture tool that can actually fail** — the current
  fixture has none, which is how the success/failure conflation survived.
- `safeValidateUIMessages` rejects a malformed stored document and accepts a well-formed one, with the
  metadata schema enforced and tool schemas deliberately not.
- A multi-turn conversation where turn N's answer depends on turn N-1's tool result — the assertion the
  previous model never had, because the mock ignores history.
- `annotations` written on a real call and readable from the stored record.

## Risks

- **Second rewrite of the same model within days.** Mitigated only by nothing being deployed. The
  argument for doing it now rather than later is that every week adds readers of the bespoke shape.
- **The seq↔model-message mapping.** `alignCutToStoredMessage` needs to know which stored message each
  model message came from, and `convertToModelMessages` does not report that. It must be rebuilt by
  converting per stored message and counting, which is a smaller bespoke piece than the one being
  deleted but is genuinely new code.
- **`preliminary` and `state: 'streaming'`** are part-level streaming signals the current design carries
  as a message-level `pending` flag. Keeping `pending` in metadata is the conservative choice; adopting
  the part-level states is a later simplification, not this change.
- **`UIMessage` is a UI transport shape.** Persisting it is the SDK's documented pattern, but it means
  the record's contract is a library type and moves with the library's major versions. That is the trade
  being made deliberately: a shared, maintained contract over a local one.

---

# Part 2: ecosystem adoption

The same question asked more broadly — what does the SDK and its ecosystem already provide that we
built or are about to build. Each item below was checked against the **installed** version, not against
documentation, because an earlier pass of this review concluded `@ai-sdk/mcp` did not exist on the
strength of it being absent from `node_modules`. Absence from our tree is not absence from the registry.

## 2.1 OpenTelemetry GenAI telemetry — POSTPONED (decided 2026-09-30)

`experimental_telemetry` is available in the installed `ai` 6.0.277 (19 references in its types), and
`registerTelemetryIntegration` / `TelemetryIntegration` are exported. The `gen_ai.*` semantic conventions
are the converged standard; Langfuse, Arize Phoenix, OpenLLMetry and Laminar all read them.

Why it fits here rather than being a fashion:

- `TelemetrySettings` carries `recordInputs` / `recordOutputs`. With **both `false`**, spans carry
  timings, token counts, model, and tool names, and **no content** — which is precisely the split this
  project already reasons about for consent-gated traces. Operator observability and org-admin trace
  review stay separate concerns with separate governance.
- It instruments the **compaction call** for free. That is currently the one model call no ledger sees
  when `storeTraces` is off (the default), which is a finding in its own right.

This COMPLEMENTS the trace records; it does not replace them. Trace records are per-org, consent-gated,
TTL'd and user-facing. Spans are per-operator and content-free.

Deferred detail: `ai` v7 replaces per-call `experimental_telemetry` with a `registerTelemetry` call. That
is a tidy-up at the upgrade, not a reason to wait.

**Revised after checking the prerequisite.** `experimental_telemetry` is present, but the only
OpenTelemetry package in the tree is `@opentelemetry/api` (1.9.1), pulled in transitively by `ai`. That
is the API surface only: **without a registered tracer provider it is a no-op**, so enabling the flag
would emit nothing. Nothing in `api/src` or `@data-fair/lib-node` registers one, and no OTel SDK is a
declared dependency anywhere.

So this is not "add a flag". It needs an OTel SDK, an exporter, and an OTLP endpoint in config — i.e. a
telemetry stack for a service whose siblings in the data-fair stack do not have one. That is a platform
decision, not a branch decision, and it collides with the standing preference for reaching for an
existing `@data-fair/lib` primitive first (there isn't one).

Left unimplemented deliberately. The finding it would have addressed — compaction spend invisible to
every ledger — was fixed directly instead, by billing the compaction.

### Why it was postponed, so this is not re-litigated

Four consequences, all checked rather than assumed:

1. **Footprint.** `@opentelemetry/sdk-node` pulls ~25 packages — every exporter (OTLP http/grpc/proto,
   Zipkin, Jaeger, Prometheus) plus the metrics and logs SDKs — and sits at 0.222.0, i.e. pre-1.0 where
   minors carry breaking changes. Hand-wiring a `NodeTracerProvider` with one exporter avoids most of
   that, at the cost of writing it.
2. **Infrastructure.** Spans need a destination. The dev stack has no collector (nginx,
   simple-directory, events, maildev, mongo), so dev gains a container and production needs an OTLP
   endpoint plus a retention decision.
3. **The default conflicts with an existing consent policy.** `recordInputs` and `recordOutputs` are
   ENABLED by default, so the out-of-the-box behaviour ships full prompts, completions and tool results
   into spans — into a differently-governed store, outside the per-org opt-in and per-user consent that
   `storeTraces` enforces, with retention set by whoever runs the collector. Fixable with
   `recordInputs: false, recordOutputs: false`, but it is opt-OUT: the safe configuration is the one a
   future call site has to remember. Wrong default for this codebase.
4. **There is no stack convention to join.** Neither `@data-fair/lib-express` nor `@data-fair/lib-node`
   exports observability primitives and this service has no metrics endpoint — so adopting it here sets
   a stack-wide convention from one branch of one service.

It does NOT replace trace records either way: those are per-org, user-facing and consent-gated, while
spans are operator telemetry. Both would run.

**If revisited**, the cheap and safe shape is: hand-wired `NodeTracerProvider` plus one OTLP exporter
(not `sdk-node`), an explicit `tracer` rather than the global, `recordInputs`/`recordOutputs` forced off
in one shared helper so no call site can get it wrong, and the endpoint behind config defaulting to off.
Better still, raised as a `@data-fair/lib-node` question so the bootstrap and its defaults are decided
once for every service.

## 2.2 `@ai-sdk/mcp` — NOT ADOPTED (decided 2026-09-30, after reading the package)

**Reversed.** The earlier revision recommended adopting `@ai-sdk/mcp@1.0.89`. Reading 1.0.89's
`toolsFromDefinitions` before adopting it shows it would reintroduce the defect this migration
just removed, so it is not adopted.

Verified in the published 1.0.89:

- **An `isError` result is returned as ordinary data.** `execute` does `if (result.isError) return
  result`, and `mcpToModelOutput` — the `toModelOutput` it attaches to every tool — ignores `isError`
  entirely, converting an error result to `{ type: 'content' }` exactly like a success. So a tool that
  reports its own failure produces a part in `output-available`, which is precisely the conflation that
  hid a broken tool path for a whole plan. Our client rethrows instead, which is what makes the failure
  the part's STATE.
- **It forces `additionalProperties: false`** onto every tool's input schema, changing what a catalog
  server's tools accept.
- **Its media conversion is its own** (`{ type: 'image-data' }`), replacing `formatMcpToolResult`'s
  `_agentsMediaResult` envelope — which the browser's `tool-result.ts` reads. Adopting it would pull the
  UI's media rendering into the same change.

What we wanted from it we already have: `annotations` are carried onto the stored call (it puts them in
the tool's `metadata`; we read them from the listing and write them into `toolMetadata`, which is where
the audit record and P1's approval gate need them).

What it genuinely offers, and what it would cost: it removes connect/list/convert plumbing — a small,
stable part of `api/src/mcp-servers/client.ts` — at the price of the three behaviours above, each of
which carries a guarantee. **Revisit when upstream maps `isError` onto a tool failure**; that is the one
blocking item, and it is a small upstream change rather than a design disagreement. The version
constraint still holds for whenever that happens: 2.x tracks `ai` v7 (`@ai-sdk/provider@4` /
`provider-utils@5`), and 1.0.89 is the `ai` 6.x line (`provider@3.0.18` / `provider-utils@4.0.56`).

## 2.3 `pruneMessages` — SUPERSEDED by the tiered context management spec (revised twice)

Already present in the installed version:
`pruneMessages({ messages, reasoning, toolCalls, emptyMessages })`, with `toolCalls` accepting
`'before-last-message' | 'before-last-N-messages'` and a per-tool selector.

This is not compaction — it does not summarise — but dropping old tool payloads is far cheaper than
paying a summarizer to read them. The intended order becomes: prune, re-measure, summarise only if still
over budget. Given that storing tool results is what made conversations cross the threshold sooner, this
may remove most compaction calls outright.

It also flags an assumption worth revisiting: `loadHistory` drops reasoning unconditionally, while
`pruneMessages` offers `reasoning: 'before-last-message'` — implying keeping the most recent turn's
reasoning is both safe and useful.

**Revised after measuring it.** `pruneMessages({ toolCalls: 'before-last-N-messages' })` does what was
hoped — verified on a toy history it dropped the old call/result pair *together* (so nothing is orphaned)
and cut 1070 chars to 648. But adopting it on the happy path was the wrong call, for the reason this
branch already established: pruning a tool result leaves only whatever the assistant happened to narrate
about it, and its prose captures tool findings **unreliably**. A recap stands in for what it replaces; a
prune does not. The store keeps everything either way, so revival and audit are unaffected — but the
model would lose data it may still need, silently.

Adopted instead in the one place the trade is clearly right: **when compaction FAILS.** That branch used
to return the full history, which the code's own comment admits risks a context-overflow error from the
provider. There the alternative is failing the turn, so pruning the oldest tool payloads is the lesser
harm.

The reasoning observation stands and is untouched: we drop all reasoning, the SDK offers
`before-last-message`, and changing that needs evidence rather than a guess about what providers accept.

### Superseded

Relegating it to the failure path was itself wrong, and for a reason worth recording: the objection above
conflated "prune all tool results" with "prune the OLD ones", and then applied a standard that compaction
does not meet either. `before-last-N-messages` drops only old payloads, and **compaction discards the raw
text of that same span while paying a summarizer to do it** — so pruning old results is strictly less
lossy and free. Keeping it only for the failure path was abandoning it.

The genuine defect is narrower: `pruneMessages` removes the call together with the result and leaves **no
placeholder**, where the state of the art keeps the call and marks the result as cleared. That is a
missing marker, not a reason to drop the strategy.

Superseded by `2026-09-30-tiered-context-management-design.md`, which puts clearing, summarisation and
production-time bounding into the standard three-tier order instead of treating the summarizer as the
only lever.

## 2.4 The SDK's `timeout` — adopted, and it closes a gap (revised: better than described)

**Revised: `streamText` takes `timeout` directly, so no `ToolLoopAgent` adoption is needed, and the
option is richer than a run ceiling.** `TimeoutConfiguration` is `number | { totalMs, stepMs, chunkMs }`,
and `chunkMs` is an **idle** bound.

That closes a real gap rather than merely simplifying. The P0 spec claimed the server "reuses the idle
watchdog" and it did not: the browser arms a timer per stream part, while the executor had only a
whole-turn wall clock — so a provider that accepted a request and then went silent held the
conversation's lock for the full run timeout. `STREAM_IDLE_TIMEOUT_MS` now lives in
`shared/agent-loop-guards.ts` and both loops read it, which makes the spec's claim true.

It does NOT replace the outer `Promise.race` in `runTurn`, contrary to what this section first said: that
race bounds the whole turn — resolving the agent, opening MCP connections, compaction — whereas
`timeout` bounds only the model stream. Both are kept, and `totalMs` is defence in depth.

## 2.5 Evaluated and deliberately NOT adopted

Recorded so the next reader does not repeat the search.

**Durable-execution platforms** (Temporal, Inngest, Restate, DBOS). These exist to solve exactly our
worst finding — a resumed run re-firing tool side effects — by caching step results so a replayed
workflow does not re-execute completed steps. Restate's own documentation is explicit that exactly-once
for side effects has to come from the receiving side, via an idempotency key.

**Adopt the idea, not the platform.** This is a data-fair stack service with mongo and a lock
collection; the fix already identified — do not resume, mark `interrupted`, and refuse a run that already
has an assistant message — obtains the safety property without adding a runtime dependency. Revisit only
if scheduled/long-suspended runs (P2) make suspension a first-class requirement.

**Node guardrails packages.** The landscape is fragmented and predominantly Python (NeMo Guardrails,
Guardrails AI, LLM-Guard, Granite Guardian, LlamaFirewall); the npm options are small and new. The
existing model-based moderation with a custom policy is already justified in
`api/types/settings/schema.js`: dedicated classifiers use fixed taxonomies that cannot express this
platform's policy. Keep it.

One thing the literature does confirm: **"chat-template spoofing" is a named attack class** — which is
independently the attribution-forgery finding above, and a reason to treat it as a known class rather
than a curiosity.

**Eval frameworks** (evalite, Braintrust, autoevals). `lib-sim` does something they do not: the persona
can look at and click the page, so a claim like "I don't see it" is checkable against what it actually
observed. Not worth replacing. The gap worth borrowing is the CI pattern — Braintrust's model is evals
gating every PR, while these simulations deliberately gate nothing.

## 2.6 Sequencing

Independent of the message-model migration, and safe to land first or in parallel:
**2.1** (telemetry), **2.3** (prune), **2.4** (timeout).

**2.2** (`@ai-sdk/mcp`) was reversed on inspection and is not adopted — see the section, which records
why so it is not re-litigated. The `annotations` wiring it was coupled to landed with the migration
regardless, since that is where the audit record needs them.
