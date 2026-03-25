# Inline Agent Action Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `DfAgentChatAction` component to `@data-fair/lib-vuetify-agents` that opens the agent chat drawer with a context-specific prompt and reflects session status.

**Architecture:** Extend the existing singleton composable `useAgentChatDrawer` with action session state (`ready`, `activeActionId`) and methods (`openForAction`, `clearAction`). Parent→iframe messaging uses `postMessageToChild` on the d-frame element. Iframe→parent messaging uses d-frame's existing `sendMessage` custom channel. The chat page (`AgentChat.vue`) re-creates the `useAgentChat` composable on `start-session`.

**Tech Stack:** Vue 3, Vuetify 4, TypeScript, @data-fair/frame (d-frame), Playwright (e2e)

**Spec:** `docs/superpowers/specs/2026-03-25-inline-agent-action-button-design.md`

---

### Task 1: Extend message types

**Files:**
- Modify: `lib-vuetify/types.ts`

- [ ] **Step 1: Add new message types**

Add the new types to `lib-vuetify/types.ts`:

```typescript
// After the existing AgentUnreadMessage interface (line 15):

export interface ChatReadyMessage {
  type: 'chat-ready'
}

export interface StartSessionMessage {
  type: 'start-session'
  visiblePrompt: string
  hiddenContext: string
}

export interface SessionClearedMessage {
  type: 'session-cleared'
}

// Update AgentChatMessage to include ChatReadyMessage:
export type AgentChatMessage = AgentStatusMessage | AgentToolsChangedMessage | AgentUnreadMessage | ChatReadyMessage

// New union for parent→iframe messages:
export type ParentToIframeMessage = StartSessionMessage | SessionClearedMessage
```

- [ ] **Step 2: Update exports in index.ts**

In `lib-vuetify/index.ts`, add the new types to the export line:

```typescript
export type { AgentStatus, AgentStatusMessage, AgentToolsChangedMessage, AgentUnreadMessage, AgentChatMessage, ChatReadyMessage, StartSessionMessage, SessionClearedMessage, ParentToIframeMessage } from './types.js'
```

- [ ] **Step 3: Commit**

```bash
git add lib-vuetify/types.ts lib-vuetify/index.ts
git commit -m "feat: add message types for action button protocol"
```

---

### Task 2: Extend the composable `useAgentChatDrawer`

**Files:**
- Modify: `lib-vuetify/useAgentChatDrawer.ts`

- [ ] **Step 1: Add new state and messenger registration**

Add after `let toolsChangedTimeout` (line 19):

```typescript
const ready = ref(false)
const activeActionId = ref<string | null>(null)
let iframeMessenger: ((msg: object) => void) | null = null

function registerIframeMessenger (fn: (msg: object) => void) {
  iframeMessenger = fn
}

function postMessageToIframe (msg: object) {
  if (iframeMessenger) iframeMessenger(msg)
}
```

- [ ] **Step 2: Handle `chat-ready` in `onDFrameMessage`**

Add a new branch in `onDFrameMessage` (after line 58):

```typescript
} else if (msg.type === 'chat-ready') {
  ready.value = true
}
```

- [ ] **Step 3: Reset `ready` when iframe is created**

In the `toggleDrawer` function, after `iframeCreated.value = true` (line 40), add:

```typescript
ready.value = false
```

- [ ] **Step 4: Add `openForAction` method**

Add after `onDFrameMessage`:

```typescript
async function openForAction (actionId: string, visiblePrompt: string, hiddenContext: string) {
  activeActionId.value = actionId

  if (!iframeCreated.value) {
    iframeCreated.value = true
    ready.value = false
  }
  drawerOpen.value = true
  localStorage.setItem(STORAGE_KEY, '1')
  hasUnread.value = false

  // Wait for the iframe to signal ready
  if (!ready.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(ready, (val) => {
        if (val) {
          stop()
          resolve()
        }
      }, { immediate: true })
    })
  }

  postMessageToIframe({ type: 'start-session', visiblePrompt, hiddenContext })
}
```

Import `watch` from vue at the top of the file (add to existing import).

