# Account Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable external users (e.g., portal users) to use agents owned by other accounts by adding `:type/:id` routing to gateway/summary APIs and UI pages, with role-based permission checks.

**Architecture:** Add a shared `assertCanUseModel` helper for role-based access control. Modify gateway and summary routers to accept `:type/:id` params. Move UI pages into `[type]/[id]/` directory structure so account context flows from the URL. Update composables and components to accept target account params.

**Tech Stack:** Express.js, Vue 3, TypeScript, Playwright tests

**Spec:** `docs/superpowers/specs/2026-03-19-account-routing-design.md`

---

### Task 1: Create `assertCanUseModel` permission helper

**Files:**
- Create: `api/src/auth.ts`

- [ ] **Step 1: Write the failing test**

Add a test file for the permission helper. Uses the test support from `tests/support/axios.ts`.

Create `tests/features/auth/auth.unit.spec.ts`:

```typescript
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { assertCanUseModel } from '../../../api/src/auth.ts'

// Minimal session-like objects for testing
const makeSession = (accountType: string, accountId: string, role = 'admin') => ({
  account: { type: accountType, id: accountId },
  user: { id: accountId },
  accountRole: role
})

const makeOwner = (type: string, id: string) => ({ type, id })

test.describe('assertCanUseModel', () => {
  test('admin of owner account always has access', () => {
    const session = makeSession('user', 'user1', 'admin')
    const owner = makeOwner('user', 'user1')
    assert.doesNotThrow(() => assertCanUseModel(session as any, owner, { roles: [] }))
  })

  test('same-account member with non-empty roles has access', () => {
    const session = makeSession('organization', 'org1', 'user')
    const owner = makeOwner('organization', 'org1')
    assert.doesNotThrow(() => assertCanUseModel(session as any, owner, { roles: ['user'] }))
  })

  test('same-account member denied when roles is empty (admin-only)', () => {
    const session = makeSession('organization', 'org1', 'user')
    const owner = makeOwner('organization', 'org1')
    assert.throws(() => assertCanUseModel(session as any, owner, { roles: [] }), { status: 403 })
  })

  test('external user granted when roles includes external', () => {
    const session = makeSession('user', 'external-user1', 'admin')
    const owner = makeOwner('organization', 'org1')
    assert.doesNotThrow(() => assertCanUseModel(session as any, owner, { roles: ['external'] }))
  })

  test('external user denied when roles does not include external', () => {
    const session = makeSession('user', 'external-user1', 'admin')
    const owner = makeOwner('organization', 'org1')
    assert.throws(() => assertCanUseModel(session as any, owner, { roles: ['user'] }), { status: 403 })
  })

  test('external user denied when roles is empty', () => {
    const session = makeSession('user', 'external-user1', 'admin')
    const owner = makeOwner('organization', 'org1')
    assert.throws(() => assertCanUseModel(session as any, owner, { roles: [] }), { status: 403 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/features/auth/auth.unit.spec.ts`
Expected: FAIL — module `../../../api/src/auth.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `api/src/auth.ts`:

```typescript
import { type AccountKeys } from '@data-fair/lib-express'
import createError from 'http-errors'

interface SessionLike {
  account: { type: string, id: string }
  user: { id: string }
  accountRole?: string
}

interface ModelRolesConfig {
  roles?: string[]
}

/**
 * Check if the session user can use a model owned by the given account.
 *
 * Algorithm (ordered):
 * 1. Admin of the owner account → granted
 * 2. Same account + non-empty roles → granted (any member)
 * 3. Different account + "external" in roles → granted
 * 4. Otherwise → 403
 */
