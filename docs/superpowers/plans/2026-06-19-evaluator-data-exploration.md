# Evaluator data-exploration tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the trace evaluator read-only data-exploration tools, scoped to the conversation's owner account, so it can verify data/metadata claims against the live data-fair API.

**Architecture:** A new client-side module in the agents UI (`ui/src/traces/evaluator-data-tools.ts`) builds AI-SDK tools from the published `@data-fair/agent-tools-data-fair` package, plus one evaluator-specific raw-metadata tool. Each tool's `execute` fetches the same-origin data-fair API (`${$sitePath}/data-fair/api/v1`) with the reviewer's session cookie, scoping `list_datasets` to the conversation account via an `owner=type:id[:department]` filter. `EvaluatorChat.vue` merges these flat into the evaluator's `localTools` alongside the existing trace-inspection tools.

**Tech Stack:** TypeScript, Vue 3, Vercel AI SDK (`ai`), `ofetch`, Playwright test runner (unit project), `@data-fair/agent-tools-data-fair`.

## Global Constraints

- Tools are **read-only** and **flat** (not wrapped in a `subagent_*` pseudo-tool).
- Every network failure must **degrade gracefully** to a message string — never throw out of an `execute`.
- `list_datasets` is the only tool needing owner scoping; all others take a global `datasetId`.
- Owner filter format (verbatim, per data-fair `api/src/misc/utils/find.ts`): `owner=type:id` or `owner=type:id:department`.
- `showAll` is **not** sent (datasets ignore it). Superadmin cross-account access relies on the existing `adminMode` session; no data-fair change.
- Data-fair API base path: `$sitePath + '/data-fair/api/v1'` (from `ui/src/context.ts`).
- The module must be importable under the non-Vite unit runner (no `import.meta.glob`); the network call is injectable via an `apiFetch` option for tests.
- Follow the existing tool style in `ui/src/traces/evaluator-tools.ts` (`tool()` + `jsonSchema()` from `ai`, `execute` returning a string).

---

### Task 1: Module scaffold + `list_datasets` (owner-scoped, graceful)

**Files:**
- Modify: `ui/package.json` (add dependency)
- Create: `ui/src/traces/evaluator-data-tools.ts`
- Test: `tests/features/traces/evaluator-data-tools.unit.spec.ts`

**Interfaces:**
- Consumes: `@data-fair/agent-tools-data-fair/list-datasets` (`schema`, `buildQuery(params)`, `formatResult(data, page, size, options?)`, `Params`).
- Produces: `buildEvaluatorDataTools(opts: EvaluatorDataToolsOpts): Record<string, Tool>` where
  ```ts
  interface EvaluatorDataToolsOpts {
    accountType: string
    accountId: string
    department?: string
    dataFairApiPath: string
    apiFetch?: (path: string, opts?: { query?: Record<string, string> }) => Promise<any>
  }
  ```
  In this task the returned record has exactly one key: `list_datasets`. Later tasks add more keys to the same function.

- [ ] **Step 1: Add the dependency**

In `ui/package.json`, add to `"dependencies"` (keep alphabetical near other `@data-fair/*` entries):

```json
"@data-fair/agent-tools-data-fair": "^0.6.3",
```

Then install:

Run: `npm install`
Expected: completes; `node_modules/@data-fair/agent-tools-data-fair/list-datasets.js` exists.

> If the package is not resolvable from the registry in this environment, stop and report — do not vendor it ad hoc. data-fair publishes it from `~/data-fair/data-fair/agent-tools`.

- [ ] **Step 2: Write the failing test**

Create `tests/features/traces/evaluator-data-tools.unit.spec.ts`:

