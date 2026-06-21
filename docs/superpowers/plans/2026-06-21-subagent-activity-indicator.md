# Sub-agent activity indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface a sub-agent's live phase (starting / thinking / running a tool / analyzing) inside its open panel, by unifying the sub-agent and main-assistant stream-processing onto one shared builder.

**Architecture:** Extract the per-part transcript-building logic (currently written twice — inline in the main loop, and via `uiMessageToChatMessages` over a snapshot stream for sub-agents) into one pure `applyStreamPart(part, scope)`. Route both the main `streamText` stream and each sub-agent `ToolLoopAgent` stream through it via `subResult.fullStream`. A single `activity` ref becomes a discriminated union; the component renders `kind:'subagent'` inside the matching panel and everything else on the existing bottom line.

**Tech Stack:** Vue 3 `<script setup>`, the `ai` SDK (`streamText`, `ToolLoopAgent`, `TextStreamPart`), Playwright test projects (`unit` / `api` / `e2e`), vue-i18n.

## Global Constraints

- Pure helper modules MUST be free of Vue, DOM, and the `~` alias so the node-based `unit` test project can import them by relative path (precedent: `ui/src/components/agent-chat/auto-scroll.ts`, `ui/src/composables/sub-agent-flatten.ts`).
- Reactivity rule: after `scope.messages.push(obj)`, read the element back (`scope.current = scope.messages[scope.messages.length - 1]`) so mutations go through Vue's reactive proxy — the main loop already relies on this (`messages.value[messages.value.length - 1]`).
- Keep the existing bottom-line `data-testid="chat-activity"` and the chat-hang e2e green.
- Quality gate (run from repo root): `npm run lint-fix`, `npm run check-types`, `docker build -t agents .`. Tests: `npm run test tests/features/<spec>`.
- i18n entries are bilingual (en + fr) in the component's `<i18n>` block.
- End commit messages with the `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer.

---

## File Structure

- **Create** `ui/src/composables/agent-activity.ts` — pure: `ChatActivity` union + `activityLabelKey()` (activity → i18n key + optional name). One responsibility: the activity vocabulary and its label mapping.
- **Create** `ui/src/composables/agent-stream-parts.ts` — pure: `StreamMessage`, `StreamPart`, `StreamScope`, `applyStreamPart()`. One responsibility: turn one streamed part into transcript mutations.
- **Create** `tests/features/chat-subagent/agent-activity.unit.spec.ts` — unit tests for `activityLabelKey`.
- **Create** `tests/features/chat-subagent/stream-parts.unit.spec.ts` — unit tests for `applyStreamPart`.
- **Modify** `ui/src/composables/use-agent-chat.ts` — adopt `ChatActivity`; main loop + sub-agent both use `applyStreamPart`; delete `uiMessageToChatMessages` and the `readUIMessageStream` import; sub-agent reads `fullStream` with per-scope activity policy.
- **Modify** `ui/src/components/agent-chat/AgentChatMessages.vue` — `ChatActivity` prop; bottom-line label via `activityLabelKey`; in-panel activity line; new i18n keys.
- **Unchanged** `ui/src/components/AgentChat.vue`, `ui/src/components/EvaluatorChat.vue` — they pass `chat.activity.value` through a `computed`; the type flows automatically.

---

### Task 1: Pure activity vocabulary + label mapping

**Files:**
- Create: `ui/src/composables/agent-activity.ts`
- Test: `tests/features/chat-subagent/agent-activity.unit.spec.ts`

**Interfaces:**
- Produces: `ChatActivity` union; `interface ActivityLabel { key: string, name?: string }`; `activityLabelKey(activity: ChatActivity | null | undefined): ActivityLabel | null`.

- [ ] **Step 1: Write the failing test**

Create `tests/features/chat-subagent/agent-activity.unit.spec.ts`:

```ts
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { activityLabelKey, type ChatActivity } from '../../../ui/src/composables/agent-activity.ts'

