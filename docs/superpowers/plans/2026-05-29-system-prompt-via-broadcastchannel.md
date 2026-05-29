# System Prompt via BroadcastChannel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transmit the agent chat `systemPrompt` from the host (drawer/menu) to the chat iframe over the existing same-origin `BroadcastChannel` (+ `sessionStorage` fallback) instead of a URL query param, removing the ~2 KB query-param size ceiling while keeping the query-param path working for backward compatibility.

**Architecture:** Mirror the action-button flow (`DfAgentChatAction` → `AgentChat`). A new shared helper `useSystemPromptChannel` in `lib-vuetify/useAgentChatBase.ts` posts `agent-set-system-prompt` on the tab channel and writes a `sessionStorage` key whenever the host's `systemPrompt` prop is set; the iframe (`AgentChat.vue`) seeds an override ref from that `sessionStorage` key and updates it on channel messages. `resolveAgentChatUrl` stops emitting `systemPrompt` in the URL. The iframe still reads `?systemPrompt=` via the page, so legacy/direct-URL embeds keep working.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, `@data-fair/lib-vue-agents` (`getTabChannelId`), `@data-fair/frame` (`d-frame`), Playwright e2e. Workspace package `@data-fair/lib-vuetify-agents` (dir `lib-vuetify/`) must be rebuilt after edits.

**Key references (read before starting):**
- Spec: `docs/superpowers/specs/2026-05-29-system-prompt-via-broadcastchannel-design.md`
- Action-button precedent (parent side): `lib-vuetify/DfAgentChatAction.vue:63-74`
- Action-button precedent (iframe side): `ui/src/components/AgentChat.vue:262-296`
- Same-origin `sessionStorage` top↔iframe sharing is already relied on: `tests/features/trace-debug/*.e2e.spec.ts` (sets `agent-chat-trace` on the page, read by the iframe).

---

## File Structure

- `lib-vuetify/types.ts` — add `AgentSetSystemPrompt` message type, extend `AgentActionMessage` union.
- `lib-vuetify/useAgentChatBase.ts` — add `useSystemPromptChannel` helper; drop `systemPrompt` from `resolveAgentChatUrl`.
- `lib-vuetify/DfAgentChatDrawer.vue` — call the helper.
- `lib-vuetify/DfAgentChatMenu.vue` — call the helper.
- `ui/src/components/AgentChat.vue` — override ref seeded from `sessionStorage`, updated on channel message; used in `finalSystemPrompt`.
- `ui/src/pages/_dev/chat-drawer.vue` — forward a `systemPrompt` query param to the drawer (test harness only).
- `tests/features/chat-system-prompt/chat-system-prompt.e2e.spec.ts` — new e2e spec (create dir + file).

**Note on the `sessionStorage` key:** the string `'df-agent-system-prompt'` is hardcoded in both `lib-vuetify` (sender) and `ui` (reader). These are separate packages with no shared module, exactly like the existing `'df-agent-pending-action'` key. Keep the literal identical in both places.

---

### Task 1: Add the `AgentSetSystemPrompt` message type

**Files:**
- Modify: `lib-vuetify/types.ts:32-56`

- [ ] **Step 1: Add the interface after `AgentActionSessionCleared`**

In `lib-vuetify/types.ts`, after the `AgentActionSessionCleared` interface (currently ending at line 36, before `AgentChatReady`), insert:

```ts
/** BroadcastChannel message sent by drawer/menu to set the iframe's system prompt */
export interface AgentSetSystemPrompt {
  channel: string
  type: 'agent-set-system-prompt'
  systemPrompt: string
}
```

- [ ] **Step 2: Add it to the `AgentActionMessage` union**

Change the final union line (currently line 56):

```ts
export type AgentActionMessage = AgentActionStartSession | AgentActionSessionCleared | AgentChatReady | AgentChatPing | AgentChatPong
```

to:

```ts
export type AgentActionMessage = AgentActionStartSession | AgentActionSessionCleared | AgentChatReady | AgentChatPing | AgentChatPong | AgentSetSystemPrompt
```

- [ ] **Step 3: Commit**

```bash
git add lib-vuetify/types.ts
git commit -m "feat(chat): add agent-set-system-prompt message type"
```

---

### Task 2: Add the `useSystemPromptChannel` helper and drop systemPrompt from the URL

**Files:**
- Modify: `lib-vuetify/useAgentChatBase.ts:1-5` (imports), `:102-119` (`resolveAgentChatUrl`), end of file (new helper)

- [ ] **Step 1: Extend the vue import and the types import**

Change line 1:

```ts
import { ref, computed, watch, type Ref } from 'vue'
```

to:

```ts
import { ref, computed, watch, onScopeDispose, type Ref } from 'vue'
```

Change line 5:

```ts
import type { AgentStatus, AgentChatMessage, AgentChatPong } from './types.js'
```

to:

```ts
import type { AgentStatus, AgentChatMessage, AgentChatPong, AgentSetSystemPrompt } from './types.js'
```

(`getTabChannelId` is already imported on line 4 — do not re-import it.)

- [ ] **Step 2: Drop `systemPrompt` from `resolveAgentChatUrl`**

In `resolveAgentChatUrl` (lines 102-119), remove the systemPrompt line. The block currently reads:

```ts
    const params = new URLSearchParams()
    if (props.chatTitle) params.set('title', props.chatTitle)
    if (props.systemPrompt) params.set('systemPrompt', props.systemPrompt)
    const qs = params.toString()
```

Change it to:

```ts
    const params = new URLSearchParams()
    if (props.chatTitle) params.set('title', props.chatTitle)
    const qs = params.toString()
```

Leave the `systemPrompt?: string` field in the `props` type of `resolveAgentChatUrl` as-is (callers still pass it; it is simply no longer encoded into the URL).

- [ ] **Step 3: Append the helper at the end of the file**

Add at the end of `lib-vuetify/useAgentChatBase.ts`:

```ts
const SYSTEM_PROMPT_STORAGE_KEY = 'df-agent-system-prompt'

/**
 * Transmit a system prompt to the chat iframe over the same-origin tab channel,
 * mirroring the action-button flow. Writes a sessionStorage fallback so an iframe
 * that has not loaded yet picks it up on mount. Call from a component setup.
 */
export function useSystemPromptChannel (getSystemPrompt: () => string | undefined): void {
  const channelId = getTabChannelId()
  const bc = new BroadcastChannel(channelId)
  watch(getSystemPrompt, (systemPrompt) => {
    if (systemPrompt) {
      sessionStorage.setItem(SYSTEM_PROMPT_STORAGE_KEY, systemPrompt)
      bc.postMessage({ channel: channelId, type: 'agent-set-system-prompt', systemPrompt } satisfies AgentSetSystemPrompt)
    } else {
      sessionStorage.removeItem(SYSTEM_PROMPT_STORAGE_KEY)
    }
  }, { immediate: true })
  onScopeDispose(() => { bc.close() })
}
```

- [ ] **Step 4: Commit**

```bash
git add lib-vuetify/useAgentChatBase.ts
git commit -m "feat(chat): add useSystemPromptChannel helper, stop encoding systemPrompt in URL"
```

---

### Task 3: Wire the helper into the drawer and menu components

**Files:**
- Modify: `lib-vuetify/DfAgentChatDrawer.vue:21-43`
- Modify: `lib-vuetify/DfAgentChatMenu.vue:62-106`

- [ ] **Step 1: Drawer — import and call the helper**

In `lib-vuetify/DfAgentChatDrawer.vue`, change the import line (line 26):

```ts
import { resolveAgentChatUrl } from './useAgentChatBase.js'
```

to:

```ts
import { resolveAgentChatUrl, useSystemPromptChannel } from './useAgentChatBase.js'
```

Then, immediately after the existing `const resolvedSrc = computed(() => resolveAgentChatUrl(props))` line (line 43), add:

```ts
useSystemPromptChannel(() => props.systemPrompt)
```

- [ ] **Step 2: Menu — import and call the helper**

In `lib-vuetify/DfAgentChatMenu.vue`, change the import line (line 72):

```ts
import { resolveAgentChatUrl } from './useAgentChatBase.js'
```

to:

```ts
import { resolveAgentChatUrl, useSystemPromptChannel } from './useAgentChatBase.js'
```

Then, immediately after `const resolvedSrc = computed(() => resolveAgentChatUrl(props))` (line 106), add:

```ts
useSystemPromptChannel(() => props.systemPrompt)
```

- [ ] **Step 3: Build the workspace package**

The compiled output of `lib-vuetify` is gitignored and consumed by the UI dev server, so it must be rebuilt after every edit to `lib-vuetify`.

Run: `cd lib-vuetify && npm run build`
Expected: build completes with no errors. (If `lib-vue` is not yet built, also run `cd lib-vue && npm run build` once — see AGENTS.md.)

- [ ] **Step 4: Type-check**

Run: `npm run check-types`
Expected: PASS (no new errors). 

- [ ] **Step 5: Commit**

```bash
git add lib-vuetify/DfAgentChatDrawer.vue lib-vuetify/DfAgentChatMenu.vue
git commit -m "feat(chat): send systemPrompt over channel from drawer and menu"
```

---

### Task 4: Apply the channel/sessionStorage system prompt inside the iframe

**Files:**
- Modify: `ui/src/components/AgentChat.vue:113-143` (override ref + `finalSystemPrompt`), `:265-279` (channel handler)

- [ ] **Step 1: Declare the override ref seeded from sessionStorage**

