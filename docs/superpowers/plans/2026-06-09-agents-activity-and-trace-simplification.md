# Agents activity monitoring & trace-review simplification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the server-stored trace the single source of truth: remove the in-browser recorder/upload/handoff, add an account-admin read-only activity page (config + limits + paginated traces) surfaced in data-fair's "Suivi" nav, and turn trace review into a per-trace page `/traces/:id/review`.

**Architecture:** The agents chat runs in an iframe `data-fair` embeds. Trace data is already persisted by the gateway (`mongo.traceRequests`) for consenting users; we drop the duplicate client recorder and feed the existing `TraceView` + `EvaluatorChat` from stored data via `reconstructTrace` + `SessionRecorder.fromTrace`. A new read-only `/:type/:id/activity` page lists traces; `data-fair` embeds it via `<d-frame>` (mirroring `admin/agents.vue`).

**Tech Stack:** Node/Express + MongoDB (api), Vue 3 + Vuetify + file-based `vue-router/vite` (ui), Playwright (tests), `@data-fair/frame` `<d-frame>` (data-fair embedding).

**Spec:** `docs/superpowers/specs/2026-06-09-agents-activity-and-trace-simplification-design.md`

---

## File structure

**agents `api/`**
- Modify `api/src/traces/router.ts` — paginate list; add `GET /conversation/:conversationId` (returns `owner` + `results`), registered before `/:type/:id`.
- Test `tests/features/traces/traces.api.spec.ts` — new (pagination + by-conversation auth).

**agents `ui/`**
- Modify `ui/src/composables/use-agent-chat.ts` — decouple trace headers from recorder; drop recorder + `sessionUsage`.
- Modify `ui/src/components/AgentChat.vue` — remove recorder wiring + dialog props.
- Trim `ui/src/traces/session-recorder.ts` — keep `fromTrace` + read accessors + view types; drop live-capture methods.
- Delete `ui/src/traces/trace-handoff.ts`.
- Delete `ui/src/pages/[type]/[id]/trace-review.vue`.
- Create `ui/src/pages/traces/[id]/review.vue` — per-trace review (`/traces/:id/review`).
- Create `ui/src/pages/[type]/[id]/activity.vue` — read-only activity page.
- Create `ui/src/components/agent-chat/ConfigSummary.vue` — read-only config display.
- Modify `ui/src/components/agent-chat/AgentChatDebugDialog.vue` — two tabs + review link.
- Keep unchanged: `TraceView.vue`, `EvaluatorChat.vue`, `reconstruct-trace.ts`, `evaluator-*`, `gateway-response.ts`, `trace-consent.ts`, `UsageCard.vue`, `MonitoringGlobalSection.vue`, `MonitoringIndividualSection.vue`.
- Tests: `tests/features/traces/*.e2e.spec.ts` (update), new activity e2e.

**data-fair (`../data-fair_feat-agents-suivi`)**
- Create `ui/src/pages/agents-activity.vue` — embeds `/agents/:type/:id/activity`.
- Modify `ui/src/composables/layout/use-navigation-items.ts` — add monitor-group item.

---

## Phase 1 — Trace API

### Task 1: Paginate the conversation list

**Files:**
- Modify: `api/src/traces/router.ts:12-45`
- Test: `tests/features/traces/traces.api.spec.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/features/traces/traces.api.spec.ts`:

```ts
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin
const mockModel = { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } }

// Seed settings with storeTraces on + a mock provider, then drive the gateway with
// trace headers so the server persists traceRequests for a conversation.
async function seedTrace (conversationId: string, prompt: string) {
  await admin.post('/api/gateway/organization/test1/v1/chat/completions', {
    model: 'assistant',
    messages: [{ role: 'user', content: prompt }]
  }, { headers: { 'x-trace-conversation': conversationId, 'x-trace-consent': 'yes', 'x-trace-ctx': `turn:${conversationId}` } })
}

test.describe('Traces API', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/organization/test1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: { assistant: { model: mockModel } },
      quotas: defaultQuotas,
      storeTraces: true
    })
  })

  test('paginates the conversation list newest-first', async () => {
    await seedTrace('conv-a', 'hello')
    await seedTrace('conv-b', 'hello')
    const res = await admin.get('/api/traces/organization/test1?page=1&size=1')
    assert.equal(res.data.results.length, 1)
    assert.equal(typeof res.data.count, 'number')
    assert.ok(res.data.count >= 2)
  })
})
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `npm run test tests/features/traces/traces.api.spec.ts`
Expected: FAIL — `count` is `undefined` and `size` not honored (current code returns up to 200, no `count`).

- [ ] **Step 3: Implement pagination**

In `api/src/traces/router.ts`, replace the `GET /:type/:id` handler body (lines 12-45) so it honors `page`/`size` and returns `count`:

```ts
router.get('/:type/:id', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as unknown as AccountKeys
  assertAccountRole(session, owner, 'admin')

  const ownerFilter = { 'owner.type': owner.type, 'owner.id': owner.id }
  const size = Math.min(Math.max(parseInt(String(req.query.size ?? '20'), 10) || 20, 1), 200)
  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1)

  const grouped = await mongo.traceRequests.aggregate([
    { $match: ownerFilter },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: '$conversation.id',
        startedAt: { $first: '$createdAt' },
        userName: { $first: '$userName' },
        userId: { $first: '$userId' },
        firstBody: { $first: '$request.body' },
        requestCount: { $sum: 1 }
      }
    },
    { $sort: { startedAt: -1 } },
    { $facet: {
      results: [{ $skip: (page - 1) * size }, { $limit: size }],
      total: [{ $count: 'count' }]
    } }
  ]).toArray()

  const facet = grouped[0] ?? { results: [], total: [] }
  res.json({
    count: facet.total[0]?.count ?? 0,
    results: facet.results.map((r: any) => ({
      conversationId: r._id,
      startedAt: r.startedAt,
      userName: r.userName,
      userId: r.userId,
      requestCount: r.requestCount,
      preview: firstUserMessage(r.firstBody)
    }))
  })
})
```

- [ ] **Step 4: Run it — expect PASS**

Run: `npm run test tests/features/traces/traces.api.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/traces/router.ts tests/features/traces/traces.api.spec.ts
git commit -m "feat(traces): paginate the conversation list"
```

### Task 2: Fetch a trace by conversation id (owner-resolving)

**Files:**
- Modify: `api/src/traces/router.ts` (add route BEFORE `/:type/:id`)
- Test: `tests/features/traces/traces.api.spec.ts`

- [ ] **Step 1: Add failing tests**

Append to the `describe` block in `tests/features/traces/traces.api.spec.ts`:

```ts
  test('fetches a trace by conversation id and returns its owner', async () => {
    await seedTrace('conv-x', 'hello world')
    const res = await admin.get('/api/traces/conversation/conv-x')
    assert.deepEqual(res.data.owner, { type: 'organization', id: 'test1' })
    assert.ok(res.data.results.length >= 1)
  })

  test('by-conversation is 404 for unknown id', async () => {
    const res = await admin.get('/api/traces/conversation/does-not-exist', { validateStatus: () => true })
    assert.equal(res.status, 404)
  })

  test('by-conversation rejects a non-admin of the owner', async () => {
    const { axiosAuth } = await import('../../support/axios.ts')
    const stranger = await axiosAuth('test1-user1')
    await seedTrace('conv-y', 'secret')
    const res = await stranger.get('/api/traces/conversation/conv-y', { validateStatus: () => true })
    assert.equal(res.status, 403)
  })
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npm run test tests/features/traces/traces.api.spec.ts`
Expected: FAIL — route returns the `/:type/:id` handler or 404 wrongly / no `owner`.

- [ ] **Step 3: Implement the route (registered before `/:type/:id`)**

In `api/src/traces/router.ts`, insert this handler **immediately after `export default router`** (before the `GET /:type/:id` route, so the literal `conversation` segment is matched first):

```ts
// Fetch a stored conversation by its (globally unique) id, resolving the owning
// account from the stored documents and authorizing against it. Registered before
// the `/:type/:id` param route so the literal `conversation` segment wins.
router.get('/conversation/:conversationId', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const results = await mongo.traceRequests
    .find({ 'conversation.id': req.params.conversationId }, { projection: { _id: 0 } })
    .sort({ createdAt: 1 })
    .toArray()
  if (!results.length) { res.status(404).send(); return }
  const owner = results[0].owner as AccountKeys
  assertAccountRole(session, owner, 'admin')
  res.json({ owner: { type: owner.type, id: owner.id }, results })
})
```

- [ ] **Step 4: Run — expect PASS**

Run: `npm run test tests/features/traces/traces.api.spec.ts`
Expected: PASS (all 4 tests).

- [ ] **Step 5: Type-check + commit**

```bash
npm run check-types
git add api/src/traces/router.ts tests/features/traces/traces.api.spec.ts
git commit -m "feat(traces): fetch a trace by conversation id, resolving owner"
```

---

## Phase 2 — Remove the client recorder, keep server recording

> Trace headers (`x-trace-*`) are currently sent only `if (recorder)`. They must keep being sent so the gateway still persists traces. This phase decouples them, then deletes the recorder.

### Task 3: Decouple trace headers from the recorder

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts`

