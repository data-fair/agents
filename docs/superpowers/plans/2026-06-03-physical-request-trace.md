# Physical-request tracing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture every physical HTTP request the subject chat session makes to the LLM gateway (full cumulative payload + reassembled response + token/perf metrics), interleave them into the existing in-memory trace, surface them in the debug dialog, and expose a one-shot summarizer tool to the evaluator.

**Architecture:** A custom `fetch` middleware installed on the subject session's AI-SDK provider (only when a recorder is present) captures each request. A pure helper reassembles the gateway's SSE/JSON response into `{ result, usage }`. The `SessionRecorder` stores physical requests in a flat list and merges them into its timestamp-ordered overview as a new `physical-request` entry type. Per-step token usage (redundant with physical requests) is removed from the semantic trace. History compaction is rerouted from a direct `/summary` fetch to a provider call so it too is captured.

**Tech Stack:** Vue 3, AI SDK (`ai@6.0.116`, `@ai-sdk/openai@3.0.41`), TypeScript, Playwright test runner (unit project).

---

## File Structure

**Created:**
- `ui/src/traces/gateway-response.ts` — pure parser: gateway SSE or JSON completion → `{ result, usage }`. Single responsibility, unit-tested in isolation.
- `tests/features/agents/gateway-response.unit.spec.ts` — unit tests for the parser.

**Modified:**
- `ui/src/traces/session-recorder.ts` — add `PhysicalRequestTrace` + `physicalRequests` + `recordPhysicalRequest` + overview emission of `physical-request` entries; remove `StepTrace.usage` and its plumbing.
- `ui/src/composables/use-agent-chat.ts` — install the capturing `fetch`, inject `x-trace-ctx` headers (main + subagents + compaction), reroute compaction through the provider, drop `usage` args to recorder calls.
- `ui/src/components/agent-chat/AgentChatDebugDialog.vue` — render `physical-request` entries; remove per-step usage chips.
- `ui/src/traces/evaluator-tools.ts` — add `summarizePhysicalRequest` tool; widen `buildEvaluatorTools` signature.
- `ui/src/components/AgentChat.vue` — pass account info into `buildEvaluatorTools`; mention the new tool in the evaluator prompt.
- `tests/features/agents/session-recorder.unit.spec.ts` — update tests that asserted `StepTrace.usage`; add physical-request coverage.

---

## Task 1: Pure gateway-response parser

**Files:**
- Create: `ui/src/traces/gateway-response.ts`
- Test: `tests/features/agents/gateway-response.unit.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/features/agents/gateway-response.unit.spec.ts`:

```ts
/**
 * Unit tests for the gateway-response parser.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { parseGatewayCompletion } from '../../../ui/src/traces/gateway-response.ts'

test.describe('parseGatewayCompletion', () => {
  test('reassembles a streaming text completion + usage', () => {
    const sse = [
      'data: {"choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}', '',
      'data: {"choices":[{"index":0,"delta":{"content":"Hel"},"finish_reason":null}]}', '',
      'data: {"choices":[{"index":0,"delta":{"content":"lo"},"finish_reason":null}]}', '',
      'data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":100,"completion_tokens":5,"total_tokens":105}}', '',
      'data: [DONE]', ''
    ].join('\n')
    const { result, usage } = parseGatewayCompletion(sse)
    assert.equal(result.content, 'Hello')
    assert.equal(result.finishReason, 'stop')
    assert.equal(result.toolCalls.length, 0)
    assert.deepEqual(usage, { inputTokens: 100, outputTokens: 5 })
  })

  test('reassembles streaming tool calls', () => {
    const sse = [
      'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"search","arguments":""}}]},"finish_reason":null}]}', '',
      'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"q\\":"}}]},"finish_reason":null}]}', '',
      'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\\"x\\"}"}}]},"finish_reason":null}]}', '',
      'data: {"choices":[{"index":0,"delta":{},"finish_reason":"tool_calls"}],"usage":{"prompt_tokens":30,"completion_tokens":10,"total_tokens":40}}', '',
      'data: [DONE]', ''
    ].join('\n')
    const { result, usage } = parseGatewayCompletion(sse)
    assert.equal(result.toolCalls.length, 1)
    assert.equal(result.toolCalls[0].id, 'call_1')
    assert.equal(result.toolCalls[0].name, 'search')
    assert.equal(result.toolCalls[0].arguments, '{"q":"x"}')
    assert.equal(result.finishReason, 'tool_calls')
    assert.deepEqual(usage, { inputTokens: 30, outputTokens: 10 })
  })

  test('parses a non-streaming JSON completion (compaction path)', () => {
    const json = JSON.stringify({
      id: 'chatcmpl-1', object: 'chat.completion', created: 1, model: 'summarizer',
      choices: [{ index: 0, message: { role: 'assistant', content: 'summary text' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 50, completion_tokens: 8, total_tokens: 58 }
    })
    const { result, usage } = parseGatewayCompletion(json)
    assert.equal(result.content, 'summary text')
    assert.equal(result.finishReason, 'stop')
    assert.deepEqual(usage, { inputTokens: 50, outputTokens: 8 })
  })

  test('returns zeros on unparseable input rather than throwing', () => {
    const { result, usage } = parseGatewayCompletion('not json, not sse')
    assert.equal(result.content, '')
    assert.deepEqual(usage, { inputTokens: 0, outputTokens: 0 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/agents/gateway-response.unit.spec.ts`