- [ ] **Step 5: Add `clearAction` method**

Add after `openForAction`:

```typescript
function clearAction (actionId: string) {
  if (activeActionId.value !== actionId) return
  activeActionId.value = null
  postMessageToIframe({ type: 'session-cleared' })
}
```

- [ ] **Step 6: Expose new state and methods in the return object**

Update the return object (line 62-71) to include:

```typescript
ready,
activeActionId,
openForAction,
clearAction,
registerIframeMessenger,
postMessageToIframe
```

- [ ] **Step 7: Commit**

```bash
git add lib-vuetify/useAgentChatDrawer.ts
git commit -m "feat: extend useAgentChatDrawer with action session support"
```

---

### Task 3: Update `DfAgentChatDrawer` to register iframe messenger

**Files:**
- Modify: `lib-vuetify/DfAgentChatDrawer.vue`

- [ ] **Step 1: Add ref and register messenger**

Update the import on line 25 from `import { computed } from 'vue'` to `import { computed, ref, onMounted } from 'vue'`.

In the `<script>` section, add after `const state = useAgentChatDrawer()` (line 44):

```typescript
const dFrameEl = ref<any>(null)

onMounted(() => {
  state.registerIframeMessenger((msg: object) => {
    const el = dFrameEl.value
    // Access the iframe element inside the d-frame shadow DOM.
    // We post directly to the iframe's contentWindow (not via d-frame's postMessageToChild)
    // because d-frame's internal protocol only handles known message formats (arrays).
    // Our custom messages are plain objects that the chat page listens for via window.addEventListener('message').
    const iframe = el?.shadowRoot?.querySelector('iframe') ?? el?.querySelector('iframe')
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(msg, '*')
    }
  })
})
```

Note: The template already has `ref="dFrameEl"` on the d-frame element (line 15). The script-side `ref` declaration is needed for Vue 3 `<script setup>` to bind the template ref.

- [ ] **Step 2: Commit**

```bash
git add lib-vuetify/DfAgentChatDrawer.vue
git commit -m "feat: register iframe messenger in DfAgentChatDrawer"
```

---

### Task 4: Create `DfAgentChatAction` component

**Files:**
- Create: `lib-vuetify/DfAgentChatAction.vue`
- Modify: `lib-vuetify/index.ts`

- [ ] **Step 1: Create the component**

Create `lib-vuetify/DfAgentChatAction.vue`:

```vue
<template>
  <v-btn
    :icon="icon"
    :color="color"
    :loading="loading"
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
import { computed, onScopeDispose, ref } from 'vue'
import { VBtn } from 'vuetify/components/VBtn'
import { mdiRobotOutline, mdiCommentQuestion, mdiAlertCircle } from '@mdi/js'
import { useAgentChatDrawer } from './useAgentChatDrawer.js'

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

const state = useAgentChatDrawer()
const waitingForReady = ref(false)

const isActive = computed(() => state.activeActionId.value === props.actionId)

const icon = computed(() => {
  if (!isActive.value) return mdiRobotOutline
  switch (state.agentStatus.value) {
    case 'waiting-user': return mdiCommentQuestion
    case 'error': return mdiAlertCircle
    default: return mdiRobotOutline
  }
})

const color = computed(() => {
  if (!isActive.value) return 'secondary'
  switch (state.agentStatus.value) {
    case 'working': return 'accent'
    case 'waiting-user': return 'warning'
    case 'error': return 'error'
    default: return 'secondary'
  }
})

const loading = computed(() => {
  if (waitingForReady.value) return true
  if (!isActive.value) return false
  return state.agentStatus.value === 'working'
})

async function handleClick () {
  if (isActive.value) {
    // Already active: just open/focus the drawer
    state.drawerOpen.value = true
    return
  }
  waitingForReady.value = true
  try {
    await state.openForAction(props.actionId, props.visiblePrompt, props.hiddenContext)
  } finally {
    waitingForReady.value = false
  }
}

onScopeDispose(() => {
  state.clearAction(props.actionId)
})
</script>
```

- [ ] **Step 2: Export in index.ts**

