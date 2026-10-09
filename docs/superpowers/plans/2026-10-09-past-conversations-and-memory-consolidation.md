# Past conversations readable, memory consolidated

Status: implemented 2026-10-09. As built: docs/architecture/agent-memory.md and planned-tasks.md (self-knowledge).

## Why

The `web-memory-task-runs` simulation (2026-10-09) ended "satisfied, only just": memory filled with one
week's findings, including a persistence claim nobody observed. Two causes:

- Memory looks like the only thing that carries over. The agent can already read its past task runs
  (`list_my_runs`, `get_run`), but no prompt says so, and past conversations are not readable at all
  (`renderRun`: "Conversation content is not available here").
- Reflection extracts memory from every conversation (every 20 messages, every task run's end, an idle
  sweep every 5 minutes). It costs a model pass per conversation, writes lines no person or agent
  decided on, and reads tool results, which now include web pages: the path persistent memory-injection
  attacks use.

State of the art (sources in the conversation of 2026-10-09): every major harness lets the agent decide
what to remember during the session (Claude Code auto memory, Anthropic's memory tool, ChatGPT saved
memories, Letta core memory). Past sessions are read on demand (Claude.ai chat search, Letta
`conversation_search`). Background passes exist, but batched, and since Claude Code's Auto Dream mostly
as consolidation of existing memory rather than per-conversation extraction.

## Decisions

1. **An agent reads all its past conversations, whoever it is talking to.** Conversations with a
   configured agent are audited and carry no consent (see conversation-review.md) precisely so that the
   agent knows one shared history: it must answer "why did you do that yesterday?" from another person's
   conversation. No filtering by the current person.
2. **Memory is written by the agent, deliberately**, during its runs: from its own judgment or because
   someone asked. That stays the main mechanism.
3. **Reflection becomes consolidation**: per agent, batched, tidying memory rather than extracting from
   each conversation.
4. **Consolidation does not read tool results.** It reads what people said and what the agent answered.
   Third-party content then reaches memory only through a write the agent made in a run, which is
   attributed to that run's tool call.

## Changes

### 1. Reading the past

- `get_run` on a conversation run names its conversation and the seq range of the turn's messages.
- `read_conversation(conversationId | runId, line?, offset?)` reads the **conversation export** (the
  JSONL file of the review page, read by the `conversation-export` skill) page by page, lines numbered:
  outline first, then only the records needed. User decision: one format for maintainers, the judge and
  the agent, rather than a second renderer (a first version rendered messages as text with clipped tool
  results; replaced the same day).
- `list_my_runs` rows carry the conversation id. Who triggered a run stays unnamed in the listing.
- No search for now: `list_my_runs` with `since` and the dates answer "yesterday".
- Everything returned stays inside the provenance envelope: past tool results are reported, not obeyed.

### 2. Prompts point to the past

- `MEMORY_CLAUSE`: "Your past runs and conversations stay readable (`list_my_runs`, `get_run`,
  `read_conversation`): do not copy what you found into memory. Keep there what makes the next run better:
  where information lives, how to get it, what did not work, corrections and preferences people gave you.
  Date what you observed about an outside source; do not claim it persists or changed unless you checked
  again."
- A planned task's run prompt adds one line: its earlier runs are listed by `list_my_runs` with its
  `taskId`.

### 3. Reflection → consolidation

- Remove the per-turn trigger (`turn-target.ts`), the task-run trigger (`maybeReflectTaskRun`) and the
  per-conversation idle sweep.
- Add a per-agent pass: due when the agent has memory on, at least N runs since the last pass, and at
  least 24 h since it. Picked up by the existing 5-minute timer in `server.ts`, one lock per agent.
- What it does: read memory; merge duplicates; fix contradictions (newer wins); turn relative dates into
  absolute ones; drop or date stale findings; then scan the people's messages and the agent's answers
  since the last pass for corrections and explicit "remember this" requests the agent did not record.
- Same budget rules as today (tools model, billed to the account, step limit, timeout, `delete` withheld).
  State moves from the conversation (`memoryReflection`) to the agent. The feature is unreleased, so no
  upgrade script (upgrade-scripts convention).

### 4. Small fixes

- `MEMORY.md` needs no description (`checkDescription`, `operations.ts:182`): it is shown in full.
- The simulation runner reads the agent's memory documents and history through the admin routes at the
  end of a case and adds them to the evidence (`hostState.agentMemory`), instead of a product export
  change; between task runs it consolidates, as the daily sweep would.

### 5. Simulations

- Rerun `web-memory-task-runs`; premise unchanged; the judge gets the memory history.
- New case `autonomous-agent-why-earlier` (memory off): an instruction in one conversation, "why did you
  leave those out?" in the next. The agent must find and cite the first conversation.

## Docs

agent-memory.md (reflection section rewritten as consolidation), planned-tasks.md (self-knowledge
tools), autonomous-agents.md (service tools list).