Expected: FAIL — cannot resolve `../../../ui/src/traces/gateway-response.ts` (module does not exist).

- [ ] **Step 3: Write minimal implementation**

Create `ui/src/traces/gateway-response.ts`:

```ts
/**
 * Pure parser for the agents gateway's OpenAI-compatible responses.
 * Handles both the streaming SSE form (chat.completion.chunk events) and the
 * non-streaming JSON form (a single chat.completion object). Never throws.
 */

export interface GatewayResult {
  content: string
  toolCalls: { id: string; name: string; arguments: string }[]
  finishReason?: string
}

export interface GatewayUsage {
  inputTokens: number
  outputTokens: number
}

export function parseGatewayCompletion (raw: string): { result: GatewayResult; usage: GatewayUsage } {
  return raw.trimStart().startsWith('data:') ? parseSSE(raw) : parseJson(raw)
}

function parseSSE (raw: string): { result: GatewayResult; usage: GatewayUsage } {
  let content = ''
  const toolCalls: { id: string; name: string; arguments: string }[] = []
  let finishReason: string | undefined
  let inputTokens = 0
  let outputTokens = 0

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) continue
    const data = trimmed.slice(5).trim()
    if (!data || data === '[DONE]') continue
    let chunk: any
    try { chunk = JSON.parse(data) } catch { continue }

    const choice = chunk.choices?.[0]
    const delta = choice?.delta
    if (typeof delta?.content === 'string') content += delta.content
    if (Array.isArray(delta?.tool_calls)) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0
        if (!toolCalls[idx]) toolCalls[idx] = { id: '', name: '', arguments: '' }
        if (tc.id) toolCalls[idx].id = tc.id
        if (tc.function?.name) toolCalls[idx].name = tc.function.name
        if (typeof tc.function?.arguments === 'string') toolCalls[idx].arguments += tc.function.arguments
      }
    }
    if (choice?.finish_reason) finishReason = choice.finish_reason
    if (chunk.usage) {
      inputTokens = chunk.usage.prompt_tokens ?? 0
      outputTokens = chunk.usage.completion_tokens ?? 0
    }
  }

  return { result: { content, toolCalls: toolCalls.filter(Boolean), finishReason }, usage: { inputTokens, outputTokens } }
}

function parseJson (raw: string): { result: GatewayResult; usage: GatewayUsage } {
  let obj: any
  try { obj = JSON.parse(raw) } catch {
    return { result: { content: '', toolCalls: [], finishReason: undefined }, usage: { inputTokens: 0, outputTokens: 0 } }
  }
  const choice = obj.choices?.[0]
  const msg = choice?.message ?? {}
  const toolCalls = Array.isArray(msg.tool_calls)
    ? msg.tool_calls.map((tc: any) => ({ id: tc.id ?? '', name: tc.function?.name ?? '', arguments: tc.function?.arguments ?? '' }))
    : []
  return {
    result: { content: msg.content ?? '', toolCalls, finishReason: choice?.finish_reason },
    usage: { inputTokens: obj.usage?.prompt_tokens ?? 0, outputTokens: obj.usage?.completion_tokens ?? 0 }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/features/agents/gateway-response.unit.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add ui/src/traces/gateway-response.ts tests/features/agents/gateway-response.unit.spec.ts
git commit -m "feat(trace): pure parser for gateway SSE/JSON completions"
```

---

## Task 2: Recorder — store and surface physical requests

**Files:**
- Modify: `ui/src/traces/session-recorder.ts`
- Test: `tests/features/agents/session-recorder.unit.spec.ts`

- [ ] **Step 1: Write the failing test**

Append this `test.describe` block to `tests/features/agents/session-recorder.unit.spec.ts`:

```ts
test.describe('SessionRecorder - physical requests', () => {
  test('records a physical request and surfaces it with inline metrics', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('hi')
    recorder.recordPhysicalRequest({
      contextId: 'main:0',
      timestamp: new Date('2020-01-01T00:00:00.500Z'),
      modelRole: 'assistant',
      requestBody: { model: 'assistant', messages: [{ role: 'user', content: 'hi' }], tools: [] },
      result: { content: 'hello', toolCalls: [], finishReason: 'stop' },
      inputTokens: 100,
      outputTokens: 20,
      messageCount: 1,
      toolCount: 0,
      bodyChars: 42,
      durationMs: 1200,
      timeToFirstChunkMs: 300
    })

    const overview = recorder.getTraceOverview()
    const pr = overview.find(e => e.type === 'physical-request')
    assert.ok(pr, 'physical-request entry exists')
    assert.ok(pr.label.includes('assistant'))
    assert.ok(pr.preview.includes('100 in'))
    assert.ok(pr.preview.includes('20 out'))

    const detail = recorder.getTraceEntry(pr.index)!
    assert.equal(detail.content.inputTokens, 100)
    assert.equal(detail.content.outputTokens, 20)
    assert.equal(detail.content.requestBody.messages.length, 1)
    assert.equal(detail.content.result.content, 'hello')
  })

  test('orders a physical request before the step it produced', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('hi')
    recorder.recordPhysicalRequest({
      contextId: 'main:0',
      timestamp: new Date('2020-01-01T00:00:00Z'),
      modelRole: 'assistant',
      requestBody: { model: 'assistant', messages: [], tools: [] },
      result: { content: 'hello', toolCalls: [], finishReason: 'stop' },
      inputTokens: 1, outputTokens: 1, messageCount: 0, toolCount: 0, bodyChars: 2, durationMs: 1
    })
    recorder.addStepMessages([{ role: 'assistant', content: [{ type: 'text', text: 'hello' }] }], undefined, 'stop')

    // Force the assistant step to a later timestamp than the physical request.
    recorder.getTrace().turns[0].steps[recorder.getTrace().turns[0].steps.length - 1].timestamp =
      new Date('2020-01-01T00:00:01Z')

    const overview = recorder.getTraceOverview()
    const prIdx = overview.findIndex(e => e.type === 'physical-request')
    const stepIdx = overview.findIndex(e => e.type === 'assistant-step')
    assert.ok(prIdx >= 0 && stepIdx >= 0)
    assert.ok(prIdx < stepIdx, 'physical-request sorts before its assistant-step')
  })
})
```

