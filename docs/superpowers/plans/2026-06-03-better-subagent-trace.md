# Better Subagent Tracing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record each subagent step as a distinct, fully-detailed trace entry (tool-call inputs/outputs, per-step token usage, messages) instead of one undifferentiated dump, so the debug dialog, evaluator tools, and raw recorder data all show the subagent's input prompt and step-by-step execution in correct order.

**Architecture:** The subagent runs via `ToolLoopAgent.stream()`. We hook its stable `onStepFinish` callback to feed each completed `StepResult` into a new `SessionRecorder.recordSubAgentStep` method, which builds one `StepTrace` per step (pairing tool calls with their results). We delete the four abandoned, never-called subagent recorder methods and replace them with this single one. A latent ordering bug (parent tool-result timestamped at call *start*) is fixed by recording an `endTimestamp`.

**Tech Stack:** TypeScript, Vue 3, the `ai` SDK (v6.0.116) `ToolLoopAgent`/`streamText`, Playwright test runner (used as a plain unit-test runner here).

---

## Background facts (verified against the codebase)

- `subAgent.stream(...)` returns a `StreamTextResult` and accepts a stable (non-`experimental_`) `onStepFinish: (step: StepResult) => void | Promise<void>` option.
- `StepResult` fields used here:
  - `toolCalls: Array<{ toolCallId: string; toolName: string; input: any }>`
  - `toolResults: Array<{ toolCallId: string; toolName: string; input: any; output: any }>`
  - `usage: { inputTokens?: number; outputTokens?: number; ... }`
  - `finishReason: string`
  - `response.messages: ResponseMessage[]` where `ResponseMessage = AssistantModelMessage | ToolModelMessage`, a subset of `ModelMessage` (assignable with no cast).
- `onStepFinish` fires while the stream is consumed (the existing `readUIMessageStream(...)` loop), before `subResult.response` resolves.
- `buildCache` in `session-recorder.ts` already iterates `subAgent.steps → toolCalls / messages` and emits `tool-call` / `tool-result` / `sub-agent-step` overview entries. It needs no structural change — only the ordering fix.
- The four methods `startSubAgentToolCall`, `finishSubAgentToolCall`, `finishSubAgentStep`, `addSubAgentStepMessages` and the field `subAgentPendingToolCalls` are referenced ONLY from the recorder itself and from `tests/features/agents/session-recorder.unit.spec.ts` (the test at lines 98-118). Nothing in `ui/src` calls them except `addSubAgentStepMessages` (in `use-agent-chat.ts`, removed in Task 2).

## File Structure

- **Modify** `ui/src/traces/session-recorder.ts` — replace abandoned subagent methods with `recordSubAgentStep`; add `endTimestamp` to `ToolCallTrace`; fix tool-result entry ordering. (Task 1)
- **Modify** `tests/features/agents/session-recorder.unit.spec.ts` — rewrite the existing subagent test to the new API; add a multi-step subagent test asserting breakdown, usage, and ordering. (Task 1)
- **Modify** `ui/src/composables/use-agent-chat.ts` — pass `onStepFinish` to both `subAgent.stream(...)` branches; remove the trailing `addSubAgentStepMessages` call. (Task 2)
- **Modify** `ui/src/components/agent-chat/AgentChatDebugDialog.vue` — render the `sub-agent-start` task as readable text. (Task 3)

---

## Task 1: Recorder — record subagent steps with full detail + fix ordering

**Files:**
- Modify: `ui/src/traces/session-recorder.ts`
- Test: `tests/features/agents/session-recorder.unit.spec.ts`

- [ ] **Step 1: Update the existing subagent test to the new API (it will fail to compile/run)**

In `tests/features/agents/session-recorder.unit.spec.ts`, replace the entire test `'records sub-agent traces within a tool call'` (currently lines 98-118) with this version using the new `recordSubAgentStep` API:

```ts
  test('records sub-agent traces within a tool call', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('analyze')
    recorder.startToolCall('tc1', 'subagent_analyst', { task: 'analyze data' })
    recorder.startSubAgent('tc1', 'analyst', 'You are an analyst', 'analyze data', [])
    recorder.recordSubAgentStep('tc1', {
      messages: [{ role: 'assistant', content: [{ type: 'text', text: 'done' }] }],
      usage: { inputTokens: 5, outputTokens: 3 },
      finishReason: 'stop',
      toolCalls: [{ toolCallId: 'stc1', toolName: 'queryData', input: { sql: 'SELECT *' } }],
      toolResults: [{ toolCallId: 'stc1', output: { rows: [] } }]
    })
    recorder.finishToolCall('tc1', 'analysis complete', 500)
    recorder.finishStep()
    recorder.addStepMessages([], undefined, 'stop')

    const trace = recorder.getTrace()
    const subAgent = trace.turns[0].steps[0].toolCalls[0].subAgent
    assert.ok(subAgent)
    assert.equal(subAgent.name, 'analyst')
    assert.equal(subAgent.steps.length, 1)
    assert.equal(subAgent.steps[0].toolCalls.length, 1)
    assert.equal(subAgent.steps[0].toolCalls[0].toolName, 'queryData')
    assert.deepEqual(subAgent.steps[0].toolCalls[0].input, { sql: 'SELECT *' })
    assert.deepEqual(subAgent.steps[0].toolCalls[0].output, { rows: [] })
    assert.deepEqual(subAgent.steps[0].usage, { inputTokens: 5, outputTokens: 3 })
  })
```

- [ ] **Step 2: Add a new multi-step subagent test (breakdown + usage + ordering)**

Add this test immediately after the test from Step 1, inside the `SessionRecorder - recording` describe block:

```ts
  test('records a multi-step sub-agent with per-step usage and correct ordering', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('analyze')
    recorder.startToolCall('tc1', 'subagent_analyst', { task: 'analyze data' })
    recorder.startSubAgent('tc1', 'analyst', 'You are an analyst', 'analyze data', [])
    // Step 1: a tool call inside the sub-agent
    recorder.recordSubAgentStep('tc1', {
      messages: [{ role: 'assistant', content: [{ type: 'text', text: 'querying' }] }],
      usage: { inputTokens: 5, outputTokens: 2 },
      finishReason: 'tool-calls',
      toolCalls: [{ toolCallId: 'stc1', toolName: 'queryData', input: { sql: 'SELECT 1' } }],
      toolResults: [{ toolCallId: 'stc1', output: { rows: [1] } }]
    })
    // Step 2: final text answer
    recorder.recordSubAgentStep('tc1', {
      messages: [{ role: 'assistant', content: [{ type: 'text', text: 'the answer is 1' }] }],
      usage: { inputTokens: 8, outputTokens: 4 },
      finishReason: 'stop',
      toolCalls: [],
      toolResults: []
    })
    recorder.finishToolCall('tc1', 'analysis complete', 500)
    recorder.finishStep()
    recorder.addStepMessages([], undefined, 'stop')

    const subAgent = recorder.getTrace().turns[0].steps[0].toolCalls[0].subAgent!
    assert.equal(subAgent.steps.length, 2)
    assert.deepEqual(subAgent.steps[0].usage, { inputTokens: 5, outputTokens: 2 })
    assert.deepEqual(subAgent.steps[1].usage, { inputTokens: 8, outputTokens: 4 })

    // Overview: sub-agent tool-call/result entries appear, and the PARENT
    // tool-result appears AFTER the sub-agent-end (ordering fix).
    const overview = recorder.getTraceOverview()
    const subToolCall = overview.find(e => e.type === 'tool-call' && e.label.includes('queryData'))
    const subToolResult = overview.find(e => e.type === 'tool-result' && e.label.includes('queryData'))
    assert.ok(subToolCall, 'sub-agent tool-call entry exists')
    assert.ok(subToolResult, 'sub-agent tool-result entry exists')

    const subAgentEndIdx = overview.findIndex(e => e.type === 'sub-agent-end')
    const parentToolResultIdx = overview.findIndex(
      e => e.type === 'tool-result' && e.label.includes('subagent_analyst')
    )
    assert.ok(subAgentEndIdx >= 0, 'sub-agent-end entry exists')
    assert.ok(parentToolResultIdx >= 0, 'parent tool-result entry exists')
    assert.ok(parentToolResultIdx > subAgentEndIdx, 'parent tool-result comes after sub-agent-end')
  })
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test tests/features/agents/session-recorder.unit.spec.ts`
Expected: FAIL — `recordSubAgentStep` does not exist (TypeScript/runtime error), and the ordering assertion would fail even if it did, because the parent tool-result is currently timestamped at call start.

- [ ] **Step 4: Add `endTimestamp` to `ToolCallTrace`**

In `ui/src/traces/session-recorder.ts`, change the `ToolCallTrace` interface (currently lines 3-11) to add an optional `endTimestamp`:

```ts
export interface ToolCallTrace {
  id: string
  toolName: string
  input: any
  output: any
  timestamp: Date
  endTimestamp?: Date
  durationMs?: number
  subAgent?: SubAgentTrace
}
```

- [ ] **Step 5: Record `endTimestamp` in `finishToolCall`**

In `finishToolCall` (currently lines 115-123), set `endTimestamp` when the call finishes:

```ts
  finishToolCall (id: string, output: any, durationMs?: number): void {
    const tc = this.pendingToolCalls.get(id)
    if (tc) {
      tc.output = output
      tc.endTimestamp = new Date()
      // Auto-compute durationMs from timestamp if not provided
      tc.durationMs = durationMs ?? (Date.now() - tc.timestamp.getTime())
      this.pendingToolCalls.delete(id)
    }
  }
```

- [ ] **Step 6: Remove the four abandoned methods and the unused field**

In `ui/src/traces/session-recorder.ts`:

1. Delete the field declaration `private subAgentPendingToolCalls = new Map<string, Map<string, ToolCallTrace>>()` (currently line 83).
2. Delete the methods `startSubAgentToolCall` (lines 133-144), `finishSubAgentToolCall` (lines 146-153), `finishSubAgentStep` (lines 155-159), and `addSubAgentStepMessages` (lines 161-176). Keep `startSubAgent` (lines 125-131) — but remove the line inside it that initializes the deleted map.

After editing, `startSubAgent` must read exactly:

```ts
  startSubAgent (toolCallId: string, name: string, systemPrompt: string, task: string, tools: ToolSnapshot[], turnIndex?: number): void {
    const tc = this.pendingToolCalls.get(toolCallId)
    if (tc) {
      tc.subAgent = { name, systemPrompt, tools, task, steps: [], turnIndex }
    }
  }
```

- [ ] **Step 7: Add the `recordSubAgentStep` method**

In `ui/src/traces/session-recorder.ts`, add this method immediately after `startSubAgent`:

```ts
  recordSubAgentStep (toolCallId: string, step: {
    messages: ModelMessage[]
    usage?: { inputTokens?: number; outputTokens?: number }
    finishReason?: string
    toolCalls?: readonly { toolCallId: string; toolName: string; input: any }[]
    toolResults?: readonly { toolCallId: string; output: any }[]
  }): void {
    const tc = this.pendingToolCalls.get(toolCallId)
    if (!tc?.subAgent) return

    const resultByCallId = new Map<string, any>()
    for (const r of step.toolResults ?? []) resultByCallId.set(r.toolCallId, r.output)

    const now = new Date()
    const toolCalls: ToolCallTrace[] = (step.toolCalls ?? []).map(call => ({
      id: call.toolCallId,
      toolName: call.toolName,
      input: call.input,
      output: resultByCallId.get(call.toolCallId) ?? null,
      timestamp: now
    }))

    tc.subAgent.steps.push({
      timestamp: now,
      messages: step.messages,
      usage: step.usage
        ? { inputTokens: step.usage.inputTokens ?? 0, outputTokens: step.usage.outputTokens ?? 0 }
        : undefined,
      finishReason: step.finishReason,
      toolCalls
    })
  }
```

- [ ] **Step 8: Use `endTimestamp` for the parent tool-result overview entry (ordering fix)**

In `buildCache`, the parent tool-result entry is currently added (lines 308-311) using `tc.timestamp`. Change that `add(...)` call so the overview entry's `timestamp` uses the end time when available:

```ts
          add(
            { type: 'tool-result', timestamp: tc.endTimestamp ?? tc.timestamp, label: `tool result: ${tc.toolName}`, preview: (JSON.stringify(tc.output) ?? '').slice(0, 150) },
            { output: tc.output, toolName: tc.toolName, durationMs: tc.durationMs }
          )
```

Leave the sub-agent sub-tool-call/result entries (lines 285-302) unchanged — they already use `subTc.timestamp`, which `recordSubAgentStep` sets to the step time.

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npm run test tests/features/agents/session-recorder.unit.spec.ts`
Expected: PASS — all SessionRecorder tests, including the two updated/new subagent tests.

- [ ] **Step 10: Type-check**

Run: `npm run check-types`
Expected: PASS (no errors). If it reports `addSubAgentStepMessages` is still referenced, that reference is in `use-agent-chat.ts` and is removed in Task 2 — proceed to Task 2 and re-run there.

> Note: `check-types` covers the whole repo, so the dangling `use-agent-chat.ts` reference to the removed method may surface here. That is expected and resolved in Task 2.

- [ ] **Step 11: Commit**

```bash
git add ui/src/traces/session-recorder.ts tests/features/agents/session-recorder.unit.spec.ts
git commit -m "feat(trace): record subagent steps with full detail + fix tool-result ordering"
```

---

## Task 2: Wire `onStepFinish` into the subagent stream

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts:444-471`

