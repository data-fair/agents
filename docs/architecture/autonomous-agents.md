# Autonomous agents

An **autonomous agent** is an org-owned, configured agent that runs its own turns **on the server**,
against MCP tools it reaches as its own identity, on conversations that each belong to one person.

It was once the one part of this service that held server-side conversation state. The loop moved to
the server for every agent, so a configured autonomous agent and the in-page chat's personal assistant
(a *standard* agent, `api/src/agent-session/standard-agents.ts`) now run the same executor
(`api/src/conversations/executor.ts`: `runTurn` → `performTurn` → `runModelLoop`) over the same
collections. What still distinguishes an autonomous agent is WHO it acts as (its own non-human identity
rather than the person's forwarded session), WHO it bills as (itself rather than the person), and that
it is configured rather than built in.

The UI converges too: there is ONE chat window. `GET /api/conversations/:type/:id/agents` lists what
the caller may talk to — the standard agents they may use plus the enabled configured agents they may
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
| `conversations` | one thread, of one agent (`agentId`), for one person (`userId`): title, `messageSeq`, `version`, running `credits`, review consent, the cached compaction recap |
| `messages` | the turns, as ordered `UIMessage` parts — **the conversation of record** |
| `runs` | one document per turn: status, stop reason, steps, credits, the system prompt and per-call telemetry (`calls`) |

The three conversation collections are shared with every chat conversation, standard agent included.

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
- `seq` orders the timeline and `version` is the incremental cursor: `?sinceVersion=` catches a message
  **updated in place** — the assistant message is created pending and finalised at the same `seq` —
  which `seq` alone cannot reveal. An API client polls it; the chat does not need to, since it follows
  the turn over its socket.
- The answer is **not written as it streams**. A watching browser gets every token, and a page that
  attaches mid-turn is served the answer so far from the executor's in-process `liveTurns`. The store
  gets tool calls as they open and settle, and the text at the end of the turn: a restart mid-answer
  loses the text of the step in progress, not the work.
- Reads are validated against the library's own `safeValidateUIMessages` before anything is replayed,
  because the stored `parts` schema is deliberately loose — the state machine belongs to the library.

Context growth is handled by one tiered policy: see [Context management](./context-management.md).

## A run, and its two invariants

`POST /api/conversations/:type/:id/:conversationId/messages` (or a prompt over the chat's socket) appends
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

Bounds on a turn, all enforced server-side: `STEP_LIMIT`, the repeated-call guard, a per-run credit
budget, the account credit cap, the whole-turn deadline, and the idle watchdog (`STREAM_IDLE_TIMEOUT_MS`,
paused while a tool runs — see [Loop guards](./loop-guards.md)).

### Recovery

A process that dies mid-turn leaves an orphan. One rule decides what happens to it:

```
has an assistant message -> it started, its tools may have fired -> interrupt
no assistant message     -> it died before doing anything        -> resume
```

`recoverOwnerlessRuns` runs at boot and on a 30s interval. A started turn is **never** resumed: MCP
tools are not required to be idempotent and the operator catalog may contain writes, so re-running a
turn would be at-least-once execution of real side effects. An interrupted run with trigger `approval`
also settles the approved calls it left without a result, "outcome is unknown" (see
[the approval gate](#the-approval-gate)).

## Identity: the agent acts as itself

An autonomous agent authenticates as a **non-human identity** in simple-directory, via an RFC 7523 JWT
bearer exchange (`api/src/nhi/`). This service is the issuer, and the issuer url is *captured* from the
real proxied request rather than configured, so it is always a url that demonstrably resolves here.

- The subject is `autonomous-agent:<agent id>`, which is what binds one NHI to one agent.
- Sessions are short-lived, non-refreshable and cached in-process; `assertSessionOutlivesRun` fails at
  boot if the assertion TTL could not outlive a whole run.
- Enrolment is verified by performing a **real exchange** at configuration time, so a misconfiguration
  fails where an admin can see it rather than inside the first run.
- `GET .../:agentId/tools` and `.../session` are the diagnostics: they connect as the agent and report
  what it can actually reach. Never a credential in the response.

MCP tools come from the operator's catalog, never from a URL the org side supplies. When the person is
watching the turn through the chat's socket, `performTurn` also adds the tools their page registered
(`browserToolSet`) and `wait_for_user_action`; a turn nobody watches has none. Each result reaches
the model inside a provenance envelope naming the server and the tool — including a **failure**, whose
text is the tool's own words — so a tool cannot pass its output off as the system or the user.

## One person per conversation

A conversation used to be a shared timeline that several instructors wrote to, with an attribution
envelope around each user turn. It is now **one person's** thread (`conversation.userId`), so the
envelope and the system-prompt clause that told the model to trust it were removed together.

- Who may **start** a conversation with a configured agent is still a grant (`canInstruct`): admins of
  the owning organization, anyone matched by `instructors`, and superadmins in admin mode. The list
  holds uniform **access refs** (lib-common-types) — a member by id or email, a partner organization,
  or a role/department of the owning organization — matched with `matchAccessRef`, the same rule as
  every other permission list in the stack. A member-by-id grant comes from any account; a ref that
  targets an organization matches the person's **active account**. **Anyone matched borrows the
  agent's permissions**, which is the sentence that matters when adding someone. The implicit
  owner-admin rule stays exact on department, so an admin of a department cannot instruct an org-root
  agent.
- Reading, posting to, aborting a turn of, and erasing an existing thread is the owner's alone
  (`assertOwnsConversation`); a superadmin in admin mode is the only exception. An org admin sees
  nothing by default — reading someone else's thread is [conversation review](./conversation-review.md),
  gated on consent.
- Every message still carries an `author`: a user (id and name) or the agent itself.

## Stopping and erasing

- **Abort** one turn: `POST /api/runs/:type/:id/:runId/abort`. In-process only — a run does
  not migrate, so the process holding it is the only one that can stop it — and `abort()` is a request,
  which is why the turn is also raced against its deadline.
- **Disable** the agent: every live turn of it is aborted and its cached session dropped, so a turn
  already inside the loop cannot keep acting with credentials obtained before it was disabled.
- **Delete** the agent: live turns stopped, then its memory (documents and version log), conversations, messages and runs are erased.
- **Delete one thread**: `DELETE /api/conversations/:type/:id/:conversationId`. A thread of a configured
  agent is audited, so it is always **archived** rather than purged, with no expiry: gone for the person,
  still reviewable by the organization's admins until the agent is deleted — see
  [conversation review](./conversation-review.md#retention-and-why-deleting-archives).

There is **no TTL** on a live conversation, deliberately. It is the conversation of record, so a timer
that silently destroyed it would take the audit trail with it. What it needs instead is someone who can
erase it — which is what the delete routes are. (Archived threads and abandoned anonymous threads are
swept by their own purges.)

## The turn and its target

`runModelLoop` (`api/src/conversations/executor.ts`) produces a turn's parts and knows nothing of conversations. Everything that makes those parts a conversation's goes through a `TurnTarget` (`api/src/conversations/turn-target.ts`); `conversationTarget(run, messageSeq, conversation)` is the one implementation today:

- `session` and `historyUpToSeq`: the page in front of the person as the turn started (its tools and host events; undefined is normal), and the history bound recorded on the turn's telemetry.
- `history`: the stored messages up to the turn's own, compacted within the budget, with the page's context (host events, the pending-wait reminder) folded into the last user message at call time and never persisted.
- `persist`: writes the turn's structure to its assistant message each time a call opens or settles. Streamed text is not written as it goes.
- `frames`: deltas, activity, the message so far and sub-agent frames, sent to whoever watches the conversation **now** (read at each send), not to the session the turn started with, so a reload or a second tab does not silence it.
- `settleEarlierCall`: the result of a call an earlier turn made, an approved call the SDK executed on replay, settled on its original part.
- `track`: exposes the answer so far in a registry (`liveTurnOf`, `liveParts`, `releaseLiveTurn`), so a page attaching mid-turn gets it on attach and the rest live, and a stopped or failing turn is settled from it.

Plan 3 adds a task-run target: its record is the run itself and nobody watches it.

## The service's own tools

`buildServiceTools` (`api/src/conversations/service-tools.ts`) is a registry of the service's own tools, each entry declaring when it applies (the surface and the agent) and how it is built. Two entries:

- `wait_for_user_action`: only in a chat with someone watching (a session). Unwrapped: its result is the loop's own handover.
- `memory`: a configured agent with memory enabled (`memoryEnabledFor`), on every surface. Provenance server `agent-memory`.

Service tools are added after the approval policy is applied, so they are outside the approval gate. None can be displaced: `api/src/conversations/service-tool-names.ts` holds `SERVICE_TOOL_NAMES` and the pure `mayBePageTool`, so a page tool of such a name is not treated as a page tool, a catalog tool does not stand in for one, and a sub-agent configuration never reserves one.

## The approval gate

A tool call is classified from the MCP `annotations` its server declares (`api/src/conversations/approval-policy.ts`,
`classifyTool`): `destructiveHint` wins and makes it **destructive**, `readOnlyHint` makes it **readOnly**, and
an unannotated tool is a **write** — the safe reading of a tool that said nothing. Each agent carries
`approvals`, one of `allow` / `approve` / `deny` per class; the defaults are `readOnly: 'allow'`,
`write: 'allow'` and `destructive: 'approve'`. It applies to the **catalog tools of configured autonomous
agents** only: a standard agent's browser tools and the service's own tools are exempt.

- `deny` **removes** the tool from the set the model sees, so it cannot be asked for.
- `approve` **stops the turn**: the call is stored in the AI SDK's `approval-requested` state and the run ends
  with `stopReason: 'awaiting-approval'`. Nothing is held in memory; the pending call is simply the latest step
  of the conversation.
- Approvals are **signed** by the AI SDK (`experimental_toolApprovalSecret` = the service `securityKey`), so a
  stored approval cannot be forged by editing a message.

**The decision** is `{ approved, reason? }`, over the chat socket (frame `{ type: 'approval', approvalId, approved,
reason? }`) or `POST /api/conversations/:type/:id/:conversationId/approvals/:approvalId`. Only the person whose
conversation it is may decide — ownership (`assertOwnsConversation` on the route, `resolveOwnConversation` on the
socket) **and** the grant to instruct the agent (`assertCanInstruct`, checked in `decideAndContinue`), both apply —
and it is atomic: a second decision on the same approval is a `409`. So is a decision on a message **still being
written** (`pending`), with "the turn is still finishing": the AI SDK asks for an approval before the step's other
calls return, and the run's own last writes put the message's whole parts array back, which would restore the
request over the decision and erase who made it. The run sends the message closed (`pending: false`) only once
`finishTurn` has written it, and the card is shown locked until then. `decideAndContinue` (`api/src/conversations/approvals.ts`) records it on the part, then starts a run with
trigger `approval` **only once no `approval-requested` part remains in the message**; while another call of the same
step is undecided it returns `{ pending: n }` instead of `{ runId }`. Two calls in one step are therefore decided
one by one and the model resumes once, after the last.

The `approval` run **replays** the conversation and the AI SDK executes the approved call, **settled on its original
part** — that is the double-execution guard: the call has exactly one part, and a part that holds a result is never
run again. A call the person rejected is stored `output-denied` and replays with its reason as its result. An approved call the SDK refuses to run on replay — its class was set to `deny`, or to `allow`, since the request — is settled `output-error` on its own part ("this tool is no longer available", or that the policy changed), never left open. Moderation is **skipped** on an
approval run: there is no new user text, and the decision is not something to classify.

A run that does not reach the model must not leave an approved call without a result. `settleApprovedWithoutRunning`
runs at the end of every approval run, on messages before the run's own:

- refused before the model (quota, credit cap, disabled agent...): "Approved, but the turn could not run: <reason>";
- returned normally: "Approved, but it did not run" — certain, because the SDK executes approved calls before the first
  step and reports each one, so a call still `approval-responded` was never reached (its replay ended on another
  message, one posted before the run started);
- threw or timed out: "outcome is unknown" — an honest answer for a write that may or may not have happened — except
  for an `InvalidToolApprovalSignatureError`, thrown before anything executes (a secret rotated since the request),
  which is "did not run" again;
- interrupted by a restart: `recoverOwnerlessRuns` applies the same rule, "outcome is unknown".

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
when, is not shown in the chat; it is stored on the part (`toolMetadata.decision`) for audit, and read by the admin
history (plan 5). While waiting, the activity
label reads "Awaiting your approval", with a static icon rather than a spinner, since nothing is running.

## Spend

The executor talks to providers directly and does its own accounting: the quota/credit gate before the
turn, per-step credits against the per-run budget, the account credit cap re-checked between steps, and
`recordUsage` per model role — the moderation classifier and the summarizer's compaction call included,
which are real model calls and are billed like one.

Who is billed is decided by `usageIdentityFor` (`api/src/conversations/operations.ts`). A configured
autonomous agent is keyed on the **agent** (`autonomous-agent:<id>`, role `admin`, so no per-profile
quota applies — the credit cap and per-run budget are its bounds): it is an org-owned service identity,
and scheduled runs will have no instructing user at all. A standard agent bills as the **person** using
it, with their effective role, so per-profile and untrusted-pool quotas apply to them.

## Where it is going

`docs/superpowers/specs/2026-09-22-autonomous-agents-p0-design.md` is the spine spec. Decided and
recorded since:

- the message model is the AI SDK's (`2026-09-30-adopt-the-ai-sdk-message-model-design.md`);
- context management is one tiered policy (`2026-09-30-tiered-context-management-design.md`);
- the browser loop was removed and every agent now runs on the one server loop, one person per
  conversation (`2026-10-01-one-server-loop-prototype-design.md`, which reverses the earlier
  `2026-09-30-one-agent-loop-two-platforms-design.md`);
- the approval gate for write tools is built (`2026-10-01-tool-approval-gate-design.md`, with the changes recorded in `2026-10-07-autonomous-agent-planned-execution-design.md`).