export function assertCanUseModel (session: SessionLike, owner: AccountKeys, modelConfig: ModelRolesConfig): void {
  const isSameAccount = session.account.type === owner.type && session.account.id === owner.id
  const roles = modelConfig.roles ?? []

  // 1. Admin of owner account always has access
  if (isSameAccount && session.accountRole === 'admin') return

  // 2. Same account member with non-empty roles
  if (isSameAccount && roles.length > 0) return

  // 3. External user with "external" in roles
  if (!isSameAccount && roles.includes('external')) return

  // 4. Denied
  throw createError(403, 'You do not have permission to use this model')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/features/auth/auth.unit.spec.ts`
Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/auth.ts tests/features/auth/auth.unit.spec.ts
git commit -m "feat: add assertCanUseModel permission helper"
```

---

### Task 2: Add `:type/:id` to gateway router

**Files:**
- Modify: `api/src/gateway/router.ts`

- [ ] **Step 1: Write the failing test**

Update `tests/features/gateway/gateway.api.spec.ts` to use the new URL pattern with `:type/:id` and add an external user test.

Add at the top (after existing imports):

```typescript
const externalUser = await axiosAuth('test-standalone2')
```

Update `createGatewayProvider` to accept account params:

```typescript
async function createGatewayProvider (ax: any, ownerType = 'user', ownerId = 'test-standalone1') {
  const cookieString = await ax.cookieJar.getCookieString(directoryUrl)
  return createOpenAI({
    baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/${ownerType}/${ownerId}/v1`,
    apiKey: 'unused',
    headers: { cookie: cookieString },
    name: 'data-fair-gateway'
  })
}
```

Update existing tests to pass `user` as first arg to `createGatewayProvider(user)`.

Add new tests inside the describe block:

```typescript
test('external user can use gateway when roles includes external', async () => {
  await user.put('/api/settings/user/test-standalone1', {
    ...settingsData,
    models: {
      assistant: {
        ...settingsData.models.assistant,
        roles: ['external']
      }
    }
  })

  const provider = await createGatewayProvider(externalUser)
  const result = await generateText({
    model: provider.chat('assistant'),
    messages: [{ role: 'user', content: 'hello' }]
  })
  assert.equal(result.text, 'world')
})

