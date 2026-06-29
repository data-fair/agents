# Parallel Sub-Agents (Concurrency-Safe Rendering) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let multiple sub-agent calls emitted in one assistant step each render in their own panel — own transcript, own live phase — without clobbering each other, with correct multi-turn history.

**Architecture:** The AI SDK (`ai@6.0.116`) already dispatches a step's tool calls concurrently (unawaited `executeToolCall` in `index.mjs:6213`). The blocker is shared per-message UI state: a single `subAgentMessages` array and a single global `activity` ref. We key the per-call transcript and live phase by the delegating `toolCallId`, and serialize the rare case of two concurrent calls to the *same* sub-agent (which share conversation history).

**Tech Stack:** Vue 3 (composables + SFC), Vercel AI SDK v6, Playwright test runner (unit + e2e), the in-repo mock model provider.

## Global Constraints

- Quality gates (run before declaring done): `npm run lint-fix`, `npm run check-types`, `docker build -t agents .`.
- Tests: `npm run test` (Playwright projects: `unit`, `api`, `e2e`). Run a single file with `npm run test tests/features/<path>.spec.ts`.
- Dev processes (dev-api, dev-ui, docker compose) are user-managed — never start/stop/restart them. On a connection error, run `bash dev/status.sh` and stop to ask.
- Workspace packages must be built before e2e: `cd lib-vuetify && npm run build`, `cd lib-vue && npm run build`.
- Unit tests use `import { test } from 'playwright/test'` + `node:assert/strict`, importing source `.ts` directly (see `tests/features/chat-subagent/autoscroll.unit.spec.ts`).
- The composable file `ui/src/composables/use-agent-chat.ts` is the orchestrator; do NOT touch its robustness layer (error/abort/watchdog/moderation/compaction) beyond the precise edits below.
- Branch: `feat-better-subagents`. Commit per task.

---

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `ui/src/composables/sub-agent-serial.ts` | Pure keyed-serialization gate (same-name calls run in order) | Create |
| `ui/src/components/agent-chat/auto-scroll.ts` | Autoscroll growth signal — iterate per-`toolCallId` panels | Modify |
| `ui/src/composables/use-agent-chat.ts` | `ChatMessage` shape, `subAgentActivities` ref, execute closure write-sites, `toModelOutput`, return | Modify |
| `ui/src/components/agent-chat/AgentChatMessages.vue` | Render each panel's own transcript + own live phase | Modify |
| `ui/src/components/AgentChat.vue` | Expose `subAgentActivities`, pass it as a prop | Modify |
| `ui/src/pages/_dev/chat.vue` | Dev fixture using the old `subAgentMessages` field | Modify |
| `api/src/models/mock-model.ts` | Deterministic "parallel subagents" seam for the e2e | Modify |
| `tests/features/chat-subagent/sub-agent-serial.unit.spec.ts` | Unit test for the gate | Create |
| `tests/features/chat-subagent/autoscroll.unit.spec.ts` | Update existing tests to the panel shape | Modify |
| `tests/features/chat-subagent/chat-subagent-advanced.e2e.spec.ts` | Add the parallel-panels e2e | Modify |
| `docs/architecture/sub-agents.md` | Correct the "sequential" claim; document per-panel model | Modify |

---

## Task 1: Same-name serialization gate

A pure helper that orders async calls sharing a key while letting different keys run
concurrently. Used so two concurrent delegations to the *same* sub-agent don't race on
shared history; different sub-agents stay fully parallel.

**Files:**
- Create: `ui/src/composables/sub-agent-serial.ts`
- Test: `tests/features/chat-subagent/sub-agent-serial.unit.spec.ts`

**Interfaces:**
- Produces: `createSameNameGate(): (key: string) => Promise<() => void>` — call `acquire(key)`; it resolves to a `release` function once it is this key's turn. Call `release()` when done. Calls with different keys never wait on each other.

- [ ] **Step 1: Write the failing test**

Create `tests/features/chat-subagent/sub-agent-serial.unit.spec.ts`:

```ts
/**
 * Unit tests for the same-name serialization gate. Concurrent acquisitions of the
 * SAME key run in arrival order (one fully completes before the next starts);
 * different keys run concurrently without waiting.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createSameNameGate } from '../../../ui/src/composables/sub-agent-serial.ts'

const tick = () => new Promise(resolve => setTimeout(resolve, 5))

test.describe('createSameNameGate', () => {
  test('same key: second call waits for the first to release', async () => {
    const gate = createSameNameGate()
    const order: string[] = []

    const a = (async () => {
      const release = await gate('x')
      order.push('a-start')
      await tick()
      order.push('a-end')
      release()
    })()
    const b = (async () => {
      const release = await gate('x')
      order.push('b-start')
      release()
    })()

    await Promise.all([a, b])
    assert.deepEqual(order, ['a-start', 'a-end', 'b-start'])
  })

  test('different keys run concurrently (no cross-key wait)', async () => {
    const gate = createSameNameGate()
    const order: string[] = []

    const a = (async () => {
      const release = await gate('x')
      order.push('a-start')
      await tick() // if keys were serialized, b could not start during this gap
      order.push('a-end')
      release()
    })()
    const b = (async () => {
      const release = await gate('y')
      order.push('b-start')
      release()
    })()

    await Promise.all([a, b])
    // b started before a finished → not serialized across keys
    assert.equal(order[0], 'a-start')
    assert.equal(order[1], 'b-start')
    assert.equal(order[2], 'a-end')
  })

  test('release after rejection does not deadlock the next same-key call', async () => {
    const gate = createSameNameGate()
    const order: string[] = []

    const a = (async () => {
      const release = await gate('x')
      try {
        order.push('a')
        throw new Error('boom')
      } finally {
        release()
      }
    })().catch(() => order.push('a-caught'))
    const b = (async () => {
      const release = await gate('x')
      order.push('b')
      release()
    })()

    await Promise.all([a, b])
    assert.deepEqual(order, ['a', 'a-caught', 'b'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/chat-subagent/sub-agent-serial.unit.spec.ts`
Expected: FAIL — `Cannot find module '.../sub-agent-serial.ts'`.

- [ ] **Step 3: Write minimal implementation**

Create `ui/src/composables/sub-agent-serial.ts`:

```ts
/**
 * Keyed serialization gate. `acquire(key)` resolves to a `release` fn once it is
 * this key's turn; calls sharing a key run in arrival order (each releases before
 * the next starts), while calls with different keys never wait on each other.
 *
 * Used by the sub-agent orchestrator so two concurrent delegations to the SAME
 * sub-agent — which share accumulated conversation history — run as ordered turns
 * instead of racing, while delegations to DIFFERENT sub-agents stay fully parallel.
 */
export function createSameNameGate (): (key: string) => Promise<() => void> {
  // Per key, the promise that resolves when the last queued holder releases.
  const tails = new Map<string, Promise<void>>()

  return async function acquire (key: string): Promise<() => void> {
    const prev = tails.get(key) ?? Promise.resolve()
    let release!: () => void
    const mine = new Promise<void>(resolve => { release = resolve })
    // The next acquirer of this key waits until `mine` resolves (i.e. our release).
    // Swallow `prev` rejections so one failed holder can't poison the chain.
    tails.set(key, prev.then(() => mine, () => mine))
    await prev.catch(() => {})
    return release
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/features/chat-subagent/sub-agent-serial.unit.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add ui/src/composables/sub-agent-serial.ts tests/features/chat-subagent/sub-agent-serial.unit.spec.ts
git commit -m "feat(subagents): add keyed serialization gate for same-name delegations"
```

---

## Task 2: Per-`toolCallId` panels in the autoscroll growth signal

`streamedLength` currently sums a single `subAgentMessages` array per message. The new
shape stores transcripts in `subAgentPanels: Record<toolCallId, { messages, turn }>`.
Update the structural `ScrollMessage` type and the summation, and update the tests.

**Files:**
- Modify: `ui/src/components/agent-chat/auto-scroll.ts:10-37`
- Test: `tests/features/chat-subagent/autoscroll.unit.spec.ts:44-63` (the two sub-agent-streaming tests)

**Interfaces:**
- Produces: `ScrollMessage.subAgentPanels?: Record<string, { messages: ScrollMessage[] }>` (replaces `subAgentMessages?: ScrollMessage[]`). `streamedLength` and `latestSubAgentPanel` signatures unchanged.

- [ ] **Step 1: Update the failing tests first**

In `tests/features/chat-subagent/autoscroll.unit.spec.ts`, replace the two tests that use `subAgentMessages` (the `REGRESSION: grows while a sub-agent streams…` and `grows when a sub-agent gains a tool chip` tests, lines ~44-63) with the panel shape:

