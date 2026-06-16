# Flatten Sub-Agents Toggle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only experimental toggle that flattens sub-agents — exposing every reserved tool directly to the main agent and turning each `subagent_*` pseudo-tool into a no-arg "guidance" tool that returns its own prompt — without delegation, separate models, or sub-agent panels.

**Architecture:** Mirror the existing tool-exploration toggle exactly (admin-only, `localStorage` key, debug-dialog switch, reset-on-change). The only behavioral change is a branch in `useAgentChat`'s `sendMessage`: when flattening is on, keep reserved tools in the main set and register each sub-agent as a plain guidance tool under its de-prefixed name instead of building a `ToolLoopAgent`. The flatten toggle is orthogonal to (and composes with) tool-exploration.

**Tech Stack:** Vue 3 `<script setup>`, Vuetify, Vercel AI SDK v6 (`tool`, `jsonSchema`), Playwright e2e with a mock LLM provider.

**Reference spec:** `docs/superpowers/specs/2026-06-16-flatten-subagents-design.md`

---

## File Structure

- `ui/src/composables/use-agent-chat.ts` — option `flattenSubAgents`, live getter, setter, `resolveSubAgents` `keepReservedTools` param, `sendMessage` flat branch. (Core logic.)
- `ui/src/components/agent-chat/AgentChatDebugDialog.vue` — second Settings-tab switch, prop, emit, i18n. (Toggle UI.)
- `ui/src/components/AgentChat.vue` — `flattenEnabled` ref, option pass-through, handler, dialog binding. (Wiring.)
- `tests/features/chat-subagent/chat-subagent-flatten.e2e.spec.ts` — e2e coverage. (Tests.)
- `docs/architecture/sub-agents.md` — short note documenting the flatten toggle. (Docs.)

Implementation order: tests first (Task 1, RED) → composable (Tasks 2-4) → dialog (Task 5) → AgentChat wiring (Task 6) → run green + checks (Task 7) → docs (Task 8). The e2e tests go green only after Task 6; intermediate tasks are kept type-checkable.

---

## Task 1: Write the failing e2e tests

**Files:**
- Create: `tests/features/chat-subagent/chat-subagent-flatten.e2e.spec.ts`

- [ ] **Step 1: Write the e2e spec**

Create `tests/features/chat-subagent/chat-subagent-flatten.e2e.spec.ts`:

```ts
/**
 * E2E tests for the experimental "flatten sub-agents" toggle.
 *
 * When flattening is on:
 *  - reserved sub-agent tools (get_schema, query_data) are callable by the MAIN agent;
 *  - the sub-agent becomes a no-arg guidance tool registered under its de-prefixed name
 *    (data_analyst), rendered as an ordinary chip — never a sub-agent expansion panel.
 *
 * The mock model responds to:
 *   "hello"                          → "world"
 *   "call tool <name> <json-args>"   → tool call
 *   anything else                    → "what do you mean ?"
 */

import { expect } from '@playwright/test'
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

test.describe('Chat Sub-Agent Flatten toggle', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Flatten switch is visible and persists to localStorage', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    // Open the debug dialog, go to the Settings tab
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: /Settings|Paramètres/ }).click()

    const flattenSwitch = page.getByLabel(/Flatten sub-agents|Aplatir les sous-agents/)
    await expect(flattenSwitch).toBeVisible({ timeout: 5000 })

    await flattenSwitch.click()
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('agent-chat-flatten')), { timeout: 5000 })
      .toBe('1')
  })

  test('Flat mode: main agent calls a reserved tool directly, no sub-agent panel', async ({ page, goToWithAuth }) => {
    // Pre-enable flatten before the app boots (admin-only localStorage opt-in)
    await page.addInitScript(() => localStorage.setItem('agent-chat-flatten', '1'))
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    // Wait until tools are discovered (set_display always exists on the main agent)
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(page.locator('.v-dialog .v-window-item--active').getByRole('button', { name: 'set_display' }))
      .toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    // get_schema is a RESERVED tool — only reachable from the main agent when flattened
    await page.getByPlaceholder('Type your message...').fill('call tool get_schema {"dataset":"test"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // A get_schema chip appears in the MAIN message flow
    await expect(page.locator('.agent-chat .v-chip').filter({ hasText: 'get_schema' }).first())
      .toBeVisible({ timeout: 15000 })
    // And no sub-agent expansion panel is created
    await expect(page.locator('.agent-chat .v-expansion-panel')).toHaveCount(0)
  })

  test('Flat mode: the sub-agent is exposed as a de-prefixed guidance tool', async ({ page, goToWithAuth }) => {
    await page.addInitScript(() => localStorage.setItem('agent-chat-flatten', '1'))
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(page.locator('.v-dialog .v-window-item--active').getByRole('button', { name: 'set_display' }))
      .toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    // The guidance tool is registered as "data_analyst" (no subagent_ prefix)
    await page.getByPlaceholder('Type your message...').fill('call tool data_analyst {}')
    await page.getByRole('button', { name: 'Send' }).click()

    // Renders as an ordinary chip, never a "Data Analyst" expansion panel
    await expect(page.locator('.agent-chat .v-chip').filter({ hasText: 'data_analyst' }).first())
      .toBeVisible({ timeout: 15000 })
    await expect(page.locator('.agent-chat .v-expansion-panel')).toHaveCount(0)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test tests/features/chat-subagent/chat-subagent-flatten.e2e.spec.ts`
