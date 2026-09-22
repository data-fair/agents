# Autonomous agents — P0 design (runtime spine)

Server-side agents with a persona, their own non-human identity, remote MCP tools,
shared conversations and full traces. This document specifies **P0 only**: the
runtime spine that every later phase hangs off.

## Relationship to the existing service

Everything that exists today runs the agent loop **in the browser**:
`ui/src/composables/use-agent-chat.ts` owns turns, sub-agent delegation, compaction,
tool exploration and loop guards, while `api/` is a stateless OpenAI-compatible proxy
holding no conversation state ([gateway](../../architecture/gateway.md)). The safety
argument in [mcp-tools](../../architecture/mcp-tools.md) rests on that placement: tools
execute client-side with exactly the user's permissions, so an injection cannot
escalate.

Autonomous agents invert every clause of that sentence — server-side loop,
server-held conversation, the agent's own identity, remote HTTP MCP servers, and
execution with no human present. This is a new subsystem beside the in-page
assistant, not a modification of it. The in-page assistant is unchanged by P0.

## Phase decomposition

P0 is the first of five sub-projects; each later one gets its own spec.

| # | Sub-project | Contents |
|---|---|---|
| **P0** | Runtime spine | This document |
| P1 | Safety hardening | Prompt-injection defenses beyond P0's structural ones, approval gate enabled, per-run policy |
| P2 | Scheduled executions | Plan storage, run queue, retry, result notification |
| P3 | Memory & skills | Durable memory, retrieval, self-defined skills |
| P4 | Self-planning & scale | Agent-initiated scheduling, per-agent quotas |

Anonymous agents (public-data-only, no NHI) are **out of scope**: the NHI link is
strictly enforced, and an agent without a verified `nhi.clientId` cannot run.

Deliberately not in P0, and not merely unmentioned:

- sub-agent delegation;
- per-agent model-role overrides (agents resolve roles through the owning org's
  `modelMapping` like every other caller);
- any scheduling, memory or skill mechanism.

## Decisions

Each of these was decided explicitly; the rationale is kept because the alternatives
are reasonable and will be re-proposed otherwise.

