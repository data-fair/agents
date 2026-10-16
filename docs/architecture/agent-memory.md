# Agent memory

A configured autonomous agent may keep a **memory**: markdown documents it wrote in earlier runs, shown to it at the start of every later run and shared by everyone who instructs it. It is opt-in per agent (`memory.enabled` on the agent, see `api/types/autonomous-agent/schema.js`) and exists only for configured agents: `memoryEnabledFor` (`api/src/memory/operations.ts`) requires an audited agent id, so the personal assistant, which acts as the person, remembers nothing. Because one instructor's words can shape every later run, memory is agent-wide and **audited**: every change is attributed and versioned, whoever instructs the agent can read it, administrators edit, restore and redact it, and the conversations it is learnt from are never private (below). Memory is data, not instructions: the prompt clause says it may be wrong and that the agent's instructions always take precedence.

One store per agent, `agent:<agentId>` (`agentStoreId`), in two collections: `agent-memories` (the live documents) and `agent-memory-versions` (the append-only log).

## Design

Three ways of carrying knowledge across runs, each for its own kind of knowledge:

| | What it holds | Written by | Read |
| --- | --- | --- | --- |
| **The past itself** | every conversation and task run, verbatim | the service, as it runs | on demand, by the agent: `list_my_runs` and `read_conversation`, which reads the conversation export page by page ([self-knowledge](./planned-tasks.md#self-knowledge-and-planning)) |
| **Memory** | where information lives and how to get it, what did not work, corrections and preferences, durable facts | the agent, deliberately, during its runs | always: `MEMORY.md` in full and an index of the rest, in the system prompt |
| **Consolidation** | nothing of its own: a safety net that tidies memory and catches a "remember this" the agent missed | a daily per-agent pass | — |

- **The agent manages its memory itself — the main mechanism.** The `memory` tool is in every run of an agent with memory on, chat or task. In a conversation it writes on its own judgment or because an instructor asks ("remember that…", "forget…"), and can view, rewrite or delete documents; the change lands at once, attributed to that run and tool call. The prompt clause (`MEMORY_CLAUSE`) says what belongs there and, since the past is readable, that findings and task results do not: the next run reads the previous run instead. Observations about outside sources are dated and never extrapolated.
- **The past is read on demand, not pre-digested.** An agent has **one history**: it reads any of its past conversations, whoever had it, so it can answer "why did you do that yesterday?" from another person's conversation. That is why conversations with configured agents are audited and carry no consent (below).
- **No per-conversation extraction.** An earlier version reflected every conversation into memory (every 20 messages, at every task run's end, and on an idle sweep). In simulations memory then filled with one week's findings, including claims nobody observed; each pass cost a model call, wrote lines nobody decided on, and read tool results — including web pages, the path persistent memory-injection attacks take. It was replaced by consolidation.
- **Consolidation tidies; it reads no tool output.** Once a day after activity, a pass merges duplicates, resolves contradictions, dates or removes one-run findings, and records corrections or explicit "remember this" requests the agent missed — reading only what people wrote and what the agent answered. Content from outside the organization therefore reaches memory only through a write the agent made in a run, attributed to that tool call.
- **Plain text documents addressed by path, in MongoDB; no vectors, no graph.** In Letta's benchmark plain file tools beat Mem0's graph memory on LoCoMo (74.0% vs 68.5%, [Letta](https://www.letta.com/blog/benchmarking-ai-agent-memory)); Claude Code, Letta MemFS and Claude Managed Agents all keep memory as files. Text is what an administrator can audit, and vector retrieval is not justified at 150,000 characters per store.
- **Two tiers: a pinned core and an index.** `MEMORY.md` is always shown; other documents appear as generated index lines and are read on demand — the pattern of Claude Code, Letta's `system/` blocks and Managed Agents. The index is built from the documents, so unlike a hand-kept index it cannot drift from what exists.
- **Opt-in, off by default**, as in Codex (off by default) and Claude Code (a toggle): memory changes how an agent behaves over time, so an administrator chooses it.
- **The store is keyed on `storeId`, not the agent id**, and every author carries the `agentId`, so a store shared between agents later needs no change to the document or version shape.

### State of the art

What the main harnesses do, as of October 2026, and what was taken from each:

- **The model decides, during the session.** Claude Code's auto memory: "Claude doesn't save something every session. It decides what's worth remembering based on whether the information would be useful in a future conversation" ([Claude Code docs](https://code.claude.com/docs/en/memory)). Its four note types (user, feedback, project, reference) and "skips anything it can derive" are the model for `MEMORY_CLAUSE`. Same principle in Anthropic's memory tool ([docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)), ChatGPT's saved memories ([FAQ](https://help.openai.com/en/articles/8590148-memory-faq)), Letta's core memory and LangMem's "hot path" ([LangMem overview](https://deepwiki.com/langchain-ai/langmem)).
- **The past is searched or read on demand.** Claude.ai gives the model past-chat search and recent-chats tools, called when it judges it needs them ([Anthropic help](https://support.claude.com/en/articles/11817273)); Letta agents query their full history with `conversation_search` ([Letta docs](https://docs.letta.com/guides/agents/architectures/sleeptime)). Codex, by contrast, only injects generated memories ([Codex memories](https://learn.chatgpt.com/docs/customization/memories?surface=app)). We list and read rather than search: `list_my_runs` with dates answers "yesterday"; a search is added when a simulation shows listing is not enough. What is read is the conversation export, outline first and then only the records needed, the way Claude Code's consolidation reads transcripts narrowly rather than whole.
- **Background passes are batched and consolidate.** Claude.ai rebuilds a memory synthesis every 24 hours; Codex generates memories only from chats idle for hours and skips short ones; Letta runs "sleep-time" agents. Claude Code's Auto Dream — added because session notes decayed — merges duplicates, removes contradicted facts, turns relative dates into absolute ones and prunes the index, and searches transcripts narrowly for corrections and explicit save requests rather than re-extracting them (third-party reports: [implicator.ai](https://www.implicator.ai/anthropic-adds-auto-dream-to-claude-code-fixing-memory-decay-between-sessions), [claudefa.st](https://claudefa.st/blog/guide/mechanics/auto-dream)). Our consolidation follows that shape.
- **Generated memory is hard to audit.** Codex calls its memories "generated state" and advises against editing them by hand as the main control; Cursor moved from background-extracted memories to rules people write ([Cursor forum](https://forum.cursor.com/t/custom-modes-and-memories-gone-in-2-1/143744)). Keeping the agent's deliberate writes as the source keeps nearly every line traceable to a decision in a recorded run.
- **Memory is an injection target.** Instructions planted from a web page into ChatGPT's memory persisted into every later chat and exfiltrated them ([The Hacker News, 2024](https://thehackernews.com/2024/09/chatgpt-macos-flaw-couldve-enabled-long.html)). Hence: memory is rendered as data, invisible characters are refused, consolidation reads no tool output, and web access is warned against on agents with write tools ([web access](./web-access.md)).
- **A trained habit to counter.** When Anthropic's memory tool is enabled, its API adds a prompt asking the model to "record status / progress / thoughts" ([docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool#prompting-guidance)). Our tool reuses its commands so trained models use it well, and the clause says explicitly not to record progress or findings — which a simulation showed was needed.

## The tool and its limits

One provider-neutral tool, `memory`, with the commands of Anthropic's memory tool so trained models behave: `view` (no path lists the documents; a path reads one with line numbers and an optional `view_range`), `create` (creates or overwrites a whole document), `str_replace` (the old text must occur exactly once), `insert`, `delete` and `rename`. Paths are markdown (`MEMORY.md`, `topics/datasets.md`; a leading `/memories/` is accepted, since Anthropic-trained models use it): segments of `[A-Za-z0-9._-]`, no `.` or `..`, ending in `.md`. `MEMORY.md` is the core document: always rendered in the system prompt, cannot be deleted (only emptied) or renamed, and needs no description (it never appears as an index line). Every other document appears in the prompt as an index line (path, description, update day) and is read with `view`. Edits keep a document's description; `rename` never overwrites an existing path.

| Limit | Value | Why |
| --- | --- | --- |
| `MEMORY.md` | 4,000 characters | rendered in every run (Hermes pins 2.2k + 1.4k) |
| any other document | 12,000 characters | fits one `view` |
| documents | 40 | keeps the index readable |
| total | 150,000 characters | bounds the store and a poisoning's blast radius |
| description | 200 characters, one line | one index line |
| path | 120 characters | |
| one `view` | 16,000 characters (truncated, with a hint to use `view_range`) | |

The limits are global constants (`MEMORY_LIMITS`): nothing has asked for per-agent tuning. Store-wide caps (document count, total characters) are checked against a snapshot, so concurrent creates of different paths can overshoot them slightly; the next write is then refused until the agent consolidates. A write over a cap is **refused**, never truncated, with the cap and what to do (consolidate, then retry): silent truncation, losing facts without signal, is the failure users of capped memories report most; Claude Code and Hermes refuse too. From 80% of the document or total cap the prompt block asks the agent to consolidate. Text with invisible or control characters (zero-width, bidi, tag characters) is refused. Everything a command can decide is decided in the pure `applyMemoryCommand`, against the store as it would be after the change.

Wiring (the `memory` entry of the service-tool registry, `api/src/conversations/service-tools.ts`, run by `executor.ts`):

- **Frozen at run start**, as in Hermes. The store is read once; the block rendered by `renderMemoryBlock` is part of the system prompt, which is the run's stable prefix for caching across its steps, and is recorded on the run (`setRunSystemPrompt`), which answers "what memory did this run see?". Writes made during the turn land in the store at once and show in the prompt from the next run. The block carries days, not times, so the prefix stays stable for a whole day. Tags of the block's vocabulary inside a document are defused so it cannot forge the envelope.
- **Outside the approval gate.** The tool is added after `applyApprovalPolicy`: it writes only the agent's own audited store. Its annotations are explicit (`MEMORY_TOOL_ANNOTATIONS`) and recorded on the stored call, with provenance server `agent-memory`.
- **Cannot be displaced.** A catalog tool or a page tool named `memory` does not stand in for it (it is added last), a page tool of that name is not treated as a page tool, and a sub-agent configuration cannot reserve it (`api/src/agent-session/sub-agents.ts`), so it can be neither handed to a worker nor hidden from the lead.
- **Refusals are errors.** A refusal is thrown, so the call is stored `output-error` and the model is handed the reason.

## Writes and versions

`api/src/memory/service.ts`. Every write is a `MemoryChange` carrying `expectedVersion` (0 = the path must not exist) and is written under that **version precondition** (a unique `storeId`+`path` insert for a create, a `findOneAndUpdate` on `version` otherwise). A lost precondition returns false: the tool re-reads and re-decides once (so a `str_replace` whose text a concurrent writer removed fails honestly), then reports a conflict; the admin routes answer 409.

The **version row is written first**, carrying the version the document will get, and deleted again if the precondition is lost or the write throws. Without transactions, a phantom row is reconcilable against the document, a missing one is not. A rename is the one remaining non-transactional window: it inserts the new path then removes the old under its version; a crash between the two leaves both paths, with the log row present.

Each row records the op (`create`, `update`, `delete`, `rename`, `restore`), the content and description, and the author: the agent (run, conversation, tool call), a consolidation (the window it read), or a user. Versions have no TTL: they live as long as the agent, like its conversations. No taint flag is stored: whether untrusted tool output was in context when the agent wrote can be computed afterwards from the run and tool call the row points to.

- **Restore** writes a logged version's content again as a NEW version (history is never rewound), through `restoreChange`, under the same limits as any write: an old version may exceed caps tightened since. A redacted version cannot be restored.
- **Redaction** is by **content**, not version number (`redactMemoryVersion`). It is refused while any live document of the store holds that exact text, and once only (an already-redacted row is refused). When allowed it blanks the content and the description of every row of the store carrying that identical text (renames and restores are copies), stamping who and when. **What it does NOT remove:** the same text also lives in the conversations' recorded tool calls (the agent's `file_text` / `new_str` / `insert_text` inputs and later `view` outputs) and, for `MEMORY.md`, in the recorded system prompts of every run that saw it. An admin removes those by deleting the conversations; a real scrub is open (see [open security notes](#open-security-notes)). The dialog's confirm text says the same. Version numbers restart after a delete, so a number alone says nothing about which copies exist.

## Consolidation

`api/src/memory/consolidation.ts`, pure half in `operations.ts` (`consolidationDue`, `conversationsForConsolidation`, the prompts). A per-agent pass that edits memory through the same tool as the agent, so its changes are versioned, attributed (`author.kind: 'consolidation'`, with the `since`/`until` window it read) and restorable. Nothing appears in any conversation.

One trigger: a sweep every 15 minutes (`api/src/server.ts`), where each agent with memory on is due once 24 hours have passed since its last pass and it ran since (`consolidationDue`). Tests and simulations run one agent's pass through `POST /api/test-env/consolidate-memory`, due by the same rule as of an optional `now`; simulations of runs a week apart age the agent's history first (`age-agent-history`).

- **Activity** is the end of the agent's latest run, conversation turn or task run. A task run's content is not read, but the agent may have written memory in it, which then needs tidying.
- **What it reads**: `MEMORY.md`, the index (it `view`s the rest), and the conversations active since the previous pass, rendered as what people wrote and what the agent answered, text only: no tool call, no tool result, no reasoning. Each person's line names them, quoted, and the role their latest turn of the window ran with (`administrator`, `member`, `outside the organization`…): memory is shared by everyone the agent talks with, so a pass must know whose word it records. Without it, what an outside instructor said came back as an unattributed rule for every later run, administrators' included. At most 100 conversations and 60,000 characters, most recent kept. Anonymous conversations are not read. The first pass of an agent reads back 7 days at most, so turning memory on does not bill a pass over the whole history.
- **Its window** is `[until of the previous pass, until)`, where `until` stops before the oldest message still being written: a turn's answer is created when the turn starts, so reading past it would skip it once the window moves on. The run's end then counts as new activity.
- **What it does** (`consolidationSystemPrompt`): tidy first — merge duplicates, fix contradictions (newer wins), absolute dates, remove one-run findings and stale content — then record corrections, preferences and explicit "remember this" requests memory lacks, each with who said it and their role. A contradiction is resolved for the newer statement unless the older came from an administrator and the newer from someone who is not, and one person's preference is recorded as theirs, not as a rule, unless an administrator gave it. Delete is allowed: pruning is its job, and a deleted document stays restorable from its versions.
- **Re-checks the agent before each write**: it must still exist, be enabled and have memory on; otherwise the pass is aborted with nothing written, so a pass in flight cannot write after the agent's delete cascade (a one-`findOne` window remains).
- **Cost and backoff.** One locked pass per agent (`memory-consolidation:<agentId>`), at most 12 steps, a 180 s timeout, with the `tools` role model, billed to the account under the agent's identity; every completed step is billed, also when the pass fails or is withdrawn, and accumulates in `memoryConsolidation.credits` on the agent. A pass refused for the credit cap stamps `deferredAt`, a failure `failedAt`; both back the sweep off for 60 minutes. State lives on the agent (`memoryConsolidation`), carried over by the agent PUT like its other server-owned fields.

## Admin surface

`/api/memory/:type/:id/:agentId` (`api/src/memory/router.ts`). The reads (`GET` routes) are open to **whoever may instruct the agent** (`canInstruct`); every change is for **administrators of the owning organization**. Sharing is the design, not a leak: an agent with an identity and continuity keeps one memory and one history across everyone it talks with, the chat says its conversations are not private, and `MEMORY.md` is in every run's recorded system prompt anyway. Hiding the memory from an instructor hid nothing they could not ask the agent for.

| Route | Purpose |
| --- | --- |
| `GET /` | enabled flag, limits, usage and the document list |
| `GET /document?path=` | one document |
| `PUT /document?path=` | write (body `description`, `content`, `version`), same limits |
| `DELETE /document?path=&version=` | delete |
| `GET /versions?path=&page=&size=` | paged history, newest first |
| `POST /versions/:versionId/restore` | restore |
| `POST /versions/:versionId/redact` | redact |

Writes also require the progressive-rollout session (`reqWriteSession`: admin mode while `autonomousAgentsRequireAdminMode` is on); reads do not. A refusal is a 400 with its reason, a lost precondition a 409. Deleting the agent erases its store first, and again at the end of the cascade (a turn on another instance, or one mid-call, can write after the first pass): memory is derived from the conversations and must not outlive them. The panel is `ui/src/components/AgentMemoryPanel.vue`, shown inline in the Memory tab of the agent page's configuration (memory on or off; its banner says when it is off: the notes are kept, not used, and follows the stored setting): documents with edit and delete, and a history tab with restore and redact. The chat opens the same panel in `ui/src/components/AgentMemoryDialog.vue`, read-only, from its "not private" notice, for every signed-in person talking with a configured agent.

## Audited conversations

Memory is learnt from conversations nobody has to consent to, so the review contract changed with it (details in [conversation review](./conversation-review.md)):

- A conversation with a **configured agent** is audited (`shared/agent-audit.ts`): always reviewable by the account's admins while it exists, whatever `reviewPersonalAssistant` says and with no consent. The person's delete **archives** it, with no expiry; it is removed only by the agent's deletion or a GDPR erasure.
- The **personal assistant** keeps the consent model: `reviewPersonalAssistant`, the person's consent, a 30-day window.

The filter is `reviewableFilter` (`api/src/review/reviewable.ts`).

## Open security notes

Recorded, not resolved; roughly in order of weight. What is in place is above: memory rendered as data below the instructions, invisible characters refused, caps, versions with restore and redact, provenance on every write, consolidation reading no tool output.

1. **Poisoning through tool output.** An autonomous agent reads untrusted MCP and web output with no human in the loop, and a memory write promotes it into standing context for every later run (Unit 42's [Bedrock memory poisoning](https://unit42.paloaltonetworks.com/indirect-prompt-injection-poisons-ai-longterm-memory/), [MINJA](https://arxiv.org/abs/2503.03704), OWASP agentic ASI06). Candidates: stage writes made after untrusted output for approval (Hermes `write_approval`, Devin's suggestions), a read-only memory mode.
2. **Exfiltration channels.** Only invisible and control characters are refused; URLs in memory could be followed later; a markdown image of another site no longer loads when rendered (it becomes a link, [web access](./web-access.md)). Candidates: strip images, flag URLs, scan for credential-shaped strings before accepting a write.
3. **Erasure.** A GDPR erasure (`DELETE /api/review/:type/:id?userId=`) deletes the person's conversations but not memory written from them, nor its versions. Together with redaction's copies (above), this calls for one utility finding a text across versions, messages and recorded run prompts.
4. **Admin edits** can write anything into memory, by design: an admin writes the instructions too. Their edits are versioned under their identity.
