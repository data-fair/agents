# Action Button BroadcastChannel Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple `DfAgentChatAction` from the top-page singleton composable so it can work from inside iframes, using BroadcastChannel for communication (same pattern as MCP tools).

**Architecture:** Action buttons post `agent-start-session` / `agent-session-cleared` messages on a `BroadcastChannel` keyed by `getTabChannelId()`. The chat iframe listens on that same channel and handles sessions directly. The drawer composable also listens to auto-open the drawer. The chat iframe is always rendered (not lazy) so it's ready to receive messages.

**Tech Stack:** Vue 3, BroadcastChannel API, `getTabChannelId()` from `@data-fair/lib-vue-agents`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib-vuetify/DfAgentChatAction.vue` | Rewrite | Fire-and-forget button: BroadcastChannel on mount, post messages on click/dispose |
| `lib-vuetify/useAgentChatDrawer.ts` | Modify | Remove action-related state; add BroadcastChannel listener to auto-open drawer; always create iframe |
| `lib-vuetify/DfAgentChatDrawer.vue` | Modify | Always render iframe; remove `registerIframeMessenger` |
| `lib-vuetify/types.ts` | Modify | Add `AgentActionStartSession` and `AgentActionSessionCleared` broadcast message types |
| `lib-vuetify/package.json` | Modify | Add `@data-fair/lib-vue-agents` as peer dependency |
| `ui/src/components/AgentChat.vue` | Modify | Listen on BroadcastChannel for action messages; remove `window.postMessage` listener |
| `tests/features/chat-action/chat-action.e2e.spec.ts` | Rewrite | Update tests: remove status-tracking tests, update expectations for new behavior |

---

### Task 1: Add broadcast message types

**Files:**
- Modify: `lib-vuetify/types.ts`
- Modify: `lib-vuetify/package.json`

- [ ] **Step 1: Add new types to `lib-vuetify/types.ts`**

Add these types after the existing `SessionClearedMessage`:

```typescript
/** BroadcastChannel message sent by action buttons */
export interface AgentActionStartSession {
  channel: string
  type: 'agent-start-session'
  visiblePrompt: string
  hiddenContext: string
}

/** BroadcastChannel message sent when action button is disposed */
export interface AgentActionSessionCleared {
  channel: string
  type: 'agent-session-cleared'
}

export type AgentActionMessage = AgentActionStartSession | AgentActionSessionCleared
```

- [ ] **Step 2: Add peer dependency**

In `lib-vuetify/package.json`, add to `peerDependencies`:

```json
"@data-fair/lib-vue-agents": "^0.2.0"
```

- [ ] **Step 3: Update exports in `lib-vuetify/index.ts`**

Ensure new types are exported in the existing type export line.

- [ ] **Step 4: Commit**

```bash
git add lib-vuetify/types.ts lib-vuetify/package.json lib-vuetify/index.ts
git commit -m "feat: add BroadcastChannel message types for action buttons"
```

---

### Task 2: Rewrite `DfAgentChatAction.vue`

**Files:**
- Rewrite: `lib-vuetify/DfAgentChatAction.vue`

- [ ] **Step 1: Rewrite the component**

The new component:
- Imports `getTabChannelId` from `@data-fair/lib-vue-agents`
- On mount: opens a `BroadcastChannel` with `getTabChannelId()`
- On click: posts `{ channel, type: 'agent-start-session', visiblePrompt, hiddenContext }`
- On scope dispose: posts `{ channel, type: 'agent-session-cleared' }`, closes channel
- No state tracking — static icon, static color

```vue
<template>
  <v-btn
    :icon="mdiRobotOutline"
    color="secondary"
    :data-action-id="actionId"
    class="df-agent-chat-action"
    v-bind="btnProps"
    variant="flat"
    :title="title"
    size="small"
    @click="handleClick"
  />
</template>

<script lang="ts" setup>
import { onMounted, onScopeDispose } from 'vue'
import { VBtn } from 'vuetify/components/VBtn'
import { mdiRobotOutline } from '@mdi/js'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import type { AgentActionStartSession, AgentActionSessionCleared } from './types.js'

type BtnProps = Omit<VBtn['$props'], 'icon' | 'color' | 'loading' | 'onClick' | 'size'>

const props = withDefaults(defineProps<{
  actionId: string
  visiblePrompt: string
  hiddenContext: string
  title?: string
  btnProps?: BtnProps
}>(), {
  title: 'Ask the assistant',
  btnProps: () => ({}) as BtnProps
})

let bc: BroadcastChannel | null = null
let channelId: string

onMounted(() => {
  channelId = getTabChannelId()
  bc = new BroadcastChannel(channelId)
})

function handleClick () {
  if (!bc) return
  bc.postMessage({
    channel: channelId,
    type: 'agent-start-session',
    visiblePrompt: props.visiblePrompt,
    hiddenContext: props.hiddenContext
  } satisfies AgentActionStartSession)
}