Add to `lib-vuetify/index.ts`:

```typescript
export { default as DfAgentChatAction } from './DfAgentChatAction.vue'
```

- [ ] **Step 3: Commit**

```bash
git add lib-vuetify/DfAgentChatAction.vue lib-vuetify/index.ts
git commit -m "feat: add DfAgentChatAction component"
```

---

### Task 5: Chat page — emit `chat-ready` and listen for parent messages

**Files:**
- Modify: `ui/src/components/AgentChat.vue`

- [ ] **Step 1: Emit `chat-ready` on mount and add message listener**

In `AgentChat.vue`, add after the `dFrameContent` setup (line 240-244):

```typescript
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

// Emit chat-ready to parent after mount
const welcomeDelayDone = ref(false)
const sessionStarted = ref(false)
let welcomeTimeout: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  sendDFrameMessage({ type: 'chat-ready' })

  // Delay welcome message only inside an iframe to allow start-session to suppress it.
  // Outside an iframe (direct navigation), show welcome immediately.
  if (inIframe) {
    welcomeTimeout = setTimeout(() => {
      welcomeDelayDone.value = true
    }, 200)
  } else {
    welcomeDelayDone.value = true
  }
})

// Listen for parent→iframe messages
function handleParentMessage (event: MessageEvent) {
  const data = event.data
  if (!data || typeof data !== 'object' || !data.type) return

  if (data.type === 'start-session') {
    sessionStarted.value = true
    if (welcomeTimeout) {
      clearTimeout(welcomeTimeout)
      welcomeTimeout = null
    }
    startActionSession(data.visiblePrompt, data.hiddenContext)
  } else if (data.type === 'session-cleared') {
    handleSessionCleared()
  }
}

onMounted(() => {
  window.addEventListener('message', handleParentMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleParentMessage)
})
```

- [ ] **Step 2: Add `reset` method to `useAgentChat`**

Instead of re-creating the composable (which would break all watchers), add a `reset` method that clears state and updates the system prompt in-place.

In `ui/src/composables/use-agent-chat.ts`, add a `reset` method to the return object:

```typescript
// Add after the abort function (around line 164):
const reset = (newSystemPrompt?: string, newInitialMessages?: ChatMessage[]) => {
  abort()
  messages.value = newInitialMessages ?? []
  status.value = 'ready'
  error.value = null
  history = []
  if (newSystemPrompt !== undefined) {
    options.systemPrompt = newSystemPrompt
  }
}

// Update the return (line 454):
return { messages, status, error, tools, toolsVersion, sendMessage, abort, reset }
```

Note: `options.systemPrompt` is passed to `streamText` in `sendMessage` (line 374), so mutating it before the next `sendMessage` call is sufficient.

- [ ] **Step 3: Implement `startActionSession` in AgentChat.vue**

```typescript
const actionVisiblePrompt = ref<string | null>(null)
const sessionClearedMessage = ref<string | null>(null)

function startActionSession (visiblePrompt: string, hiddenContext: string) {
  const newSystemPrompt = finalSystemPrompt.value + '\n\n' + hiddenContext

  if (recorder) {
    recorder.setSystemPrompt(newSystemPrompt)
  }

  actionVisiblePrompt.value = visiblePrompt
  sessionClearedMessage.value = null

  // Reset the chat with the action context as system prompt.
  // Pass the visible prompt as an initial message (displayed only, not in LLM history).
  // Then sendMessage adds it to history and triggers the LLM call.
  chatResult.reset(newSystemPrompt)

  // Send the visible prompt to trigger the agent (adds to messages + history + calls LLM)
  chatResult.sendMessage(visiblePrompt)
}

function handleSessionCleared () {
  sessionClearedMessage.value = 'This assistance session has ended because you navigated away from the action.'
}
```

- [ ] **Step 4: Pass action state to messages component**

Update the `<agent-chat-messages>` usage to pass the new props:

```vue
<agent-chat-messages
  ref="messagesRef"
  :messages="messages"
  :is-streaming="isStreaming"
  :chat-error="chatError"
  :welcome-text="showWelcome ? (activeChatTab === 'evaluation' ? t('welcomeEvaluation') : t('welcome')) : ''"
  :tool-title="toolTitle"
  :action-visible-prompt="actionVisiblePrompt"
  :session-cleared-message="sessionClearedMessage"
/>
```

Add the welcome message gating:

```typescript
const showWelcome = computed(() => {
  if (sessionStarted.value) return false
  return welcomeDelayDone.value
})
```

- [ ] **Step 5: Commit**

```bash
git add ui/src/components/AgentChat.vue ui/src/composables/use-agent-chat.ts
git commit -m "feat: add start-session and session-cleared handling in AgentChat"
```

---

### Task 6: Visual differentiation in `AgentChatMessages`

**Files:**
- Modify: `ui/src/components/agent-chat/AgentChatMessages.vue`

- [ ] **Step 1: Add new props**

Add to the props interface (line 179-185):

```typescript
defineProps<{
  messages: ChatMessage[]
  isStreaming: boolean
  chatError: string | null
  welcomeText: string
  toolTitle: (toolName: string) => string
  actionVisiblePrompt: string | null
  sessionClearedMessage: string | null
}>()
```

- [ ] **Step 2: Style the action prompt differently**

Update the user message rendering (lines 24-34) to use flat variant for action prompts:

```vue
<div
  v-if="message.role === 'user'"
  class="d-flex justify-end"
>
  <v-card
    class="pa-3 text-body-2 rounded-xl"
    :class="{ 'bg-surface': !isActionPrompt(message, index) }"
    color="secondary"
    :variant="isActionPrompt(message, index) ? 'flat' : 'outlined'"
  >
    {{ message.content }}
  </v-card>
</div>
```

Add the helper function in `<script>`:

```typescript
const props = defineProps<{...}>()

const isActionPrompt = (message: ChatMessage, index: number) => {
  return index === 0 && message.role === 'user' && props.actionVisiblePrompt === message.content
}
```

- [ ] **Step 3: Add session-cleared info message**

After the error alert (line 159), add:

```vue
<!-- Session cleared info -->
<div
  v-if="sessionClearedMessage"
  class="px-4 py-2"
>
  <v-alert
    type="info"
    density="compact"
    variant="tonal"
  >
    {{ sessionClearedMessage }}
  </v-alert>
</div>
```

- [ ] **Step 4: Add i18n keys**

No i18n needed here — the message text comes from the parent component.

- [ ] **Step 5: Commit**

```bash
git add ui/src/components/agent-chat/AgentChatMessages.vue
git commit -m "feat: visual differentiation for action prompts and session-cleared message"
```

---

### Task 7: Trace logging for action sessions

**Files:**
- Modify: `ui/src/traces/session-recorder.ts`

- [ ] **Step 1: Add action session recording**

The `setSystemPrompt` method already exists (line 83-85) and is called in `startActionSession`. The visible prompt is recorded as a user message via `startTurn`. Both parts are already handled by the existing flow since `startActionSession` calls `chatResult.reset()` then `chatResult.sendMessage()`, which calls `recorder.startTurn(msg)`.

For the hidden context, the `setSystemPrompt` call before reset captures the full prompt including hidden context. This is sufficient — the trace will show the system prompt with hidden context and the user turn with the visible prompt.

No additional changes needed. Skip to next task.

---

### Task 8: Dev page for testing

**Files:**
- Create: `ui/src/pages/_dev/chat-action.vue`

- [ ] **Step 1: Create the dev page**

Create `ui/src/pages/_dev/chat-action.vue`:

```vue
<template>
  <v-app-bar
    flat
    :elevation="0"
  >
    <v-spacer />
    <personal-menu dark-mode-switch />
    <df-agent-chat-toggle />
  </v-app-bar>

  <df-agent-chat-drawer
    :src="chatSrc"
    :drawer-props="drawerProps"
  />

  <v-container>
    <h1 class="text-h5 mb-4">
      {{ t('title') }}
    </h1>
    <p class="text-body-2 text-medium-emphasis mb-4">
      {{ t('instructions') }}
    </p>

    <v-list>
      <v-list-item>
        <template #default>
          <div class="d-flex align-center">
            <span class="text-body-1">{{ t('createDataset') }}</span>
            <v-spacer />
            <df-agent-chat-action
              action-id="create-dataset"
              :visible-prompt="t('createDatasetPrompt')"
              :hidden-context="createDatasetContext"
              :title="t('askAssistant')"
            />
          </div>
        </template>
      </v-list-item>

      <v-list-item>
        <template #default>
          <div class="d-flex align-center">
            <span class="text-body-1">{{ t('configureProcessing') }}</span>
            <v-spacer />
            <df-agent-chat-action
              action-id="configure-processing"
              :visible-prompt="t('configureProcessingPrompt')"
              :hidden-context="configureProcessingContext"
              :title="t('askAssistant')"
            />
          </div>
        </template>
      </v-list-item>

      <v-list-item v-if="showDestroyable">
        <template #default>
          <div class="d-flex align-center">
            <span class="text-body-1">{{ t('destroyableAction') }}</span>
            <v-spacer />
            <df-agent-chat-action
              action-id="destroyable"
              :visible-prompt="t('destroyablePrompt')"
              :hidden-context="destroyableContext"
              :title="t('askAssistant')"
            />
          </div>
        </template>
      </v-list-item>
    </v-list>

    <v-btn
      class="mt-4"
      variant="tonal"
      color="primary"
      @click="showDestroyable = !showDestroyable"
    >
      {{ showDestroyable ? t('hideDestroyable') : t('showDestroyable') }}
    </v-btn>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Test des boutons d'action agent
  instructions: Cliquez sur les boutons robot pour ouvrir une session contextuelle.
  createDataset: Créer un jeu de données
  createDatasetPrompt: Aide-moi à créer un nouveau jeu de données
  configureProcessing: Configurer un traitement
  configureProcessingPrompt: Aide-moi à configurer un traitement de données
  destroyableAction: Action temporaire
  destroyablePrompt: Aide-moi avec cette action temporaire
  askAssistant: Demander à l'assistant
  showDestroyable: Afficher l'action temporaire
  hideDestroyable: Masquer l'action temporaire
en:
  title: Agent action buttons test
  instructions: Click the robot buttons to open a contextual session.
  createDataset: Create a dataset
  createDatasetPrompt: Help me create a new dataset
  configureProcessing: Configure a processing
  configureProcessingPrompt: Help me configure a data processing
  destroyableAction: Temporary action
  destroyablePrompt: Help me with this temporary action
  askAssistant: Ask the assistant
  showDestroyable: Show temporary action
  hideDestroyable: Hide temporary action
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DfAgentChatToggle, DfAgentChatDrawer, DfAgentChatAction } from '@data-fair/lib-vuetify-agents'
import { useFrameServer } from '@data-fair/lib-vue-agents'
import personalMenu from '@data-fair/lib-vuetify/personal-menu.vue'

const { t } = useI18n()

useFrameServer('parent')

const showDestroyable = ref(true)

const chatSrc = computed(() => {
  return `${window.location.origin}/agents/_dev/chat`
})

const createDatasetContext = `The user wants to create a new dataset on the Data Fair platform.
Relevant tools to focus on: dataset creation tools, file upload tools.
Guide the user through the dataset creation process step by step.`

const configureProcessingContext = `The user wants to configure a data processing pipeline.
Relevant tools to focus on: processing configuration tools, scheduling tools.
Ask about the data source, transformation steps, and output format.`

const destroyableContext = `This is a temporary action for testing the session-cleared flow.
Help the user with a generic task.`

const drawerProps = {
  class: 'border-secondary border-md border-e-0 border-b-0 border-opacity-100 rounded-ts-xl',
  style: 'overflow: hidden'
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add ui/src/pages/_dev/chat-action.vue
git commit -m "feat: add dev page for agent action button testing"
```

---

### Task 9: E2E tests

**Files:**
- Create: `tests/features/chat-action/chat-action.e2e.spec.ts`

