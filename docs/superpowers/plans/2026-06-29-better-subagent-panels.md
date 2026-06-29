# Better Sub-agent Panels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish how delegated sub-agents render in the chat transcript: stop auto-opening panels, wrap each in a `v-alert` with closed-state activity and a delegated-subtask icon, and add a default-on per-user flag that renders delegations as a plain tool chip.

**Architecture:** Pure rendering-layer change in the UI. No orchestration (`use-agent-chat.ts`), server, or trace changes. A new presentation-only flag `simpleSubAgents` flows through the existing `agent-flags` cookie → `AgentChat.vue` refs → `AgentChatMessages.vue` props, identically to the `mermaid` flag but without a conversation reset.

**Tech Stack:** Vue 3 `<script setup>`, Vuetify 3 (`v-alert`, `v-chip`, `v-expand-transition`), `@mdi/js` icons, Playwright (unit project for pure helpers, e2e project for UI).

## Global Constraints

- Every user-facing string has both `en` and `fr` i18n entries (the codebase ships bilingual; see existing `<i18n>` blocks).
- The new `simpleSubAgents` flag defaults **on** and is parsed default-on (`v.simpleSubAgents !== false`), matching the `subAgents` flag convention so an absent/legacy cookie reads as `true`.
- Toggling `simpleSubAgents` MUST NOT reset the conversation (contrast `mermaid`/`subAgents`/`toolExploration`, which all call `handleReset()`).
- Quality gates (run from repo root): `npm run lint-fix`, `npm run check-types`. Tests: `npm run test <path>`.
- Workspace packages must already be built for e2e (`lib-vuetify`, `lib-vue`); they are managed by the user — do not start/stop dev processes.
- Follow existing patterns: positive-stored flags, `data-testid` for e2e hooks, `t('key')` for copy.

---

### Task 1: Add the `simpleSubAgents` flag to agent-flags

**Files:**
- Modify: `ui/src/utils/agent-flags.ts`
- Test: `tests/features/traces/agent-flags.unit.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `AgentFlags` now has `simpleSubAgents: boolean`; `DEFAULT_FLAGS.simpleSubAgents === true`; `readFlags()` parses it default-on. Tasks 3 reads `initialFlags.simpleSubAgents`.

- [ ] **Step 1: Update the unit test to expect the new flag**

Replace the body of `tests/features/traces/agent-flags.unit.spec.ts` with:

```typescript
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFlags, serializeFlagsCookie, DEFAULT_FLAGS, FLAGS_COOKIE } from '../../../ui/src/utils/agent-flags.ts'