NOTE: this test also calls `addStepMessages([...], 'stop')` with the **new** two-argument signature introduced in Task 3. To keep Task 2 self-contained and passing, for now use the current signature `addStepMessages([{ role: 'assistant', content: [{ type: 'text', text: 'hello' }] }], undefined, 'stop')` in the second test, and change it to the two-arg form in Task 3.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/agents/session-recorder.unit.spec.ts`
Expected: FAIL — `recorder.recordPhysicalRequest is not a function`.

- [ ] **Step 3: Write the implementation**

In `ui/src/traces/session-recorder.ts`:

(a) Add the type after `StepTrace` (after line 20):

```ts
export interface PhysicalRequestTrace {
  contextId: string
  timestamp: Date
  modelRole: string
  requestBody: any
  result: { content: string; toolCalls: { id: string; name: string; arguments: string }[]; finishReason?: string }
  inputTokens: number
  outputTokens: number
  messageCount: number
  toolCount: number
  bodyChars: number
  durationMs: number
  timeToFirstChunkMs?: number
}
```

(b) Add `physicalRequests` to `SessionTrace` (interface at line 50):

```ts
export interface SessionTrace {
  systemPrompt: string
  toolSnapshots: ToolSnapshot[][]
  toolChanges: ToolChangeEvent[]
  turns: TurnTrace[]
  physicalRequests: PhysicalRequestTrace[]
}
```

(c) Add `'physical-request'` to the `TraceOverviewEntry['type']` union (line 59) — insert before `'tools-changed'`:

```ts
  type: 'system-prompt' | 'user-message' | 'hidden-context' | 'assistant-step' | 'tool-call' | 'tool-result' | 'sub-agent-start' | 'sub-agent-system-prompt' | 'sub-agent-step' | 'sub-agent-end' | 'physical-request' | 'tools-changed' | 'compaction'
```

(d) Initialise `physicalRequests` in the private `trace` literal (line 74):

```ts
  private trace: SessionTrace = {
    systemPrompt: '',
    toolSnapshots: [],
    toolChanges: [],
    turns: [],
    physicalRequests: []
  }
```

(e) Add the recorder method (place it right after `recordCompaction`, before `finishStep`):

```ts
  recordPhysicalRequest (entry: PhysicalRequestTrace): void {
    this.trace.physicalRequests.push(entry)
  }
```

(f) In `buildCache`, emit physical-request entries. Insert this loop right after the `toolChanges` loop and before `items.sort(...)` (i.e. after line 319, before line 321):

```ts
    for (const pr of this.trace.physicalRequests) {
      add(
        {
          type: 'physical-request',
          timestamp: pr.timestamp,
          label: `physical request: ${pr.modelRole}`,
          preview: `${pr.inputTokens} in · ${pr.outputTokens} out · ${pr.messageCount} msgs · ${pr.toolCount} tools · ${Math.round(pr.durationMs)}ms`
        },
        {
          modelRole: pr.modelRole,
          inputTokens: pr.inputTokens,
          outputTokens: pr.outputTokens,
          messageCount: pr.messageCount,
          toolCount: pr.toolCount,
          bodyChars: pr.bodyChars,
          durationMs: pr.durationMs,
          timeToFirstChunkMs: pr.timeToFirstChunkMs,
          finishReason: pr.result.finishReason,
          requestBody: pr.requestBody,
          result: pr.result
        }
      )
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/features/agents/session-recorder.unit.spec.ts`
Expected: PASS (including the two new physical-request tests; all pre-existing tests still pass — `StepTrace.usage` is untouched in this task).

- [ ] **Step 5: Commit**

```bash
git add ui/src/traces/session-recorder.ts tests/features/agents/session-recorder.unit.spec.ts
git commit -m "feat(trace): record physical requests and surface them in the overview"
```

---

## Task 3: Remove per-step `StepTrace.usage` (single source of truth)

**Files:**
- Modify: `ui/src/traces/session-recorder.ts`
- Modify: `ui/src/composables/use-agent-chat.ts:447-453,560-565`
- Test: `tests/features/agents/session-recorder.unit.spec.ts`

- [ ] **Step 1: Update the recorder to drop `usage`**

In `ui/src/traces/session-recorder.ts`:

(a) Remove the `usage` field from `StepTrace` (line 17). The interface becomes:

```ts
export interface StepTrace {
  timestamp: Date
  messages: ModelMessage[]
  finishReason?: string
  toolCalls: ToolCallTrace[]
}
```

(b) In `recordSubAgentStep`, drop `usage` from the input type and the stored object. The method signature's `step` type loses `usage`, and the pushed step loses the `usage:` property:

```ts
  recordSubAgentStep (toolCallId: string, step: {
    messages: ModelMessage[]
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
      finishReason: step.finishReason,
      toolCalls
    })
  }