```ts
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { buildEvaluatorDataTools } from '../../../ui/src/traces/evaluator-data-tools.ts'

test.describe('evaluator data tools (unit)', () => {
  test('list_datasets injects the account owner filter', async () => {
    const calls: any[] = []
    const tools = buildEvaluatorDataTools({
      accountType: 'organization',
      accountId: 'koumoul',
      dataFairApiPath: '/x',
      apiFetch: async (path, o) => { calls.push({ path, query: o?.query }); return { results: [], count: 0 } }
    })
    await (tools.list_datasets as any).execute({}, {})
    assert.equal(calls[0].path, 'datasets')
    assert.equal(calls[0].query.owner, 'organization:koumoul')
  })

  test('owner filter includes department when present', async () => {
    const calls: any[] = []
    const tools = buildEvaluatorDataTools({
      accountType: 'organization',
      accountId: 'koumoul',
      department: 'dep1',
      dataFairApiPath: '/x',
      apiFetch: async (_path, o) => { calls.push({ query: o?.query }); return { results: [] } }
    })
    await (tools.list_datasets as any).execute({}, {})
    assert.equal(calls[0].query.owner, 'organization:koumoul:dep1')
  })

  test('a fetch failure degrades gracefully instead of throwing', async () => {
    const tools = buildEvaluatorDataTools({
      accountType: 'user',
      accountId: 'u1',
      dataFairApiPath: '/x',
      apiFetch: async () => { const e: any = new Error('nope'); e.response = { status: 404 }; throw e }
    })
    const res = await (tools.list_datasets as any).execute({}, {})
    assert.match(res, /unavailable/i)
    assert.match(res, /404/)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test tests/features/traces/evaluator-data-tools.unit.spec.ts`
Expected: FAIL — cannot find module `evaluator-data-tools.ts`.

- [ ] **Step 4: Write the module**

Create `ui/src/traces/evaluator-data-tools.ts`:

```ts
import { tool, jsonSchema } from 'ai'
import type { Tool } from 'ai'
import { ofetch } from 'ofetch'
import * as listDatasets from '@data-fair/agent-tools-data-fair/list-datasets'

export interface EvaluatorDataToolsOpts {
  accountType: string
  accountId: string
  department?: string
  dataFairApiPath: string
  // injectable for tests; defaults to a same-origin, credentialed ofetch instance
  apiFetch?: (path: string, opts?: { query?: Record<string, string> }) => Promise<any>
}

const UNAVAILABLE = 'Data exploration is unavailable here (the data-fair API could not be reached). This evaluator may be running outside a data-fair deployment, or a superadmin may need to enable admin mode to access this account.'

export function buildEvaluatorDataTools (opts: EvaluatorDataToolsOpts): Record<string, Tool> {
  const apiFetch = opts.apiFetch ?? ofetch.create({ baseURL: opts.dataFairApiPath, credentials: 'include' })
  const ownerFilter = opts.department
    ? `${opts.accountType}:${opts.accountId}:${opts.department}`
    : `${opts.accountType}:${opts.accountId}`

  // Wrap an execute so any fetch failure degrades to a clear message instead of throwing.
  const safe = <A>(fn: (args: A) => Promise<string>) => async (args: A): Promise<string> => {
    try {
      return await fn(args)
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status
      return status ? `${UNAVAILABLE} (HTTP ${status})` : UNAVAILABLE
    }
  }

  return {
    list_datasets: tool({
      description: listDatasets.schema.description,
      inputSchema: jsonSchema(listDatasets.schema.inputSchema as any),
      execute: safe(async (params: listDatasets.Params) => {
        const { path, query } = listDatasets.buildQuery(params)
        query.owner = ownerFilter
        const data = await apiFetch(path, { query })
        const page = Math.max(params.page || 1, 1)
        const size = Math.min(Math.max(params.size || 10, 1), 50)
        return listDatasets.formatResult(data, page, size).text
      })
    })
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test tests/features/traces/evaluator-data-tools.unit.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Type-check**

Run: `npm run check-types`
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add ui/package.json package-lock.json ui/src/traces/evaluator-data-tools.ts tests/features/traces/evaluator-data-tools.unit.spec.ts
git commit -m "feat(evaluator): owner-scoped list_datasets data tool"
```

---

### Task 2: The six remaining package tools

**Files:**
- Modify: `ui/src/traces/evaluator-data-tools.ts`
- Test: `tests/features/traces/evaluator-data-tools.unit.spec.ts`

**Interfaces:**
- Consumes (each a namespace import with `schema`, `buildQuery`/none, `formatResult`, `Params`):
  - `describe-dataset`: `formatResult(fetchedData, options?)` — **no** `buildQuery`; fetch `datasets/{id}` directly.
  - `get-dataset-schema`: `buildQuery(params) → { schemaReq, samplesReq }`, `formatResult(dataset, linesData) → string`.
  - `search-data`: `buildQuery(params) → { path, query }`, `formatResult(data, params)`; `Params` includes optional `next` (a follow URL).
  - `aggregate-data`, `calculate-metric`: `buildQuery(params) → { path, query }`, `formatResult(data, params)`.
  - `get-field-values`: `buildQuery(params) → { path, query }`, `formatResult(values, params)`.
- Produces: adds keys `describe_dataset`, `get_dataset_schema`, `search_data`, `aggregate_data`, `calculate_metric`, `get_field_values` to the returned record.