In `ui/src/components/AgentChat.vue`, immediately after the `const props = defineProps<{ ... }>()` block (closing on line 113), add:

```ts
// System prompt received from the host over the tab channel (see DfAgentChatDrawer).
// Seeded from sessionStorage so a prompt set before this iframe loaded is applied on mount.
// Overrides the query-param-sourced props.systemPrompt when present.
const channelSystemPrompt = ref<string | undefined>(sessionStorage.getItem('df-agent-system-prompt') || undefined)
```

- [ ] **Step 2: Use the override in `finalSystemPrompt`**

In the `finalSystemPrompt` computed, change the first array entry (line 133):

```ts
    props.systemPrompt || t('systemPromptBase'),
```

to:

```ts
    (channelSystemPrompt.value ?? props.systemPrompt) || t('systemPromptBase'),
```

- [ ] **Step 3: Handle the channel message**

In the existing `actionChannel.onmessage` handler (lines 265-279), the body currently ends with the `agent-session-cleared` branch:

```ts
  } else if (data.type === 'agent-session-cleared') {
    handleSessionCleared()
  }
}
```

Change it to add a branch before the closing brace:

```ts
  } else if (data.type === 'agent-session-cleared') {
    handleSessionCleared()
  } else if (data.type === 'agent-set-system-prompt') {
    channelSystemPrompt.value = data.systemPrompt
  }
}
```

(The existing `watch(finalSystemPrompt, ...)` at line 167 propagates the change to the live chat session via `chat.setSystemPrompt`. No further wiring is needed.)

- [ ] **Step 4: Type-check**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ui/src/components/AgentChat.vue
git commit -m "feat(chat): apply system prompt received over channel in iframe"
```

---

### Task 5: e2e — forward systemPrompt in the dev drawer page, test the full flow

**Files:**
- Modify: `ui/src/pages/_dev/chat-drawer.vue:40-43` (template), `:128-150` (script)
- Create: `tests/features/chat-system-prompt/chat-system-prompt.e2e.spec.ts`

- [ ] **Step 1: Forward a `systemPrompt` query param to the drawer (test harness)**

In `ui/src/pages/_dev/chat-drawer.vue`, change the script import line (line 129):

```ts
import { ref, onMounted, onUnmounted, computed } from 'vue'
```

to:

```ts
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
```

Add, right after `const { t } = useI18n()` (line 136):

```ts
const route = useRoute()
const devSystemPrompt = computed(() => route.query.systemPrompt as string | undefined)
```

Change the drawer element in the template (lines 40-43):

```vue
  <df-agent-chat-drawer
    :src="chatSrc"
    :drawer-props="drawerProps"
  />
```

to:

```vue
  <df-agent-chat-drawer
    :src="chatSrc"
    :system-prompt="devSystemPrompt"
    :drawer-props="drawerProps"
  />