```ts
  test('REGRESSION: grows while a sub-agent streams even though parent content is static', () => {
    // Parent message text never changes; only the nested sub-agent panel grows.
    const base: ScrollMessage = { content: 'Delegating…', toolInvocations: [sub('data_analyst')] }
    const early: ScrollMessage[] = [{ ...base, subAgentPanels: { c1: { messages: [{ content: 'analy' }] } } }]
    const later: ScrollMessage[] = [{ ...base, subAgentPanels: { c1: { messages: [{ content: 'analysis complete' }] } } }]
    assert.ok(
      streamedLength(later) > streamedLength(early),
      'growth signal must move while the sub-agent streams, otherwise autoscroll freezes'
    )
  })

  test('grows when a sub-agent gains a tool chip', () => {
    const base: ScrollMessage = { content: 'go', toolInvocations: [sub('data_analyst')] }
    const before: ScrollMessage[] = [{ ...base, subAgentPanels: { c1: { messages: [{ content: 's' }] } } }]
    const after: ScrollMessage[] = [{
      ...base,
      subAgentPanels: { c1: { messages: [{ content: 's', toolInvocations: [{ toolName: 'get_schema' }] }] } }
    }]
    assert.ok(streamedLength(after) > streamedLength(before))
  })

  test('grows when a second concurrent panel streams under the same message', () => {
    const base: ScrollMessage = { content: 'go', toolInvocations: [sub('data_analyst'), sub('data_summarizer')] }
    const one: ScrollMessage[] = [{ ...base, subAgentPanels: { c1: { messages: [{ content: 'aa' }] } } }]
    const two: ScrollMessage[] = [{
      ...base,
      subAgentPanels: { c1: { messages: [{ content: 'aa' }] }, c2: { messages: [{ content: 'bb' }] } }
    }]
    assert.ok(streamedLength(two) > streamedLength(one), 'a second concurrent panel must also grow the signal')
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test tests/features/chat-subagent/autoscroll.unit.spec.ts`
Expected: FAIL — `subAgentPanels` is not a known property of `ScrollMessage` (type error) and/or the new growth assertions fail.

- [ ] **Step 3: Update `auto-scroll.ts`**

Replace the `ScrollMessage` interface (lines 10-14):

```ts
export interface ScrollMessage {
  content: string
  toolInvocations?: { toolName: string }[]
  subAgentPanels?: Record<string, { messages: ScrollMessage[] }>
}
```

Replace the sub-agent loop inside `streamedLength` (the `for (const sub of message.subAgentMessages ?? [])` block, lines ~31-34) with:

```ts
    for (const panel of Object.values(message.subAgentPanels ?? {})) {
      for (const sub of panel.messages) {
        total += sub.content.length
        total += sub.toolInvocations?.length ?? 0
      }
    }
```

Also update the doc comment on `streamedLength` (lines ~22-23) so "only `subAgentMessages` grows" reads "only `subAgentPanels` grows". `latestSubAgentPanel` is unchanged (it counts `toolInvocations`, not transcripts).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test tests/features/chat-subagent/autoscroll.unit.spec.ts`
Expected: PASS (all tests, including the new concurrent-panel one).

- [ ] **Step 5: Commit**

```bash
git add ui/src/components/agent-chat/auto-scroll.ts tests/features/chat-subagent/autoscroll.unit.spec.ts
git commit -m "refactor(subagents): key autoscroll growth signal by per-call panels"
```

---

## Task 3: Composable — per-call panel slots, per-call activity, same-name gate

Rewrite the sub-agent `execute` closure to write each call's transcript into
`subAgentPanels[parentToolCallId]`, route its live phase into a new per-`toolCallId`
`subAgentActivities` ref, and gate same-name calls. Type changes to `ChatMessage`.

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts` (type ~62-76; ref ~181; map block ~528-529; closure ~579-706; return ~855)

**Interfaces:**
- Consumes: `createSameNameGate` (Task 1).
- Produces: `ChatMessage.subAgentPanels?: Record<string, { messages: ChatMessage[], turn: number }>` (replaces `subAgentMessages`/`subAgentTurn`). Composable return adds `subAgentActivities: Ref<Record<string, ChatActivity>>`.

- [ ] **Step 1: Add the import**

