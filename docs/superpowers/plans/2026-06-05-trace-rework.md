# Trace Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make tracing always-on for every user, let every user inspect/download their own trace, and give admins a dedicated trace-review page (trace view + AI evaluator chat) fed by a downloaded or handed-off trace.

**Architecture:** Tracing stays in-memory and ephemeral. A new `serializeTrace`/`SessionRecorder.fromTrace` seam turns a live trace into JSON and rehydrates it (reviving `Date` fields). A transient `localStorage` bridge (write-on-click, delete-on-read, download fallback on quota) carries the live trace to a new-tab admin review page. The trace panel is extracted into a shared `TraceView.vue` used by both the per-session info dialog and the review page. The evaluator chat is removed from the main chat and rebuilt on the review page as a plain `useAgentChat` instance with the existing local trace tools and the `evaluator` model.

**Tech Stack:** Vue 3 (`<script setup>`), Vuetify, vue-i18n, Vitest-style unit tests via `playwright/test` (the `unit` project), AI SDK (`ai`).

**Reference (read before coding):**
- Spec: `docs/superpowers/specs/2026-06-05-trace-rework-design.md`
- `ui/src/traces/session-recorder.ts` — recorder + trace types
- `ui/src/traces/evaluator-tools.ts` — `buildEvaluatorTools(recorder, opts)`
- `ui/src/components/AgentChat.vue` — current wiring (recorder, evaluator tab, `traceOverview`)
- `ui/src/components/agent-chat/AgentChatDebugDialog.vue` — current trace panel + start/stop
- `ui/src/components/agent-chat/AgentChatHeader.vue` — Info button + tabs
- `ui/src/pages/[type]/[id]/chat.vue` — `debugEnabled` (admin) computation
- `ui/src/pages/[type]/[id]/settings.vue` — page/route/session conventions
- `tests/features/agents/session-recorder.unit.spec.ts` — unit test pattern
- Router base: `ui/src/main.ts:19` → `createWebHistory($sitePath + '/agents/')`

**Commands:**
- Run one unit file: `npm run test tests/features/agents/session-recorder.unit.spec.ts`
- Type-check: `npm run check-types`
- Lint: `npm run lint-fix`

---

## Task 1: Trace serialization & rehydration (`serializeTrace` + `SessionRecorder.fromTrace`)

**Files:**
- Modify: `ui/src/traces/session-recorder.ts`
- Test: `tests/features/agents/session-recorder.unit.spec.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/features/agents/session-recorder.unit.spec.ts` (add `serializeTrace` to the existing import from `session-recorder.ts`):

```ts
import { SessionRecorder, serializeTrace } from '../../../ui/src/traces/session-recorder.ts'

test.describe('SessionRecorder - serialization', () => {
  test('serializeTrace + fromTrace round-trips and revives Date fields', () => {
    const recorder = new SessionRecorder()
    recorder.setSystemPrompt('sys')
    recorder.snapshotTools([{ name: 'search', description: 'd', inputSchema: { type: 'object' } }])
    recorder.startTurn('hello')
    recorder.startToolCall('tc1', 'search', { q: 'x' })
    recorder.finishToolCall('tc1', { ok: true })
    recorder.finishStep()
    recorder.addStepMessages([{ role: 'assistant', content: [{ type: 'text', text: 'hi' }] }], 'stop')
    recorder.recordPhysicalRequest({
      contextId: 'c', timestamp: new Date(), modelRole: 'assistant',
      requestBody: { a: 1 }, result: { content: 'hi', toolCalls: [] },
      inputTokens: 1, outputTokens: 2, messageCount: 1, toolCount: 1, bodyChars: 10, durationMs: 5
    })

    const json = serializeTrace(recorder.getTrace())
    const restored = SessionRecorder.fromTrace(JSON.parse(json))

    const overview = restored.getTraceOverview()
    assert.equal(overview.length, recorder.getTraceOverview().length)
    for (const e of overview) assert.ok(e.timestamp instanceof Date, `entry ${e.index} timestamp not a Date`)
    assert.ok(restored.getTrace().turns[0].timestamp instanceof Date)
    assert.ok(restored.getTrace().turns[0].steps[0].toolCalls[0].timestamp instanceof Date)
    assert.ok(restored.getTrace().physicalRequests[0].timestamp instanceof Date)
  })

  test('fromTrace tolerates an empty trace', () => {
    const restored = SessionRecorder.fromTrace({ systemPrompt: '', toolSnapshots: [], toolChanges: [], turns: [], physicalRequests: [] })
    assert.deepEqual(restored.getTraceOverview(), [])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test tests/features/agents/session-recorder.unit.spec.ts`
Expected: FAIL — `serializeTrace` / `SessionRecorder.fromTrace` are not exported / not a function.