- [ ] **Step 1: Always send trace headers**

In `ui/src/composables/use-agent-chat.ts`, at each call site that currently reads
`...(recorder ? { headers: traceHeaders(<ctx>) } : {})`, replace with an unconditional
`headers: traceHeaders(<ctx>)`. There are these sites (contexts in parentheses):
- line ~464 `traceHeaders(compactionCtxId)`
- line ~603 and ~608 `traceHeaders(\`sub:${ctxName}:${callIndex}:${parentToolCallId}\`)`
- line ~664 and ~701 `traceHeaders(\`turn:${turnId}\`)`

For each, change `...(recorder ? { headers: traceHeaders(X) } : {})` → `headers: traceHeaders(X)`.

- [ ] **Step 2: Verify the gateway still records (existing e2e)**

Run: `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd ..`
Run: `npm run test tests/features/traces/trace-review.e2e.spec.ts`
Expected: PASS — this test sends a chat with consent and reads it back from storage; it proves headers still flow.

- [ ] **Step 3: Commit**

```bash
git add ui/src/composables/use-agent-chat.ts
git commit -m "refactor(traces): always send trace headers, independent of the client recorder"
```

### Task 4: Remove the recorder and sessionUsage from the chat composable

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts`

- [ ] **Step 1: Strip recorder usage**

In `ui/src/composables/use-agent-chat.ts`:
- Remove `recorder?: SessionRecorder` from `UseAgentChatOptions` (~line 58) and the `SessionRecorder`/`ToolSnapshot` import (line 8) — keep `ToolSnapshot` only if still referenced elsewhere (grep; if not, remove it too).
- Remove `recorder` from the `const { recorder, localTools, modelName } = options` destructure (~118).
- Delete `capturePhysicalResponse` and the recorder branch of `tracingFetch` so it becomes a plain pass-through (or remove `tracingFetch` and use `fetch` directly at its call sites — whichever keeps the SDK `fetch` option intact). The headers added in Task 3 are independent of this wrapper.
- Delete every remaining `if (recorder) { ... }` block and `recorder.<method>(...)` call (`snapshotTools`, `recordPhysicalRequest`, `recordCompaction`, `startTurn`, `startSubAgent`, `recordSubAgentStep`, `startToolCall`, `finishToolCall`, `finishStep`, `recordModerationDecision`, `addStepMessages`).
- Remove the `sessionUsage` ref (~128), its two update blocks (~630-634, ~791-795), its reset (~378), and drop it from the returned object (~826).

- [ ] **Step 2: Verify no dangling references**

Run: `grep -n "recorder\|sessionUsage" ui/src/composables/use-agent-chat.ts`
Expected: no matches.

- [ ] **Step 3: Type-check (will surface AgentChat usage — fixed next task)**

Run: `npm run check-types 2>&1 | grep -E "use-agent-chat|AgentChat" || echo "no errors in those files"`
Expected: errors only in `AgentChat.vue` (sessionUsage/recorder props) — fixed in Task 5.

- [ ] **Step 4: Commit**

```bash
git add ui/src/composables/use-agent-chat.ts
git commit -m "refactor(traces): drop the in-memory recorder and live sessionUsage from useAgentChat"
```

### Task 5: Remove recorder wiring from AgentChat.vue

**Files:**
- Modify: `ui/src/components/AgentChat.vue`

- [ ] **Step 1: Remove recorder + trace plumbing**

In `ui/src/components/AgentChat.vue`:
- Delete the import `import { SessionRecorder } from '~/traces/session-recorder'` and `import type { TraceOverviewEntry } ...` (lines 93-94).
- Delete `const recorder = new SessionRecorder()` + `recorder.setSystemPrompt(...)` (153-154).
- Remove `recorder` from the `useAgentChat({...})` options (162).
- Remove every `if (recorder) { recorder.* }` / `recorder.*` block in `watch(finalSystemPrompt...)`, `startActionSession`, `handleReset`, `handleSessionCleared` (175-176, 261-263, 283-286, 298-300).
- Delete the `traceOverview` computed (347-356).
- In the `<agent-chat-debug-dialog>` tag, remove the props `:trace-overview="traceOverview"`, `:recorder="recorder"`, and `:session-usage="chat.sessionUsage.value"` (54-56).

- [ ] **Step 2: Verify**

Run: `grep -n "recorder\|traceOverview\|sessionUsage\|SessionRecorder" ui/src/components/AgentChat.vue`
Expected: no matches.

- [ ] **Step 3: Commit** (dialog prop types fixed in Phase 5; build later)

```bash
git add ui/src/components/AgentChat.vue
git commit -m "refactor(traces): stop recording the live session in AgentChat"
```

### Task 6: Trim SessionRecorder to the read-only surface

**Files:**
- Modify: `ui/src/traces/session-recorder.ts`

- [ ] **Step 1: Identify the read-only surface used by consumers**

Run: `grep -rn "recorder\.\|SessionRecorder\." ui/src/components/agent-chat/TraceView.vue ui/src/components/EvaluatorChat.vue ui/src/traces/evaluator-tools.ts ui/src/pages/traces 2>/dev/null`
Keep these methods/fields and `static fromTrace`, plus all exported interfaces and `serializeTrace`/`reviveTraceDates`. The viewer uses `getTraceOverview()` and `getTraceEntry(index)`; the evaluator tools use whatever `buildEvaluatorTools` reads.

- [ ] **Step 2: Delete the live-capture methods**

Remove the now-unused mutation methods: `reset`, `setSystemPrompt`, `snapshotTools`, `recordPhysicalRequest`, `recordCompaction`, `startTurn`, `startSubAgent`, `recordSubAgentStep`, `startToolCall`, `finishToolCall`, `finishStep`, `recordModerationDecision`, `addStepMessages` — only if Step-1 grep shows no remaining consumer. Keep the class shell, its fields, `static fromTrace`, and the read accessors that are still referenced.

- [ ] **Step 3: Type-check**

Run: `npm run check-types 2>&1 | grep "session-recorder" || echo ok`
Expected: `ok` (no references to deleted methods outside the file).

- [ ] **Step 4: Commit**

```bash
git add ui/src/traces/session-recorder.ts
git commit -m "refactor(traces): trim SessionRecorder to the stored-trace read surface"
```

---

## Phase 3 — Per-trace review page

### Task 7: Delete trace-handoff and the old trace-review page

**Files:**
- Delete: `ui/src/traces/trace-handoff.ts`, `ui/src/pages/[type]/[id]/trace-review.vue`

- [ ] **Step 1: Confirm the only consumers are things we're removing**

Run: `grep -rn "trace-handoff\|trace-review\|writeHandoff\|downloadTrace\|readHandoff" ui/src`
Expected: matches only in `AgentChatDebugDialog.vue` (handled Phase 5) and the old page (being deleted).

- [ ] **Step 2: Delete the files**

```bash
git rm ui/src/traces/trace-handoff.ts "ui/src/pages/[type]/[id]/trace-review.vue"
```

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor(traces): remove trace upload/handoff and the old trace-review page"
```

