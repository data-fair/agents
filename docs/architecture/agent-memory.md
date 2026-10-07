# Agent memory

A configured autonomous agent may keep a **memory**: markdown documents it wrote in earlier conversations, shown to it at the start of every later run and shared by everyone who instructs it. It is opt-in per agent (`memory.enabled` on the agent, see `api/types/autonomous-agent/schema.js`) and exists only for configured agents: `memoryEnabledFor` (`api/src/memory/operations.ts`) requires an audited agent id, so the personal assistant, which acts as the person, remembers nothing. Because one instructor's words can shape every later run, memory is agent-wide and **audited**: every change is attributed and versioned, administrators can read, edit, restore and redact it, and the conversations it is learnt from are never private (below). Memory is data, not instructions: the prompt clause says it may be wrong and that the agent's instructions always take precedence.

One store per agent, `agent:<agentId>` (`agentStoreId`), in two collections: `agentMemories` (the live documents) and `agentMemoryVersions` (the append-only log).

## The tool and its limits

One provider-neutral tool, `memory`, with the commands of Anthropic's memory tool so trained models behave: `view` (no path lists the documents; a path reads one with line numbers and an optional `view_range`), `create` (creates or overwrites a whole document), `str_replace` (the old text must occur exactly once), `insert`, `delete` and `rename`. Paths are markdown (`MEMORY.md`, `topics/datasets.md`; a leading `/memories/` is accepted). `MEMORY.md` is the core document: always rendered in the system prompt, cannot be deleted or renamed. Every other document appears in the prompt as an index line (path, description, update day) and is read with `view`.

| Limit | Value |
| --- | --- |
| `MEMORY.md` | 4,000 characters |
| any other document | 12,000 characters |
| documents | 40 |
| total | 150,000 characters |
| description | 200 characters, one line |
| path | 120 characters |
| one `view` | 16,000 characters (truncated, with a hint to use `view_range`) |

A write over a cap is **refused**, never truncated, with the cap and what to do (consolidate, then retry). From 80% of the document or total cap the prompt block asks the agent to consolidate. Text with invisible or control characters (zero-width, bidi, tag characters) is refused. Everything a command can decide is decided in the pure `applyMemoryCommand`, against the store as it would be after the change.

Wiring (`api/src/conversations/executor.ts`):

- **Frozen at run start.** The store is read once; the block rendered by `renderMemoryBlock` is part of the system prompt, which is the run's stable prefix. Writes made during the turn land in the store at once and show in the prompt from the next run. Tags of the block's vocabulary inside a document are defused so it cannot forge the envelope.
- **Outside the approval gate.** The tool is added after `applyApprovalPolicy`: it writes only the agent's own audited store. Its annotations are explicit (`MEMORY_TOOL_ANNOTATIONS`) and recorded on the stored call, with provenance server `agent-memory`.
- **Cannot be displaced.** A catalog tool or a page tool named `memory` does not stand in for it (it is added last), a page tool of that name is not treated as a page tool, and a sub-agent configuration cannot reserve it (`api/src/agent-session/sub-agents.ts`), so it can be neither handed to a worker nor hidden from the lead.
- **Refusals are errors.** A refusal is thrown, so the call is stored `output-error` and the model is handed the reason.

## Writes and versions

`api/src/memory/service.ts`. Every write is a `MemoryChange` carrying `expectedVersion` (0 = the path must not exist) and is written under that **version precondition** (a unique `storeId`+`path` insert for a create, a `findOneAndUpdate` on `version` otherwise). A lost precondition returns false: the tool re-reads and re-decides once (so a `str_replace` whose text a concurrent writer removed fails honestly), then reports a conflict; the admin routes answer 409.

The **version row is written first**, carrying the version the document will get, and deleted again if the precondition is lost or the write throws. Without transactions, a phantom row is reconcilable against the document, a missing one is not. A rename is the one remaining non-transactional window: it inserts the new path then removes the old under its version; a crash between the two leaves both paths, with the log row present.

Each row records the op (`create`, `update`, `delete`, `rename`, `restore`), the content and description, and the author: the agent (run, conversation, tool call), a reflection (conversation and message range), or a user.

