# Tool Exploration Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a togglable "progressive tool disclosure" mode where the assistant sees only a constant `explore_tools` tool plus a catalog of tool *names*, and must call `explore_tools` (which runs the summarizer to select relevant tools) to promote real tools into the callable set.

**Architecture:** The full tool registry is passed to `streamText`, but `activeTools` (via `prepareStep`) gates which tools are exposed to the model each step — starting with just `explore_tools` (+ sub-agent pseudo-tools). `explore_tools.execute` runs the summarizer over the full registry and promotes selected tools into a `promotedTools` set that `prepareStep` reads on the next step. The set is cleared on history compaction. The tool-name catalog is folded into the system text at stream time. The whole mode is gated by `debug` + `sessionStorage['agent-chat-explore'] === '1'`, mirroring the existing tracing toggle.

**Tech Stack:** Vue 3 + TypeScript, AI SDK v6 (`ai@6.0.116`, `@ai-sdk/openai`), Vitest/Playwright (unit/api/e2e projects).

---

## Background / verified facts (read before starting)

- Chat loop: `ui/src/composables/use-agent-chat.ts`. The `streamText` call is at lines 562-573; tool assembly (partition → resolve sub-agents → build `mainLLMTools`) is at lines 432-559; history compaction is `compactHistory` (lines 370-406); `reset` is lines 295-305.
- `ai@6.0.116` supports `streamText({ prepareStep, activeTools })`. `prepareStep` returns `PrepareStepResult` whose `activeTools?: Array<keyof TOOLS>` limits the tools exposed for that step. Confirmed in `node_modules/ai/dist/index.d.ts` (lines 1207-1220, 2841-2863).
- The gateway (`api/src/gateway/router.ts`) forwards `tools` + `tool_choice` (lines 191, 294) and `convertToolChoice` (`api/src/gateway/operations.ts:128-137`) supports a forced tool: `{type:'function',function:{name}}` → `{type:'tool',toolName}`. So `explore_tools` gets structured output by forcing a `select_tools` call (not `generateObject`, whose `response_format` the gateway drops).
- The gateway hoists **all** `system`-role messages into the top-level system block (`router.ts:166-167`, `operations.ts:74-75`) and emits **no** prompt-cache markers. Therefore a literal "tail injected message" for the catalog is not cleanly achievable through this gateway, and there is no cache to protect today. The catalog is folded into the system text — functionally equivalent now; revisit tail placement when caching lands (out of scope).
- Mock model (`api/src/models/mock-model.ts`): `call tool NAME args` → tool-call to NAME (args = raw remainder, JSON-parsed); after a `tool`-role message it returns text `"done"`; it **ignores** `tool_choice`. A minimal seam is added (Task 7) so `select_tools` returns deterministically for tests.
- Toggle pattern: `ui/src/components/AgentChat.vue:154` (`tracingEnabled = props.debug && sessionStorage.getItem('agent-chat-trace') === '1'`).
- WebMCP test fixture registering a tool: `ui/src/pages/_dev/chat-iframe-tools.vue` (registers `set_data`).

## File structure

- **Create** `ui/src/composables/tool-exploration.ts` — pure helpers + the `explore_tools` factory. One responsibility: everything specific to exploration mode, kept out of the already-large `use-agent-chat.ts`.
- **Create** `tests/features/tool-exploration/1.tool-exploration.unit.spec.ts` — unit tests for the pure helpers.
- **Modify** `ui/src/composables/use-agent-chat.ts` — add `toolExploration` option, `promotedTools` set, exploration branch in `sendMessage`, compaction/reset clearing.
- **Modify** `ui/src/components/AgentChat.vue` — read the toggle, pass `toolExploration` to the main chat.
- **Modify** `api/src/models/mock-model.ts` — deterministic `select_tools` seam for tests.
- **Create** `tests/features/tool-exploration/3.tool-exploration.e2e.spec.ts` — end-to-end explore→promote→call + toggle-off-unchanged.

---

## Task 1: Pure helper — `buildToolCatalog`

