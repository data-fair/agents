# Compare Two Traces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin reviewing one stored conversation trace load a second trace beside it and compare the two — visually side by side and via one evaluator chat that can query either trace.

**Architecture:** The review page (`/traces/:id/review`) gains an optional `?compare=:idB` query param. A picker dialog lists the owner's other conversations (reusing the existing list route) and sets the param. When present, the page fetches and reconstructs a second `SessionRecorder` and renders a third pane. `buildEvaluatorTools` is generalized to accept an optional second recorder; in compare mode each trace-scoped tool gains a required `trace: 'A' | 'B'` selector and the evaluator system prompt gets a compare preamble. No new API endpoints, no built-in diff.

**Tech Stack:** Vue 3 (`<script setup>`), Vuetify, Vue Router, vue-i18n, Vercel AI SDK (`ai` package: `tool`, `jsonSchema`), Playwright test (unit + e2e projects).

## Global Constraints

- No new API endpoints — reuse `GET /traces/conversation/:id` (single trace) and `GET /traces/:type/:id?page&size` (paginated owner list).
- No built-in diff/highlighting/metric-delta between traces. Each trace keeps its own existing summary header. Comparison is raw side-by-side + the evaluator.
- No cross-owner comparison. Trace B must resolve to the same owner as trace A; otherwise treat as a load error and stay in single view.
- Exactly two traces (A and B). No 3+ comparison. State lives only in the URL (`?compare=`), no persistence.
- Single-trace behavior must stay byte-for-byte unchanged: existing `buildEvaluatorTools(recorder, opts)` 2-arg callers and tests keep working with no edits, and the single-trace evaluator prompt is untouched.
- All new user-facing text needs en + fr i18n entries (this repo's `<i18n lang="yaml">` block convention).
- The `ai` SDK exposes a tool's raw schema at `tool.inputSchema.jsonSchema` (verified) — unit tests assert against that path.

---

### Task 1: Generalize evaluator tools to an optional second recorder

**Files:**
- Modify: `ui/src/traces/evaluator-tools.ts`
- Test: `tests/features/agents/session-recorder.unit.spec.ts` (append a new describe block)

**Interfaces:**
- Consumes: `SessionRecorder` (existing), `SessionRecorder.fromTrace(trace)`, `SessionRecorder.getTraceOverview()/getTraceEntry(i)/getSessionConfig()` via existing tool bodies.
- Produces: `buildEvaluatorTools(recorder: SessionRecorder, opts, recorderB?: SessionRecorder): Record<string, Tool>`. When `recorderB` is passed, the trace-scoped tools (`getTraceOverview`, `getTraceEntry`, `getTraceEntries`, `getSessionConfig`, `summarizePhysicalRequest`) require a `trace: 'A' | 'B'` input and route to the matching recorder; `readArchitectureDoc` is unchanged.

- [ ] **Step 1: Write the failing tests**

Append this block to `tests/features/agents/session-recorder.unit.spec.ts` (after the existing `Evaluator tools` describe, before `SessionRecorder - serialization`):

```ts
test.describe('Evaluator tools - compare mode', () => {
  function buildRecorderWith (systemPrompt: string) {
    const trace: SessionTrace = {
      systemPrompt,
      toolSnapshots: [[{ name: 'search', description: 'Search', inputSchema: { type: 'object' } }]],
      toolChanges: [],
      turns: [{ userMessage: 'hi', timestamp: new Date(), steps: [{ timestamp: new Date(), messages: [{ role: 'assistant', content: [{ type: 'text', text: 'ok' }] }], finishReason: 'stop', toolCalls: [] }] }],
      physicalRequests: []
    }
    return SessionRecorder.fromTrace(trace)
  }
  const opts = { accountType: 'user', accountId: 'alice', apiPath: '/agents/api' }

  test('single mode: trace-scoped tools have no trace param', () => {
    const tools = buildEvaluatorTools(buildRecorderWith('PROMPT-A'), opts)
    const schema = (tools.getTraceEntry as any).inputSchema.jsonSchema
    assert.ok(!schema.properties.trace, 'single mode should not expose a trace param')
    assert.deepEqual(schema.required, ['index'])
  })

  test('compare mode: trace-scoped tools gain a required trace param', () => {
    const tools = buildEvaluatorTools(buildRecorderWith('PROMPT-A'), opts, buildRecorderWith('PROMPT-B'))
    const schema = (tools.getTraceEntry as any).inputSchema.jsonSchema
    assert.deepEqual(schema.properties.trace.enum, ['A', 'B'])
    assert.ok(schema.required.includes('trace'))
    // readArchitectureDoc stays un-scoped
    assert.ok(!(tools.readArchitectureDoc as any).inputSchema.jsonSchema.properties.trace)
  })

  test('compare mode: getSessionConfig routes to A or B by the trace param', async () => {
    const tools = buildEvaluatorTools(buildRecorderWith('PROMPT-A'), opts, buildRecorderWith('PROMPT-B'))
    const ra = await (tools.getSessionConfig as any).execute({ trace: 'A' })
    const rb = await (tools.getSessionConfig as any).execute({ trace: 'B' })
    assert.ok(ra.includes('PROMPT-A'))
    assert.ok(rb.includes('PROMPT-B'))
    assert.ok(!ra.includes('PROMPT-B'))
  })

  test('compare mode: getTraceOverview routes to B', async () => {
    const a = buildRecorderWith('PROMPT-A')
    const b = buildRecorderWith('PROMPT-B')
    const tools = buildEvaluatorTools(a, opts, b)
    const result = await (tools.getTraceOverview as any).execute({ trace: 'B' })
    assert.ok(typeof result === 'string')
    assert.ok(result.includes('user-message'))
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test tests/features/agents/session-recorder.unit.spec.ts`
Expected: FAIL — the new compare-mode tests error because `buildEvaluatorTools` ignores a third argument, so `schema.properties.trace` is `undefined` and `execute({ trace: 'B' })` reads recorder A.

- [ ] **Step 3: Rewrite `buildEvaluatorTools` to support the optional second recorder**

Replace the body of `ui/src/traces/evaluator-tools.ts` from the `export function buildEvaluatorTools` line to the end of the function with this. The `PHYSICAL_REQUEST_SUMMARY_PROMPT` const and imports above it are unchanged.

```ts
export function buildEvaluatorTools (
  recorder: SessionRecorder,
  opts: { accountType: string; accountId: string; apiPath: string; architectureDocs?: Record<string, string>; architectureTopics?: string[] },
  recorderB?: SessionRecorder
): Record<string, Tool> {
  // Docs are injected (not imported) so this module — which is exercised by
  // the non-Vite unit test runner — never pulls in the Vite-only
  // architecture-docs.ts (import.meta.glob). EvaluatorChat.vue passes the
  // bundled docs; tests omit them and get an empty set.
  const architectureDocs = opts.architectureDocs ?? {}
  const architectureTopics = opts.architectureTopics ?? Object.keys(architectureDocs).sort()

  // Compare mode: a second trace is loaded. Each trace-scoped tool gains a
  // required `trace` selector and routes to the matching recorder. Single-trace
  // mode keeps the exact pre-existing shape (no selector).
  const compare = !!recorderB
  const traceProps: Record<string, unknown> = compare
    ? { trace: { type: 'string', enum: ['A', 'B'], description: 'Which trace to inspect: A (the trace under review) or B (the comparison trace).' } }
    : {}
  const traceRequired: string[] = compare ? ['trace'] : []
  const pickRecorder = (args: { trace?: 'A' | 'B' }): SessionRecorder =>
    (compare && args.trace === 'B' && recorderB) ? recorderB : recorder
  const note = compare ? ' Two traces are loaded (A and B); pass the `trace` parameter to choose which one.' : ''

  return {
    getTraceOverview: tool({
      description: 'List all trace entries in chronological order. Returns index, type, timestamp, label, and preview for each entry.' + note,
      inputSchema: jsonSchema({
        type: 'object',
        properties: { ...traceProps },
        required: [...traceRequired]
      }),
      execute: async (args: { trace?: 'A' | 'B' }) => {
        const overview = pickRecorder(args).getTraceOverview()
        return overview.map((e: TraceOverviewEntry) =>
          `[${e.index}] ${e.type} | ${e.timestamp.toISOString()} | ${e.label} | ${e.preview}`
        ).join('\n')
      }
    }),

    getTraceEntry: tool({
      description: 'Get full detail for one trace entry by its index.' + note,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          index: { type: 'number', description: 'The index of the trace entry to retrieve' },
          ...traceProps
        },
        required: ['index', ...traceRequired]
      }),
      execute: async (args: { index: number; trace?: 'A' | 'B' }) => {
        const entry = pickRecorder(args).getTraceEntry(args.index)
        if (!entry) return 'Entry not found'
        return JSON.stringify(entry, null, 2)
      }
    }),

    getTraceEntries: tool({
      description: 'Get a range of trace entries in full detail.' + note,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          fromIndex: { type: 'number', description: 'Start index (inclusive)' },
          toIndex: { type: 'number', description: 'End index (inclusive)' },
          ...traceProps
        },
        required: ['fromIndex', 'toIndex', ...traceRequired]
      }),
      execute: async (args: { fromIndex: number; toIndex: number; trace?: 'A' | 'B' }) => {
        const entries = pickRecorder(args).getTraceEntries(args.fromIndex, args.toIndex)
        return JSON.stringify(entries, null, 2)
      }
    }),

    getSessionConfig: tool({
      description: 'Get the system prompt and tools definitions for the session.' + note,
      inputSchema: jsonSchema({
        type: 'object',
        properties: { ...traceProps },
        required: [...traceRequired]
      }),
      execute: async (args: { trace?: 'A' | 'B' }) => {
        const trace = pickRecorder(args).getTrace()
        const latestTools = trace.toolSnapshots.length > 0
          ? trace.toolSnapshots[trace.toolSnapshots.length - 1]
          : []
        return JSON.stringify({
          systemPrompt: trace.systemPrompt,
          tools: latestTools
        }, null, 2)
      }
    }),

    readArchitectureDoc: tool({
      description: 'Read one of this platform\'s architecture docs to understand how a feature actually behaves (compaction, moderation, sub-agents, quotas, gateway, tracing, integration-context, etc.) before judging it. Pass an unknown topic to get the list of available topics.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: architectureTopics,
            description: 'The architecture doc to read (filename without extension)'
          }
        },
        required: ['topic']
      }),
      execute: async (args: { topic: string }) => lookupArchitectureDoc(architectureDocs, args.topic)
    }),

    summarizePhysicalRequest: tool({
      description: 'Summarize a large physical-request entry (its full cumulative context) via a one-shot summarizer call. Use this instead of getTraceEntry when a physical-request payload is too large to read directly. Returns context composition, waste/optimization signals, and a faithful content digest.' + note,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          index: { type: 'number', description: 'The index of the physical-request trace entry to summarize' },
          ...traceProps
        },
        required: ['index', ...traceRequired]
      }),
      execute: async (args: { index: number; trace?: 'A' | 'B' }) => {
        const entry = pickRecorder(args).getTraceEntry(args.index)
        if (!entry) return 'Entry not found'
        if (entry.type !== 'physical-request') {
          return `Entry ${args.index} is not a physical-request entry (it is ${entry.type}). Use getTraceEntry instead.`
        }
        // The summary endpoint pins its own system prompt, so we frame the
        // analysis instructions into the content itself.
        const content = `${PHYSICAL_REQUEST_SUMMARY_PROMPT}\n\nPayload to analyze:\n${JSON.stringify(entry.content.requestBody)}`
        const res = await fetch(
          `${window.location.origin}${opts.apiPath}/summary/${opts.accountType}/${opts.accountId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content })
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

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test tests/features/agents/session-recorder.unit.spec.ts`
Expected: PASS — all existing `Evaluator tools` tests plus the four new `Evaluator tools - compare mode` tests pass.

- [ ] **Step 5: Type-check and lint**

Run: `npm run check-types && npm run lint-fix`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add ui/src/traces/evaluator-tools.ts tests/features/agents/session-recorder.unit.spec.ts
git commit -m "feat(traces): evaluator tools accept an optional second trace"
```