- [ ] **Step 1: Pass `onStepFinish` to both `subAgent.stream(...)` branches and remove the final dump**

In `ui/src/composables/use-agent-chat.ts`, replace the block currently at lines 444-471 (from the `// First call:` comment through the `addSubAgentStepMessages` call) with:

```ts
            // Record each sub-agent step as it completes (tool calls, usage, messages)
            const onStepFinish = (step: any) => {
              if (!recorder) return
              recorder.recordSubAgentStep(parentToolCallId, {
                messages: step.response.messages,
                usage: step.usage,
                finishReason: step.finishReason,
                toolCalls: step.toolCalls,
                toolResults: step.toolResults
              })
            }

            // First call: single prompt. Subsequent calls: pass accumulated conversation history.
            const subResult = priorMessages.length === 0
              ? await subAgent.stream({ prompt: args.task, abortSignal, onStepFinish })
              : await subAgent.stream({
                messages: [...priorMessages, { role: 'user' as const, content: args.task }],
                abortSignal,
                onStepFinish
              })

            // Yield intermediate UIMessages as preliminary results (streaming progress)
            for await (const uiMessage of readUIMessageStream({ stream: subResult.toUIMessageStream() })) {
              const chatMessages = uiMessageToChatMessages(uiMessage)
              // Replace subAgentMessages on each yield (readUIMessageStream accumulates)
              if (currentAssistantMessage) {
                currentAssistantMessage.subAgentMessages = chatMessages
              }
              yield chatMessages
            }

            // Accumulate history for the next call to this subagent
            const subResponse = await subResult.response
            subAgentHistory.set(name, [
              ...priorMessages,
              { role: 'user' as const, content: args.task },
              ...subResponse.messages
            ])
```

This keeps the `subResponse`/`subAgentHistory` accumulation and the `subUsage`/`sessionUsage` block that follows (currently lines 472-478) unchanged. Only the `recorder.addSubAgentStepMessages(...)` call is removed (now handled per-step by `onStepFinish`).

- [ ] **Step 2: Type-check**

Run: `npm run check-types`
Expected: PASS. The removed `addSubAgentStepMessages` reference is gone, and `recordSubAgentStep` exists from Task 1. `step` is typed `any` to avoid coupling to the SDK's generic `StepResult` type; the field accesses match the verified `StepResult` shape.

- [ ] **Step 3: Lint**

Run: `npm run lint-fix`
Expected: PASS (pre-existing `v-html` warnings in `AgentChatMessages.vue` are unrelated and acceptable).

- [ ] **Step 4: Commit**

```bash
git add ui/src/composables/use-agent-chat.ts
git commit -m "feat(trace): feed subagent steps to recorder via onStepFinish"
```

---

## Task 3: Render the subagent task prompt as readable text in the debug dialog

**Files:**
- Modify: `ui/src/components/agent-chat/AgentChatDebugDialog.vue:206-243`

- [ ] **Step 1: Add a text rendering branch for `sub-agent-start`**

In `AgentChatDebugDialog.vue`, the trace entry detail is rendered (currently lines 206-243). The `sub-agent-start` detail content is `{ name, task, tools }`. Add a dedicated branch that shows the task as readable text above the raw JSON, so the input prompt is legible.

Replace the inner `<template v-if="traceEntryDetails[entry.index]">` block (lines 206-243) with:

