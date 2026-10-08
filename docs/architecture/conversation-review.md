# Conversation review

Every conversation runs on the server and is stored there, so reviewing one is a **read of the
conversation**, authorized rather than duplicated. This replaced a `trace-requests` collection that
kept a second copy of each exchange under its own TTL: the copy held the same content plus per-call
telemetry, and the telemetry now lives on the run (`runs.calls`, recorded for every turn whatever
the consent).

What review gives an admin: the exchange as the person saw it, the instructions the model was given,
and per-call provider/model/token/credit/duration figures. What it gives a superadmin on top: a
download of the whole thing as a file, for analysis by a standalone coding agent.

## Audited conversations

A conversation with a **configured** autonomous agent is never private (`shared/agent-audit.ts`,
`isAuditedAgentId`): such an agent is an organization's service, its memory is agent-wide, and the
organization answers for what it does. The consent model below belongs to the personal assistant only.

| Thread with | Reviewable by an org admin | Person's delete | Expires |
| --- | --- | --- | --- |
| a configured agent | always, whatever `storeTraces` says, no consent needed | archives (never purges) | never; removed by agent deletion or GDPR erasure |
| a standard agent (`personal`) | only with `storeTraces` + consent + inside the window | archives if consented and inside the window, else purges | 30 days after the last message once archived |

The review filter is `reviewableFilter` (`api/src/review/reviewable.ts`); the chat shows a
non-dismissible notice on an audited thread and never offers the consent sheet there.

## The personal assistant: two gates, both required

They are different questions, and each fails closed.

| Gate | Question | Default |
| --- | --- | --- |
| `settings.storeTraces` | does this **organization** want review capability at all | `false` |
| `conversation.consentedToReview` | did **this person** agree to this thread being read | absent = no |

`storeTraces` is an org-admin setting (`PUT /api/settings/:type/:id/org`) whose description states
the contract: *"conversations of consenting users with the personal assistant are stored on the server for 30 days for admin
review. Each user must explicitly accept. Conversations with autonomous agents are always reviewable and need no consent."* When it is on, the session advertises availability and
the chat asks the person once; their answer is a 1-year `agent-chat-trace-consent` cookie
(`ui/src/traces/trace-consent.ts`) — the browser's own memory of it. The server never reads the
cookie: the chat says the answer over the agent session (in its `hello`, and in a `trace-consent` frame
when it changes), and each turn records it as one flag on the thread. One flag, so the person can change their mind: withdrawing
consent hides a thread that was previously visible.

A person's access to **their own** thread is not this gate — they may always read what they said.

An **anonymous** visitor's thread (`conversation.anonymous`, created per socket) is never
reviewable: the consent sheet is not offered to them, and a consent left in the browser from a
signed-in visit is ignored. Such a thread lives as long as its socket — purged on close, and by
`purgeAbandonedAnonymous` (24h after its last update) when the close never ran.

## Retention, and why deleting archives

`api/src/retention.ts` holds one policy: 30 days, measured from the thread's `lastMessageAt` (the
same `RETENTION_SECONDS` is the TTL of `moderation-events`). It governs what happens when a person
**deletes** a thread; a thread they keep is their own history and is not expired.

