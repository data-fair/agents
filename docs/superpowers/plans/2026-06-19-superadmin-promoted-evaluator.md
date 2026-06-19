# Superadmin Promoted Evaluator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admin-mode superadmins evaluate any account's traces using a configured "source" account's evaluator, so the reviewed account is never charged.

**Architecture:** One server change grants admin-mode superadmins admin-level access to *any* account's gateway/summary (via the shared `resolveUsageIdentity`). A new `config.evaluatorAccount` designates the source account; the admin `/info` route advertises it and whether it has an evaluator model. The superadmin trace-review UI points the `EvaluatorChat` at that source account (so both the evaluator LLM call and the summarizer tool call consume the source account), falling back to a disabled chat with a hint when unavailable.

**Tech Stack:** Node/Express + TypeScript (ESM, `#`-aliased imports), JSON-schema-generated config/types (`npm run build-types`), Vue 3 + Vuetify UI, Playwright tests (projects: `unit`, `api`, `e2e`), Vercel AI SDK + a `mock` provider in tests.

## Global Constraints

- Privilege gate is **`session.user?.adminMode`** (the toggle), not `isAdmin`. Verbatim everywhere.
- The reviewed account must **never** be used for superadmin evaluation — the evaluator is pointed at `config.evaluatorAccount`.
- Source account is consumed like a normal session: **quotas apply and usage is recorded** on it (no skip-billing branch).
- `config.evaluatorAccount` shape: `{ type: string, id: string } | null`. Default `null`. Env: `EVALUATOR_ACCOUNT_TYPE` + `EVALUATOR_ACCOUNT_ID` (set both or neither).
- Config types are generated: after editing `api/config/type/schema.json` you MUST run `npm run build-types`.
- Run `npm run lint-fix` and `npm run check-types` before each commit in code tasks.
- Run a single spec with `npm run test <path>` (e.g. `npm run test tests/features/gateway/gateway-admin-mode.api.spec.ts`).
- e2e prerequisite: workspace packages built (`cd lib-vuetify && npm run build`; `cd lib-vue && npm run build`).
- Dev/test services are user-managed; never start/stop them. `nodemon` auto-reloads on config/source edits.

---

### Task 1: Server — admin-mode superadmins may consume any account's gateway

**Files:**
- Modify: `api/src/usage/enforce.ts` (authenticated branch of `resolveUsageIdentity`)
- Test: `tests/features/gateway/gateway-admin-mode.api.spec.ts` (create)

**Interfaces:**
- Consumes: existing `resolveUsageIdentity(req, owner, quotas, sessionState, authenticated): Promise<UsageIdentity>`; `UsageIdentity` = `{ trackPerUser, usageUserId?, usageUserName?, role, isUntrusted, poolId? }`; `EffectiveRole` includes `'admin'`.
- Produces: no signature change — only new behavior when `sessionState.user?.adminMode === true`.

- [ ] **Step 1: Write the failing test**

Create `tests/features/gateway/gateway-admin-mode.api.spec.ts`:

```ts
/**
 * Admin-mode superadmins may consume any account's gateway (powers cross-account
 * trace evaluation). Non-admins remain bound by their effective role.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { axiosAuth, superAdmin, clean, directoryUrl, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin                       // superadmin, adminMode: true
const externalUser = await axiosAuth('test1-user1')  // not a member of test-standalone1

const settingsData = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: {
    assistant: {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      inputPricePerMillion: 1,
      outputPricePerMillion: 2
    }
  },
  quotas: defaultQuotas
}

async function gatewayProvider (ax: any, ownerType: string, ownerId: string) {
  const cookie = await ax.cookieJar.getCookieString(directoryUrl)
  return createOpenAI({
    baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/${ownerType}/${ownerId}/v1`,
    apiKey: 'unused',
    headers: { cookie },
    name: 'data-fair-gateway'
  })
}

