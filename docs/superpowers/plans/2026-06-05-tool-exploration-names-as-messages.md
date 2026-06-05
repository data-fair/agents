# Tool exploration: names-as-messages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In exploration mode, stop injecting the tool catalog into the system prompt; surface available tool *names* as incremental `<tools-available>` messages in the model's `history`, announced per turn as a delta.

**Architecture:** The system prompt is left untouched (the always-active `explore_tools` tool is self-describing). Two new pure helpers in `tool-exploration.ts` format the reminder message and compute the per-turn name delta. `use-agent-chat.ts` tracks an `announcedTools` set, prunes it to live tools each turn, pushes one `<tools-available>` `user` message for newly-available names before streaming, and clears the set on compaction/reset. Tool *schemas* are unchanged — `prepareStep`/`activeTools` already withholds them.

**Tech Stack:** TypeScript, Vue 3 composables, Vercel AI SDK (`ai`), Playwright (unit/api/e2e projects), unplugin-auto-import.

**Spec:** `docs/superpowers/specs/2026-06-05-tool-exploration-names-as-messages-design.md`

---

## File Structure

- **Modify** `ui/src/composables/tool-exploration.ts` — remove `buildToolCatalog` + `buildExplorationSystem`; add `formatToolsAvailableMessage` + `newlyAvailableTools`. Keep `createExploreTool`, `selectPromotions`, `firstDescLine`, `EXPLORE_TOOL_NAME`, `SELECT_TOOL_NAME`.
- **Modify** `ui/src/composables/use-agent-chat.ts` — swap the import; add `announcedTools`; prune + announce in the exploration block; pass `options.systemPrompt` straight through; clear `announcedTools` on compaction.
- **Modify** `tests/features/tool-exploration/1.tool-exploration.unit.spec.ts` — drop tests for the deleted functions; add tests for the two new pure helpers; keep `selectPromotions`.
- **Regenerated** `ui/dts/auto-imports.d.ts` — auto-updated by the running vite watcher; commit the regeneration. Manual fallback in Task 5.
- **Unchanged (verify still green)** `2.tool-exploration.api.spec.ts`, `3.tool-exploration.e2e.spec.ts` — neither asserts on the system prompt.

---

## Task 1: Failing unit tests for the new pure helpers

**Files:**
- Test: `tests/features/tool-exploration/1.tool-exploration.unit.spec.ts` (full rewrite)

- [ ] **Step 1: Replace the unit spec with the new test set**

Overwrite `tests/features/tool-exploration/1.tool-exploration.unit.spec.ts` with:

```ts
import { test, expect } from '@playwright/test'
import { selectPromotions, formatToolsAvailableMessage, newlyAvailableTools, EXPLORE_TOOL_NAME } from '../../../ui/src/composables/tool-exploration.ts'

test.describe('selectPromotions', () => {
  test('keeps only requested names that exist in the available set', () => {
    expect(selectPromotions(['set_data', 'ghost'], ['set_data', 'foo'])).toEqual(['set_data'])
  })

  test('dedupes requested names', () => {
    expect(selectPromotions(['foo', 'foo'], ['foo'])).toEqual(['foo'])
  })

  test('returns [] when nothing matches', () => {
    expect(selectPromotions(['x'], ['a', 'b'])).toEqual([])
  })

  test('tolerates a non-array input', () => {
    expect(selectPromotions(undefined as any, ['a'])).toEqual([])
  })
})

test.describe('formatToolsAvailableMessage', () => {
  test('wraps comma-joined names in a <tools-available> block referencing explore_tools', () => {
    const msg = formatToolsAvailableMessage(['set_data', 'filter_map'])
    expect(msg).toContain('<tools-available>')
    expect(msg).toContain('</tools-available>')
    expect(msg).toContain('set_data, filter_map')
    expect(msg).toContain(EXPLORE_TOOL_NAME)
  })

  test('handles a single name', () => {
    expect(formatToolsAvailableMessage(['only_tool'])).toContain('only_tool')
  })
})

test.describe('newlyAvailableTools', () => {
  test('returns names not present in the announced set, order-preserving', () => {
    expect(newlyAvailableTools(['a', 'b', 'c'], new Set(['b']))).toEqual(['a', 'c'])
  })

  test('returns [] when all are already announced', () => {
    expect(newlyAvailableTools(['a', 'b'], new Set(['a', 'b']))).toEqual([])
  })

  test('returns all names when the announced set is empty (post-compaction re-announce)', () => {
    expect(newlyAvailableTools(['a', 'b'], new Set())).toEqual(['a', 'b'])
  })

  test('dedupes repeated names in the input', () => {
    expect(newlyAvailableTools(['a', 'a', 'b'], new Set())).toEqual(['a', 'b'])
  })
})
```