**Files:**
- Create: `ui/src/composables/tool-exploration.ts`
- Test: `tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildToolCatalog } from '../../../ui/src/composables/tool-exploration.ts'

describe('buildToolCatalog', () => {
  it('lists each tool as "- name: first description line"', () => {
    const tools = {
      set_data: { description: 'Set the data in the textarea' },
      filter_map: { description: 'Filter markers\nsecond line ignored' }
    } as any
    const catalog = buildToolCatalog(tools)
    expect(catalog).toContain('- set_data: Set the data in the textarea')
    expect(catalog).toContain('- filter_map: Filter markers')
    expect(catalog).not.toContain('second line ignored')
  })

  it('handles a tool with no description', () => {
    const catalog = buildToolCatalog({ foo: {} } as any)
    expect(catalog).toContain('- foo:')
  })

  it('returns empty string for no tools', () => {
    expect(buildToolCatalog({} as any)).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`
Expected: FAIL — `buildToolCatalog` is not exported / module not found.

- [ ] **Step 3: Write minimal implementation**

Create `ui/src/composables/tool-exploration.ts`:

```ts
import type { Tool } from 'ai'

/** Build a compact "name: one-line description" catalog of the given tools. */
export function buildToolCatalog (plainTools: Record<string, Tool>): string {
  return Object.entries(plainTools)
    .map(([name, t]) => {
      const desc = ((t as any).description ?? '').split('\n')[0].trim()
      return `- ${name}: ${desc}`
    })
    .join('\n')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add ui/src/composables/tool-exploration.ts tests/features/tool-exploration/1.tool-exploration.unit.spec.ts
git commit -m "feat(tool-exploration): add buildToolCatalog helper"
```

---

## Task 2: Pure helper — `selectPromotions`

**Files:**
- Modify: `ui/src/composables/tool-exploration.ts`
- Test: `tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`:

```ts
import { selectPromotions } from '../../../ui/src/composables/tool-exploration.ts'

describe('selectPromotions', () => {
  it('keeps only requested names that exist in the available set', () => {
    expect(selectPromotions(['set_data', 'ghost'], ['set_data', 'foo'])).toEqual(['set_data'])
  })

  it('dedupes requested names', () => {
    expect(selectPromotions(['foo', 'foo'], ['foo'])).toEqual(['foo'])
  })

  it('returns [] when nothing matches', () => {
    expect(selectPromotions(['x'], ['a', 'b'])).toEqual([])
  })

  it('tolerates a non-array input', () => {
    expect(selectPromotions(undefined as any, ['a'])).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`
Expected: FAIL — `selectPromotions` is not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `ui/src/composables/tool-exploration.ts`:

```ts
/** Filter requested tool names to those that actually exist, de-duplicated, order-preserving. */
export function selectPromotions (requestedNames: string[], availableNames: string[]): string[] {
  if (!Array.isArray(requestedNames)) return []
  const available = new Set(availableNames)
  const seen = new Set<string>()
  const out: string[] = []
  for (const name of requestedNames) {
    if (available.has(name) && !seen.has(name)) {
      seen.add(name)
      out.push(name)
    }
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`
Expected: PASS (7 tests total).

- [ ] **Step 5: Commit**

```bash
git add ui/src/composables/tool-exploration.ts tests/features/tool-exploration/1.tool-exploration.unit.spec.ts
git commit -m "feat(tool-exploration): add selectPromotions helper"
```

---

## Task 3: Pure helper — `buildExplorationSystem` + constants

**Files:**
- Modify: `ui/src/composables/tool-exploration.ts`
- Test: `tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`:

```ts
import { buildExplorationSystem, EXPLORE_TOOL_NAME } from '../../../ui/src/composables/tool-exploration.ts'

describe('buildExplorationSystem', () => {
  it('appends the catalog and an explore instruction to the base system text', () => {
    const out = buildExplorationSystem('BASE PROMPT', '- set_data: Set the data')
    expect(out).toContain('BASE PROMPT')
    expect(out).toContain('- set_data: Set the data')
    expect(out).toContain(EXPLORE_TOOL_NAME)
  })

  it('works when base system text is undefined', () => {
    const out = buildExplorationSystem(undefined, '- foo: bar')
    expect(out).toContain('- foo: bar')
    expect(out).toContain(EXPLORE_TOOL_NAME)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`
Expected: FAIL — `buildExplorationSystem` / `EXPLORE_TOOL_NAME` not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `ui/src/composables/tool-exploration.ts`:

```ts
export const EXPLORE_TOOL_NAME = 'explore_tools'
export const SELECT_TOOL_NAME = 'select_tools'

/** Fold the tool-name catalog and the explore instruction into the system text. */
export function buildExplorationSystem (baseSystem: string | undefined, catalog: string): string {
  const instruction = `The tools listed below are available on this page but are NOT directly callable yet. ` +
    `To use one, first call \`${EXPLORE_TOOL_NAME}\` with your intent; it will make the relevant tools callable.\n\n` +
    `Available tools:\n${catalog}`
  return baseSystem ? `${baseSystem}\n\n${instruction}` : instruction
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`
Expected: PASS (9 tests total).

- [ ] **Step 5: Commit**

```bash
git add ui/src/composables/tool-exploration.ts tests/features/tool-exploration/1.tool-exploration.unit.spec.ts
git commit -m "feat(tool-exploration): add buildExplorationSystem + constants"
```

---

## Task 4: `createExploreTool` factory

**Files:**
- Modify: `ui/src/composables/tool-exploration.ts`

No unit test here — the factory's `execute` calls the summarizer via the AI SDK and is covered end-to-end by the e2e test (Task 7). Keep `execute` thin so all branchable logic lives in the already-tested pure helpers.

- [ ] **Step 1: Add imports at the top of `ui/src/composables/tool-exploration.ts`**

Change the first import line from:

```ts
import type { Tool } from 'ai'
```

to:

```ts
import { generateText, tool, jsonSchema } from 'ai'
import type { Tool, LanguageModel } from 'ai'
```

- [ ] **Step 2: Append the factory**

Append to `ui/src/composables/tool-exploration.ts`:

```ts
/**
 * Build the always-on exploration tool. Its execute runs the summarizer over the
 * full plain-tool registry, forces a `select_tools` call to get structured output,
 * then promotes the chosen tools via the `promote` callback.
 */
export function createExploreTool (opts: {
  plainTools: Record<string, Tool>
  promote: (names: string[]) => void
  summarizer: LanguageModel
  headers?: Record<string, string>
}): Tool {
  const { plainTools, promote, summarizer, headers } = opts
  return tool({
    description: 'Discover and activate the page tools relevant to a task. ' +
      'Call this with your intent before attempting to use any page tool.',
    inputSchema: jsonSchema({
      type: 'object',
      properties: {
        intent: { type: 'string', description: 'What you are trying to do, in one sentence.' }
      },
      required: ['intent']
    }),
    execute: async (args: any) => {
      const intent = String(args?.intent ?? '')
      const candidates = Object.entries(plainTools)
        .map(([name, t]) => `${name}: ${((t as any).description ?? '').split('\n')[0].trim()}`)
        .join('\n')

      let chosen: string[] = []
      let summary = ''
      try {
        const result = await generateText({
          model: summarizer,
          system: 'You select which page tools are relevant to the user intent. ' +
            'Call select_tools with the names of the relevant tools and a one-sentence summary.',
          messages: [{
            role: 'user' as const,
            content: `Intent: ${intent}\n\n<candidate-tools>\n${candidates}\n</candidate-tools>`
          }],
          tools: {
            [SELECT_TOOL_NAME]: tool({
              description: 'Report which candidate tools are relevant and a short summary.',
              inputSchema: jsonSchema({
                type: 'object',
                properties: {
                  summary: { type: 'string' },
                  toolNames: { type: 'array', items: { type: 'string' } }
                },
                required: ['summary', 'toolNames']
              })
            })
          },
          toolChoice: { type: 'tool', toolName: SELECT_TOOL_NAME },
          ...(headers ? { headers } : {})
        })
        const input = (result.toolCalls?.[0]?.input ?? {}) as { summary?: string, toolNames?: string[] }
        chosen = selectPromotions(input.toolNames ?? [], Object.keys(plainTools))
        summary = input.summary ?? ''
      } catch {
        chosen = []
      }

      promote(chosen)
      if (chosen.length === 0) return summary || 'No matching tools were found for that intent.'
      return `${summary ? summary + '\n' : ''}Now available: ${chosen.join(', ')}`
    }
  })
}
```

- [ ] **Step 3: Type-check**

Run: `npm run check-types`
Expected: PASS (no new errors in `tool-exploration.ts`).

- [ ] **Step 4: Commit**

```bash
git add ui/src/composables/tool-exploration.ts
git commit -m "feat(tool-exploration): add createExploreTool factory"
```

---

## Task 5: Wire exploration mode into `use-agent-chat.ts`

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts`

- [ ] **Step 1: Add the import**

After line 6 (`import { FrameClientAggregator } ...`), add:

```ts
import { createExploreTool, buildToolCatalog, buildExplorationSystem, EXPLORE_TOOL_NAME } from '~/composables/tool-exploration'
```