### Task 8: Create `/traces/:id/review`

**Files:**
- Create: `ui/src/pages/traces/[id]/review.vue`

- [ ] **Step 1: Write the page**

Create `ui/src/pages/traces/[id]/review.vue` (mirrors the kept wiring from the old page's `loadStored`, but for one trace by id, with owner from the API for the evaluator):

```vue
<template>
  <v-container
    fluid
    class="trace-review pa-0"
    data-iframe-height
  >
    <p
      v-if="loadError"
      class="text-error pa-3"
    >
      {{ loadError }}
    </p>
    <v-row
      v-else-if="recorder && owner"
      no-gutters
      class="fill-height"
    >
      <v-col cols="12" md="6" class="trace-review__pane">
        <trace-view
          :trace-overview="traceOverview"
          :recorder="recorder"
        />
      </v-col>
      <v-col cols="12" md="6" class="trace-review__pane trace-review__chat">
        <evaluator-chat
          :recorder="recorder"
          :account-type="owner.type"
          :account-id="owner.id"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  loadError: Trace introuvable ou accès refusé.
en:
  loadError: Trace not found or access denied.
</i18n>

<script lang="ts" setup>
import { ref, shallowRef, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { SessionRecorder } from '~/traces/session-recorder'
import type { TraceOverviewEntry } from '~/traces/session-recorder'
import { reconstructTrace } from '~/traces/reconstruct-trace'
import { $apiPath } from '~/context'
import TraceView from '~/components/agent-chat/TraceView.vue'
import EvaluatorChat from '~/components/EvaluatorChat.vue'

const { t } = useI18n()
const route = useRoute()
const conversationId = route.params.id as string

const recorder = shallowRef<SessionRecorder | null>(null)
const owner = ref<{ type: string, id: string } | null>(null)
const loadError = ref('')

const traceOverview = computed<TraceOverviewEntry[]>(() =>
  recorder.value ? recorder.value.getTraceOverview() : []
)

onMounted(async () => {
  try {
    const res = await fetch(`${$apiPath}/traces/conversation/${conversationId}`, { credentials: 'include' })
    if (!res.ok) { loadError.value = t('loadError'); return }
    const body = await res.json()
    owner.value = body.owner
    recorder.value = SessionRecorder.fromTrace(reconstructTrace(body.results))
  } catch {
    loadError.value = t('loadError')
  }
})
</script>

<style scoped>
.trace-review { height: 100%; }
.trace-review__pane { height: 100%; overflow-y: auto; border-right: 1px solid rgba(0,0,0,0.08); }
.trace-review__chat { border-right: none; }
</style>
```

- [ ] **Step 2: Build libs + type-check**

Run: `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd .. && npm run check-types`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "ui/src/pages/traces/[id]/review.vue"
git commit -m "feat(traces): per-trace review page at /traces/:id/review"
```

### Task 9: E2E — review page renders a stored trace

**Files:**
- Create: `tests/features/traces/trace-review-page.e2e.spec.ts`

- [ ] **Step 1: Write the test** (seed via the gateway with trace headers, then open the page by conversationId)

```ts
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin
const mockModel = { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } }

test.describe('Trace review page', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/organization/test1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: { assistant: { model: mockModel } },
      quotas: defaultQuotas,
      storeTraces: true
    })
    await admin.post('/api/gateway/organization/test1/v1/chat/completions', {
      model: 'assistant', messages: [{ role: 'user', content: 'hello' }]
    }, { headers: { 'x-trace-conversation': 'conv-review', 'x-trace-consent': 'yes', 'x-trace-ctx': 'turn:conv-review' } })
  })

  test('renders the stored trace for an admin', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/traces/conv-review/review', 'superadmin', { adminMode: true })
    await expect(page.getByText('hello')).toBeVisible({ timeout: 10000 })
  })
})
```

- [ ] **Step 2: Run — expect PASS**

Run: `npm run test tests/features/traces/trace-review-page.e2e.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/features/traces/trace-review-page.e2e.spec.ts
git commit -m "test(traces): e2e for the per-trace review page"
```

---

## Phase 4 — Activity page

### Task 10: Read-only config summary component

**Files:**
- Create: `ui/src/components/agent-chat/ConfigSummary.vue`

- [ ] **Step 1: Write the component** (renders providers/models/quotas read-only from settings; never shows keys — the API already obfuscates them)

```vue
<template>
  <div v-if="settings">
    <h4 class="text-title-small mb-2">{{ t('providers') }}</h4>
    <v-chip
      v-for="p in settings.providers"
      :key="p.id"
      size="small"
      class="mr-1 mb-1"
    >{{ p.name }} · {{ p.type }}</v-chip>

    <h4 class="text-title-small mt-4 mb-2">{{ t('models') }}</h4>
    <v-table density="compact">
      <tbody>
        <tr v-for="role in modelRoles" :key="role">
          <td>{{ role }}</td>
          <td>{{ settings.models?.[role]?.model?.name || '—' }}</td>
        </tr>
      </tbody>
    </v-table>

    <h4 class="text-title-small mt-4 mb-2">{{ t('limits') }}</h4>
    <v-table density="compact">
      <tbody>
        <tr v-for="(q, role) in settings.quotas" :key="role">
          <td>{{ role }}</td>
          <td>{{ q.unlimited ? t('unlimited') : t('perMonth', { n: q.monthlyLimit }) }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<i18n lang="yaml">
fr:
  providers: Fournisseurs
  models: Modèles
  limits: Limites
  unlimited: Illimité
  perMonth: "{n} / mois"
en:
  providers: Providers
  models: Models
  limits: Limits
  unlimited: Unlimited
  perMonth: "{n} / month"
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
defineProps<{ settings: any }>()
const modelRoles = ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator']
</script>
```

- [ ] **Step 2: Build libs + type-check**

Run: `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd .. && npm run check-types`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add ui/src/components/agent-chat/ConfigSummary.vue
git commit -m "feat(activity): read-only config summary component"
```

### Task 11: Activity page

**Files:**
- Create: `ui/src/pages/[type]/[id]/activity.vue`

- [ ] **Step 1: Write the page** (reuses `ConfigSummary`, `UsageCard`, monitoring sections; paginated trace list linking to review; per-row delete + per-user erase)

```vue
<template>
  <v-container v-if="settings" data-iframe-height>
    <h3 class="text-title-large mb-4">{{ t('configuration') }}</h3>
    <config-summary :settings="settings" />

    <h3 class="text-title-large mt-6 mb-4">{{ t('usage') }}</h3>
    <usage-card :account-type="accountType" :account-id="accountId" />
    <monitoring-global-section :account-type="accountType" :account-id="accountId" />
    <monitoring-individual-section :account-type="accountType" :account-id="accountId" />

    <h3 class="text-title-large mt-6 mb-4">{{ t('traces') }}</h3>
    <p v-if="loadError" class="text-error text-caption">{{ loadError }}</p>
    <v-list density="compact">
      <v-list-item
        v-for="row in traces"
        :key="row.conversationId"
        :to="`/traces/${row.conversationId}/review`"
      >
        <v-list-item-title class="text-body-2">{{ row.preview || row.conversationId }}</v-list-item-title>
        <v-list-item-subtitle class="text-caption">
          {{ row.userName || row.userId || '—' }} · {{ formatDate(row.startedAt) }} · {{ t('requests', row.requestCount) }}
        </v-list-item-subtitle>
        <template #append>
          <v-btn :icon="mdiDelete" size="small" variant="text" @click.prevent="deleteTrace(row.conversationId)" />
        </template>
      </v-list-item>
    </v-list>
    <v-pagination
      v-if="pageCount > 1"
      v-model="page"
      :length="pageCount"
      density="compact"
      @update:model-value="fetchTraces"
    />
  </v-container>
</template>

<i18n lang="yaml">
fr:
  configuration: Configuration
  usage: Consommation
  traces: Conversations enregistrées
  requests: "{n} requête | {n} requêtes"
  loadError: Erreur de chargement des traces.
en:
  configuration: Configuration
  usage: Usage
  traces: Stored conversations
  requests: "{n} request | {n} requests"
  loadError: Failed to load traces.
</i18n>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { mdiDelete } from '@mdi/js'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import { $apiPath } from '~/context'
import ConfigSummary from '~/components/agent-chat/ConfigSummary.vue'
import UsageCard from '~/components/UsageCard.vue'
import MonitoringGlobalSection from '~/components/MonitoringGlobalSection.vue'
import MonitoringIndividualSection from '~/components/MonitoringIndividualSection.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSession()
const accountType = route.params.type as string
const accountId = route.params.id as string
const SIZE = 20

const settings = ref<any>(null)
const traces = ref<any[]>([])
const page = ref(1)
const pageCount = ref(1)
const loadError = ref('')

const formatDate = (iso: string) => new Date(iso).toLocaleString()

const isAdmin = () =>
  !!session.state.user?.isAdmin ||
  getAccountRole(session.state, { type: accountType as 'user' | 'organization', id: accountId }) === 'admin'

const fetchTraces = async () => {
  try {
    const res = await fetch(`${$apiPath}/traces/${accountType}/${accountId}?page=${page.value}&size=${SIZE}`, { credentials: 'include' })
    if (!res.ok) { loadError.value = t('loadError'); return }
    const body = await res.json()
    traces.value = body.results
    pageCount.value = Math.max(1, Math.ceil((body.count ?? 0) / SIZE))
  } catch { loadError.value = t('loadError') }
}

const deleteTrace = async (conversationId: string) => {
  await fetch(`${$apiPath}/traces/${accountType}/${accountId}/${conversationId}`, { method: 'DELETE', credentials: 'include' })
  await fetchTraces()
}

onMounted(async () => {
  if (!isAdmin()) { router.replace(`/${accountType}/${accountId}/chat`); return }
  const sRes = await fetch(`${$apiPath}/settings/${accountType}/${accountId}`, { credentials: 'include' })
  settings.value = await sRes.json()
  await fetchTraces()
})
</script>
```

- [ ] **Step 2: Build libs + type-check**

Run: `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd .. && npm run check-types`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "ui/src/pages/[type]/[id]/activity.vue"
git commit -m "feat(activity): read-only activity page with config, usage and paginated traces"
```

### Task 12: E2E — activity page lists traces and links to review

**Files:**
- Create: `tests/features/traces/activity.e2e.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin
const mockModel = { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } }

test.describe('Activity page', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/organization/test1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: { assistant: { model: mockModel } },
      quotas: defaultQuotas,
      storeTraces: true
    })
    await admin.post('/api/gateway/organization/test1/v1/chat/completions', {
      model: 'assistant', messages: [{ role: 'user', content: 'activity hello' }]
    }, { headers: { 'x-trace-conversation': 'conv-act', 'x-trace-consent': 'yes', 'x-trace-ctx': 'turn:conv-act' } })
  })

  test('lists stored conversations and navigates to review', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1/activity', 'superadmin', { adminMode: true })
    await expect(page.getByText('Mock · mock')).toBeVisible({ timeout: 10000 })
    await page.getByText('activity hello').click()
    await expect(page).toHaveURL(/\/traces\/conv-act\/review/)
  })
})
```

- [ ] **Step 2: Run — expect PASS**

Run: `npm run test tests/features/traces/activity.e2e.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/features/traces/activity.e2e.spec.ts
git commit -m "test(activity): e2e for the activity page and review navigation"
```

---

## Phase 5 — Chat dialog: two tabs + review link

### Task 13: Collapse the debug dialog to Info + Settings

**Files:**
- Modify: `ui/src/components/agent-chat/AgentChatDebugDialog.vue`

- [ ] **Step 1: Update the props/script**

In `AgentChatDebugDialog.vue`:
- Remove props `traceOverview`, `recorder`, `sessionUsage` from `defineProps` (~250-257).
- Remove imports/usages of `TraceView`, `writeHandoff`, `downloadTrace`, and the `onOpenReview` handler.
- Add a computed `reviewHref` and `conversationId`. The conversation id is the per-chat id; expose it from `use-agent-chat` if not already a prop — simplest: read it from the trace-consent flow. Since the dialog already imports `consentRef`/`traceStorageAvailable`, add a `conversationId` prop passed from `AgentChat.vue` (which has it via `chat`/`use-agent-chat`). Add `conversationId: string` to props and pass `:conversation-id="chat.conversationId.value"` from `AgentChat.vue` (expose `conversationId` from `useAgentChat`'s return if not already — add it to the returned object).
- Compute: `const showReview = computed(() => props.isAdmin && traceStorageAvailable.value && consentRef.value === 'yes')`.

- [ ] **Step 2: Update the template — remove trace tab, add review link in Info**

- Remove the `<v-tab value="trace">` and its `<v-window-item value="trace">` (which held `TraceView` + usage display + Download / Open-review buttons).
- Keep tabs `systemPrompt`→ rename the first tab to **Info** holding the system prompt **and** tools (merge the current `systemPrompt` + `tools` window-items into one `info` window-item), and `settings`.
- In the Info window-item, append:

```vue
<v-btn
  v-if="showReview"
  variant="tonal"
  size="small"
  :prepend-icon="mdiChartBar"
  class="mt-2"
  @click="openReview"