| Decision | Choice | Why |
|---|---|---|
| Execution model | Async, in-process, non-resumable | Scheduling (P2) needs background execution anyway; distributed run leasing is deferred until concurrency demands it |
| Acting identity | The agent's NHI only | Uniform between interactive and scheduled runs, one audit identity, works over arbitrary MCP servers. The instruct-list is a grant to borrow the agent's privileges |
| Key custody | One service keypair, one issuer, subject per agent | Accepted tradeoff, see [Security posture](#security-posture) |
| Write surface | MCP server profiles + the NHI's own permissions | Writes are on the table with disclaimers; approval gate is built but open |
| Tool disclosure | Per-agent toggle: static set or runtime exploration | `tool-exploration.ts` already exists and is Vue-free, so the second path is reuse rather than a second implementation |
| Conversation scope | Shared per agent, multiple threads | Collaborative by nature; makes per-user attribution mandatory and gives P2's scheduled runs an obvious place to post |
| Configuration ownership | Org admins | Superadmin gating is a temporary rollout flag, not an ownership boundary |
| Sub-agents | Out of P0 | A single loop with a tool set is the smallest thing that proves the architecture |

## Module layout

New code in `api/src/agents/` (CRUD, runtime, NHI issuer). The service is itself named
`agents`, so the module name collides mildly; `api/src/autonomous/` is the alternative
if that proves confusing in practice.

The `shared/` workspace — which exists today as a four-line `package.json` referenced
by nothing — receives the modules both loops need:

- `agent-loop-guards.ts` (step backstop, repeated-call guard, nudge hook)
- `agent-stream-parts.ts`
- `agent-subagent-output.ts`
- `tool-exploration.ts`
- `utils/compaction-policy.ts`
- the `ChatMessage` type, currently declared inside `use-agent-chat.ts`

These are already Vue-free; the move is mechanical and the UI keeps importing them
through the workspace, so there is one copy of the guard logic rather than two.
Moving `ChatMessage` is what lets the existing render components serve both loops
(see [UI](#ui)).

## Domain model

Four collections, following the existing `owner.type` / `owner.id` convention so
quotas, credits and traces key off them unchanged.

### `agents`

The definition, owned by an organization, written by its admins.

```
{
  _id, id, owner: { type, id, name?, department? },
  title,
  persona, instructions,
  mcpServers: [{ id, url, toolFilter?: string[] }],   // toolFilter: include-list of tool names
  toolDisclosure: 'static' | 'exploration',
  nhi: { clientId },                                   // nhi-<nanoid> from simple-directory
  instructors: [{ userId, userName? }],
  enabled: boolean,
  createdAt, updatedAt, createdBy
}
```

An MCP server's openapi-mcp profile is a property of how that server is **deployed**
(its `PROFILE` env), not something this service selects per agent — so an agent names
a URL, and narrows further with `toolFilter` if it wants a subset of what that URL
exposes.

**Who may instruct.** Admins of the owning organization are implicitly authorized,
since they configure the agent anyway; `instructors[]` extends that to named users who
are not admins. Both paths are checked by one `canInstruct(agent, sessionState)`
helper, used by the message route, the websocket `canSubscribe` callback and the abort
route, so the three cannot drift apart.

Typed from `api/types/agent/schema.js` per the repo convention, so `npm run
build-types` generates the vjsf form and the configuration page is largely free —
the way `settings.vue` already works.

### `agent-conversations`

`{ agentId, owner, title, createdAt, lastMessageAt, messageSeq }`

Multiple threads per agent rather than one endless timeline, so topics stay
separable and each thread's context stays boundable. Every authorized instructor
sees every thread of that agent.

### `agent-messages`

One document per message — appendable, paginable, and immune to the 16 MB document
ceiling a long-lived agent would eventually hit.

`{ conversationId, agentId, owner, seq, role, author, content, reasoning?, toolCalls?, toolResults?, runId, createdAt, updatedAt }`

`author` is **mandatory**: `{ userId, userName }` for a user message, the agent for an
assistant message, and (in P2) the schedule. That is the shared-timeline decision
cashing out — attribution cannot be optional when several people share a context.
Traces already carry `userId`/`userName`, so attribution lines up end to end.

### `agent-runs`

Audit metadata, kept even though runs are non-resumable:

`{ agentId, conversationId, owner, trigger, status, startedAt, endedAt?, steps, credits, stopReason, error?, toolCalls: [{ name, server, annotations }] }`

At boot, any run still marked `running` is marked `interrupted` — the honest record
of a restart, given the non-resumable choice.

## Execution model

**One turn is one run.** `POST /api/agent-conversations/:id/messages` authorizes the
caller against `instructors[]`, appends the user message, and returns immediately with
a `runId`. A background executor in the same process picks it up.

**Per-conversation serialization.** A shared timeline means two people can type at
once, so a run takes a per-conversation lock via `@data-fair/lib-node/locks.js`
(Mongo-backed, already started in `server.ts` — no new infrastructure). If a run is in
flight the new message is appended and left pending; when the run ends the executor
checks for pending messages and starts another run. Nobody is rejected, and no message
lands mid-turn and silently changes the meaning of a turn already underway.

**The loop** is AI SDK `streamText` in Node against the same `getRoleModel()`
resolution and provider factories the gateway uses, called in-process rather than over
HTTP. It reuses `STEP_LIMIT`, `repeatedCallGuard()`, `loopGuardPrepareStep`, the
compaction policy and the idle watchdog.

**Bounding a run**, since no human is necessarily watching:

- the existing step backstop and repeated-call guard;
- a per-run credit budget, checked between steps;
- a wall-clock ceiling;
- `POST /api/agent-runs/:id/abort`, authorized by the same `canInstruct` check as
  posting a message — anyone who can start a turn can stop one;
- `enforceQuotas()` before the run starts, `recordUsage()` after each model call — so
  an autonomous run consumes the owning org's credits through exactly the path
  interactive chat does.

**Failure is a message, not a silence.** A provider error, an exhausted budget, a
wall-clock timeout or an abort ends the run with a `status` and `stopReason` on the run
document *and* appends a terminal assistant message describing what happened. A
conversation must never appear to stop for no reason — the same principle the in-page
loop applies with its empty-turn and timeout fallbacks.

## Streaming

Mongo is authoritative; websockets carry liveness. Both halves are needed, and neither
is sufficient alone.

**Mongo as source of truth.** `agent-messages` is what the UI loads on open and
refetches on any doubt. The executor persists the in-flight assistant message coarsely
— roughly every 2 s — so a late joiner sees work in progress.

**Websockets for notification and deltas**, using the stack's existing pub/sub:
`@data-fair/lib-express/ws-server.js` + `@data-fair/lib-node/ws-emitter.js` on the
server, `@data-fair/lib-vue/ws.js` (`useWS`) in the browser. Channel
`agent-conversations/<conversationId>`; `canSubscribe` resolves the conversation's
agent and checks `instructors[]`. Message kinds: `message-start`, `text-delta`,
`tool-call`, `tool-result`, `message-end`, `run-status`.

Two constraints follow from how that transport is built, and they shape the design:

- **Deltas are deltas, not accumulated text, and are throttled to ~4/s per active
  run.** The cross-process fanout is a capped collection created as
  `{ capped: true, size: 100000, max: 1000 }` — 100 KB shared by every channel in the
  deployment. `size` binds first: at ~220 B per delta document that is roughly 450
  documents of headroom, i.e. `450 / (4 × concurrent runs)` seconds — about 110 s at
  one active run, 22 s at five, 6 s at twenty. That headroom only has to cover how far
  a tailing process can fall behind, since no subscriber wants history.
- **Every delta carries a sequence number, and the client refetches the message over
  HTTP on a gap.** Delivery is best-effort and a fast-wrapping capped collection is
  what provokes `CappedPositionLost`, which `initCursor` recovers from by restarting
  and dropping whatever passed in between. The gap check turns that from a corruption
  bug into a latency blip.

There is no SSE endpoint.

## Identity and the MCP transport

### The service as an NHI issuer

One ES256 keypair. The private half comes from the deployment's secret store
(`NHI_SIGNING_KEY`), is validated fail-fast at boot the way `assertGlobalAiConfig`
validates provider config, and is **never stored in Mongo**.

Issuer is `${publicUrl}/api/nhi`, serving:

- `/.well-known/openid-configuration` — must echo its own `issuer`, since
  simple-directory's `getJwksUri` rejects a mismatch;
- `/jwks`.

Discovery rather than an inline JWKS means rotation is publishing a new `kid` and
keeping the old one during overlap: `createRemoteJWKSet` refetches on an unknown `kid`
by itself, with no re-enrollment anywhere. Discovery requires https and a
non-private host; dev relies on simple-directory's `nhisAllowInsecureIssuers`.

### Enrollment

Manual and immediately verified, mirroring `nhi-proxy enroll`. Creating an agent shows
the org admin the issuer URL and the subject (`agent:<agentId>`); they create the NHI
on their organization's simple-directory page and paste back the `nhi-…` client id. On
save the service performs a **real exchange**, so a misconfiguration surfaces at
configuration time rather than inside the first run.

### Sessions

`POST /api/auth/nhi-token` caps a session at `min(assertion.exp, now + 30m)`, so a
120-second assertion buys a 120-second session. nhi-proxy wants that short window
because a browser it drives holds the cookie directly; here the cookie never leaves the
process. So the **assertion TTL is configurable with a 300 s default**, cutting
exchanges roughly fifteen-fold against nhi-proxy's posture at a cost bounded by the
assertion never leaving the process.

Operational consequence worth sizing for: the exchange endpoint is rate-limited **per
`client_id` and per caller IP, consuming a point on success too**. A deployment running
many agents behind one egress IP needs simple-directory's `authRateLimit` sized
accordingly.

### Transport

`StreamableHTTPClientTransport` from `@modelcontextprotocol/sdk`, injecting the
`Cookie` header captured from the exchange's `Set-Cookie`.

**Not** a Bearer token: `@data-fair/lib-express`'s `session.js` reads sessions from
cookies only (`id_token` / `id_token_sign`) and parses no `Authorization` header
anywhere in the package. This is why nhi-proxy relays `Set-Cookie` to its client, and
the same constraint applies here.

A per-agent cookie jar refreshes at ~80 % of expiry and on any 401. Tools are listed at
run start and wrapped as AI SDK tools, reusing the wrapper shape of
`FrameClientAggregator` — including `formatMcpToolResult`'s media-envelope handling,
which the gateway already knows how to rebuild.

## Traces and retention

"Exhaustive traces" splits into two stores with different rules, and conflating them
would import a consent model that does not apply here.

**Conversation content is product data.** `agent-messages` is the conversation —
stored because storing it *is* the feature, visible to every instructor by design, and
not consent-gated. The UI must say so plainly where a user types: this thread is shared
with everyone allowed to instruct this agent, and retained.

**LLM request traces reuse the existing layer.** Each physical model request is written
to `trace-requests` by the same `recordTraceRequest` path the gateway uses, with
`conversation.id` set to the agent conversation id, a `contextKind` identifying the
agent run, and `userId`/`userName` taken from the message's `author`. Two deliberate
differences from the in-page assistant:

- **Storage follows the org's `storeTraces` flag alone.** The per-user
  `x-trace-consent` gate does not apply: there is no browser session to hold a consent
  cookie, and in P2 there will be no user at all. The org, as data controller, decides.
- Retention stays the existing fixed 30-day TTL. `agent-messages` has **no** TTL — a
  conversation persists until deleted, which is what makes it a conversation rather
  than a trace.

Admin review reuses the existing trace routes and `reconstructTrace()` unchanged.
Deleting a thread removes its messages and its runs; the existing per-conversation and
per-user trace deletion routes already cover the GDPR side and need no counterpart
here.

## Safety model

**Three trust levels, explicit in the prompt structure:**

1. *Persona and policy* — org-admin authored, system role. Trusted for behavior, and
   structurally unable to widen reach: which identity and which servers an agent uses
   are configuration, not prompt.
2. *User messages* — semi-trusted. Authors are on the instruct-list, but the timeline
   is shared, so one instructor's paste reaches everyone's turn.
3. *Tool results* — always untrusted. Wrapped in a provenance envelope naming the
   server and tool, with a standing instruction that their content is data and never
   instruction. The repo already uses this shape in `wrapHiddenContext`.

**The tool set is frozen at run start.** Nothing a tool returns can add a tool;
exploration mode promotes only from the statically configured catalog. This is the
most effective structural defense available here and it is free, because the
configuration model already implies it.

**Annotations are recorded, the gate is built and open.** Every tool call records its
MCP annotations (`readOnlyHint` / `destructiveHint`, which openapi-mcp emits, defaulting
from the HTTP verb) into the run and the trace, so the write surface is queryable from
day one. The approval gate is a policy hook keyed on those annotation classes
(`allow | approve | deny`) that **ships set to `allow`** — plumbing present, gate open,
so enabling it in P1 is configuration rather than surgery.

**Egress is a deployment concern.** Network-level controls, if a deployment wants them,
rather than an application-level allowlist of MCP server URLs.

### Security posture

Two properties hold structurally and are worth stating as invariants:

- **An org admin cannot give an agent reach beyond their own organization.** NHIs are
  managed through simple-directory's org-scoped endpoints, are bound to exactly one
  organization, can never be an admin, and can never be an impersonation target. The
  ceiling is enforced by simple-directory, not by policy in this service.
- **Secrets never enter model context.** The signing key comes from the environment;
  assertions and session cookies live in the transport layer and appear in no message,
  no tool argument and no stored trace.

Two things this design does **not** do, stated plainly so P1 starts from an accurate
picture:

- **One signing key covers every agent on the deployment.** A compromise of it can mint
  an assertion for any subject, and therefore impersonate every agent in every org on
  that deployment — simple-directory's per-NHI issuer binding, which exists precisely to
  stop one provider vouching for another org's identity, stops helping. This was chosen
  deliberately over a per-agent keypair for operational simplicity; the mitigations are
  that the key lives in the secret store rather than the database and never in Mongo.
- **With writes enabled, a prompt injection in tool output can cause a write the NHI is
  permitted to make**, and any instructor can plant content into everyone's context.
  P0's defenses are scope, observability and reversibility — not prevention. Raising
  that is P1's job.

## Configuration ownership and rollout gating

One document, one owner. `PUT /api/agents/:id` is gated by
`assertAccountRole(session, owner, 'admin')`.

Progressive exposure is a **deployment-level config flag** that additionally requires
admin mode on the agent write routes, defaulting to on. Flipping it off opens
configuration to org admins with no code change, no schema change and no migration. It
is a rollout control, not an ownership boundary: nothing in the agent document is
durably superadmin-owned.

## UI

The render layer is already decoupled from the loop: `AgentChatMessages.vue`,
`MarkdownContent.vue` and `AgentChatInput.vue` are presentational, taking
`ChatMessage[]` and emitting. The only thing tying them to browser orchestration is
that `ChatMessage` is declared inside `use-agent-chat.ts`. Moving that type to
`shared/` lets those components render autonomous conversations **unchanged**.

Not reusable: `useAgentChat` and the `lib-vuetify` chat entry points, because they *are*
the browser loop. In their place, `useAgentConversation(conversationId)` — fetch a page
of `agent-messages`, subscribe through `useWS`, apply deltas with the seq-gap refetch,
expose `messages` / `running` / `send()` / `abort()`. No AI SDK in the browser at all:
roughly 150 lines against the current 1300.

Pages: an agent list, an agent page (thread list + messages + input), and configuration
as a vjsf form generated from `api/types/agent/schema.js`.

## Testing

Per the project's three Playwright projects:

- **unit** — assertion construction, cookie-jar expiry, seq-gap detection,
  `agent-messages` → `ChatMessage` mapping, tool annotation classification, provenance
  wrapping, prompt assembly.
- **api** — org-admin authorization and the rollout gate, instructor authorization,
  conversation and message endpoints, run lifecycle and serialization under concurrent
  posts, budget enforcement, quota refusal, NHI exchange against dev simple-directory.
- **e2e** — create and configure an agent, send a message, watch a streamed reply,
  **two browsers on one shared thread**, and abort.

`api/src/models/mock-model.ts` already exists for deterministic loop behavior,
including the `loop forever` seam the guard tests use. A small in-process MCP server
serves as the tool fixture.

## Delivery order

Each step independently verifiable:

1. Extract the loop modules and `ChatMessage` into `shared/` — pure refactor, existing
   tests must stay green.
2. Agent schema, CRUD, authorization, rollout gate, generated form.
3. NHI issuer routes, assertion, exchange, cookie jar — testable standalone against
   dev simple-directory.
4. MCP client and tool wrapping.
5. Conversation / message / run storage, executor, per-conversation lock, budgets.
6. Websocket server wiring, emitter, client composable.
7. UI pages.
8. Traces and credits integration.

## Prerequisites

Confirm before step 3 rather than discovering them mid-implementation:

- dev simple-directory must run with **`manageNhis` enabled** (defaults to `false`);
- the dev nginx must proxy the websocket upgrade — this repo has no websocket server
  today;
- `@modelcontextprotocol/sdk` moves from a root devDependency to an `api` dependency.

## Assumptions to revisit

- **The shared `ws-messages` capped collection is adequate.** Revisit if sustained
  concurrency passes roughly 50 simultaneous runs per deployment, or if
  `CappedPositionLost` appears in logs. The fix would be a dedicated capped collection,
  which means changing `initMessagesCollection` in `@data-fair/lib-node` — acceptable,
  but not justified by current numbers.
- **In-process, non-resumable runs are adequate.** Revisit when scheduled runs (P2) make
  restart-during-run common enough that `interrupted` is a nuisance rather than a note.
- **300 s assertion TTL.** Revisit if simple-directory's `authRateLimit` proves to be
  the binding constraint, or if the threat model changes.
