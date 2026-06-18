# System-aware evaluator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the trace evaluator a working model of the platform (its features and its data-fair/portals integration context) by bundling the architecture docs and surfacing them through a new on-demand tool plus a short prompt overview.

**Architecture:** A pure, test-friendly lookup module (`architecture-docs-lookup.ts`) holds the doc-map and lookup logic. A thin Vite-only module (`architecture-docs.ts`) bundles every `docs/architecture/*.md` at build time via `import.meta.glob` and feeds the pure helpers. The evaluator gets a new `readArchitectureDoc` tool and a "How this platform works" section in its system prompt. The docs themselves get a light trim, plus one new authored doc for the integration context.

**Tech Stack:** Vue 3 / TypeScript, Vercel AI SDK (`tool`, `jsonSchema`), Vite (`import.meta.glob`), Playwright test runner (`unit` project, `node:assert`).

## Global Constraints

- **The unit test runner does NOT run Vite.** The `unit` Playwright project imports `ui/src/*.ts` directly, so `import.meta.glob` is `undefined` there. Anything a unit test imports must be free of `import.meta`. Keep all testable logic in `architecture-docs-lookup.ts`; never import `architecture-docs.ts` (or `evaluator-tools.ts`) from a unit test.
- **ESM import extensions:** intra-`ui/src` imports use the `.js` extension (e.g. `'./session-recorder.js'`); match that. Unit tests import source with the `.ts` extension (e.g. `'../../../ui/src/traces/architecture-docs-lookup.ts'`).
- **Glob path:** from `ui/src/traces/`, the docs are at `../../../docs/architecture/*.md`.
- **Evaluator prompt stays general** — no hardcoded "trap"/example answers; only conceptual grounding that defers depth to the docs.
- **Docs trim is *light*:** remove fragile references (bare file paths and `:line` numbers in reference footers) and obvious verbosity; do **not** restructure or rewrite explanations.
- Quality gate (from AGENTS.md): `npm run lint-fix`, `npm run check-types`, `docker build -t agents .`.

---

### Task 1: Pure architecture-docs lookup module

The testable core: derive topic keys from glob paths, build the topic→markdown map, and look up a doc (returning the available list on a miss). No `import.meta` here.

**Files:**
- Create: `ui/src/traces/architecture-docs-lookup.ts`
- Test: `tests/features/traces/architecture-docs.unit.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `docTopicFromPath(path: string): string`
  - `buildDocMap(modules: Record<string, string>): Record<string, string>`
  - `lookupArchitectureDoc(docs: Record<string, string>, topic: string): string`

- [ ] **Step 1: Write the failing test**

Create `tests/features/traces/architecture-docs.unit.spec.ts`:

```ts
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { buildDocMap, docTopicFromPath, lookupArchitectureDoc } from '../../../ui/src/traces/architecture-docs-lookup.ts'