- [ ] **Step 2: Add the option**

In `UseAgentChatOptions` (lines 46-55), add a field after `recorder?: SessionRecorder`:

```ts
  toolExploration?: boolean
```

- [ ] **Step 3: Add the promoted-set state**

After line 117 (`const COMPACTION_THRESHOLD = 24_000`), add:

```ts
  const explorationEnabled = !!options.toolExploration
  // Tools promoted to the callable set via explore_tools; persists across turns,
  // cleared on compaction and reset. Read live by prepareStep.
  let promotedTools = new Set<string>()
```

- [ ] **Step 4: Clear promoted tools on reset**

In `reset` (lines 295-305), after `history = []` (line 300), add:

```ts
    promotedTools = new Set<string>()
```

- [ ] **Step 5: Clear promoted tools on successful compaction**

In `compactHistory`, inside the `try` block right after `history = [ ... ]` is assigned (after line 396, before the `if (recorder)` block), add:

```ts
      promotedTools.clear()
```

- [ ] **Step 6: Build the exploration tool set + system, and pass prepareStep/activeTools to streamText**

Replace the `streamText({ ... })` call (lines 562-573) with the version below. The only differences are: an exploration branch that adds `explore_tools` and computes `activeTools`; a computed `system`; and the added `prepareStep`. Everything else is unchanged.

```ts
      // Exploration mode: hide plain tools behind explore_tools, expose only
      // explore_tools + sub-agent pseudo-tools + already-promoted tools per step.
      const subAgentNames = Object.keys(subAgents)
      let streamSystem = options.systemPrompt
      let prepareStep: undefined | (() => { activeTools: string[] })
      if (explorationEnabled) {
        const plainTools = { ...mainTools }
        mainLLMTools[EXPLORE_TOOL_NAME] = createExploreTool({
          plainTools,
          promote: (names) => names.forEach(n => promotedTools.add(n)),
          summarizer: provider.chat('summarizer'),
          ...(recorder ? { headers: { 'x-trace-ctx': turnCtxId } } : {})
        })
        streamSystem = buildExplorationSystem(options.systemPrompt, buildToolCatalog(plainTools))
        prepareStep = () => ({
          activeTools: [EXPLORE_TOOL_NAME, ...subAgentNames, ...[...promotedTools]]
            .filter(n => n in mainLLMTools)
        })
      }

      debug('streaming with model=%s tools=%o exploration=%s', chatModelName, Object.keys(mainLLMTools), explorationEnabled)
      const result = streamText({
        model: provider.chat(chatModelName),
        system: streamSystem,
        messages: history,
        tools: Object.keys(mainLLMTools).length > 0 ? mainLLMTools : undefined,
        stopWhen: stepCountIs(10),
        abortSignal: abortController.signal,
        ...(prepareStep ? { prepareStep } : {}),
        ...(recorder ? { headers: { 'x-trace-ctx': turnCtxId } } : {}),
        onError: ({ error: err }) => {
          streamError = err
        }
      })
```

Note: `mainTools`, `subAgents`, `mainLLMTools`, `provider`, `turnCtxId`, `recorder` are all already in scope at this point (defined earlier in `sendMessage` / the composable).

- [ ] **Step 7: Type-check and lint**

Run: `npm run check-types && npm run lint-fix`
Expected: PASS, no new errors.

- [ ] **Step 8: Run unit tests (regression)**

Run: `npm run test tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`
Expected: PASS (9 tests).

- [ ] **Step 9: Commit**

```bash
git add ui/src/composables/use-agent-chat.ts
git commit -m "feat(tool-exploration): wire progressive disclosure into chat loop"
```

---

## Task 6: Toggle wiring in `AgentChat.vue`

**Files:**
- Modify: `ui/src/components/AgentChat.vue`

- [ ] **Step 1: Compute the toggle**

After line 154 (`const tracingEnabled = props.debug && sessionStorage.getItem('agent-chat-trace') === '1'`), add:

```ts
const explorationEnabled = props.debug && sessionStorage.getItem('agent-chat-explore') === '1'
```

- [ ] **Step 2: Pass it to the main chat**

In the `useAgentChat({ ... })` call (lines 160-167), add `toolExploration: explorationEnabled` after `recorder`:

```ts
const chatResult = useAgentChat({
  accountType: props.accountType,
  accountId: props.accountId,
  debug: props.debug,
  systemPrompt: finalSystemPrompt.value,
  initialMessages: props.initialMessages,
  recorder,
  toolExploration: explorationEnabled
})
```