onScopeDispose(() => {
  if (!bc) return
  bc.postMessage({
    channel: channelId,
    type: 'agent-session-cleared'
  } satisfies AgentActionSessionCleared)
  bc.close()
  bc = null
})
</script>
```

- [ ] **Step 2: Commit**

```bash
git add lib-vuetify/DfAgentChatAction.vue
git commit -m "feat: rewrite DfAgentChatAction to use BroadcastChannel"
```

---

### Task 3: Update `useAgentChatDrawer.ts`

**Files:**
- Modify: `lib-vuetify/useAgentChatDrawer.ts`

- [ ] **Step 1: Remove action-related state and methods**

Remove: `ready`, `activeActionId`, `registerIframeMessenger`, `postMessageToIframe`, `openForAction`, `clearAction`, and the `iframeMessenger` variable.

- [ ] **Step 2: Always create iframe; add BroadcastChannel listener**

- Set `iframeCreated` to always be `true` (the iframe is always present)
- Remove the `iframeCreated` toggling logic from `toggleDrawer`
- On creation, open a `BroadcastChannel` with `getTabChannelId()` and listen for `agent-start-session` → set `drawerOpen = true`

The resulting composable should look like:

```typescript
import { ref, computed } from 'vue'
import { mdiRobotOutline, mdiCommentQuestion, mdiAlertCircle } from '@mdi/js'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import type { AgentStatus, AgentChatMessage, AgentActionStartSession } from './types.js'
import Debug from 'debug'

const debug = Debug('df-agents:agent-chat-drawer')

const STORAGE_KEY = 'df-agent-chat-open'

let singleton: AgentChatDrawerState | null = null

function createAgentChatDrawer () {
  const wasOpen = localStorage.getItem(STORAGE_KEY) === '1'
  const drawerOpen = ref(wasOpen)
  const agentStatus = ref<AgentStatus>('idle')
  const hasUnread = ref(false)
  const toolsJustChanged = ref(false)
  let toolsChangedTimeout: ReturnType<typeof setTimeout> | null = null

  // Listen on BroadcastChannel to auto-open drawer on action start
  const channelId = getTabChannelId()
  const bc = new BroadcastChannel(channelId)
  bc.onmessage = (event: MessageEvent) => {
    const data = event.data
    if (!data || data.channel !== channelId) return
    if (data.type === 'agent-start-session') {
      debug('received agent-start-session, opening drawer')
      drawerOpen.value = true
      localStorage.setItem(STORAGE_KEY, '1')
      hasUnread.value = false
    }
  }

  const fabIcon = computed(() => {
    switch (agentStatus.value) {
      case 'waiting-user': return mdiCommentQuestion
      case 'error': return mdiAlertCircle
      default: return mdiRobotOutline
    }
  })

  const fabColor = computed(() => {
    if (toolsJustChanged.value) return 'accent'
    switch (agentStatus.value) {
      case 'working': return 'accent'
      case 'waiting-user': return 'warning'
      case 'error': return 'error'
      default: return 'secondary'
    }
  })

  function toggleDrawer () {
    drawerOpen.value = !drawerOpen.value
    localStorage.setItem(STORAGE_KEY, drawerOpen.value ? '1' : '0')
    hasUnread.value = false
  }

  function onDFrameMessage (event: CustomEvent<AgentChatMessage>) {
    const msg = event.detail
    debug('frame message type=%s %o', msg.type, msg)
    if (msg.type === 'agent-status') {
      agentStatus.value = msg.status
    } else if (msg.type === 'tools-changed') {
      toolsJustChanged.value = true
      if (toolsChangedTimeout) clearTimeout(toolsChangedTimeout)
      toolsChangedTimeout = setTimeout(() => { toolsJustChanged.value = false }, 3000)
    } else if (msg.type === 'unread') {
      if (!drawerOpen.value && msg.unread) {
        hasUnread.value = true
      }
    }
  }

  return {
    drawerOpen,
    agentStatus,
    hasUnread,
    fabIcon,
    fabColor,
    toggleDrawer,
    onDFrameMessage
  }
}

export function useAgentChatDrawer () {
  if (typeof window === 'undefined') {
    throw new Error('useAgentChatDrawer cannot be used in SSR')
  }
  if (!singleton) singleton = createAgentChatDrawer()
  return singleton
}

