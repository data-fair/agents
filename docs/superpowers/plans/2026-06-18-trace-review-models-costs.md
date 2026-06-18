# Trace review: actual models + costs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the actual model used by each physical request and per-request + total cost in the trace review, by storing cost on the trace at record time and carrying model/provider/cost through reconstruction into the header and entries.

**Architecture:** The gateway already has the resolved model, provider, and unit prices in scope where it records a trace; we persist a computed `cost` on the trace doc (model/provider are already persisted). The UI reconstruction carries `model`/`provider`/`cost` onto each physical request, sums a `totalCost`, and the `TraceView` renders model + cost per entry and total cost in the header.

**Tech Stack:** TypeScript, Express gateway, Vue 3 + Vuetify, Playwright `unit` test project (`node:assert`).

## Global Constraints

- **Currency is euros**, rendered through a single `formatCost` helper in `TraceView.vue` (the only place the `€` symbol appears). Do not bake currency formatting into `session-recorder.ts` / `reconstruct-trace.ts`.
- **`cost` is optional everywhere** (`cost?: { input: number; output: number; total: number }`): pre-feature stored traces have no cost, and the UI must show nothing (not `0 €`) when it is absent. `summary.totalCost` stays `undefined` when no request carries cost.
- **No backfill** of existing traces; 30-day TTL gives natural coverage.
- `api/src/traces/operations.ts` is pure — it must not import other modules (no `computeCost` import); compute the cost breakdown with inline arithmetic.
- Cost breakdown: `input = inputTokens * inputPricePerMillion / 1_000_000`, `output = outputTokens * outputPricePerMillion / 1_000_000`, `total = input + output` (matches the existing `computeCost` formula; cache tokens are NOT priced).
- Quality gate (AGENTS.md): `npm run lint-fix`, `npm run check-types`, `docker build -t agents .`.
- Run a single test file with `npm run test <path>`. If a Bash command fails with a `bwrap: ... Operation not permitted` / loopback error, retry it with `dangerouslyDisableSandbox: true`.

---

### Task 1: Store cost on the trace (API)

Compute and persist a `cost` breakdown when recording a trace request, from the unit prices already in scope at the record site.

**Files:**
- Modify: `api/src/traces/types.ts` (add `cost` to `TraceRequest`)
- Modify: `api/src/traces/operations.ts` (`BuildTraceInput` prices + `buildTraceRequestDoc` cost)
- Modify: `api/src/gateway/router.ts` (pass prices into the `recordTraceRequest` call)
- Test: `tests/features/traces/traces.unit.spec.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `TraceRequest.cost?: { input: number; output: number; total: number }`; `BuildTraceInput` gains `inputPricePerMillion: number; outputPricePerMillion: number`.

- [ ] **Step 1: Write the failing test**

In `tests/features/traces/traces.unit.spec.ts`, add inside the `test.describe('traces operations (unit)', ...)` block:

```ts
  test('buildTraceRequestDoc computes the cost breakdown from tokens and prices', () => {
    const now = new Date('2026-06-08T00:00:00.000Z')
    const doc = buildTraceRequestDoc({
      owner: { type: 'user', id: 'u1' },
      conversationId: 'c1',
      contextId: 'turn:t1',
      modelRole: 'assistant',
      providerName: 'OpenAI',
      providerType: 'openai',
      resolvedModel: 'gpt-5',
      body: { messages: [], tools: [] },
      response: { content: 'hi', toolCalls: [] },
      usage: { inputTokens: 1_000_000, outputTokens: 500_000 },
      timing: { durationMs: 10 },
      inputPricePerMillion: 3,
      outputPricePerMillion: 6
    }, now)
    assert.deepEqual(doc.cost, { input: 3, output: 3, total: 6 })
  })

  test('buildTraceRequestDoc yields zero cost when prices are zero', () => {
    const now = new Date('2026-06-08T00:00:00.000Z')
    const doc = buildTraceRequestDoc({
      owner: { type: 'user', id: 'u1' },
      conversationId: 'c1',
      contextId: 'turn:t1',
      modelRole: 'assistant',
      providerName: 'Mock',
      providerType: 'mock',
      resolvedModel: 'm',
      body: { messages: [], tools: [] },
      response: { content: '', toolCalls: [] },
      usage: { inputTokens: 100, outputTokens: 10 },
      timing: { durationMs: 1 },
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    }, now)
    assert.deepEqual(doc.cost, { input: 0, output: 0, total: 0 })
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/traces/traces.unit.spec.ts`
Expected: FAIL — `buildTraceRequestDoc` does not accept `inputPricePerMillion` (type error) / `doc.cost` is `undefined`.

- [ ] **Step 3a: Add `cost` to the `TraceRequest` type**

In `api/src/traces/types.ts`, add the field after `usage` (keep it optional, before `timing`):

```ts
  usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }
  // money cost of this request, computed at record time from the unit prices in
  // effect then; absent on pre-feature documents (cacheTokens are not priced)
  cost?: { input: number, output: number, total: number }
  timing: { durationMs: number, timeToFirstChunkMs?: number }
```

- [ ] **Step 3b: Extend `BuildTraceInput` and compute the cost**

In `api/src/traces/operations.ts`, add the two price fields to `BuildTraceInput` (after `usage`):

```ts
  usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }
  inputPricePerMillion: number
  outputPricePerMillion: number
  timing: { durationMs: number, timeToFirstChunkMs?: number }