- [ ] **Step 1: Write the failing test**

Append inside the `test.describe` block in `tests/features/traces/evaluator-data-tools.unit.spec.ts`:

```ts
  test('search_data fetches by datasetId and returns formatted text (no owner filter)', async () => {
    const calls: any[] = []
    const tools = buildEvaluatorDataTools({
      accountType: 'user',
      accountId: 'u1',
      dataFairApiPath: '/x',
      apiFetch: async (path, o) => { calls.push({ path, query: o?.query }); return { total: 0, results: [] } }
    })
    const res = await (tools.search_data as any).execute({ datasetId: 'ds1' }, {})
    assert.equal(calls[0].path, 'datasets/ds1/lines')
    assert.equal(calls[0].query.owner, undefined)
    assert.equal(typeof res, 'string')
  })

  test('get_dataset_schema issues both the schema and samples requests', async () => {
    const paths: string[] = []
    const tools = buildEvaluatorDataTools({
      accountType: 'user',
      accountId: 'u1',
      dataFairApiPath: '/x',
      apiFetch: async (path) => { paths.push(path); return path.endsWith('/lines') ? { results: [] } : { schema: [], title: 'T', slug: 's' } }
    })
    await (tools.get_dataset_schema as any).execute({ datasetId: 'ds1' }, {})
    assert.ok(paths.includes('datasets/ds1'))
    assert.ok(paths.includes('datasets/ds1/lines'))
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/traces/evaluator-data-tools.unit.spec.ts`
Expected: FAIL — `tools.search_data` / `tools.get_dataset_schema` is undefined.

- [ ] **Step 3: Implement the six tools**

In `ui/src/traces/evaluator-data-tools.ts`, add the imports under the existing one:

```ts
import * as describeDataset from '@data-fair/agent-tools-data-fair/describe-dataset'
import * as getDatasetSchema from '@data-fair/agent-tools-data-fair/get-dataset-schema'
import * as searchData from '@data-fair/agent-tools-data-fair/search-data'
import * as aggregateData from '@data-fair/agent-tools-data-fair/aggregate-data'
import * as calculateMetric from '@data-fair/agent-tools-data-fair/calculate-metric'
import * as getFieldValues from '@data-fair/agent-tools-data-fair/get-field-values'
```

Add these entries to the returned object (after `list_datasets`):

