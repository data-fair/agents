# Autonomous agents

An **autonomous agent** is an org-owned, configured agent that runs its own turns **on the server**,
against MCP tools it reaches as its own identity, on conversations that each belong to one person.

It was once the one part of this service that held server-side conversation state. The loop moved to
the server for every agent, so a configured autonomous agent and the in-page chat's personal assistant
(two built-in agents, for the portal and the back office, `personalAgent()` in `api/src/agent-session/personal-agent.ts`) now run the same executor
(`api/src/conversations/executor.ts`: `runTurn` → `performTurn` → `runModelLoop` in `model-loop.ts`) over the same
collections. What still distinguishes an autonomous agent is WHO it acts as (its own non-human identity
rather than the person's forwarded session), WHO it bills as (itself rather than the person), and that
it is configured rather than built in.

The UI converges too: there is ONE chat window. `GET /api/conversations/:type/:id/agents` lists what
the caller may talk to — the back-office assistant when they may use it, plus the enabled configured agents they may
instruct — and `GET /api/conversations/:type/:id` (its `agentId` optional) feeds the history.
Front-office embeds stay mono-agent; the back office sets `agents` on the embeddable components and
gets the picker and history (see [Embedding](./embedding.md#back-office-mode-agents)). The standalone
thread page autonomous agents used to have is gone: it duplicated the chat on a second transport (HTTP
+ pub/sub), and driving turns through the chat's socket is what gives them the page's tools and the
lived activity/abort signal. The pub/sub change notifications went with it: nothing subscribed to them
any more, and the agent-session socket is now the service's only websocket endpoint.

## What it is made of

| Collection | Holds |
| --- | --- |
| `autonomous-agents` | the configuration: title, persona, instructions, MCP server selection, instructors, NHI enrolment, `enabled` |
| `conversations` | one thread, of one agent (`agentId`), for one person (`userId`): title, `messageSeq`, running `credits`, review consent, the cached compaction recap |
| `messages` | the turns, as ordered `UIMessage` parts — **the conversation of record** |
| `runs` | one document per turn: status, stop reason, steps, credits, the system prompt and per-call telemetry (`calls`) |

The three conversation collections are shared with every chat conversation, the personal assistant's included.

A configured agent is **always owned by an organization** (schema enum, and `assertOrganizationOwner`
on every route): its identity is an NHI, which simple-directory binds to exactly one organization, and
a user is always `admin` of their own personal account, so on a `user` owner `assertAccountRole` would
let anyone configure one.

Code: `api/src/autonomous-agents/` (configuration, identity, tool diagnostics),
`api/src/conversations/` (conversations, messages, runs, the executor and its turn gates) and
`api/src/agent-session/` (the socket the in-page chat drives turns through).

An agent may keep a memory, notes reused in every later conversation ([agent memory](./agent-memory.md)); its
conversations are audited, always readable by the owning organization's admins ([conversation review](./conversation-review.md)).

## The conversation is the record

A turn is stored as the AI SDK's `UIMessagePart[]` — text, reasoning, and one `dynamic-tool` part per
call carrying its arguments, its answer and its outcome. `convertToModelMessages` turns that back into
the exact model messages, so a conversation is **revivable**: a later turn replays what the model
actually saw, tool results included.

Consequences worth stating, because they are what the design buys and costs:

- A tool result is stored whole (bounded at `TOOL_RESULT_LIMIT`), so the store holds real payloads, not
  just prose about them. That is why erasure is a route rather than a timer (below).
- A failed call is the part's own `output-error` state, so nothing downstream can mistake it for a
  result.
- `seq` orders the timeline. The socket is the only live channel: the chat follows a turn over it and
  keys messages by `seq` (the assistant message is created pending and finalised at the same `seq`).
  `GET …/:conversationId/runs` is a plain full read; a transcript is read over the socket (the history
  sent on attach) or through review, and the tests read it through `/api/test-env`.
- The answer is **not written as it streams**. A watching browser gets every token, and a page that
  attaches mid-turn is served the answer so far from the in-process live-run registry (`live-runs.ts`). The store
  gets tool calls as they open and settle, and the text at the end of the turn: a restart mid-answer
  loses the text of the step in progress, not the work.
- One document per message, not per conversation: a conversation's length is unbounded and a document
  is capped at 16 MB, an append is one insert, and a read is a range scan on the unique
  `(conversationId, seq)` index — a duplicate `seq` is a write error, not a silently reordered thread.
  The stored document is a superset of `UIMessage`: `seq` and `conversationId` stay top-level because
  they are indexed.
- Reads are validated against the library's own `safeValidateUIMessages` before anything is replayed,
  because the stored `parts` schema is deliberately loose — the state machine belongs to the library.
  It is validated **without** `tools`, which would check historical inputs against today's tool
  schemas and invalidate every old conversation of a tool whose schema changed. A failure throws: a
  turn never proceeds on a partial history.
- `step-start` parts are stored and load-bearing: without them `convertToModelMessages` puts text
  written after a tool result inside the assistant message that made the call, ahead of its answer.
- Two subtractions apply to what is **sent**, never to the record, both provider constraints:
  reasoning is not replayed (it carries no signature, and providers reject reasoning they did not
  produce in this exchange), and a blank text part is dropped rather than sent empty.

Context growth is handled by one tiered policy: see [Context management](./context-management.md).

## A run, and its two invariants

A prompt over the chat's socket (the only way a turn begins) appends
the person's turn and starts a run. The executor holds a lock keyed on the **conversation**, because one
conversation is one serialised timeline.

Two invariants hold for every path through the executor:

1. **A run always reaches a terminal status** — `done`, `error`, `aborted` or `interrupted`.
2. **A run always leaves exactly one assistant message.**

"Failure is a message, not a silence": a conversation that simply stops, or a turn that appears to think
for ever, is the failure mode this forbids. A refusal — disabled agent, missing enrolment, exhausted
quota or credit cap, a moderation block — is still a message saying so. The quota and moderation gates
(`api/src/conversations/turn-gates.ts`) run before any model call, so a refused turn costs nothing
beyond the moderation classifier (see [Moderation](./moderation.md)).

What the message says is not always what happened. A deliberate refusal (an `httpError`, 4xx, or 503)
keeps its words; an error that states its public part (`withPublicMessage`: which catalog server failed,
that the stored history cannot be replayed) says that part; any other failure — a provider's response body, an internal address, a database
error — is recorded whole on the run (`error`, read by administrators) and the message, the socket's
`turn-end` and `error` frames and so the model's next turn say only "an internal error, recorded for the
administrators" (`publicErrorDetail`). A quota's stop names a shared budget's numbers only to an admin,
mid-turn as at the gate (`quotaStopText`).

Bounds on a turn, all enforced server-side: `STEP_LIMIT`, the repeated-call guard, a per-run credit
budget, the account credit cap, the run's wall-clock deadline (`turnTimeoutSeconds`, 300 s, for a chat;
`taskTimeoutSeconds`, 1800 s, for a planned task's run — see [planned tasks](./planned-tasks.md#the-turn)), and the idle watchdog (`STREAM_IDLE_TIMEOUT_MS`,
paused while a tool runs — see [Loop guards](./loop-guards.md)).

### Recovery

A process that dies mid-turn leaves an orphan. One rule decides what happens to it:

```
has an assistant message -> it started, its tools may have fired -> interrupt
no assistant message     -> it died before doing anything        -> resume
```

**A deploy does not interrupt turns, within a grace period.** On SIGTERM (`stop`, `api/src/server.ts`;
the logic in `api/src/conversations/shutdown.ts`):

1. No new turn begins in this process (`stopAcceptingTurns`). A prompt, an approval decision or a task's
   run now is refused with a **503** saying to send it again, before anything is stored, so the decision
   card stays pending and the message is not half-recorded. The scheduler stops claiming slots, leaving
   them to another instance. A run queued for its conversation's lock but not begun is not started:
   it has no assistant message, so recovery resumes it elsewhere. A wake is not started either; the wait
   stays pending, and the person's next action or message answers it.
2. Sockets with no live turn are closed at once, and the others as soon as their turn ends. The chat
   reopens its socket on its own the next time it sends anything, so the person's next message reaches
   a healthy instance.
3. Live turns get `shutdownGraceSeconds` (default 90) to finish normally (`drainLiveRuns`). Those still
   running then are stopped with the cause `shutdown` ("the server restarted") and settled by their own
   process: an `aborted` run with its message closed, not an `interrupted` one, so a task run cut short
   by a deploy is neither notified nor counted toward its task's pause. Its slot is spent; the next one
   runs.

Only then are the events queue, the sockets, the HTTP server and Mongo closed. The grace is shorter
than either deadline on purpose: a deploy should not wait five minutes for one chat turn, let alone thirty
for one task run. So a task run longer than the grace is stopped by a deploy, recorded `shutdown` as above,
and its task runs again at its next slot. The pod's `terminationGracePeriodSeconds` must be at least
`shutdownGraceSeconds` plus 15 s (settling and closing), or the kubelet kills the process mid-drain and
recovery applies as below.

`recoverOwnerlessRuns` runs at boot and on a 30s interval. A started turn is **never** resumed: MCP
tools are not required to be idempotent and the operator catalog may contain writes, so re-running a
turn would be at-least-once execution of real side effects. Durable-execution platforms (Temporal,
Restate, DBOS) address the same hazard by recording step results so a replay skips completed steps,
and Restate's own documentation places exactly-once side effects on the receiving side (an idempotency
key); refusing to resume a started turn obtains the safety property with no new runtime. An interrupted run with trigger `approval`
also settles the approved calls it left without a result, "outcome is unknown" (see
[the approval gate](#the-approval-gate)).

## Identity: the agent acts as itself

An autonomous agent authenticates as a **non-human identity** in simple-directory, as an OAuth client:
it obtains `at+jwt` access tokens from simple-directory's token endpoint with the RFC 7523 JWT bearer
grant, and calls the stack with `Authorization: Bearer` (`api/src/nhi/`). Cookie sessions are for agents
that drive a browser (nhi-proxy); this service is an API client, so it authenticates like one. This service is the issuer, and the issuer url (with the site
it was reached on, `nhi.siteUrl`) is *captured* from the real proxied request rather than configured,
so it is always a url that demonstrably resolves here. It is captured on first enrolment, or when the
client id changes, and kept by later saves, so editing an agent from another of the organization's
sites does not move it.

- The subject is `autonomous-agent:<agent id>`, which is what binds one NHI to one agent.
- **One token per site.** For each site it acts on, the service asks for the resource
  `<site><MCP_PATH>/mcp` (RFC 8707; `mcpPath`, default `/mcp-server`, simple-directory's own `MCP_PATH`).
  simple-directory gives an MCP resource the audience `[<site>/mcp-server, <site>]`, so the one token covers
  every MCP server of the site and the site's own APIs (simple-directory, data-fair, the links tools return).
  The resource is derived from the site, not from a catalog entry's URL: entries are reached on private urls.
  No `scope` is requested: a token carries the identity's maximum scopes.
- **The issuer is the enrolment site.** The token endpoint exists only on issuer sites — an account's main
  site, or the platform's main site — so every token is asked there, with an assertion whose audience is that
  site, whatever site the token is for. An agent is enrolled from the issuer of its account's realm; enrolling
  anywhere else is refused with a message naming both possible causes (not an issuer, or
  `OAUTH_SERVER_ENABLED` off: either way the endpoint answers 404).
- **Realm.** simple-directory issues a token only for a resource in the issuer's realm (its
  `resolveAccountMainSite`): sites with no `authMode` or `onlyBackOffice` are the platform's realm,
  `onlyOtherSite` sites the realm of the site they name, any other site its own. The agent's *account sites*
  are the enrolment site plus the organization's sites in that realm (listed by simple-directory as the agent,
  cached for a minute — `listAccountSites`, `accountSites` in `api/src/sites/operations.ts`). The organization's
  sites in another realm are **unreachable**: the agent is anonymous there, as on a foreign site, and its
  security tab lists them; the service tells them apart from the listing (`authMode`, `authOnlyOtherSite`) rather
  than spending a token request known to fail. Elsewhere the agent is anonymous too. An agent that references no
  `nhi-session` catalog entry never lists its account nor asks for a token; if the listing fails, the turn
  degrades to the enrolment site alone. See [Hosts](./overview.md#hosts).
- Tokens are reused across turns until one nears its expiry — its own `expires_in`, renewed
  `SESSION_RENEW_MARGIN_SECONDS` (60 s) before (`sessionNeedsRenewal`) — and the MCP transport reads the
  current one on every request rather than fixing it when it connects (`connectMcpServer`), so a turn may run
  longer than a token lives: the lifetime bounds a credential, not a turn.
- Enrolment is driven from the admin UI, **client-side**: the browser calls simple-directory's NHI
  API with the admin's own session (`ui/src/composables/use-autonomous-agent-enrolment.ts`), taking
  the subject from `shared/autonomous-agent-identity.ts` and the issuer from this service's discovery
  document, so neither is restated. It happens **at creation**: the dialog asks for the organization
  role the identity gets (listed by simple-directory, default `user`), POSTs the agent, which stores
  that `role`, then enrols the NHI from it. If enrolment fails the agent exists without an identity,
  and its page offers a "Create the identity" retry. There is no "reuse an existing identity" path:
  an agent's identity is always the one created for it, so its subject can never be shared.
  The identity then follows the agent from the same place. On save, a changed title or role is
  PATCHed onto the NHI (`identityPatch`, `syncIdentity`), and deleting the agent
  removes the agent first, then its identity (best effort, a warning if the directory refuses): an
  identity whose subject names a deleted agent is inert, nothing signs for it, whereas the other order
  could leave a surviving agent with a dead identity. A failed enrolment (the PUT that attaches the
  identity is refused) deletes the identity it just created, so retries leave no orphans. A refusal from
  simple-directory (for instance on file storage) is shown as a persistent alert and the stored
  value diverges from the identity's: accepted, because the directory is the authority on an
  identity and this service only verifies one. This server never manages an identity; it verifies
  one, by a **real token request** whenever the enrolment changes, so a misconfiguration fails where an
  admin can see it rather than inside the first run.
- The token request is a server-to-server, form-encoded POST to `privateDirectoryUrl` that declares the
  `x-forwarded-*` headers no proxy sets (`tokenRequestHeaders`): the host is the enrolment site and so the
  assertion's audience, and the client address is a fixed `127.0.0.1`, which is why `allowedIps`/`ipBinding`
  must never be set on an agent's NHI (see [Configuration](./configuration.md#verifying-an-autonomous-agents-identity-and-tools)).
  Every service the agent reaches must read `at+jwt` bearers (`@data-fair/lib-express` ≥ 1.31, with the
  audience check ≥ 1.34): an older one sees the agent anonymous.
- **Token requests spend a budget all agents share** (`api/src/nhi/session-broker.ts`). simple-directory counts
  each one against `authRateLimit` (5 a minute) per caller IP and per client id, gives a success its
  point back when it ends and keeps a failure's; every exchange of this service declares the same address,
  so the in-flight exchanges and the recent failures of all agents of all organizations share one budget.
  So, per process: a token is reused across turns rather than requested per turn (it lives no longer for
  it); concurrent asks for one token share one request, and at most 2 run at once, the rest queued (planned
  tasks on the same schedule, the admin page's parallel reads); a refusal is not asked again for 5 minutes,
  the failure answered here with its reason — on every site for an identity failure (`invalid_grant`, 401,
  403: the NHI deleted, its client id changed, the agent out of its organization), on that site alone for any
  other (`invalid_target`, 404), so one refused portal never takes the home site down; a 429 waits and retries (3 times) rather than
  failing the turn. Saving, disabling or deleting the agent drops its sessions and its back-off. The
  limit is per process: N replicas run up to 2N at once.
- **The ceiling is simple-directory's, not ours.** An NHI belongs to exactly one organization, can
  never be an admin nor an impersonation target, so an org admin cannot give an agent reach beyond their
  organization. The catalog `apiKey`s come from the environment, the signing keys are ciphered in mongo, and assertions and
  tokens stay in the transport: no credential enters a prompt, a message or a run.
- **One signing key covers every agent of the deployment** — a known trade, chosen over a keypair per
  agent for operational simplicity: whoever holds it can mint an assertion for any subject. It is
  generated and rotated by the service itself, as simple-directory's own token keys are, and stored
  ciphered with `CIPHER_PASSWORD`: a mongo dump alone does not give it (see
  [Configuration](./configuration.md#no-signing-key-to-configure)).
- `GET .../:agentId/tools` and `.../session` are the diagnostics: they connect as the agent and report
  what it can actually reach. Never a credential in the response.

Credentialed MCP tools come only from the operator's catalog. An organization admin may add **anonymous** external MCP servers (see [MCP tools](./mcp-tools.md#external-mcp-servers)), under the same trust model as web access. When the person is
watching the turn through the chat's socket, `performTurn` also adds the tools their page registered
(`browserToolSet`) and `wait_for_user_action`; a turn nobody watches has none. Each result reaches
the model inside a provenance envelope naming the server and the tool — including a **failure**, whose
text is the tool's own words — so a tool cannot pass its output off as the system or the user.

## One person per conversation

A conversation is **one person's** thread (`conversation.userId`), never a timeline several people
write to. Why:

- **The loop is bound to a person's socket.** A turn runs for the page that prompted it, with that
  page's tools and host state, and the personal assistant acts with that person's own session; a second
  author would have their turn run with someone else's page and, for the personal assistant, someone
  else's credentials.
- **No in-band attribution to trust.** A shared thread must tell the model who wrote each turn, and
  that marker is text in the prompt, forgeable by the very authors it attributes (chat-template
  spoofing is a named attack class). It also makes every author's paste part of everyone's context.
  With one author there is nothing to attribute, and the system prompt has no clause asking the model
  to trust such a marker.
- **Consent and erasure stay whole.** Review consent is the person's, per thread
  ([conversation review](./conversation-review.md)), and erasing a person's words erases their
  threads, rather than leaving holes in a shared one whose remaining answers may quote them.

What it costs: nobody else watches a thread live. An organization's admins read a configured agent's
threads through review, and an agent reads its own past conversations through its self-knowledge tools.

- Who may **start** a conversation with a configured agent is still a grant (`canInstruct`): admins of
  the owning organization, anyone matched by `instructors`, and superadmins in admin mode. The list
  holds uniform **access refs** (lib-common-types) — a member by id or email, a partner organization,
  or a role/department of the owning organization — matched with `matchAccessRef`, the same rule as
  every other permission list in the stack. A member-by-id grant comes from any account; a ref that
  targets an organization matches the person's **active account**. **Anyone matched borrows the
  agent's permissions**, which is the sentence that matters when adding someone. The implicit
  owner-admin rule stays exact on department, so an admin of a department cannot instruct an org-root
  agent.
- Reading, prompting in, aborting a turn of, and erasing an existing thread is the owner's alone
  (`assertOwnsConversation`, and `resolveOwnConversation` when a socket binds to the thread); a
  superadmin in admin mode is the only exception. An org admin reads someone else's thread only
  through [conversation review](./conversation-review.md), which a configured agent's thread always
  allows, being audited.
- That grant is checked again on **every prompt** of a thread, not only when it starts
  (`startSessionTurn` runs `assertMayStartConversation`), as an approval re-checks `canInstruct`: an
  instructor removed from the list, or an agent disabled since, cannot keep driving the agent from a
  thread opened before. Their own transcript stays readable to them.
- The socket resolves who it speaks for once, from the cookie of its upgrade (a frame carries none), so
  it is **closed when that session token expires** (`sessionExpiresAt`, `api/src/agent-session/upgrade.ts`)
  — after the turn streaming to it, if any — and the chat reopens it with the cookie as it is now on its
  next frame. A role or a membership withdrawn in simple-directory thus reaches an open chat within the
  token's life (15 minutes by default), the bound every HTTP route of the stack has. The upgrade itself
  is refused (403) to a browser page of another site — its `Origin` must be the site the request came
  through, against cross-site websocket hijacking from a sibling under the same domain — and to a
  simple-directory pseudo session, which the stack confines to reading.

## Stopping and erasing

- **Abort** one turn: a conversation turn is stopped by the `abort` frame of its chat socket; a task run, which has no socket, by `POST /api/autonomous-agents/:type/:id/:agentId/runs/:runId/abort` (admin; 404 for a conversation run). A run does not migrate, so only the
  process holding it can abort its controller: the route aborts it at once when that is this process,
  and otherwise records `abortRequestedAt` on the still-`running` run, which the holding process reads
  within 2 s (every live turn polls its own run, `watchStopRequests` in `driveTurn`). It answers
  `{ aborted: true }` in both cases, `false` for a run that already ended. `abort()` is a request,
  which is why the turn is also raced against its deadline.
- **Disable** the agent: every live turn of it is aborted — on every instance, through the same
  `abortRequestedAt` mark (`abortReason: 'agent-stopped'`) — so a turn already inside the loop cannot
  keep acting with the session it obtained before the agent was disabled; its cached account-site
  listing is dropped too.
- **Delete** the agent: live turns stopped, then its memory (documents and version log), conversations, messages and runs are erased, as are its planned tasks and their task runs ([planned tasks](./planned-tasks.md)).
- **Delete one thread**: `DELETE /api/conversations/:type/:id/:conversationId`. A thread of a configured
  agent is audited, so it is always **archived** rather than purged, with no expiry: gone for the person,
  still reviewable by the organization's admins until the agent is deleted — see
  [conversation review](./conversation-review.md#retention-and-why-deleting-archives).
  Its files are deleted at once, archived or not: they are not review material ([Agent files](./agent-files.md#the-store)).

There is **no TTL** on a live conversation, deliberately. It is the conversation of record, so a timer
that silently destroyed it would take the audit trail with it. What it needs instead is someone who can
erase it — which is what the delete routes are. (Archived threads and abandoned anonymous threads are
swept by their own purges.)

## The turn and its target

`runModelLoop` (`api/src/conversations/model-loop.ts`) produces a turn's parts and knows nothing of conversations. Everything that makes those parts a conversation's goes through a `TurnTarget` (`api/src/conversations/turn-target.ts`); `conversationTarget(run, message, conversation)` is a chat's, and `taskTarget(run, task)` (`api/src/tasks/task-target.ts`) a planned task's. Both are driven by `driveTurn` (`executor.ts`), which owns the abort controller, telemetry, deadline and failure classification, whatever the turn is of. The conversation target:

- `session` and `messageSeq`: the page in front of the person as the turn started (its tools and host events; undefined is normal), and the message the turn writes (also the history bound recorded on its telemetry).
- `history`: the stored messages up to the turn's own, compacted within the budget, with the page's context (host events, the pending-wait reminder) folded into the last user message at call time and never persisted.
- `persist`: writes the turn's structure to its assistant message each time a call opens or settles. Streamed text is not written as it goes.
- `frames`: deltas, activity, the message so far and sub-agent frames, sent to whoever watches the conversation **now** (read at each send), not to the session the turn started with, so a reload or a second tab does not silence it.
- `settleEarlierCall`: the result of a call an earlier turn made, an approved call the SDK executed on replay, settled on its original part.
- `close` and `fail`: write the record and close the run. The answer so far is not the target's: `driveTurn` registers each live run (`api/src/conversations/live-runs.ts`) with its controller, its message seq and the parts the loop produces, so a page attaching mid-turn gets the answer on attach and the rest live (`liveTurnOf`), and a stopped or failing turn is settled from it (`livePartsOf`).

A task run's target is the other implementation: its record is the run itself (`prompt`, `parts`, `outcome`) and nobody watches it; see [planned tasks](./planned-tasks.md#the-turn). A task run starts when its slot comes due, when an admin runs it now, or when its trigger URL is called ([webhook triggers](./planned-tasks.md#webhook-triggers)).

The system prompt (`buildSystemPrompt`) states today's date, as Claude.ai and ChatGPT state theirs: a model's only other sense of "now" is its training cutoff, which puts "last week" or "this year's figures" in the wrong year. It gives the date without the time, so the prompt changes once a day rather than every turn. The date comes after every stable part, so the prefix a provider caches survives the day changing, and before the memory block, which can change several times a day. It names its zone: for a task run, the zone of the task's first schedule rule, so "today" means to the agent what it means to the scheduler that started the run (the target's `timeZone`); otherwise `DEFAULT_TIME_ZONE` (`shared/task-schedule.ts`), which is also the scheduler's own default.

## The service's own tools

`buildServiceTools` (`api/src/conversations/service-tools.ts`) is a registry of the service's own tools, each entry declaring when it applies (the surface and the agent) and how it is built. Entries:

- `wait_for_user_action`: only in a chat with someone watching (a session). Unwrapped: its result is the loop's own handover.
- `memory`: a configured agent with memory enabled (`memoryEnabledFor`), on every surface. Provenance server `agent-memory`.
- web readers (`api/src/web`): a configured agent with `web.enabled`, on every surface. Provenance server `agent-web`.
- files (`ls`, `read_file`, `write_file`; `api/src/files`): a configured agent, on every surface, when the deployment has a file store. Provenance server `agent-files`. See [Agent files](./agent-files.md).
- `read_skill`: whenever one of the turn's tool servers publishes skills or instructions, on every surface, the personal assistant included; read-only, with its own skill envelope instead of the tool-result one. Provenance server `agent-skills`. See [MCP tools](./mcp-tools.md#server-instructions-and-skills).
- self-knowledge (`get_my_configuration`, `list_my_runs`, `read_conversation`): a configured agent, on every surface, read-only; it reads all of the agent's past runs and conversations, whoever had them. Provenance server `agent-self`.
- planning (`plan_task`, `update_task`, `delete_task`): a configured agent in a chat an administrator started, each call approved by an administrator; see [planned tasks](./planned-tasks.md#self-knowledge-and-planning). Provenance server `agent-self`.
- `report_outcome`: the task surface only, how a planned task's run reports its outcome. Provenance server `agent-service`.

Service tools are added after the approval policy is applied, so they are outside the approval policy; one that needs a person says so itself (`needsApproval`, as the planning tools and `request_web_access` do). None can be displaced: `api/src/conversations/service-tool-names.ts` holds `SERVICE_TOOL_NAMES` and the pure `mayBePageTool`, so a page tool of such a name is not treated as a page tool, a catalog tool does not stand in for one, and a sub-agent configuration never reserves one.

## The approval gate

A tool call is classified from the MCP `annotations` its server declares (`api/src/conversations/approval-policy.ts`,
`classifyTool`): `destructiveHint` wins and makes it **destructive**, `readOnlyHint` makes it **readOnly**, and
an unannotated tool is a **write** — the safe reading of a tool that said nothing. Each autonomous agent carries
one `approvalLevel` (`shared/approval-policy.ts`, `approvalPolicyFor`); a read is never gated:

| level | readOnly | write | destructive |
|---|---|---|---|
| `write` | allow | approve | approve |
| `destructive` (default) | allow | allow | approve |
| `none` | allow | allow | allow |

Gating only what a server declares destructive keeps cards rare enough to be read rather than clicked
through, and an admin raises the level to `write` where it matters. It applies to
**catalog tools** only: the service's own tools and page tools are exempt.

The **personal assistant** has no level of its own but a fixed `write` (`personalAssistantTools`): every
catalog call that is not read-only asks, a write as much as a destructive one. It acts as the person, so a change
it makes is theirs; in the page the convention is that the assistant prepares and the person saves, and
approving each change keeps that convention for tools that save on the server. Its cards are therefore
expected to be rarer than a configured agent's would be at level `write`: data-fair's MCP (openapi-mcp)
marks every GET read-only. An anonymous visitor is offered reads only, as nobody signed in can decide. The
person deciding is the conversation's owner; for a configured agent the decider must also be allowed to
instruct it (`canInstruct`), since approving borrows its identity.

- No level removes a tool from the set the model sees; an unattended run drops the ones that need approval (below).
- `approve` **stops the turn**: the call is stored in the AI SDK's `approval-requested` state and the run ends
  with `stopReason: 'awaiting-approval'`. Nothing is held in memory; the pending call is simply the latest step
  of the conversation. It is the shape of the [`wait_for_user_action` handover](./host-events.md#wait_for_user_action):
  a turn ends with a call left open, and a button settles it in a new run.
- Approvals are **signed** by the AI SDK (`experimental_toolApprovalSecret` = the service `securityKey`), so a
  stored approval cannot be forged by editing a message.

Why this shape:

- **A suspended turn is a finished run.** A server-side turn cannot wait for a human: holding it open
  would hold the conversation's lock, burn the run deadline, die on a restart and turn a person's lunch
  break into an outage. Ending the run costs nothing, because the stored conversation is revivable, so
  the decision simply starts a new run that replays it; nothing is held, so an approval can wait for
  days (there is no expiry) and both run invariants hold unchanged.
- **An unannotated tool is a `write`**, not a fourth class: most hand-written MCP servers declare no
  annotations, and reading silence as read-only would leave the common case ungated.
- **The gate only subtracts.** Every call is still bounded by the identity it runs as: the gate can take a permission away, never grant one.

**The decision** is `{ approved, reason? }`, over the chat socket only (frame `{ type: 'approval', approvalId, approved,
reason? }`); there is no HTTP route for it. Only the person whose
conversation it is may decide — ownership (`resolveOwnConversation` on the socket) **and** the grant to instruct the agent (`assertCanInstruct`, checked in `decideAndContinue`), both apply —
and it is atomic: a second decision on the same approval is a `409`. So is a decision on a message **still being
written** (`pending`), with "the turn is still finishing": the AI SDK asks for an approval before the step's other
calls return, and the run's own last writes put the message's whole parts array back, which would restore the
request over the decision and erase who made it. The run sends the message closed (`pending: false`) only once
`finishRun` has written it, and the card is shown locked until then. `decideAndContinue` (`api/src/conversations/approvals.ts`) records it on the part, then starts a run with
trigger `approval` **only once no `approval-requested` part remains in the message**; while another call of the same
step is undecided it returns `{ pending: n }` instead of `{ runId }`. Two calls in one step are therefore decided
one by one and the model resumes once, after the last.

The `approval` run **replays** the conversation and the AI SDK executes the approved call, **settled on its original
part** — that is the double-execution guard: the call has exactly one part, and a part that holds a result is never
run again. A call the person rejected is stored `output-denied` and replays with its reason as its result. An approved call whose tool is gone on replay (removed, or filtered out of an unattended run) is denied by name and settled `output-error` on its own part ("this tool is no longer available"), never left open; a call whose level was relaxed since the request runs, because the person approved it and the policy now requires less. Moderation is **skipped** on an
approval run: there is no new user text, and the decision is not something to classify.

A run that does not reach the model must not leave an approved call without a result. `finishRun` settles them at the
end of every approval run still running, before the run's own message is closed (no decision on it is accepted while
it is pending), as "did not run" or "outcome is unknown" (`ApprovedCallsEnd`, `api/src/conversations/service.ts`):

- refused before the model (quota, credit cap, disabled agent...): "did not run: the turn was refused: <reason>";
- returned normally: "Approved, but it did not run" — certain, because the SDK executes approved calls before the first
  step and reports each one, so a call still `approval-responded` was never reached (its replay ended on another
  message, one posted before the run started);
- threw or timed out: "outcome is unknown" — an honest answer for a write that may or may not have happened — except
  for an `InvalidToolApprovalSignatureError`, thrown before anything executes (a secret rotated since the request),
  which is "did not run" again;
- interrupted by a restart: `recoverOwnerlessRuns` closes the run through `finishRun`, "outcome is unknown".

A stop, or a new message, aborts in-flight tools immediately (AI SDK 7): the remote side of an MCP call may still complete (`mcp-servers/client.ts` ignores the abort signal). That is why the stored `errorText` says the outcome is unknown rather than that the call failed, for an approved call ("Approved, but its outcome is unknown: …") and for an ordinary interrupted one (`INTERRUPTED_RESULTS.message`, "Its outcome is unknown: the call may have completed") alike (the approved case pinned by the `slow_lookup` case in `tests/features/autonomous-agents/approval-gate.api.spec.ts`).

Behind all of these, the replay itself (`storedTurnsToModelMessages`, `settleStrandedApproval`) sends an approved call
with no result **outside the last message** as an error ("outcome is unknown: no turn reported it") rather than bare:
the conversion keeps such a call, and a call with no result is a 400 from the provider on every later turn.

A **new message** from the person rejects every pending approval (`rejectPendingApprovals`, reason
`PENDING_APPROVAL_SUPERSEDED`, and it settles approved calls of a superseded step the same way). So does a **wake**:
when the model called `wait_for_user_action` and a gated tool in one step, the handover wins and the turn ends
`waiting` with the request beside it; the person acting on the page rejects it (`PENDING_APPROVAL_ACTED`) before the
wait is settled. Two guards keep this true: a turn answering a message (`user` run) rejects pending approvals again when it starts, so a rejection cannot be lost to the asking turn's last writes; and `decideAndContinue` settles a wait handed over in the same step as the gated call with `WAIT_SUPERSEDED_BY_DECISION`. A pending approval is therefore always the conversation's latest step, so no undecided call can be
compacted away or approved out of order, and the compaction policy needs no guard for it.

A **sub-agent worker** is never handed a tool needing approval (`partitionSubAgents`): its request would stop the
worker's own loop, where nobody can see or decide it. Such a tool is not reserved — it stays with the lead, where the
gate asks the person.

An approved call's result, settled on its original part by the next run, keeps `toolMetadata.truncated` when it was
cut at the result bound, beside `toolMetadata.decision`.

In the chat the call is an **approval card** (`ui/src/components/agent-chat/ApprovalCard.vue`): the tool, its server
and arguments, Approve and Reject with an optional reason. It is locked while the message asking is still pending
(`approvalLocked`, set by the mapper) and while the decision is sending (released on a chat error). Once decided the
card is gone: the call becomes an ordinary tool chip, and a rejection a "Declined: <tool>" chip. Who decided, and
when, is not shown in any UI; it is stored on the call (`toolMetadata.decision`) for audit, and is in the
conversation's export. The admin review page (`ui/src/components/ConversationReview.vue`) shows a card still
awaiting a decision read-only. While waiting, the activity
label reads "Awaiting your approval", with a static icon rather than a spinner, since nothing is running.

## The admin page

An agent is edited in ONE place: its page, `ui/src/pages/[type]/[id]/agents/[agentId].vue`, with configuration, tasks and history tabs (see [planned tasks](planned-tasks.md#the-admin-page)). The organization list (`ui/src/components/AutonomousAgentsSection.vue`) creates an agent, then opens its page, and links to it; it has no edit dialog.

## Spend

The executor talks to providers directly and does its own accounting: the quota/credit gate before the
turn, per-step credits against the per-run budget, the account credit cap re-checked between steps, and
every model call charged through one function, `chargeModelCall` (`api/src/usage/charge.ts`): it
prices the call (cache tokens included), records usage under its model role (with the untrusted pool)
and, when the call belongs to a run, adds it to the run's spend and telemetry — the moderation
classifier and the summarizer's compaction call included, which are real model calls and are billed
like one.

Who is billed is decided by `usageIdentityFor` (`api/src/conversations/operations.ts`). A configured
autonomous agent is keyed on the **agent** (`autonomous-agent:<id>`, role `admin`, so no per-profile
quota applies — the credit cap and per-run budget are its bounds): it is an org-owned service identity,
and a planned task's run has no instructing user at all. The personal assistant bills as the **person** using
it, with their effective role, so per-profile and untrusted-pool quotas apply to them.

## Where it is going

Planned and not built:

- **Skills**: procedures an agent defines for itself, beside its [memory](./agent-memory.md).
- **Data lifecycle**: retention configurable per organization (an archived thread of a configured agent
  is kept until the agent is deleted), and acting on simple-directory's user-deletion events (per-user
  erasure exists, but only as an admin route).
- **Per-agent quotas**: an agent is bounded by its organization's credit cap and the per-run budget,
  with no allowance of its own.