```

- [ ] **Step 2: Write the failing e2e spec**

Create `tests/features/chat-system-prompt/chat-system-prompt.e2e.spec.ts`:

```ts
/**
 * E2E tests for transmitting the chat system prompt to the iframe.
 *
 * Validates that:
 *   - The drawer sends the systemPrompt over the tab channel (NOT in the iframe URL),
 *     and the iframe applies it (visible in the debug System Prompt tab).
 *   - The legacy ?systemPrompt= query-param path still applies the prompt.
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: {
    assistant: {
      model: {
        id: 'mock-model',
        name: 'Mock Model',
        provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }
      }
    }
  },
  quotas: defaultQuotas
}

const MARKER = 'SYSPROMPT_E2E_MARKER you must always answer in pirate speak'
const fabSelector = '.df-agent-chat-toggle'

async function waitForChatFrame (page: Page) {
  await expect(async () => {
    expect(page.frames().find(f => f.url().endsWith('/_dev/chat'))).toBeTruthy()
  }).toPass({ timeout: 10000 })
  const frame = page.frames().find(f => f.url().endsWith('/_dev/chat'))!
  await expect(frame.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 15000 })
  return frame
}

test.describe('Chat system prompt transmission', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('drawer sends systemPrompt over the channel, not in the iframe URL', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-drawer?systemPrompt=' + encodeURIComponent(MARKER), 'test-standalone1')

    await page.locator(fabSelector).dispatchEvent('click')
    const frame = await waitForChatFrame(page)

    // The prompt must NOT be encoded in the iframe URL (that was the size-limited path)
    expect(frame.url()).not.toContain('systemPrompt')
    expect(frame.url()).not.toContain('SYSPROMPT_E2E_MARKER')

    // Open the debug dialog (default tab is "System Prompt") and verify the prompt was applied
    await frame.getByRole('button', { name: /Debug|Débogage/ }).click()
    await expect(frame.locator('.v-dialog')).toContainText('SYSPROMPT_E2E_MARKER', { timeout: 5000 })
  })

  test('legacy ?systemPrompt= query param still applies the prompt', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/user/test-standalone1/chat?systemPrompt=' + encodeURIComponent(MARKER), 'test-standalone1')

    await expect(page.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: /Debug|Débogage/ }).click()
    await expect(page.locator('.v-dialog')).toContainText('SYSPROMPT_E2E_MARKER', { timeout: 5000 })
  })
})
```

- [ ] **Step 3: Build lib-vuetify and run the spec to verify the drawer test fails before the iframe consumes the channel**

If you are running this task before Tasks 2-4 are merged, the first test fails (the marker never reaches the iframe). If Tasks 2-4 are already done, ensure `lib-vuetify` is rebuilt first.

Run: `cd lib-vuetify && npm run build`
Run: `npm run test tests/features/chat-system-prompt/chat-system-prompt.e2e.spec.ts`
Expected (feature absent): drawer test FAILS — `.v-dialog` does not contain `SYSPROMPT_E2E_MARKER`. Legacy test PASSES (it is a regression guard and works regardless).

- [ ] **Step 4: With Tasks 2-4 implemented and lib-vuetify rebuilt, run the spec to verify both pass**

Run: `cd lib-vuetify && npm run build`
Run: `npm run test tests/features/chat-system-prompt/chat-system-prompt.e2e.spec.ts`
Expected: both tests PASS.

If a test fails with a connection error, run `bash dev/status.sh` to diagnose, then stop and ask the user for help (per AGENTS.md). If elements are not found, confirm `lib-vuetify/*.js` and `lib-vue/*.js` are built.

- [ ] **Step 5: Commit**

```bash
git add ui/src/pages/_dev/chat-drawer.vue tests/features/chat-system-prompt/chat-system-prompt.e2e.spec.ts
git commit -m "test(chat): e2e for system prompt channel transmission and legacy param"
```

---

### Task 6: Full quality gate

**Files:** none (verification only)

- [ ] **Step 1: Lint**

Run: `npm run lint-fix`
Expected: no errors (pre-existing `v-html` warnings in `AgentChatMessages.vue` are unrelated and acceptable).

- [ ] **Step 2: Type check**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 3: Run the affected e2e suites to confirm no regressions**

Run: `npm run test tests/features/chat-drawer/chat-drawer.e2e.spec.ts tests/features/chat-action/chat-action.e2e.spec.ts tests/features/chat-menu/chat-menu.e2e.spec.ts tests/features/chat-system-prompt/chat-system-prompt.e2e.spec.ts`
Expected: all PASS. (These exercise the drawer/menu/action flows the helper plugs into.)

- [ ] **Step 4: Docker build (final gate, per AGENTS.md)**

Run: `docker build -t agents .`
Expected: build succeeds.

- [ ] **Step 5: Commit any lint fixups**

```bash
git add -A
git commit -m "chore(chat): lint and type fixups for system prompt channel" || echo "nothing to commit"
```

---

## Self-Review

**Spec coverage:**
- New `AgentSetSystemPrompt` message type → Task 1. ✓
- Shared `useSystemPromptChannel` helper (post + sessionStorage set; removeItem on empty; close on dispose) → Task 2 Step 3. ✓
- Drawer + Menu call the helper → Task 3. ✓
- `resolveAgentChatUrl` stops emitting `systemPrompt` → Task 2 Step 2. ✓
- Iframe override ref seeded from sessionStorage, updated on channel message, used in `finalSystemPrompt`, query param remains fallback → Task 4. ✓
- Backward compat (iframe still reads `?systemPrompt=`) → unchanged in `chat.vue`; verified by Task 5 legacy test. ✓
- Testing (e2e for channel path + legacy path) → Task 5; regression suites → Task 6. ✓

**Placeholder scan:** No TBD/TODO; every code step shows the exact code. ✓

**Type consistency:** `AgentSetSystemPrompt` fields `{ channel, type: 'agent-set-system-prompt', systemPrompt }` are identical in the type definition (Task 1), the producer (`useSystemPromptChannel`, Task 2), and the consumer branch (`AgentChat.vue`, Task 4). The `sessionStorage` key `'df-agent-system-prompt'` is identical in `useAgentChatBase.ts` (`SYSTEM_PROMPT_STORAGE_KEY`) and `AgentChat.vue`. ✓

**Note on unit tests:** `lib-vuetify` components have no unit tests in this codebase (only e2e: `chat-drawer`, `chat-action`, `chat-menu`), and `resolveAgentChatUrl` depends on `window.location` + a browser-only transitive import (`@data-fair/lib-vue-agents`), so a node `*.unit.spec.ts` would be fragile. Following the established convention, this feature is covered by e2e tests instead.