(Do **not** add it to the `evaluatorChat` instance — exploration applies only to the main page-tools chat.)

- [ ] **Step 3: Type-check**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add ui/src/components/AgentChat.vue
git commit -m "feat(tool-exploration): add agent-chat-explore sessionStorage toggle"
```

---

## Task 7: Deterministic mock seam + e2e behavioral test

**Files:**
- Modify: `api/src/models/mock-model.ts`
- Create: `tests/features/tool-exploration/3.tool-exploration.e2e.spec.ts`

**Mock seam rationale:** the mock ignores `tool_choice` and only emits tool calls for `call tool NAME ...` messages, so `explore_tools`' internal `select_tools` call would otherwise return no structured output. We add one rule: when the request advertises a `select_tools` tool, the mock emits a `select_tools` call selecting every name inside the `<candidate-tools>` block of the prompt. Real models reason normally; this only affects the mock.

- [ ] **Step 1: Read the mock model to locate the decision function**

Run: `sed -n '40,75p' api/src/models/mock-model.ts`
Expected: see the decision helper that returns `{ type: 'tool-call', toolName, toolArgs }` for `call tool ...`, `{ type: 'text', text: 'done' }` after a tool result, and the `hello`→`world` / fallback branches. Note the exact function name and the variable holding the request `tools` (needed in Step 2).

- [ ] **Step 2: Add the `select_tools` rule**

In `api/src/models/mock-model.ts`, in the decision helper, **before** the existing `call tool` regex match, add a branch that fires when the model options advertise a `select_tools` tool. Insert:

```ts
// Exploration test seam: when select_tools is offered, deterministically select
// every tool listed inside the <candidate-tools> block of the prompt.
const offersSelectTools = Array.isArray(toolsFromOptions) &&
  toolsFromOptions.some((t: any) => (t?.name ?? t?.function?.name) === 'select_tools')
