# Per-org Moderation Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardwired untrusted-only moderation + the per-admin self-test toggle with an org-level setting: a boolean to activate input moderation and a multi-select of impacted user categories.

**Architecture:** A `moderation: { enabled, categories[] }` object is added to the `Settings` JSON schema (persisted like `quotas`). A pure `moderationApplies(settings, role)` helper decides the gate everywhere it was previously decided by `identity.isUntrusted`. The admin self-test (header + localStorage toggle + UI) is removed; the server-side activity-page probe is retained.

**Tech Stack:** TypeScript, Express, JSON-schema-driven types (`npm run build-types`), Vue 3 + Vuetify (vjsf settings form), Playwright tests (unit/api/e2e projects).

---

## Background facts (verified in the codebase)

- `EffectiveRole = 'admin' | 'contrib' | 'user' | 'external' | 'anonymous'` (`api/src/auth.ts:9`).
- Gateway gate today: `if (identity.isUntrusted || identity.selfTestModeration)` (`api/src/gateway/router.ts:164`).
- Strike cooldown short-circuits: `api/src/gateway/router.ts:138`, `api/src/summary/router.ts:73` (both gated on `identity.isUntrusted`).
- `summary/router.ts:81` pins the system prompt on `identity.isUntrusted` — this is a trust boundary, **kept as-is**.
- `runProbe` (`api/src/moderation/service.ts:262`) calls `generateObject` directly; it does NOT use `startModeration` and is independent of self-test.
- The PUT validator `#doc/settings/put-req` is auto-derived from the settings schema (`api/doc/settings/put-req/schema.js`), so adding `moderation` to the schema + `npm run build-types` makes the field accepted automatically.

---

## Task 1: Add the `moderation` setting (schema, types, persistence)

**Files:**
- Modify: `api/types/settings/schema.js` (add `moderation` to top-level `properties`)
- Modify: `api/src/settings/service.ts` (add `defaultModeration`)
- Modify: `api/src/settings/router.ts` (`emptySettings` + PUT persistence)
- Test: `tests/features/moderation/2.moderation.api.spec.ts` (round-trip test)

- [ ] **Step 1: Add the `moderation` schema block**

In `api/types/settings/schema.js`, inside the top-level `properties` object, add a `moderation` property (place it right after the `storeTraces` block for locality):

```js
    moderation: {
      type: 'object',
      title: 'Input moderation',
      'x-i18n-title': { en: 'Input moderation', fr: 'Modération des entrées' },
      layout: { if: 'parent.data.providers?.length' },
      default: { enabled: false, categories: ['anonymous', 'external'] },
      required: ['enabled', 'categories'],
      additionalProperties: false,
      properties: {
        enabled: {
          type: 'boolean',
          title: 'Enable input moderation',
          'x-i18n-title': { en: 'Enable input moderation', fr: 'Activer la modération des entrées' },
          description: 'When enabled, the last user message of each request from a moderated category is classified before the model responds.',
          'x-i18n-description': {
            en: 'When enabled, the last user message of each request from a moderated category is classified before the model responds.',
            fr: 'Si activé, le dernier message utilisateur de chaque requête provenant d\'une catégorie modérée est classé avant la réponse du modèle.'
          },
          default: false
        },
        categories: {
          type: 'array',
          uniqueItems: true,
          default: ['anonymous', 'external'],
          title: 'Moderated user categories',
          'x-i18n-title': { en: 'Moderated user categories', fr: 'Catégories d\'utilisateurs modérées' },
          description: 'User categories whose requests are checked by the gate when moderation is enabled.',
          'x-i18n-description': {
            en: 'User categories whose requests are checked by the gate when moderation is enabled.',
            fr: 'Catégories d\'utilisateurs dont les requêtes sont vérifiées par le filtre lorsque la modération est activée.'
          },
          items: {
            type: 'string',
            oneOf: [
              { const: 'anonymous', title: 'Anonymous', 'x-i18n-title': { en: 'Anonymous', fr: 'Anonyme' } },
              { const: 'external', title: 'External', 'x-i18n-title': { en: 'External', fr: 'Externe' } },
              { const: 'user', title: 'User', 'x-i18n-title': { en: 'User', fr: 'Utilisateur' } },
              { const: 'contrib', title: 'Contributor', 'x-i18n-title': { en: 'Contributor', fr: 'Contributeur' } },
              { const: 'admin', title: 'Admin', 'x-i18n-title': { en: 'Admin', fr: 'Administrateur' } }
            ]
          }
        }
      }
    },
```