test.describe('Gateway admin-mode cross-account access', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('admin-mode superadmin consumes a non-member account gateway; usage records on that account', async () => {
    const provider = await gatewayProvider(admin, 'user', 'test-standalone1')
    const result = await generateText({ model: provider.chat('assistant'), messages: [{ role: 'user', content: 'hello' }] })
    assert.equal(result.text, 'world')
    const usage = await admin.get('/api/usage/user/test-standalone1')
    assert.ok(usage.data.monthly.cost > 0, 'usage recorded on the reviewed account owner')
  })

  test('non-admin non-member is rejected (external role, no quota)', async () => {
    const provider = await gatewayProvider(externalUser, 'user', 'test-standalone1')
    await assert.rejects(generateText({ model: provider.chat('assistant'), messages: [{ role: 'user', content: 'hello' }] }))
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test tests/features/gateway/gateway-admin-mode.api.spec.ts`
Expected: the first test FAILS — without the change, the superadmin is treated as `external` on `test-standalone1` (external quota 0 → 403), so `generateText` rejects. (The second test already passes.)

- [ ] **Step 3: Add the admin-mode branch**

In `api/src/usage/enforce.ts`, inside `resolveUsageIdentity`, in the authenticated path, immediately after `const session = sessionState` and before `const isSameAccount = ...`, insert:

```ts
  // Admin-mode superadmins may consume any account's gateway: treat them as an
  // admin of the owner regardless of membership. This powers cross-account trace
  // evaluation — the configured evaluator account is consumed, never the reviewed
  // account. Quotas still apply and usage is still recorded on the owner below.
  if (session.user?.adminMode) {
    const trackPerUser = owner.type === 'organization'
    return {
      trackPerUser,
      usageUserId: trackPerUser ? session.user.id : undefined,
      usageUserName: trackPerUser ? session.user.name : undefined,
      role: 'admin',
      isUntrusted: false
    }
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test tests/features/gateway/gateway-admin-mode.api.spec.ts`
Expected: both tests PASS.

- [ ] **Step 5: Lint, type-check, commit**

```bash
npm run lint-fix && npm run check-types
git add api/src/usage/enforce.ts tests/features/gateway/gateway-admin-mode.api.spec.ts
git commit -m "feat(usage): admin-mode superadmins may consume any account gateway"
```

---

### Task 2: Config `evaluatorAccount` + admin `/info` advertises it

**Files:**
- Modify: `api/config/type/schema.json` (add `evaluatorAccount`)
- Modify: `api/config/default.js` (add `evaluatorAccount: null`)
- Modify: `api/config/custom-environment-variables.js` (env mapping)
- Modify: `api/config/development.js` (point at `user/superadmin` for tests)
- Modify: `api/src/admin/router.ts` (`/info` returns `evaluatorAccount` + `evaluatorAvailable`)
- Test: `tests/features/admin/admin-info.api.spec.ts` (create)

**Interfaces:**
- Consumes: `config` from `#config` (typed `ApiConfig`); `getRawSettings(owner: AccountKeys): Promise<Settings | null>` from `../settings/service.ts`.
- Produces: `GET /api/admin/info` response gains `evaluatorAccount: { type, id } | null` and `evaluatorAvailable: boolean`.

- [ ] **Step 1: Add the config schema property**

In `api/config/type/schema.json`, add to `properties` (do NOT add to `required`):

```json
    "evaluatorAccount": {
      "type": ["object", "null"],
      "default": null,
      "additionalProperties": false,
      "required": ["type", "id"],
      "properties": {
        "type": { "type": "string" },
        "id": { "type": "string" }
      }
    },
```

- [ ] **Step 2: Regenerate config types**

Run: `npm run build-types`
Expected: succeeds; `ApiConfig` now includes `evaluatorAccount`.

- [ ] **Step 3: Wire defaults and env mapping**

In `api/config/default.js`, add a key inside the exported object:

```js
  evaluatorAccount: null,
```

In `api/config/custom-environment-variables.js`, add inside the exported object:

```js
  evaluatorAccount: {
    type: 'EVALUATOR_ACCOUNT_TYPE',
    id: 'EVALUATOR_ACCOUNT_ID'
  },
```

In `api/config/development.js`, add inside the exported object (so api `/info` and the e2e have a configured source account):

```js
  evaluatorAccount: { type: 'user', id: 'superadmin' },
```

- [ ] **Step 4: Write the failing test**

Create `tests/features/admin/admin-info.api.spec.ts`:

```ts
/**
 * Admin /info advertises the configured promoted-evaluator source account and
 * whether it actually has an evaluator model.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, axiosAuth, clean, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin
const plainUser = await axiosAuth('test-standalone1')

test.describe('Admin info — promoted evaluator', () => {
  test.beforeEach(async () => { await clean() })

  test('requires admin mode', async () => {
    await assert.rejects(plainUser.get('/api/admin/info'))
  })

  test('reports evaluatorAccount and evaluatorAvailable=false when the source has no evaluator model', async () => {
    const res = await admin.get('/api/admin/info')
    assert.deepEqual(res.data.evaluatorAccount, { type: 'user', id: 'superadmin' })
    assert.equal(res.data.evaluatorAvailable, false)
  })

  test('evaluatorAvailable=true once the source account has an evaluator model', async () => {
    await admin.put('/api/settings/user/superadmin', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: { evaluator: { model: { id: 'mock-evaluator', name: 'Mock Evaluator', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } } },
      quotas: defaultQuotas
    })
    const res = await admin.get('/api/admin/info')
    assert.equal(res.data.evaluatorAvailable, true)
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm run test tests/features/admin/admin-info.api.spec.ts`
Expected: the two `evaluatorAccount`/`evaluatorAvailable` assertions FAIL (`/info` does not return those fields yet). The "requires admin mode" test passes.

- [ ] **Step 6: Implement the `/info` fields**

In `api/src/admin/router.ts`, add imports near the top:

```ts
import config from '#config'
import { getRawSettings } from '../settings/service.ts'
```

Replace the existing `/info` handler with an async one that appends the new fields:

```ts
router.get('/info', async (req, res) => {
  const evaluatorAccount = config.evaluatorAccount ?? null
  let evaluatorAvailable = false
  if (evaluatorAccount) {
    const settings = await getRawSettings(evaluatorAccount)
    evaluatorAvailable = !!settings?.models?.evaluator?.model
  }
  res.send({ ...info, evaluatorAccount, evaluatorAvailable })
})
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm run test tests/features/admin/admin-info.api.spec.ts`
Expected: all three tests PASS.

- [ ] **Step 8: Lint, type-check, commit**

```bash
npm run lint-fix && npm run check-types
git add api/config tests/features/admin/admin-info.api.spec.ts api/src/admin/router.ts
git commit -m "feat(config): evaluatorAccount + admin /info advertises promoted evaluator"
```

---

### Task 3: UI — superadmin trace review uses the promoted evaluator

**Files:**
- Modify: `ui/src/components/TraceReview.vue` (new `promotedEvaluator` prop, account selection, enable/hint)
- Modify: `ui/src/pages/admin/[type]/[id]/traces/[convId].vue` (fetch admin `/info`, pass prop)
- Modify: `docs/architecture/tracing.md` (note the promoted evaluator)
- Test: `tests/features/trace-review/promoted-evaluator.e2e.spec.ts` (create)

**Interfaces:**
- Consumes: `GET /api/admin/info` → `{ evaluatorAccount, evaluatorAvailable }` (from Task 2); `EvaluatorChat` props `accountType` / `accountId`; `useSession().state.user?.adminMode`.
- Produces: `TraceReview` prop `promotedEvaluator?: { account: { type: string, id: string } | null, available: boolean }`. When omitted → today's behavior (evaluator on the reviewed `owner`). When provided → superadmin mode.

- [ ] **Step 1: Add the prop, session, and computeds to TraceReview**

In `ui/src/components/TraceReview.vue` `<script setup>`, add the session import after the existing imports (e.g. after the `TraceComparePicker` import):

```ts
import { useSession } from '@data-fair/lib-vue/session.js'
```

Change the props declaration:

```ts
const props = defineProps<{
  conversationId: string
  promotedEvaluator?: { account: { type: string, id: string } | null, available: boolean }
}>()
```

Add, after `const session = ...` is created (create it if absent, right after `const router = useRouter()`):

```ts
const session = useSession()

// In superadmin (promoted) mode the evaluator runs against the configured source
// account, never the reviewed owner; account-admins keep using their own account.
const evaluatorOwner = computed(() => props.promotedEvaluator?.account ?? owner.value)
const evaluatorEnabled = computed(() => {
  if (!props.promotedEvaluator) return true
  return props.promotedEvaluator.available && !!session.state.user?.adminMode
})
const evaluatorHint = computed(() => props.promotedEvaluator && !props.promotedEvaluator.available
  ? t('evaluatorNotConfigured')
  : t('enableAdminMode'))
```

- [ ] **Step 2: Update the EvaluatorChat block in the template**

Replace the `<evaluator-chat .../>` element (currently inside the `v-col v-if="!evaluatorCollapsed"`) with:

```vue
          <evaluator-chat
            v-if="evaluatorEnabled && evaluatorOwner"
            :key="recorderB ? 'compare-' + (route.query.compare ?? '') : 'single'"
            :recorder="recorder"
            :recorder-b="recorderB ?? undefined"
            :account-type="evaluatorOwner.type"
            :account-id="evaluatorOwner.id"
          />
          <div
            v-else
            class="pa-4 text-body-2 text-medium-emphasis"
          >
            {{ evaluatorHint }}
          </div>
```

Add the two i18n keys under both `fr:` and `en:` blocks:

```yaml
# fr
  evaluatorNotConfigured: "Aucun compte évaluateur n'est configuré sur cette instance (config.evaluatorAccount avec un modèle évaluateur)."
  enableAdminMode: "Activez le mode administrateur pour analyser les traces."
# en
  evaluatorNotConfigured: "No evaluator account is configured on this instance (config.evaluatorAccount with an evaluator model)."
  enableAdminMode: "Enable admin mode to review traces."
```

- [ ] **Step 3: Fetch admin /info and pass the prop in the superadmin page**

In `ui/src/pages/admin/[type]/[id]/traces/[convId].vue`:

Add to the `<script setup>` after `const conversationId = ...`. Use `onMounted` (NOT a top-level `await`, which would make setup async and require a `<Suspense>` wrapper that this route does not have):

```ts
import { ref, onMounted } from 'vue'
import { $fetch } from '~/context'

const promotedEvaluator = ref<{ account: { type: string, id: string } | null, available: boolean }>({ account: null, available: false })
onMounted(async () => {
  try {
    const info = await $fetch('/admin/info') as { evaluatorAccount: { type: string, id: string } | null, evaluatorAvailable: boolean }
    promotedEvaluator.value = { account: info.evaluatorAccount, available: !!info.evaluatorAvailable }
  } catch {
    promotedEvaluator.value = { account: null, available: false }
  }
})
```

The ref is reactive, so `TraceReview` updates once `/info` resolves.

Update the template:

```vue
  <trace-review
    v-if="session.state.user?.isAdmin"
    :conversation-id="conversationId"
    :promoted-evaluator="promotedEvaluator"
    @loaded="onLoaded"
  />
```

(Leave the non-admin page `ui/src/pages/[type]/[id]/traces/[convId].vue` untouched — it passes no `promoted-evaluator`, so the evaluator stays on the reviewed owner.)

- [ ] **Step 4: Build workspace packages (needed for e2e)**

```bash
cd lib-vuetify && npm run build && cd ..
cd lib-vue && npm run build && cd ..
```
Expected: both produce their `.js` outputs.

- [ ] **Step 5: Write the failing e2e test**

Create `tests/features/trace-review/promoted-evaluator.e2e.spec.ts`:

```ts
/**
 * Superadmin reviews another account's trace; the evaluator runs against the
 * configured source account (config.evaluatorAccount = user/superadmin in dev),
 * not the reviewed account.
 *
 * Mirrors trace-review.e2e.spec.ts for seeding a stored trace.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

const reviewedSettings = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: {
    assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } }
  },
  quotas: defaultQuotas,
  storeTraces: true
}

// Source account (config.evaluatorAccount) — gives the promoted evaluator a model.
const sourceSettings = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: {
    evaluator: { model: { id: 'mock-evaluator', name: 'Mock Evaluator', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } }
  },
  quotas: defaultQuotas
}

test.describe('Promoted evaluator (superadmin review)', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', reviewedSettings)
    await admin.put('/api/settings/user/superadmin', sourceSettings)
  })

  test('evaluator runs against the source account, not the reviewed account', async ({ page, context, goToWithAuth }) => {
    // Seed a stored trace on the reviewed account (consent cookie → x-trace-consent: yes).
    await context.addCookies([{ name: 'agent-chat-trace-consent', value: 'yes', domain: 'localhost', path: '/' }])
    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')
    await page.getByRole('textbox').fill('hello')
    await page.getByRole('textbox').press('Enter')
    await expect(page.getByText('world')).toBeVisible()

    // Find the stored conversation id.
    let convId = ''
    await expect.poll(async () => {
      const res = await admin.get('/api/traces/user/test-standalone1')
      convId = res.data.results?.[0]?.conversationId ?? ''
      return convId
    }).not.toEqual('')

    // Review it as the superadmin (admin mode), via the admin route.
    await goToWithAuth(`/agents/admin/user/test-standalone1/traces/${convId}`, 'superadmin', { adminMode: true })

    // The evaluator's gateway call must target the SOURCE account, not the reviewed one.
    const reqPromise = page.waitForRequest(r => r.url().includes('/api/gateway/user/superadmin/'))
    await page.getByRole('textbox').fill('call tool getTraceOverview')
    await page.getByRole('textbox').press('Enter')
    const req = await reqPromise
    expect(req.url()).not.toContain('/api/gateway/user/test-standalone1/')
    await expect(page.getByText('getTraceOverview')).toBeVisible()
  })
})
```

- [ ] **Step 6: Run the e2e test to verify it fails**

Run: `npm run test tests/features/trace-review/promoted-evaluator.e2e.spec.ts`
Expected: FAILS at the `waitForRequest('/api/gateway/user/superadmin/')` — before the UI change the evaluator calls `/api/gateway/user/test-standalone1/`.

- [ ] **Step 7: Confirm it passes after the UI change**

(The UI change from Steps 1–3 makes it pass.) Re-run:
Run: `npm run test tests/features/trace-review/promoted-evaluator.e2e.spec.ts`
Expected: PASS. If "element(s) not found", re-check the workspace builds from Step 4.

- [ ] **Step 8: Document the behavior**

In `docs/architecture/tracing.md`, under the "Trace review page" bullet in the **Viewing** section, append a sentence:

```md
  In the superadmin (`admin/`) variant the evaluator (and its summarizer tool) run
  against the account configured by `config.evaluatorAccount` — advertised via the
  admin `/info` route (`evaluatorAccount` / `evaluatorAvailable`) — so reviewing a
  trace never consumes the reviewed account; the chat is disabled with a hint when
  that source account is unset, lacks an evaluator model, or admin mode is off.
```

- [ ] **Step 9: Lint, type-check, commit**

```bash
npm run lint-fix && npm run check-types
git add ui/src/components/TraceReview.vue "ui/src/pages/admin/[type]/[id]/traces/[convId].vue" docs/architecture/tracing.md tests/features/trace-review/promoted-evaluator.e2e.spec.ts
git commit -m "feat(traces): superadmin trace review uses the promoted evaluator account"
```

---

### Task 4: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all projects (`unit`, `api`, `e2e`) PASS.

- [ ] **Step 2: Lint + type-check**

Run: `npm run lint-fix && npm run check-types`
Expected: no errors (the pre-existing `v-html` warning in `MarkdownContent.vue` is acceptable).

- [ ] **Step 3: Docker build**

Run: `docker build -t agents .`
Expected: build succeeds.
