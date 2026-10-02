# Autonomous agents — P0 design (runtime spine)

Server-side **autonomous agents** with a persona, their own non-human identity, remote
MCP tools, shared conversations and full traces. This document specifies **P0 only**:
the runtime spine that every later phase hangs off.

**Naming.** "Autonomous agent" is written out everywhere — in prose, collection names,
routes, types and UI. The service is itself called `agents` and already has an in-page
assistant that people call "the agent"; an unqualified "agent" in this subsystem would
be ambiguous on sight. The cost is verbosity, which is the intended trade. The rule is
absolute for identifiers and user-facing text; in prose, hyphenated compounds such as
*per-agent* stay short where the subject is already unambiguous.

## Relationship to the existing service

Everything that exists today runs the agent loop **in the browser**:
`ui/src/composables/use-agent-chat.ts` owns turns, sub-agent delegation, compaction,
tool exploration and loop guards, while `api/` is a stateless OpenAI-compatible proxy
holding no conversation state ([gateway](../../architecture/gateway.md)). The safety
argument in [mcp-tools](../../architecture/mcp-tools.md) rests on that placement: tools
execute client-side with exactly the user's permissions, so an injection cannot
escalate.

Autonomous agents invert every clause of that sentence — server-side loop, server-held
conversation, the autonomous agent's own identity, remote HTTP MCP servers, and execution with no
human present. This is a new subsystem beside the in-page assistant, not a modification
of it. The in-page assistant is unchanged by P0.

## Phase decomposition

P0 is the first of five sub-projects; each later one gets its own spec.

| # | Sub-project | Contents |
|---|---|---|
| **P0** | Runtime spine | This document |
| P1 | Safety hardening | Prompt-injection defenses beyond P0's structural ones, approval gate enabled, per-run policy |
| P2 | Scheduled executions | Plan storage, run queue, retry, result notification |
| P3 | Memory & skills | Durable memory, retrieval, self-defined skills |
| P4 | Self-planning & scale | Agent-initiated scheduling, per-agent quotas |