```vue
                    <template v-if="traceEntryDetails[entry.index]">
                      <template v-if="entry.type === 'assistant-step' || entry.type === 'sub-agent-step'">
                        <div
                          v-if="traceEntryDetails[entry.index]?.content?.usage"
                          class="d-flex ga-2 my-2"
                        >
                          <v-chip
                            size="x-small"
                            variant="tonal"
                            color="info"
                            label
                          >
                            {{ t('input') }}: {{ traceEntryDetails[entry.index].content.usage.inputTokens?.toLocaleString() }}
                          </v-chip>
                          <v-chip
                            size="x-small"
                            variant="tonal"
                            color="warning"
                            label
                          >
                            {{ t('output') }}: {{ traceEntryDetails[entry.index].content.usage.outputTokens?.toLocaleString() }}
                          </v-chip>
                          <v-chip
                            v-if="traceEntryDetails[entry.index].content.finishReason"
                            size="x-small"
                            variant="tonal"
                            label
                          >
                            {{ traceEntryDetails[entry.index].content.finishReason }}
                          </v-chip>
                        </div>
                        <pre class="agent-chat__pre pa-2 mt-1">{{ JSON.stringify(traceEntryDetails[entry.index]?.content?.messages, null, 2) }}</pre>
                      </template>
                      <template v-else-if="entry.type === 'sub-agent-start'">
                        <div class="text-caption text-medium-emphasis mb-1">
                          {{ t('task') }}
                        </div>
                        <pre class="agent-chat__pre pa-2 mt-1">{{ traceEntryDetails[entry.index]?.content?.task }}</pre>
                        <div class="text-caption text-medium-emphasis mb-1 mt-2">
                          {{ t('tools') }}
                        </div>
                        <pre class="agent-chat__pre pa-2 mt-1">{{ JSON.stringify(traceEntryDetails[entry.index]?.content?.tools, null, 2) }}</pre>
                      </template>
                      <pre
                        v-else
                        class="agent-chat__pre pa-2 mt-1"
                      >{{ JSON.stringify(traceEntryDetails[entry.index]?.content, null, 2) }}</pre>
                    </template>
```

- [ ] **Step 2: Add the `task` i18n key**

In the same file's `<i18n>` block, add a `task` key to both locales. Under `fr:` (alongside `tools: Outils`):

```yaml
  task: Tâche
```

Under `en:` (alongside `tools: Tools`):

```yaml
  task: Task
```

- [ ] **Step 3: Type-check and lint**

Run: `npm run check-types && npm run lint-fix`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add ui/src/components/agent-chat/AgentChatDebugDialog.vue
git commit -m "feat(trace): show subagent task prompt as readable text in debug dialog"
```

---

## Task 4: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full quality checks**

Run: `npm run lint-fix`
Expected: PASS (only the pre-existing `v-html` warnings in `AgentChatMessages.vue`).

Run: `npm run check-types`
Expected: PASS (no errors).

Run: `npm run test tests/features/agents/session-recorder.unit.spec.ts`
Expected: PASS (all SessionRecorder + evaluator-tool tests).

- [ ] **Step 2: Docker build (per AGENTS.md quality checks)**

Run: `docker build -t agents .`
Expected: build succeeds.

- [ ] **Step 3: Manual verification of the trace UI**

In the running dev UI, enable tracing by setting `sessionStorage.setItem('agent-chat-trace', '1')` and opening the chat debug dialog (the chart icon). Run a chat turn that delegates to a subagent (a subagent must be configured for the agent). In the **Trace** tab confirm:
- A `sub-agent-start` entry shows the task prompt as readable text (not raw JSON).
- The subagent's internal `tool-call` and `tool-result` entries appear, each with its own input/output.
- `sub-agent-step` entries show per-step input/output token chips.
- The parent `tool-result` entry appears *after* the `sub-agent-end` entry (correct ordering).

If a subagent is not already configured, this manual check may be deferred — Steps 1-2 plus the unit tests in Task 1 are the authoritative automated verification.

---

## Self-review notes

- **Spec coverage:** Per-step breakdown (Task 1 `recordSubAgentStep` + Task 2 wiring); input prompt visibility (Task 3 + `startSubAgent` already records `task` per call); token usage per step (Task 1 stores `usage` per `StepTrace`, asserted in tests); nested subagent tool inputs (Task 1 pairs `toolCalls`/`toolResults` into `ToolCallTrace`). "Available everywhere" holds because the debug dialog, evaluator tools, and raw data all read the same `subAgent.steps` data.
- **Ordering:** Addressed via `endTimestamp` (Task 1 Steps 4-5, 8) and asserted in the new multi-step test.
- **Removed surface:** The four unused methods are deleted; their only external caller (`addSubAgentStepMessages` in `use-agent-chat.ts`) is removed in Task 2, and their only test usage is rewritten in Task 1.
- **Type names are consistent across tasks:** `recordSubAgentStep`, `ToolCallTrace.endTimestamp`, `StepTrace.{usage,finishReason,toolCalls}`.
