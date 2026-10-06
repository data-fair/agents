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
turn would be at-least-once execution of real side effects.

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
- **Delete** the agent: live turns stopped, then its conversations, messages and runs are erased.
- **Delete one thread**: `DELETE /api/conversations/:type/:id/:conversationId`. A thread the person
  consented to having reviewed, still inside the review window, is **archived** rather than purged —
  see [conversation review](./conversation-review.md#retention-and-why-deleting-archives).

There is **no TTL** on a live conversation, deliberately. It is the conversation of record, so a timer
that silently destroyed it would take the audit trail with it. What it needs instead is someone who can
erase it — which is what the delete routes are. (Archived threads and abandoned anonymous threads are
swept by their own purges.)

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
- an approval gate for write tools is designed but not built (`2026-10-01-tool-approval-gate-design.md`).