Expected: FAIL — the "Flatten sub-agents" switch does not exist yet (first test times out finding the label); flat-mode tests fail because reserved tools are still removed from the main set and the sub-agent still renders as a panel.

> If it fails with a connection error instead, run `bash dev/status.sh` and stop — the dev environment is down. Also confirm workspace packages are built (`ls lib-vue/*.js lib-vuetify/*.js`); rebuild with `cd lib-vuetify && npm run build` then `cd lib-vue && npm run build` if missing.

- [ ] **Step 3: Commit**

```bash
git add tests/features/chat-subagent/chat-subagent-flatten.e2e.spec.ts
git commit -m "test(chat-subagent): failing e2e for flatten-subagents toggle"
```

---

## Task 2: Composable — option, getter, setter

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts` (option ~line 61; getter ~line 137; setter ~line 669; return ~line 673)

- [ ] **Step 1: Add the option to `UseAgentChatOptions`**

In the options interface, directly after the `toolExploration?: boolean` line:

```ts
  toolExploration?: boolean
  flattenSubAgents?: boolean
```

- [ ] **Step 2: Add the live getter**

Directly after the `explorationEnabled` getter (the `const explorationEnabled = () => !!options.toolExploration` line and its comment):

```ts
  // Read live like explorationEnabled so toggling takes effect on the next turn;
  // callers flip it via setFlattenSubAgents + reset.
  const flatteningEnabled = () => !!options.flattenSubAgents
```

- [ ] **Step 3: Add the setter and export it**

Directly after the existing `setToolExploration` function:

```ts
  const setToolExploration = (enabled: boolean) => {
    options.toolExploration = enabled
  }

  const setFlattenSubAgents = (enabled: boolean) => {
    options.flattenSubAgents = enabled
  }
```

Then add `setFlattenSubAgents` to the returned object on the `return { ... }` line, after `setToolExploration`:

```ts
  return { messages, status, error, tools, toolsVersion, resolvedPartition, conversationId, sendMessage, abort, reset, setSystemPrompt, setToolExploration, setFlattenSubAgents }
```

- [ ] **Step 4: Type-check**

Run: `npm run check-types`
Expected: PASS (no usages of the new symbols yet besides the definition; `flatteningEnabled` is referenced in Task 4 — until then it may be flagged unused by lint, not by the type-checker. If `npm run lint` flags it as unused, proceed; Task 4 consumes it. To keep the commit lint-clean, do Tasks 2-4 before committing — see Task 4 Step 4.)

(No commit here — see Task 4.)

---

## Task 3: Composable — `resolveSubAgents` keepReservedTools

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts` (`resolveSubAgents`, ~lines 301-328)