- [ ] **Step 2: Run the unit tests to verify they fail**

Run: `npm run test-unit -- tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`
Expected: FAIL — `formatToolsAvailableMessage` and `newlyAvailableTools` are not exported (import/type error or runtime "is not a function").

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/features/tool-exploration/1.tool-exploration.unit.spec.ts
git commit -m "test(tool-exploration): specs for names-as-messages helpers"
```

---

## Task 2: Implement the new pure helpers, remove the catalog/system builders

**Files:**
- Modify: `ui/src/composables/tool-exploration.ts`

- [ ] **Step 1: Delete `buildToolCatalog` and `buildExplorationSystem`**

Remove these two exported functions (current lines 11–27, including their leading comments). Keep `firstDescLine` (still used by `createExploreTool`). After removal, the top of the file reads:

```ts
import Debug from 'debug'
import { generateText, tool, jsonSchema } from 'ai'
import type { Tool, LanguageModel } from 'ai'

const debug = Debug('df-agents:tool-exploration')

function firstDescLine (t: Tool): string {
  return ((t as any).description ?? '').split('\n')[0].trim()
}

export const EXPLORE_TOOL_NAME = 'explore_tools'
export const SELECT_TOOL_NAME = 'select_tools'
```

- [ ] **Step 2: Add the two new pure helpers after the `SELECT_TOOL_NAME` constant**

Insert immediately after the `export const SELECT_TOOL_NAME = 'select_tools'` line:

```ts
/** Format a `<tools-available>` reminder listing tool names only (no descriptions). */
export function formatToolsAvailableMessage (names: string[]): string {
  return '<tools-available>\n' +
    `Not yet callable — pass your intent to ${EXPLORE_TOOL_NAME} to activate the ones you need:\n` +
    `${names.join(', ')}\n` +
    '</tools-available>'
}

/** Names present in `currentNames` but not in `announced`, de-duplicated, order-preserving. */
export function newlyAvailableTools (currentNames: string[], announced: Set<string>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const name of currentNames) {
    if (!announced.has(name) && !seen.has(name)) {
      seen.add(name)
      out.push(name)
    }
  }
  return out
}
```

Leave `selectPromotions` and `createExploreTool` exactly as they are.

- [ ] **Step 3: Run the unit tests to verify they pass**

Run: `npm run test-unit -- tests/features/tool-exploration/1.tool-exploration.unit.spec.ts`
Expected: PASS — all `selectPromotions`, `formatToolsAvailableMessage`, and `newlyAvailableTools` tests green.

- [ ] **Step 4: Commit**

```bash
git add ui/src/composables/tool-exploration.ts
git commit -m "feat(tool-exploration): names-only message helpers, drop system catalog builders"
```

---

## Task 3: Wire names-as-messages into the chat composable

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts` (import line 7; state ~line 135; compaction ~line 457; exploration block ~lines 631–647; `streamText` system ~line 652)

- [ ] **Step 1: Swap the import (line 7)**

Replace:

```ts
import { createExploreTool, buildToolCatalog, buildExplorationSystem, EXPLORE_TOOL_NAME } from '~/composables/tool-exploration'
```

with:

```ts
import { createExploreTool, formatToolsAvailableMessage, newlyAvailableTools, EXPLORE_TOOL_NAME } from '~/composables/tool-exploration'
```

- [ ] **Step 2: Add the `announcedTools` set next to `promotedTools` (~line 135)**

After the existing declaration:

```ts
  let promotedTools = new Set<string>()
```

insert:

```ts
  // Tool names already surfaced to the model via <tools-available> messages.
  // Persists across turns; pruned to live tools each turn; cleared on compaction and reset.
  const announcedTools = new Set<string>()
```

- [ ] **Step 3: Clear `announcedTools` on compaction (~line 457)**

In `compactHistory`, after the existing line:

```ts
      promotedTools.clear()
```