---

### Task 2: Compare-mode evaluator prompt preamble + EvaluatorChat second recorder

**Files:**
- Modify: `ui/src/traces/evaluator-prompt.ts`
- Modify: `ui/src/components/EvaluatorChat.vue`

**Interfaces:**
- Consumes: `buildEvaluatorTools(recorder, opts, recorderB?)` from Task 1; `EVALUATOR_PROMPT` (existing).
- Produces: `EVALUATOR_COMPARE_PREAMBLE: string` export; `EvaluatorChat` now accepts an optional `recorderB?: SessionRecorder` prop. When set, it builds tools with the second recorder and prepends the compare preamble to the system prompt.

- [ ] **Step 1: Add the compare preamble export**

Append to `ui/src/traces/evaluator-prompt.ts` (after the existing `EVALUATOR_PROMPT` export):

```ts
export const EVALUATOR_COMPARE_PREAMBLE = `Two traces are loaded for comparison: trace A (the trace under review) and trace B (the comparison trace). Every trace tool (getTraceOverview, getTraceEntry, getTraceEntries, getSessionConfig, summarizePhysicalRequest) takes a required \`trace\` parameter — pass 'A' or 'B' to choose which one to inspect. When the user asks you to compare, inspect both traces and report concrete differences (config, flow, cost, tokens, behaviour) by trace.

`
```

- [ ] **Step 2: Wire the optional second recorder into EvaluatorChat.vue**

In `ui/src/components/EvaluatorChat.vue`:

Update the import of the prompt (line 44):

```ts
import { EVALUATOR_PROMPT, EVALUATOR_COMPARE_PREAMBLE } from '~/traces/evaluator-prompt'
```

Update the props block (lines 50-54) to add the optional second recorder:

```ts
const props = defineProps<{
  recorder: SessionRecorder
  recorderB?: SessionRecorder
  accountType: string
  accountId: string
}>()
```

Replace the `useAgentChat({...})` call (lines 58-64) with:

```ts
const chatResult = useAgentChat({
  accountType: props.accountType,
  accountId: props.accountId,
  localTools: buildEvaluatorTools(
    props.recorder,
    { accountType: props.accountType, accountId: props.accountId, apiPath: $apiPath, architectureDocs, architectureTopics },
    props.recorderB
  ),
  modelName: 'evaluator',
  systemPrompt: props.recorderB ? EVALUATOR_COMPARE_PREAMBLE + EVALUATOR_PROMPT : EVALUATOR_PROMPT
})
```

(`recorderB` is read once at setup; the page re-keys the component when B changes — see Task 4 Step 4 — so the tools/prompt rebuild on a fresh instance.)

- [ ] **Step 3: Type-check and lint**

Run: `npm run check-types && npm run lint-fix`
Expected: no errors. (`EVALUATOR_COMPARE_PREAMBLE` is now imported and used; `recorderB` is an optional prop.)

- [ ] **Step 4: Commit**

```bash
git add ui/src/traces/evaluator-prompt.ts ui/src/components/EvaluatorChat.vue
git commit -m "feat(traces): EvaluatorChat can load a second trace in compare mode"
```

---

### Task 3: Trace comparison picker dialog

**Files:**
- Create: `ui/src/components/TraceComparePicker.vue`
- Test: covered by the e2e flow in Task 5 (no unit test — this repo tests Vue components via Playwright e2e).

**Interfaces:**
- Consumes: `$apiPath` from `~/context`; existing `GET /traces/:type/:id?page&size` route returning `{ count, results: Array<{ conversationId, startedAt, userName, userId, requestCount, preview }> }`.
- Produces: a dialog component with props `{ modelValue: boolean, accountType: string, accountId: string, excludeId: string }` and events `update:modelValue` (boolean) + `select` (conversationId: string). Selecting a row emits `select` with that conversationId and closes the dialog.

- [ ] **Step 1: Create the picker component**

Create `ui/src/components/TraceComparePicker.vue` (modeled on `TracesSection.vue`'s fetch + list, adapted to a dialog that emits a selection instead of navigating):

```vue
<template>
  <v-dialog
    :model-value="modelValue"
    max-width="640"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ t('title') }}</v-card-title>
      <v-card-text>
        <p
          v-if="loadError"
          class="text-error text-caption"
        >
          {{ loadError }}
        </p>
        <p
          v-else-if="!rows.length"
          class="text-caption text-medium-emphasis"
        >
          {{ t('noOther') }}
        </p>
        <v-list density="compact">
          <v-list-item
            v-for="row in rows"
            :key="row.conversationId"
            @click="choose(row.conversationId)"
          >
            <v-list-item-title class="text-body-2">
              {{ row.preview || row.conversationId }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              {{ row.userName || row.userId || '—' }} · {{ formatDate(row.startedAt) }} · {{ t('requests', row.requestCount) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <v-pagination
          v-if="pageCount > 1"
          v-model="page"
          :length="pageCount"
          density="compact"
          @update:model-value="fetchTraces"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="$emit('update:modelValue', false)">
          {{ t('cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<i18n lang="yaml">
fr:
  title: Comparer avec une autre conversation
  noOther: Aucune autre conversation enregistrée.
  cancel: Annuler
  requests: "{n} requête | {n} requêtes"
  loadError: Erreur de chargement des traces.
en:
  title: Compare with another conversation
  noOther: No other stored conversation.
  cancel: Cancel
  requests: "{n} request | {n} requests"
  loadError: Failed to load traces.
</i18n>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { $apiPath } from '~/context'

const props = defineProps<{ modelValue: boolean, accountType: string, accountId: string, excludeId: string }>()
const emit = defineEmits<{ 'update:modelValue': [boolean], select: [string] }>()
const { t } = useI18n()
const SIZE = 20

const rows = ref<any[]>([])
const page = ref(1)
const pageCount = ref(1)
const loadError = ref('')

const formatDate = (iso: string) => new Date(iso).toLocaleString()
const base = computed(() => `${$apiPath}/traces/${props.accountType}/${props.accountId}`)

const fetchTraces = async () => {
  try {
    const res = await fetch(`${base.value}?page=${page.value}&size=${SIZE}`, { credentials: 'include' })
    if (!res.ok) { loadError.value = t('loadError'); return }
    const body = await res.json()
    rows.value = (body.results ?? []).filter((r: any) => r.conversationId !== props.excludeId)
    pageCount.value = Math.max(1, Math.ceil((body.count ?? 0) / SIZE))
  } catch { loadError.value = t('loadError') }
}

const choose = (conversationId: string) => {
  emit('select', conversationId)
  emit('update:modelValue', false)
}

// Fetch when the dialog opens (and refetch if it reopens later).
watch(() => props.modelValue, (open) => { if (open) { page.value = 1; fetchTraces() } }, { immediate: true })
</script>
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run check-types && npm run lint-fix`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add ui/src/components/TraceComparePicker.vue
git commit -m "feat(traces): add a picker dialog to choose a comparison trace"
```

---

### Task 4: Wire compare mode into the review page

**Files:**
- Modify: `ui/src/pages/traces/[id]/review.vue`
- Test: covered by the e2e flow in Task 5.

**Interfaces:**
- Consumes: `TraceComparePicker.vue` (Task 3); `EvaluatorChat` with `recorderB` prop (Task 2); `SessionRecorder.fromTrace`, `reconstructTrace`, `$apiPath` (existing).
- Produces: the full compare UI — `?compare=:idB` load/unload, three-pane layout with a collapsible evaluator, picker integration, B-load + cross-owner error handling.

- [ ] **Step 1: Replace the template**

Replace the `<template>` block of `ui/src/pages/traces/[id]/review.vue` (lines 1-40) with:

```vue
<template>
  <v-container
    fluid
    class="trace-review pa-0"
  >
    <p
      v-if="loadError"
      class="text-error pa-3"
    >
      {{ loadError }}
    </p>
    <template v-else-if="recorder && owner">
      <div class="trace-review__bar d-flex align-center ga-2 px-3 py-1">
        <v-btn
          v-if="!recorderB"
          size="small"
          variant="tonal"
          :prepend-icon="mdiCompareHorizontal"
          @click="pickerOpen = true"
        >
          {{ t('compareWith') }}
        </v-btn>
        <template v-else>
          <span class="text-caption">{{ t('comparing') }}</span>
          <v-btn
            size="small"
            variant="text"
            :prepend-icon="mdiClose"
            @click="clearCompare"
          >
            {{ t('clearCompare') }}
          </v-btn>
          <v-spacer />
          <v-btn
            size="small"
            variant="text"
            :prepend-icon="evaluatorCollapsed ? mdiChevronLeft : mdiChevronRight"
            @click="evaluatorCollapsed = !evaluatorCollapsed"
          >
            {{ evaluatorCollapsed ? t('showEvaluator') : t('hideEvaluator') }}
          </v-btn>
        </template>
      </div>
      <p
        v-if="compareError"
        class="text-error text-caption px-3"
      >
        {{ compareError }}
      </p>
      <v-row
        no-gutters
        class="trace-review__panes"
      >
        <v-col
          cols="12"
          :md="traceCols"
          class="trace-review__pane"
        >
          <trace-view
            :trace-overview="traceOverview"
            :recorder="recorder"
          />
        </v-col>
        <v-col
          v-if="recorderB"
          cols="12"
          :md="traceCols"
          class="trace-review__pane"
        >
          <trace-view
            :trace-overview="traceOverviewB"
            :recorder="recorderB"
          />
        </v-col>
        <v-col
          v-if="!evaluatorCollapsed"
          cols="12"
          :md="evaluatorCols"
          class="trace-review__pane trace-review__chat"
        >
          <evaluator-chat
            :key="recorderB ? 'compare' : 'single'"
            :recorder="recorder"
            :recorder-b="recorderB ?? undefined"
            :account-type="owner.type"
            :account-id="owner.id"
          />
        </v-col>
      </v-row>
      <trace-compare-picker
        v-model="pickerOpen"
        :account-type="owner.type"
        :account-id="owner.id"
        :exclude-id="conversationId"
        @select="onSelectCompare"
      />
    </template>
  </v-container>
</template>
```

- [ ] **Step 2: Replace the i18n block**

Replace the `<i18n lang="yaml">` block (lines 42-51) with:

```vue
<i18n lang="yaml">
fr:
  loadError: Trace introuvable ou accès refusé.
  storedConversations: Conversations enregistrées
  review: Relecture
  compareWith: Comparer avec…
  comparing: Comparaison de deux traces (A / B)
  clearCompare: Fermer la comparaison
  hideEvaluator: Masquer l'évaluateur
  showEvaluator: Afficher l'évaluateur
  compareError: Trace de comparaison introuvable ou propriétaire différent.
en:
  loadError: Trace not found or access denied.
  storedConversations: Stored conversations
  review: Review
  compareWith: Compare with…
  comparing: Comparing two traces (A / B)
  clearCompare: Close comparison
  hideEvaluator: Hide evaluator
  showEvaluator: Show evaluator
  compareError: Comparison trace not found or has a different owner.
</i18n>
```

- [ ] **Step 3: Replace the script setup**

Replace the `<script lang="ts" setup>` block (lines 53-95) with:

```vue
<script lang="ts" setup>
import { ref, shallowRef, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { mdiCompareHorizontal, mdiClose, mdiChevronLeft, mdiChevronRight } from '@mdi/js'
import { SessionRecorder } from '~/traces/session-recorder'
import type { TraceOverviewEntry } from '~/traces/session-recorder'
import { reconstructTrace } from '~/traces/reconstruct-trace'
import { $apiPath } from '~/context'
import TraceView from '~/components/agent-chat/TraceView.vue'
import EvaluatorChat from '~/components/EvaluatorChat.vue'
import TraceComparePicker from '~/components/TraceComparePicker.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const conversationId = route.params.id as string

const recorder = shallowRef<SessionRecorder | null>(null)
const recorderB = shallowRef<SessionRecorder | null>(null)
const owner = ref<{ type: string, id: string } | null>(null)
const loadError = ref('')
const compareError = ref('')
const pickerOpen = ref(false)
const evaluatorCollapsed = ref(false)

const traceOverview = computed<TraceOverviewEntry[]>(() =>
  recorder.value ? recorder.value.getTraceOverview() : []
)
const traceOverviewB = computed<TraceOverviewEntry[]>(() =>
  recorderB.value ? recorderB.value.getTraceOverview() : []
)

// Layout: single = trace 6 / evaluator 6. Compare with evaluator shown = 4/4/4.
// Compare with evaluator collapsed = 6/6 traces, evaluator hidden.
const traceCols = computed(() => {
  if (!recorderB.value) return 6
  return evaluatorCollapsed.value ? 6 : 4
})
const evaluatorCols = computed(() => (recorderB.value ? 4 : 6))

async function fetchTrace (id: string): Promise<{ owner: { type: string, id: string }, recorder: SessionRecorder } | null> {
  const res = await fetch(`${$apiPath}/traces/conversation/${id}`, { credentials: 'include' })
  if (!res.ok) return null
  const body = await res.json()
  return {
    owner: body.owner as { type: string, id: string },
    recorder: SessionRecorder.fromTrace(reconstructTrace(body.results))
  }
}

async function loadCompare (id: string) {
  compareError.value = ''
  const loaded = await fetchTrace(id).catch(() => null)
  // cross-owner comparison is not allowed (evaluator is owner-scoped)
  if (!loaded || !owner.value || loaded.owner.type !== owner.value.type || loaded.owner.id !== owner.value.id) {
    compareError.value = t('compareError')
    recorderB.value = null
    return
  }
  recorderB.value = loaded.recorder
}

function onSelectCompare (id: string) {
  router.replace({ query: { ...route.query, compare: id } })
}

function clearCompare () {
  const { compare, ...rest } = route.query
  router.replace({ query: rest })
}

// React to the ?compare= param (set by the picker or present on initial load).
watch(() => route.query.compare, async (compareId) => {
  if (typeof compareId === 'string' && compareId && compareId !== conversationId) {
    await loadCompare(compareId)
  } else {
    recorderB.value = null
    compareError.value = ''
  }
})

onMounted(async () => {
  try {
    const loaded = await fetchTrace(conversationId)
    if (!loaded) { loadError.value = t('loadError'); return }
    owner.value = loaded.owner
    recorder.value = loaded.recorder
    const firstMessage = recorder.value.getTrace().turns[0]?.userMessage?.trim()
    const label = firstMessage ? firstMessage.slice(0, 60) : t('review')
    setBreadcrumbs([
      { text: t('storedConversations'), to: `/${loaded.owner.type}/${loaded.owner.id}/activity` },
      { text: label }
    ])
    // Honor a ?compare= param present on first load (deep link / refresh).
    const compareId = route.query.compare
    if (typeof compareId === 'string' && compareId && compareId !== conversationId) {
      await loadCompare(compareId)
    }
  } catch {
    loadError.value = t('loadError')
  }
})
</script>
```

- [ ] **Step 4: Update the style block for three panes**

Replace the `<style scoped>` block (lines 97-103) with:

```vue
<style scoped>
/* Fixed viewport height (no data-iframe-height) so each pane scrolls on its own:
   scrolling one trace stack no longer drives the others. The thin bar at the top
   holds the compare / collapse controls; the panes fill the rest. */
.trace-review { height: 100vh; display: flex; flex-direction: column; }
.trace-review__bar { flex: 0 0 auto; border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.trace-review__panes { flex: 1 1 auto; min-height: 0; }
.trace-review__pane { height: 100%; overflow-y: auto; border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.trace-review__chat { border-right: none; }
</style>
```

- [ ] **Step 5: Type-check and lint**

Run: `npm run check-types && npm run lint-fix`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add ui/src/pages/traces/[id]/review.vue
git commit -m "feat(traces): compare two traces side by side in trace review"
```

---

### Task 5: E2E test for the compare flow

**Files:**
- Create: `tests/features/traces/trace-compare.e2e.spec.ts`

**Interfaces:**
- Consumes: the full feature (Tasks 1-4); the `login.ts` fixture (`goToWithAuth`) and `superAdmin` axios client used by `trace-review-page.e2e.spec.ts`.
- Produces: an e2e spec that drives two stored conversations and exercises pick → both render → `?compare=` set → collapse → clear. (The evaluator cross-trace tool routing is covered by the Task 1 unit tests, not e2e, because driving the evaluator model to emit a `trace: 'B'` tool call deterministically is out of scope for the mock provider.)

- [ ] **Step 1: Write the e2e spec**

Create `tests/features/traces/trace-compare.e2e.spec.ts`:

```ts
/**
 * E2E test: compare two stored traces side by side from the review page.
 *
 * Scenario:
 *   1. PUT settings with storeTraces + a mock provider/assistant model.
 *   2. Drive two gateway requests (two conversation ids) so two traces get stored.
 *   3. Navigate to /agents/traces/:idA/review as superadmin.
 *   4. Click "Compare with…", pick the second conversation.
 *   5. Assert ?compare= is set and two TraceViews render.
 *   6. Collapse the evaluator, then clear the comparison.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'

const admin = await superAdmin

const CONV_A = 'conv-compare-a'
const CONV_B = 'conv-compare-b'

const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: {
    assistant: {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    }
  },
  quotas: {
    global: { unlimited: true, monthlyLimit: 0 },
    admin: { unlimited: true, monthlyLimit: 0 },
    contrib: { unlimited: false, monthlyLimit: 0 },
    user: { unlimited: false, monthlyLimit: 0 },
    external: { unlimited: true, monthlyLimit: 0 },
    anonymous: { unlimited: false, monthlyLimit: 0 }
  },
  storeTraces: true
}

async function driveConversation (convId: string, message: string) {
  await admin.post('/api/gateway/organization/test1/v1/chat/completions', {
    model: 'assistant',
    messages: [{ role: 'user', content: message }]
  }, {
    headers: {
      'x-trace-consent': 'yes',
      'x-trace-conversation': convId,
      'x-trace-ctx': `turn:${convId}`
    }
  })
}

async function waitForConversation (conversationId: string) {
  for (let i = 0; i < 60; i++) {
    const res = await admin.get(`/api/traces/conversation/${conversationId}`).catch(() => null)
    if (res && res.data.results.length > 0) return
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for conversation ${conversationId}`)
}

test.describe('Trace comparison (/traces/:id/review?compare=)', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/organization/test1', settingsData)
    await driveConversation(CONV_A, 'hello trace A')
    await driveConversation(CONV_B, 'hello trace B')
    await waitForConversation(CONV_A)
    await waitForConversation(CONV_B)
  })

  test('picks a second trace and renders both side by side', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/traces/${CONV_A}/review`, 'superadmin', { adminMode: true })

    // single view first: one TraceView (one user-message chip)
    await expect(page.getByText('user-message').first()).toBeVisible({ timeout: 15000 })

    // open the picker and choose the other conversation
    await page.getByRole('button', { name: 'Compare with…' }).click()
    await page.getByText('hello trace B').click()

    // ?compare= now points at CONV_B
    await expect(page).toHaveURL(new RegExp(`compare=${CONV_B}`))

    // both traces render: two user-message chips across the two panes
    await expect(page.getByText('user-message')).toHaveCount(2, { timeout: 15000 })

    // collapse the evaluator, then clear the comparison
    await page.getByRole('button', { name: 'Hide evaluator' }).click()
    await page.getByRole('button', { name: 'Close comparison' }).click()

    // back to single view: ?compare= gone, one user-message chip
    await expect(page).not.toHaveURL(/compare=/)
    await expect(page.getByText('user-message')).toHaveCount(1, { timeout: 15000 })
  })
})
```

- [ ] **Step 2: Ensure workspace packages are built (required for e2e)**

Run: `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd ..`
Expected: both build successfully (compiled `.js` files present). Skip if already built this session.

- [ ] **Step 3: Run the e2e test**

Run: `npm run test tests/features/traces/trace-compare.e2e.spec.ts`
Expected: PASS. If it fails with "element(s) not found", confirm the `lib-vuetify`/`lib-vue` builds from Step 2, then check `bash dev/status.sh`.

- [ ] **Step 4: Commit**

```bash
git add tests/features/traces/trace-compare.e2e.spec.ts
git commit -m "test(traces): e2e for comparing two traces side by side"
```

---

### Task 6: Documentation

**Files:**
- Modify: `docs/architecture/tracing.md`

**Interfaces:**
- Consumes: nothing. Documents the shipped feature.

- [ ] **Step 1: Document the compare capability**

In `docs/architecture/tracing.md`, find the section describing the trace review page (two-pane TraceView + EvaluatorChat) and add a short paragraph after it:

```markdown
### Comparing two traces

The review page accepts an optional `?compare=<conversationId>` query param. A
"Compare with…" picker lists the account's other stored conversations (reusing the
paginated `GET /traces/:type/:id` list) and sets the param. When present, the page
fetches and reconstructs a second `SessionRecorder` and renders it beside the first
(two `TraceView`s + a collapsible `EvaluatorChat`). There is no built-in diff — the
two traces are shown raw, side by side. The single evaluator chat can query either
trace: in compare mode each trace-scoped evaluator tool takes a required `trace: 'A' | 'B'`
parameter and the evaluator system prompt gains a compare preamble. Comparison is
restricted to traces of the same owner (the evaluator is owner-scoped); no new API
endpoints are introduced.
```

- [ ] **Step 2: Commit**

```bash
git add docs/architecture/tracing.md
git commit -m "docs(traces): document side-by-side trace comparison"
```

---

## Self-Review

**Spec coverage:**
- Entry point `?compare=:idB` + "Compare with…" picker reusing the list route → Tasks 3, 4. ✓
- Fetch/reconstruct second `SessionRecorder` the same way as the first → Task 4 (`fetchTrace` helper). ✓
- Clear control returns to single view → Task 4 (`clearCompare`). ✓
- B-load error + cross-owner guard stay in single view → Task 4 (`loadCompare`). ✓
- Layout: single 6/6; compare three panes ~thirds; collapsible evaluator yielding width → Task 4 (`traceCols`/`evaluatorCols`, style). ✓
- Each pane keeps its own summary header, independent scroll, no cross-trace highlight → Task 4 (reuses `TraceView` unchanged, per-pane `overflow-y`). ✓
- Evaluator queries both: `buildEvaluatorTools` labeled set, required `trace` param on trace-scoped tools only, `readArchitectureDoc` unchanged → Task 1. ✓
- Single-trace shape unchanged, existing tests green unmodified → Task 1 (optional 3rd arg; `compare` false path) + Step 4 runs existing tests. ✓
- Compare-mode prompt preamble injected only with two traces → Task 2. ✓
- Tests: unit on tool shapes (one vs two recorders) → Task 1; e2e pick→compare→clear → Task 5. ✓ (Evaluator cross-trace routing is unit-tested, not e2e — stated explicitly in Task 5, no silent cap.)
- i18n en/fr for all new text → Tasks 3, 4. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full content. ✓

**Type consistency:** `buildEvaluatorTools(recorder, opts, recorderB?)` signature matches across Task 1 (def), Task 2 (call). `recorderB` prop name consistent across Task 2 (EvaluatorChat) and Task 4 (`:recorder-b`). `select`/`update:modelValue` events match between Task 3 (picker) and Task 4 (`@select`, `v-model`). `fetchTrace`/`loadCompare`/`clearCompare`/`onSelectCompare` referenced only where defined (Task 4). Tool schema access path `inputSchema.jsonSchema` verified against the `ai` SDK. ✓