```

(c) Change `addStepMessages` to drop the `usage` parameter and assignments. New version:

```ts
  addStepMessages (messages: ModelMessage[], finishReason?: string): void {
    if (!this.currentTurn) return

    const lastPushedStep = this.currentTurn.steps[this.currentTurn.steps.length - 1]
    const finishStepWasCalled = lastPushedStep && this.currentStep && !this.currentTurn.steps.includes(this.currentStep)

    if (finishStepWasCalled) {
      if (this.currentStep && messages.length > 0) {
        this.currentStep.messages = messages
        this.currentStep.finishReason = finishReason
        this.currentTurn.steps.push(this.currentStep)
      } else {
        lastPushedStep.finishReason = finishReason
      }
    } else if (this.currentStep) {
      this.currentStep.messages = messages
      this.currentStep.finishReason = finishReason
      this.currentTurn.steps.push(this.currentStep)
    }

    this.currentStep = null
  }
```

(d) In `buildCache`, drop `usage` from the two step-detail objects:
- Line ~287 (`sub-agent-step` detail): change `{ messages: subStep.messages, usage: subStep.usage, finishReason: subStep.finishReason }` to `{ messages: subStep.messages, finishReason: subStep.finishReason }`.
- Line ~307 (`assistant-step` detail): change `{ messages: step.messages, usage: step.usage, finishReason: step.finishReason }` to `{ messages: step.messages, finishReason: step.finishReason }`.

- [ ] **Step 2: Update the recorder callers in `use-agent-chat.ts`**

(a) In the sub-agent `onStepFinish` (lines 445-454), remove the `usage` line:

```ts
            const onStepFinish = (step: any) => {
              if (!recorder) return
              recorder.recordSubAgentStep(parentToolCallId, {
                messages: step.response.messages,
                finishReason: step.finishReason,
                toolCalls: step.toolCalls,
                toolResults: step.toolResults
              })
            }
```

(b) At line 563-565, drop the usage argument to `addStepMessages` (keep the separate `sessionUsage` accumulation at lines 566-572 untouched):

```ts
      if (recorder) {
        recorder.addStepMessages(response.messages, (response as any).finishReason)
      }
```

- [ ] **Step 3: Update existing tests that asserted `StepTrace.usage`**

In `tests/features/agents/session-recorder.unit.spec.ts`, make these edits:

- Line 15: `recorder.addStepMessages([{ role: 'assistant', content: [{ type: 'text', text: 'hi' }] }], 'stop')`
- Test `'finishStep + addStepMessages sets usage and finishReason on the step'` (lines 32-55): rename to `'finishStep + addStepMessages sets finishReason on the step'`; change the call to `recorder.addStepMessages([{ role: 'assistant', content: [{ type: 'text', text: 'done' }] }], 'stop')`; delete the `assert.equal(...steps[0].usage, undefined)` line (49) and the `assert.deepEqual(responseStep.usage, ...)` line (53). Keep the `finishReason` and `messages.length` assertions.
- Test `'records multi-step turns'` (lines 69-73): `recorder.addStepMessages([{ role: 'assistant', content: [{ type: 'text', text: 'all done' }] }], 'stop')`
- Test `'records tool calls within a step'` (line 88): `recorder.addStepMessages([], 'stop')`
- Test `'records sub-agent traces within a tool call'`: in the `recordSubAgentStep` call (lines 103-109) delete the `usage: { inputTokens: 5, outputTokens: 3 },` line; delete the `assert.deepEqual(subAgent.steps[0].usage, ...)` assertion (line 123).
- Test `'records a multi-step sub-agent with per-step usage and correct ordering'`: rename to `'records a multi-step sub-agent with correct ordering'`; delete the `usage:` line from both `recordSubAgentStep` calls (lines 133, 140); change `addStepMessages([], undefined, 'stop')` (line 147) to `addStepMessages([], 'stop')`; delete the two `assert.deepEqual(subAgent.steps[N].usage, ...)` lines (151-152). Keep all ordering and finishReason assertions.
- `buildRecorderWithTrace` helpers at lines 207-211 and 267-271: change to `recorder.addStepMessages([...], 'stop')` (drop the usage object argument).
- In the Task 2 physical-request ordering test, change the `addStepMessages([...], undefined, 'stop')` placeholder to `addStepMessages([...], 'stop')`.

- [ ] **Step 4: Run the full unit spec to verify it passes**

Run: `npm run test tests/features/agents/session-recorder.unit.spec.ts`
Expected: PASS (all tests; no remaining references to `StepTrace.usage`).

- [ ] **Step 5: Type-check**

Run: `npm run check-types`
Expected: no errors related to `usage` / `addStepMessages` / `recordSubAgentStep`.

- [ ] **Step 6: Commit**

```bash
git add ui/src/traces/session-recorder.ts ui/src/composables/use-agent-chat.ts tests/features/agents/session-recorder.unit.spec.ts
git commit -m "refactor(trace): drop redundant per-step usage; physical requests are the source of truth"
```

---

## Task 4: Install the capturing `fetch` + correlation headers

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts` (imports, provider creation at 208-211, sendMessage at 353-372, main streamText at 502-512, subagent stream at 421-463)