- [ ] **Step 3: Implement serialization + revival**

In `ui/src/traces/session-recorder.ts`, add at module scope (after the `SessionTrace` interface, before `export class SessionRecorder`):

```ts
export function serializeTrace (trace: SessionTrace): string {
  return JSON.stringify(trace)
}

const toDate = (v: any): Date => (v instanceof Date ? v : new Date(v))

function reviveStepDates (step: any): void {
  step.timestamp = toDate(step.timestamp)
  for (const tc of step.toolCalls ?? []) {
    tc.timestamp = toDate(tc.timestamp)
    if (tc.endTimestamp) tc.endTimestamp = toDate(tc.endTimestamp)
    for (const subStep of tc.subAgent?.steps ?? []) reviveStepDates(subStep)
  }
}

// Mutates `trace` in place, turning ISO strings back into Date objects, and returns it.
export function reviveTraceDates (trace: SessionTrace): SessionTrace {
  for (const turn of trace.turns ?? []) {
    turn.timestamp = toDate(turn.timestamp)
    for (const step of turn.steps ?? []) reviveStepDates(step)
  }
  for (const tc of trace.toolChanges ?? []) tc.timestamp = toDate(tc.timestamp)
  for (const pr of trace.physicalRequests ?? []) pr.timestamp = toDate(pr.timestamp)
  return trace
}
```

Then add this static factory inside the `SessionRecorder` class (e.g. right after the `getTrace ()` method):

```ts
  static fromTrace (raw: SessionTrace): SessionRecorder {
    const recorder = new SessionRecorder()
    recorder.trace = reviveTraceDates(raw)
    return recorder
  }
```