>
  {{ t('openReview') }}
</v-btn>
```

- Add the handler (navigates the host app, since the chat is in an iframe; falls back to a new tab when not embedded):

```ts
import { useVueRouterDFrameContent } from '@data-fair/frame/lib/vue-router/d-frame-content.js'
const dFrameContent = useVueRouterDFrameContent()
const openReview = () => {
  const path = `/${props.accountType}/${props.accountId}/activity` // host resolves to embedded agents area
  const url = `/traces/${props.conversationId}/review`
  if (window.parent !== window) dFrameContent.sendMessage({ type: 'navigate', url } as any)
  else window.open(url, '_blank')
}
```

> Note: the in-iframe navigation contract is finalized in Phase 6 (data-fair maps the `navigate` message / sync-path to the embedded agents review route). If host navigation proves unavailable, keep the `window.open(url, '_blank')` path for both cases — confirmed during Task 16.

- Update `<v-tab>` labels/i18n: `info` ("Info"/"Info"), `settings` (existing). Remove `systemPrompt`/`tools`/`trace` tab labels no longer used.

- [ ] **Step 3: Build libs + type-check + lint**

Run: `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd .. && npm run check-types && npm run lint-fix`
Expected: PASS (only pre-existing `v-html` warnings).

- [ ] **Step 4: Commit**

```bash
git add ui/src/components/agent-chat/AgentChatDebugDialog.vue ui/src/components/AgentChat.vue ui/src/composables/use-agent-chat.ts
git commit -m "feat(chat): two-tab debug dialog (Info + Settings) with admin trace-review link"
```

### Task 14: E2E — dialog has two tabs; review link gated by consent

**Files:**
- Modify: `tests/features/traces/trace-consent.e2e.spec.ts` (or new `chat-dialog.e2e.spec.ts`)

- [ ] **Step 1: Write the test**

```ts
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin
const mockModel = { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } }

test.describe('Chat debug dialog', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/organization/test1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: { assistant: { model: mockModel } }, quotas: defaultQuotas, storeTraces: true
    })
  })

  test('shows exactly two tabs and no trace tab', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1/chat', 'superadmin', { adminMode: true })
    // open the debug dialog via the header (admin only)
    await page.getByRole('button', { name: /debug|info/i }).first().click()
    await expect(page.getByRole('tab')).toHaveCount(2)
    await expect(page.getByRole('tab', { name: 'Trace' })).toHaveCount(0)
  })
})
```

- [ ] **Step 2: Run — expect PASS** (adjust the open-dialog selector to the real `agent-chat-header` debug button if needed)

Run: `npm run test tests/features/traces/trace-consent.e2e.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/features/traces/trace-consent.e2e.spec.ts
git commit -m "test(chat): debug dialog exposes only Info + Settings tabs"
```

---

## Phase 6 — data-fair: Suivi nav + embed

> Worktree: `../data-fair_feat-agents-suivi` (branch `feat-agents-suivi`). Commit there separately.

### Task 15: Embed page for the activity area

**Files:**
- Create: `../data-fair_feat-agents-suivi/ui/src/pages/agents-activity.vue`

- [ ] **Step 1: Write the embed page** (mirrors `admin/agents.vue` but for the current session account; `sync-path` lets `/activity` and `/traces/:id/review` deep-link)

```vue
<template>
  <d-frame
    v-if="account"
    id="agents-activity"
    :adapter.prop="stateChangeAdapter"
    :src="`/agents/${account.type}/${account.id}/activity`"
    sync-path="/data-fair/agents-activity/"
    class="fill-height"
    resize="no"
    sync-params
    emit-iframe-messages
    @message="onMessage"
    @iframe-message="onMessage"
    @notif="(e: any) => sendUiNotif(frameNotifArg(e.detail))"
  />
</template>

<script setup lang="ts">
import { useDFramePage } from '~/composables/layout/use-d-frame-page'
const { sendUiNotif } = useUiNotif()
const { stateChangeAdapter, onMessage } = useDFramePage()
const session = useSession()
const account = computed(() => session.account.value)
</script>
```

> Confirm `useSession`/`frameNotifArg` auto-imports match the repo (they're used in `admin/agents.vue`); adjust imports to match that file exactly.

- [ ] **Step 2: Commit (in the data-fair worktree)**

```bash
cd ../data-fair_feat-agents-suivi
git add ui/src/pages/agents-activity.vue
git commit -m "feat(agents): embed page for the agents activity area"
cd -
```

### Task 16: Add the Suivi (monitor) nav item

**Files:**
- Modify: `../data-fair_feat-agents-suivi/ui/src/composables/layout/use-navigation-items.ts` (monitor group, ~lines 118-132)
- Modify: the same file's i18n (or the layout i18n source) for the title.

- [ ] **Step 1: Add the nav item**

In the `// Monitoring group` block, after the existing items and before `if (monitor.length) ...`, add:

```ts
if ($uiConfig.agentsIntegration && canAdmin.value) {
  monitor.push({ to: '/agents-activity', icon: mdiRobotOutline, title: t('agentsActivity') })
}
```

Ensure `mdiRobotOutline` is imported (it already is — used by the admin group) and add the `agentsActivity` i18n key (fr: "Suivi des agents", en: "Agents activity") wherever this composable's `t` keys are defined.

- [ ] **Step 2: Verify the route resolves and the iframe navigates to review**

Run data-fair locally (user-managed) and confirm: the "Suivi des agents" item appears for an account admin with `agentsIntegration` on, opens the activity page, and clicking a trace row navigates within the frame to `/traces/:id/review` (sync-path reflects it). If the chat-dialog `navigate` message does not land on this route, switch Task 13's `openReview` to the `window.open(url, '_blank')` fallback for both branches and note it.

- [ ] **Step 3: Commit (in the data-fair worktree)**

```bash
cd ../data-fair_feat-agents-suivi
git add ui/src/composables/layout/use-navigation-items.ts
git commit -m "feat(agents): add agents activity to the Suivi navigation"
cd -
```

---

## Phase 7 — Final verification

### Task 17: Full check + suite

- [ ] **Step 1: agents repo gates**

Run: `npm run lint-fix && npm run check-types`
Expected: 0 errors (pre-existing `v-html` warnings only).

- [ ] **Step 2: Build libs, run the full suite**

Run: `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd .. && npm run test`
Expected: all green (re-run any flaky e2e individually).

- [ ] **Step 3: Docker build**

Run: `docker build -t agents .`
Expected: success.

- [ ] **Step 4: Final commit if anything was adjusted**

```bash
git add -A && git commit -m "chore(traces): finalize activity + trace-review simplification"
```

---

## Self-review notes (addressed)

- **Spec coverage:** removals (§1)→Tasks 3-7; API (§2)→Tasks 1-2; review page (§3)→Tasks 8-9; activity page (§4)→Tasks 10-12; chat dialog (§5)→Tasks 13-14; data-fair (§6)→Tasks 15-16.
- **Server recording risk:** Task 3 ungates trace headers *before* Task 4 removes the recorder; Task 3 Step 2 verifies via the existing trace e2e.
- **Owner for evaluator:** Task 2 returns `owner`; Task 8 passes it to `EvaluatorChat`.
- **Route shadowing:** Task 2 registers `/conversation/:conversationId` before `/:type/:id`.
- **Open item:** the exact in-iframe→host navigation for the chat-dialog review link is finalized in Task 16 with a `window.open` fallback.