- **Restore** writes a logged version's content again as a NEW version (history is never rewound), through `restoreChange`, under the same limits as any write: an old version may exceed caps tightened since. A redacted version cannot be restored.
- **Redaction** is by **content**, not version number (`redactMemoryVersion`). It is refused while any live document of the store holds that exact text, and once only (an already-redacted row is refused). When allowed it blanks the content and the description of every row of the store carrying that identical text (renames and restores are copies), stamping who and when. Version numbers restart after a delete, so a number alone says nothing about which copies exist.

## Reflection

`api/src/memory/reflection.ts`. An out-of-loop pass reads the STORED conversation, which is complete and never rewritten, and updates memory through the same tool minus `delete` (a consolidator must not lose information), so its changes are versioned, attributed and restorable. The person never waits for it and nothing appears in the conversation.

| Trigger | When |
| --- | --- |
| after a turn | 20 or more unreflected messages; not on a handover nor when the turn awaits an approval |
| idle sweep | every 5 minutes (`api/src/server.ts`), threads idle for 30 minutes and no older than 7 days, 50 per pass, oldest activity first |
| manual | tests only |

The triggers are decided by the pure `reflectionDue`. Rules:

- **Reads up to before the first unsettled approval.** A call awaiting its approval or its approved execution is written later into the same message seq, so `reflectableMessages` stops before that message and `upToSeq` is the seq before it. A new message from the person rejects a pending approval, so this never stalls for long.
- **Re-checks the agent before each write**: it must still exist, be enabled and have memory on. Otherwise the pass is aborted and nothing is written, so a reflection in flight cannot write after the agent's delete cascade (a one-`findOne` window remains).
- **Deferral and backoff.** A pass that cannot proceed (account credit cap reached, or nothing readable because of an approval) stamps `memoryReflection.deferredAt`; a failure stamps `failedAt`. Both back the automatic triggers off for 60 minutes and are filtered out of the sweep. A completed pass clears them.
- **Cost.** One locked pass per conversation (`memory-reflection:<id>`), at most 6 steps, a 120 s timeout, a transcript of at most 60,000 characters (the most recent part is kept; tool results are clipped to 1,500; reasoning is left out; transcript tags are defused). It runs with the `tools` role model and is billed to the account under the agent's identity. Every completed step is billed, also when the pass fails or is withdrawn, and the total accumulates in `memoryReflection.credits` on the conversation.
- **Archived audited threads are reflected**: an audited thread is the organization's record whatever the person did with it in their own list.

## Admin surface

`/api/memory/:type/:id/:agentId` (`api/src/memory/router.ts`), for **administrators of the owning organization only**: an agent-wide memory can hold what other instructors said, so a plain instructor does not see it.

| Route | Purpose |
| --- | --- |
| `GET /` | enabled flag, limits, usage and the document list |
| `GET /document?path=` | one document |
| `PUT /document?path=` | write (body `description`, `content`, `version`), same limits |
| `DELETE /document?path=&version=` | delete |
| `GET /versions?path=&page=&size=` | paged history, newest first |
| `POST /versions/:versionId/restore` | restore |
| `POST /versions/:versionId/redact` | redact |

Writes also require the progressive-rollout session (`reqWriteSession`: admin mode while `autonomousAgentsRequireAdminMode` is on); reads do not. A refusal is a 400 with its reason, a lost precondition a 409. Deleting the agent erases its store first: memory is derived from the conversations and must not outlive them. The UI is `ui/src/components/AgentMemoryDialog.vue`, opened from the agent's section: documents with edit and delete, and a history tab with restore and redact.

## Audited conversations

Memory is learnt from conversations nobody has to consent to, so the review contract changed with it (details in [conversation review](./conversation-review.md)):

- A conversation with a **configured agent** is audited (`shared/agent-audit.ts`): always reviewable by the account's admins while it exists, whatever `storeTraces` says and with no consent. The person's delete **archives** it, with no expiry; it is removed only by the agent's deletion or a GDPR erasure.
- The **personal assistant** keeps the consent model: `storeTraces`, the person's consent, a 30-day window.

The filter is `reviewableFilter` (`api/src/review/reviewable.ts`).

Rationale, sources and the security notes: `docs/superpowers/plans/2026-10-07-agent-memory-architecture.md`.