- [ ] **Step 1: Add imports**

At the top of `ui/src/composables/use-agent-chat.ts`:
- Line 2: add `generateText` to the `ai` import:

```ts
import { streamText, generateText, stepCountIs, tool, jsonSchema, ToolLoopAgent, readUIMessageStream } from 'ai'
```

- After line 9 (`import { extractErrorMessage } from '~/utils/error'`), add:

```ts
import { parseGatewayCompletion } from '~/traces/gateway-response'
```

- [ ] **Step 2: Define the capturing fetch and wire it into the provider**

Replace the provider creation (lines 208-211) with the helpers + a conditionally-wrapped provider:

```ts
  function traceCtxOf (headers: HeadersInit | undefined): string {
    if (!headers) return 'unknown'
    try { return new Headers(headers).get('x-trace-ctx') ?? 'unknown' } catch { return 'unknown' }
  }

  async function capturePhysicalResponse (
    response: Response,
    ctx: { requestBody: any; bodyChars: number; contextId: string; timestamp: Date; startMs: number }
  ): Promise<void> {
    if (!recorder) return
    try {
      const reader = response.body?.getReader()
      if (!reader) return
      const decoder = new TextDecoder()
      let raw = ''
      let timeToFirstChunkMs: number | undefined
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (value && timeToFirstChunkMs === undefined) timeToFirstChunkMs = performance.now() - ctx.startMs
        raw += decoder.decode(value, { stream: true })
      }
      raw += decoder.decode()
      const durationMs = performance.now() - ctx.startMs
      const { result, usage } = parseGatewayCompletion(raw)
      const messages = Array.isArray(ctx.requestBody?.messages) ? ctx.requestBody.messages : []
      const tools = Array.isArray(ctx.requestBody?.tools) ? ctx.requestBody.tools : []
      recorder.recordPhysicalRequest({
        contextId: ctx.contextId,
        timestamp: ctx.timestamp,
        modelRole: typeof ctx.requestBody?.model === 'string' ? ctx.requestBody.model : 'unknown',
        requestBody: ctx.requestBody,
        result,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        messageCount: messages.length,
        toolCount: tools.length,
        bodyChars: ctx.bodyChars,
        durationMs,
        timeToFirstChunkMs
      })
    } catch (err) {
      debug('physical-request capture failed: %O', err)
    }
  }

  const tracingFetch: typeof fetch = async (input, init) => {
    if (!recorder || !init || typeof init.body !== 'string') {
      return fetch(input as any, init)
    }
    let requestBody: any
    try { requestBody = JSON.parse(init.body) } catch { return fetch(input as any, init) }
    const contextId = traceCtxOf(init.headers)
    const timestamp = new Date()
    const startMs = performance.now()
    const res = await fetch(input as any, init)
    void capturePhysicalResponse(res.clone(), { requestBody, bodyChars: init.body.length, contextId, timestamp, startMs })
    return res
  }

  const provider = createOpenAI({
    baseURL: `${window.location.origin}${$apiPath}/gateway/${options.accountType}/${options.accountId}/v1`,
    apiKey: 'unused',
    ...(recorder ? { fetch: tracingFetch } : {})
  })
```

NOTE: if `check-types` rejects `fetch: tracingFetch` due to the SDK's `FetchFunction` type, cast at the call site: `fetch: tracingFetch as unknown as typeof fetch` is already the right type; if needed use `fetch: tracingFetch as any`.

- [ ] **Step 3: Add a per-turn context id and pass the header to the main agent**

In `sendMessage` (line 353), add a turn sequence counter. First, at composable scope near line 117 (next to `let abortController`), add:

```ts
  let turnSeq = 0
```

Then inside `sendMessage`, right after `status.value = 'streaming'` (line 356), add:

```ts
    const turnId = turnSeq++
    const turnCtxId = `main:${turnId}`
    const compactionCtxId = `compaction:${turnId}`
```

Pass the header to the main `streamText` call (line 502-512) by adding a `headers` property:

```ts
      const result = streamText({
        model: provider.chat(chatModelName),
        system: options.systemPrompt,
        messages: history,
        tools: Object.keys(mainLLMTools).length > 0 ? mainLLMTools : undefined,
        stopWhen: stepCountIs(10),
        abortSignal: abortController.signal,
        ...(recorder ? { headers: { 'x-trace-ctx': turnCtxId } } : {}),
        onError: ({ error: err }) => {
          streamError = err
        }
      })
```

- [ ] **Step 4: Pass the header to each subagent stream**

In the subagent `execute` generator, after `parentToolCallId` is computed (line 421-423), add:

```ts
            const subCtxId = `sub:${parentToolCallId}`
```

Then add `headers` to **both** `subAgent.stream(...)` branches (lines 457-463):

```ts
            const subResult = priorMessages.length === 0
              ? await subAgent.stream({ prompt: args.task, abortSignal, onStepFinish, ...(recorder ? { headers: { 'x-trace-ctx': subCtxId } } : {}) })
              : await subAgent.stream({
                messages: [...priorMessages, { role: 'user' as const, content: args.task }],
                abortSignal,
                onStepFinish,
                ...(recorder ? { headers: { 'x-trace-ctx': subCtxId } } : {})
              })
```