```ts
    describe_dataset: tool({
      description: describeDataset.schema.description,
      inputSchema: jsonSchema(describeDataset.schema.inputSchema as any),
      execute: safe(async (params: { datasetId: string }) => {
        const dataset = await apiFetch(`datasets/${encodeURIComponent(params.datasetId)}`)
        return describeDataset.formatResult(dataset, { includeOwner: true }).text
      })
    }),

    get_dataset_schema: tool({
      description: getDatasetSchema.schema.description,
      inputSchema: jsonSchema(getDatasetSchema.schema.inputSchema as any),
      execute: safe(async (params: getDatasetSchema.Params) => {
        const { schemaReq, samplesReq } = getDatasetSchema.buildQuery(params)
        const [dataset, linesData] = await Promise.all([
          apiFetch(schemaReq.path, { query: schemaReq.query }),
          apiFetch(samplesReq.path, { query: samplesReq.query })
        ])
        return getDatasetSchema.formatResult(dataset, linesData)
      })
    }),

    search_data: tool({
      description: searchData.schema.description,
      inputSchema: jsonSchema(searchData.schema.inputSchema as any),
      execute: safe(async (params: searchData.Params) => {
        let data: any
        if (params.next) {
          data = await apiFetch(params.next)
        } else {
          const { path, query } = searchData.buildQuery(params)
          data = await apiFetch(path, { query })
        }
        return searchData.formatResult(data, params).text
      })
    }),

    aggregate_data: tool({
      description: aggregateData.schema.description,
      inputSchema: jsonSchema(aggregateData.schema.inputSchema as any),
      execute: safe(async (params: aggregateData.Params) => {
        const { path, query } = aggregateData.buildQuery(params)
        const data = await apiFetch(path, { query })
        return aggregateData.formatResult(data, params).text
      })
    }),

    calculate_metric: tool({
      description: calculateMetric.schema.description,
      inputSchema: jsonSchema(calculateMetric.schema.inputSchema as any),
      execute: safe(async (params: calculateMetric.Params) => {
        const { path, query } = calculateMetric.buildQuery(params)
        const data = await apiFetch(path, { query })
        return calculateMetric.formatResult(data, params).text
      })
    }),

    get_field_values: tool({
      description: getFieldValues.schema.description,
      inputSchema: jsonSchema(getFieldValues.schema.inputSchema as any),
      execute: safe(async (params: getFieldValues.Params) => {
        const { path, query } = getFieldValues.buildQuery(params)
        const values = await apiFetch(path, { query })
        return getFieldValues.formatResult(values, params).text
      })
    }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/features/traces/evaluator-data-tools.unit.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Type-check**

Run: `npm run check-types`
Expected: no new errors. (If a `Params` namespace type is not resolved, confirm the package subpath has its `.d.ts`; do not switch to `any` unless a type genuinely is not exported.)

- [ ] **Step 6: Commit**

```bash
git add ui/src/traces/evaluator-data-tools.ts tests/features/traces/evaluator-data-tools.unit.spec.ts
git commit -m "feat(evaluator): add dataset describe/schema/search/aggregate/metric/field-values tools"
```

---

### Task 3: `get_dataset_metadata_raw` tool

**Files:**
- Modify: `ui/src/traces/evaluator-data-tools.ts`
- Test: `tests/features/traces/evaluator-data-tools.unit.spec.ts`

**Interfaces:**
- Produces: adds key `get_dataset_metadata_raw` to the returned record. No package dependency — it fetches `datasets/{id}` with no `select` and returns `JSON.stringify(dataset, null, 2)`.

- [ ] **Step 1: Write the failing test**

Append inside the `test.describe` block:

```ts
  test('get_dataset_metadata_raw returns the full dataset JSON with no select', async () => {
    const calls: any[] = []
    const tools = buildEvaluatorDataTools({
      accountType: 'user',
      accountId: 'u1',
      dataFairApiPath: '/x',
      apiFetch: async (path, o) => { calls.push({ path, query: o?.query }); return { id: 'ds1', title: 'T', schema: [] } }
    })
    const res = await (tools.get_dataset_metadata_raw as any).execute({ datasetId: 'ds1' }, {})
    assert.equal(calls[0].path, 'datasets/ds1')
    assert.equal(calls[0].query, undefined)
    assert.match(res, /"id": "ds1"/)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/features/traces/evaluator-data-tools.unit.spec.ts`
Expected: FAIL — `tools.get_dataset_metadata_raw` is undefined.

- [ ] **Step 3: Implement the tool**

Add to the returned object (after `get_field_values`):

```ts
    get_dataset_metadata_raw: tool({
      description: 'Returns the complete raw metadata JSON for a dataset (full schema with every field attribute, extensions, capabilities, license, topics, etc.). Use it to assess metadata quality (missing titles/descriptions/concepts/labels) and to check whether the assistant\'s own tools (describe_dataset / get_dataset_schema) omitted relevant information. Takes the dataset id from list_datasets.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          datasetId: { type: 'string', description: 'The exact dataset ID from list_datasets results.' }
        },
        required: ['datasetId']
      }),
      execute: safe(async (params: { datasetId: string }) => {
        const dataset = await apiFetch(`datasets/${encodeURIComponent(params.datasetId)}`)
        return JSON.stringify(dataset, null, 2)
      })
    }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/features/traces/evaluator-data-tools.unit.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add ui/src/traces/evaluator-data-tools.ts tests/features/traces/evaluator-data-tools.unit.spec.ts
