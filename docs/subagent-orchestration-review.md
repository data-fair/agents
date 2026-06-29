# Sub-agent orchestration — review vs. state of the art

> Handoff notes from an analysis session. Goal of this branch (`feat-better-subagents`):
> close the orchestration-intelligence gaps below. The robustness layer is already
> strong; the work here is about *delegation quality and parallelism*, not error handling.

## Where the code lives (all client-side)

Orchestration runs **entirely in the browser**. The server (`api/src/gateway`) is a pure
LLM proxy — no orchestration there.

- `ui/src/composables/use-agent-chat.ts:448-841` — the whole orchestrator-worker loop
  (`sendMessage`): tool partitioning, sub-agent `ToolLoopAgent` construction, streaming,
  `toModelOutput`, error/abort/watchdog handling, compaction.
- `lib-vue/use-agent-sub-agent.ts:23-46` — host-side registration (`useAgentSubAgent`):
  emits a `subagent_<name>` pseudo-tool whose `execute()` returns a static JSON config
  `{ prompt, tools, model, delegateOnly }`.
- `ui/src/composables/sub-agent-flatten.ts` — experimental flatten policy (per sub-agent).
- `docs/architecture/sub-agents.md` — existing architecture doc (accurate).

Key mechanics (file:line in `use-agent-chat.ts`):
- One delegation input field `task: string` (`:574`); reserved tools removed from the main
  set so delegation is *forced* (`resolveSubAgents`, `:382-386`).
- Main agent sees only the sub-agent's last assistant text via `toModelOutput` (`:692-705`).
- Per-sub-agent conversation history retained and replayed across calls
  (`subAgentHistory` Map, `:670-674`).
- Robustness: in-band `error` parts caught (`:642`, `:786-793`), abort propagation (`:677`),
  content-filter handling (`:659-669`), empty-completion fallback (`:810-812`),
  90s idle watchdog (`:60`, `:474-477`), abortable compaction (`:391-446`).

## What already matches / exceeds SOTA ✅

1. Orchestrator-worker with real **context isolation** (own window, instructions, tool subset).
2. **Forced delegation** via tool partitioning — stricter than Claude Code (lead keeps no
   copy of a worker's reserved tools).
3. **Output compression** through `toModelOutput` — the main token-cost lever, present.
4. **Observability** — per-sub-agent trace ctx `sub:<name>:<index>:<parentToolCallId>` +
   `reconstructTrace` grouping.
5. **Failure containment** — a worker failure becomes a visible result the lead can react to,
   not an unhandled throw.

The error/stall/moderation handling is ahead of most home-grown harnesses — leave it alone.

## Gaps vs. state of the art ⚠️ (the actual work for this branch)

### 1. Sub-agents run SEQUENTIALLY — ✅ DONE
Parallel execution now works: the AI SDK tool loop dispatches each `subagent_*` call's
`execute` without awaiting the previous, and each call streams into its own panel keyed by
the delegating `toolCallId`. The contention points are resolved — per-sub-agent phases write
to the per-`toolCallId` `subAgentActivities` map (not the shared `activity` ref), and the
`subAgentHistory`/`subAgentCallCount` Maps were removed entirely (see gap 4). With workers now
stateless there is nothing to serialize, so even concurrent calls to the *same* sub-agent run
in parallel.

### 2. Thin delegation task contract — cheapest quality win
Only structured guidance is the `task` field description ("include all relevant context…",
`:575`). No required output/deliverable format, no scope boundary, no effort hint. Vague
lead→worker instructions are the #1 documented multi-agent failure mode (duplicated /
under-specified work). Fix: expand the sub-agent input schema beyond `task` (e.g. optional
`expectedOutput`/`deliverableFormat`, `scope`) and/or bake an "objective + output format"
convention into the sub-agent prompt.

### 3. No framework-level lead delegation strategy
Orchestration quality depends entirely on host-supplied prompts — no scaffolding for *when*
to decompose, how many workers, or effort scaling. Over-delegation is a real cost risk here
(quotas/usage are first-class). Ship a reusable lead-agent prompt fragment (delegation
heuristics + effort scaling: trivial → no sub-agent; complex → clear division of labor) that
hosts compose in.

### 4. Stateful sub-agents diverge from SOTA — ✅ DONE (removed, not bounded)
Resolved by making workers **stateless/single-shot**, the standard orchestrator-worker design,
rather than bounding the retained history. `subAgentHistory` and `subAgentCallCount` were
deleted; every delegation is now a fresh `subAgent.stream({ prompt: args.task })`. This
eliminates the unbounded-growth / compaction-exemption problem *by construction* (there is no
retained state to grow or to clear on compaction), removes the same-name serialization gate
(`sub-agent-serial.ts`, now deleted), and makes the worker behave exactly as the `task`
contract already promised ("include all relevant context"). Evidence it was safe: every real
data-fair sub-agent is a single-shot producer (read→write/summarize), none conversational, and
no test asserted cross-call memory. The lead re-supplies context on follow-ups, which is SOTA.

### 5. Lossy summary extraction ("telephone game")
`toModelOutput` returns only `lastMsg.content`, or `'Task completed.'` if the worker ended on
a tool call at the step limit (`:702-703`). A producer that did structured work but didn't
narrate it returns ~nothing. SOTA fix (Anthropic) = artifact pattern: worker writes output to
a store / via a tool (e.g. `set_display`) and passes a reference, instead of squeezing
structured results through the lead as prose.

### 6. Fixed `stepCountIs(10)` everywhere (`:561`, `:758`)
Both lead and workers hard-capped at 10 regardless of task. Hitting it silently truncates and
then returns the lossy `'Task completed.'`. Make the cap per-sub-agent configurable and
surface "hit step limit" distinctly from "finished".

### 7. Minor: config fetched via `execute({task:''})` (`:236`, `:367`)
Static config is served by calling the tool's execute with a dummy empty task and parsing
JSON-in-text. Works, but overloads the execution path. A dedicated config channel would be
cleaner / less fragile.

## Recommended order of work

1. ~~**Parallel sub-agent execution** (gap 1)~~ — ✅ done.
2. ~~**Stateless workers** (gap 4)~~ — ✅ done (removed history rather than bounding it).
3. **Richer task contract + reusable lead delegation/effort-scaling prompt** (gaps 2 & 3) —
   cheap, high-leverage, directly helps cost/quotas. The next step.

Gaps 5–7 are follow-ups, not blockers.

## Bottom line

Robustness & observability are at/above SOTA — don't touch them. Parallel workers and stateless
single-shot workers are now in place. The remaining lag is in orchestration *intelligence*:
rich task contracts and lead-side delegation strategy (gaps 2 & 3). The text-only return
(gap 5) remains a deliberate-looking choice worth a conscious revisit.