add:

```ts
      announcedTools.clear()
```

- [ ] **Step 4: Rework the exploration block to prune + announce instead of building system text (~lines 631–647)**

Replace this block:

```ts
      // Exploration mode: hide plain tools behind explore_tools, expose only
      // explore_tools + sub-agent pseudo-tools + already-promoted tools per step.
      let streamSystem = options.systemPrompt
      let prepareStep: undefined | (() => { activeTools: string[] })
      if (explorationEnabled) {
        const subAgentNames = Object.keys(subAgents)
        const plainTools = { ...mainTools }
        mainLLMTools[EXPLORE_TOOL_NAME] = createExploreTool({
          plainTools,
          promote: (names) => names.forEach(n => promotedTools.add(n)),
          summarizer: provider.chat('summarizer'),
          ...(recorder ? { headers: { 'x-trace-ctx': turnCtxId } } : {})
        })
        streamSystem = buildExplorationSystem(options.systemPrompt, buildToolCatalog(plainTools))
        prepareStep = () => ({
          activeTools: [EXPLORE_TOOL_NAME, ...subAgentNames, ...promotedTools]
            .filter(n => n in mainLLMTools)
        })
      }
```

with:

```ts
      // Exploration mode: hide plain tools behind explore_tools, expose only
      // explore_tools + sub-agent pseudo-tools + already-promoted tools per step.
      // The plain tool names are surfaced to the model as <tools-available> messages
      // (names only); the system prompt is left untouched.
      let prepareStep: undefined | (() => { activeTools: string[] })
      if (explorationEnabled) {
        const subAgentNames = Object.keys(subAgents)
        const plainTools = { ...mainTools }
        mainLLMTools[EXPLORE_TOOL_NAME] = createExploreTool({
          plainTools,
          promote: (names) => names.forEach(n => promotedTools.add(n)),
          summarizer: provider.chat('summarizer'),
          ...(recorder ? { headers: { 'x-trace-ctx': turnCtxId } } : {})
        })

        // Prune announced/promoted sets in place to the tools still live, so a tool
        // that disappears (server disconnect) un-announces and un-promotes; if it
        // returns later it re-announces. Mutate in place — the promote and prepareStep
        // closures capture these set objects.
        const liveNames = new Set(Object.keys(plainTools))
        for (const n of [...announcedTools]) if (!liveNames.has(n)) announcedTools.delete(n)
        for (const n of [...promotedTools]) if (!liveNames.has(n)) promotedTools.delete(n)

        // Announce newly-available tool names (delta) as one <tools-available> message.
        const delta = newlyAvailableTools(Object.keys(plainTools), announcedTools)
        if (delta.length) {
          history.push({ role: 'user', content: formatToolsAvailableMessage(delta) })
          for (const n of delta) announcedTools.add(n)
        }

        prepareStep = () => ({
          activeTools: [EXPLORE_TOOL_NAME, ...subAgentNames, ...promotedTools]
            .filter(n => n in mainLLMTools)
        })
      }
```

- [ ] **Step 5: Pass the untouched system prompt to `streamText` (~line 652)**

In the `streamText({ ... })` call, replace:

```ts
        system: streamSystem,
```

with:

```ts
        system: options.systemPrompt,
```

- [ ] **Step 6: Verify type-checking passes**

Run: `npm -w ui run check-types`
Expected: PASS, no errors. (If `vue-tsc` reports `buildExplorationSystem`/`buildToolCatalog` still referenced in `ui/dts/auto-imports.d.ts`, complete Task 5 Step 1 first, then re-run.)

- [ ] **Step 7: Commit**

```bash
git add ui/src/composables/use-agent-chat.ts
git commit -m "feat(tool-exploration): surface tool names as <tools-available> messages"
```

---

## Task 4: Verify the explore→promote→call flow still works end-to-end

**Files:**
- Run-only: `tests/features/tool-exploration/2.tool-exploration.api.spec.ts`, `tests/features/tool-exploration/3.tool-exploration.e2e.spec.ts`

> Pre-req for e2e: workspace packages must be built — `ls lib-vuetify/*.js lib-vue/*.js`; if missing, run `cd lib-vuetify && npm run build` and `cd lib-vue && npm run build`.

- [ ] **Step 1: Run the api spec (summarizer seam unaffected)**

