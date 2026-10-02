# Autonomous agents

An **autonomous agent** is an org-owned, configured agent that runs its own turns **on the server**,
against MCP tools it reaches as its own identity, on a conversation several people share.

It was once the one part of this service that held server-side conversation state. The loop moved to
the server for every agent, so a configured autonomous agent and the in-page chat now run the same
executor over the same collections; what still distinguishes an autonomous agent is WHO it acts as (its
own non-human identity rather than the person's session) and that it is configured rather than
standard.

## What it is made of

| Collection | Holds |
| --- | --- |
| `autonomous-agents` | the configuration: persona, instructions, MCP server selection, instructors, NHI enrolment, `enabled` |
| `conversations` | one shared thread per agent: title, `messageSeq`, `version`, the cached compaction recap |
| `messages` | the turns, as ordered `UIMessage` parts — **the conversation of record** |
| `runs` | one document per turn: status, stop reason, steps, credits |

Code: `api/src/autonomous-agents/` (configuration, identity, tool diagnostics) and
`api/src/conversations/` (conversations, messages, runs, the executor).

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
  **updated in place**, which is how a client sees the assistant's answer being filled in. `seq` alone
  can only reveal new messages.
- Reads are validated against the library's own `safeValidateUIMessages` before anything is replayed,
  because the stored `parts` schema is deliberately loose — the state machine belongs to the library.

Context growth is handled by one policy shared with the browser loop: see
[Context management](./context-management.md).

## A run, and its two invariants

`POST .../:conversationId/messages` appends the instructor's turn and starts a run. The executor holds a
lock keyed on the **conversation**, because one conversation is one serialised timeline.

Two invariants hold for every path through the executor:

1. **A run always reaches a terminal status** — `done`, `error`, `aborted` or `interrupted`.
2. **A run always leaves exactly one assistant message.**

"Failure is a message, not a silence": a conversation that simply stops, or a turn that appears to think
for ever, is the failure mode this forbids. A refusal — disabled agent, missing enrolment, exhausted
credit cap — is still a message saying so.

Bounds on a turn, all enforced server-side: `STEP_LIMIT`, the repeated-call guard, a per-run credit
budget, the account credit cap, the whole-turn deadline, and `STREAM_IDLE_TIMEOUT_MS` as the AI SDK's
`timeout.chunkMs` (see [Loop guards](./loop-guards.md)).

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

Tools come from the operator's MCP catalog, never from the instructing user's page. Each result reaches
the model inside a provenance envelope naming the server and the tool — including a **failure**, whose
text is the tool's own words — so a tool cannot pass its output off as the system or the user.

## A shared timeline

Several people instruct one agent on one thread, so attribution is mandatory rather than decorative.

- Every message carries an `author`: a user (id and name) or the agent itself.
- A user turn is replayed to the model inside an envelope — `<message from="…" user-id="…">` — with both
  delimiters neutralised in the content and the attributes sanitised. An instructor pasting text that
  *looks* like another instructor's attribution cannot launder a request through it; a listed instructor
  may come from another account, so that would otherwise let lower trust act as higher.
- Who may instruct: admins of the owning organization, plus anyone in `instructors`. **Anyone listed
  borrows the agent's permissions**, which is the sentence that matters when adding someone.
- The same grant covers aborting a turn and erasing a thread: someone who can make the agent act can
  stop it and can erase what it did.

## Stopping and erasing

- **Abort** one turn: `POST /api/runs/.../:runId/abort`. In-process only — a run does
  not migrate, so the process holding it is the only one that can stop it — and `abort()` is a request,
  which is why the turn is also raced against its deadline.
- **Disable** the agent: every live turn of it is aborted and its cached session dropped, so a turn
  already inside the loop cannot keep acting with credentials obtained before it was disabled.
- **Delete** the agent: live turns stopped, then its conversations, messages and runs are erased.
- **Delete one thread**: `DELETE /api/conversations/:type/:id/:conversationId`.

There is **no TTL** on a conversation, deliberately. It is the conversation of record, so a timer that
silently destroyed it would take the audit trail with it. What it needs instead is someone who can erase
it — which is what the two delete routes are.

## Spend

The executor talks to providers directly rather than through the gateway, so it does its own accounting:
per-step credits against the per-run budget, the account credit cap checked before each step, and
`recordUsage` per model role — the summarizer's compaction call included, which is a real model call and
is billed like one.

Usage is keyed on the **agent**, not on whoever sent the last message: an autonomous agent is an
org-owned service identity, and scheduled runs will have no instructing user at all. Content attribution
stays per person, on each message's `author`.

## Where it is going

`docs/superpowers/specs/2026-09-22-autonomous-agents-p0-design.md` is the spine spec. Decided and
recorded since:

- the message model is the AI SDK's (`2026-09-30-adopt-the-ai-sdk-message-model-design.md`);
- context management is one tiered policy shared with the browser
  (`2026-09-30-tiered-context-management-design.md`);
- the two loops are **not** merged yet, and the reversal that would move every loop server-side was
  considered and rejected — with the conditions under which it becomes right
  (`2026-09-30-one-agent-loop-two-platforms-design.md`).