- [ ] **Step 1: Add the `keepReservedTools` option**

Change the `resolveSubAgents` signature and guard the reserved-tool deletion. Replace:

```ts
  async function resolveSubAgents (
    mainTools: Record<string, Tool>,
    subAgents: Record<string, { tool: Tool, config: SubAgentConfig }>
  ) {
```

with:

```ts
  async function resolveSubAgents (
    mainTools: Record<string, Tool>,
    subAgents: Record<string, { tool: Tool, config: SubAgentConfig }>,
    opts?: { keepReservedTools?: boolean }
  ) {
```

Then wrap the reserved-tool removal loop. Replace:

```ts
        // Remove reserved tools from main set
        for (const reservedName of entry.config.tools) {
          delete mainTools[reservedName]
        }
```

with:

```ts
        // Remove reserved tools from main set — unless flattening, where they stay
        // callable by the main agent directly.
        if (!opts?.keepReservedTools) {
          for (const reservedName of entry.config.tools) {
            delete mainTools[reservedName]
          }
        }
```

- [ ] **Step 2: Type-check**

Run: `npm run check-types`
Expected: PASS (the existing call site `resolveSubAgents(mainTools, subAgents)` still type-checks — `opts` is optional. Task 4 updates that call site.)

(No commit here — see Task 4.)

---

## Task 4: Composable — `sendMessage` flat branch

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts` (`sendMessage`, ~lines 427-448)

- [ ] **Step 1: Pass the flatten flag to `resolveSubAgents`**

Replace:

```ts
      // Resolve sub-agent configs and remove their reserved tools from mainTools
      await resolveSubAgents(mainTools, subAgents)
```

with:

```ts
      // Flat mode keeps reserved tools in the main set and turns sub-agents into
      // no-arg guidance tools (experimental flatten toggle).
      const flatten = flatteningEnabled()
      await resolveSubAgents(mainTools, subAgents, { keepReservedTools: flatten })