- [ ] **Step 2: Regenerate types**

Run: `npm run build-types`
Expected: completes with no error; `api/types/settings/.type/index.d.ts` now contains a `moderation?:` member, and `api/doc/settings/put-req/.type/validate.js` is regenerated.

- [ ] **Step 3: Add `defaultModeration`**

In `api/src/settings/service.ts`, after the `defaultQuotas` export, add:

```ts
export const defaultModeration: NonNullable<Settings['moderation']> = {
  enabled: false,
  categories: ['anonymous', 'external']
}
```

- [ ] **Step 4: Persist `moderation` in the settings router**

In `api/src/settings/router.ts`:

1. Update the import to pull in the new default:

```ts
import { defaultQuotas, defaultModeration } from './service.ts'
```

2. In `emptySettings`, add the field:

```ts
const emptySettings = (owner: AccountKeys): Settings => ({ owner, providers: [], quotas: defaultQuotas, storeTraces: false, moderation: defaultModeration })
```

3. In the PUT handler's `settings` object, add the field next to `storeTraces`:

```ts
    storeTraces: body.storeTraces ?? false,
    moderation: body.moderation ?? defaultModeration
```

- [ ] **Step 5: Write the round-trip API test**

In `tests/features/moderation/2.moderation.api.spec.ts`, add this test inside the existing `test.describe('Moderation admin API', ...)` block (it already has a `beforeEach` that cleans + PUTs `settingsData()`):

```ts
  test('settings round-trip persists the moderation config', async () => {
    await admin.put('/api/settings/user/test-standalone1', settingsData({
      moderation: { enabled: true, categories: ['anonymous', 'external', 'user'] }
    }))
    const res = await admin.get('/api/settings/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.equal(res.data.moderation.enabled, true)
    assert.deepEqual(res.data.moderation.categories, ['anonymous', 'external', 'user'])
  })
```

- [ ] **Step 6: Run the test**