- [ ] **Step 5: Type-check**

Run: `npm run check-types`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add ui/src/composables/use-agent-chat.ts
git commit -m "feat(trace): capture physical requests via provider fetch middleware + correlation headers"
```

---

## Task 5: Reroute compaction through the provider

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts:306-351` (`compactHistory`) and its caller at line 368

- [ ] **Step 1: Replace the `/summary` fetch with a provider call**

Rewrite `compactHistory` (lines 306-351) to take the compaction context id and use `generateText` through the provider:

```ts
  async function compactHistory (compactionCtxId: string): Promise<void> {
    const threshold = Number(sessionStorage.getItem('agent-chat-compaction-threshold')) || COMPACTION_THRESHOLD
    const serialized = JSON.stringify(history)
    if (serialized.length < threshold) return

    // Summarize all messages except the latest user message, which we preserve verbatim
    const lastMessage = history[history.length - 1]
    const historyToCompact = history.slice(0, -1)
    if (historyToCompact.length === 0) return

    const prompt = 'You are summarizing a conversation history between a user and an AI assistant that uses tools. Preserve all key facts, decisions, tool results, and context needed to continue the conversation naturally. Be concise but complete.'

    try {
      const { text: summary } = await generateText({
        model: provider.chat('summarizer'),
        system: prompt,
        messages: [{ role: 'user' as const, content: JSON.stringify(historyToCompact) }],
        ...(recorder ? { headers: { 'x-trace-ctx': compactionCtxId } } : {})
      })

      const originalHistory = history
      const originalLength = serialized.length

      history = [
        { role: 'user' as const, content: `[Previous conversation summary]\n${summary}` },
        lastMessage
      ]

      if (recorder) {
        recorder.recordCompaction(originalHistory, summary, originalLength, JSON.stringify(history).length)
      }

      debug('compacted history from %d chars to %d chars', originalLength, JSON.stringify(history).length)
    } catch (err) {
      debug('compaction error, continuing with full history: %O', err)
    }
  }
```

- [ ] **Step 2: Update the caller**

At line 368, pass the compaction context id:

```ts
    // Compact history if it exceeds the threshold
    await compactHistory(compactionCtxId)
```

- [ ] **Step 3: Type-check**

Run: `npm run check-types`
Expected: no errors.

- [ ] **Step 4: Verify the summarizer→assistant fallback is preserved (read-only check)**

Confirm `api/src/gateway/router.ts:29-38` (`getModelConfig`) falls back to `assistant` when `settings.models.summarizer` is unset. No code change — this is why routing compaction through `provider.chat('summarizer')` does not regress when no summarizer model is configured.

- [ ] **Step 5: Commit**

```bash
git add ui/src/composables/use-agent-chat.ts
git commit -m "feat(trace): route history compaction through the provider so it is captured"
```

---

## Task 6: Render physical-request entries in the debug dialog

**Files:**
- Modify: `ui/src/components/agent-chat/AgentChatDebugDialog.vue` (template 207-252, i18n 265-296, script 343-359)

- [ ] **Step 1: Replace the step-entry detail block (remove usage chips) and add the physical-request branch**

Replace the template block at lines 206-253 (the `<template v-if="traceEntryDetails[entry.index]">` ... `</template>` body) with:

```html
                    <template v-if="traceEntryDetails[entry.index]">
                      <template v-if="entry.type === 'assistant-step' || entry.type === 'sub-agent-step'">
                        <v-chip
                          v-if="traceEntryDetails[entry.index]?.content?.finishReason"
                          size="x-small"
                          variant="tonal"
                          label
                          class="my-2"
                        >
                          {{ traceEntryDetails[entry.index].content.finishReason }}
                        </v-chip>
                        <pre class="agent-chat__pre pa-2 mt-1">{{ JSON.stringify(traceEntryDetails[entry.index]?.content?.messages, null, 2) }}</pre>
                      </template>
                      <template v-else-if="entry.type === 'physical-request'">
                        <div class="d-flex flex-wrap ga-2 my-2">
                          <v-chip size="x-small" variant="tonal" color="info" label>
                            {{ t('input') }}: {{ traceEntryDetails[entry.index].content.inputTokens?.toLocaleString() }}
                          </v-chip>
                          <v-chip size="x-small" variant="tonal" color="warning" label>
                            {{ t('output') }}: {{ traceEntryDetails[entry.index].content.outputTokens?.toLocaleString() }}
                          </v-chip>
                          <v-chip size="x-small" variant="tonal" label>
                            {{ traceEntryDetails[entry.index].content.messageCount }} {{ t('messages') }}
                          </v-chip>
                          <v-chip size="x-small" variant="tonal" label>
                            {{ traceEntryDetails[entry.index].content.toolCount }} {{ t('tools').toLowerCase() }}
                          </v-chip>
                          <v-chip size="x-small" variant="tonal" label>
                            {{ round(traceEntryDetails[entry.index].content.durationMs) }} ms
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
                        <div class="text-caption text-medium-emphasis mb-1 mt-2">
                          {{ t('request') }}
                        </div>
                        <pre class="agent-chat__pre pa-2 mt-1">{{ JSON.stringify(traceEntryDetails[entry.index]?.content?.requestBody, null, 2) }}</pre>
                        <div class="text-caption text-medium-emphasis mb-1 mt-2">
                          {{ t('response') }}
                        </div>
                        <pre class="agent-chat__pre pa-2 mt-1">{{ JSON.stringify(traceEntryDetails[entry.index]?.content?.result, null, 2) }}</pre>
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

- [ ] **Step 2: Add the `round` helper and the entry colour**

In `<script setup>`, add a `round` helper (after `formatTraceTime`, line 363):

```ts
const round = (n: number) => Math.round(n)
```

In `traceEntryColor`'s `colors` map (lines 344-357), add the physical-request colour (insert before `'tools-changed'`):

```ts
    'physical-request': 'teal',
