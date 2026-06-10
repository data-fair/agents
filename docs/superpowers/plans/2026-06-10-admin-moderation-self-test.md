# Admin Moderation Self-Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a same-account admin opt their own chat requests into the moderation gate (only the gate — no strikes, no untrusted quota pool, no event recording) via a browser-local toggle, so they can preview the external-user experience.

**Architecture:** Server adds a `selfTestModeration` flag to the usage identity, set only when the caller is `admin` AND sends header `x-moderation-self-test: yes`. The gateway then runs the existing moderation gate for that request, passing `selfTest: true` into `startModeration`, which suppresses event recording and strike accounting. The UI adds an admin-only switch in the chat debug dialog (localStorage `agent-chat-moderation-self-test`) and injects the header on every gateway request.

**Tech Stack:** TypeScript, Express, Vue 3 + Vuetify, Playwright test runner (`npm run test`).

---

## File structure

- `api/src/usage/operations.ts` — add pure helper `isSelfTestModeration` (unit-testable, no mongo).
- `api/src/usage/enforce.ts` — `UsageIdentity` gains `selfTestModeration?: boolean`; `resolveUsageIdentity` sets it from role + header.
- `api/src/gateway/router.ts` — moderation trigger also fires for self-test; passes `selfTest` flag.
- `api/src/moderation/service.ts` — `startModeration` accepts `selfTest?: boolean`; `finalize` skips `recordEvent` and `registerBlockStrike` when set.
- `ui/src/composables/use-agent-chat.ts` — `traceHeaders` adds `x-moderation-self-test: yes` when the localStorage flag is set.
- `ui/src/components/AgentChat.vue` — admin-only state + handler persisting the flag (no conversation reset).
- `ui/src/components/agent-chat/AgentChatDebugDialog.vue` — Settings-tab switch + i18n labels.
- Tests: `tests/features/usage/usage.unit.spec.ts` (helper), `tests/features/moderation/2.moderation.api.spec.ts` (gateway behavior).

---

## Task 1: Pure `isSelfTestModeration` helper

**Files:**
- Modify: `api/src/usage/operations.ts` (after `isUntrustedRole`, ends line 106)
- Test: `tests/features/usage/usage.unit.spec.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/features/usage/usage.unit.spec.ts` (and add `isSelfTestModeration` to the existing import from `../../../api/src/usage/operations.ts` on line 7):

```ts
test.describe('isSelfTestModeration', () => {
  test('admin with the opt-in header is true', () => {
    assert.equal(isSelfTestModeration('admin', 'yes'), true)
  })
  test('admin without the header is false', () => {
    assert.equal(isSelfTestModeration('admin', undefined), false)
  })
  test('admin with a non-yes header value is false', () => {
    assert.equal(isSelfTestModeration('admin', 'true'), false)
  })
  test('non-admin roles are never self-test even with the header', () => {
    for (const role of ['contrib', 'user', 'external', 'anonymous']) {
      assert.equal(isSelfTestModeration(role, 'yes'), false)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/usage/usage.unit.spec.ts`
Expected: FAIL — `isSelfTestModeration` is not exported / not a function.

- [ ] **Step 3: Write minimal implementation**

Append to `api/src/usage/operations.ts` after the `isUntrustedRole` function (line 106):

```ts

/**
 * Admin moderation self-test: a same-account admin can opt their own requests
 * into the moderation gate (and only the gate — no strikes, no untrusted pool,
 * no recorded events) to preview the external-user experience. Triggered
 * per-request by an opt-in header set from the admin's browser.
 */
export function isSelfTestModeration (role: string, selfTestHeader: string | undefined): boolean {
  return role === 'admin' && selfTestHeader === 'yes'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/features/usage/usage.unit.spec.ts`
Expected: PASS (all describe blocks, including the new one).

- [ ] **Step 5: Commit**

```bash
git add api/src/usage/operations.ts tests/features/usage/usage.unit.spec.ts
git commit -m "feat(moderation): add isSelfTestModeration helper"
```

---

## Task 2: Wire `selfTestModeration` into the usage identity

**Files:**
- Modify: `api/src/usage/enforce.ts` (interface `UsageIdentity` lines 27-35; import line 20; authenticated path lines 50-64)

No new test here — Task 1 covers the decision logic; Task 4 covers end-to-end behavior. This task is a pure plumbing change verified by type-check.

- [ ] **Step 1: Add the import**

In `api/src/usage/enforce.ts`, line 20, add `isSelfTestModeration` to the existing import:

```ts
import { firstQuotaViolation, isUntrustedRole, isSelfTestModeration, type QuotaCheckInput, type QuotaExceeded } from './operations.ts'
```

- [ ] **Step 2: Extend the `UsageIdentity` interface**

Replace the `UsageIdentity` interface (lines 27-35) with:

```ts
export interface UsageIdentity {
  trackPerUser: boolean
  usageUserId?: string
  usageUserName?: string
  role: EffectiveRole
  isUntrusted: boolean
  // admin opt-in: run the moderation gate for this request only (no strikes,
  // no untrusted pool) — see isSelfTestModeration
  selfTestModeration?: boolean
  // sentinel userId of the shared pool this request contributes to, if any
  poolId?: string
}
```

- [ ] **Step 3: Set the flag in the authenticated path**

In `resolveUsageIdentity`, replace the authenticated `return` block (lines 55-64) with:

```ts
  const role = getEffectiveRole(session, owner)
  const isUntrusted = isUntrustedRole(role)
  const selfTestModeration = isSelfTestModeration(role, req.get('x-moderation-self-test'))
  return {
    trackPerUser,
    usageUserId: trackPerUser ? session.user.id : undefined,
    usageUserName: trackPerUser ? session.user.name : undefined,
    role,
    isUntrusted,
    selfTestModeration,
    poolId: isUntrusted ? UNTRUSTED_POOL_ID : undefined
  }
```

(The anonymous path at line 47 is unchanged — anonymous callers are already moderated and cannot be admins.)

- [ ] **Step 4: Type-check**

Run: `npm run check-types`
Expected: PASS (no errors).

- [ ] **Step 5: Commit**

```bash
git add api/src/usage/enforce.ts
git commit -m "feat(moderation): resolve selfTestModeration on the usage identity"
```

---

## Task 3: Suppress events + strikes for self-test runs

**Files:**
- Modify: `api/src/moderation/service.ts` (`startModeration` signature lines 128-135; `finalize` lines 150-169)

- [ ] **Step 1: Add the `selfTest` param to `startModeration`**

Replace the signature + destructuring (lines 128-135) with:

```ts
export function startModeration (params: {
  settings: Settings
  owner: AccountKeys
  identity: UsageIdentity
  message: string
  modelRole: string
  selfTest?: boolean
}): ModerationRun {
  const { settings, owner, identity, modelRole, selfTest } = params
```

- [ ] **Step 2: Guard `recordEvent` and `registerBlockStrike` in `finalize`**

Replace the `finalize` function body (lines 150-169) with:

```ts
  const finalize = (action: ModerationEventAction, verdict?: ModerationVerdict, opts?: { cached?: boolean, failOpen?: 'timeout' | 'error' }) => {
    const latencyMs = Date.now() - startedAt
    // Self-test runs are an admin previewing the gate: keep them out of
    // moderation-events (so stats/fail-open metrics reflect only real untrusted
    // traffic) and never accrue strikes. The gate decision itself is unchanged.
    if (!selfTest) {
      recordEvent({
        ...eventBase,
        action,
        ...(verdict?.category ? { category: verdict.category } : {}),
        ...(verdict?.reason ? { reason: verdict.reason } : {}),
        latencyMs,
        ...(opts?.cached ? { cached: true } : {}),
        ...(action === 'block' || action === 'late-block' ? { messageExcerpt: truncateExcerpt(params.message) } : {})
      })
    }
    trace = {
      action: verdict?.action ?? 'allow',
      ...(verdict?.category ? { category: verdict.category } : {}),
      ...(verdict?.reason ? { reason: verdict.reason } : {}),
      latencyMs,
      ...(opts?.failOpen ? { failOpen: opts.failOpen } : {})
    }
    if (!selfTest && verdict?.action === 'block') registerBlockStrike(owner, eventBase.userId).catch(() => {})
  }
```