if (offersSelectTools) {
  const block = fullPromptText.match(/<candidate-tools>([\s\S]*?)<\/candidate-tools>/)
  const names = block
    ? block[1].split('\n').map(l => l.trim()).filter(Boolean).map(l => l.split(':')[0].trim())
    : []
  return {
    type: 'tool-call',
    toolName: 'select_tools',
    toolArgs: JSON.stringify({ summary: 'mock selection', toolNames: names })
  }
}
```

Adapt `toolsFromOptions` and `fullPromptText` to the actual variable names found in Step 1:
- `toolsFromOptions` = the tools array from the model's `doStream`/`doGenerate` options (the AI SDK passes `options.tools`; if the mock does not already destructure it, add `tools: toolsFromOptions` to the options it reads, or read `options.tools`).
- `fullPromptText` = a string join of all message text in the prompt. If the mock only inspects the last message today, add a concatenation of every message's text content for this branch.

Then ensure the existing serializer that turns the decision into a streamed tool-call (the code path that JSON-parses `toolArgs`) handles `toolArgs` already being a JSON string — it does (it JSON-parses `toolArgs`).

- [ ] **Step 3: Type-check the API**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 4: Verify the mock seam via the gateway (sanity, no browser)**

Confirm nothing regressed in existing gateway tool tests:

Run: `npm run test tests/features/gateway/gateway.tools.api.spec.ts`
Expected: PASS (existing tests unaffected — the new branch only fires when `select_tools` is advertised).

- [ ] **Step 5: Ensure workspace packages are built (required for e2e)**

Run:
```bash
cd lib-vuetify && npm run build && cd ..
cd lib-vue && npm run build && cd ..
```
Expected: build succeeds; `ls lib-vue/*.js lib-vuetify/*.js` lists compiled files.

- [ ] **Step 6: Write the e2e test**

Create `tests/features/tool-exploration/3.tool-exploration.e2e.spec.ts`. Model it on the existing webmcp/tool e2e (`tests/features/chat-subagent/chat-subagent-advanced.e2e.spec.ts`) for fixture/login/settings setup — reuse its helpers for: configuring a `mock` provider in settings, opening the dev page that hosts the chat + `chat-iframe-tools` fixture (registers `set_data`), and enabling debug mode. Replace the bracketed setup with the concrete helpers used there.

```ts
import { test, expect } from '@playwright/test'
// import the same setup helpers used by tests/features/chat-subagent/chat-subagent-advanced.e2e.spec.ts
// (settings-with-mock-provider, dev page url, login) — reuse them here.

test.describe('Tool exploration mode', () => {
  test('explore_tools promotes a page tool, which then becomes callable', async ({ page }) => {
    // 1. Enable the toggle BEFORE the chat iframe loads.
    await page.addInitScript(() => {
      sessionStorage.setItem('agent-chat-explore', '1')
    })

    // 2. [Open the dev chat page in debug mode with the chat-iframe-tools fixture mounted,
    //     and a mock provider configured in settings — reuse the chat-subagent e2e helpers.]

    // 3. First turn: drive the mock to call explore_tools.
    //    Mock rule: "call tool NAME args" → tool-call to NAME. Here NAME = explore_tools.
    await page.getByPlaceholder(/./).fill('call tool explore_tools {"intent":"set the data"}')
    await page.keyboard.press('Enter')

    // explore_tools runs the summarizer (mock) which, seeing select_tools offered,
    // selects set_data from the <candidate-tools> block → set_data is promoted.
    await expect(page.getByText(/Now available: set_data/)).toBeVisible({ timeout: 15000 })

    // 4. Second turn: now call the promoted real tool.
    await page.getByPlaceholder(/./).fill('call tool set_data {"data":"hello-from-explore"}')
    await page.keyboard.press('Enter')

    // The set_data tool writes into the tools-iframe textarea.
    const iframe = page.frameLocator('iframe[src*="chat-iframe-tools"]')
    await expect(iframe.locator('textarea')).toHaveValue('hello-from-explore', { timeout: 15000 })
  })

  test('with the toggle OFF, a page tool is callable directly (no explore step)', async ({ page }) => {
    // No addInitScript → exploration disabled.
    // 2. [Same page/setup as above.]
    await page.getByPlaceholder(/./).fill('call tool set_data {"data":"direct-call"}')
    await page.keyboard.press('Enter')
    const iframe = page.frameLocator('iframe[src*="chat-iframe-tools"]')
    await expect(iframe.locator('textarea')).toHaveValue('direct-call', { timeout: 15000 })
  })
})
```

- [ ] **Step 7: Run the e2e test**

Run: `npm run test tests/features/tool-exploration/3.tool-exploration.e2e.spec.ts`
Expected: PASS (2 tests). If "element(s) not found", re-check Step 5 (workspace builds) before debugging further (per AGENTS.md).

- [ ] **Step 8: Commit**

```bash
git add api/src/models/mock-model.ts tests/features/tool-exploration/3.tool-exploration.e2e.spec.ts
git commit -m "test(tool-exploration): deterministic mock seam + e2e explore→promote→call"
```

---

## Task 8: Full verification

- [ ] **Step 1: Lint**

Run: `npm run lint-fix`
Expected: no errors (pre-existing `v-html` warnings in `AgentChatMessages.vue` are unrelated and acceptable).

- [ ] **Step 2: Type-check**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 3: Full test suite**

Run: `npm run test`
Expected: PASS, including the new `tool-exploration` unit + e2e specs.

- [ ] **Step 4: Docker build**

Run: `docker build -t agents .`
Expected: build succeeds.

- [ ] **Step 5: Final commit (if lint-fix changed anything)**

```bash
git add -A
git commit -m "chore(tool-exploration): lint + final verification"
```

---

## Self-review notes (author)

- **Spec coverage:** Toggle (§1)→Task 6; active-tool-set/prepareStep (§2)→Task 5; explore_tools/summarizer (§3)→Task 4; name catalog (§4, folded into system per verified gateway behavior)→Tasks 3+5; demotion on compaction (§5)→Task 5 step 5; system instruction (§6)→Task 3; testing (§7)→Tasks 1-3 (unit) + Task 7 (e2e). Open Items 1-2 resolved in Background.
- **Deviation from spec §4:** catalog is folded into system text rather than a literal tail message, because the gateway hoists all system messages and there is no active prompt cache; documented in Background. Confirm acceptable at handoff.
- **Deviation — added mock seam (Task 7):** required because the mock ignores `tool_choice`; scoped to fire only when `select_tools` is advertised.
- **Type consistency:** `EXPLORE_TOOL_NAME`/`SELECT_TOOL_NAME` constants shared between factory and wiring; `promotedTools` is a `Set<string>` reassigned in `reset`, `.clear()`-ed in `compactHistory`; `buildToolCatalog`/`selectPromotions`/`buildExplorationSystem`/`createExploreTool` signatures match their call sites in Task 5.
```
