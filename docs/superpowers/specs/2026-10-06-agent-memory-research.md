# Autonomous agent memory — state of the art and fit (research note)

Status: research, input to a design spec. Branch `feat-agent-memory` (from `feat-autonomous-agents`).
The P0 spine spec (`2026-09-22-autonomous-agents-p0-design.md`) already reserves **P3 "Memory & skills"**.
This note covers single-agent memory only; sharing between agents is the next iteration.

## 1. What the reference systems do

| System | Storage | In context | Write path | Maintenance | Audit |
|---|---|---|---|---|---|
| Claude Code auto memory ([docs](https://code.claude.com/docs/en/memory)) | markdown dir: `MEMORY.md` index + one-fact files, typed frontmatter (user/feedback/project/reference) | index first 200 lines / 25KB; topic files read on demand | agent, in-session, normal file tools | harness measures the index, warns near cap, errors past it ("rewrite the index"); `modified` timestamp stamped per write. "Auto Dream" background consolidation reported (unverified) | plain files, `/memory` |
| Anthropic memory tool ([docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)) | client-side `/memories` dir, any backend | nothing preloaded — "view your memory directory before doing anything else" | `view/create/str_replace/insert/delete/rename` | paired with context editing: model is warned to save before tool results are cleared | up to the host |
| Claude Managed Agents memory stores ([docs](https://platform.claude.com/docs/en/managed-agents/memory)) | workspace-scoped stores of path-addressed docs, mounted as files; 100kB/memory, 8 stores/session | a note listing mounts in the system prompt; files read on demand | file tools; `read_write` / `read_only` per store | **Dreams** ([docs](https://platform.claude.com/docs/en/managed-agents/dreams)): async job, store + 1–100 past transcripts → a **new** store; input never modified | **every mutation = immutable version** attributed to the session, 30d, redactable; `content_sha256` preconditions; explicit prompt-injection warning |
| Hermes Agent ([repo](https://github.com/NousResearch/hermes-agent), [docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)) | two capped files: `MEMORY.md` 2,200 chars, `USER.md` 1,375 chars, `§`-delimited, usage % shown | **frozen snapshot at session start** (prefix cache); writes visible next session; past sessions via FTS5 `session_search` | `memory` tool add/replace/remove + **post-turn background review** (memory+skill tools only) + pre-compression flush (unverified in code) | at cap: error with chars to free, agent must consolidate in one batched op | `write_approval` stages every write for human approve/reject; injection scanner claimed in docs (not found in code) |
| Letta MemFS ([docs](https://docs.letta.com/concepts/memfs)) / sleep-time ([docs](https://docs.letta.com/guides/agents/architectures/sleeptime)) | git-backed markdown + frontmatter; `system/` pinned | pinned files every turn, rest on demand | agent tools + **sleep-time subagents** after N steps / on compaction, in git worktrees | defragmentation, reflection, "review before applying" | every edit is a git commit |
| Mem0 ([2026 post](https://mem0.ai/blog/mem0-the-token-efficient-memory-algorithm)) | extracted facts, vector+keyword+entity | retrieved per query | LLM extraction | **abandoned ADD/UPDATE/DELETE reconciliation** — "overwrites erased key information… deletes removed information relevant later"; now ADD-only, staleness resolved at retrieval | — |
| Zep/Graphiti ([paper](https://arxiv.org/abs/2501.13956)) | temporal KG, bitemporal edges | retrieved | extraction | contradiction **invalidates**, never deletes | history queryable |
| OpenClaw ([memory](https://docs.openclaw.ai/concepts/memory), [dreaming](https://docs.openclaw.ai/concepts/dreaming)) | `USER.md`, `MEMORY.md`, daily logs | small files + today/yesterday logs | agent + **silent flush before compaction** | nightly "dreaming" cron; promotion needs score+recall thresholds, **taint gate drops untrusted/system provenance**, snapshot before rewrite, max 25% prior-entry loss | `DREAMS.md` explains rejections |
| Codex memories ([docs](https://learn.chatgpt.com/docs/customization/memories?surface=app)) | `~/.codex/memories/*.md` | injected | **background, from idle non-trivial threads**, never end-of-every-thread; secrets redacted | consolidation subagent under a lock (unverified) | off by default; per-chat "may use / may feed" |
| ChatGPT / Gemini | saved memories + implicit chat-history reference | — | — | — | explicit layer listable/deletable; implicit layer opaque (the lesson) |
| Devin Knowledge ([docs](https://docs.devin.ai/onboard-devin/knowledge)) | knowledge items with triggers | on trigger match | agent **suggests**, human approves | — | approval-gated |

Evidence worth keeping:
- Letta's [benchmark](https://www.letta.com/blog/benchmarking-ai-agent-memory): a plain filesystem agent (grep/open) with GPT-4o-mini reached 74% on LoCoMo, above Mem0's graph variant — simple file tools beat vector memory at this scale.
- [Sleep-time compute](https://arxiv.org/abs/2504.13171): out-of-loop pre-computation pays off in proportion to how **predictable** future queries are — a recurring, scheduled autonomous agent is the best case.
- [LongMemEval](https://arxiv.org/abs/2410.10813): knowledge updates and abstention are where memory systems fail.
- Surveys: [Memory in the Age of AI Agents](https://arxiv.org/abs/2512.13564), [write–manage–read loop](https://arxiv.org/abs/2603.07670).
- Poisoning is documented: [Unit 42 Bedrock memory poisoning via the summarisation prompt](https://unit42.paloaltonetworks.com/indirect-prompt-injection-poisons-ai-longterm-memory/), [MINJA](https://arxiv.org/abs/2503.03704), SpAIware/Gemini delayed tool invocation; OWASP agentic ASI06.

## 2. The convergent minimal pattern (2026)

1. Plain-text memory: a **small pinned core** plus **topic documents read on demand**; raw history stays the cold tier.
2. The agent edits it with **file-like tools** (`view / create / str_replace / delete`) during the turn.
3. **Hard size cap enforced by the harness**, returning an error that tells the agent to consolidate. Never silent truncation.
4. A **flush** before context is lost (compaction / tool-result clearing) and/or at the end of a session.
5. Optional **out-of-loop consolidation** over memory + past transcripts — always **non-destructive**: new version, diff, rollback, often staged for approval.
6. **Versioned, attributed writes**; humans can view, edit, roll back, redact.

## 3. Fit with this codebase (facts)

- Agent: `autonomous-agents` collection, schema `api/types/autonomous-agent/schema.js`; no memory field. Delete cascade `deleteAutonomousAgentData` (`api/src/autonomous-agents/service.ts`).
- Tool plug point: the `tools` object in `performTurn` (`api/src/conversations/executor.ts` ~282-288), like `wait_for_user_action`. No server-tool registry. Sub-agent workers only receive their reserved tools, so memory tools do not leak into them.
- System prompt: `buildSystemPrompt` (`api/src/conversations/operations.ts`) is the stable cacheable prefix, recorded once per run — a frozen-at-run-start memory snapshot fits there without breaking caching across steps.
- Compaction: `compactHistory` (`api/src/conversations/turn-history.ts`) runs once per turn before the first step; `prefixToSummarize` is exactly what is about to be evicted — the natural "flush" hook. Tier-1 tool-result clearing also loses content without a model call.
- Billing of a side LLM call: the summarizer pattern (`computeCreditBreakdown` → `incrementRunSpend` → `recordUsage` → `recordCall`), attributed to `autonomous-agent:<id>`.
- **Scope tension**: a conversation is one person's thread. Agent-wide memory carries what one instructor said into another instructor's thread.
- Review/traces: `messages` + `runs` are kept with no TTL for live conversations; admin review is gated by `storeTraces` + per-thread consent. Out-of-loop consolidation reading past threads is a separate disclosure question.
- No scheduler exists (plain `setInterval` in `api/src/server.ts`, not lock-protected); scheduled runs are P2. Runs have `trigger: user | wake`.
- Proposed approval gate (`2026-10-01-tool-approval-gate-design.md`) treats unannotated tools as `write` — memory tools need explicit annotations / exemption.

## 4. Safety (why it matters more here)

An autonomous agent reads untrusted MCP output and acts without a human. A memory write promotes data into standing context for every later run. Minimal mitigations, by cost:
1. Render memory as **delimited data with dates**, below the human-owned instructions, never able to edit them.
2. Record **provenance** per write (run, conversation, trigger, whether untrusted tool output was in context).
3. **Hard caps** bound the blast radius; **versions + rollback + redaction** make cleanup possible.
4. Cheap write-time checks: invisible Unicode, URLs/markdown images (exfiltration), credential-shaped strings.
5. A consolidator must never promote content whose only source is untrusted tool output (OpenClaw taint gate).
6. Strict org + agent scoping on every read/write.

## 5. Room for shared memory later

Model memory as an attachable **store** (`{id, owner, description}`) referenced by the agent (`memoryStores: [{storeId, access}]`), even if v1 creates exactly one implicit store per agent. Provenance records the writing agent id; updates carry a content-hash precondition. Shared writable stores multiply the poisoning radius — default them read-only.