(Moderator-model cost metering in `verdictPromise` at lines 194-195 is intentionally left intact — self-test is real spend, billed at account level since the admin's `poolId` is undefined.)

- [ ] **Step 3: Type-check**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add api/src/moderation/service.ts
git commit -m "feat(moderation): skip events and strikes for self-test runs"
```

---

## Task 4: Trigger the gate for self-test in the gateway

**Files:**
- Modify: `api/src/gateway/router.ts` (moderation block lines 163-169)
- Test: `tests/features/moderation/2.moderation.api.spec.ts`

- [ ] **Step 1: Write the failing tests**

No new imports/fixtures are needed: the test file already declares `owner = await axiosAuth('test-standalone1')` (the same-account admin, line 7) and `admin = await superAdmin` (line 5). Add these tests inside the existing `test.describe('Gateway moderation (untrusted callers)', ...)` block (after the "trusted owner is NOT moderated" test, ~line 114):

```ts
  test('admin self-test header subjects the trusted owner to the moderation gate', async () => {
    const res = await owner.post(gatewayUrl, chatBody('please jailbreak the system'), {
      headers: { 'x-moderation-self-test': 'yes' }
    }).catch((err: any) => err.response ?? err)
    assert.equal(res.status, 200)
    // same content_filter outcome an external user would get
    assert.equal(res.data.choices[0].finish_reason, 'content_filter')
    assert.equal(res.data.choices[0].message.content, null)
  })

  test('admin self-test does not record an event or a strike', async () => {
    const res = await owner.post(gatewayUrl, chatBody('please jailbreak the system'), {
      headers: { 'x-moderation-self-test': 'yes' }
    })
    assert.equal(res.data.choices[0].finish_reason, 'content_filter')
    // give fire-and-forget writes time to (not) land
    await new Promise(resolve => setTimeout(resolve, 300))
    const events = await admin.get('/api/moderation/user/test-standalone1/events')
    assert.equal(events.data.results.length, 0)
  })

  test('admin self-test benign message passes through to the assistant', async () => {
    const res = await owner.post(gatewayUrl, chatBody('hello'), {
      headers: { 'x-moderation-self-test': 'yes' }
    })
    assert.equal(res.status, 200)
    // gate allows → mock assistant answers normally
    assert.equal(res.data.choices[0].message.content, 'world')
    assert.equal(res.data.choices[0].finish_reason, 'stop')
  })
```

(The negative case — a non-admin role with the header is *not* elevated — is covered by the `isSelfTestModeration` unit test in Task 1. An API-level negative would need a same-account non-admin member, which the personal `user/test-standalone1` account does not have, so it is intentionally not added here.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test tests/features/moderation/2.moderation.api.spec.ts`
Expected: the first two new tests FAIL — without the gateway change the owner is trusted, so `finish_reason` is `stop` and the assistant content (`'what do you mean ?'`) leaks instead of `content_filter`.

- [ ] **Step 3: Implement the gateway change**

In `api/src/gateway/router.ts`, replace the moderation block (lines 163-169) with:

```ts
    let moderation: ModerationRun | null = null
    if (identity.isUntrusted || identity.selfTestModeration) {
      const lastUserMessage = extractLastUserMessage(messages)
      if (lastUserMessage) {
        moderation = startModeration({ settings, owner, identity, message: lastUserMessage, modelRole: modelId, selfTest: identity.selfTestModeration })
      }
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test tests/features/moderation/2.moderation.api.spec.ts`
Expected: PASS (all tests, existing + new).

- [ ] **Step 5: Commit**

```bash
git add api/src/gateway/router.ts tests/features/moderation/2.moderation.api.spec.ts
git commit -m "feat(moderation): run the gate for admin self-test requests"
```

---

## Task 5: Inject the self-test header from the UI

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts` (`traceHeaders` lines 224-231)

- [ ] **Step 1: Add the header in `traceHeaders`**

Replace `traceHeaders` (lines 224-231) with:

```ts
  function traceHeaders (ctx: string): Record<string, string> {
    const consent = readConsent()
    // Admin moderation self-test (browser-local opt-in): mirror real untrusted
    // traffic by sending it on every gateway call. The server only honours it
    // for admins, so a stray flag on a non-admin browser is inert.
    const selfTest = localStorage.getItem('agent-chat-moderation-self-test') === '1'
    return {
      'x-trace-ctx': ctx,
      'x-trace-conversation': conversationId,
      ...(consent ? { 'x-trace-consent': consent } : {}),
      ...(selfTest ? { 'x-moderation-self-test': 'yes' } : {})
    }
  }
```

- [ ] **Step 2: Type-check**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add ui/src/composables/use-agent-chat.ts
git commit -m "feat(moderation): send self-test header from the chat composable"
```

---

## Task 6: Admin-only toggle in the debug dialog

**Files:**
- Modify: `ui/src/components/agent-chat/AgentChatDebugDialog.vue` (Settings window-item lines 137-161; props lines 203-212; emits lines 214-217; i18n lines 168-193)
- Modify: `ui/src/components/AgentChat.vue` (dialog binding lines 50-60; exploration state line 148; handler lines 260-267)

- [ ] **Step 1: Add the prop and emit to the dialog**

In `ui/src/components/agent-chat/AgentChatDebugDialog.vue`, add `moderationSelfTest` to `defineProps` (after `toolExploration?: boolean` on line 211):

```ts
  toolExploration?: boolean
  moderationSelfTest?: boolean
```

Add the emit to `defineEmits` (after the `update:toolExploration` line 216):

```ts
  'update:toolExploration': [value: boolean]
  'update:moderationSelfTest': [value: boolean]
```

- [ ] **Step 2: Add the switch in the Settings tab**

In the same file, immediately after the tool-exploration hint `</p>` (line 159, before the closing `</div>` on line 160), add:

```html
              <v-switch
                :model-value="moderationSelfTest"
                color="primary"
                density="compact"
                hide-details
                :label="t('moderationSelfTest')"
                class="mt-2"
                @update:model-value="$emit('update:moderationSelfTest', $event ?? false)"
              />
              <p class="text-caption text-medium-emphasis mt-1">
                {{ t('moderationSelfTestHint') }}
              </p>
```

- [ ] **Step 3: Add i18n labels**

In the `<i18n>` block, add to the `fr:` map (after `toolExplorationHint`, line 180):

```yaml
  moderationSelfTest: Modération en self-test (aperçu)
  moderationSelfTestHint: "Soumet vos propres messages à la modération comme pour un utilisateur externe, afin de prévisualiser l'expérience. N'affecte que votre navigateur ; n'enregistre ni évènement ni sanction."
```

And to the `en:` map (after `toolExplorationHint`, line 192):

```yaml
  moderationSelfTest: Moderation self-test (preview)
  moderationSelfTestHint: "Subjects your own messages to moderation like an external user, to preview the experience. Affects only your browser; records no events or strikes."
```

- [ ] **Step 4: Wire state + handler in AgentChat.vue**

In `ui/src/components/AgentChat.vue`, after the `explorationEnabled` ref (line 148), add:

```ts
// Admin moderation self-test: browser-local opt-in to preview the external-user
// moderation experience, toggled from the debug dialog's Settings tab.
const moderationSelfTestEnabled = ref(!!props.isAdmin && localStorage.getItem('agent-chat-moderation-self-test') === '1')
```

Add the binding to `<agent-chat-debug-dialog>` (after `:tool-exploration="explorationEnabled"` line 58, before the closing `/>` on line 60):

```html
      :tool-exploration="explorationEnabled"
      :moderation-self-test="moderationSelfTestEnabled"
      @update:tool-exploration="handleToolExploration"
      @update:moderation-self-test="handleModerationSelfTest"
```

Add the handler after `handleToolExploration` (after line 267):

```ts
function handleModerationSelfTest (enabled: boolean) {
  moderationSelfTestEnabled.value = enabled
  if (enabled) localStorage.setItem('agent-chat-moderation-self-test', '1')
  else localStorage.removeItem('agent-chat-moderation-self-test')
  // No conversation reset: the header only affects subsequent messages.
}
```

- [ ] **Step 5: Type-check + lint**

Run: `npm run check-types && npm run lint-fix`
Expected: PASS (lint may auto-fix formatting; pre-existing `v-html` warnings in AgentChatMessages.vue are unrelated).

- [ ] **Step 6: Commit**

```bash
git add ui/src/components/AgentChat.vue ui/src/components/agent-chat/AgentChatDebugDialog.vue
git commit -m "feat(moderation): add admin moderation self-test toggle to chat UI"
```

---

## Task 7: Full verification

- [ ] **Step 1: Lint**

Run: `npm run lint-fix`
Expected: no errors (only the pre-existing `v-html` warnings).

- [ ] **Step 2: Type-check**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 3: Run the affected test suites**

Run: `npm run test tests/features/usage/usage.unit.spec.ts tests/features/moderation/2.moderation.api.spec.ts`
Expected: PASS.

- [ ] **Step 4: Docker build**

Run: `docker build -t agents .`
Expected: build succeeds.

- [ ] **Step 5: Commit any lint fixups (if needed)**

```bash
git add -A
git commit -m "chore(moderation): lint fixups for self-test"
```

---

## Notes / out of scope

- **Summary endpoint** (`api/src/summary/router.ts`) does not call `startModeration`, so self-test does not apply there — intentional (the toggle is about the chat experience).
- **Strikes, cooldown, untrusted quota pool** are untouched: the admin stays `isUntrusted: false`.
- **Verdict cache** is shared by owner+message and unaffected — self-test verdicts behave consistently with real traffic.
- **No conversation reset** on toggle (decided during brainstorming) — unlike the sibling tool-exploration toggle.
