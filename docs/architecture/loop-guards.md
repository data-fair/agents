# Loop guards

Both model loops — the turn itself (`streamText` in `runModelLoop`, `api/src/conversations/model-loop.ts`, which serves the in-page chat's personal assistant and configured autonomous agents alike) and each delegated sub-agent (`ToolLoopAgent`, see [sub-agents](./sub-agents.md)) — run server-side and autonomously: the model calls tools, gets results, and decides whether to call more. Two failure shapes have to be bounded without crippling the loop:

- **Runaway** — the model re-issues the same call over and over (the single most common agent failure mode: "step repetition" is 15.7% of failures in the MAST taxonomy, and AgentBench attributes most step-limit exits to repeated content).
- **Unbounded but productive work** — a page whose tools are deliberately fine-grained needs many steps. A json-layout form is filled one `setFieldValue` per field, plus `getFieldSuggestions` round-trips and `editArray` + N fields per array item, so even a modest form takes several dozen steps.

A single step count cannot serve both. Any value low enough to cut a runaway short (the historical `stepCountIs(10)`) also truncates real work mid-form, and the close-out then reports a half-filled form as the result. So the two concerns are guarded separately, in `api/src/conversations/loop-guards.ts`.

```mermaid
flowchart LR
  Step[Model step<br/>tool calls + results] --> Repeat{Same calls,<br/>same results<br/>as previous steps?}
  Repeat -->|"run &lt; 3"| Next[Next step]
  Repeat -->|"3 ≤ run &lt; 5"| Nudge["prepareStep injects<br/>reminder message"] --> Next
  Repeat -->|"run ≥ 5"| Stop[stopWhen: repeatedCallGuard]
  Next --> Count{step ≥ 100?}
  Count -->|no| Step
  Count -->|yes| Stop2[stopWhen: isStepCount]
  Stop --> Closeout[Sub-agent: no-tools close-out turn<br/>→ partial result]
  Stop2 --> Closeout
  Stop --> Notice[Lead: turn ends, stop reason<br/>notice appended to the message]
  Stop2 --> Notice
```

## 1. Flat step backstop — `STEP_LIMIT = 100`

One generous constant for both loops. It is **not** a spend control: [quotas](./quotas-usage.md) are checked before the turn, the loop tracks the run's credit budget (`turnCredits`) in memory and stops between steps once it is crossed, the account's credit cap is re-read after each step that called tools (i.e. only when another step follows), and the person always has Stop (an `abort` frame on the agent session, which aborts the run). Those are what bound cost. A third `stopWhen` condition (`() => budgetExceeded`) sits beside the two guards below for that. The step limit only has to stop a runaway the repeat guard cannot recognise — typically a tool whose output changes on every call.

100 matches the runaway backstops of harnesses built for long runs (OpenHands and browser-use default to 100, mini-swe-agent to 250, Google ADK to 500 LLM calls) and sits well above observed successful trajectories: browser tasks run 10–50 steps, coding agents 50–180, form filling a few dozen. Frameworks with much lower defaults (OpenAI Agents SDK 10, AI SDK `ToolLoopAgent` 20, LangGraph.js 25) assume one short loop per call; LangGraph Python raised its default from 25 to 1000 for exactly the reason above.

Pages do **not** declare their own budget. An earlier iteration let a sub-agent config carry `maxSteps`, clamped by the host; no surveyed harness does that, and a flat generous limit removes the negotiation entirely.

## 2. Repeated-call guard — nudge at 3, stop at 5

`trailingRepeatCount(steps)` measures the trailing run of identical steps. A step's signature is the sorted set of its tool calls (`toolName` + serialized `input`) **and** its results (`toolName` + serialized `output`), so:

- the same call returning **different** output (polling a status, re-reading a field after a change) is progress, not a repeat;
- a step with no tool call breaks the run (the model spoke, it is not stuck on a call);
- parallel calls compare as a set, regardless of order;
- an early repeat that the model recovered from is forgiven — only the trailing run counts.

Two thresholds, following the OpenHands SDK ladder:

| Trailing run | Mechanism | Effect |
|---|---|---|
| `REPEATED_CALL_NUDGE_AT` = 3 | `loopGuardPrepareStep` (a `prepareStep` hook, lead and workers — see below) | Appends a user message to the **next model request only**: "You have called `X` with the same arguments 3 times in a row and got the same result each time…". It never enters the stored transcript, and is re-derived on every step while the run persists. |
| `REPEATED_CALL_LIMIT` = 5 | `repeatedCallGuard()` (a `stopWhen` condition) | Ends the loop on a tool-call step. |

The nudge is the mildest intervention that works: telling the model plainly what it just did. Comparable production thresholds are 3 consecutive identical calls (Roo Code, Reflexion, AWS Strands) to 5 (Gemini CLI, which also detects cycles of length up to 5). Comparing results as well as calls is the refinement most of them converged on after false positives (Gemini CLI had to add an opt-out).

On the lead loop the same `prepareStep` hook first refreshes the live tool set when the page's tools changed mid-turn, then returns `loopGuardPrepareStep(options)`. Sub-agent workers use `loopGuardPrepareStep` directly, so a looping worker is reminded at 3 before it is stopped at 5.

The hook **rebuilds** each step's messages, `initialMessages` + `responseMessages` with the reminder last, rather than appending to `messages`. AI SDK 7 carries a `messages` override forward: the next step starts from what the previous one was sent. Appending would therefore keep every reminder in every later request and stack one more per repeat. Rebuilt, a step without a reminder is exactly what the SDK would have sent, and a step with one carries exactly one.

The same module holds `STREAM_IDLE_TIMEOUT_MS` (90 s) and `createIdleWatchdog`: an idle watchdog rather than a total ceiling, so a provider that accepts a request and then goes silent does not hold the conversation until the turn's wall-clock timeout (`turnTimeoutSeconds`, enforced by `driveTurn`'s deadline). It is re-armed on every stream part and PAUSED while any tool call is outstanding: the AI SDK's own `timeout.chunkMs`, which it replaced, counted a running tool as silence, so a slow catalog query or a slow page tool was aborted as a stuck provider.