git commit -m "feat(evaluator): add get_dataset_metadata_raw tool"
```

---

### Task 4: Wire data tools into `EvaluatorChat` (+ thread department)

**Files:**
- Modify: `ui/src/components/EvaluatorChat.vue`
- Modify: `ui/src/components/TraceReview.vue`

**Interfaces:**
- Consumes: `buildEvaluatorDataTools` (Task 1–3), `$sitePath` from `~/context`.
- Produces: the evaluator chat's `localTools` now include the seven data tools merged with the existing trace tools. `EvaluatorChat` gains an optional `department` prop.

- [ ] **Step 1: Add `department` to the evaluator owner in `TraceReview.vue`**

Widen the `owner` ref type and pass `department` to `EvaluatorChat`. In `ui/src/components/TraceReview.vue`:

Change the ref declaration:

```ts
const owner = ref<{ type: string, id: string, department?: string } | null>(null)
```

Change the `fetchTrace` return type and both `owner` typings from `{ type: string, id: string }` to `{ type: string, id: string, department?: string }` (the function signature line and the `loaded.owner` comparison still work unchanged).

On the `<evaluator-chat>` element (the one with `:account-type="owner.type"` / `:account-id="owner.id"`), add:

```vue
:department="owner.department"
```

- [ ] **Step 2: Merge data tools in `EvaluatorChat.vue`**

In `ui/src/components/EvaluatorChat.vue`:

Update the context import:

```ts
import { $apiPath, $sitePath } from '~/context'
import { buildEvaluatorDataTools } from '~/traces/evaluator-data-tools'
```

Add the prop (extend the existing `defineProps`):

```ts
const props = defineProps<{
  recorder: SessionRecorder
  recorderB?: SessionRecorder
  accountType: string
  accountId: string
  department?: string
}>()
```

Replace the `localTools` value:

```ts
  localTools: {
    ...buildEvaluatorTools(
      props.recorder,
      { accountType: props.accountType, accountId: props.accountId, apiPath: $apiPath, architectureDocs, architectureTopics },
      props.recorderB
    ),
    ...buildEvaluatorDataTools({
      accountType: props.accountType,
      accountId: props.accountId,
      department: props.department,
      dataFairApiPath: $sitePath + '/data-fair/api/v1'
    })
  },
```

- [ ] **Step 3: Type-check**

Run: `npm run check-types`
Expected: no new errors.

- [ ] **Step 4: Lint**

Run: `npm run lint-fix`
Expected: no errors (one pre-existing `v-html` warning in `MarkdownContent.vue` is unrelated).

- [ ] **Step 5: Commit**

```bash
git add ui/src/components/EvaluatorChat.vue ui/src/components/TraceReview.vue
git commit -m "feat(evaluator): expose data-exploration tools in the trace review chat"
```

---

### Task 5: Tell the evaluator about the data tools

**Files:**
- Modify: `ui/src/traces/evaluator-prompt.ts`

**Interfaces:**
- Produces: `EVALUATOR_PROMPT` gains a section describing the data tools. No code consumes new symbols.

- [ ] **Step 1: Add the section**

In `ui/src/traces/evaluator-prompt.ts`, insert this block into the `EVALUATOR_PROMPT` template, immediately **before** the final paragraph that begins `Be specific in your analysis.`:

```
## Exploring the data (data-fair context)

When the session ran inside data-fair you also have read-only tools to inspect the actual data of the conversation's account, scoped automatically to that account: list_datasets, describe_dataset, get_dataset_schema, search_data, aggregate_data, calculate_metric, get_field_values, and get_dataset_metadata_raw.

Use them to check claims against ground truth rather than judging from the trace text alone — for example whether a dataset really lacks a description, whether the schema has proper titles/labels, or whether a search the assistant ran would actually return rows. get_dataset_metadata_raw returns the full, untrimmed metadata: use it both to assess metadata quality and to check whether the assistant's own describe_dataset / get_dataset_schema calls omitted something relevant.

These tools may report that exploration is unavailable — this is expected when the evaluator is not running inside a data-fair deployment, or when a superadmin reviewing another account has not enabled admin mode. Treat that as "could not verify", not as a finding about the session.

```

- [ ] **Step 2: Type-check**

Run: `npm run check-types`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add ui/src/traces/evaluator-prompt.ts
git commit -m "feat(evaluator): document data-exploration tools in the prompt"
```

---

## Self-Review notes

- **Spec coverage:** dependency (T1) ✓; client-side owner-scoped tools (T1–T2) ✓; raw metadata tool (T3) ✓; flat-not-subagent (Global Constraints + T4 merges flat) ✓; same-origin authed fetch via `$sitePath` (T4) ✓; account-only scoping, no `showAll`, adminMode reliance (Global Constraints + graceful message) ✓; graceful degradation (T1 `safe`) ✓; prompt note (T5) ✓; unit tests with stubbed fetch (T1–T3) ✓; no e2e (none planned — agents dev stack has no data-fair) ✓. `publicationSite` is explicitly deferred in the spec — no task, intentional.
- **Type consistency:** `buildEvaluatorDataTools` / `EvaluatorDataToolsOpts` / `apiFetch` signature used identically across tasks; `department` threaded `TraceReview → EvaluatorChat → buildEvaluatorDataTools` as `department?: string` throughout.
- **Manual verification (optional, needs a real data-fair deployment):** open a stored conversation's trace review embedded in data-fair, ask the evaluator to "list the datasets and check the first one's metadata"; confirm `list_datasets` returns the account's datasets and `get_dataset_metadata_raw` returns full JSON. Not automatable here.