Run: `npm run test-api -- tests/features/tool-exploration/2.tool-exploration.api.spec.ts`
Expected: PASS — both `select_tools` seam tests green.

- [ ] **Step 2: Run the e2e spec (explore_tools promotes, then set_display works)**

Run: `npm run test-e2e -- tests/features/tool-exploration/3.tool-exploration.e2e.spec.ts`
Expected: PASS — turn 1 shows the `explore_tools` chip and `done`; turn 2's `set_display` writes `hello-from-explore`; the non-exploration test still calls `set_display` directly.

If either fails with a connection error, run `bash dev/status.sh` and stop to report; do not change infrastructure.

---

## Task 5: Regenerate auto-imports, run full quality gates

**Files:**
- Regenerated: `ui/dts/auto-imports.d.ts`

- [ ] **Step 1: Confirm the auto-imports dts reflects the new exports**

The running vite dev-ui watcher regenerates `ui/dts/auto-imports.d.ts` on save. Verify:

Run: `grep -nE "formatToolsAvailableMessage|newlyAvailableTools|buildExplorationSystem|buildToolCatalog" ui/dts/auto-imports.d.ts`
Expected: lines for `formatToolsAvailableMessage` and `newlyAvailableTools` present; **no** lines for `buildExplorationSystem` or `buildToolCatalog`.

**Manual fallback if the watcher did not update it** (dev-ui down): edit `ui/dts/auto-imports.d.ts` directly — in the `global {}` const block remove the `buildExplorationSystem` and `buildToolCatalog` lines and add, in alphabetical position:

```ts
  const formatToolsAvailableMessage: typeof import('../src/composables/tool-exploration')['formatToolsAvailableMessage']
  const newlyAvailableTools: typeof import('../src/composables/tool-exploration')['newlyAvailableTools']
```

and in the `ImportMeta`/readonly block remove the matching `buildExplorationSystem`/`buildToolCatalog` readonly lines and add, in alphabetical position:

```ts
    readonly formatToolsAvailableMessage: UnwrapRef<typeof import('../src/composables/tool-exploration')['formatToolsAvailableMessage']>
    readonly newlyAvailableTools: UnwrapRef<typeof import('../src/composables/tool-exploration')['newlyAvailableTools']>
```

- [ ] **Step 2: Lint**

Run: `npm run lint-fix`
Expected: no errors (pre-existing `v-html` warnings in `AgentChatMessages.vue` are unrelated and acceptable).

- [ ] **Step 3: Full type-check**

Run: `npm run check-types`
Expected: PASS (root `tsc` + `vue-tsc`).

- [ ] **Step 4: Run the whole tool-exploration suite**

Run: `npm run test -- tests/features/tool-exploration/`
Expected: unit + api + e2e all PASS.

- [ ] **Step 5: Docker build**

Run: `docker build -t agents .`
Expected: build succeeds.

- [ ] **Step 6: Commit any regenerated/lint changes**

```bash
git add ui/dts/auto-imports.d.ts
git commit -m "chore(tool-exploration): regenerate auto-imports for new helpers"
```

(If `git status` shows nothing staged because earlier commits already captured the dts, skip the commit.)

---

## Self-Review notes

- **Spec coverage:** system prompt untouched (Task 3 Steps 4–5); `formatToolsAvailableMessage` names-only (Task 2); per-turn delta via `newlyAvailableTools` (Tasks 2–3); `user` role + `<tools-available>` wrapper (Task 3 Step 4); pruning on disconnect (Task 3 Step 4); clear on compaction (Task 3 Step 3); deleted builders + updated tests (Tasks 1–2); api/e2e unchanged & verified (Task 4). Compaction behaviour from the spec falls out of Steps 3–4 (cleared set → full re-announce same turn).
- **Reset:** the spec mentions clearing on reset. Reset re-instantiates the composable (fresh `announcedTools`), so no separate clear call is needed beyond the compaction clear; if a future in-place reset path is added, it must also `announcedTools.clear()`.
- **Type consistency:** `formatToolsAvailableMessage(names: string[])` and `newlyAvailableTools(currentNames: string[], announced: Set<string>)` are used with those exact signatures in Task 3.
- **Closure safety:** pruning mutates the `announcedTools`/`promotedTools` set objects in place (no reassignment), so the `promote` and `prepareStep` closures keep referencing the live sets.