## 3. Never stop silently

Either guard ends the loop with `finishReason: 'tool-calls'`. For a sub-agent, the orchestrator then runs **one close-out turn with no tools** (`SUBAGENT_CLOSEOUT_PROMPT`) so the model must synthesize a best-effort answer from what it gathered, and surfaces it to the lead as a *partial* result rather than a failure — see [sub-agents §3](./sub-agents.md#loop-guard-close-out). This mirrors smolagents (`provide_final_answer`), CrewAI (`force_final_answer`), browser-use (done-only last step) and Claude Code sub-agents (output "marked partial"); hard-stop-and-throw is the pattern users complain about.

On the lead loop the turn simply ends, and the run records why: `finishReason: 'tool-calls'` maps to the stop reason `budget`, `step-limit` or `repeated-calls`, and `runTurn` appends that reason's notice (`runStopReasonMessage`, `api/src/conversations/operations.ts`) to the assistant message, so the person never sees a turn that just stops. A turn that ends on `wait_for_user_action` also stops on a tool call, by design: its stop reason is `waiting`, and it carries no notice — its own handover message says what comes next (see [Host events](./host-events.md#wait_for_user_action)).

## 4. Test seams

The mock model (`api/src/models/mock-model.ts`) answers a task of exactly `loop forever` with the same `get_schema` call on every step and **ignores any injected nudge**, so the e2e test `Sub-agent that loops to its step cap recovers a close-out answer` exercises the whole ladder: 5 identical calls, the guard stops the loop, the close-out recovers an answer. The guard logic itself is covered by `tests/features/chat-subagent/loop-guards.unit.spec.ts`, including one test that drives a real `streamText` loop to pin that a step never carries more than one reminder.

## References

- OpenHands SDK stuck detector (nudge at 3 identical action+error, stop at 4 identical action+observation): https://docs.openhands.dev/sdk/guides/agent-stuck-detector
- Gemini CLI `loopDetectionService` (hash of name+args, cycles of length 1–5 repeated 5×): https://github.com/google-gemini/gemini-cli/issues/11002
- Roo Code `ToolRepetitionDetector` (3 consecutive identical calls, then ask the user): https://github.com/RooCodeInc/Roo-Code/pull/5752
- browser-use budget warning at 75% and done-only last step: https://docs.browser-use.com/customize/agent/all-parameters
- Vercel AI SDK loop control (`stopWhen`, `prepareStep`) and the proposed `hasRepeatedToolCalls`: https://ai-sdk.dev/docs/agents/loop-control, https://github.com/vercel/ai/issues/17606
- Claude Agent SDK budgets (`maxTurns` unlimited by default, `maxBudgetUsd`, sub-agent output marked partial): https://code.claude.com/docs/en/agent-sdk/agent-loop
- LangGraph recursion limit raised from 25 to 1000: https://github.com/langchain-ai/langgraph/pull/6676
- "Why Do Multi-Agent LLM Systems Fail?" (MAST, step repetition as the top failure mode): https://arxiv.org/abs/2503.13657
- Reflexion (same action + same observation for more than 3 cycles): https://arxiv.org/abs/2303.11366
- Anthropic on many-small-call workloads (programmatic tool calling, code execution with MCP): https://www.anthropic.com/engineering/advanced-tool-use
