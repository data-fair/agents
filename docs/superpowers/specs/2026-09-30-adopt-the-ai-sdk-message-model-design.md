# Adopt the AI SDK's message model, and the ecosystem around it

Part 1 replaces the hand-built message shape with the library's. Part 2 covers the rest of the
"are we reinventing this?" question — what the SDK and its ecosystem already provide, what to take,
and what was evaluated and rejected.

**Status:** proposed, awaiting approval to implement
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

## Scope

- `api/types/autonomous-agent-message/schema.js` — reduced to `metadata` plus a loose `parts` array; the
  parts contract moves to the library.
- `api/src/autonomous-agent-runtime/executor.ts` — stream accumulation builds `UIMessagePart`s;
  `loadHistory` calls `convertToModelMessages`; `compactHistory` keeps its cut alignment.
- `api/src/autonomous-agent-runtime/operations.ts` — delete `StoredPart`,
  `storedTurnsToModelMessages(WithSeqs)`; keep `boundToolResult`, `partsText`, `withAppendedText`,
  `attributedUserText` (retargeted at the new shape).
- `shared/autonomous-agent-chat-message.ts` — deleted.
- `ui/src/components/AutonomousAgentRunStatus.vue`, `.../[agentId].vue` — render `UIMessage` parts;
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

## 2.1 OpenTelemetry GenAI telemetry — adopt

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

## 2.2 `@ai-sdk/mcp` — adopt the 1.x line

**Version constraint, verified:** `@ai-sdk/mcp@2.x` depends on `@ai-sdk/provider@4` /
`provider-utils@5`, i.e. it tracks `ai` v7. The line for our `ai` 6.x is **`@ai-sdk/mcp@1.0.89`**, whose
dependencies (`provider@3.0.18`, `provider-utils@4.0.56`) match our installed 3.0.15 / 4.0.50. Adoptable
now with a patch bump, blocked on nothing.

What `createMCPClient` replaces in `api/src/mcp-servers/client.ts`: the connect / list / convert
plumbing. It wraps the same `StreamableHTTPClientTransport` we already use, supports custom HTTP headers
(so the cookie and `x-api-key` injection survives unchanged), supports explicit schemas for a tool subset
(which is what `toolFilter` expresses), and `client.tools()` returns tools `streamText` accepts directly.

What it does NOT replace, and must stay ours:

- the multi-server merge and its last-write-wins collision behaviour;
- the `serverByTool` provenance map;
- `wrapToolResult` and the envelope — the security property lives here;
- the per-turn connection lifetime tied to the conversation lock.

So this removes plumbing, not the parts that carry the guarantees. It also brings OAuth, resources and
elicitation, which matter for catalog servers beyond this stack's own.

## 2.3 `pruneMessages` — adopt as a pre-compaction step

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

## 2.4 `ToolLoopAgent`'s `timeout` — adopt

`ToolLoopAgent.stream({ timeout })` ships a run timeout. It replaces the hand-rolled `Promise.race`
deadline in `runTurn`. Whether to adopt `ToolLoopAgent` wholesale is a smaller question — it is a config
wrapper bundling model/instructions/tools/`stopWhen` for reuse, and adds no persistence, guards or
billing — so the timeout is the part worth taking.

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

Coupled to it: **2.2** (`@ai-sdk/mcp`) touches the same tool-construction path where `annotations` must
start being carried into `toolMetadata`, so it belongs with the migration rather than before it.