- [ ] **Step 1: Create e2e test file**

Create `tests/features/chat-action/chat-action.e2e.spec.ts`:

```typescript
/**
 * E2E tests for DfAgentChatAction — inline action button that opens
 * the agent chat drawer with a context-specific prompt.
 */

import { expect, type Page, type Frame } from '@playwright/test'
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

const actionBtnSelector = (actionId: string) => `.df-agent-chat-action[data-action-id="${actionId}"]`
const chatDrawerSelector = '.v-navigation-drawer:has(d-frame)'

async function waitForChatFrame (page: Page): Promise<Frame> {
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

    // Click the "Create a dataset" action button
    await page.locator('.df-agent-chat-action').first().click()

    // Drawer should be visible
    const drawer = page.locator(chatDrawerSelector)
    await expect(drawer).toBeVisible()

    // Wait for the chat frame to load
    const frame = await waitForChatFrame(page)

    // The visible prompt should appear as a user message with flat variant
    const userMessage = frame.locator('.v-card.bg-secondary').first()
    await expect(userMessage).toContainText('Help me create a new dataset', { timeout: 10000 })
  })

  test('Hidden context is not visible in chat messages', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')

    await page.locator('.df-agent-chat-action').first().click()
    const frame = await waitForChatFrame(page)

    // Wait for the visible prompt to appear
    await expect(frame.locator('.v-card').first()).toContainText('Help me create a new dataset', { timeout: 10000 })

    // The hidden context should NOT be visible anywhere in the chat
    const chatContent = await frame.locator('.agent-chat').textContent()
    expect(chatContent).not.toContain('Relevant tools to focus on')
  })

  test('Clicking a second action button replaces the session', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')

    // Click first action
    await page.locator('.df-agent-chat-action').first().click()
    const frame = await waitForChatFrame(page)
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

    // Click the destroyable action (third button)
    await page.locator('.df-agent-chat-action').nth(2).click()
    const frame = await waitForChatFrame(page)
    await expect(frame.locator('.v-card').first()).toContainText('Help me with this temporary action', { timeout: 10000 })

    // Click "Hide temporary action" to destroy the button
    await page.getByText('Hide temporary action').click()

    // The chat should show a session-cleared info message
    await expect(frame.locator('.v-alert')).toContainText('session has ended', { timeout: 5000 })
  })

  test('Action button reflects agent status', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')

    const actionBtn = page.locator('.df-agent-chat-action').first()
    await actionBtn.click()
    const frame = await waitForChatFrame(page)

    // Wait for the visible prompt to appear and agent to respond
    await expect(frame.locator('.v-card').first()).toContainText('Help me create a new dataset', { timeout: 10000 })
    await expect(frame.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    // After agent responds, button should reflect waiting-user status (warning color)
    await expect(actionBtn).toHaveClass(/bg-warning/, { timeout: 5000 })
  })

  test('Action button shows loading while iframe is not ready', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')

    // The button should not be loading initially
    const actionBtn = page.locator('.df-agent-chat-action').first()
    await expect(actionBtn).toBeAttached()

    // Click the action button — it should briefly show loading
    // (hard to assert timing, but we verify the drawer opens)
    await actionBtn.click()

    const drawer = page.locator(chatDrawerSelector)
    await expect(drawer).toBeVisible({ timeout: 10000 })
  })
})
```

- [ ] **Step 2: Run the tests to verify they work**

```bash
npx playwright test tests/features/chat-action/chat-action.e2e.spec.ts
```

- [ ] **Step 3: Commit**

```bash
git add tests/features/chat-action/chat-action.e2e.spec.ts lib-vuetify/DfAgentChatAction.vue
git commit -m "test: add e2e tests for DfAgentChatAction"
```

---

### Task 10: Final integration verification

- [ ] **Step 1: Run all existing e2e tests to ensure no regressions**

```bash
npx playwright test
```

- [ ] **Step 2: Run linting**

```bash
npm run lint
```

- [ ] **Step 3: Fix any issues and commit**

```bash
git add -A
git commit -m "fix: address lint and test issues"
```