export type AgentChatDrawerState = ReturnType<typeof createAgentChatDrawer>
```

- [ ] **Step 3: Commit**

```bash
git add lib-vuetify/useAgentChatDrawer.ts
git commit -m "refactor: remove action state from drawer composable, add BroadcastChannel listener"
```

---

### Task 4: Update `DfAgentChatDrawer.vue`

**Files:**
- Modify: `lib-vuetify/DfAgentChatDrawer.vue`

- [ ] **Step 1: Always render iframe, remove messenger registration**

Changes:
- Remove `v-if="state.iframeCreated.value"` from the `<d-frame>` element
- Remove the `onMounted` block that registers `iframeMessenger`
- Remove the `dFrameEl` ref (no longer needed for postMessage)

Updated template:

```vue
<template>
  <v-navigation-drawer
    v-model="state.drawerOpen.value"
    location="right"
    floating
    color="#FFFFFF00"
    app
    :width="drawerWidth"
    style="z-index: 2500; /* Higher than v-dialog's 2400 */"
    v-bind="drawerProps"
  >
    <d-frame
      v-show="state.drawerOpen.value"
      :src="resolvedSrc"
      resize="no"
      style="height: 100%;"
      @message="state.onDFrameMessage"
    />
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { VNavigationDrawer } from 'vuetify/components/VNavigationDrawer'
import { useDisplay } from 'vuetify'
import('@data-fair/frame/lib/d-frame.js')
import { useAgentChatDrawer } from './useAgentChatDrawer.js'

type DrawerProps = Omit<VNavigationDrawer['$props'], 'modelValue' | 'location' | 'width' | 'floating'>

const props = withDefaults(defineProps<{
  accountType?: string
  accountId?: string
  src?: string
  chatTitle?: string
  systemPrompt?: string
  drawerProps?: DrawerProps
}>(), {
  drawerProps: () => ({}) as DrawerProps
})

const state = useAgentChatDrawer()

const { name: breakpoint } = useDisplay()

const drawerWidth = computed(() => {
  switch (breakpoint.value) {
    case 'xs':
    case 'sm': return 350
    case 'md': return undefined
    case 'lg': return 350
    default: return 450
  }
})

const resolvedSrc = computed(() => {
  if (props.src) return props.src
  if (props.accountType && props.accountId) {
    const base = `${window.location.origin}/agents/${props.accountType}/${props.accountId}/chat`
    const params = new URLSearchParams()
    if (props.chatTitle) params.set('title', props.chatTitle)
    if (props.systemPrompt) params.set('systemPrompt', props.systemPrompt)
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }
  return ''
})
</script>
```

- [ ] **Step 2: Commit**

```bash
git add lib-vuetify/DfAgentChatDrawer.vue
git commit -m "refactor: always render chat iframe, remove postMessage messenger"
```

---

### Task 5: Update `AgentChat.vue` to use BroadcastChannel

**Files:**
- Modify: `ui/src/components/AgentChat.vue`

- [ ] **Step 1: Replace postMessage listener with BroadcastChannel**

In `AgentChat.vue`, replace the `handleParentMessage` / `window.addEventListener('message', ...)` logic with a BroadcastChannel listener.

Remove:
- The `handleParentMessage` function
- Both `window.addEventListener('message', handleParentMessage)` and `window.removeEventListener('message', handleParentMessage)`

Add (in the `<script>` section, near the existing `onMounted`):

```typescript
import { getTabChannelId } from '@data-fair/lib-vue-agents'

// Listen for action messages via BroadcastChannel
const actionChannelId = getTabChannelId()
const actionChannel = new BroadcastChannel(actionChannelId)
actionChannel.onmessage = (event: MessageEvent) => {
  const data = event.data
  if (!data || data.channel !== actionChannelId) return

  if (data.type === 'agent-start-session') {
    sessionStarted.value = true
    if (welcomeTimeout) {
      clearTimeout(welcomeTimeout)
      welcomeTimeout = null
    }
    startActionSession(data.visiblePrompt, data.hiddenContext)
  } else if (data.type === 'agent-session-cleared') {
    handleSessionCleared()
  }
}