(`buildCache()` already rebuilds on every `getTraceOverview`/`getTraceEntry`, so no cache reset is needed.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test tests/features/agents/session-recorder.unit.spec.ts`
Expected: PASS (all describe blocks).

- [ ] **Step 5: Type-check**

Run: `npm run check-types`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add ui/src/traces/session-recorder.ts tests/features/agents/session-recorder.unit.spec.ts
git commit -m "feat(trace): add serializeTrace and SessionRecorder.fromTrace with Date revival"
```

---

## Task 2: Trace handoff module (`writeHandoff`/`readHandoff`/`downloadTrace`)

**Files:**
- Create: `ui/src/traces/trace-handoff.ts`
- Test: `tests/features/agents/trace-handoff.unit.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/features/agents/trace-handoff.unit.spec.ts`:

```ts
/**
 * Unit tests for the trace handoff bridge
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { writeHandoff, readHandoff } from '../../../ui/src/traces/trace-handoff.ts'
import type { SessionTrace } from '../../../ui/src/traces/session-recorder.ts'

const fakeStorage = (): Storage => {
  const map = new Map<string, string>()
  return {
    get length () { return map.size },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v) },
    removeItem: (k: string) => { map.delete(k) }
  } as Storage
}

const sampleTrace = (): SessionTrace => ({
  systemPrompt: 's',
  toolSnapshots: [],
  toolChanges: [],
  turns: [{ userMessage: 'hi', timestamp: new Date(), steps: [] }],
  physicalRequests: []
})

test.describe('trace handoff', () => {
  test('writeHandoff then readHandoff round-trips, revives dates, and clears the key', () => {
    const storage = fakeStorage()
    assert.equal(writeHandoff(sampleTrace(), storage), true)
    const read = readHandoff(storage)
    assert.ok(read)
    assert.equal(read!.turns[0].userMessage, 'hi')
    assert.ok(read!.turns[0].timestamp instanceof Date)
    // reading consumes the key
    assert.equal(readHandoff(storage), null)
  })

  test('readHandoff returns null when nothing was written', () => {
    assert.equal(readHandoff(fakeStorage()), null)
  })

  test('writeHandoff returns false when storage throws (quota)', () => {
    const storage = { setItem: () => { throw new Error('quota') } } as unknown as Storage
    assert.equal(writeHandoff(sampleTrace(), storage), false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test tests/features/agents/trace-handoff.unit.spec.ts`
Expected: FAIL — module `trace-handoff.ts` does not exist.

- [ ] **Step 3: Implement the handoff module**

Create `ui/src/traces/trace-handoff.ts`:

```ts
import type { SessionTrace } from './session-recorder.ts'
import { serializeTrace, reviveTraceDates } from './session-recorder.ts'

export const TRACE_HANDOFF_KEY = 'agent-chat-trace-handoff'

// Store the trace for a new-tab review page. Returns false if it didn't fit (quota).
export function writeHandoff (trace: SessionTrace, storage: Storage = localStorage): boolean {
  try {
    storage.setItem(TRACE_HANDOFF_KEY, serializeTrace(trace))
    return true
  } catch {
    return false
  }
}

// Read + remove the handed-off trace, reviving Date fields. Null if absent or malformed.
export function readHandoff (storage: Storage = localStorage): SessionTrace | null {
  const raw = storage.getItem(TRACE_HANDOFF_KEY)
  if (!raw) return null
  storage.removeItem(TRACE_HANDOFF_KEY)
  try {
    return reviveTraceDates(JSON.parse(raw))
  } catch {
    return null
  }
}

// Trigger a browser download of the trace as a JSON file.
export function downloadTrace (trace: SessionTrace, filename = `trace-${new Date().toISOString()}.json`): void {
  const blob = new Blob([serializeTrace(trace)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test tests/features/agents/trace-handoff.unit.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ui/src/traces/trace-handoff.ts tests/features/agents/trace-handoff.unit.spec.ts
git commit -m "feat(trace): add transient localStorage handoff + download helpers"
```

---

## Task 3: Extract shared `TraceView.vue`

Pull the trace panel out of the dialog into a standalone component used by both the dialog and the review page. No behavior change yet.

**Files:**
- Create: `ui/src/components/agent-chat/TraceView.vue`
- Modify: `ui/src/components/agent-chat/AgentChatDebugDialog.vue`

- [ ] **Step 1: Create `TraceView.vue`**

Create `ui/src/components/agent-chat/TraceView.vue` with the panel markup lifted from the dialog (lines ~164–256 of `AgentChatDebugDialog.vue`), the `noTrace` empty state, and the helper script. It owns its own lazy detail cache:

```vue
<template>
  <div
    v-if="!traceOverview.length"
    class="text-center text-medium-emphasis pa-4"
  >
    {{ t('noTrace') }}
  </div>
  <v-expansion-panels
    v-else
    variant="accordion"
    density="compact"
    class="mt-1 agent-chat__trace-panels"
    @update:model-value="onTraceExpand"
  >
    <v-expansion-panel
      v-for="entry in traceOverview"
      :key="entry.index"
      :value="entry.index"
      density="compact"
    >
      <v-expansion-panel-title class="text-caption py-0">
        <v-chip
          size="x-small"
          :color="traceEntryColor(entry.type)"
          variant="tonal"
          label
          class="mr-1"
          style="font-size: 0.65rem;"
        >
          {{ entry.type }}
        </v-chip>
        <span class="font-weight-medium text-truncate">{{ entry.label }}</span>
        <v-spacer />
        <span
          class="text-caption text-medium-emphasis ml-1"
          style="white-space: nowrap;"
        >
          {{ formatTraceTime(entry.timestamp) }}
        </span>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <div class="text-caption text-medium-emphasis mb-1">
          {{ entry.preview }}
        </div>
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
            <v-chip
              v-if="traceEntryDetails[entry.index].content.finishReason"
              size="x-small"
              variant="tonal"
              label
              class="my-2"
            >
              {{ traceEntryDetails[entry.index].content.finishReason }}
            </v-chip>
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
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<i18n lang="yaml">
fr:
  noTrace: Aucune trace enregistrée.
  task: Tâche
  tools: Outils
  request: Requête
  response: Réponse
en:
  noTrace: No trace recorded.
  task: Task
  tools: Tools
  request: Request
  response: Response
</i18n>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TraceOverviewEntry, TraceEntryDetail, SessionRecorder } from '~/traces/session-recorder'

const props = defineProps<{
  traceOverview: TraceOverviewEntry[]
  recorder: SessionRecorder
}>()

const { t } = useI18n()

const traceEntryDetails = ref<Record<number, TraceEntryDetail>>({})

const loadTraceEntry = (index: number) => {
  if (traceEntryDetails.value[index]) return
  const detail = props.recorder.getTraceEntry(index)
  if (detail) {
    traceEntryDetails.value = { ...traceEntryDetails.value, [index]: detail }
  }
}

const onTraceExpand = (value: unknown) => {
  if (typeof value === 'number') loadTraceEntry(value)
}

const traceEntryColor = (type: string) => {
  const colors: Record<string, string> = {
    'system-prompt': 'purple',
    'user-message': 'primary',
    'hidden-context': 'purple',
    'assistant-step': 'success',
    'tool-call': 'warning',
    'tool-result': 'info',
    'sub-agent-start': 'secondary',
    'sub-agent-system-prompt': 'purple',
    'sub-agent-step': 'secondary',
    'sub-agent-end': 'secondary',
    'physical-request': 'teal',
    'tools-changed': 'accent',
    compaction: 'orange'
  }
  return colors[type] || 'default'
}

const formatTraceTime = (date: Date) => date.toLocaleTimeString()
</script>

<style scoped>
.agent-chat__pre {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  border-radius: 4px;
  font-size: 0.75rem;
  overflow-x: auto;
  max-height: 300px;
  white-space: pre-wrap;
  word-break: break-word;
}

.agent-chat__trace-panels :deep(.v-expansion-panel-title) {
  min-height: 28px;
}

.agent-chat__trace-panels :deep(.v-expansion-panel-text__wrapper) {
  padding: 4px 12px 8px;
}
</style>
```

- [ ] **Step 2: Use `TraceView` inside the dialog's trace tab**

In `ui/src/components/agent-chat/AgentChatDebugDialog.vue`, replace the entire `<v-window-item value="trace"> … </v-window-item>` block (lines ~138–258) with:

```vue
          <v-window-item value="trace">
            <div class="d-flex justify-end ga-2 pa-2">
              <v-btn
                size="small"
                variant="tonal"
                :prepend-icon="mdiDownload"
                @click="onDownload"
              >
                {{ t('download') }}
              </v-btn>
              <v-btn
                v-if="isAdmin"
                size="small"
                color="primary"
                variant="tonal"
                :prepend-icon="mdiOpenInNew"
                @click="onOpenReview"
              >
                {{ t('openReview') }}
              </v-btn>
            </div>
            <trace-view
              v-if="recorder"
              :trace-overview="traceOverview"
              :recorder="recorder"
            />
          </v-window-item>
```

- [ ] **Step 3: Update the dialog script — new props, drop `tracingEnabled`, add download + open-review**

In the same file's `<script setup>`:

1. Update imports:

```ts
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { mdiClose, mdiChartBar, mdiDownload, mdiOpenInNew } from '@mdi/js'
import type { TraceOverviewEntry, SessionRecorder } from '~/traces/session-recorder'
import type { DebugToolsPartition } from '~/composables/use-agent-chat'
import { writeHandoff, downloadTrace } from '~/traces/trace-handoff'
import TraceView from './TraceView.vue'
```

2. Replace the `defineProps` block with (drop `tracingEnabled`, add `isAdmin`/`accountType`/`accountId`):

```ts
const props = defineProps<{
  modelValue: boolean
  systemPrompt: string
  debugToolsPartition: DebugToolsPartition
  traceOverview: TraceOverviewEntry[]
  recorder?: SessionRecorder
  sessionUsage?: { inputTokens: number; outputTokens: number; cacheReadTokens?: number; cacheWriteTokens?: number }
  isAdmin?: boolean
  accountType: string
  accountId: string
}>()
```

3. Delete `traceEntryDetails`, `loadTraceEntry`, `onTraceExpand`, `traceEntryColor`, `formatTraceTime`, `startTracing`, and `stopTracing` (now in `TraceView`). Keep `activeDebugTab` and `totalToolCount`. Add:

```ts
const router = useRouter()

const onDownload = () => {
  if (props.recorder) downloadTrace(props.recorder.getTrace())
}

const onOpenReview = () => {
  if (!props.recorder) return
  const trace = props.recorder.getTrace()
  if (!writeHandoff(trace)) downloadTrace(trace) // quota fallback: hand off via manual upload
  const href = router.resolve({ path: `/${props.accountType}/${props.accountId}/trace-review` }).href
  window.open(href, '_blank')
}
```

4. In the `<i18n>` block remove `noTrace`, `startTracing`, `stopTracing`, `tracingDisabled`, `task`, `request`, `response` (moved to `TraceView`) and add to both `fr` and `en`:

```yaml
# fr
  download: Télécharger
  openReview: Ouvrir l'analyse
# en
  download: Download
  openReview: Open review
```

- [ ] **Step 4: Type-check**

Run: `npm run check-types`
Expected: errors ONLY in `AgentChat.vue` (it still passes the removed `tracing-enabled` prop and reads removed pieces). Those are fixed in Task 4. If any error mentions `AgentChatDebugDialog.vue` or `TraceView.vue`, fix it before continuing.

- [ ] **Step 5: Commit**

```bash
git add ui/src/components/agent-chat/TraceView.vue ui/src/components/agent-chat/AgentChatDebugDialog.vue
git commit -m "refactor(trace): extract TraceView, add download + open-review to info dialog"
```

---

## Task 4: Always-on recorder, remove evaluator tab, rename `debug` → `isAdmin`

**Files:**
- Create: `ui/src/traces/evaluator-prompt.ts`
- Modify: `ui/src/components/AgentChat.vue`
- Modify: `ui/src/components/agent-chat/AgentChatHeader.vue`
- Modify: `ui/src/pages/[type]/[id]/chat.vue`

- [ ] **Step 1: Extract the evaluator prompt to a shared module**

Create `ui/src/traces/evaluator-prompt.ts` with the constant currently inlined in `AgentChat.vue:180-188`:

```ts
export const EVALUATOR_PROMPT = `You are an AI session evaluator. You analyze conversation traces between a user and an AI assistant to help improve the system.

The user will ask you about what happened during the session — what went well, what went wrong, and how to improve prompts, tools, or model configuration.

Use the provided tools to explore the session trace. Start with getTraceOverview to understand the session flow, then use getTraceEntry or getTraceEntries to examine specific parts in detail. Use getSessionConfig to review the system prompt and available tools.

For physical-request entries, prefer summarizePhysicalRequest over getTraceEntry when the payload is large — it returns a focused analysis instead of the raw context.

Be specific in your analysis. Reference concrete trace entries by index. When suggesting improvements, explain what you observed and what change would address it.`
```

- [ ] **Step 2: Rewrite the relevant parts of `AgentChat.vue`**

In `ui/src/components/AgentChat.vue`:

a. **Imports** — remove `buildEvaluatorTools` and `$apiPath` imports (lines 93–94). Keep `SessionRecorder` and `TraceOverviewEntry`.

b. **Props** — rename `debug?: boolean` to `isAdmin?: boolean` in `defineProps` (line 103).

c. **Recorder, always on** — replace lines 149–154 with:

```ts
const explorationEnabled = props.isAdmin && sessionStorage.getItem('agent-chat-explore') === '1'
const recorder = new SessionRecorder()
recorder.setSystemPrompt(finalSystemPrompt.value)
```

d. **`useAgentChat` options** — in the `useAgentChat({...})` call (lines 156–164) change `debug: props.debug` to `debug: props.isAdmin` and keep `recorder` / `toolExploration: explorationEnabled` (recorder is now always defined).

e. **Delete the evaluator + tab apparatus** — remove:
   - `EVALUATOR_PROMPT` constant (lines 180–188).
   - `activeChatTab` ref (line 190).
   - the `evaluatorChat` block (lines 192–200).
   - `activeMessages`, `activeStatus`, `activeError`, `activeSendMessage`, `activeAbort` computeds (lines 202–235).

f. **Re-point the active bindings to `chat`** — replace the deleted computeds' usages:

```ts
const messages = computed(() => chat.messages.value)
const isStreaming = computed(() => chat.status.value === 'streaming')
const chatError = computed(() => chat.error.value)
```

   And update `handleSend` / `handleAbort` (lines 408–415) to call `chat` directly:

```ts
const handleSend = (userMessage: string) => {
  if (isStreaming.value) return
  chat.sendMessage(userMessage)
}

const handleAbort = () => {
  chat.abort()
}
```

g. **`traceOverview`** — keep the computed (lines 418–427) but it can drop the `if (!recorder) return []` guard since `recorder` is always defined:

```ts
const traceOverview = computed<TraceOverviewEntry[]>(() => {
  // eslint-disable-next-line no-void
  void chat.messages.value.length
  // eslint-disable-next-line no-void
  void chat.status.value
  return recorder.getTraceOverview()
})
```

h. **Template — header** (lines 7–14): remove `:tracing-enabled` and `v-model:active-chat-tab`; rename `:debug` to `:is-admin`:

```vue
    <agent-chat-header
      :is-admin="isAdmin"
      :title="chatTitle"
      @show-debug="showDebugDialog = true"
      @reset="handleReset"
    />
```

i. **Template — messages welcome** (lines 22 and 44): replace `activeChatTab === 'evaluation' ? t('welcomeEvaluation') : t('welcome')` with just `t('welcome')` in both places.

j. **Template — root class** (line 5): rename `'agent-chat--debug': debug` to `'agent-chat--debug': isAdmin`.

k. **Template — dialog** (lines 54–62): drop `:tracing-enabled`, add admin/account props:

```vue
    <agent-chat-debug-dialog
      v-model="showDebugDialog"
      :system-prompt="finalSystemPrompt"
      :debug-tools-partition="debugToolsPartition"
      :trace-overview="traceOverview"
      :recorder="recorder"
      :session-usage="chat.sessionUsage.value"
      :is-admin="isAdmin"
      :account-type="accountType"
      :account-id="accountId"
    />
```

l. **i18n** — the `welcomeEvaluation` keys (lines 69 and 77) are now unused; remove them from both `fr` and `en`.

- [ ] **Step 3: Simplify `AgentChatHeader.vue`**

Replace the whole template's title region (the `<template v-if="tracingEnabled"> … </template>` tabs block plus the `<span v-else>`) with a single always-shown title, rename the Info button, and update props/emits:

Template — replace lines from `<template v-if="tracingEnabled">` through the `<span v-else>…</span>` with:

```vue
    <span class="text-title-medium text-truncate text-secondary">
      {{ title }}
    </span>
```

Change the debug button to an info button:

```vue
    <v-btn
      v-if="isAdmin"
      :icon="mdiInformationOutline"
      variant="flat"
      color="success"
      density="compact"
      :title="t('info')"
      class="ml-2"
      @click="$emit('showDebug')"
    />
```

Script — update imports/props/emits:

```ts
import { useI18n } from 'vue-i18n'
import { mdiInformationOutline, mdiRefresh } from '@mdi/js'

defineProps<{
  isAdmin?: boolean
  title?: string
}>()

defineEmits<{
  showDebug: []
  reset: []
}>()

const { t } = useI18n()
```

i18n — replace `debugInfo`/`sessionTab`/`evaluationTab` keys with an `info` key in both locales:

```yaml
fr:
  info: Informations
  reset: Réinitialiser la conversation
en:
  info: Info
  reset: Reset conversation
```

> Note: every user now sees the chat, but the Info button stays admin-gated via `isAdmin`. (Per spec the *content* is full for everyone; if later you want the button for all users, drop the `v-if`. Leave as admin-gated for now — non-admin exposure is out of scope for this plan.)

- [ ] **Step 4: Pass `isAdmin` from the chat page**

In `ui/src/pages/[type]/[id]/chat.vue`, rename the binding (template line 4) `:debug="debugEnabled"` to `:is-admin="debugEnabled"`. Leave the `debugEnabled` computed as-is.

- [ ] **Step 5: Type-check & lint**

Run: `npm run check-types`
Expected: no errors.
Run: `npm run lint-fix`
Expected: no errors (pre-existing `v-html` warnings in `AgentChatMessages.vue` are fine).

- [ ] **Step 6: Build the UI workspace packages and app to catch template errors**

Run: `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd ..`
Then: `docker build -t agents .` (or, faster, rely on `npm run check-types`; the docker build is the authoritative gate per AGENTS.md).
Expected: success.

- [ ] **Step 7: Commit**

```bash
git add ui/src/traces/evaluator-prompt.ts ui/src/components/AgentChat.vue ui/src/components/agent-chat/AgentChatHeader.vue "ui/src/pages/[type]/[id]/chat.vue"
git commit -m "feat(trace): always-on recorder, info dialog for admins, remove in-chat evaluator tab"
```

---

## Task 5: Admin trace-review page (`EvaluatorChat.vue` + `trace-review.vue`)

**Files:**
- Create: `ui/src/components/EvaluatorChat.vue`
- Create: `ui/src/pages/[type]/[id]/trace-review.vue`

- [ ] **Step 1: Create `EvaluatorChat.vue`**

A self-contained evaluator chat bound to one recorder. It mirrors how `AgentChat.vue` previously built the evaluator (`useAgentChat` with `localTools` + `modelName: 'evaluator'`) and renders with the existing message/input subcomponents.

Create `ui/src/components/EvaluatorChat.vue`:

```vue
<template>
  <div class="d-flex flex-column fill-height">
    <agent-chat-messages
      v-if="messages.length"
      :messages="messages"
      :is-streaming="isStreaming"
      :chat-error="chatError"
      :welcome-text="t('welcome')"
      :tool-title="toolTitle"
    />
    <div
      v-else
      class="flex-grow-1 d-flex flex-column align-center justify-center"
      style="min-height: 0"
    >
      <p class="text-body-medium text-medium-emphasis text-center mb-4">
        {{ t('welcome') }}
      </p>
    </div>
    <agent-chat-input
      :is-streaming="isStreaming"
      @send="handleSend"
      @abort="handleAbort"
    />
  </div>
</template>

<i18n lang="yaml">
fr:
  welcome: "Posez des questions sur la session tracée : ce qui s'est bien passé, ce qui a échoué, comment améliorer les prompts, outils ou modèles."
en:
  welcome: "Ask about the traced session: what went well, what failed, how to improve prompts, tools or models."
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentChat } from '~/composables/use-agent-chat'
import { buildEvaluatorTools } from '~/traces/evaluator-tools'
import { EVALUATOR_PROMPT } from '~/traces/evaluator-prompt'
import type { SessionRecorder } from '~/traces/session-recorder'
import { $apiPath } from '~/context'
import AgentChatMessages from './agent-chat/AgentChatMessages.vue'
import AgentChatInput from './agent-chat/AgentChatInput.vue'

const props = defineProps<{
  recorder: SessionRecorder
  accountType: string
  accountId: string
}>()

const { t } = useI18n()

const chatResult = useAgentChat({
  accountType: props.accountType,
  accountId: props.accountId,
  localTools: buildEvaluatorTools(props.recorder, { accountType: props.accountType, accountId: props.accountId, apiPath: $apiPath }),
  modelName: 'evaluator',
  systemPrompt: EVALUATOR_PROMPT
})
if (!chatResult) throw new Error('Chat not supported in SSR')
const chat = chatResult

const messages = computed(() => chat.messages.value)
const isStreaming = computed(() => chat.status.value === 'streaming')
const chatError = computed(() => chat.error.value)

const toolTitle = (toolName: string) => {
  const tool = chat.tools.value[toolName] as any
  return tool?.title || toolName
}

const handleSend = (userMessage: string) => {
  if (isStreaming.value) return
  chat.sendMessage(userMessage)
}

const handleAbort = () => {
  chat.abort()
}
</script>
```

> If `check-types` reports that `AgentChatMessages` requires `actionVisiblePrompt` or `@navigate`, pass `:action-visible-prompt="null"` and drop the `@navigate` (it is optional in the parent usage). Verify against `AgentChatMessages.vue`'s `defineProps` and add only the props it marks required.

- [ ] **Step 2: Create the review page**

Create `ui/src/pages/[type]/[id]/trace-review.vue`:

```vue
<template>
  <v-container
    fluid
    class="trace-review pa-0"
    data-iframe-height
  >
    <v-row
      no-gutters
      class="fill-height"
    >
      <v-col
        cols="12"
        md="6"
        class="trace-review__pane"
      >
        <div class="d-flex align-center ga-2 pa-2">
          <h3 class="text-title-medium">
            {{ t('trace') }}
          </h3>
          <v-spacer />
          <v-btn
            size="small"
            variant="tonal"
            :prepend-icon="mdiUpload"
            @click="fileInput?.click()"
          >
            {{ t('upload') }}
          </v-btn>
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            style="display: none"
            @change="onFile"
          >
        </div>
        <p
          v-if="loadError"
          class="text-error text-caption px-3"
        >
          {{ loadError }}
        </p>
        <div
          v-if="!recorder"
          class="text-center text-medium-emphasis pa-6"
        >
          {{ t('empty') }}
        </div>
        <trace-view
          v-else
          :key="loadCount"
          :trace-overview="traceOverview"
          :recorder="recorder"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
        class="trace-review__pane trace-review__chat"
      >
        <evaluator-chat
          v-if="recorder"
          :key="loadCount"
          :recorder="recorder"
          :account-type="accountType"
          :account-id="accountId"
        />
        <div
          v-else
          class="text-center text-medium-emphasis pa-6"
        >
          {{ t('loadFirst') }}
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  trace: Trace
  upload: Charger un fichier
  empty: Chargez une trace (via le bouton ou depuis une conversation) pour l'analyser.
  loadFirst: Chargez d'abord une trace pour discuter avec l'évaluateur.
  invalid: Fichier de trace invalide.
en:
  trace: Trace
  upload: Upload file
  empty: Load a trace (via the button or from a conversation) to analyze it.
  loadFirst: Load a trace first to chat with the evaluator.
  invalid: Invalid trace file.
</i18n>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { mdiUpload } from '@mdi/js'
import { getAccountRole, useSessionAuthenticated } from '@data-fair/lib-vue/session.js'
import { SessionRecorder, reviveTraceDates } from '~/traces/session-recorder'
import type { TraceOverviewEntry, SessionTrace } from '~/traces/session-recorder'
import { readHandoff } from '~/traces/trace-handoff'
import TraceView from '~/components/agent-chat/TraceView.vue'
import EvaluatorChat from '~/components/EvaluatorChat.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSessionAuthenticated()

const accountType = route.params.type as string
const accountId = route.params.id as string

const isAdmin = computed(() =>
  !!session.state.user?.isAdmin ||
  getAccountRole(session.state, { type: accountType as 'user' | 'organization', id: accountId }) === 'admin'
)

const recorder = ref<SessionRecorder | null>(null)
const loadCount = ref(0)
const loadError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const traceOverview = computed<TraceOverviewEntry[]>(() =>
  recorder.value ? recorder.value.getTraceOverview() : []
)

const isSessionTrace = (v: any): v is SessionTrace =>
  v && Array.isArray(v.turns) && Array.isArray(v.physicalRequests)

const loadTrace = (raw: SessionTrace) => {
  recorder.value = SessionRecorder.fromTrace(raw)
  loadCount.value++
  loadError.value = ''
}

onMounted(() => {
  if (!isAdmin.value) {
    router.replace(`/${accountType}/${accountId}/chat`)
    return
  }
  const handed = readHandoff()
  if (handed) loadTrace(handed)
})

const onFile = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const parsed = JSON.parse(await file.text())
    if (!isSessionTrace(parsed)) { loadError.value = t('invalid'); return }
    loadTrace(reviveTraceDates(parsed))
  } catch {
    loadError.value = t('invalid')
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<style scoped>
.trace-review {
  height: 100vh;
}
.trace-review__pane {
  height: 100vh;
  overflow-y: auto;
}
.trace-review__chat {
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
```

- [ ] **Step 3: Type-check & lint**

Run: `npm run check-types`
Expected: no errors. (If `useSessionAuthenticated()` typing differs, mirror exactly how `settings.vue`/`chat.vue` access `session.state`.)
Run: `npm run lint-fix`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add ui/src/components/EvaluatorChat.vue "ui/src/pages/[type]/[id]/trace-review.vue"
git commit -m "feat(trace): admin trace-review page with TraceView + evaluator chat"
```

---

## Task 6: End-to-end test (download + review upload + evaluator reply)

Validates the full user-facing flow with the `mock` provider as the `evaluator` model. Follow the e2e conventions in `tests/features/settings/settings.e2e.spec.ts` (or the nearest existing e2e spec) for fixtures, login helpers, and settings seeding.

**Files:**
- Create: `tests/features/trace/trace-review.e2e.spec.ts`

- [ ] **Step 1: Read an existing e2e spec for the exact harness**

Run: `ls tests/features/*/ | grep -i e2e` and open the closest one (e.g. settings e2e). Note how it: logs in as `albanm` (admin), seeds org settings with a `mock` provider + an `evaluator` model, and navigates to a `[type]/[id]/...` route. Reuse those helpers verbatim — do not invent new ones.

- [ ] **Step 2: Write the e2e test**

Create `tests/features/trace/trace-review.e2e.spec.ts` following that harness. The scenario:

```
1. Seed settings for the account with a `mock` provider and `evaluator` model = mock
   (reuse the settings-seeding helper from the reference spec).
2. Log in as an admin user, open `/{type}/{id}/chat`.
3. Send "hello" and wait for the mock reply ("world").
4. Open the Info dialog (info button), switch to the Trace tab.
5. Click Download; capture the download and assert the saved file parses as JSON
   with a non-empty `turns` array (use Playwright's `page.waitForEvent('download')`).
6. Navigate to `/{type}/{id}/trace-review`.
7. Upload the downloaded file via the hidden file input
   (`setInputFiles` on `input[type=file]`).
8. Assert the TraceView shows at least one entry (e.g. a `user-message` chip/label).
9. In the evaluator pane, send "call tool getTraceOverview" (the mock provider emits a
   tool call for "call tool ARG1 ARG2"), and assert the evaluator pane renders a tool
   invocation / a follow-up assistant message.
```

Use the same `data-testid`/role selectors the reference spec uses for chat input/messages. For the trace entry assertion, target the entry label text (e.g. `getByText('user message')`).

- [ ] **Step 3: Ensure workspace packages are built, then run the test**

Run: `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd ..`
Run: `npm run test tests/features/trace/trace-review.e2e.spec.ts`
Expected: PASS. If it fails with "element(s) not found", re-check the package builds and the selectors against a live page via Playwright MCP (`browser_open`/`browser_snapshot`) per AGENTS.md — do not write throwaway Playwright scripts.

- [ ] **Step 4: Commit**

```bash
git add tests/features/trace/trace-review.e2e.spec.ts
git commit -m "test(trace): e2e for trace download + admin review upload + evaluator"
```

---

## Task 7: Final verification

- [ ] **Step 1: Full lint + type-check + build**

Run: `npm run lint-fix`
Run: `npm run check-types`
Run: `docker build -t agents .`
Expected: all succeed (only the pre-existing `v-html` warnings).

- [ ] **Step 2: Full unit/api test pass**

Run: `npm run test`
Expected: green. Investigate any failure with `bash dev/status.sh` first (connection errors ≠ code errors), per AGENTS.md.

- [ ] **Step 3: Manual smoke (optional, via the run/verify skill)**

As a non-admin: open a chat → confirm the Info button is hidden but tracing still records (no reload). As an admin: open chat → Info → Trace → Download works; "Open review" opens a new tab pre-loaded with the trace; the evaluator answers a question about the session.

---

## Self-review notes (spec coverage)

- Always-on tracing → Task 4 (unconditional `recorder`, gate removed).
- Remove debug flag / rename → Task 4 (`debug`→`isAdmin` across `AgentChat`, header, `chat.vue`).
- Every user sees info dialog, full content → Task 3/4 (full `TraceView`, no role-trimming). Info *button* stays admin-gated (noted as deliberate; widening it is out of scope).
- Download trace as JSON → Task 2 (`downloadTrace`) + Task 3 (button).
- Admin trace-review page, split layout → Task 5.
- Evaluator = chat instance w/ local tools + evaluator model, only on review page → Task 5 (`EvaluatorChat.vue`); removed from main chat in Task 4.
- Upload button on review page → Task 5.
- Admin link from trace view (open in new tab, full page) → Task 3 (`onOpenReview`) + Task 2 (`writeHandoff`/quota fallback).
- No persistence change → handoff is write-then-delete localStorage; no server/Mongo.
```
