# Better subagent tracing — design

## Problem

When the main agent delegates to a subagent, the trace captures the
subagent's whole internal execution as a single undifferentiated dump.

`use-agent-chat.ts` runs the subagent via a `ToolLoopAgent`, streams its
UI messages for progress, then calls `recorder.addSubAgentStepMessages(...)`
exactly once at the end with *all* of `subResponse.messages`. That single
call lands everything in one `StepTrace` whose `toolCalls` array stays empty.

Consequences, visible in the debug dialog, the evaluator tools, and the raw
recorder data alike:

- The subagent's individual steps are not broken out — no per-step
  `tool-call → tool-result → assistant-step` sequence like the main agent has.
- Per-step token usage is lost; only a single lump remains.
- Nested subagent tool calls carry no distinct input/output/duration entries.
- The input `task` prompt *is* recorded (on `sub-agent-start`) but is only
  rendered as raw JSON, so it reads as missing.

The `SessionRecorder` even has methods built for per-step granularity
(`startSubAgentToolCall`, `finishSubAgentToolCall`, `finishSubAgentStep`) that
are never called from anywhere — the intended design was abandoned mid-way.

## What the AI SDK gives us

`subAgent.stream()` returns a `StreamTextResult` (ai@6.0.116) and accepts a
stable (non-experimental) `onStepFinish` callback. Each step arrives as a
`StepResult` carrying everything we need:

- `toolCalls` — each with `toolCallId`, `toolName`, `input`
- `toolResults` — each with `toolCallId`, `output`
- `usage` — per-step token usage
- `finishReason`
- `response.messages` — the assistant/tool messages generated this step
- `content` / `text`

`onStepFinish` fires as the stream is consumed (i.e. during the existing
`readUIMessageStream(...)` loop), before `subResult.response` resolves.

## Approach

Use the `onStepFinish` callback to record each subagent step as it completes.

Rejected alternatives:

- **`experimental_onToolCallStart/Finish` + the three granular methods** —
  faithful to the abandoned design, but `experimental_*` APIs can break on
  patch releases and the start/finish pairing is fiddlier for no extra benefit.
- **Post-process `await subResult.steps`** — simplest, but the steps array
  carries no real per-step wall-clock timestamps, so the recorder's global
  timestamp sort would scramble ordering between main-agent and subagent
  entries.

`onStepFinish` wins: stable API, real per-step timestamps (correct global
ordering), one clean hook. It also lets us *delete* the unused granular
methods and the single-dump method rather than add more surface.

## Changes

### 1. `ui/src/traces/session-recorder.ts`

- **Remove** the unused/abandoned methods: `startSubAgentToolCall`,
  `finishSubAgentToolCall`, `finishSubAgentStep`, and `addSubAgentStepMessages`.
  Remove the now-unused `subAgentPendingToolCalls` map.
- **Add** `recordSubAgentStep(toolCallId, step)` where `step` provides
  `messages`, `usage`, `finishReason`, `toolCalls` (raw SDK `toolCalls`) and
  `toolResults` (raw SDK `toolResults`). It:
  - looks up the parent `ToolCallTrace` by `toolCallId`; returns if no `subAgent`;
  - builds a `StepTrace` with `timestamp: new Date()`;
  - for each `toolCall`, pairs it with its `toolResult` by `toolCallId` into a
    `ToolCallTrace` (`input`, `output`, `timestamp`), pushed onto the step's
    `toolCalls`;
  - sets the step's `messages`, `usage`, `finishReason`;
  - appends the step to `subAgent.steps`.
- `SubAgentTrace.steps: StepTrace[]` and `StepTrace` (`messages`, `usage`,
  `finishReason`, `toolCalls`) are unchanged — they already fit.
- `buildCache` already iterates `subAgent.steps → toolCalls → messages` and
  emits `tool-call` / `tool-result` / `sub-agent-step` entries with token
  chips, so it needs no structural change. Verify the per-step `timestamp`
  drives correct ordering and that sub-tool-call entries use their own
  `subTc.timestamp`.

### 2. `ui/src/composables/use-agent-chat.ts`

- Pass `onStepFinish: (step) => recorder?.recordSubAgentStep(parentToolCallId, step)`
  to `subAgent.stream(...)` in **both** branches (first call with `prompt`,
  multi-turn call with `messages`).
- **Remove** the trailing `recorder.addSubAgentStepMessages(...)` call.
- `subAgentHistory` accumulation and `sessionUsage` totalling are unchanged.
- The `task` is already recorded per invocation via `startSubAgent` (each call
  resolves its own `parentToolCallId`), so multi-turn input prompts are covered.

### 3. `ui/src/components/agent-chat/AgentChatDebugDialog.vue`

- Render the `sub-agent-start` detail's `task` as readable text rather than
  raw JSON (small template branch, mirroring how text entries already render).
- No other rendering changes — per-step sub-entries already flow through the
  generic entry rendering.

### 4. Tests — `tests/features/agents/session-recorder.unit.spec.ts`

- Add a multi-step subagent scenario driving `startSubAgent` then several
  `recordSubAgentStep` calls. Assert:
  - distinct `tool-call` and `tool-result` overview entries per subagent step,
    with correct input/output;
  - per-step `usage` present on `sub-agent-step` entries;
  - overview ordering interleaves subagent entries between the parent
    `tool-call` and `tool-result` correctly.

## Out of scope

- Persisting traces across reloads.
- Exporting/sharing traces.
- Surfacing subagent internals to the main LLM (it still sees only the final
  text summary via `toModelOutput`).

## Verification

- `npm run lint-fix`, `npm run check-types`.
- `npm run test tests/features/agents/session-recorder.unit.spec.ts`.
- Manual: enable tracing (`agent-chat-trace=1`), run a chat that delegates to a
  subagent, confirm the debug dialog shows the task prompt as text plus
  per-step tool-call/result and token-usage entries in order.