```

- [ ] **Step 3: Add i18n keys**

In the `<i18n>` block, add `messages`, `request`, `response` to both locales:

Under `fr:` (after line 280 `output: sortie`):

```yaml
  messages: messages
  request: Requête
  response: Réponse
```

Under `en:` (after line 295 `output: output`):

```yaml
  messages: messages
  request: Request
  response: Response
```

- [ ] **Step 4: Lint + type-check**

Run: `npm run lint-fix && npm run check-types`
Expected: no new errors (the two pre-existing `v-html` warnings in `AgentChatMessages.vue` are unrelated).

- [ ] **Step 5: Commit**

```bash
git add ui/src/components/agent-chat/AgentChatDebugDialog.vue
git commit -m "feat(trace): render physical-request entries; drop per-step usage chips"
```

---

## Task 7: Expose `summarizePhysicalRequest` to the evaluator

**Files:**
- Modify: `ui/src/traces/evaluator-tools.ts`
- Modify: `ui/src/components/AgentChat.vue:182-188,196`
- Test: `tests/features/agents/session-recorder.unit.spec.ts` (evaluator-tools describe block)

- [ ] **Step 1: Write the failing test**

In `tests/features/agents/session-recorder.unit.spec.ts`, inside the existing `test.describe('Evaluator tools', ...)` block, add:

```ts
  test('summarizePhysicalRequest rejects a non-physical entry without calling the model', async () => {
    const recorder = buildRecorderWithTrace()
    const tools = buildEvaluatorTools(recorder, { accountType: 'user', accountId: 'alice', apiPath: '/agents/api' })
    assert.ok(tools.summarizePhysicalRequest)
    // index 0 is the system-prompt entry, not a physical request
    const result = await (tools.summarizePhysicalRequest as any).execute({ index: 0 })
    assert.ok(typeof result === 'string')
    assert.ok(result.toLowerCase().includes('not a physical-request'))
  })
```

Also update the three existing evaluator-tools tests to use the new two-argument `buildEvaluatorTools` signature: change `buildEvaluatorTools(recorder)` to `buildEvaluatorTools(recorder, { accountType: 'user', accountId: 'alice', apiPath: '/agents/api' })` in the tests at lines 277, 286, 294.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/agents/session-recorder.unit.spec.ts`
Expected: FAIL — `buildEvaluatorTools` expects 1 arg / `tools.summarizePhysicalRequest` undefined.

- [ ] **Step 3: Implement the tool**

Rewrite `ui/src/traces/evaluator-tools.ts`:

```ts
import { tool, jsonSchema } from 'ai'
import type { Tool } from 'ai'
import type { SessionRecorder, TraceOverviewEntry } from './session-recorder.js'

const PHYSICAL_REQUEST_SUMMARY_PROMPT = `You analyze a single physical LLM request payload (the full cumulative context that was sent to the model). Produce three sections:

1. Context composition — the system prompt size, how many messages and of which roles, the bulk taken by tool definitions, and the size of tool-result payloads. Quantify what fills the context.
2. Waste / optimization signals — stale or repeated tool results, boilerplate that recurs across turns, large rarely-used tool schemas, and content that compaction could safely drop.
3. Faithful content digest — a neutral, readable summary of the actual conversation in this request (what the user, assistant, and tools said), so the reader can judge behaviour without reading the raw payload.