**Cross-cutting, not a numbered phase:** data lifecycle and the right to be forgotten —
see [Data lifecycle and erasure](#data-lifecycle-and-erasure). P0 ships the fields that
make erasure implementable; the mechanism gets its own spec before GA.

Anonymous autonomous agents (public-data-only, no NHI) are **out of scope**: the NHI
link is strictly enforced, and an autonomous agent without a verified `nhi.clientId`
cannot run.

Deliberately not in P0, and not merely unmentioned:

- sub-agent delegation;
- per-agent model-role overrides (autonomous agents resolve roles through the owning
  org's `modelMapping` like every other caller);
- per-agent MCP server URLs — the catalog is global and ops-owned (see
  [MCP server catalog](#mcp-server-catalog));
- any scheduling, memory or skill mechanism.

## Decisions

Each of these was decided explicitly; the rationale is kept because the alternatives
are reasonable and will be re-proposed otherwise.

| Decision | Choice | Why |
|---|---|---|
| Execution model | Async, in-process, non-resumable | Scheduling (P2) needs background execution anyway; distributed run leasing is deferred until concurrency demands it |
| Acting identity | The autonomous agent's NHI only | Uniform between interactive and scheduled runs, one audit identity, works over arbitrary MCP servers. The instruct-list is a grant to borrow the agent's privileges |
| Key custody | One service keypair, one issuer, subject per autonomous agent | Accepted tradeoff, see [Security posture](#security-posture) |
| MCP servers | Global env-var catalog; org admins pick from it | Ops owns which endpoints exist; picking from a list is also the whole egress story |
| Write surface | MCP server profiles + the NHI's own permissions | Writes are on the table with disclaimers; approval gate is built but open |
| ~~Tool disclosure~~ | **REMOVED 2026-09-30.** The field shipped and nothing ever read it: the executor always sent every selected tool, while the form offered "exploration" and described it as showing names only. An admin picking it for a large tool set got static behaviour with no signal, which is worse than not offering the choice. Reuse of `tool-exploration.ts` is still the right implementation — but it is a feature with its own decisions (how promotion interacts with the loop guards, with compaction's `retainedToolNames`, and with storing the `<tools-available>` notices in the parts model), not a field. The field comes back with it. |
| Conversation scope | Shared per autonomous agent, multiple threads | Collaborative by nature; makes per-user attribution mandatory and gives P2's scheduled runs an obvious place to post |
| Configuration ownership | Org admins | Superadmin gating is a temporary rollout flag, not an ownership boundary |
| Sub-agents | Out of P0 | A single loop with a tool set is the smallest thing that proves the architecture |

## Module layout

New code in `api/src/autonomous-agents/` (CRUD, runtime, NHI issuer) — the explicit
name also removes the collision with the service's own `agents` identity.

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
(see [UI](#ui)). These keep their current names: they are shared with the in-page
assistant and are not autonomous-agent-specific.

## MCP server catalog

**MCP servers and registries are configured globally, by ops, in an env var** —
`MCP_SERVERS`, a JSON array, validated fail-fast at boot beside `assertGlobalAiConfig`
(`api/src/config.ts`), so a malformed entry crashes the process rather than failing on
first use. This mirrors how `PROVIDERS` / `MODELS` already work.

```json
[
  {
    "id": "data-fair-registry",
    "name": "Data Fair registry",
    "description": "Aggregated tool profiles across the data-fair services",
    "url": "https://example.org/mcp-registry/mcp",
    "auth": "nhi-session"
  },
  {
    "id": "public-docs",
    "name": "Public documentation",
    "url": "https://example.org/docs-mcp/mcp",
    "auth": "none"
  }
]
```

**Not every server gets a session cookie.** `auth` selects per server:

| `auth` | Behaviour |
|---|---|
| `nhi-session` | The NHI session cookie is injected (see [Transport](#transport)). For stack services that authenticate the autonomous agent as itself. |
| `none` | No credential. For public or network-trusted endpoints. |
| `apiKey` | A static header from the same env entry (`apiKeyHeader` + `apiKey`), ops-owned. For third-party servers with their own auth. |

An `apiKey` value is a deployment secret: it lives in the env entry, never in an
autonomous agent document, never in a prompt, never in a stored trace.

An autonomous agent **references catalog entries by id**, and may narrow one with
`toolFilter`. Write-time validation rejects an unknown `serverId`, the same way
`modelMapping` refs are validated against the catalog today. `GET
/api/autonomous-agents/:type/:id/mcp-servers` returns the catalog (without secrets) to
power the picker — account-scoped like `GET /api/catalog/:type/:id`, so the endpoint
has a real authorization subject and the vjsf picker can interpolate the account the
same way the model picker does.

Two consequences worth naming:

- **This is the egress control.** An org admin can only point an autonomous agent at
  endpoints ops has already approved, so there is no application-level URL allowlist to
  maintain and no free-text URL to abuse. Network-level controls remain available at
  deployment if a given site wants defence in depth.
- **An openapi-mcp profile is a property of the deployed server** (its `PROFILE` env),
  not something this service selects. A catalog entry *is* a URL-plus-profile; ops
  publishes as many entries as it wants profiles.

Dynamic, per-agent addition of MCP servers may come later. It is not planned, and
nothing in P0 should assume it.

## Domain model

Four collections, following the existing `owner.type` / `owner.id` convention so
quotas, credits and traces key off them unchanged.

### `autonomous-agents`

The definition, owned by an organization, written by its admins.

```
{
  _id, id, owner: { type, id, name?, department? },
  title,
  persona, instructions,
  mcpServers: [{ serverId, toolFilter?: string[] }],   // serverId → global catalog entry
  toolDisclosure: 'static' | 'exploration',
  nhi: { clientId },                                    // nhi-<nanoid> from simple-directory
  instructors: [{ userId, userName? }],
  enabled: boolean,
  createdAt, updatedAt, createdBy
}
```

**The owner is always an organization.** `owner.type` is restricted to `organization`,
in the schema and by a guard on every route. A personal-account autonomous agent could
not work even in principle: the identity model rests on an NHI, and simple-directory
binds an NHI to exactly one organization. The restriction also closes a live hole —
`getAccountRole` returns `admin` for any user acting on their own personal account
("user is always admin of themself"), so without the guard `assertAccountRole` is a
no-op on a `user/<own-id>` path and every authenticated user would reach these routes.

**Who may instruct.** Admins of the owning organization are implicitly authorized,
since they configure the autonomous agent anyway; `instructors[]` extends that to named
users who are not admins. A listed instructor **may come from any account** — the list
is a deliberate grant by an org admin, consistent with the acting-identity decision that
instructing an autonomous agent means borrowing its privileges. The grant is visible and
revocable in exactly one place, the `instructors[]` array. Both paths are checked by one
`canInstruct(autonomousAgent, sessionState)` helper, used by the message route, the
websocket `canSubscribe` callback and the abort route, so the three cannot drift apart.

Typed from `api/types/autonomous-agent/schema.js` per the repo convention, so `npm run
build-types` generates the vjsf form and the configuration page is largely free — the
way `settings.vue` already works. The MCP server picker is a `getItems` autocomplete
against the catalog endpoint, exactly as the model picker is against `/api/catalog`.

### `conversations`

`{ agentId, owner, title, createdAt, lastMessageAt, messageSeq }`

Multiple threads per autonomous agent rather than one endless timeline, so topics stay
separable and each thread's context stays boundable. Every authorized instructor sees
every thread of that autonomous agent.

### `messages`

One document per message — appendable, paginable, and immune to the 16 MB document
ceiling a long-lived autonomous agent would eventually hit.

`{ conversationId, agentId, owner, seq, role, author, content, reasoning?, toolCalls?, toolResults?, runId, createdAt, updatedAt }`

`author` is **mandatory**: `{ userId, userName }` for a user message, the autonomous
agent for an assistant message, and (in P2) the schedule. That is the shared-timeline
decision cashing out — attribution cannot be optional when several people share a
context, and it is also what makes per-user erasure possible later.

### `runs`

Audit metadata, kept even though runs are non-resumable:

`{ agentId, conversationId, owner, trigger, status, startedAt, endedAt?, steps, credits, stopReason, error?, toolCalls: [{ name, serverId, annotations }] }`

At boot, any run still marked `running` is marked `interrupted` — the honest record of a
restart, given the non-resumable choice.

## Execution model

**One turn is one run.** `POST /api/conversations/:id/messages`
authorizes the caller with `canInstruct`, appends the user message, and returns
immediately with a `runId`. A background executor in the same process picks it up.

**Per-conversation serialization.** A shared timeline means two people can type at once,
so a run takes a per-conversation lock via `@data-fair/lib-node/locks.js` (Mongo-backed,
already started in `server.ts` — no new infrastructure). If a run is in flight the new
message is appended and left pending; when the run ends the executor checks for pending
messages and starts another run. Nobody is rejected, and no message lands mid-turn and
silently changes the meaning of a turn already underway.

**The loop** is AI SDK `streamText` in Node against the same `getRoleModel()` resolution
and provider factories the gateway uses, called in-process rather than over HTTP. It
reuses `STEP_LIMIT`, `repeatedCallGuard()`, `loopGuardPrepareStep`, the compaction policy
and the idle watchdog.

**Bounding a run**, since no human is necessarily watching:

- the existing step backstop and repeated-call guard;
- a per-run credit budget, checked between steps;
- a wall-clock ceiling;
- `POST /api/runs/:id/abort`, authorized by the same `canInstruct`
  check as posting a message — anyone who can start a turn can stop one;
- `enforceQuotas()` before the run starts, `recordUsage()` after each model call — so an
  autonomous run consumes the owning org's credits through exactly the path interactive
  chat does.

**Failure is a message, not a silence.** A provider error, an exhausted budget, a
wall-clock timeout or an abort ends the run with a `status` and `stopReason` on the run
document *and* appends a terminal assistant message describing what happened. A
conversation must never appear to stop for no reason — the same principle the in-page
loop applies with its empty-turn and timeout fallbacks.

## Streaming

Mongo is authoritative; websockets carry liveness. Both halves are needed, and neither
is sufficient alone.

**Mongo as source of truth.** `messages` is what the UI loads on open
and refetches on any doubt. The executor persists the in-flight assistant message
coarsely — roughly every 2 s — so a late joiner sees work in progress.

**Websockets for notification and deltas**, using the stack's existing pub/sub:
`@data-fair/lib-express/ws-server.js` + `@data-fair/lib-node/ws-emitter.js` on the
server, `@data-fair/lib-vue/ws.js` (`useWS`) in the browser. Channel
`conversations/<conversationId>`; `canSubscribe` resolves the
conversation's autonomous agent and applies `canInstruct`. Message kinds:
`message-start`, `text-delta`, `tool-call`, `tool-result`, `message-end`, `run-status`.

Two constraints follow from how that transport is built, and they shape the design:

- **Deltas are deltas, not accumulated text, and are throttled to ~4/s per active run.**
  The cross-process fanout is a capped collection created as
  `{ capped: true, size: 100000, max: 1000 }` — 100 KB shared by every channel in the
  deployment. `size` binds first: at ~220 B per delta document that is roughly 450
  documents of headroom, i.e. `450 / (4 × concurrent runs)` seconds — about 110 s at one
  active run, 22 s at five, 6 s at twenty. That headroom only has to cover how far a
  tailing process can fall behind, since no subscriber wants history.
- **Every delta carries a sequence number, and the client refetches the message over
  HTTP on a gap.** Delivery is best-effort and a fast-wrapping capped collection is what
  provokes `CappedPositionLost`, which `initCursor` recovers from by restarting and
  dropping whatever passed in between. The gap check turns that from a corruption bug
  into a latency blip.

There is no SSE endpoint.

## Identity and the MCP transport

### The service as an NHI issuer

One ES256 keypair. The private half comes from the deployment's secret store
(`NHI_SIGNING_KEY`), is validated fail-fast at boot the way `assertGlobalAiConfig`
validates provider config, and is **never stored in Mongo**.

Issuer is `${siteUrl}/agents/api/nhi`, serving:

- `/.well-known/openid-configuration` — must echo its own `issuer`, since
  simple-directory's `getJwksUri` rejects a mismatch;
- `/jwks`.

There is no `PUBLIC_URL` config. Instead, the issuer is **captured, not configured**: on
the request that enrolls (or re-enrolls) an autonomous agent, the write routes read
`reqSiteUrl(req)` — the real site url that admin's request was proxied through — and
store it as `nhi.siteUrl`, with `nhi.issuer` derived from it
(`${siteUrl}/agents/api/nhi`). Because it comes off a request that demonstrably reached
this service, the captured issuer provably resolves here; a configured value could drift
from reality (wrong host, missing path prefix, stale after a move) with nothing to catch
it before the first exchange. Note what it is *not*: nothing on our side dereferences it
— it only supplies the issuer string and the audience we declare to simple-directory
(below).

**Discovery, not an inline JWKS — because we cannot maintain an inline one.** The NHI
management endpoints (`/api/organizations/:organizationId/nhis`) are gated on
`isOrgAdmin`, with no secret-based service-to-service path, so this service has no door
through which to push a rotated key. An inline JWKS would therefore make correctness
depend on a human performing a UI step after every rotation, whose failure mode is every
autonomous agent silently losing access. With discovery, rotation is publishing a new
`kid` and keeping the old one during overlap: `createRemoteJWKSet` refetches on an
unknown `kid` by itself.

This is also what keeps **NHI management a one-time UI action**: an org admin creates the
record once with the issuer and subject, and it never needs touching again.

Discovery's cost is bounded and is not per-exchange: `getJwksUri` is memoized for 10
minutes and `createRemoteJWKSet` caches keys, refetching only on an unknown `kid`, so a
steady-state exchange triggers no fetch at all. Discovery does require https and a
non-private host, so a deployment whose cluster cannot reach its own ingress should solve
that with split-horizon DNS rather than by enabling `nhisAllowInsecureIssuers`, which
would disable the SSRF guard for *every* NHI provider on that deployment. Dev relies on
that flag only because its issuer is `http://localhost`.

### Enrollment

**P0 is manual and immediately verified**, mirroring `nhi-proxy enroll`. Creating an
autonomous agent shows the org admin the issuer URL and the subject
(`autonomous-agent:<id>`); they create the NHI on their organization's simple-directory
page and paste back the `nhi-…` client id. On save the service performs a **real
exchange**, so a misconfiguration surfaces at configuration time rather than inside the
first run.

This is explicitly a first draft. Later, the UI becomes a facilitator and API
aggregator: it drives both sides of the enrollment and keeps the two definitions — the
autonomous agent here, the NHI record in simple-directory — coherent, including
detecting drift when one is edited without the other. Not a P0 task, but the P0 data
model should not make it harder: storing `nhi.clientId` plus the issuer and subject this
service derives is enough to diff the two records later.

### Sessions

`POST /api/auth/nhi-token` caps a session at `min(assertion.exp, now + 30m)`, so a
120-second assertion buys a 120-second session. nhi-proxy wants that short window
because a browser it drives holds the cookie directly; here the cookie never leaves the
process. So the **assertion TTL is configurable with a 300 s default**, cutting
exchanges roughly fifteen-fold against nhi-proxy's posture at a cost bounded by the
assertion never leaving the process.

**The exchange goes to `privateDirectoryUrl`, but declares the public origin.** It is a
server-to-server call, so no reverse proxy sets the `x-forwarded-*` headers — and the
route needs three of them or it fails outright:

- `x-forwarded-for` — `reqIp(req)` runs *before any lookup*, so a missing value rejects
  every caller identically rather than leaking an oracle. It feeds the rate limiter.
  We declare a fixed `127.0.0.1`: its only effects are the per-IP rate-limit bucket
  (shared by every agent regardless, since they share one egress) and the audit log line.
- `x-forwarded-host` — resolves the site (the main site resolves to `undefined`, which
  skips the site-ownership check) and, through `reqSiteUrl`, **is the audience**.
- `x-forwarded-proto` — `reqOrigin` throws without it.

So the audience is not discovered but *declared*: the signed audience is the stored
`nhi.siteUrl`, which is exactly `reqOrigin + reqSitePath` as simple-directory
recomputes it from the `x-forwarded-*` headers above and the path segment the exchange
call preserves ahead of `/simple-directory/...` (`nhiExchangeUrl`, posting to
`{privateDirectoryUrl}{sitePath}/simple-directory/api/auth/nhi-token`). `reqSitePath` is
empty for the main site and non-empty for a path-prefixed one — the same declared
headers reconstruct either audience correctly, which is why a path-prefixed site works.

**Do not set `allowedIps` or `ipBinding` on an autonomous agent's NHI.** Both key off the
address we declare rather than a real client address, so an operator configuring them
against a pod IP would break either the exchange or the session it issues.

Operational consequence worth sizing for: the exchange endpoint is rate-limited **per
`client_id` and per caller IP, consuming a point on success too**. A deployment running
many autonomous agents behind one egress IP needs simple-directory's `authRateLimit`
sized accordingly.

An autonomous agent whose catalog entries are all `auth: 'none'` still requires a valid
NHI, because the NHI link is enforced unconditionally. The identity is then purely an
audit and quota anchor rather than a credential. If that friction shows up in practice,
relaxing it is a one-line policy change — but it is not relaxed here.

### Transport

`StreamableHTTPClientTransport` from `@modelcontextprotocol/sdk`. For a catalog entry
with `auth: 'nhi-session'`, it injects the `Cookie` header captured from the exchange's
`Set-Cookie`.

**Not** a Bearer token: `@data-fair/lib-express`'s `session.js` reads sessions from
cookies only (`id_token` / `id_token_sign`) and parses no `Authorization` header
anywhere in the package. This is why nhi-proxy relays `Set-Cookie` to its client, and
the same constraint applies here.

A per-agent cookie jar refreshes at ~80 % of expiry and on any 401, and is acquired
lazily — an autonomous agent using only `none` / `apiKey` servers never performs an
exchange during a run. Tools are listed at run start and wrapped as AI SDK tools,
reusing the wrapper shape of `FrameClientAggregator` — including
`formatMcpToolResult`'s media-envelope handling, which the gateway already knows how to
rebuild.

## Traces and retention

"Exhaustive traces" splits into two stores with different rules, and conflating them
would import a consent model that does not apply here.

**Conversation content is product data.** `messages` is the
conversation — stored because storing it *is* the feature, visible to every instructor
by design, and not consent-gated. The UI must say so plainly where a user types: this
thread is shared with everyone allowed to instruct this autonomous agent, and retained.

**LLM request traces reuse the existing layer.** Each physical model request is written
to `trace-requests` by the same `recordTraceRequest` path the gateway uses, with
`conversation.id` set to the autonomous agent conversation id, a `contextKind`
identifying the run, and `userId`/`userName` taken from the message's `author`. Two
deliberate differences from the in-page assistant:

- **Storage follows the org's `storeTraces` flag alone.** The per-user
  `x-trace-consent` gate does not apply: there is no browser session to hold a consent
  cookie, and in P2 there will be no user at all. The org, as data controller, decides.
- Retention stays the existing fixed 30-day TTL. `messages` has **no**
  TTL — a conversation persists until deleted, which is what makes it a conversation
  rather than a trace.

Admin review reuses the existing trace routes and `reconstructTrace()` unchanged.

## Data lifecycle and erasure

Deferred to its own spec, but named here because P0's data model decides whether it is
implementable at all.

**What P0 must get right now**, and does:

- every message carries `author.userId`, so a user's contributions are addressable;
- conversations, messages and runs all carry `conversationId` / `agentId` /
  `owner`, so a cascade delete is a small set of indexed queries;
- deleting a thread deletes its messages and its runs; the existing per-conversation and
  per-user `trace-requests` deletion routes already cover the trace side.

**What the later spec must decide**, and P0 deliberately does not:

- **Erasing one user's messages from a shared thread leaves holes.** The assistant turns
  that answered them remain and may quote them. Tombstone with attribution removed, hard
  delete, or cascade to derived assistant turns — each has a different cost to the
  conversation's readability and to the completeness of the erasure.
- **Configurable retention per org** for conversations, against today's fixed 30-day
  trace TTL.
- **What "user deleted" means** when the deletion event arrives from simple-directory:
  whether it erases content, anonymises attribution, or only revokes access. The events
  queue (`eventsQueue`, already wired in `server.ts`) is the plausible trigger.

Nothing here blocks P0, and none of it should be improvised inside P0.

## Safety model

**Three trust levels, explicit in the prompt structure:**

1. *Persona and policy* — org-admin authored, system role. Trusted for behavior, and
   structurally unable to widen reach: which identity and which servers an autonomous
   agent uses are configuration, not prompt.
2. *User messages* — semi-trusted. Authors are on the instruct-list, but the timeline is
   shared, so one instructor's paste reaches everyone's turn.
3. *Tool results* — always untrusted. Wrapped in a provenance envelope naming the server
   and tool, with a standing instruction that their content is data and never
   instruction. The repo already uses this shape in `wrapHiddenContext`.

**The tool set is frozen at run start.** Nothing a tool returns can add a tool;
exploration mode promotes only from the statically configured catalog. This is the most
effective structural defense available here and it is free, because the configuration
model already implies it.

**Annotations are recorded, the gate is built and open.** Every tool call records its
MCP annotations (`readOnlyHint` / `destructiveHint`, which openapi-mcp emits, defaulting
from the HTTP verb) into the run and the trace, so the write surface is queryable from
day one. The approval gate is a policy hook keyed on those annotation classes
(`allow | approve | deny`) that **ships set to `allow`** — plumbing present, gate open,
so enabling it in P1 is configuration rather than surgery.

**Egress is bounded by the global catalog**, not by an application-level URL allowlist:
an org admin can only select endpoints ops has already published. Network-level controls
remain available at deployment for defence in depth.

### Security posture

Two properties hold structurally and are worth stating as invariants:

- **An org admin cannot give an autonomous agent reach beyond their own organization.**
  NHIs are managed through simple-directory's org-scoped endpoints, are bound to exactly
  one organization, can never be an admin, and can never be an impersonation target. The
  ceiling is enforced by simple-directory, not by policy in this service.
- **Secrets never enter model context.** The signing key and any catalog `apiKey` come
  from the environment; assertions and session cookies live in the transport layer and
  appear in no message, no tool argument and no stored trace.

Two things this design does **not** do, stated plainly so P1 starts from an accurate
picture:

- **One signing key covers every autonomous agent on the deployment.** A compromise of
  it can mint an assertion for any subject, and therefore impersonate every autonomous
  agent in every org on that deployment — simple-directory's per-NHI issuer binding,
  which exists precisely to stop one provider vouching for another org's identity, stops
  helping. This was chosen deliberately over a per-agent keypair for operational
  simplicity; the mitigation is that the key lives in the secret store and never in
  Mongo.
- **With writes enabled, a prompt injection in tool output can cause a write the NHI is
  permitted to make**, and any instructor can plant content into everyone's context.
  P0's defenses are scope, observability and reversibility — not prevention. Raising that
  is P1's job.

## Configuration ownership and rollout gating

One document, one owner. `PUT /api/autonomous-agents/:id` is gated by
`assertAccountRole(session, owner, 'admin')`.

Progressive exposure is a **deployment-level config flag** that additionally requires
admin mode on the autonomous agent write routes, defaulting to on. Flipping it off opens
configuration to org admins with no code change, no schema change and no migration. It
is a rollout control, not an ownership boundary: nothing in the autonomous agent
document is durably superadmin-owned.

The MCP server catalog is the one genuinely ops-owned piece, and it is env config rather
than a document, so it sits outside this gate entirely.

## UI

The render layer is already decoupled from the loop: `AgentChatMessages.vue`,
`MarkdownContent.vue` and `AgentChatInput.vue` are presentational, taking
`ChatMessage[]` and emitting. The only thing tying them to browser orchestration is that
`ChatMessage` is declared inside `use-agent-chat.ts`. Moving that type to `shared/` lets
those components render autonomous agent conversations **unchanged**.

Not reusable: `useAgentChat` and the `lib-vuetify` chat entry points, because they *are*
the browser loop. In their place,
`useConversation(conversationId)` — fetch a page of
`messages`, subscribe through `useWS`, apply deltas with the seq-gap
refetch, expose `messages` / `running` / `send()` / `abort()`. No AI SDK in the browser
at all: roughly 150 lines against the current 1300.

Pages: an autonomous agent list, an autonomous agent page (thread list + messages +
input), and configuration as a vjsf form generated from
`api/types/autonomous-agent/schema.js`.

## Testing

Per the project's three Playwright projects:

- **unit** — assertion construction, cookie-jar expiry, seq-gap detection,
  `messages` → `ChatMessage` mapping, catalog reference validation,
  per-`auth`-mode header selection, tool annotation classification, provenance wrapping,
  prompt assembly.
- **api** — org-admin authorization and the rollout gate, instructor authorization,
  rejection of an unknown `serverId`, conversation and message endpoints, run lifecycle
  and serialization under concurrent posts, budget enforcement, quota refusal, NHI
  exchange against dev simple-directory.
- **e2e** — create and configure an autonomous agent, send a message, watch a streamed
  reply, **two browsers on one shared thread**, and abort.

`api/src/models/mock-model.ts` already exists for deterministic loop behavior, including
the `loop forever` seam the guard tests use. A small in-process MCP server serves as the
tool fixture, registered through a test-only catalog entry.

## Delivery order

Each step independently verifiable:

1. Extract the loop modules and `ChatMessage` into `shared/` — pure refactor, existing
   tests must stay green.
2. `MCP_SERVERS` catalog: config schema, boot validation, catalog endpoint.
3. Autonomous agent schema, CRUD, authorization, rollout gate, generated form with the
   catalog-backed picker.
4. NHI issuer routes, assertion, exchange, cookie jar — testable standalone against dev
   simple-directory.
5. MCP client, per-`auth`-mode credential injection, tool wrapping.
6. Conversation / message / run storage, executor, per-conversation lock, budgets.
7. Websocket server wiring, emitter, client composable.
8. UI pages.
9. Traces and credits integration.

## Prerequisites

Confirm before step 4 rather than discovering them mid-implementation:

- dev simple-directory must run with **`manageNhis` enabled** (defaults to `false`);
- the dev nginx must proxy the websocket upgrade — this repo has no websocket server
  today;
- `@modelcontextprotocol/sdk` moves from a root devDependency to an `api` dependency;
- at least one real MCP server reachable from the dev stack to populate `MCP_SERVERS`.

## Assumptions to revisit

- **The shared `ws-messages` capped collection is adequate.** Revisit if sustained
  concurrency passes roughly 50 simultaneous runs per deployment, or if
  `CappedPositionLost` appears in logs. The fix would be a dedicated capped collection,
  which means changing `initMessagesCollection` in `@data-fair/lib-node` — acceptable,
  but not justified by current numbers.
- **In-process, non-resumable runs are adequate.** Revisit when scheduled runs (P2) make
  restart-during-run common enough that `interrupted` is a nuisance rather than a note.
- **300 s assertion TTL.** Revisit if simple-directory's `authRateLimit` proves to be the
  binding constraint, or if the threat model changes.
- **A global-only MCP catalog is sufficient.** Revisit if org admins need endpoints ops
  will not publish; per-agent URLs would reintroduce the egress question the catalog
  currently answers.