test('external user denied when roles does not include external', async () => {
  const provider = await createGatewayProvider(externalUser)
  await assert.rejects(
    generateText({
      model: provider.chat('assistant'),
      messages: [{ role: 'user', content: 'hello' }]
    })
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/features/gateway/gateway.api.spec.ts`
Expected: FAIL — route not found (404) because gateway doesn't have `:type/:id` yet.

- [ ] **Step 3: Update gateway router**

Modify `api/src/gateway/router.ts`:

1. Add imports:
```typescript
import { type AccountKeys } from '@data-fair/lib-express'
import { assertCanUseModel } from '../auth.ts'
```

2. Change route from `/v1/chat/completions` to `/:type/:id/v1/chat/completions`.

3. Replace `const owner = session.account` with:
```typescript
const owner = req.params as unknown as AccountKeys
```

4. Replace `isOrgContext` logic. Replace lines 82-123 with:
```typescript
// Track per-user when owner is org or user is external
const isSameAccount = session.account.type === owner.type && session.account.id === owner.id
const trackPerUser = owner.type === 'organization' || !isSameAccount

// Permission check — use the model entry (which has `roles`), not the nested `model` object
const modelEntry = settings.models[modelId] || settings.models.assistant
assertCanUseModel(session, owner, modelEntry)

// Check account limits against account usage
const accountLimits = settings.limits
const userLimits = trackPerUser ? settings.userLimits : undefined

if (accountLimits.dailyTokenLimit || accountLimits.monthlyTokenLimit) {
  const accountUsage = trackPerUser ? await getOwnerUsage(owner) : await getUsage(owner)
  const quotaCheck = checkQuota(accountUsage, accountLimits, trackPerUser ? 'organization' : 'user')
  if (quotaCheck) {
    res.status(429).json({
      error: {
        message: quotaCheck.reason,
        type: 'rate_limit_error',
        scope: quotaCheck.scope,
        usage: quotaCheck.usage,
        limit: quotaCheck.limit,
        resets_at: quotaCheck.resetsAt
      }
    })
    return
  }
}

// Check user limits
if (trackPerUser && (userLimits?.dailyTokenLimit || userLimits?.monthlyTokenLimit)) {
  const userUsage = await getUsage(owner, session.user.id)
  const quotaCheck = checkQuota(userUsage, userLimits, 'user')
  if (quotaCheck) {
    res.status(429).json({
      error: {
        message: quotaCheck.reason,
        type: 'rate_limit_error',
        scope: quotaCheck.scope,
        usage: quotaCheck.usage,
        limit: quotaCheck.limit,
        resets_at: quotaCheck.resetsAt
      }
    })
    return
  }
}
```

5. Move the permission check BEFORE the model creation (after loading settings and resolving modelConfig).

6. Update usage recording calls — replace `isOrgContext ? session.user.id : undefined` with `trackPerUser ? session.user.id : undefined` in both the streaming finish handler (~line 215) and the non-streaming handler (~line 253).

7. Update the error response for missing settings to be generic:
```typescript
if (!settings?.models?.assistant?.model) {
  res.status(404).json({
    error: { message: 'Agent not configured', type: 'invalid_request_error' }
  })
  return
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/features/gateway/gateway.api.spec.ts`
Expected: All tests PASS (existing + new).

- [ ] **Step 5: Commit**

```bash
git add api/src/gateway/router.ts tests/features/gateway/gateway.api.spec.ts
git commit -m "feat: add account routing to gateway API"
```

---

### Task 3: Add `:type/:id` to summary router

**Files:**
- Modify: `api/src/summary/router.ts`

- [ ] **Step 1: Write the failing test**

Update `tests/features/summary/summary.api.spec.ts`:

1. Change all `/api/summary` POST calls to `/api/summary/user/test-standalone1`.
2. Change the `otherUser` test: instead of posting to `/api/summary` (which used session account), post to `/api/summary/user/test-standalone1` — this should now return 403 (permission denied, no external role) instead of 404.
3. Add a test for external user with `external` role:

```typescript
test('external user can summarize when roles includes external', async () => {
  await user.put('/api/settings/user/test-standalone1', {
    providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
    models: { assistant: { model: mockModel, roles: ['external'] } },
    limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
  })

  const res = await otherUser.post('/api/summary/user/test-standalone1', {
    content: 'Content to summarize'
  })
  assert.equal(res.status, 200)
  assert.ok(res.data.summary)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/features/summary/summary.api.spec.ts`
Expected: FAIL — routes not found.

- [ ] **Step 3: Update summary router**

Modify `api/src/summary/router.ts`:

1. Add imports:
```typescript
import { type AccountKeys } from '@data-fair/lib-express'
import { assertCanUseModel } from '../auth.ts'
import { getUsage, getOwnerUsage, recordUsage, checkQuota } from '../usage/service.ts'
```

2. Change route from `POST /` to `POST /:type/:id`.

3. Replace owner resolution and permission check. Remove `assertAccountRole(session, owner, 'admin')` and replace the handler body with:
```typescript
const session = reqSessionAuthenticated(req)
const owner = req.params as unknown as AccountKeys

const body = req.body as SummaryRequest
if (!body.content) {
  res.status(400).json({ error: 'content is required' })
  return
}

const settings = await getRawSettings(owner)
if (!settings?.models?.assistant?.model) {
  res.status(404).json({ error: 'Agent not configured' })
  return
}

// Permission check — use summarizer entry if it exists, fall back to assistant
const modelEntry = settings.models.summarizer || settings.models.assistant
assertCanUseModel(session, owner, modelEntry)

// Quota enforcement (same pattern as gateway)
const isSameAccount = session.account.type === owner.type && session.account.id === owner.id
const trackPerUser = owner.type === 'organization' || !isSameAccount
const accountLimits = settings.limits
const userLimits = trackPerUser ? settings.userLimits : undefined

if (accountLimits.dailyTokenLimit || accountLimits.monthlyTokenLimit) {
  const accountUsage = trackPerUser ? await getOwnerUsage(owner) : await getUsage(owner)
  const quotaCheck = checkQuota(accountUsage, accountLimits, trackPerUser ? 'organization' : 'user')
  if (quotaCheck) {
    res.status(429).json({ error: quotaCheck.reason })
    return
  }
}

if (trackPerUser && (userLimits?.dailyTokenLimit || userLimits?.monthlyTokenLimit)) {
  const userUsage = await getUsage(owner, session.user.id)
  const quotaCheck = checkQuota(userUsage, userLimits, 'user')
  if (quotaCheck) {
    res.status(429).json({ error: quotaCheck.reason })
    return
  }
}

const model = await getSummaryModel(settings)
const system = body.prompt || 'Summarize the following content concisely:'

const { text, usage } = await generateText({
  model,
  system,
  messages: [{ role: 'user' as const, content: body.content }]
})

// Record usage after completion
const inputTokens = usage?.inputTokens ?? 0
const outputTokens = usage?.outputTokens ?? 0
if (inputTokens || outputTokens) {
  await recordUsage(owner, inputTokens, outputTokens, trackPerUser ? session.user.id : undefined)
}

res.json({ summary: text })
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/features/summary/summary.api.spec.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/summary/router.ts tests/features/summary/summary.api.spec.ts
git commit -m "feat: add account routing to summary API"
```

---

### Task 4: Update usage API test for new gateway URL

**Files:**
- Modify: `tests/features/usage/usage.api.spec.ts`

The usage test creates an OpenAI provider pointing to `/api/gateway/v1`. This URL changed to `/api/gateway/:type/:id/v1`.

- [ ] **Step 1: Update test**

In `tests/features/usage/usage.api.spec.ts`, change the `baseURL` in the provider creation (line 49):

```typescript
baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/user/test-standalone1/v1`,
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx playwright test tests/features/usage/usage.api.spec.ts`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/features/usage/usage.api.spec.ts
git commit -m "fix: update usage test for new gateway URL"
```

---

### Task 5: Update gateway tools test for new URL

**Files:**
- Modify: `tests/features/gateway/gateway.tools.api.spec.ts`

- [ ] **Step 1: Check and update the test file**

Read `tests/features/gateway/gateway.tools.api.spec.ts` and update any gateway URL from `/api/gateway/v1` to `/api/gateway/user/test-standalone1/v1` (or whatever account the test uses). This includes both `createOpenAI` baseURL and any raw `fetch()` calls that use the gateway URL directly (e.g., `${baseURL}/api/gateway/v1/chat/completions` → `${baseURL}/api/gateway/user/test-standalone1/v1/chat/completions`).

- [ ] **Step 2: Run test to verify it passes**

Run: `npx playwright test tests/features/gateway/gateway.tools.api.spec.ts`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/features/gateway/gateway.tools.api.spec.ts
git commit -m "fix: update gateway tools test for new URL"
```

---

### Task 6: Update AgentChat component and composables

**Note:** This task must run BEFORE creating the new page files (Task 7), because the pages depend on the new `accountType`/`accountId` props.

**Files:**
- Modify: `ui/src/components/AgentChat.vue`
- Modify: `ui/src/composables/use-agent-chat.ts`
- Modify: `ui/src/composables/use-agent-evaluator.ts`
- Modify: `ui/src/components/UsageCard.vue`

- [ ] **Step 1: Update `use-agent-chat.ts`**

Add `accountType` and `accountId` parameters:

Change the function signature (line 85):
```typescript
export function useAgentChat (accountType: string, accountId: string, traceEnabled = false, systemPrompt?: string, initialMessages?: ChatMessage[]) {
```

Change the provider creation (lines 112-115):
```typescript
const provider = createOpenAI({
  baseURL: `${window.location.origin}${$apiPath}/gateway/${accountType}/${accountId}/v1`,
  apiKey: 'unused'
})
```

- [ ] **Step 2: Update `use-agent-evaluator.ts`**

The `useAgentEvaluator` function (line ~60) currently takes no account params. Add `accountType: string, accountId: string` as the first two parameters. Update the provider creation URL from `${window.location.origin}${$apiPath}/gateway/v1` to `${window.location.origin}${$apiPath}/gateway/${accountType}/${accountId}/v1`. Then find all callers of `useAgentEvaluator()` (search the codebase) and pass the account params.

- [ ] **Step 3: Update `AgentChat.vue`**

Add props (modify `defineProps`, line 412-417):
```typescript
const props = defineProps<{
  debug?: boolean
  title?: string
  systemPrompt?: string
  initialMessages?: ChatMessage[]
  accountType: string
  accountId: string
}>()
```

Update `useAgentChat` call (line 449):
```typescript
const chatResult = useAgentChat(props.accountType, props.accountId, props.debug, finalSystemPrompt.value, props.initialMessages)
```

Update summary `$fetch` call (line 530):
```typescript
const result = await $fetch(`/summary/${props.accountType}/${props.accountId}`, {
  method: 'POST',
  body: { prompt, content }
})
```

- [ ] **Step 4: Update `UsageCard.vue`**

The component at `ui/src/components/UsageCard.vue` (line ~83) uses `session.account.value.type`/`session.account.value.id`. Add props for `accountType` and `accountId` and use them instead:

```typescript
const props = defineProps<{
  accountType: string
  accountId: string
}>()

// Replace session-based URL:
const usageFetch = useFetch<UsageData>(
  () => `${$apiPath}/usage/${props.accountType}/${props.accountId}`
)
```

- [ ] **Step 5: Commit**

```bash
git add ui/src/composables/use-agent-chat.ts ui/src/composables/use-agent-evaluator.ts ui/src/components/AgentChat.vue ui/src/components/UsageCard.vue
git commit -m "feat: pass account params through composables and components"
```

---

### Task 7: Move UI pages to `[type]/[id]/` structure

**Files:**
- Create: `ui/src/pages/[type]/[id]/settings.vue`
- Create: `ui/src/pages/[type]/[id]/chat.vue`
- Delete: `ui/src/pages/settings.vue`
- Delete: `ui/src/pages/chat.vue`
- Modify: `ui/src/pages/index.vue`

- [ ] **Step 1: Create `ui/src/pages/[type]/[id]/chat.vue`**

```vue
<template>
  <div class="chat-page">
    <AgentChat
      :debug="debugEnabled"
      :title="chatTitle"
      :account-type="accountType"
      :account-id="accountId"
    />
  </div>
</template>

<i18n lang="yaml">
fr:
  defaultTitle: Assistant
en:
  defaultTitle: Assistant
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useSession } from '@data-fair/lib-vue/session.js'
import AgentChat from '~/components/AgentChat.vue'

const { t } = useI18n()
const route = useRoute()
const session = useSession()

const accountType = computed(() => route.params.type as string)
const accountId = computed(() => route.params.id as string)

const chatTitle = computed(() => {
  return (route.query.title as string) || t('defaultTitle')
})

const debugEnabled = computed(() => {
  return session.state.user?.adminMode === 1
})
</script>

<style scoped>
.chat-page {
  height: 100vh;
  padding: 0;
  margin: 0;
}
</style>
```

- [ ] **Step 2: Create `ui/src/pages/[type]/[id]/settings.vue`**

Copy from existing `ui/src/pages/settings.vue` but replace `session.account.value.type`/`session.account.value.id` with route params:

```vue
<template>
  <v-container v-if="settingsEditFetch.data.value">
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4">
          {{ t('settings') }}
        </h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <usage-card
          :account-type="accountType"
          :account-id="accountId"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-form v-model="valid">
          <vjsf-put-req
            v-model="settingsEditFetch.data.value"
            :options="vjsfOptions"
            :locale="locale"
          />
        </v-form>
      </v-col>
    </v-row>

    <df-navigation-right>
      <v-list
        v-if="settingsEditFetch.hasDiff.value"
        bg-color="background"
      >
        <v-list-item>
          <v-btn
            width="100%"
            color="accent"
            :disabled="!valid"
            :loading="settingsEditFetch.save.loading.value"
            @click="settingsEditFetch.save.execute()"
          >
            {{ t('save') }}
          </v-btn>
        </v-list-item>
      </v-list>
    </df-navigation-right>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  settings: Paramètres
  save: Enregistrer
  saved: Les modifications ont été enregistrées
en:
  settings: Settings
  save: Save
  saved: Changes have been saved
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'
import { useEditFetch } from '@data-fair/lib-vue/edit-fetch.js'
import type { Settings, ModelInfo } from '#api/types'
import DfNavigationRight from '@data-fair/lib-vuetify/navigation-right.vue'
import type { VjsfOptions } from '@koumoul/vjsf/types.js'
import UsageCard from '~/components/UsageCard.vue'

const { t, locale } = useI18n()
const route = useRoute()
useSessionAuthenticated()

const accountType = computed(() => route.params.type as string)
const accountId = computed(() => route.params.id as string)

const settingsEditFetch = useEditFetch<Settings>(
  () => `${$apiPath}/settings/${accountType.value}/${accountId.value}`,
  {
    saveOptions: {
      success: t('saved')
    }
  }
)

const modelsFetch = useFetch<{ results: ModelInfo[] }>(() => `${$apiPath}/models/${accountType.value}/${accountId.value}`)

watchDeepDiff(() => settingsEditFetch.serverData.value?.providers, () => {
  if (!settingsEditFetch.serverData.value?.providers) return
  modelsFetch.refresh()
})

const valid = ref(true)

const vjsfOptions = computed<Partial<VjsfOptions>>(() => ({
  validateOn: 'input',
  updateOn: 'blur',
  density: 'comfortable',
  readOnlyPropertiesMode: 'hide',
  initialValidation: 'always',
  context: { models: modelsFetch.data.value?.results ?? [] }
}))
</script>
```

- [ ] **Step 3: Delete old page files**

```bash
rm ui/src/pages/settings.vue ui/src/pages/chat.vue
```

- [ ] **Step 4: Update `ui/src/pages/index.vue`**

Update the settings link to include account routing. The home page uses `session.account` for the default target:

```vue
<template>
  <v-app-bar density="comfortable">
    <v-spacer />
    <v-btn
      v-if="session.account.value"
      :to="`/${session.account.value.type}/${session.account.value.id}/settings`"
    >
      settings
    </v-btn>
    <personal-menu dark-mode-switch />
  </v-app-bar>
  <v-container class="fill-height">
    <v-row
      align="center"
      justify="center"
    >
      <v-col
        cols="12"
        sm="8"
        md="6"
      >
        <v-card class="pt-8 pb-4 px-8">
          <v-card-title class="text-h4 text-center mb-4">
            Welcome to @data-fair/agents
          </v-card-title>
          <v-card-text class="text-center text-body-1">
            <p class="mb-4">
              This service provides agentic capabilities for the data-fair stack.
            </p>
            <p class="text-grey">
              Manage AI providers and configure agents using tools that integrate with other data-fair services.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import personalMenu from '@data-fair/lib-vuetify/personal-menu.vue'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'

const session = useSessionAuthenticated()
</script>
```

- [ ] **Step 5: Commit**

```bash
git add ui/src/pages/
git commit -m "feat: move UI pages to [type]/[id]/ route structure"
```

---

### Task 8: Update dev pages for new URL pattern

**Files:**
- Modify: `ui/src/pages/_dev/chat.vue`
- Modify: `ui/src/pages/_dev/chat-iframe-child.vue`
- Modify: `ui/src/pages/_dev/chat-mcp.vue`
- Modify: `ui/src/pages/_dev/chat-vjsf.vue`
- Modify: `ui/src/pages/_dev/chat-subagent.vue`
- Modify: `ui/src/pages/_dev/summary.vue`

- [ ] **Step 1: Update dev pages that use AgentChat**

All dev pages that render `<AgentChat>` need to pass `account-type` and `account-id` props. Use `session.account` for the default values:

```vue
<AgentChat
  :account-type="session.account.value?.type ?? 'user'"
  :account-id="session.account.value?.id ?? ''"
  ...other-props
/>
```

Update each file that uses `<AgentChat>`: `chat.vue`, `chat-iframe-child.vue`, `chat-mcp.vue`, `chat-vjsf.vue`, `chat-subagent.vue`. Import `useSessionAuthenticated` where needed.

- [ ] **Step 2: Update `summary.vue` dev page**

The summary dev page calls `${$apiPath}/summary`. Update to `${$apiPath}/summary/${session.account.value.type}/${session.account.value.id}`.

- [ ] **Step 3: Commit**

```bash
git add ui/src/pages/_dev/
git commit -m "fix: update dev pages for account routing"
```

---

### Task 9: Run full test suite and fix any remaining issues

- [ ] **Step 1: Run all API tests**

Run: `npx playwright test tests/features/`
Expected: All tests PASS.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No new errors (existing v-html warnings are acceptable).

- [ ] **Step 3: Fix any failures**

Address any test or lint failures found.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address test and lint issues from account routing"
```

---

### Task 10: Update E2E tests for new URL structure

**Files:**
- Modify: `tests/features/settings/settings.e2e.spec.ts`
- Modify: `tests/features/summary/summary.e2e.spec.ts`
- Modify: `tests/features/usage/usage.e2e.spec.ts`
- Modify: `tests/features/agents/agents.e2e.spec.ts`

- [ ] **Step 1: Read and update E2E tests**

E2E tests navigate to UI pages. URLs like `/agents/settings` become `/agents/:type/:id/settings` and `/agents/chat` becomes `/agents/:type/:id/chat`. Read each E2E test file and update navigation URLs to include the test account's type and id. In particular, `agents.e2e.spec.ts` navigates to `/agents/chat` which must become `/agents/user/<test-user-id>/chat`.

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test tests/features/ --grep e2e`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/
git commit -m "fix: update E2E tests for account routing URLs"
```