```

In `buildTraceRequestDoc`, compute the cost just before the `return`:

```ts
  const inputCost = input.usage.inputTokens * input.inputPricePerMillion / 1_000_000
  const outputCost = input.usage.outputTokens * input.outputPricePerMillion / 1_000_000
  const cost = { input: inputCost, output: outputCost, total: inputCost + outputCost }
```

and add `cost` to the returned object, right after `usage: input.usage,`:

```ts
    usage: input.usage,
    cost,
    timing: input.timing,
```

- [ ] **Step 3c: Pass prices from the gateway**

In `api/src/gateway/router.ts`, inside the `recordTrace` closure's `recordTraceRequest({ ... })` call, add the two prices (both are already destructured in scope from `getModelConfig(settings, modelId)`), right after the `usage,` property:

```ts
        usage,
        inputPricePerMillion,
        outputPricePerMillion,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/features/traces/traces.unit.spec.ts`
Expected: PASS (all tests in the file, including the two new ones).

- [ ] **Step 5: Type-check and commit**

Run: `npm run check-types` → expect PASS.

```bash
git add api/src/traces/types.ts api/src/traces/operations.ts api/src/gateway/router.ts tests/features/traces/traces.unit.spec.ts
git commit -m "feat(traces): store per-request cost on the trace document"
```

---

### Task 2: Carry model/provider/cost through reconstruction (UI)

Surface the model/provider/cost on each reconstructed physical request and sum a `totalCost`.

**Files:**
- Modify: `ui/src/traces/session-recorder.ts` (`PhysicalRequestTrace`, `TraceSummary`, `TraceOverviewEntry` fields; `getTraceOverview` physical-request branch)
- Modify: `ui/src/traces/reconstruct-trace.ts` (`StoredTraceRequest` fields; `physicalRequests` map; `summary.totalCost`)
- Test: `tests/features/traces/reconstruct.unit.spec.ts`

**Interfaces:**
- Consumes: `TraceRequest.cost` shape from Task 1.
- Produces: `PhysicalRequestTrace.model?: string`, `.provider?: { name: string; type: string }`, `.cost?: { input: number; output: number; total: number }`; `TraceSummary.totalCost?: number`; `TraceOverviewEntry.cost?: { input: number; output: number; total: number }`; the physical-request overview entry `label` becomes `"<role> · <model> (<provider>)"` when a model is present.

- [ ] **Step 1: Write the failing tests**

In `tests/features/traces/reconstruct.unit.spec.ts`, add two tests inside the top-level `describe`. (The existing `req(over)` fixture already sets `provider: { name: 'Mock', type: 'mock' }` and `request.model: 'm'`.)

```ts
  test('carries model, provider and cost onto physical requests, and sums totalCost', () => {
    const reqs = [
      req({ provider: { name: 'OpenAI', type: 'openai' }, request: { model: 'gpt-5', body: { model: 'assistant', messages: [], tools: [] }, messageCount: 0, toolCount: 0, bodyChars: 2 }, cost: { input: 0.001, output: 0.002, total: 0.003 } }),
      req({ createdAt: '2026-06-08T00:00:01.000Z', cost: { input: 0.004, output: 0.001, total: 0.005 } })
    ]
    const trace = reconstructTrace(reqs as any)
    assert.equal(trace.physicalRequests[0].model, 'gpt-5')
    assert.deepEqual(trace.physicalRequests[0].provider, { name: 'OpenAI', type: 'openai' })
    assert.deepEqual(trace.physicalRequests[0].cost, { input: 0.001, output: 0.002, total: 0.003 })
    assert.equal(trace.summary.totalCost, 0.008)
  })

  test('leaves totalCost undefined when no request carries cost', () => {
    const trace = reconstructTrace([req({})] as any)
    assert.equal(trace.summary.totalCost, undefined)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test tests/features/traces/reconstruct.unit.spec.ts`
Expected: FAIL — `physicalRequests[0].model` is `undefined` and `summary.totalCost` does not exist (and `cost` is not a known property of the fixture type / mapping).

- [ ] **Step 3a: Add fields to the UI trace types**

In `ui/src/traces/session-recorder.ts`, extend `PhysicalRequestTrace` (add after `modelRole`):

```ts
  modelRole: string
  model?: string
  provider?: { name: string, type: string }
  cost?: { input: number, output: number, total: number }
```

Extend `TraceSummary` (add after `outputTokens`):

```ts
  outputTokens: number
  totalCost?: number
```

Extend `TraceOverviewEntry` (add after `preview`):

```ts
  preview: string
  cost?: { input: number, output: number, total: number }
```

- [ ] **Step 3b: Carry the fields in `reconstruct-trace.ts`**

In `ui/src/traces/reconstruct-trace.ts`, extend the `StoredTraceRequest` interface — add `provider` (after `modelRole`) and `cost` (after `usage`):

```ts
  modelRole: string
  provider?: { name: string, type: string }
  request: { model: string, body: any, messageCount: number, toolCount: number, bodyChars: number }
  response: { content: string, toolCalls: { id: string, name: string, arguments: string }[], finishReason?: string }
  usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }
  cost?: { input: number, output: number, total: number }
```

In the `physicalRequests` map, add three fields after `modelRole: r.modelRole,`:

```ts
    modelRole: r.modelRole,
    model: r.request.model,
    provider: r.provider,
    cost: r.cost,
```

In the `summary` object, add `totalCost` after `outputTokens` (undefined when no request has cost, so old traces show nothing):

```ts
    outputTokens: physicalRequests.reduce((s, p) => s + (p.outputTokens || 0), 0),
    ...(physicalRequests.some(p => p.cost) ? { totalCost: physicalRequests.reduce((s, p) => s + (p.cost?.total || 0), 0) } : {}),
    flags
```

- [ ] **Step 3c: Surface model + cost in `getTraceOverview`**

In `ui/src/traces/session-recorder.ts`, in the `for (const pr of this.trace.physicalRequests)` loop, change the overview entry (first `add(...)` argument) so the label carries the model and the entry carries cost:

```ts
        {
          type: 'physical-request',
          timestamp: pr.timestamp,
          label: pr.model ? `${pr.modelRole} · ${pr.model}${pr.provider ? ` (${pr.provider.name})` : ''}` : pr.modelRole,
          preview: `${pr.inputTokens} in${pr.cacheReadTokens ? ` (${pr.cacheReadTokens} cached)` : ''} · ${pr.outputTokens} out · ${pr.messageCount} msgs · ${pr.toolCount} tools · ${Math.round(pr.durationMs)}ms`,
          ...(pr.cost ? { cost: pr.cost } : {})
        },
```

And in the detail content (second `add(...)` argument) add `model`, `provider`, `cost` after `modelRole: pr.modelRole,`:

```ts
          modelRole: pr.modelRole,
          model: pr.model,
          provider: pr.provider,
          cost: pr.cost,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test tests/features/traces/reconstruct.unit.spec.ts`
Expected: PASS.

- [ ] **Step 5: Type-check and commit**

Run: `npm run check-types` → expect PASS.

```bash
git add ui/src/traces/session-recorder.ts ui/src/traces/reconstruct-trace.ts tests/features/traces/reconstruct.unit.spec.ts
git commit -m "feat(traces): carry model, provider and cost through trace reconstruction"
```

---

### Task 3: Render model + cost in TraceView (UI)

Display total cost in the header, per-request cost on each entry, and provider + cost breakdown in the expanded physical-request detail.

**Files:**
- Modify: `ui/src/components/agent-chat/TraceView.vue`

**Interfaces:**
- Consumes: `summary.totalCost` (Task 2), `entry.cost` (Task 2), `traceEntryDetails[i].content.{model,provider,cost}` (Task 2). The model+provider already appear in `entry.label` from Task 2, so no separate model element is needed in the title.
- Produces: nothing downstream.

- [ ] **Step 1: Add the `formatCost` helper**

In `ui/src/components/agent-chat/TraceView.vue` `<script setup>`, next to `formatTokens` (the `const formatTokens = ...` line), add:

```ts
const formatCost = (n: number) => `${n.toFixed(4)} €`
```

- [ ] **Step 2: Show total cost in the header**

In the header totals `<span class="text-caption font-weight-medium">`, append a cost segment after the `out` interpolation, before the closing `</span>`:

```html
        {{ summary.requestCount }} {{ t('requests') }} · {{ formatDuration(summary.totalDurationMs) }} · {{ formatTokens(summary.inputTokens) }} {{ t('in') }} · {{ formatTokens(summary.outputTokens) }} {{ t('out') }}<template v-if="summary.totalCost != null"> · {{ formatCost(summary.totalCost) }}</template>
```

- [ ] **Step 3: Show per-request cost on the entry title**

In the `v-expansion-panel-title`, after the preview `<span ...>{{ entry.preview }}</span>`, add a cost span:

```html
          <span class="text-label-small text-medium-emphasis text-truncate agent-chat__trace-preview">{{ entry.preview }}</span>
          <span
            v-if="entry.cost != null"
            class="text-medium-emphasis ml-2 flex-shrink-0"
            style="white-space: nowrap;"
          >{{ formatCost(entry.cost.total) }}</span>
```

- [ ] **Step 4: Show provider + cost breakdown in the expanded physical-request detail**

In the `<template v-else-if="entry.type === 'physical-request'">` block, immediately after the `finishReason` `<v-chip>...</v-chip>` and before the `{{ t('request') }}` caption div, add a model/cost summary line:

```html
              <div
                v-if="traceEntryDetails[entry.index].content.model"
                class="text-caption mt-2"
              >
                {{ traceEntryDetails[entry.index].content.model }}<template v-if="traceEntryDetails[entry.index].content.provider"> ({{ traceEntryDetails[entry.index].content.provider.name }})</template><template v-if="traceEntryDetails[entry.index].content.cost"> · {{ formatCost(traceEntryDetails[entry.index].content.cost.total) }} ({{ formatCost(traceEntryDetails[entry.index].content.cost.input) }} {{ t('in') }} + {{ formatCost(traceEntryDetails[entry.index].content.cost.output) }} {{ t('out') }})</template>
              </div>
```

- [ ] **Step 5: Type-check and commit**

Run: `npm run check-types` → expect PASS.
(No unit test — this is Vue template rendering, verified by type-check and the final docker build. The data it renders is covered by Task 2's tests.)

```bash
git add ui/src/components/agent-chat/TraceView.vue
git commit -m "feat(traces): show model and cost in the trace review header and entries"
```

---

### Task 4: Full quality gate

**Files:** none (verification only).

- [ ] **Step 1: Lint**

Run: `npm run lint-fix`
Expected: no errors (the pre-existing `v-html` warning in `MarkdownContent.vue` is unrelated and acceptable).

- [ ] **Step 2: Type-check**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 3: Run the affected unit tests**

Run: `npm run test tests/features/traces/traces.unit.spec.ts tests/features/traces/reconstruct.unit.spec.ts`
Expected: PASS.

- [ ] **Step 4: Docker build**

Run: `docker build -t agents .`
Expected: build succeeds.

---

## Self-review notes

- **Spec coverage:** store cost at record time → Task 1; carry model/provider/cost + totalCost → Task 2; header total cost → Task 3 step 2; per-request model (label) + cost → Task 2 step 3c + Task 3 steps 3-4; euros via `formatCost` → Task 3 step 1; tests → Tasks 1-2; evaluator gains model/cost via `getTraceEntry` detail → Task 2 step 3c (no extra work).
- **Optional-cost handling:** `cost` and `totalCost` are optional and gated with `v-if` / spread-when-present, so pre-feature traces render no cost.
- **Type/name consistency:** `cost: { input, output, total }`, `inputPricePerMillion`/`outputPricePerMillion`, `totalCost`, `formatCost` used consistently across Tasks 1-3.
- **Currency single-source:** `€` appears only in `formatCost` (Task 3 step 1).
```