At the top of `use-agent-chat.ts`, after the existing `agent-stream-parts` import (line 17), add:

```ts
import { createSameNameGate } from '~/composables/sub-agent-serial.ts'
```

- [ ] **Step 2: Change the `ChatMessage` type**

Replace these fields in `interface ChatMessage` (lines ~70-75):

```ts
  subAgentMessages?: ChatMessage[]
  subAgentTurn?: number
```

with:

```ts
  // Per delegating tool-call id: the sub-agent's transcript and its multi-turn index.
  // Keyed by toolCallId so concurrent sub-agent calls under one assistant message
  // render in separate panels instead of clobbering one shared array.
  subAgentPanels?: Record<string, { messages: ChatMessage[], turn: number }>
```

Keep the `moderationBlocked?: boolean` field and its comment as-is (it rides on a
sub-agent message inside a panel's `messages`).

- [ ] **Step 3: Add the per-call activity ref**

Right after the global `activity` ref declaration (line ~181, `const activity = ref<ChatActivity | null>(null)`), add:

```ts
  // Live phase per RUNNING sub-agent panel, keyed by the delegating toolCallId.
  // Separate from the single global `activity` (main-agent phases only) so two
  // concurrent sub-agents each show their own phase line in their own panel.
  const subAgentActivities = ref<Record<string, ChatActivity>>({})
```

- [ ] **Step 4: Clear per-call activity on reset**

In `reset()` (after `announcedTools.clear()`, line ~347), add:

```ts
    subAgentActivities.value = {}
```

- [ ] **Step 5: Create the same-name gate per turn**

Where the per-sub-agent maps are declared (lines ~528-529), add the gate alongside:

```ts
      const subAgentHistory = new Map<string, ModelMessage[]>()
      const subAgentCallCount = new Map<string, number>()
      const sameNameGate = createSameNameGate()
```

- [ ] **Step 6: Replace the `subScope.setActivity` block with per-call writes**

Inside the `execute` generator, the `parentToolCallId` is already computed (line ~594).
Replace the `subScope` `setActivity` implementation (lines ~611-618) with helpers that
write/clear THIS call's entry in `subAgentActivities`:

```ts
              setActivity: (phase) => {
                const setPhase = (a: ChatActivity | null) => {
                  const next = { ...subAgentActivities.value }
                  if (a) next[parentToolCallId] = a
                  else delete next[parentToolCallId]
                  subAgentActivities.value = next
                }
                switch (phase) {
                  case 'streaming': setPhase(null); break
                  case 'tool': setPhase({ kind: 'subagent', name, phase: 'tool' }); break
                  case 'analyzing': setPhase({ kind: 'subagent', name, phase: 'analyzing' }); break
                  case 'thinking': setPhase({ kind: 'subagent', name, phase: 'thinking' }); break
                }
              }
```

- [ ] **Step 7: Replace the "starting" enter-gap write**

Replace the enter-gap line (line ~622, `activity.value = { kind: 'subagent', name, phase: 'starting' }`) with a per-call write:

```ts
            subAgentActivities.value = { ...subAgentActivities.value, [parentToolCallId]: { kind: 'subagent', name, phase: 'starting' } }
```

- [ ] **Step 8: Wrap the call body in the same-name gate and clear activity on exit**

Replace the `try { ... } catch (subErr: any) { ... }` structure (lines ~624-690) so the
whole call acquires the gate first and always clears its activity entry. The body inside
stays the same except the write-sites changed in Steps 9-10. Concretely, change the
opening from:

```ts
            let subStreamError: unknown = null
            try {
```

to:

```ts
            let subStreamError: unknown = null
            // Same-name calls share accumulated history; run them as ordered turns.
            // Different sub-agents acquire different keys and never wait here.
            const releaseGate = await sameNameGate(name)
            try {
```

and add a `finally` that clears this panel's live phase. Change the closing of the
catch block from:

```ts
              yield [errorMsg]
            }
          },
```

to:

```ts
              yield [errorMsg]
            } finally {
              releaseGate()
              const next = { ...subAgentActivities.value }
              delete next[parentToolCallId]
              subAgentActivities.value = next
            }
          },
```

Note: `priorMessages`/`callIndex` are read at the top of the generator (lines ~581-583)
BEFORE the gate. Move those three lines to immediately AFTER `const releaseGate = await sameNameGate(name)` so a serialized same-name call reads history only after the prior
call has written it:

```ts
            const releaseGate = await sameNameGate(name)
            const priorMessages = subAgentHistory.get(name) ?? []
            const callIndex = subAgentCallCount.get(name) ?? 0
            subAgentCallCount.set(name, callIndex + 1)
            let subStreamError: unknown = null
            try {
```

(Delete the original `priorMessages`/`callIndex`/`subAgentCallCount.set` lines near 581-583, and the original `let subStreamError` line, since they moved.)

- [ ] **Step 9: Write the streaming snapshot into the per-call slot**

Replace the snapshot write inside the `for await (const part of subResult.fullStream)`
loop (lines ~646-650) — the block that sets `parent.subAgentTurn`/`parent.subAgentMessages`:

```ts
                const parent = liveParent()
                if (parent) {
                  parent.subAgentPanels = {
                    ...(parent.subAgentPanels ?? {}),
                    [parentToolCallId]: { messages: [...subScope.messages], turn: callIndex }
                  }
                }
                yield [...subScope.messages]
```

- [ ] **Step 10: Write the refusal and error branches into the slot**

In the content-filter refusal branch (lines ~664-668), replace the
`parent.subAgentMessages = [...]` write with a slot append (keep `yield [refusal]`
unchanged so `toModelOutput` still sees `moderationBlocked`):

```ts
                const parent = liveParent()
                if (parent) {
                  const prev = parent.subAgentPanels?.[parentToolCallId]?.messages ?? subScope.messages
                  parent.subAgentPanels = {
                    ...(parent.subAgentPanels ?? {}),
                    [parentToolCallId]: { messages: [...prev, refusal], turn: callIndex }
                  }
                }
                yield [refusal]
```

In the catch error branch (lines ~685-689), replace the `parent.subAgentMessages = [...]`
write the same way (keep `yield [errorMsg]`):

```ts
              const parent = liveParent()
              if (parent) {
                const prev = parent.subAgentPanels?.[parentToolCallId]?.messages ?? subScope.messages
                parent.subAgentPanels = {
                  ...(parent.subAgentPanels ?? {}),
                  [parentToolCallId]: { messages: [...prev, errorMsg], turn: callIndex }
                }
              }
              yield [errorMsg]
```

- [ ] **Step 11: `toModelOutput` — no behavioral change**

`toModelOutput` (lines ~692-705) reads the yielded `output` array's last message; it is
unchanged. Leave it as-is. (The `moderationBlocked` check still works because the refusal
message is the last yielded value.)

- [ ] **Step 12: Clear per-call activity at turn end and export the ref**

In `sendMessage`'s `finally` (line ~836-840), after `activity.value = null`, add:

```ts
      subAgentActivities.value = {}
```

In the composable's return statement (line ~855), add `subAgentActivities`:

```ts
  return { messages, status, error, activity, subAgentActivities, tools, toolsVersion, resolvedPartition, conversationId, sendMessage, abort, reset, setSystemPrompt, setToolExploration, setFlattenSubAgents }
```

- [ ] **Step 13: Type-check**

Run: `npm run check-types`
Expected: PASS. If errors mention `subAgentMessages`/`subAgentTurn`, they are in
`AgentChatMessages.vue` / `_dev/chat.vue` and are fixed in Task 4 — it is fine to do
Steps of Task 4 before re-running. Otherwise resolve any closure-scope errors here.

- [ ] **Step 14: Lint + commit**

```bash
npm run lint-fix
git add ui/src/composables/use-agent-chat.ts
git commit -m "feat(subagents): per-call panel slots, per-panel activity, same-name gate"
```

---

## Task 4: Render each panel's own transcript and live phase

Wire the per-`toolCallId` data into the template: read `subAgentPanels[toolCallId]` for
the transcript/turn, and `subAgentActivities[toolCallId]` for the in-panel phase line.

**Files:**
- Modify: `ui/src/components/agent-chat/AgentChatMessages.vue` (props ~96-101; render ~114-171; `subAgentActivityLabel` ~435-438)
- Modify: `ui/src/components/AgentChat.vue` (computed ~226; prop binding ~17)
- Modify: `ui/src/pages/_dev/chat.vue:65`

**Interfaces:**
- Consumes: `ChatMessage.subAgentPanels` and `subAgentActivities` (Task 3).

- [ ] **Step 1: Add the prop**

In `AgentChatMessages.vue`, add to `defineProps` (after `activity?: ChatActivity | null`, line ~101):

```ts
  subAgentActivities?: Record<string, ChatActivity>
```

- [ ] **Step 2: Render the per-call transcript and turn**

In the sub-agent panel loop, change the turn label (line ~114-117) from
`message.subAgentTurn` to the per-call slot:

```vue
                      <span
                        v-if="message.subAgentPanels?.[invocation.toolCallId]?.turn"
                        class="text-medium-emphasis ml-1"
                      >(tour {{ message.subAgentPanels[invocation.toolCallId].turn + 1 }})</span>
```

Change the transcript block (lines ~120-150) to read the per-call slot. Replace
`message.subAgentMessages` with `message.subAgentPanels?.[invocation.toolCallId]?.messages`
throughout that block:

```vue
                      <div
                        v-if="message.subAgentPanels?.[invocation.toolCallId]?.messages.length"
                      >
                        <div
                          v-for="(subMsg, subIdx) in message.subAgentPanels[invocation.toolCallId].messages"
                          :key="subIdx"
                          class="py-1"
                        >
                          <markdown-content
                            class="text-body-medium markdown-content"
                            :content="subMsg.content"
                            :streaming="isStreaming && index === messages.length - 1 && subIdx === message.subAgentPanels[invocation.toolCallId].messages.length - 1 && invocation.state !== 'done'"
                            :mermaid="mermaidEnabled"
                          />
                          <div
                            v-if="subMsg.toolInvocations?.length"
                            class="mt-1"
                          >
                            <v-chip
                              v-for="subInv in subMsg.toolInvocations"
                              :key="subInv.toolCallId"
                              size="x-small"
                              :color="subInv.state === 'done' ? 'success' : 'warning'"
                              variant="tonal"
                              class="mr-1 mb-1"
                            >
                              {{ toolTitle(subInv.toolName) }}
                            </v-chip>
                          </div>
                        </div>
                      </div>
```

- [ ] **Step 3: Key the in-panel activity line by toolCallId**

Change the activity `v-if` (line ~161) and the rendered label (line ~170) to pass
`invocation.toolCallId`:

```vue
                      <div
                        v-if="isStreaming && index === messages.length - 1 && subAgentActivityLabel(invocation.toolCallId)"
                        class="d-flex align-center text-caption text-medium-emphasis py-1"
                        data-testid="subagent-activity"
                      >
                        <v-icon
                          :icon="mdiLoading"
                          size="x-small"
                          class="agent-chat__spin mr-2"
                        />
                        <span class="font-italic">{{ subAgentActivityLabel(invocation.toolCallId) }}</span>
                      </div>
```

- [ ] **Step 4: Rewrite `subAgentActivityLabel` to read the per-call map**

Replace `subAgentActivityLabel` (lines ~433-438) — it currently matches a single global
`props.activity.name` against the tool name. New version reads the per-`toolCallId` map:

```ts
// In-panel label for the sub-agent running under `toolCallId`. Reads the
// per-call activity map so concurrent panels each show their own live phase.
const subAgentActivityLabel = (toolCallId: string) => {
  const a = props.subAgentActivities?.[toolCallId]
  if (!a || a.kind !== 'subagent') return ''
  const label = activityLabelKey(a)
  return label ? t(label.key) : ''
}
```

- [ ] **Step 5: Pass the prop from `AgentChat.vue`**

Add the computed (after line ~226, `const activity = computed(...)`):

```ts
const subAgentActivities = computed(() => chat.subAgentActivities.value)
```

Bind it on `<agent-chat-messages>` (after `:activity="activity"`, line ~17):

```vue
        :sub-agent-activities="subAgentActivities"
```

- [ ] **Step 6: Update the dev fixture**

In `ui/src/pages/_dev/chat.vue:65`, replace the `subAgentMessages: [ ... ]` fixture field
with the panel shape. Read the surrounding object to find the tool-call id it uses (the
sibling `toolInvocations` entry); key the panel by that id. For example, if the fixture's
sub-agent invocation has `toolCallId: 'demo-sub'`:

```ts
    subAgentPanels: { 'demo-sub': { turn: 0, messages: [ /* the same ChatMessage[] that was in subAgentMessages */ ] } },
```

If the fixture's invocation has no explicit `toolCallId`, add one to that invocation and
reuse it as the panel key so they correlate.

- [ ] **Step 7: Build workspace packages, type-check, lint**

```bash
cd lib-vuetify && npm run build && cd ..
cd lib-vue && npm run build && cd ..
npm run check-types
npm run lint-fix
```
Expected: no references to `subAgentMessages`/`subAgentTurn` remain; type-check passes.

- [ ] **Step 8: Commit**

```bash
git add ui/src/components/agent-chat/AgentChatMessages.vue ui/src/components/AgentChat.vue ui/src/pages/_dev/chat.vue
git commit -m "feat(subagents): render each concurrent panel's own transcript and phase"
```

---

## Task 5: Mock "parallel subagents" seam + parallel-panels e2e

Add a deterministic mock trigger that makes the lead emit two `subagent_*` calls in one
step, each with a task its own reserved tools can handle, then assert two distinct panels
render. This is the integration proof for Tasks 2-4 and corroborates that the SDK runs
the two workers concurrently.

**Files:**
- Modify: `api/src/models/mock-model.ts` (`processMockPrompt`, after the `call tools` block ~97)
- Modify: `tests/features/chat-subagent/chat-subagent-advanced.e2e.spec.ts` (add one test)

**Interfaces:**
- Consumes: the dev page's two registered sub-agents `data_analyst` (tools: `get_schema`, `query_data`) and `data_summarizer` (tools: `summarize_data`).

- [ ] **Step 1: Add the mock seam**

In `api/src/models/mock-model.ts`, inside `processMockPrompt`, immediately after the
`call tools` block (after line ~97) add:

```ts
  // "parallel subagents" → delegate to two DIFFERENT sub-agents in one step, each with a
  // task its own reserved tools handle, to exercise concurrent sub-agent panels. The two
  // tasks diverge so the rendered panels are distinguishable (no-clobber regression).
  if (/^parallel subagents$/i.test(lastMessage)) {
    return {
      type: 'tool-call',
      toolCalls: [
        { toolName: 'subagent_data_analyst', toolArgs: JSON.stringify({ task: 'analyze' }) },
        { toolName: 'subagent_data_summarizer', toolArgs: JSON.stringify({ task: 'hello' }) }
      ]
    }
  }
```

(`data_analyst` task `analyze` → mock-tools chains `get_schema`→`query_data`→
"Analysis complete: found 3 results"; `data_summarizer` task `hello` → "world".)

- [ ] **Step 2: Write the failing e2e**

In `tests/features/chat-subagent/chat-subagent-advanced.e2e.spec.ts`, add inside the
`describe('Advanced Sub-Agent Scenarios')` block. First open the file and reuse its
existing helpers (`sendMessage`, `goToWithAuth`, the `waitForToolsReady`-style setup and
`beforeEach`) exactly as the neighboring tests do. The test body:

```ts
  test('Two sub-agents delegated in one step render separate panels concurrently', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    await sendMessage(page, 'parallel subagents')

    const chat = page.locator('.agent-chat')
    // Both panels appear under the same assistant message.
    await expect(chat.getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })
    await expect(chat.getByText('Data Summarizer').first()).toBeVisible({ timeout: 15000 })

    // Turn settles on the trailing main-agent "done" text.
    await expect(chat.getByText('done', { exact: true }).first()).toBeVisible({ timeout: 15000 })

    // Each panel shows its OWN transcript (proves no shared-array clobber).
    const analystPanel = chat.locator('.v-expansion-panel', { hasText: 'Data Analyst' }).first()
    const summarizerPanel = chat.locator('.v-expansion-panel', { hasText: 'Data Summarizer' }).first()
    await analystPanel.locator('.v-expansion-panel-title').click()
    await summarizerPanel.locator('.v-expansion-panel-title').click()
    await expect(analystPanel.getByText('Analysis complete', { exact: false })).toBeVisible({ timeout: 5000 })
    await expect(summarizerPanel.getByText('world', { exact: true })).toBeVisible({ timeout: 5000 })
  })
```

If `waitForToolsReady` is defined only in `chat-subagent.e2e.spec.ts`, copy the same
helper into this file (or replace that line with this file's existing readiness wait — match
the neighboring tests).

- [ ] **Step 3: Run e2e to verify it fails on the old code path**

(If implementing strictly TDD, run before Tasks 3-4; here it confirms the wiring.)
Run: `npm run test tests/features/chat-subagent/chat-subagent-advanced.e2e.spec.ts`
Expected (against pre-Task-3 code): FAIL — both panels show the same transcript, so one of
the two `Analysis complete` / `world` assertions fails. Against post-Task-4 code: PASS.

If it fails with a connection error, run `bash dev/status.sh` and stop to ask the user.

- [ ] **Step 4: Run e2e to verify it passes**

Run: `npm run test tests/features/chat-subagent/chat-subagent-advanced.e2e.spec.ts`
Expected: PASS, including the new test.

- [ ] **Step 5: Commit**

```bash
git add api/src/models/mock-model.ts tests/features/chat-subagent/chat-subagent-advanced.e2e.spec.ts
git commit -m "test(subagents): e2e for concurrent sub-agent panels + mock seam"
```

---

## Task 6: Documentation

Correct the architecture doc's "sequential" claim and document the per-`toolCallId` model.

**Files:**
- Modify: `docs/architecture/sub-agents.md` (lines 26, 130; data-structures ~265-276)

- [ ] **Step 1: Fix the at-a-glance and section-3 claims**

Replace the line 26 sentence ("Sub-agents execute **sequentially**…") and the line 130
paragraph ("Sub-agents execute **sequentially**…") with:

```markdown
Sub-agents run **concurrently** when the main agent requests several in one step — the
AI SDK dispatches each tool call without awaiting the previous (`executeToolCall` is fired
and tracked, not awaited). Each call streams into its own panel, keyed by the delegating
`toolCallId`. The one exception: two concurrent calls to the **same** sub-agent are
serialized (they share accumulated conversation history), so a sub-agent's turns stay
ordered while different sub-agents stay parallel.
```

- [ ] **Step 2: Update the data-structures block**

In the `ChatMessage` example (lines ~265-276), replace:

```typescript
  subAgentMessages?: ChatMessage[]  // full sub-agent trace for UI
  subAgentTurn?: number             // call index (0-based)
```

with:

```typescript
  // Per delegating tool-call id: the sub-agent's full trace + its multi-turn index.
  // Keyed by toolCallId so concurrent delegations render in separate panels.
  subAgentPanels?: Record<string, { messages: ChatMessage[], turn: number }>
```

Add a sentence to section 4 (Async Generator Streaming) noting the live phase is tracked
per `toolCallId` via the composable's `subAgentActivities` map so concurrent panels each
show their own phase.

- [ ] **Step 3: Commit**

```bash
git add docs/architecture/sub-agents.md docs/superpowers/specs/2026-06-29-parallel-subagents-design.md docs/superpowers/plans/2026-06-29-parallel-subagents.md
git commit -m "docs(subagents): document concurrent per-call panels"
```

---

## Final verification

- [ ] `npm run lint-fix` — clean
- [ ] `npm run check-types` — clean
- [ ] `npm run test tests/features/chat-subagent` — all sub-agent unit + e2e tests pass
- [ ] `docker build -t agents .` — passes
- [ ] Manual/trace confirmation (per spec): during the e2e, the two sub-agents' gateway
  calls overlap in time — verify via the trace review page timestamps or mock timing, so
  the design rests on observed concurrency, not just the code reading.

---

## Self-Review (completed by plan author)

**Spec coverage:** §1 data model → Tasks 2,3; §2 execute closure → Task 3; §3 per-panel
activity → Tasks 3,4; §4 toModelOutput → Task 3 (Step 11, unchanged); §5 same-name guard →
Tasks 1,3; §6 docs → Task 6; Testing section → Tasks 1,2,5 + Final verification. All
covered.

**Placeholder scan:** No TBD/TODO; every code step shows concrete code. The only
conditional is `_dev/chat.vue`'s fixture key (Task 4 Step 6), which depends on the
fixture's existing toolCallId — instructions say to read it and reuse/add one.

**Type consistency:** `subAgentPanels: Record<string, { messages, turn }>` used identically
in `ChatMessage` (Task 3), `ScrollMessage` (Task 2, messages-only subset), template
(Task 4), docs (Task 6). `subAgentActivities: Record<string, ChatActivity>` consistent
across composable ref, return, `AgentChat` computed, and the prop. `createSameNameGate`
signature matches between Task 1 and its use in Task 3.