Be concise and specific.`

export function buildEvaluatorTools (
  recorder: SessionRecorder,
  opts: { accountType: string; accountId: string; apiPath: string }
): Record<string, Tool> {
  return {
    getTraceOverview: tool({
      description: 'List all trace entries in chronological order. Returns index, type, timestamp, label, and preview for each entry.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {},
        required: []
      }),
      execute: async () => {
        const overview = recorder.getTraceOverview()
        return overview.map((e: TraceOverviewEntry) =>
          `[${e.index}] ${e.type} | ${e.timestamp.toISOString()} | ${e.label} | ${e.preview}`
        ).join('\n')
      }
    }),

    getTraceEntry: tool({
      description: 'Get full detail for one trace entry by its index.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          index: { type: 'number', description: 'The index of the trace entry to retrieve' }
        },
        required: ['index']
      }),
      execute: async (args: { index: number }) => {
        const entry = recorder.getTraceEntry(args.index)
        if (!entry) return 'Entry not found'
        return JSON.stringify(entry, null, 2)
      }
    }),

    getTraceEntries: tool({
      description: 'Get a range of trace entries in full detail.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          fromIndex: { type: 'number', description: 'Start index (inclusive)' },
          toIndex: { type: 'number', description: 'End index (inclusive)' }
        },
        required: ['fromIndex', 'toIndex']
      }),
      execute: async (args: { fromIndex: number; toIndex: number }) => {
        const entries = recorder.getTraceEntries(args.fromIndex, args.toIndex)
        return JSON.stringify(entries, null, 2)
      }
    }),

    getSessionConfig: tool({
      description: 'Get the system prompt and tools definitions for the session.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {},
        required: []
      }),
      execute: async () => {
        const trace = recorder.getTrace()
        const latestTools = trace.toolSnapshots.length > 0
          ? trace.toolSnapshots[trace.toolSnapshots.length - 1]
          : []
        return JSON.stringify({
          systemPrompt: trace.systemPrompt,
          tools: latestTools
        }, null, 2)
      }
    }),

    summarizePhysicalRequest: tool({
      description: 'Summarize a large physical-request entry (its full cumulative context) via a one-shot summarizer call. Use this instead of getTraceEntry when a physical-request payload is too large to read directly. Returns context composition, waste/optimization signals, and a faithful content digest.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          index: { type: 'number', description: 'The index of the physical-request trace entry to summarize' }
        },
        required: ['index']
      }),
      execute: async (args: { index: number }) => {
        const entry = recorder.getTraceEntry(args.index)
        if (!entry) return 'Entry not found'
        if (entry.type !== 'physical-request') {
          return `Entry ${args.index} is not a physical-request entry (it is ${entry.type}). Use getTraceEntry instead.`
        }
        const res = await fetch(
          `${window.location.origin}${opts.apiPath}/summary/${opts.accountType}/${opts.accountId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ prompt: PHYSICAL_REQUEST_SUMMARY_PROMPT, content: JSON.stringify(entry.content.requestBody) })
          }
        )
        if (!res.ok) return `Summary failed (HTTP ${res.status})`
        const { summary } = await res.json()
        return summary
      }
    })
  }
}
```

- [ ] **Step 4: Update the call site and evaluator prompt in `AgentChat.vue`**

Add the `$apiPath` import alongside the other `~` imports (after line 97 `import { buildEvaluatorTools } ...`):

```ts
import { $apiPath } from '~/context'
```

At line 196, pass account info + apiPath:

```ts
    localTools: buildEvaluatorTools(recorder, { accountType: props.accountType, accountId: props.accountId, apiPath: $apiPath }),
```

In `EVALUATOR_PROMPT` (lines 182-188), add a sentence after the existing tools paragraph (after line 186):

```
For physical-request entries, prefer summarizePhysicalRequest over getTraceEntry when the payload is large — it returns a focused analysis instead of the raw context.
```

- [ ] **Step 5: Run tests + type-check**

Run: `npm run test tests/features/agents/session-recorder.unit.spec.ts`
Expected: PASS (including the new guard test and the updated evaluator-tools tests).

Run: `npm run check-types`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add ui/src/traces/evaluator-tools.ts ui/src/components/AgentChat.vue tests/features/agents/session-recorder.unit.spec.ts
git commit -m "feat(trace): summarizePhysicalRequest evaluator tool"
```

---

## Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Lint, type-check, full unit suite**

Run: `npm run lint-fix`
Expected: 0 errors (2 pre-existing `v-html` warnings in `AgentChatMessages.vue` are acceptable).

Run: `npm run check-types`
Expected: no errors.

Run: `npm run test tests/features/agents/gateway-response.unit.spec.ts tests/features/agents/session-recorder.unit.spec.ts`
Expected: PASS.

- [ ] **Step 2: Docker build**

Run: `docker build -t agents .`
Expected: build succeeds.

- [ ] **Step 3: Manual smoke test (requires the dev environment, run by the user)**

1. Open the agent chat with `?debug` enabled, open the debug dialog → Trace tab → Start tracing (reloads).
2. Send a message that triggers at least one tool call / subagent delegation.
3. Confirm interleaved `physical-request` entries appear (teal chip), each showing inline metrics (`N in · N out · N msgs · N tools · N ms`), and expand to show the metrics chips + raw `requestBody` + reassembled `result`.
4. Confirm input tokens grow across successive physical requests as context accumulates.
5. Confirm `assistant-step` / `sub-agent-step` entries no longer show token chips (only an optional finishReason chip).
6. Open the Evaluation tab; ask the evaluator to "list the physical requests and summarize the largest one". Confirm it calls `getTraceOverview` then `summarizePhysicalRequest` and returns an analysis.
7. Confirm none of the evaluator's own requests appear as `physical-request` entries in the subject trace.
8. Compaction: set `sessionStorage['agent-chat-compaction-threshold'] = '500'`, run a multi-turn chat to trigger compaction, and confirm a `physical request: summarizer` entry appears with token metrics, alongside the existing `compaction` entry.

- [ ] **Step 4: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "chore(trace): verification fixes for physical-request tracing"
```

---

## Notes / deviations from the spec

- **`stepOrder` dropped.** The spec listed `stepOrder` on `PhysicalRequestTrace`. It is omitted here: the overview already orders by the send-time `timestamp`, and `contextId` distinguishes contexts, so a separate per-context sequence number adds state for no display value. (Consistent with the spec's simplification intent.)
- **`contextId` retained but not shown in the label.** It is captured from the `x-trace-ctx` header for correlation/debugging and future use; the visible label uses `modelRole` (`assistant` / `tools` / `summarizer`), which is the human-meaningful distinction.
- The capturing `fetch` reads a `response.clone()` in the background and returns the original untouched to the SDK, so streaming to the UI is unaffected.