onUnmounted(() => {
  actionChannel.close()
})
```

Also remove the `chat-ready` d-frame message from `onMounted` since the iframe is always present and doesn't need to signal readiness. Keep the welcome delay logic for iframes.

- [ ] **Step 2: Remove obsolete types from `lib-vuetify/types.ts`**

Remove: `ChatReadyMessage` interface, `StartSessionMessage`, `SessionClearedMessage`, `ParentToIframeMessage`.
Remove `ChatReadyMessage` from the `AgentChatMessage` union.
Note: `chat-ready` handling was already removed from `useAgentChatDrawer.ts` in Task 3.

- [ ] **Step 4: Commit**

```bash
git add ui/src/components/AgentChat.vue lib-vuetify/useAgentChatDrawer.ts lib-vuetify/types.ts lib-vuetify/index.ts
git commit -m "feat: AgentChat listens on BroadcastChannel for action messages"
```

---

### Task 6: Update `lib-vuetify/index.ts` exports

**Files:**
- Modify: `lib-vuetify/index.ts`

- [ ] **Step 1: Clean up exports**

Remove `useAgentChatDrawer` export and `AgentChatDrawerState` type export (these are internal to the top page and shouldn't be needed by iframe consumers — the action button no longer uses them). Actually, keep them if `DfAgentChatToggle.vue` and `DfAgentChatDrawer.vue` still use them — they do, and those are used by consumers in the top page. So keep them.

Remove exported types that no longer exist: `ChatReadyMessage`, `StartSessionMessage`, `SessionClearedMessage`, `ParentToIframeMessage`.

Add new types: `AgentActionStartSession`, `AgentActionSessionCleared`, `AgentActionMessage`.

- [ ] **Step 2: Commit**

```bash
git add lib-vuetify/index.ts
git commit -m "refactor: update lib-vuetify exports for new action message types"
```

---

### Task 7: Update E2E tests

**Files:**
- Rewrite: `tests/features/chat-action/chat-action.e2e.spec.ts`

- [ ] **Step 1: Rewrite tests**

Tests to keep/update:
1. **Clicking action button opens drawer with visible prompt** — same flow, should still work
2. **Hidden context is not visible in chat messages** — same
3. **Clicking a second action button replaces the session** — same
4. **Destroying action button shows session-cleared message** — same

Tests to remove:
5. **Action button reflects agent status after response** — button no longer tracks status
6. **Action button shows loading while iframe is not ready** — button no longer has loading state

The `waitForChatFrame` helper needs updating: since the iframe is always rendered, the frame should exist from page load. But the chat component inside still needs to load, so waiting for the input placeholder is still valid.

```typescript
/**
 * E2E tests for DfAgentChatAction — inline action button that opens
 * the agent chat drawer with a context-specific prompt via BroadcastChannel.
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, axiosAuth, defaultQuotas } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')

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

const chatDrawerSelector = '.v-navigation-drawer:has(d-frame)'

async function waitForChatFrame (page: Page) {
  await expect(async () => {
    expect(page.frames().find(f => f.url().endsWith('/_dev/chat'))).toBeTruthy()
  }).toPass({ timeout: 10000 })
  const frame = page.frames().find(f => f.url().endsWith('/_dev/chat'))!
  await expect(frame.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 15000 })
  return frame
}

test.describe('Agent Chat Action Button', () => {
  test.beforeEach(async () => {
    await clean()
    await user.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Clicking action button opens drawer with visible prompt', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')

    // Wait for the chat frame to be ready (iframe is always rendered)
    const frame = await waitForChatFrame(page)

    // Click the "Create a dataset" action button
    await page.locator('.df-agent-chat-action').first().click()

    // Drawer should be visible
    const drawer = page.locator(chatDrawerSelector)
    await expect(drawer).toBeVisible()

    // The visible prompt should appear as a user message
    const userMessage = frame.locator('.v-card.bg-secondary').first()
    await expect(userMessage).toContainText('Help me create a new dataset', { timeout: 10000 })
  })

  test('Hidden context is not visible in chat messages', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    await page.locator('.df-agent-chat-action').first().click()

    // Wait for the visible prompt to appear
    await expect(frame.locator('.v-card').first()).toContainText('Help me create a new dataset', { timeout: 10000 })

    // The hidden context should NOT be visible anywhere in the chat
    const chatContent = await frame.locator('.agent-chat').textContent()
    expect(chatContent).not.toContain('Relevant tools to focus on')
  })

  test('Clicking a second action button replaces the session', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    // Click first action
    await page.locator('.df-agent-chat-action').first().click()
    await expect(frame.locator('.v-card').first()).toContainText('Help me create a new dataset', { timeout: 10000 })

    // Click second action
    await page.locator('.df-agent-chat-action').nth(1).click()

    // Should now show the second action's prompt
    await expect(frame.locator('.v-card').first()).toContainText('Help me configure a data processing', { timeout: 10000 })

    // First prompt should be gone
    const chatContent = await frame.locator('.agent-chat').textContent()
    expect(chatContent).not.toContain('Help me create a new dataset')
  })

  test('Destroying action button shows session-cleared message', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    // Click the destroyable action (third button)
    await page.locator('.df-agent-chat-action').nth(2).click()
    await expect(frame.locator('.v-card').first()).toContainText('Help me with this temporary action', { timeout: 10000 })

    // Click "Hide temporary action" to destroy the button
    await page.getByText('Hide temporary action').click()

    // The chat should show a session-cleared info message
    await expect(frame.locator('.v-alert')).toContainText('session has ended', { timeout: 5000 })
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npx playwright test tests/features/chat-action/chat-action.e2e.spec.ts
```

- [ ] **Step 3: Fix any failures and commit**

```bash
git add tests/features/chat-action/chat-action.e2e.spec.ts
git commit -m "test: update e2e tests for BroadcastChannel action button"
```