Run: `npm run test tests/features/moderation/2.moderation.api.spec.ts`
Expected: the new round-trip test PASSES. (Other tests in the file may still pass since gating is unchanged and `settingsData()` doesn't yet set `moderation` — gating is still `isUntrusted`.)

- [ ] **Step 7: Commit**

```bash
git add api/types/settings/schema.js api/types/settings/.type api/doc/settings api/src/settings/service.ts api/src/settings/router.ts ui/src/components/vjsf tests/features/moderation/2.moderation.api.spec.ts
git commit -m "feat(moderation): add per-org moderation setting (schema, persistence)"
```

---

## Task 2: Add the `moderationApplies` decision helper

**Files:**
- Modify: `api/src/moderation/operations.ts` (add `moderationApplies`)
- Test: `tests/features/moderation/1.moderation.unit.spec.ts`

- [ ] **Step 1: Write the failing unit test**

In `tests/features/moderation/1.moderation.unit.spec.ts`, add `moderationApplies` to the import from `operations.ts` and append this describe block:

```ts
test.describe('moderationApplies', () => {
  const base = { providers: [], owner: { type: 'user', id: 'x' } } as any

  test('false when moderation is absent or disabled', () => {
    assert.equal(moderationApplies({ ...base }, 'anonymous'), false)
    assert.equal(moderationApplies({ ...base, moderation: { enabled: false, categories: ['anonymous'] } }, 'anonymous'), false)
  })

  test('true only for roles listed in categories when enabled', () => {
    const settings = { ...base, moderation: { enabled: true, categories: ['anonymous', 'external'] } }
    assert.equal(moderationApplies(settings, 'anonymous'), true)
    assert.equal(moderationApplies(settings, 'external'), true)
    assert.equal(moderationApplies(settings, 'user'), false)
    assert.equal(moderationApplies(settings, 'admin'), false)
  })

  test('honours a custom category set', () => {
    const settings = { ...base, moderation: { enabled: true, categories: ['user', 'admin'] } }
    assert.equal(moderationApplies(settings, 'user'), true)
    assert.equal(moderationApplies(settings, 'anonymous'), false)
  })
})
```

The import line at the top of the file becomes:

```ts
import {
  buildModerationSystemPrompt, extractLastUserMessage, truncateForModeration,
  truncateExcerpt, isInCooldown, moderationApplies,
  MODERATION_TASK_MARKER,
  INPUT_HEAD_CHARS, INPUT_TAIL_CHARS, EXCERPT_MAX_CHARS
} from '../../../api/src/moderation/operations.ts'
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test tests/features/moderation/1.moderation.unit.spec.ts`
Expected: FAIL — `moderationApplies is not a function` / import undefined.

- [ ] **Step 3: Implement `moderationApplies`**

In `api/src/moderation/operations.ts`, add an import for the `Settings` type at the top if not present, and the function. At the top of the file:

```ts
import type { Settings } from '#types'
```

Then add (anywhere among the exported functions):

```ts
/**
 * Whether the input-moderation gate applies to a request, given the account
 * settings and the caller's effective role. Pure: drives the gateway and the
 * summary endpoint identically. Off unless the org enabled moderation AND the
 * caller's role is in the configured category list.
 */
export function moderationApplies (settings: Settings, role: string): boolean {
  return !!settings.moderation?.enabled && (settings.moderation.categories ?? []).includes(role)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test tests/features/moderation/1.moderation.unit.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/moderation/operations.ts tests/features/moderation/1.moderation.unit.spec.ts
git commit -m "feat(moderation): add moderationApplies(settings, role) helper"
```

---

## Task 3: Switch gating to the setting and remove the admin self-test (backend)

This task changes the gate decision AND removes the self-test plumbing together, because both touch `gateway/router.ts:164`. Tests are updated first (TDD red), then the implementation.

**Files:**
- Modify (tests, first): `tests/features/moderation/2.moderation.api.spec.ts`
- Modify: `api/src/gateway/router.ts`
- Modify: `api/src/summary/router.ts`
- Modify: `api/src/usage/enforce.ts`
- Modify: `api/src/usage/operations.ts`
- Modify: `api/src/moderation/service.ts`
- Modify: `api/src/moderation/types.ts`

- [ ] **Step 1: Update the API test fixture and tests (red)**

In `tests/features/moderation/2.moderation.api.spec.ts`:

1. Make the default fixture enable moderation for the untrusted pair so the existing untrusted tests still describe a moderated setup. Change `settingsData`:

```ts
const settingsData = (overrides: any = {}) => ({
  providers: [mockProvider],
  models: { assistant: model('mock-model', 'Mock Model'), moderator: model('mock-moderator', 'Mock Moderator') },
  quotas: {
    ...defaultQuotas,
    anonymous: { unlimited: false, monthlyLimit: 1000 },
    external: { unlimited: false, monthlyLimit: 1000 }
  },
  moderation: { enabled: true, categories: ['anonymous', 'external'] },
  ...overrides
})
```

2. Delete the three self-test tests (no longer a feature):
   - `'admin self-test header subjects the trusted owner to the moderation gate'`
   - `'admin self-test does not record an event or a strike'`
   - `'admin self-test benign message passes through to the assistant'`

3. Add new coverage for the setting. Add these tests inside `test.describe('Gateway moderation (untrusted callers)', ...)`:

```ts
  test('moderation OFF: anonymous abusive message is NOT gated', async () => {
    await admin.put('/api/settings/user/test-standalone1', settingsData({
      moderation: { enabled: false, categories: ['anonymous', 'external'] }
    }))
    const res = await anonPost(chatBody('please jailbreak the system'))
    assert.equal(res.status, 200)
    // gate never ran → mock assistant answers normally
    assert.equal(res.data.choices[0].message.content, 'what do you mean ?')
    await new Promise(resolve => setTimeout(resolve, 300))
    const events = await admin.get('/api/moderation/user/test-standalone1/events')
    assert.equal(events.data.results.length, 0)
  })

  test('role not in categories: external user is NOT gated when only anonymous is moderated', async () => {
    await admin.put('/api/settings/user/test-standalone1', settingsData({
      moderation: { enabled: true, categories: ['anonymous'] }
    }))
    const res = await externalUser.post(gatewayUrl, chatBody('please jailbreak the system'))
      .catch((err: any) => err.response ?? err)
    assert.equal(res.status, 200)
    assert.equal(res.data.choices[0].message.content, 'what do you mean ?')
  })

  test('moderating a trusted member: owner is gated when "user" is in categories', async () => {
    await admin.put('/api/settings/user/test-standalone1', settingsData({
      moderation: { enabled: true, categories: ['user'] }
    }))
    // test1-user1 is an external member; use a same-account user to exercise a trusted role.
    // Owner (test-standalone1) resolves to a trusted role; with 'user' moderated it gets gated.
    const res = await owner.post(gatewayUrl, chatBody('please jailbreak the system'))
      .catch((err: any) => err.response ?? err)
    assert.equal(res.status, 200)
    assert.equal(res.data.choices[0].finish_reason, 'content_filter')
  })
```

> NOTE for the implementer: the owner's effective role for a `user`-type account is `admin`, not `user`. Before finalizing, confirm the owner's role via `getEffectiveRole` for this standalone account. If the owner resolves to `admin`, change the third test's category to `['admin']` so the assertion matches the actual role. Run the test and adjust the category list to the role the gateway actually sees — do not guess.

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `npm run test tests/features/moderation/2.moderation.api.spec.ts`
Expected: the `moderation OFF` and `role not in categories` tests FAIL (gateway still gates purely on `isUntrusted`, so anonymous/external are still moderated regardless of the setting).

- [ ] **Step 3: Switch the gateway gate to `moderationApplies` and drop self-test**

In `api/src/gateway/router.ts`:

1. Update the moderation operations import to include the helper:

```ts
import { extractLastUserMessage, moderationApplies } from '../moderation/operations.ts'
```

2. Replace the strike-cooldown short-circuit condition (line ~138):

```ts
    if (moderationApplies(settings, identity.role) && identity.usageUserId && await isStrikeCooldownActive(owner, identity.usageUserId)) {
```

3. Replace the moderation start block (lines ~162-169):

```ts
    // Gateway-side input moderation: applies to the configured user categories
    // when the org enabled it, racing the model call.
    let moderation: ModerationRun | null = null
    if (moderationApplies(settings, identity.role)) {
      const lastUserMessage = extractLastUserMessage(messages)
      if (lastUserMessage) {
        moderation = startModeration({ settings, owner, identity, message: lastUserMessage, modelRole: modelId })
      }
    }
```

- [ ] **Step 4: Switch the summary cooldown gate to `moderationApplies`**

In `api/src/summary/router.ts`:

1. Add the helper to imports (it currently imports only from `service.ts`):

```ts
import { moderationApplies } from '../moderation/operations.ts'
```

2. Replace the cooldown condition (line ~73):

```ts
    if (moderationApplies(settings, identity.role) && identity.usageUserId && await isStrikeCooldownActive(owner, identity.usageUserId)) {
```

Leave line ~81 (`const system = (!identity.isUntrusted && body.prompt) || ...`) unchanged — prompt pinning is a trust boundary, independent of the moderation toggle.

- [ ] **Step 5: Remove the self-test identity plumbing**

In `api/src/usage/enforce.ts`:

1. Drop `isSelfTestModeration` from the operations import (line 20):

```ts
import { firstQuotaViolation, isUntrustedRole, type QuotaCheckInput, type QuotaExceeded } from './operations.ts'
```

2. Remove the `selfTestModeration?: boolean` field and its comment from the `UsageIdentity` interface (lines ~33-35).

3. Remove the computation and the return field (lines ~60, ~67). The authenticated return becomes:

```ts
  const role = getEffectiveRole(session, owner)
  const isUntrusted = isUntrustedRole(role)
  return {
    trackPerUser,
    usageUserId: trackPerUser ? session.user.id : undefined,
    usageUserName: trackPerUser ? session.user.name : undefined,
    role,
    isUntrusted,
    poolId: isUntrusted ? UNTRUSTED_POOL_ID : undefined
  }
```

In `api/src/usage/operations.ts`: delete the entire `isSelfTestModeration` function and its doc comment (lines ~108-116).

- [ ] **Step 6: Remove the `selfTest` param from `startModeration`**

In `api/src/moderation/service.ts`:

1. Remove `selfTest?: boolean` from the `startModeration` params type and the destructure. The signature/destructure become:

```ts
export function startModeration (params: {
  settings: Settings
  owner: AccountKeys
  identity: UsageIdentity
  message: string
  modelRole: string
}): ModerationRun {
  const { settings, owner, identity, modelRole } = params
```

2. In `finalize`, the event recording and strike registration are now unconditional. Replace the `if (!selfTest) { recordEvent(...) }` wrapper so `recordEvent(...)` always runs, and change the strike line:

```ts
    recordEvent({
      ...eventBase,
      action,
      ...(verdict?.category ? { category: verdict.category } : {}),
      ...(verdict?.reason ? { reason: verdict.reason } : {}),
      latencyMs,
      ...(opts?.cached ? { cached: true } : {}),
      ...(action === 'block' || action === 'late-block' ? { messageExcerpt: truncateExcerpt(params.message) } : {})
    })
    trace = {
      action: verdict?.action ?? 'allow',
      ...(verdict?.category ? { category: verdict.category } : {}),
      ...(verdict?.reason ? { reason: verdict.reason } : {}),
      latencyMs,
      ...(opts?.failOpen ? { failOpen: opts.failOpen } : {})
    }
    if (verdict?.action === 'block') registerBlockStrike(owner, eventBase.userId).catch(() => {})
```

(Delete the `// Self-test runs are an admin previewing...` comment block.)

- [ ] **Step 7: Widen the moderation role types**

In `api/src/moderation/types.ts`, import `EffectiveRole` and widen the `role` field:

```ts
import type { EffectiveRole } from '../auth.ts'

export type ModerationEventAction = 'allow' | 'block' | 'late-block' | 'fail-open-timeout' | 'fail-open-error' | 'strike-refusal'

export interface ModerationEvent {
  owner: { type: string, id: string }
  action: ModerationEventAction
  category?: string
  reason?: string
  latencyMs?: number
  cached?: boolean
  role: EffectiveRole
  userId: string
  modelRole: string
  // present only on block / late-block: the review payload
  messageExcerpt?: string
  createdAt: Date // BSON Date — TTL target (30 days)
}
```

In `api/src/moderation/service.ts`, fix the two now-too-narrow casts:

- In `eventBase`: change `role: identity.role as 'anonymous' | 'external'` to `role: identity.role`.
- In `recordStrikeRefusal`: change `role: identity.role as 'anonymous' | 'external'` to `role: identity.role`.

(`identity.role` is already `EffectiveRole`, so the casts can be dropped entirely.)

- [ ] **Step 8: Run the moderation API + unit tests**

Run: `npm run test tests/features/moderation/2.moderation.api.spec.ts tests/features/moderation/1.moderation.unit.spec.ts`
Expected: all PASS, including the new `moderation OFF`, `role not in categories`, and trusted-member tests. If the trusted-member test fails on role mismatch, adjust its `categories` per the Step 1 NOTE.

- [ ] **Step 9: Type-check**

Run: `npm run check-types`
Expected: no errors (confirms no dangling `selfTestModeration` / `isSelfTestModeration` references and the widened types line up).

- [ ] **Step 10: Commit**

```bash
git add api/src/gateway/router.ts api/src/summary/router.ts api/src/usage/enforce.ts api/src/usage/operations.ts api/src/moderation/service.ts api/src/moderation/types.ts tests/features/moderation/2.moderation.api.spec.ts
git commit -m "feat(moderation): gate on the org setting; remove admin self-test (backend)"
```

---

## Task 4: Remove the admin self-test from the UI

**Files:**
- Modify: `ui/src/components/AgentChat.vue`
- Modify: `ui/src/components/agent-chat/AgentChatDebugDialog.vue`
- Modify: `ui/src/composables/use-agent-chat.ts`
- Test: `tests/features/moderation/3.moderation.e2e.spec.ts` (fixture only)

- [ ] **Step 1: Remove the self-test header in the composable**

In `ui/src/composables/use-agent-chat.ts`, replace the `traceHeaders` function (lines ~226-238) with the self-test removed:

```ts
  function traceHeaders (ctx: string): Record<string, string> {
    const consent = readConsent()
    return {
      'x-trace-ctx': ctx,
      'x-trace-conversation': conversationId.value,
      ...(consent ? { 'x-trace-consent': consent } : {})
    }
  }
```

- [ ] **Step 2: Remove the self-test wiring in `AgentChat.vue`**

In `ui/src/components/AgentChat.vue`:

1. Remove the two props/listeners on `<agent-chat-debug-dialog>` (lines ~59, ~61): delete the `:moderation-self-test="moderationSelfTestEnabled"` line and the `@update:moderation-self-test="handleModerationSelfTest"` line.

2. Remove the ref + comment (lines ~152-154):

```ts
// (delete these three lines)
// Admin moderation self-test: browser-local opt-in to preview the external-user
// moderation experience, toggled from the debug dialog's Settings tab.
const moderationSelfTestEnabled = ref(!!props.isAdmin && localStorage.getItem('agent-chat-moderation-self-test') === '1')
```

3. Remove the handler (lines ~275-280):

```ts
// (delete the whole function)
function handleModerationSelfTest (enabled: boolean) {
  moderationSelfTestEnabled.value = enabled
  if (enabled) localStorage.setItem('agent-chat-moderation-self-test', '1')
  else localStorage.removeItem('agent-chat-moderation-self-test')
  // No conversation reset: the header only affects subsequent messages.
}
```

- [ ] **Step 3: Remove the self-test toggle in the debug dialog**

In `ui/src/components/agent-chat/AgentChatDebugDialog.vue`:

1. Delete the second `<v-switch>` + its hint `<p>` (lines ~160-171, the block bound to `moderationSelfTest` / emitting `update:moderationSelfTest`).

2. Delete the i18n keys `moderationSelfTest` and `moderationSelfTestHint` from both the `fr:` and `en:` blocks.

3. Remove `moderationSelfTest?: boolean` from `defineProps` (line ~228).

4. Remove `'update:moderationSelfTest': [value: boolean]` from `defineEmits` (line ~234).

- [ ] **Step 4: Update the e2e fixture to enable moderation**

In `tests/features/moderation/3.moderation.e2e.spec.ts`, add `moderation` to the `settingsData` object (after `quotas`):

```ts
  quotas: { ...defaultQuotas, external: { unlimited: false, monthlyLimit: 1000 } },
  moderation: { enabled: true, categories: ['anonymous', 'external'] }
```

- [ ] **Step 5: Build the UI workspace packages (required before e2e)**

Run:
```bash
cd lib-vuetify && npm run build && cd ..
cd lib-vue && npm run build && cd ..
```
Expected: both builds succeed (produce `.js` outputs).

- [ ] **Step 6: Lint + type-check the UI**

Run: `npm run lint-fix && npm run check-types`
Expected: no errors; no remaining references to `moderationSelfTest` / `agent-chat-moderation-self-test`.

Verify with:
```bash
grep -rn "moderation-self-test\|moderationSelfTest\|selfTestModeration\|isSelfTestModeration" api/src ui/src tests
```
Expected: no matches.

- [ ] **Step 7: Run the moderation e2e tests**

Run: `npm run test tests/features/moderation/3.moderation.e2e.spec.ts`
Expected: PASS (external user gated, owner not gated, admin activity page + probe intact).

- [ ] **Step 8: Commit**

```bash
git add ui/src/components/AgentChat.vue ui/src/components/agent-chat/AgentChatDebugDialog.vue ui/src/composables/use-agent-chat.ts tests/features/moderation/3.moderation.e2e.spec.ts
git commit -m "feat(moderation): remove admin self-test toggle from the UI"
```

---

## Task 5: Update the architecture doc

**Files:**
- Modify: `docs/architecture/moderation.md`

- [ ] **Step 1: Rewrite the activation + self-test paragraphs**

In `docs/architecture/moderation.md`:

1. In the opening paragraph (line 3), replace the "Trusted callers ... are never checked" framing with the configurable model. Suggested text:

> A gateway-enforced, per-message guard protects the platform from abuse — profanity, prompt-injection attempts, persona override, and heavy off-platform tasks. Moderation is **opt-in per organization**: an admin enables it and chooses which user categories it applies to (any of `anonymous`, `external`, `user`, `contrib`, `admin`). It is off by default; categories not selected are never checked (zero cost, zero latency for them).

2. Update the "Enforced in the gateway" paragraph (line 29): replace "Every completions call whose effective role is `anonymous` or `external` ... is checked" with "Every completions call whose effective role is in the account's configured moderation categories is checked (`moderationApplies` in `operations.ts`)".

3. Delete the **Self-test** paragraph (lines ~37). Replace the probe sentence so it no longer depends on the self-test header. Suggested:

> **Probe.** The admin activity page can run a live 3-message test against the moderator config via `POST /api/moderation/:type/:id/probe` (`runProbe`); it calls the moderator directly, is metered at account level, and writes no events (so stats reflect only real traffic).

4. In the **Key files** list, add `api/src/moderation/operations.ts` already lists the prompt etc.; add a note that `moderationApplies` lives there, and that the setting is defined in `api/types/settings/schema.js`.

- [ ] **Step 2: Commit**

```bash
git add docs/architecture/moderation.md
git commit -m "docs(moderation): document per-org activation and category selection"
```

---

## Task 6: Full quality gate

**Files:** none (verification only)

- [ ] **Step 1: Lint**

Run: `npm run lint-fix`
Expected: exits clean (pre-existing `v-html` warnings in `AgentChatMessages.vue` are acceptable; no errors).

- [ ] **Step 2: Type-check**

Run: `npm run check-types`
Expected: no errors.

- [ ] **Step 3: Run the full moderation + settings suites**

Run: `npm run test tests/features/moderation tests/features/settings`
Expected: all PASS.

- [ ] **Step 4: Docker build**

Run: `docker build -t agents .`
Expected: build succeeds.

- [ ] **Step 5: Final grep sanity check**

Run:
```bash
grep -rn "selfTest\|self-test\|x-moderation-self-test" api/src ui/src tests docs
```
Expected: no matches (all self-test traces removed).

- [ ] **Step 6: Commit any lint-fix changes**

```bash
git add -A
git commit -m "chore(moderation): final lint/type pass" || echo "nothing to commit"
```

---

## Self-review notes

- **Spec coverage:** schema (T1), persistence (T1), helper (T2), gateway+summary wiring (T3), self-test removal backend (T3) + UI (T4), role-type widening (T3), tests (T1/T2/T3/T4), docs (T5). All spec sections mapped.
- **Type consistency:** `moderationApplies(settings, role)` signature is identical in T2 (definition), T3 (gateway, summary). `defaultModeration` defined in T1 and consumed only in T1. `ModerationEvent.role: EffectiveRole` (T3) matches the dropped casts in `service.ts` (T3).
- **Ambiguity resolved inline:** the trusted-member test (T3 Step 1) carries an explicit NOTE to verify the owner's effective role rather than guess, since a `user`-type account owner resolves to `admin`.
- **Default category selection:** `['anonymous', 'external']` everywhere a default is needed (schema, `defaultModeration`).