test.describe('activityLabelKey', () => {
  test('null / undefined → null', () => {
    assert.equal(activityLabelKey(null), null)
    assert.equal(activityLabelKey(undefined), null)
  })

  test('top-level phases map to their keys', () => {
    assert.deepEqual(activityLabelKey({ kind: 'compacting' }), { key: 'activityCompacting' })
    assert.deepEqual(activityLabelKey({ kind: 'thinking' }), { key: 'activityThinking' })
    assert.deepEqual(activityLabelKey({ kind: 'analyzing' }), { key: 'activityAnalyzing' })
  })

  test('analyzing with a sub-agent carries the name for the bottom line', () => {
    assert.deepEqual(
      activityLabelKey({ kind: 'analyzing', subAgent: 'subagent_explorer' }),
      { key: 'activityAnalyzingSubAgent', name: 'subagent_explorer' }
    )
  })

  test('sub-agent phases map to name-less in-panel keys', () => {
    const cases: [ChatActivity, string][] = [
      [{ kind: 'subagent', name: 'subagent_x', phase: 'starting' }, 'activitySubAgentStarting'],
      [{ kind: 'subagent', name: 'subagent_x', phase: 'thinking' }, 'activitySubAgentThinking'],
      [{ kind: 'subagent', name: 'subagent_x', phase: 'tool' }, 'activitySubAgentTool'],
      [{ kind: 'subagent', name: 'subagent_x', phase: 'analyzing' }, 'activitySubAgentAnalyzing']
    ]
    for (const [activity, key] of cases) assert.deepEqual(activityLabelKey(activity), { key })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/chat-subagent/agent-activity.unit.spec.ts`
Expected: FAIL — cannot resolve `ui/src/composables/agent-activity.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `ui/src/composables/agent-activity.ts`:

```ts
/**
 * The activity vocabulary shown in the chat while a turn streams, and the pure
 * mapping from an activity to an i18n key (+ optional sub-agent name). Kept free
 * of Vue and the `~` alias so it can be unit-tested by the node test runner and
 * imported by both the composable (which produces ChatActivity) and the
 * component (which renders it).
 */

export type ChatActivity =
  // Compacting the history before the turn starts.
  | { kind: 'compacting' }
  // Main agent thinking during a gap with no visible output.
  | { kind: 'thinking' }
  // Main agent reading a tool result; `subAgent` (a `subagent_*` tool name) is
  // set when that tool was a sub-agent, so the bottom line can name it.
  | { kind: 'analyzing', subAgent?: string }
  // A sub-agent is active; rendered inside its panel (`name` is its `subagent_*`
  // tool name, used to match the panel — not shown in the label).
  | { kind: 'subagent', name: string, phase: 'starting' | 'thinking' | 'tool' | 'analyzing' }

export interface ActivityLabel {
  key: string
  // Interpolation value for keys that name a sub-agent (bottom-line analyzing only).
  name?: string
}

export function activityLabelKey (activity: ChatActivity | null | undefined): ActivityLabel | null {
  if (!activity) return null
  switch (activity.kind) {
    case 'compacting': return { key: 'activityCompacting' }
    case 'thinking': return { key: 'activityThinking' }
    case 'analyzing': return activity.subAgent
      ? { key: 'activityAnalyzingSubAgent', name: activity.subAgent }
      : { key: 'activityAnalyzing' }
    case 'subagent':
      switch (activity.phase) {
        case 'starting': return { key: 'activitySubAgentStarting' }
        case 'tool': return { key: 'activitySubAgentTool' }
        case 'analyzing': return { key: 'activitySubAgentAnalyzing' }
        default: return { key: 'activitySubAgentThinking' }
      }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/features/chat-subagent/agent-activity.unit.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add ui/src/composables/agent-activity.ts tests/features/chat-subagent/agent-activity.unit.spec.ts
git commit -m "feat(activity): pure ChatActivity vocabulary + label mapping

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Pure shared stream-part builder

**Files:**
- Create: `ui/src/composables/agent-stream-parts.ts`
- Test: `tests/features/chat-subagent/stream-parts.unit.spec.ts`

**Interfaces:**
- Produces: `StreamMessage`, `StreamPart`, `ActivityPhase = 'streaming' | 'tool' | 'analyzing' | 'thinking'`, `StreamScope`, `applyStreamPart(part: StreamPart, scope: StreamScope): void`.
- Consumes: nothing.

- [ ] **Step 1: Write the failing test**

Create `tests/features/chat-subagent/stream-parts.unit.spec.ts`:

```ts
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { applyStreamPart, type StreamScope, type ActivityPhase } from '../../../ui/src/composables/agent-stream-parts.ts'

function makeScope () {
  const phases: [ActivityPhase, string | undefined][] = []
  const scope: StreamScope = {
    messages: [],
    current: null,
    producedText: false,
    stepHadTool: false,
    setActivity: (phase, toolName) => { phases.push([phase, toolName]) }
  }
  return { scope, phases }
}

test.describe('applyStreamPart', () => {
  test('text-delta builds one assistant message and flags producedText', () => {
    const { scope, phases } = makeScope()
    applyStreamPart({ type: 'text-delta', text: 'Hel' }, scope)
    applyStreamPart({ type: 'text-delta', text: 'lo' }, scope)
    assert.equal(scope.messages.length, 1)
    assert.equal(scope.messages[0].content, 'Hello')
    assert.equal(scope.producedText, true)
    assert.deepEqual(phases, [['streaming', undefined], ['streaming', undefined]])
  })

  test('tool-call pushes a pending invocation and flags stepHadTool', () => {
    const { scope, phases } = makeScope()
    applyStreamPart({ type: 'tool-call', toolCallId: 'c1', toolName: 'subagent_explorer' }, scope)
    assert.equal(scope.stepHadTool, true)
    assert.equal(scope.lastToolName, 'subagent_explorer')
    assert.deepEqual(scope.messages[0].toolInvocations, [{ toolCallId: 'c1', toolName: 'subagent_explorer', state: 'pending' }])
    assert.deepEqual(phases.at(-1), ['tool', 'subagent_explorer'])
  })

  test('final tool-result settles the matching invocation; preliminary does not', () => {
    const { scope } = makeScope()
    applyStreamPart({ type: 'tool-call', toolCallId: 'c1', toolName: 't' }, scope)
    applyStreamPart({ type: 'tool-result', toolCallId: 'c1', preliminary: true }, scope)
    assert.equal(scope.messages[0].toolInvocations![0].state, 'pending')
    applyStreamPart({ type: 'tool-result', toolCallId: 'c1' }, scope)
    assert.equal(scope.messages[0].toolInvocations![0].state, 'done')
  })

  test('tool-error settles the chip so it stops spinning', () => {
    const { scope } = makeScope()
    applyStreamPart({ type: 'tool-call', toolCallId: 'c1', toolName: 't' }, scope)
    applyStreamPart({ type: 'tool-error', toolCallId: 'c1' }, scope)
    assert.equal(scope.messages[0].toolInvocations![0].state, 'done')
  })

  test('finish-step: after a tool → analyzing(named); without → thinking; resets flags & current', () => {
    const { scope, phases } = makeScope()
    applyStreamPart({ type: 'tool-call', toolCallId: 'c1', toolName: 'subagent_x' }, scope)
    applyStreamPart({ type: 'finish-step' }, scope)
    assert.deepEqual(phases.at(-1), ['analyzing', 'subagent_x'])
    assert.equal(scope.stepHadTool, false)
    assert.equal(scope.lastToolName, undefined)
    assert.equal(scope.current, null)
    applyStreamPart({ type: 'finish-step' }, scope)
    assert.deepEqual(phases.at(-1), ['thinking', undefined])
  })

  test('a new step starts a new assistant message', () => {
    const { scope } = makeScope()
    applyStreamPart({ type: 'text-delta', text: 'first' }, scope)
    applyStreamPart({ type: 'finish-step' }, scope)
    applyStreamPart({ type: 'text-delta', text: 'second' }, scope)
    assert.equal(scope.messages.length, 2)
    assert.equal(scope.messages[1].content, 'second')
  })

  test('unknown part types are ignored', () => {
    const { scope } = makeScope()
    applyStreamPart({ type: 'finish' }, scope)
    applyStreamPart({ type: 'reasoning-delta', text: 'x' }, scope)
    assert.equal(scope.messages.length, 0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/chat-subagent/stream-parts.unit.spec.ts`
Expected: FAIL — cannot resolve `ui/src/composables/agent-stream-parts.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `ui/src/composables/agent-stream-parts.ts`:

```ts
/**
 * One shared builder that turns a single streamed part into mutations on a
 * StreamScope. Both the main assistant stream and every sub-agent stream feed
 * their parts through this, so the two transcripts are built identically
 * (previously the sub-agent used its own snapshot converter that could drift).
 * Kept free of Vue/DOM and of the `ai` runtime (structural types only) so it can
 * be unit-tested directly by the node test runner.
 */

// Structural subset of ChatMessage the builder reads/writes; the real
// ChatMessage (from use-agent-chat) is assignable to this.
export interface StreamMessage {
  role: 'user' | 'assistant'
  content: string
  toolInvocations?: { toolCallId: string, toolName: string, state: 'pending' | 'done' }[]
}

// Structural subset of the AI SDK's TextStreamPart covering the parts we build
// from; real TextStreamPart is assignable to this. Other part types are ignored.
export interface StreamPart {
  type: string
  text?: string
  toolCallId?: string
  toolName?: string
  preliminary?: boolean
}

export type ActivityPhase = 'streaming' | 'tool' | 'analyzing' | 'thinking'

export interface StreamScope {
  // Sink for assistant messages. MUST be the reactive array under Vue
  // (messages.value, or a message's subAgentMessages) so the read-back yields a
  // reactive proxy whose mutations the UI observes.
  messages: StreamMessage[]
  // Message currently being appended to; reset to null at each finish-step.
  current: StreamMessage | null
  // True once any assistant text was produced (drives the empty-turn fallback).
  producedText: boolean
  // True when the current step issued a tool call (drives analyzing vs thinking).
  stepHadTool: boolean
  // toolName of the latest tool-call this step, surfaced so the post-step label
  // can name a sub-agent.
  lastToolName?: string
  // Per-scope policy: maps the logical phase to the UI activity indicator.
  setActivity: (phase: ActivityPhase, toolName?: string) => void
}

export function applyStreamPart (part: StreamPart, scope: StreamScope): void {
  switch (part.type) {
    case 'text-delta': {
      // Text is visibly streaming (markdown cursor); drop the gap label.
      if (part.text) { scope.producedText = true; scope.setActivity('streaming') }
      if (!scope.current) {
        scope.messages.push({ role: 'assistant', content: '' })
        // Read back so we mutate the reactive proxy, not the raw object.
        scope.current = scope.messages[scope.messages.length - 1]
      }
      scope.current.content += part.text ?? ''
      break
    }
    case 'tool-call': {
      // The tool chip (pending) is the in-transcript signal; name the tool so the
      // post-step label can mention a sub-agent.
      scope.stepHadTool = true
      scope.lastToolName = part.toolName
      scope.setActivity('tool', part.toolName)
      if (!scope.current) {
        scope.messages.push({ role: 'assistant', content: '', toolInvocations: [] })
        scope.current = scope.messages[scope.messages.length - 1]
      }
      if (!scope.current.toolInvocations) scope.current.toolInvocations = []
      scope.current.toolInvocations.push({
        toolCallId: part.toolCallId ?? '',
        toolName: part.toolName ?? '',
        state: 'pending'
      })
      break
    }
    case 'tool-result': {
      // Async-generator tools emit preliminary results; only the final one settles.
      if (!part.preliminary && scope.current?.toolInvocations) {
        const inv = scope.current.toolInvocations.find(ti => ti.toolCallId === part.toolCallId)
        if (inv) inv.state = 'done'
      }
      break
    }
    case 'tool-error': {
      // execute threw: the SDK feeds the error back but emits no tool-result, so
      // settle the chip here to stop it spinning forever.
      if (scope.current?.toolInvocations) {
        const inv = scope.current.toolInvocations.find(ti => ti.toolCallId === part.toolCallId)
        if (inv) inv.state = 'done'
      }
      break
    }
    case 'finish-step': {
      // New step → new assistant message. A step that called a tool is normally
      // followed by a continuation step reading the result — label that gap.
      scope.current = null
      scope.setActivity(scope.stepHadTool ? 'analyzing' : 'thinking', scope.lastToolName)
      scope.stepHadTool = false
      scope.lastToolName = undefined
      break
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/features/chat-subagent/stream-parts.unit.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add ui/src/composables/agent-stream-parts.ts tests/features/chat-subagent/stream-parts.unit.spec.ts
git commit -m "feat(activity): shared applyStreamPart transcript builder

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Adopt ChatActivity + applyStreamPart in the main loop and bottom line

This is a coordinated type flip (composable produces `ChatActivity`, component consumes it) plus routing the main stream through `applyStreamPart`. Behavior of the bottom line is unchanged except that, once sub-agents reroute (Task 4), the leave-gap label can name the sub-agent. No new unit test — `applyStreamPart` is covered by Task 2; verify with `check-types`, `lint`, and the existing chat-hang e2e.

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts`
- Modify: `ui/src/components/agent-chat/AgentChatMessages.vue`

**Interfaces:**
- Consumes: `ChatActivity` (Task 1), `applyStreamPart` / `StreamScope` (Task 2).
- Produces: `useAgentChat().activity` is now `Ref<ChatActivity | null>`; `mainScope.current` replaces the local `currentAssistantMessage`; `mainScope.producedText` replaces local `producedText`.

- [ ] **Step 1: Import the new modules in the composable**

In `ui/src/composables/use-agent-chat.ts`, add after the existing import block (e.g. after line 14, the `import Debug from 'debug'` line):

```ts
import type { ChatActivity } from './agent-activity.ts'
import { applyStreamPart, type StreamScope } from './agent-stream-parts.ts'
```

- [ ] **Step 2: Flip the `activity` ref type**

Replace (line 179):

```ts
  const activity = ref<'compacting' | 'thinking' | 'analyzing' | null>(null)
```

with:

```ts
  const activity = ref<ChatActivity | null>(null)
```

- [ ] **Step 3: Update the compaction activity set**

In `compactHistory`, replace:

```ts
    activity.value = 'compacting'
```

with:

```ts
    activity.value = { kind: 'compacting' }
```

- [ ] **Step 4: Replace the per-turn locals with a `mainScope` and the two `thinking` sets**

Replace the block at lines 498–520 (from `let currentAssistantMessage` through the `armWatchdog()` after the first `activity.value = 'thinking'`):

```ts
    let currentAssistantMessage: ChatMessage | null = null
    let streamError: unknown = null
    // Whether the assistant emitted any text this turn. A clean finish with no text
    // means a blank turn (empty completion / empty sub-agent / step limit on a tool
    // call); we surface a fallback rather than ending the conversation silently.
    let producedText = false
    // Idle watchdog: a turn that goes silent for too long (no compaction result, no
    // SSE part) is hung. Re-armed on every part received and around compaction; on
    // expiry it aborts the turn so the catch surfaces a recoverable timeout instead
    // of an endless spinner. `timedOut` distinguishes it from a user-initiated abort.
    let timedOut = false
    let watchdog: ReturnType<typeof setTimeout> | undefined
    const idleMs = Number(sessionStorage.getItem('agent-chat-idle-timeout')) || STREAM_IDLE_TIMEOUT_MS
    const armWatchdog = () => {
      if (watchdog) clearTimeout(watchdog)
      watchdog = setTimeout(() => { timedOut = true; abortController?.abort() }, idleMs)
    }
    // 'analyzing' (the post-tool continuation gap) only applies after a step that
    // actually called a tool; track it across the loop to label that gap correctly.
    let stepHadTool = false

    activity.value = 'thinking'
    armWatchdog()
```

with:

```ts
    let streamError: unknown = null
    let timedOut = false
    let watchdog: ReturnType<typeof setTimeout> | undefined
    const idleMs = Number(sessionStorage.getItem('agent-chat-idle-timeout')) || STREAM_IDLE_TIMEOUT_MS
    const armWatchdog = () => {
      if (watchdog) clearTimeout(watchdog)
      watchdog = setTimeout(() => { timedOut = true; abortController?.abort() }, idleMs)
    }

    // The main assistant transcript is built by the shared applyStreamPart, the same
    // builder each sub-agent uses. `current`, `producedText` and `stepHadTool` live on
    // the scope; the sub-agent execute closure reads `mainScope.current` as its parent
    // message. The main bottom line stays quiet while a tool runs (its chip spins, and
    // a sub-agent drives its own panel line); the post-step gap names the sub-agent.
    const mainScope: StreamScope = {
      messages: messages.value,
      current: null,
      producedText: false,
      stepHadTool: false,
      setActivity: (phase, toolName) => {
        switch (phase) {
          case 'streaming':
          case 'tool':
            activity.value = null
            break
          case 'analyzing':
            activity.value = { kind: 'analyzing', subAgent: toolName?.startsWith('subagent_') ? toolName : undefined }
            break
          case 'thinking':
            activity.value = { kind: 'thinking' }
            break
        }
      }
    }

    activity.value = { kind: 'thinking' }
    armWatchdog()
```

- [ ] **Step 5: Update the post-compaction `thinking` set**

A few lines below, replace:

```ts
      await compactHistory(compactionCtxId, signal)
      activity.value = 'thinking'
      armWatchdog()
```

with:

```ts
      await compactHistory(compactionCtxId, signal)
      activity.value = { kind: 'thinking' }
      armWatchdog()
```

- [ ] **Step 6: Route the main loop's building branches through applyStreamPart**

Replace the five building branches — `text-delta`, `tool-call`, `tool-result`, `tool-error`, `finish-step` (current lines 771–823, i.e. everything from `if (part.type === 'text-delta') {` through the close of the `else if (part.type === 'finish-step')` block) — with:

```ts
        applyStreamPart(part, mainScope)
```

Leave the two branches above it untouched: `if (part.type === 'finish' && part.finishReason === 'content-filter')` (the moderation rollback) and `if (part.type === 'error')` (capture + break). Note `applyStreamPart` runs for every other part type and ignores `finish`/`error`/unknown, so it is safe to call unconditionally after those two guards. Keep the `armWatchdog()` at the top of the loop.

- [ ] **Step 7: Repoint `currentAssistantMessage` and `producedText` reads**

The local `currentAssistantMessage` and `producedText` no longer exist. Update their remaining readers:

- The empty-turn fallback — replace:

```ts
      if (!producedText) {
```

with:

```ts
      if (!mainScope.producedText) {
```

- In the sub-agent tool's `execute` (covered in Task 4) every `currentAssistantMessage` becomes `mainScope.current`. Task 4 rewrites that block wholesale, so no separate edit is needed here — but after this task `check-types` will flag the `execute` block's `currentAssistantMessage` references. To keep this task green, do a mechanical rename of `currentAssistantMessage` → `mainScope.current` in the `execute` block now (lines ~600–664); Task 4 then rewrites it fully.

- [ ] **Step 8: Update the component prop type, bottom-line label, and i18n**

In `ui/src/components/agent-chat/AgentChatMessages.vue`:

Add to the script imports (near line 241, beside `import type { ChatMessage } from '~/composables/use-agent-chat'`):

```ts
import { activityLabelKey, type ChatActivity } from '~/composables/agent-activity'
```

Replace the prop (line 256):

```ts
  activity?: 'compacting' | 'thinking' | 'analyzing' | null
```

with:

```ts
  activity?: ChatActivity | null
```

Replace the `activityLabel` computed (lines 292–298):

```ts
const activityLabel = computed(() => {
  switch (props.activity) {
    case 'compacting': return t('activityCompacting')
    case 'analyzing': return t('activityAnalyzing')
    default: return t('activityThinking')
  }
})
```

with:

```ts
// Bottom-line label: top-level phases only. Sub-agent phases (kind 'subagent')
// render inside their panel via subAgentActivityLabel, not here.
const activityLabel = computed(() => {
  const a = props.activity
  if (!a || a.kind === 'subagent') return ''
  const label = activityLabelKey(a)
  if (!label) return ''
  return t(label.key, label.name ? { name: subAgentTitle(label.name) } : {})
})
```

Guard the bottom-line `v-if` (line 171) so it hides for sub-agent activity and when there is no label — replace:

```html
          v-if="isStreaming && activity"
```

with:

```html
          v-if="isStreaming && activityLabel"
```

Add the bottom-line i18n key to both locales in the `<i18n>` block (alongside the existing `activityAnalyzing`):

```yaml
  activityAnalyzingSubAgent: Analyse du résultat de {name}…
```

(fr, under `fr:`) and:

```yaml
  activityAnalyzingSubAgent: Analyzing {name}'s result…
```

(en, under `en:`).

- [ ] **Step 9: Verify types, lint, and existing e2e**

Run: `npm run check-types`
Expected: PASS (no errors).

Run: `npm run lint-fix`
Expected: PASS (pre-existing `MarkdownContent.vue` v-html warning only).

Run: `npm run test tests/features/chat-hang/chat-hang.e2e.spec.ts`
Expected: PASS — the bottom-line `chat-activity` indicator (compacting / timeout) still works.

- [ ] **Step 10: Commit**

```bash
git add ui/src/composables/use-agent-chat.ts ui/src/components/agent-chat/AgentChatMessages.vue
git commit -m "refactor(activity): object ChatActivity + applyStreamPart in main loop

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Reroute sub-agents through fullStream + applyStreamPart, render the in-panel line

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts`
- Modify: `ui/src/components/agent-chat/AgentChatMessages.vue`

**Interfaces:**
- Consumes: `applyStreamPart` / `StreamScope` (Task 2), `mainScope.current` (Task 3), `ChatActivity` (Task 1).
- Produces: sub-agent `execute` builds into `mainScope.current.subAgentMessages` via a sub-scope and drives `activity = { kind:'subagent', name, phase }`; `uiMessageToChatMessages` and the `readUIMessageStream` import are removed.

- [ ] **Step 1: Delete `uiMessageToChatMessages` and the `readUIMessageStream` import**

Remove `readUIMessageStream` from the `ai` import (line 2):

```ts
import { streamText, generateText, stepCountIs, tool, jsonSchema, ToolLoopAgent } from 'ai'
```

Delete the entire `uiMessageToChatMessages` function (its doc comment + body, current lines ~388–417).

- [ ] **Step 2: Rewrite the sub-agent `execute` generator**

Replace the whole `execute: async function * (...) { ... }` body (current lines 593–668) with:

```ts
          execute: async function * (args: any, { abortSignal }: { abortSignal?: AbortSignal }) {
            // Track multi-turn state for this sub-agent
            const priorMessages = subAgentHistory.get(name) ?? []
            const callIndex = subAgentCallCount.get(name) ?? 0
            subAgentCallCount.set(name, callIndex + 1)

            // The parent assistant message hosting this sub-agent's panel.
            const parentMsg = mainScope.current
            const parentToolCallId = parentMsg?.toolInvocations?.find(
              ti => ti.toolName === name && ti.state === 'pending'
            )?.toolCallId ?? name

            // Fresh reactive array for this run's panel transcript; reading it back
            // gives the reactive proxy the builder must push into.
            if (parentMsg) {
              parentMsg.subAgentMessages = []
              parentMsg.subAgentTurn = callIndex
            }

            // Same shared builder as the main loop, but its activity drives the SAME
            // global `activity` ref tagged for THIS sub-agent, so the component shows
            // the phase inside this panel. Unlike the main line, the 'tool' phase shows
            // (sub-agent chips don't spin, so the panel line carries it).
            const subScope: StreamScope = {
              messages: parentMsg?.subAgentMessages ?? [],
              current: null,
              producedText: false,
              stepHadTool: false,
              setActivity: (phase) => {
                switch (phase) {
                  case 'streaming': activity.value = null; break
                  case 'tool': activity.value = { kind: 'subagent', name, phase: 'tool' }; break
                  case 'analyzing': activity.value = { kind: 'subagent', name, phase: 'analyzing' }; break
                  case 'thinking': activity.value = { kind: 'subagent', name, phase: 'thinking' }; break
                }
              }
            }

            // Enter gap: name the spin-up before the first token arrives.
            activity.value = { kind: 'subagent', name, phase: 'starting' }

            let subStreamError: unknown = null
            try {
              // First call: single prompt. Subsequent calls: pass accumulated history.
              const subResult = priorMessages.length === 0
                // `headers` is a construction-time setting in the AI SDK's agent types, not a
                // call-time param, so we widen only for it while keeping the rest type-checked.
                ? await subAgent.stream({ prompt: args.task, abortSignal, headers: traceHeaders(`sub:${ctxName}:${callIndex}:${parentToolCallId}`) } as Parameters<typeof subAgent.stream>[0] & { headers: Record<string, string> })
                : await subAgent.stream({
                  messages: [...priorMessages, { role: 'user' as const, content: args.task }],
                  abortSignal,
                  headers: traceHeaders(`sub:${ctxName}:${callIndex}:${parentToolCallId}`)
                } as Parameters<typeof subAgent.stream>[0] & { headers: Record<string, string> })

              // Build the panel transcript from the same delta parts the main loop uses,
              // yielding a snapshot each part so the SDK gets streaming preliminary results.
              for await (const part of subResult.fullStream) {
                // In-band provider error (the #38 silent-drop class): the SDK does not
                // throw it, so capture and stop instead of finishing as a blank sub-agent.
                if (part.type === 'error') { subStreamError = (part as any).error; break }
                applyStreamPart(part, subScope)
                yield [...subScope.messages]
              }
              if (subStreamError) throw subStreamError

              // Accumulate history for the next call to this sub-agent
              const subResponse = await subResult.response
              // A content_filter on the sub-agent's own gateway call (untrusted callers)
              // surfaces as a refusal output instead of aborting the whole turn.
              if ((await subResult.finishReason) === 'content-filter') {
                // User-facing refusal for the panel; moderationBlocked tells
                // toModelOutput to hand the main agent SUBAGENT_MODERATION_NOTICE
                // instead of this generic text so it can react appropriately.
                const refusal: ChatMessage = { role: 'assistant', content: options.refusalMessage || DEFAULT_REFUSAL, moderationBlocked: true }
                if (parentMsg) {
                  parentMsg.subAgentMessages = [...(parentMsg.subAgentMessages ?? []), refusal]
                }
                yield [refusal]
              }
              subAgentHistory.set(name, [
                ...priorMessages,
                { role: 'user' as const, content: args.task },
                ...subResponse.messages
              ])
            } catch (subErr: any) {
              // Let an abort tear down the whole turn (handled by sendMessage's catch).
              if (subErr?.name === 'AbortError') throw subErr
              // Any other sub-agent failure (its own gateway/provider error) would
              // otherwise surface as an unhandled tool-error: the model gets no result,
              // the panel keeps spinning, and the turn can end with no visible output.
              // Yield a final error message instead so the failure is shown and becomes
              // this tool's output (via toModelOutput) for the main agent to react to.
              debug('sub-agent %s failed: %O', name, subErr)
              const errorMsg: ChatMessage = { role: 'assistant', content: DEFAULT_SUBAGENT_ERROR }
              if (parentMsg) {
                parentMsg.subAgentMessages = [...(parentMsg.subAgentMessages ?? []), errorMsg]
              }
              yield [errorMsg]
            }
          },
```

Note: if `check-types` rejects `applyStreamPart(part, subScope)` because `TextStreamPart` is not seen as assignable to `StreamPart`, change the call to `applyStreamPart(part as unknown as StreamPart, subScope)` and add `StreamPart` to the `agent-stream-parts.ts` import.

- [ ] **Step 3: Add the in-panel activity line and helper in the component**

In `ui/src/components/agent-chat/AgentChatMessages.vue`, replace the no-messages placeholder block (current lines 151–156):

```html
                      <div
                        v-else
                        class="text-body-medium text-medium-emphasis"
                      >
                        {{ invocation.state === 'done' ? t('subAgentDone') : t('subAgentRunning') }}
                      </div>
```

with:

```html
                      <div
                        v-else-if="invocation.state === 'done'"
                        class="text-body-medium text-medium-emphasis"
                      >
                        {{ t('subAgentDone') }}
                      </div>
                      <!-- Live phase of this sub-agent, shown inside its open panel
                           (the running pane is open anyway). Replaces the bottom line
                           for sub-agent work; the panel title still spins if collapsed. -->
                      <div
                        v-if="isStreaming && index === messages.length - 1 && subAgentActivityLabel(invocation.toolName)"
                        class="d-flex align-center text-caption text-medium-emphasis py-1"
                        data-testid="subagent-activity"
                      >
                        <v-icon
                          :icon="mdiLoading"
                          size="x-small"
                          class="agent-chat__spin mr-2"
                        />
                        <span class="font-italic">{{ subAgentActivityLabel(invocation.toolName) }}</span>
                      </div>
```

Add the helper in the script (near `activityLabel`, after the `subAgentTitle` definition or anywhere in setup scope):

```ts
// In-panel label for the sub-agent whose `subagent_*` tool name matches the
// current activity; '' for any other panel.
const subAgentActivityLabel = (toolName: string) => {
  const a = props.activity
  if (!a || a.kind !== 'subagent' || a.name !== toolName) return ''
  const label = activityLabelKey(a)
  return label ? t(label.key) : ''
}
```

Update the `<i18n>` block: remove the now-unused `subAgentRunning` key from both locales and add the four sub-agent phase keys. Under `fr:`:

```yaml
  activitySubAgentStarting: Démarrage…
  activitySubAgentThinking: Réflexion…
  activitySubAgentTool: Exécution d'un outil…
  activitySubAgentAnalyzing: Analyse du résultat de l'outil…
```

Under `en:`:

```yaml
  activitySubAgentStarting: Starting…
  activitySubAgentThinking: Thinking…
  activitySubAgentTool: Running a tool…
  activitySubAgentAnalyzing: Analyzing tool result…
```

- [ ] **Step 4: Verify types, lint, unit, and sub-agent e2e**

Run: `npm run check-types`
Expected: PASS.

Run: `npm run lint-fix`
Expected: PASS (pre-existing v-html warning only).

Run: `npm run test tests/features/chat-subagent`
Expected: PASS — existing sub-agent unit/e2e specs (rendering, autoscroll, flatten) still green with the rerouted stream.

- [ ] **Step 5: Manual check with the dev app**

Open the chat (dev UI) with sub-agents enabled and send a prompt that delegates to a sub-agent that calls a tool. Confirm: the panel shows "Starting…" immediately on delegation, "Running a tool…" while the sub-agent's tool runs, and the bottom line reads "Analyzing <name>'s result…" after it returns. (Do not start/stop dev processes; use the already-running dev server — `bash dev/status.sh` if unsure.)

- [ ] **Step 6: Commit**

```bash
git add ui/src/composables/use-agent-chat.ts ui/src/components/agent-chat/AgentChatMessages.vue
git commit -m "feat(activity): unify sub-agent stream + in-panel activity line

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Full verification + optional e2e for the in-panel line

**Files:**
- (Optional) Modify: `api/src/models/mock-model.ts`, a spec under `tests/features/chat-subagent/`

- [ ] **Step 1: Full quality gate**

Run: `npm run lint-fix` → PASS (pre-existing v-html warning only).
Run: `npm run check-types` → PASS.
Run: `npm run test tests/features/chat-subagent tests/features/chat-hang` → PASS.

- [ ] **Step 2: Decide on the in-panel e2e (conditional)**

Inspect `api/src/models/mock-model.ts` for a deterministic seam that holds a sub-agent in a tool phase long enough to observe `data-testid="subagent-activity"` (the existing chat-hang spec uses a "stall" seam; check whether the sub-agent path can reuse it).

- If a deterministic hold-point exists or can be added with a small mock seam mirroring the existing stall seam, add an e2e: delegate to a sub-agent that calls a tool, assert `getByTestId('subagent-activity')` becomes visible with the "Running a tool…" text, then resolves. Run: `npm run test tests/features/chat-subagent/<new-spec>.e2e.spec.ts` → PASS.
- If no deterministic seam is reasonable, **do not** add a flaky transient-line assertion. Record that the in-panel line is covered by the `activityLabelKey` + `applyStreamPart` unit tests and manual verification, and stop here.

- [ ] **Step 3: Docker build**

Run: `docker build -t agents .`
Expected: build succeeds.

- [ ] **Step 4: Commit (only if Step 2 added files)**

```bash
git add api/src/models/mock-model.ts tests/features/chat-subagent/
git commit -m "test(activity): e2e for in-panel sub-agent activity line

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Shared builder (spec A) → Task 2 (`applyStreamPart`) + Tasks 3–4 (both loops adopt it; `uiMessageToChatMessages`/`readUIMessageStream` deleted in Task 4).
- Activity union + per-scope policy (spec B) → Task 1 (`ChatActivity`), Task 3 (main scope policy + enter/leave naming), Task 4 (sub scope policy + `starting`).
- Contextual rendering (spec C) → Task 3 (bottom line via `activityLabelKey`, `kind:'subagent'` excluded), Task 4 (in-panel line + `subAgentActivityLabel`).
- Safety bonus — sub-agent in-band `error` capture (spec D) → Task 4 Step 2 (`subStreamError`).
- Testing (spec E) → Tasks 1–2 unit; Task 4 existing sub-agent specs; Task 5 conditional e2e + docker.
- Non-goals (concurrent sub-agents race; no tool name in label) → respected; the in-panel line matches on `activity.name === invocation.toolName`, so a second concurrent sub-agent simply doesn't light its line rather than mislabeling.

**Placeholder scan:** none — every step carries concrete code or an exact command + expected result. The only conditional is Task 5 Step 2, gated explicitly on a mock seam with a defined fallback.

**Type consistency:** `ChatActivity`, `StreamScope`, `StreamPart`, `ActivityPhase`, `activityLabelKey`, `applyStreamPart`, `mainScope`, `subScope`, `subAgentActivityLabel` are used with identical names/shapes across tasks. `mainScope.current`/`mainScope.producedText` consistently replace the deleted `currentAssistantMessage`/`producedText` locals. The i18n keys emitted by `activityLabelKey` (Task 1) exactly match those added to the component (`activityAnalyzingSubAgent` in Task 3; `activitySubAgent*` in Task 4).