test.describe('agent flags cookie (unit)', () => {
  test('reads positive flags from a cookie string (simpleSubAgents default-on when absent)', () => {
    const cookie = `${FLAGS_COOKIE}=${encodeURIComponent(JSON.stringify({ toolExploration: true, subAgents: false, mermaid: true }))}`
    assert.deepEqual(readFlags(cookie), { toolExploration: true, subAgents: false, mermaid: true, simpleSubAgents: true })
  })
  test('reads simpleSubAgents:false explicitly', () => {
    const cookie = `${FLAGS_COOKIE}=${encodeURIComponent(JSON.stringify({ simpleSubAgents: false }))}`
    assert.equal(readFlags(cookie).simpleSubAgents, false)
  })
  test('falls back to defaults for absent/malformed cookie', () => {
    assert.deepEqual(readFlags('other=1'), DEFAULT_FLAGS)
    assert.deepEqual(readFlags(`${FLAGS_COOKIE}=not-json`), DEFAULT_FLAGS)
  })
  test('defaults: subAgents + simpleSubAgents on, others off', () => {
    assert.deepEqual(DEFAULT_FLAGS, { toolExploration: false, subAgents: true, mermaid: false, simpleSubAgents: true })
  })
  test('serializes a service-scoped 1-year cookie', () => {
    const c = serializeFlagsCookie({ toolExploration: false, subAgents: true, mermaid: false, simpleSubAgents: true }, '/data-fair/agents/api')
    assert.match(c, new RegExp(`^${FLAGS_COOKIE}=`))
    assert.match(c, /Max-Age=31536000/)
    assert.match(c, /SameSite=Lax/)
    assert.match(c, /Path=\/data-fair\/agents; /)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test tests/features/traces/agent-flags.unit.spec.ts`
Expected: FAIL — `readFlags` returns objects without `simpleSubAgents`; `DEFAULT_FLAGS` deepEqual mismatch.

- [ ] **Step 3: Add the flag to `agent-flags.ts`**

In `ui/src/utils/agent-flags.ts`:

Add to the interface (after `mermaid: boolean`):
```typescript
export interface AgentFlags {
  toolExploration: boolean
  subAgents: boolean
  mermaid: boolean
  simpleSubAgents: boolean
}
```

Update the default (default-on):
```typescript
export const DEFAULT_FLAGS: AgentFlags = { toolExploration: false, subAgents: true, mermaid: false, simpleSubAgents: true }
```

Update the parse in `readFlags` (the `return` inside the `if (v && typeof v === 'object')` block):
```typescript
        return { toolExploration: !!v.toolExploration, subAgents: v.subAgents !== false, mermaid: !!v.mermaid, simpleSubAgents: v.simpleSubAgents !== false }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test tests/features/traces/agent-flags.unit.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add ui/src/utils/agent-flags.ts tests/features/traces/agent-flags.unit.spec.ts
git commit -m "feat(subagents): add default-on simpleSubAgents flag"
```

---

### Task 2: Remove the panel auto-open helper

**Files:**
- Modify: `ui/src/components/agent-chat/auto-scroll.ts`
- Test: `tests/features/chat-subagent/autoscroll.unit.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `latestSubAgentPanel` no longer exported (Task 4 stops importing it). `streamedLength` and `ScrollMessage` unchanged.

- [ ] **Step 1: Update the unit test — drop the `latestSubAgentPanel` describe block**

In `tests/features/chat-subagent/autoscroll.unit.spec.ts`:

Change the import line (remove `latestSubAgentPanel`):
```typescript
import { streamedLength, type ScrollMessage } from '../../../ui/src/components/agent-chat/auto-scroll.ts'
```

Delete the entire `test.describe('latestSubAgentPanel (auto-open target)', () => { ... })` block (the last describe, currently lines 76–108).

Update the file's top doc comment second bullet so it no longer mentions `latestSubAgentPanel` — replace the bullet starting `*   - `latestSubAgentPanel` must always point...` (through its closing line) with:
```
 *   - panels no longer auto-open; only `streamedLength` is exercised here.
```

- [ ] **Step 2: Run the test to confirm it still passes after dropping the block**

Run: `npm run test tests/features/chat-subagent/autoscroll.unit.spec.ts`
Expected: PASS — `streamedLength` cases only. (This is a removal, not a red→green cycle: the test no longer references `latestSubAgentPanel`; Step 4 verifies the source symbol is also gone.)

- [ ] **Step 3: Remove `latestSubAgentPanel` from `auto-scroll.ts`**

In `ui/src/components/agent-chat/auto-scroll.ts`, delete the entire `latestSubAgentPanel` function and its JSDoc block (currently lines 41–50):

```typescript
/**
 * Index of the latest sub-agent panel to keep open for a message...
 */
export function latestSubAgentPanel (message: ScrollMessage | undefined): number | undefined {
  const count = message?.toolInvocations?.filter(ti => ti.toolName.startsWith('subagent_')).length ?? 0
  return count > 0 ? count - 1 : undefined
}
```

Leave `streamedLength` and the `ScrollMessage` interface intact.

- [ ] **Step 4: Verify the symbol is gone and the test passes**

Run: `grep -rn "latestSubAgentPanel" ui tests`
Expected: no matches.

Run: `npm run test tests/features/chat-subagent/autoscroll.unit.spec.ts`
Expected: PASS (streamedLength cases only).

- [ ] **Step 5: Commit**

```bash
git add ui/src/components/agent-chat/auto-scroll.ts tests/features/chat-subagent/autoscroll.unit.spec.ts
git commit -m "refactor(subagents): drop panel auto-open helper"
```

---

### Task 3: Plumb the flag through AgentChat and the debug dialog

**Files:**
- Modify: `ui/src/components/AgentChat.vue`
- Modify: `ui/src/components/agent-chat/AgentChatDebugDialog.vue`
- Test (new): `tests/features/chat-subagent/chat-subagent-simplify.e2e.spec.ts`

**Interfaces:**
- Consumes: `initialFlags.simpleSubAgents` (Task 1).
- Produces: `AgentChat.vue` owns `simpleSubAgentsEnabled` ref, passes `:simple-sub-agents` to `<agent-chat-messages>` (Task 4 consumes the prop) and to `<agent-chat-debug-dialog>`, and handles `@update:simple-sub-agents` with `handleSimpleSubAgents` (persists, **no** reset). The dialog renders a Settings-tab switch emitting `update:simpleSubAgents`.

- [ ] **Step 1: Add the prop + emit to the debug dialog**

In `ui/src/components/agent-chat/AgentChatDebugDialog.vue`:

Add to `defineProps` (after `mermaid?: boolean`):
```typescript
  mermaid?: boolean
  simpleSubAgents?: boolean
```

Add to `defineEmits` (after the mermaid line):
```typescript
  'update:mermaid': [value: boolean]
  'update:simpleSubAgents': [value: boolean]
```

- [ ] **Step 2: Add the switch + help text + i18n to the Settings tab**

In the template, immediately after the mermaid `<v-switch>` block (the one ending `@update:model-value="(v: boolean | null) => $emit('update:mermaid', v ?? false)"` and its closing `/>`), insert:

```vue
              <df-tutorial-alert
                id="agent-settings-simple-subagents"
                :text="t('simpleSubAgentsHint')"
                :initial="false"
                persistent
              />
              <v-switch
                :model-value="simpleSubAgents"
                color="primary"
                density="compact"
                hide-details
                :label="t('simpleSubAgents')"
                @update:model-value="(v: boolean | null) => $emit('update:simpleSubAgents', v ?? true)"
              />
```

In the `<i18n>` block, add to `fr:` (alongside the other experimental keys):
```yaml
  simpleSubAgents: Affichage simplifié des sous-agents
  simpleSubAgentsHint: "Affiche les sous-agents délégués sous forme d'une simple puce de statut, au lieu d'un panneau de trace dépliable. Ce réglage ne réinitialise pas la conversation."
```

And to `en:`:
```yaml
  simpleSubAgents: Simplify sub-agent display
  simpleSubAgentsHint: "Shows delegated sub-agents as a simple status chip instead of an expandable trace panel. This setting does not reset the conversation."
```

- [ ] **Step 3: Own the ref and wire it in `AgentChat.vue`**

In `ui/src/components/AgentChat.vue` script, after `const mermaidEnabled = ref(initialFlags.mermaid)`:
```typescript
const simpleSubAgentsEnabled = ref(initialFlags.simpleSubAgents)
```

In `persistFlags()`, add the field:
```typescript
function persistFlags () {
  writeFlags({
    toolExploration: explorationEnabled.value,
    subAgents: subAgentsEnabled.value,
    mermaid: mermaidEnabled.value,
    simpleSubAgents: simpleSubAgentsEnabled.value
  }, $apiPath)
}
```

Add the handler (after `handleMermaid`). Note: presentation-only, so **no** `handleReset()`:
```typescript
function handleSimpleSubAgents (enabled: boolean) {
  simpleSubAgentsEnabled.value = enabled
  persistFlags()
  // Presentation-only: no conversation reset (unlike mermaid/subAgents/toolExploration).
}
```

In the template, add the prop to `<agent-chat-messages>` (after `:mermaid-enabled="mermaidEnabled"`):
```vue
        :mermaid-enabled="mermaidEnabled"
        :simple-sub-agents="simpleSubAgentsEnabled"
```

And to `<agent-chat-debug-dialog>` — add the prop (after `:mermaid="mermaidEnabled"`) and the handler (after `@update:mermaid="handleMermaid"`):
```vue
      :mermaid="mermaidEnabled"
      :simple-sub-agents="simpleSubAgentsEnabled"
      @update:tool-exploration="handleToolExploration"
      @update:sub-agents="handleSubAgents"
      @update:mermaid="handleMermaid"
      @update:simple-sub-agents="handleSimpleSubAgents"
```

> Note: `AgentChatMessages.vue` does not yet declare the `simpleSubAgents` prop (Task 4). Vue ignores an unknown bound prop at runtime, so the app still works; `check-types` passes because `AgentChat.vue` does not type-check the child's prop table. Task 4 adds the declaration.

- [ ] **Step 4: Write the toggle e2e spec**

Create `tests/features/chat-subagent/chat-subagent-simplify.e2e.spec.ts`:

```typescript
/**
 * E2E for the "Simplify sub-agent display" toggle (simpleSubAgents flag).
 *
 * The flag is ON by default and is presentation-only: toggling it must NOT
 * reset the conversation. The chip-vs-panel rendering itself is covered by the
 * panel-rendering tests; this spec pins the switch behaviour + no-reset.
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
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }
    }
  },
  quotas: defaultQuotas
}

const openSettings = async (page: Page) => {
  await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
  await page.getByRole('tab', { name: /Settings|Paramètres/ }).click()
}

test.describe('Sub-agent simplify toggle', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Switch is on by default and persists the off opt-out to the flags cookie', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await openSettings(page)

    const simplifySwitch = page.getByLabel(/Simplify sub-agent display|Affichage simplifié des sous-agents/)
    await expect(simplifySwitch).toBeChecked({ timeout: 5000 })

    await simplifySwitch.click()
    await expect
      .poll(async () => {
        const cookie = (await page.context().cookies()).find(c => c.name === 'agent-chat-flags')
        return cookie ? JSON.parse(decodeURIComponent(cookie.value)).simpleSubAgents : undefined
      }, { timeout: 5000 })
      .toBe(false)

    await page.reload()
    await openSettings(page)
    await expect(page.getByLabel(/Simplify sub-agent display|Affichage simplifié des sous-agents/)).not.toBeChecked({ timeout: 5000 })
  })

  test('Toggling does not reset the conversation', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    await page.getByPlaceholder('Type your message...').fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // Toggle the flag; the prior exchange must remain (no reset).
    await openSettings(page)
    await page.getByLabel(/Simplify sub-agent display|Affichage simplifié des sous-agents/).click()
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    await expect(page.locator('.assistant-content').last()).toContainText('world')
  })
})
```

- [ ] **Step 5: Run the spec, lint, type-check**

Run: `npm run test tests/features/chat-subagent/chat-subagent-simplify.e2e.spec.ts`
Expected: PASS (2 tests).

Run: `npm run lint-fix && npm run check-types`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add ui/src/components/AgentChat.vue ui/src/components/agent-chat/AgentChatDebugDialog.vue tests/features/chat-subagent/chat-subagent-simplify.e2e.spec.ts
git commit -m "feat(subagents): expose simplify toggle in chat settings"
```

---

### Task 4: Rewrite the sub-agent display in AgentChatMessages

**Files:**
- Modify: `ui/src/components/agent-chat/AgentChatMessages.vue`
- Modify: `tests/features/chat-subagent/chat-subagent.e2e.spec.ts`
- Modify: `tests/features/chat-subagent/chat-subagent-advanced.e2e.spec.ts`
- Modify: `tests/features/chat-subagent/chat-subagent-simplify.e2e.spec.ts` (extend)

**Interfaces:**
- Consumes: `simpleSubAgents` prop (Task 3 passes it).
- Produces (DOM contract for e2e):
  - Simple mode (default): each `subagent_*` invocation renders as a `v-chip` with `data-testid="subagent-chip"`, label from `subAgentTitle`. No `[data-testid="subagent-panel"]`.
  - Full mode (`simpleSubAgents` false): each renders a `v-alert` with `data-testid="subagent-panel"`, a clickable `[data-testid="subagent-panel-header"]`, a collapsed-by-default `[data-testid="subagent-panel-body"]` (shown via `v-show` when expanded), and an optional `[data-testid="subagent-activity"]` live label in the header. No `.v-expansion-panel` for sub-agents.

#### Part A — component rewrite

- [ ] **Step 1: Update imports**

In the `<script setup>` import block of `AgentChatMessages.vue`:

Replace:
```typescript
import { mdiCheck, mdiLoading, mdiArrowDown } from '@mdi/js'
import { streamedLength, latestSubAgentPanel } from './auto-scroll'
```
with:
```typescript
import { mdiLoading, mdiArrowDown, mdiSubdirectoryArrowRight, mdiChevronDown, mdiChevronUp } from '@mdi/js'
import { streamedLength } from './auto-scroll'
```

- [ ] **Step 2: Add the `simpleSubAgents` prop**

In `defineProps`, after `mermaidEnabled: boolean`:
```typescript
  mermaidEnabled: boolean
  simpleSubAgents: boolean
```

- [ ] **Step 3: Make `hasVisibleTools` simplify-aware**

Replace the `hasVisibleTools` helper:
```typescript
const hasVisibleTools = (message: ChatMessage) =>
  !!message.toolInvocations?.some(ti => ti.toolName !== EXPLORE_TOOL_NAME && (props.simpleSubAgents || !ti.toolName.startsWith('subagent_')))
```

- [ ] **Step 4: Replace panel open-state with a per-toolCallId expanded map**

Delete the `openPanels` block and its watcher (currently lines ~414–425):
```typescript
const openPanels = reactive<Record<number, number | undefined>>({})
const openPanelFor = (index: number) => openPanels[index]
const setOpenPanel = (index: number, v: number | undefined) => { openPanels[index] = v }
watch(
  () => [props.messages.length, latestSubAgentPanel(props.messages[props.messages.length - 1])] as const,
  ([length, panel]) => {
    if (!following.value) return
    for (const key in openPanels) delete openPanels[key]
    if (panel !== undefined) openPanels[length - 1] = panel
  },
  { immediate: true }
)
```

Replace with:
```typescript
// Sub-agent panels are collapsed by default and toggled manually, keyed by the
// delegating toolCallId so concurrent sub-agents expand/collapse independently.
const expanded = reactive<Record<string, boolean>>({})
const toggleExpanded = (toolCallId: string) => { expanded[toolCallId] = !expanded[toolCallId] }
const subAgentInvocations = (message: ChatMessage) =>
  message.toolInvocations?.filter(ti => ti.toolName.startsWith('subagent_')) ?? []
const chipLabel = (toolName: string) =>
  toolName.startsWith('subagent_') ? subAgentTitle(toolName) : props.toolTitle(toolName)
```

> `subAgentTitle` is defined later in the file; both `chipLabel` and the template call it, and function declarations hoist, so order is fine. If your linter flags use-before-define on the `const`, move the `subAgentTitle` declaration above this block.

- [ ] **Step 5: Replace the tool-chip row to include simplified sub-agent chips**

Replace the chip row block (currently lines ~57–85) with:
```vue
              <div
                v-if="hasVisibleTools(message) || isExploring(message)"
                class="mt-2"
              >
                <template
                  v-for="invocation in message.toolInvocations"
                  :key="invocation.toolCallId"
                >
                  <v-chip
                    v-if="invocation.toolName !== EXPLORE_TOOL_NAME && (simpleSubAgents || !invocation.toolName.startsWith('subagent_'))"
                    size="x-small"
                    :color="invocation.state === 'done' ? 'success' : 'warning'"
                    variant="tonal"
                    class="mr-1 mb-1"
                    :data-testid="invocation.toolName.startsWith('subagent_') ? 'subagent-chip' : 'tool-chip'"
                  >
                    {{ chipLabel(invocation.toolName) }}
                  </v-chip>
                </template>
                <!-- explore_tools is an internal step (deciding which tool to use): show a
                   placeholder skeleton chip while it runs; the real tool's chip then takes
                   its place in the next assistant message. The explore_tools name is never shown. -->
                <v-skeleton-loader
                  v-if="isExploring(message)"
                  type="chip"
                  :aria-label="t('findingTool')"
                  data-testid="explore-skeleton"
                  class="agent-chat__tool-skeleton d-inline-flex"
                />
              </div>
```

- [ ] **Step 6: Replace the sub-agent expansion-panels block with v-alert boxes**

Replace the whole sub-agent block (currently lines ~86–175, the `<!-- Sub-agent expandable sections -->` comment through the closing `</v-expansion-panels>` `</div>`) with:
```vue
              <!-- Full sub-agent panels (when the simplify flag is off): each
                   delegation is its own v-alert box, collapsed by default, with
                   its live activity shown in the header even while collapsed. -->
              <div
                v-if="!simpleSubAgents && subAgentInvocations(message).length"
                class="mt-2"
              >
                <v-alert
                  v-for="invocation in subAgentInvocations(message)"
                  :key="invocation.toolCallId"
                  :color="invocation.state === 'done' ? 'success' : 'warning'"
                  variant="tonal"
                  density="compact"
                  :icon="mdiSubdirectoryArrowRight"
                  class="agent-chat__subagent-alert mb-2"
                  data-testid="subagent-panel"
                >
                  <div
                    class="d-flex align-center agent-chat__subagent-header"
                    data-testid="subagent-panel-header"
                    @click="toggleExpanded(invocation.toolCallId)"
                  >
                    <span class="text-body-medium font-weight-medium">{{ subAgentTitle(invocation.toolName) }}</span>
                    <span
                      v-if="message.subAgentPanels?.[invocation.toolCallId]?.turn"
                      class="text-medium-emphasis text-caption ml-1"
                    >(tour {{ message.subAgentPanels[invocation.toolCallId].turn + 1 }})</span>
                    <span
                      v-if="isStreaming && index === messages.length - 1 && subAgentActivityLabel(invocation.toolCallId)"
                      class="d-flex align-center text-caption text-medium-emphasis font-italic ml-2"
                      data-testid="subagent-activity"
                    >
                      <v-icon
                        :icon="mdiLoading"
                        size="x-small"
                        class="agent-chat__spin mr-1"
                      />
                      {{ subAgentActivityLabel(invocation.toolCallId) }}
                    </span>
                    <v-spacer />
                    <v-icon
                      :icon="expanded[invocation.toolCallId] ? mdiChevronUp : mdiChevronDown"
                      size="small"
                    />
                  </div>
                  <v-expand-transition>
                    <div
                      v-show="expanded[invocation.toolCallId]"
                      data-testid="subagent-panel-body"
                      class="mt-2"
                    >
                      <div v-if="message.subAgentPanels?.[invocation.toolCallId]?.messages.length">
                        <div
                          v-for="(subMsg, subIdx) in message.subAgentPanels[invocation.toolCallId].messages"
                          :key="subIdx"
                          class="py-1"
                        >
                          <markdown-content
                            class="text-body-medium markdown-content"
                            :content="subMsg.content"
                            :streaming="isStreaming && index === messages.length - 1 && subIdx === message.subAgentPanels[invocation.toolCallId].messages.length - 1 && invocation.state !== 'done'"
                            :mermaid="mermaidEnabled"
                          />
                          <div
                            v-if="subMsg.toolInvocations?.length"
                            class="mt-1"
                          >
                            <v-chip
                              v-for="subInv in subMsg.toolInvocations"
                              :key="subInv.toolCallId"
                              size="x-small"
                              :color="subInv.state === 'done' ? 'success' : 'warning'"
                              variant="tonal"
                              class="mr-1 mb-1"
                            >
                              {{ toolTitle(subInv.toolName) }}
                            </v-chip>
                          </div>
                        </div>
                      </div>
                      <div
                        v-else-if="invocation.state === 'done'"
                        class="text-body-medium text-medium-emphasis"
                      >
                        {{ t('subAgentDone') }}
                      </div>
                    </div>
                  </v-expand-transition>
                </v-alert>
              </div>
```

- [ ] **Step 7: Swap the panel CSS for the alert header cursor**

In the `<style>` block, delete the two `.agent-chat__subagent-panels ...` rules (currently lines ~504–513):
```css
.agent-chat-message .agent-chat__subagent-panels .v-expansion-panel-text__wrapper { ... }
.agent-chat-message .agent-chat__subagent-panels .v-expansion-panel-title.v-expansion-panel-title--active { ... }
```

Add:
```css
.agent-chat-message .agent-chat__subagent-header {
  cursor: pointer;
}
```

- [ ] **Step 8: Lint + type-check the component**

Run: `npm run lint-fix && npm run check-types`
Expected: no errors. (If lint flags `subAgentActivityLabel`/`subAgentTitle` use-before-define, hoist those declarations above `chipLabel`/the template-helper block as noted in Step 4.)

#### Part B — update existing panel e2e to the new DOM

- [ ] **Step 9: Add a full-panel cookie seed + fix `chat-subagent.e2e.spec.ts`**

In `tests/features/chat-subagent/chat-subagent.e2e.spec.ts`:

Add a `Page` import and a seed helper near the top (after the existing imports):
```typescript
import type { Page } from '@playwright/test'

// Force the full v-alert panel rendering (simpleSubAgents off) before boot, so
// these tests can inspect the inner sub-agent trace. The default is chip-only.
const seedFullPanelCookie = (page: Page) => page.addInitScript(() => {
  const flags = { toolExploration: false, subAgents: true, mermaid: false, simpleSubAgents: false }
  document.cookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify(flags))}; path=/`
})
```

Rewrite the `'Main agent can delegate to sub-agent'` test to assert the default **chip** (simple mode is on by default):
```typescript
  test('Main agent delegates to a sub-agent (simplified chip)', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_analyst {"task":"hello"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // Default simple mode: the delegation renders as a chip, not a panel.
    await expect(page.getByTestId('subagent-chip').filter({ hasText: 'Data Analyst' }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('subagent-panel')).toHaveCount(0)
  })
```

Rewrite the `'Sub-agent can use reserved tools'` test to seed full mode and use the new panel DOM:
```typescript
  test('Sub-agent can use reserved tools (full panel)', async ({ page, goToWithAuth }) => {
    await seedFullPanelCookie(page)
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_analyst {"task":"call tool get_schema {\\"dataset\\":\\"test\\"}"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // The sub-agent panel appears and is collapsed by default (no auto-open).
    const panel = page.locator('.agent-chat').getByTestId('subagent-panel').first()
    await expect(panel).toBeVisible({ timeout: 15000 })
    await expect(panel.getByTestId('subagent-panel-body')).toBeHidden()

    // Wait for the turn to settle on the trailing "done" text.
    await expect(page.locator('.agent-chat').getByText('done', { exact: true }).first()).toBeVisible({ timeout: 15000 })

    // Expand manually and verify the reserved get_schema tool chip is inside the body.
    await panel.getByTestId('subagent-panel-header').click()
    const body = panel.getByTestId('subagent-panel-body')
    await expect(body).toBeVisible({ timeout: 5000 })
    await expect(body.locator('.v-chip', { hasText: 'get_schema' }).first()).toBeVisible({ timeout: 5000 })
  })
```

- [ ] **Step 10: Fix `chat-subagent-advanced.e2e.spec.ts`**

In `tests/features/chat-subagent/chat-subagent-advanced.e2e.spec.ts`:

Add the same seed helper near the top (after imports):
```typescript
import type { Page } from '@playwright/test'

const seedFullPanelCookie = (page: Page) => page.addInitScript(() => {
  const flags = { toolExploration: false, subAgents: true, mermaid: false, simpleSubAgents: false }
  document.cookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify(flags))}; path=/`
})
```

**`'Subagent multi-step tool chain (get_schema → query_data → summary)'`** — seed full mode and replace the panel selectors. Replace the test body from `await goToWithAuth(...)` onward with:
```typescript
    await seedFullPanelCookie(page)
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    await sendMessage(page, 'call tool subagent_data_analyst {"task":"analyze the data"}')

    const panel = page.locator('.agent-chat').getByTestId('subagent-panel').first()
    await expect(panel).toBeVisible({ timeout: 15000 })

    // Turn ends on the trailing main-agent "done"; the panel stays collapsed (no auto-open).
    await expect(page.locator('.agent-chat-message .assistant-content').last()).toHaveText('done', { timeout: 15000 })
    await expect(panel.getByTestId('subagent-panel-body')).toBeHidden()

    // Expand to inspect the chain it ran.
    await panel.getByTestId('subagent-panel-header').click()
    const body = panel.getByTestId('subagent-panel-body')
    await expect(body.locator('.v-chip', { hasText: 'get_schema' }).first()).toBeVisible({ timeout: 10000 })
    await expect(body.getByText('Analysis complete')).toBeVisible({ timeout: 10000 })
```

**`'Subagent works across multiple user messages'`** — seed full mode; assert two panels, both collapsed by default. Replace the body from `await goToWithAuth(...)`:
```typescript
    await seedFullPanelCookie(page)
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    await sendMessage(page, 'call tool subagent_data_analyst {"task":"hello"}')
    await expect(page.locator('.agent-chat').getByTestId('subagent-panel').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    await sendMessage(page, 'call tool subagent_data_analyst {"task":"hello"}')

    // One panel per user message.
    await expect(page.locator('.agent-chat').getByTestId('subagent-panel')).toHaveCount(2, { timeout: 15000 })
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    // Panels never auto-open: both bodies stay collapsed.
    await expect(page.locator('.agent-chat').getByTestId('subagent-panel-body').first()).toBeHidden()
    await expect(page.locator('.agent-chat').getByTestId('subagent-panel-body').last()).toBeHidden()
```

**`'Mixed main agent tools and subagent delegation'`** — default simple mode; the delegation is a chip. Replace the final two assertions (the `Data Analyst` visibility + output check) with:
```typescript
    await sendMessage(page, 'call tool subagent_data_analyst {"task":"hello"}')
    await expect(page.locator('.agent-chat').getByTestId('subagent-chip').filter({ hasText: 'Data Analyst' }).first()).toBeVisible({ timeout: 15000 })

    await expect(page.getByLabel('Output')).toHaveValue('step1')
```

**`'Subagent trace appears on the review page'`** — chat-side delegation; default simple mode renders a chip. Replace the line:
```typescript
    await expect(page.locator('.agent-chat').getByText('Data Analyst').first()).toBeVisible({ timeout: 15000 })
```
with:
```typescript
    await expect(page.locator('.agent-chat').getByTestId('subagent-chip').filter({ hasText: 'Data Analyst' }).first()).toBeVisible({ timeout: 15000 })
```
(The review-page assertions below — `.agent-chat__trace-panels` — are unrelated to the chat UI and stay unchanged.)

**`'Two sub-agents delegated in one step render separate panels concurrently'`** — seed full mode; panels are now independent v-alert boxes (no accordion), so both can be open at once. Replace the body from `await goToWithAuth(...)`:
```typescript
    await seedFullPanelCookie(page)
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForToolsReady(page, 'data_analyst (2 tools)', true)

    await sendMessage(page, 'parallel subagents')

    const chat = page.locator('.agent-chat')
    const analystPanel = chat.getByTestId('subagent-panel').filter({ hasText: 'Data Analyst' }).first()
    const summarizerPanel = chat.getByTestId('subagent-panel').filter({ hasText: 'Data Summarizer' }).first()
    await expect(analystPanel).toBeVisible({ timeout: 15000 })
    await expect(summarizerPanel).toBeVisible({ timeout: 15000 })

    // Turn settles on the trailing main-agent "done" text.
    await expect(chat.getByText('done', { exact: true }).first()).toBeVisible({ timeout: 15000 })

    // Independent boxes (no single-open accordion): expand BOTH and verify each
    // shows its OWN transcript (proves no shared-array clobber).
    await analystPanel.getByTestId('subagent-panel-header').click()
    await summarizerPanel.getByTestId('subagent-panel-header').click()
    await expect(analystPanel.getByTestId('subagent-panel-body').getByText('Analysis complete', { exact: false })).toBeVisible({ timeout: 5000 })
    await expect(summarizerPanel.getByTestId('subagent-panel-body').getByText('Summary', { exact: false })).toBeVisible({ timeout: 5000 })
```

**`'Compaction works during subagent conversation'`** — default simple mode; replace the `Data Analyst` panel-visibility line:
```typescript
    await expect(page.locator('.agent-chat').getByTestId('subagent-chip').filter({ hasText: 'Data Analyst' }).first()).toBeVisible({ timeout: 15000 })
```
(the rest of that test only checks `world` after compaction and is unchanged.)

- [ ] **Step 11: Extend the simplify e2e with chip↔panel rendering**

Append to `tests/features/chat-subagent/chat-subagent-simplify.e2e.spec.ts` (inside the `describe`), a test that flips the flag off via the cookie and asserts the panel replaces the chip:

```typescript
  test('Simple mode renders a chip; full mode renders a collapsed panel', async ({ page, goToWithAuth }) => {
    // Default (simple) mode: chip, no panel.
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(page.locator('.v-dialog .v-window-item--active').getByText('data_analyst (2 tools)')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_analyst {"task":"hello"}')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.getByTestId('subagent-chip').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('subagent-panel')).toHaveCount(0)

    // Turn off simplify and re-run: now a collapsed panel appears.
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: /Settings|Paramètres/ }).click()
    await page.getByLabel(/Simplify sub-agent display|Affichage simplifié des sous-agents/).click()
    await page.getByRole('button', { name: /Close|Fermer/ }).click()
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_analyst {"task":"hello"}')
    await page.getByRole('button', { name: 'Send' }).click()
    const panel = page.getByTestId('subagent-panel').first()
    await expect(panel).toBeVisible({ timeout: 15000 })
    await expect(panel.getByTestId('subagent-panel-body')).toBeHidden()
    await panel.getByTestId('subagent-panel-header').click()
    await expect(panel.getByTestId('subagent-panel-body')).toBeVisible({ timeout: 5000 })
  })
```

> **Testing note (no silent cap):** the closed-state *live activity label* (`data-testid="subagent-activity"`) is implemented in the header but is **not** asserted in a dedicated e2e — with the mock provider the running phase flashes too briefly to catch deterministically, and the repo has a history of de-flaking these panels. It is exercised indirectly (the header renders whether collapsed or not) and verified manually. Do not add a timing-dependent assertion for it.

- [ ] **Step 12: Run the full sub-agent e2e suite + quality gates**

Run: `npm run test tests/features/chat-subagent/`
Expected: PASS — `chat-subagent.e2e`, `chat-subagent-advanced.e2e`, `chat-subagent-flatten.e2e` (unchanged — flat mode shows chips/no-panel regardless of the new flag), `chat-subagent-simplify.e2e`, plus the two unit specs.

Run: `npm run lint-fix && npm run check-types`
Expected: no errors.

- [ ] **Step 13: Commit**

```bash
git add ui/src/components/agent-chat/AgentChatMessages.vue tests/features/chat-subagent/
git commit -m "feat(subagents): v-alert panels, no auto-open, simplified chip mode"
```

---

### Task 5: Documentation + full verification

**Files:**
- Modify: `docs/architecture/sub-agents.md`

- [ ] **Step 1: Update the architecture doc**

In `docs/architecture/sub-agents.md`, update Section 5 (Context Reduction) / the data-structures notes that describe "collapsible panels" to reflect the new behaviour. Replace the sentence in §6 that reads:

> The full trace is visible in the UI via `ChatMessage.subAgentMessages`, rendered in collapsible panels.

with:

> The full trace is visible in the UI via `ChatMessage.subAgentPanels`, rendered per delegating tool-call as a `v-alert` box that is **collapsed by default** and expanded on demand. A per-user **"Simplify sub-agent display"** flag (`simpleSubAgents`, on by default) instead renders each delegation as a plain status chip, like any other tool call; the full-panel view is the opt-in. Panels no longer auto-open.

- [ ] **Step 2: Run the broader e2e that touch the dev chat page (regression guard)**

Run: `npm run test tests/features/chat-subagent/ tests/features/trace-debug/ tests/features/traces/`
Expected: PASS (trace-debug uses `set_display`, not sub-agent panels; traces unit covers the flag).

- [ ] **Step 3: Final quality gates**

Run: `npm run lint-fix && npm run check-types`
Expected: no errors.

Run: `docker build -t agents .`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add docs/architecture/sub-agents.md
git commit -m "docs(subagents): document v-alert panels + simplify flag"
```

---

## Self-Review

**Spec coverage:**
- "Stop auto-opening" → Task 2 (remove helper) + Task 4 Step 4 (remove watcher, collapsed-by-default) + e2e assert `subagent-panel-body` hidden.
- "v-alert container + subtask icon (`mdiSubdirectoryArrowRight`)" → Task 4 Step 6.
- "Closed-state activity in header" → Task 4 Step 6 (activity `<span>` is a header sibling, rendered regardless of expand) + testing note in Step 11.
- "Independent expand for concurrent sub-agents" → Task 4 Step 4 (`expanded` keyed by toolCallId) + Task 4 Step 10 parallel-panels test.
- "Simplify flag, default on, renders a tool chip, no reset" → Task 1 (flag + default), Task 3 (plumbing + no-reset handler + toggle e2e), Task 4 (chip rendering + chip↔panel e2e).
- "Unit/e2e test impacts" → Tasks 1, 2, 4.

**Placeholder scan:** none — every step has concrete code/commands.

**Type consistency:** prop `simpleSubAgents: boolean` is declared in `AgentChatMessages` (Task 4 Step 2), passed in `AgentChat.vue` (Task 3 Step 3), and on the dialog as `simpleSubAgents?: boolean` (Task 3 Step 1). Flag key `simpleSubAgents` is identical across `agent-flags.ts`, `persistFlags`, props, emits, and the cookie payloads in the e2e seeds. Helpers (`subAgentInvocations`, `chipLabel`, `toggleExpanded`, `expanded`) are defined once in Task 4 Step 4 and referenced consistently.