test.describe('architecture docs lookup (unit)', () => {
  test('derives topic keys from glob paths', () => {
    assert.equal(docTopicFromPath('../../../docs/architecture/compaction.md'), 'compaction')
    assert.equal(docTopicFromPath('../../../docs/architecture/integration-context.md'), 'integration-context')
  })

  test('builds a topic -> markdown map from glob modules', () => {
    const map = buildDocMap({
      '../../../docs/architecture/overview.md': '# Overview',
      '../../../docs/architecture/compaction.md': '# Compaction'
    })
    assert.deepEqual(Object.keys(map).sort(), ['compaction', 'overview'])
    assert.equal(map.compaction, '# Compaction')
  })

  test('returns content for a known topic', () => {
    const map = { compaction: '# Compaction' }
    assert.equal(lookupArchitectureDoc(map, 'compaction'), '# Compaction')
  })

  test('returns the available topic list for an unknown topic', () => {
    const map = { overview: 'a', compaction: 'b' }
    const res = lookupArchitectureDoc(map, 'nope')
    assert.match(res, /Unknown topic "nope"/)
    assert.match(res, /compaction, overview/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/traces/architecture-docs.unit.spec.ts`
Expected: FAIL — cannot resolve `../../../ui/src/traces/architecture-docs-lookup.ts` (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `ui/src/traces/architecture-docs-lookup.ts`:

```ts
/**
 * Pure helpers over the bundled architecture docs.
 * No Vite / import.meta here — this module must stay importable by the
 * non-Vite unit test runner. The Vite-only bundling lives in
 * architecture-docs.ts.
 */

/** Derive a topic key (filename without directory or extension) from a path. */
export function docTopicFromPath (path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.md$/, '')
}

/** Build a { topic -> markdown } map from import.meta.glob raw modules. */
export function buildDocMap (modules: Record<string, string>): Record<string, string> {
  const docs: Record<string, string> = {}
  for (const [path, content] of Object.entries(modules)) {
    docs[docTopicFromPath(path)] = content
  }
  return docs
}

/** Look up a doc by topic; on a miss, return the sorted list of valid topics. */
export function lookupArchitectureDoc (docs: Record<string, string>, topic: string): string {
  const content = docs[topic]
  if (content) return content
  const topics = Object.keys(docs).sort().join(', ')
  return `Unknown topic "${topic}". Available topics: ${topics}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/features/traces/architecture-docs.unit.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add ui/src/traces/architecture-docs-lookup.ts tests/features/traces/architecture-docs.unit.spec.ts
git commit -m "feat(evaluator): pure architecture-docs lookup helpers"
```

---

### Task 2: Vite bundling module

Bundle every architecture doc at build time and expose the map + sorted topic list. This is Vite-only; it is verified by type-check and the docker build, not by a unit test.

**Files:**
- Create: `ui/src/traces/architecture-docs.ts`

**Interfaces:**
- Consumes: `buildDocMap` (Task 1).
- Produces:
  - `architectureDocs: Record<string, string>`
  - `architectureTopics: string[]`

- [ ] **Step 1: Write the module**

Create `ui/src/traces/architecture-docs.ts`:

```ts
import { buildDocMap } from './architecture-docs-lookup.js'

// Bundle every architecture doc as raw markdown at build time.
// import.meta.glob is a Vite feature — this module is therefore browser/build
// only and must never be imported by the non-Vite unit test runner.
const modules = import.meta.glob('../../../docs/architecture/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>

export const architectureDocs = buildDocMap(modules)
export const architectureTopics = Object.keys(architectureDocs).sort()
```

- [ ] **Step 2: Type-check**

Run: `npm run check-types`
Expected: PASS (no type errors).

- [ ] **Step 3: Commit**

```bash
git add ui/src/traces/architecture-docs.ts
git commit -m "feat(evaluator): bundle architecture docs via import.meta.glob"
```

---

### Task 3: Author the integration-context doc

A new architecture doc describing how the agent is embedded in data-fair/portals and the tools/data it encounters there. Conceptual and durable — no `file:line` references. Content distilled from the spec's "Source material" appendix.

**Files:**
- Create: `docs/architecture/integration-context.md`

**Interfaces:**
- Consumes: nothing (picked up automatically by the Task 2 glob).
- Produces: a new topic `integration-context` available to `readArchitectureDoc`.

- [ ] **Step 1: Write the doc**

Create `docs/architecture/integration-context.md`:

```markdown
# Integration context (data-fair & portals)

The assistant is rarely used standalone. It is normally **embedded into a host
application** — most often the **data-fair** back-office or the **portals**
manager. When reviewing a session, assume this context unless the trace clearly
shows otherwise: the tools, links, and user intent all come from the host.

## How it is embedded

- The chat runs in a **browser iframe** beside the host application and shares
  the user's session (the authenticated user or organization is the owner).
- Tools are provided by the host and execute **client-side** over **WebMCP via a
  BroadcastChannel** between the iframe and the host frame. The agents service
  itself never calls the host's API directly — it only orchestrates the model
  and forwards tool calls back to the host frame.
- Integration is enabled per account, so not every account exposes host tools.

## Tools the agent typically encounters

### data-fair back-office

A rich tool surface (dozens of tools across sub-agents). The main families:

- **Navigation:** `navigate`, `list_pages`, `get_current_location`.
- **Dataset exploration:** `list_datasets`, `describe_dataset`,
  `get_dataset_schema`, `search_data`, `aggregate_data`, `calculate_metric`,
  `get_field_values`.
- **Metadata & expressions:** `set_dataset_summary`, `set_dataset_description`,
  `set_expression`, `test_expression`, `set_property_config`.
- **Data entry:** `open_add_line_dialog`, `open_edit_line_dialog`.
- **Applications (visualizations):** `list_applications`,
  `describe_application`, `get_application_config`.
- **Creation wizards** for new datasets and applications.
- **Connectors & catalogs:** `list_processings`, `list_catalogs`,
  `explore_github`; geolocation: `geocode_address`, `get_user_geolocation`.

### portals manager

A narrow surface: VJSF form sub-agents only — `pageConfig_form` and
`portalConfig_form` — which translate natural-language requests into form
mutations. The user still reviews and saves the form.

## Domain vocabulary

- **Dataset** — tabular data with a schema (typed columns), exposed as an API.
- **Application** — an interactive visualization (chart, map, table) built on
  one or more datasets.
- **Portal** — a public website publishing selected datasets and applications.
- **Users** are typically back-office administrators, dataset owners, or portal
  designers exploring or configuring data — not anonymous end-users.

## Quirks an evaluator should weigh

- **Absolute URLs are intentional.** Tool responses carry full absolute URLs and
  the assistant is told to use them verbatim; relative links break inside the
  cross-origin iframe. A response that "rewrote" a link to a relative path is a
  bug, not a cleanup.
- **`_c_`-prefixed column filters silently match nothing.** A filter like
  `_c_ville_eq` instead of `ville_eq` returns no rows without erroring.
- **Filter capability is error-driven.** The agent is not given an exhaustive
  per-column capability list; invalid filters return HTTP 400 with guidance and
  the agent self-corrects. Some 400s are therefore normal exploration, not
  failures.
- **Metadata/expression writes only fill the edit form.** Tools such as
  `set_dataset_summary`, `set_expression`, and `set_property_config` populate the
  host's client-side form; the user must still Save/Publish. The agent cannot
  commit changes autonomously, so "nothing was saved" can be expected behaviour.
```

- [ ] **Step 2: Commit**

```bash
git add docs/architecture/integration-context.md
git commit -m "docs(architecture): add integration-context doc for data-fair/portals"
```

---

### Task 4: Light trim of existing architecture docs

Make the existing docs leaner and less fragile so they serve as durable evaluator knowledge. **Light** = remove fragile references and obvious verbosity; do not restructure or rewrite explanations.

**Files (modify):** all existing `docs/architecture/*.md` —
`overview.md`, `gateway.md`, `providers.md`, `tool-exploration.md`,
`compaction.md`, `moderation.md`, `quotas-usage.md`, `tracing.md`,
`sub-agents.md`, `mcp-tools.md`, `embedding.md`.

**Interfaces:** none (content only).

**Trim rules (apply per file):**
1. Delete `:<line>` line-number suffixes from any reference (e.g.
   `api/src/usage/enforce.ts:71` → `api/src/usage/enforce.ts`, or drop the
   reference entirely if it carried no explanation).
2. Delete reference-only footers — a trailing `**Key file(s):**` block or a
   bullet list of bare file paths whose only content is "path — short label".
   These are the flakiest part and add no conceptual value.
3. Where a file path is woven into an explanatory sentence and aids
   understanding, you may keep the path but drop any `:line`.
4. Trim plainly redundant verbosity (sentences that restate the preceding one).
   Keep all distinct explanations, diagrams, and tables.

**Worked example — `compaction.md`:** the trailing block

```
**Key files:**
- `ui/src/composables/use-agent-chat.ts` — `compactHistory()`
- `api/src/summary/router.ts` — Server-side summarization endpoint
```

is a reference-only footer → **delete the whole block** (rule 2). Keep the rest
of the file (threshold, mermaid diagram, "last user message preserved" note).

- [ ] **Step 1: Find the fragile references**

Run: `grep -rnE ':[0-9]+|Key files?:' docs/architecture/*.md`
This lists every `:line` reference and every reference footer to address. Heavily
affected: `quotas-usage.md`, `mcp-tools.md`, `tracing.md`, `sub-agents.md`.

- [ ] **Step 2: Apply the trim rules to each file**

Edit each listed doc per the four rules above. Do not change headings,
diagrams, tables, or the substance of any explanation. When unsure whether
something is "explanation" or "reference," keep it.

- [ ] **Step 3: Verify references are gone and docs still read**

Run: `grep -rnE ':[0-9]+' docs/architecture/*.md`
Expected: no remaining source `:line` references (matches inside mermaid/code
blocks that are not source references may remain — use judgement).
Then skim each edited file to confirm explanations are intact.

- [ ] **Step 4: Commit**

```bash
git add docs/architecture/*.md
git commit -m "docs(architecture): light trim of fragile file references and verbosity"
```

---

### Task 5: Add the readArchitectureDoc evaluator tool

Wire the bundled docs into the evaluator as a new tool.

**Files:**
- Modify: `ui/src/traces/evaluator-tools.ts`

**Interfaces:**
- Consumes: `architectureDocs`, `architectureTopics` (Task 2);
  `lookupArchitectureDoc` (Task 1).
- Produces: a `readArchitectureDoc` tool in the object returned by
  `buildEvaluatorTools`.

- [ ] **Step 1: Add the imports**

In `ui/src/traces/evaluator-tools.ts`, below the existing imports
(after `import type { SessionRecorder, TraceOverviewEntry } from './session-recorder.js'`):

```ts
import { architectureDocs, architectureTopics } from './architecture-docs.js'
import { lookupArchitectureDoc } from './architecture-docs-lookup.js'
```

- [ ] **Step 2: Add the tool to the returned object**

In `buildEvaluatorTools`, add this entry inside the `return { ... }` object
(e.g. immediately after the `getSessionConfig` tool, before
`summarizePhysicalRequest`):

```ts
    readArchitectureDoc: tool({
      description: 'Read one of this platform\'s architecture docs to understand how a feature actually behaves (compaction, moderation, sub-agents, quotas, gateway, tracing, integration-context, etc.) before judging it. Pass an unknown topic to get the list of available topics.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: architectureTopics,
            description: 'The architecture doc to read (filename without extension)'
          }
        },
        required: ['topic']
      }),
      execute: async (args: { topic: string }) => lookupArchitectureDoc(architectureDocs, args.topic)
    }),
```

- [ ] **Step 3: Type-check**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add ui/src/traces/evaluator-tools.ts
git commit -m "feat(evaluator): add readArchitectureDoc tool"
```

---

### Task 6: Add the platform overview to the evaluator prompt

Give the evaluator conceptual grounding and tell it to read the docs. General only — no hardcoded example answers.

**Files:**
- Modify: `ui/src/traces/evaluator-prompt.ts`

**Interfaces:**
- Consumes: the `readArchitectureDoc` tool (Task 5) and its topics, by name.
- Produces: the updated `EVALUATOR_PROMPT`.

- [ ] **Step 1: Replace the prompt body**

Replace the entire contents of `ui/src/traces/evaluator-prompt.ts` with:

```ts
export const EVALUATOR_PROMPT = `You are an AI session evaluator. You analyze conversation traces between a user and an AI assistant to help improve the system.

The user will ask you about what happened during the session — what went well, what went wrong, and how to improve prompts, tools, or model configuration.

## How this platform works

This assistant is one part of a larger platform whose behaviours you should understand before judging a session — don't infer them from raw trace fields alone. Read the architecture docs with the readArchitectureDoc tool:

- Call readArchitectureDoc('overview') first for the system map.
- Then read the specific doc for whatever you are evaluating. Topics cover the platform's distinct model roles (assistant, tools, summarizer, moderator, evaluator), compaction, moderation, sub-agents, quotas/usage, the gateway, and MCP tools. Pass an unknown topic to readArchitectureDoc to list every available doc.
- The assistant usually runs embedded inside data-fair or portals; read readArchitectureDoc('integration-context') to understand the tools, links, and data it works with there.

Ground your judgements in these documented behaviours rather than assuming meaning from trace fields.

## Exploring the trace

Use the provided tools to explore the session trace. Start with getTraceOverview to understand the session flow, then use getTraceEntry or getTraceEntries to examine specific parts in detail. Use getSessionConfig to review the system prompt and available tools.

For physical-request entries, prefer summarizePhysicalRequest over getTraceEntry when the payload is large — it returns a focused analysis instead of the raw context.

Be specific in your analysis. Reference concrete trace entries by index. When suggesting improvements, explain what you observed and what change would address it.`
```

- [ ] **Step 2: Type-check**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add ui/src/traces/evaluator-prompt.ts
git commit -m "feat(evaluator): add platform overview to system prompt"
```

---

### Task 7: Full quality gate

Final verification across the whole change.

**Files:** none (verification only).

- [ ] **Step 1: Lint**

Run: `npm run lint-fix`
Expected: no errors (the pre-existing `v-html` warning in `MarkdownContent.vue` is unrelated and acceptable).

- [ ] **Step 2: Type-check**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 3: Run the new unit test**

Run: `npm run test tests/features/traces/architecture-docs.unit.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 4: Docker build (bundles the docs via Vite)**

Run: `docker build -t agents .`
Expected: build succeeds — this confirms `import.meta.glob` resolves the docs at
build time.

- [ ] **Step 5: Commit any lint fixups**

```bash
git add -A
git commit -m "chore: lint fixups for system-aware evaluator" || echo "nothing to commit"
```

---

## Self-review notes

- **Spec coverage:** docs light-trim → Task 4; integration-context doc → Task 3;
  bundling → Task 2; readArchitectureDoc tool → Task 5; prompt overview → Task 6;
  unit test → Task 1; general (no hardcoded trap) → enforced in Task 6 copy.
- **Testability constraint** (unit runner has no Vite) is handled by the
  Task 1 / Task 2 split and called out in Global Constraints.
- **Type/name consistency:** `architectureDocs`, `architectureTopics`,
  `buildDocMap`, `docTopicFromPath`, `lookupArchitectureDoc`, `readArchitectureDoc`
  used consistently across Tasks 1, 2, 5.
```