```

- [ ] **Step 2: Branch the sub-agent build loop**

Inside `for (const [name, entry] of Object.entries(subAgents)) {`, immediately after `const config = entry.config`, insert the flat branch (before the `// Collect the sub-agent's tools` line):

```ts
        const config = entry.config

        if (flatten) {
          // Flattened: register the sub-agent as a no-arg guidance tool that returns its
          // own prompt, under the de-prefixed name so AgentChatMessages renders it as an
          // ordinary chip (not an empty sub-agent panel — panel rendering keys off the
          // `subagent_` prefix). Reserved tools are already exposed flat, so the main agent
          // reads the brief and then drives them itself in the same loop.
          const flatName = name.replace(/^subagent_/, '')
          mainLLMTools[flatName] = tool({
            description: (entry.tool as any).description || '',
            inputSchema: jsonSchema({ type: 'object', properties: {}, additionalProperties: false }),
            execute: async () => config.prompt
          })
          continue
        }

        // Collect the sub-agent's tools from the full tool set
```

This leaves the entire delegated-mode build (ToolLoopAgent, async generator, `toModelOutput`, the `subAgentHistory`/`subAgentCallCount` maps) untouched and unreached when flattening.

- [ ] **Step 3: Type-check and lint**

Run: `npm run check-types && npm run lint`
Expected: PASS. `flatteningEnabled`, `tool`, and `jsonSchema` are all now used (`tool`/`jsonSchema` were already imported for the delegated path).

- [ ] **Step 4: Commit Tasks 2-4 together**

```bash
git add ui/src/composables/use-agent-chat.ts
git commit -m "feat(chat): flatten sub-agents into a flat tool set behind a flag"
```

---

## Task 5: Debug dialog — flatten switch

**Files:**
- Modify: `ui/src/components/agent-chat/AgentChatDebugDialog.vue` (switch ~line 159; i18n ~lines 179/191; props ~line 211; emits ~line 216)

- [ ] **Step 1: Add the second switch under the exploration one**

Directly after the tool-exploration switch's hint `</p>` (the `{{ t('toolExplorationHint') }}` paragraph, ~line 159), add:

```html
              <v-switch
                :model-value="flattenSubAgents"
                color="primary"
                density="compact"
                hide-details
                :label="t('flatten')"
                class="mt-2"
                @update:model-value="$emit('update:flattenSubAgents', $event ?? false)"
              />
              <p class="text-caption text-medium-emphasis mt-1">
                {{ t('flattenHint') }}
              </p>
```

- [ ] **Step 2: Add the prop**

In `defineProps`, after `toolExploration?: boolean`:

```ts
  toolExploration?: boolean
  flattenSubAgents?: boolean
```

- [ ] **Step 3: Add the emit**

In `defineEmits`, after `'update:toolExploration': [value: boolean]`:

```ts
  'update:toolExploration': [value: boolean]
  'update:flattenSubAgents': [value: boolean]
```

- [ ] **Step 4: Add i18n keys (fr then en)**

In the `fr:` block, after the `toolExplorationHint:` line:

```yaml
  flatten: Aplatir les sous-agents (expérimental)
  flattenHint: "Expose tous les outils des sous-agents directement à l'assistant au lieu de déléguer. Chaque sous-agent devient un outil de consigne qui renvoie son prompt. Changer ce réglage réinitialise la conversation."
```

In the `en:` block, after the `toolExplorationHint:` line:

```yaml
  flatten: Flatten sub-agents (experimental)
  flattenHint: "Exposes every sub-agent tool directly to the assistant instead of delegating. Each sub-agent becomes a guidance tool that returns its prompt. Changing this setting resets the conversation."
```

- [ ] **Step 5: Type-check and lint**

Run: `npm run check-types && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ui/src/components/agent-chat/AgentChatDebugDialog.vue
git commit -m "feat(chat): add flatten-subagents switch to debug settings"
```

---

## Task 6: AgentChat wiring

**Files:**
- Modify: `ui/src/components/AgentChat.vue` (dialog binding ~lines 58-59; ref ~line 148; option ~line 156; handler ~line 265)

- [ ] **Step 1: Add the `flattenEnabled` ref**

Directly after the `explorationEnabled` ref (`const explorationEnabled = ref(...)`, ~line 148):

```ts
// Experimental flatten-subagents mode: admin-only opt-in, persisted in localStorage
// and toggled from the debug dialog's Settings tab.
const flattenEnabled = ref(!!props.isAdmin && localStorage.getItem('agent-chat-flatten') === '1')
```

- [ ] **Step 2: Pass the option to `useAgentChat`**

In the `useAgentChat({ ... })` call, after `toolExploration: explorationEnabled.value`:

```ts
  toolExploration: explorationEnabled.value,
  flattenSubAgents: flattenEnabled.value
```

- [ ] **Step 3: Add the handler**

Directly after `handleToolExploration` (the function ending at ~line 265):

```ts
function handleFlattenSubAgents (enabled: boolean) {
  flattenEnabled.value = enabled
  if (enabled) localStorage.setItem('agent-chat-flatten', '1')
  else localStorage.removeItem('agent-chat-flatten')
  chat.setFlattenSubAgents(enabled)
  // Reset the conversation so the new tool set applies from a clean state.
  handleReset()
}
```

- [ ] **Step 4: Bind the dialog prop/event**

In the `<agent-chat-debug-dialog ...>` element, after the two `tool-exploration` lines:

```html
      :tool-exploration="explorationEnabled"
      @update:tool-exploration="handleToolExploration"
      :flatten-sub-agents="flattenEnabled"
      @update:flatten-sub-agents="handleFlattenSubAgents"
```

- [ ] **Step 5: Type-check and lint**

Run: `npm run check-types && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ui/src/components/AgentChat.vue
git commit -m "feat(chat): wire flatten-subagents toggle through AgentChat"
```

---

## Task 7: Run the e2e tests green + full checks

**Files:** none (verification only)

- [ ] **Step 1: Ensure workspace packages are built**

Run: `ls lib-vuetify/*.js lib-vue/*.js`
Expected: compiled `.js` files exist. If not:
`cd lib-vuetify && npm run build` then `cd lib-vue && npm run build`.

- [ ] **Step 2: Run the flatten e2e spec**

Run: `npm run test tests/features/chat-subagent/chat-subagent-flatten.e2e.spec.ts`
Expected: PASS — all three tests green.

> On failure, follow AGENTS.md e2e debugging order: verify workspace builds, then use the Playwright MCP tools (`browser_open`, `browser_navigate`, `browser_snapshot`, `browser_console_messages`) to inspect the failing page, then check `test-results/`.

- [ ] **Step 3: Run the existing sub-agent spec for regression**

Run: `npm run test tests/features/chat-subagent/chat-subagent.e2e.spec.ts`
Expected: PASS — delegated mode unchanged (flatten defaults off).

- [ ] **Step 4: Full lint + types**

Run: `npm run lint-fix && npm run check-types`
Expected: PASS (0 errors; pre-existing `v-html` warnings in `AgentChatMessages.vue` are acceptable).

- [ ] **Step 5: Commit any lint-fix changes**

```bash
git add -A
git commit -m "chore: lint-fix flatten-subagents changes" || echo "nothing to commit"
```

---

## Task 8: Document the toggle

**Files:**
- Modify: `docs/architecture/sub-agents.md`

- [ ] **Step 1: Add a "Flatten mode" note**

Append a short section at the end of `docs/architecture/sub-agents.md`:

```markdown
---

## 8. Flatten mode (experimental)

An admin-only opt-in (`localStorage` key `agent-chat-flatten`, toggled from the chat debug
dialog's Settings tab) replaces delegation with flat tool exposure. When on, `sendMessage`:

- keeps each sub-agent's reserved tools in the main tool set (`resolveSubAgents` is called
  with `keepReservedTools`), so the main agent calls them directly;
- registers each `subagent_*` as a no-arg **guidance tool** under its de-prefixed name
  (`data_analyst`), whose `execute()` returns the sub-agent's own prompt. No `ToolLoopAgent`,
  separate model, multi-turn history, `toModelOutput` summary, or sub-agent UI panel.

It exists to A/B whether a flat tool surface yields better tool use than delegation. It is
orthogonal to and composes with [tool-exploration](./tool-exploration.md): the flat set is
gated behind `explore_tools` the same way the delegated set is.

**Key files:**
- `ui/src/composables/use-agent-chat.ts` — `flatteningEnabled`, `sendMessage` flat branch
- `ui/src/components/AgentChat.vue` — `agent-chat-flatten` toggle handler
- `ui/src/components/agent-chat/AgentChatDebugDialog.vue` — the Settings-tab switch
```

- [ ] **Step 2: Commit**

```bash
git add docs/architecture/sub-agents.md
git commit -m "docs(sub-agents): document the experimental flatten mode"
```

---

## Self-review notes

- **Spec coverage:** toggle wiring (Tasks 5-6), flat reserved-tool exposure (Tasks 3-4), guidance tool with de-prefixed name & no args (Task 4), exploration composition (unchanged code path — no task needed, verified by inspection), testing (Tasks 1, 7), docs (Task 8). All spec sections mapped.
- **Type consistency:** option `flattenSubAgents`, getter `flatteningEnabled`, setter `setFlattenSubAgents`, local `flatten`, `resolveSubAgents` opt `keepReservedTools`, localStorage key `agent-chat-flatten`, dialog prop `flattenSubAgents` / event `update:flattenSubAgents`, i18n keys `flatten`/`flattenHint` — used consistently across all tasks.
- **No placeholders:** every code step shows full content.