Because the conversation **is** the review material, an unconditional delete would let anyone erase
a record their organization was entitled to review. So a person deleting a consented thread whose
`lastMessageAt` is still inside the window **archives** it (`archivedAt`): gone for them — hidden,
unreadable, not continuable — still visible to review until the window closes. An audited thread is archived on delete whatever its age, with no
expiry (the sweep only selects the personal assistant's threads). Any other delete
purges immediately. The review list surfaces `archivedAt` so an admin knows the thread is on its way
out.

Expiry is a **sweep** (`purgeExpiredArchives`, at boot and daily), not a TTL index, because messages
and runs are separate documents: a TTL deletes only the document it indexes and would leave them
orphaned and still readable by id. The sweep selects `expiredArchiveFilter` (archived **and**
`lastMessageAt` past the cutoff, so a late delete cannot extend visibility) and calls the same
`purgeConversation` an admin erasure calls, so the two cannot differ about what deletion removes.

GDPR erasure (`DELETE /api/review/:type/:id?userId=…`) includes archived threads deliberately: the
archive stops the person from erasing review material, it must not stop an admin acting on an
erasure request.

## The API

All routes are account-admin gated. `storeTraces` no longer gates them: it only decides whether the
personal assistant's consented threads are included. Threads of configured agents are audited and
always reviewable (`assertMayReview` no longer refuses).

| Route | What it does |
| --- | --- |
| `GET /api/review/:type/:id` | paginated, newest-first list of audited threads plus, with `storeTraces`, consented personal-assistant threads inside the window, each with a real preview of the first user message |
| `GET /api/review/:type/:id/:conversationId` | one thread: `{ conversation, messages, runs }` |
| `GET /api/review/:type/:id/:conversationId/export` | the same, as a JSONL file — **superadmin (admin mode) only** |
| `GET /api/review/conversation/:conversationId` | resolve which account a thread lives in, for a link that does not carry it |
| `DELETE /api/review/:type/:id/:conversationId` | purge one thread and everything hanging off it |
| `DELETE /api/review/:type/:id?userId=…` | per-user erasure; `userId` is required so it cannot silently erase the account |

A personal-assistant thread that exists but was not consented to answers **404, not 403**: an admin has no business
learning which of their members declined.

`GET /review/conversation/:id` is declared **before** `/:type/:id` and that is load-bearing — two
segments, so the param route would otherwise match it with `type: 'conversation'`.

## Viewing

- **Activity page** (`/:type/:id`) — the paginated list, with per-row delete and per-user erase.
- **Review page** (`/:type/:id/traces/:convId`, and a superadmin variant under `admin/`) —
  `ui/src/components/ConversationReview.vue`. It renders the thread through
  `AgentChatMessages`, the **same** renderer the chat uses, so a reviewer sees what the person saw
  rather than a second rendering that can drift. Read-only: no streaming, no activity, no composer.
  Above it, run telemetry chips (turns, model calls, credits, models used) and a detail toggle
  showing the system prompt and a per-call table.

This replaced about a thousand lines of reconstruction — `reconstruct-trace.ts`,
`session-recorder.ts` and a bespoke `TraceView` — all of which existed because the conversation was
not stored server-side. It had also quietly stopped working: the executor records a *reference* to
the history rather than the messages, so the reconstruction found none and the page rendered empty
entries. Its test passed because it asserted a type-chip label, which renders either way.

## The export

`api/src/review/operations.ts` turns one stored conversation into a single **JSON Lines** file,
`conversation-<id>.jsonl`. `.claude/skills/conversation-export/SKILL.md` explains how to read it; the
file also carries a `guide` field so it is usable without the skill.

Why one JSONL file rather than an archive:

- An export is routinely megabytes — one tool result is capped at 100k chars and a turn can hold
  several — so the format's only real job is to let a reader fetch the part it wants.
- What makes a large text file navigable is **line addressing**, and conversation content destroys
  it: markdown, code and pretty-printed JSON are all multi-line. JSONL restores it, because a
  newline inside a string is escaped — a 100k-char tool result is exactly one line, read with
  `sed -n '47p'`.
- That is also why the header can carry pointers: a pointer is a line number, and line numbers are
  stable because records are lines. **Line 1** is `meta` (counts, line map, the guide), **line 2**
  is `outline` — every record with its line, size and preview. Two lines read, and a reader knows
  what to read next.
- A part over `EXTRACT_THRESHOLD` is **lifted** into its own `blob` record, leaving a stub with
  `__ref` / `__bytes` / `__preview`. So the transcript stays small enough to read whole and each
  large tool result is one addressable line — the file-per-result idea, without the archive.
- Identical system prompts are stored once and referenced; for a long thread, repeating them would
  be most of the file.

A zip with an index was the alternative. It loses twice: there are no stored per-call HTTP bodies to
make files out of any more (what exists is the conversation, the runs' per-call telemetry and the
system prompt), and it needs a dependency or a hand-written zip writer to produce something an agent
must unpack before it can grep.

**What the export replaced.** A *trace evaluator*: an in-browser agent with its own model role, its
own tools over a client-side trace recorder, a GitHub proxy for reading the platform's own source as
ground truth, a dedicated billing account, and a two-pane compare mode. All of it existed to let
someone ask questions about a recorded conversation. A download plus a skill answers the same
questions with none of that surface, and with a far more capable agent than the platform could host.

## Debugging raw provider exchanges

Independent of review and of any consent: setting `DEBUG` on the API process logs raw LLM exchanges
through [`debug`](https://www.npmjs.com/package/debug), namespaced **per provider** so logging can be
restricted to one.

`agents:upstream:<type>:<id>` — the raw request to the provider (URL + body, **never headers**) and
the raw response (status + accumulated body). Emitted by `createDebugFetch`
(`api/src/models/debug-fetch.ts`), composed into `createModel` (`api/src/models/operations.ts`).
Living at that single chokepoint, it covers every model role **and** the moderator and summary
callers.

Standard `debug` patterns apply: one provider (`DEBUG=agents:upstream:openai:<id>`), one provider
type (`DEBUG=agents:upstream:openai:*`), everything (`DEBUG=agents:*`). When a namespace is disabled
the wrapper returns the base fetch unchanged, so there is no runtime cost unless the flag is set.
Bodies are logged **uncapped** — a developer diagnostic, not an audit trail.
