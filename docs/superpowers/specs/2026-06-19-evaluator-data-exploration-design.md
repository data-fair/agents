# Evaluator data-exploration tools (data-fair context) — design

Date: 2026-06-19
Status: approved design, pending implementation plan

## Problem

The trace **evaluator** (an admin-only chat that reviews stored conversation
traces, in `ui/src/traces/` + `ui/src/components/EvaluatorChat.vue`) can inspect
the *recorded trace* (system prompt, messages, tool calls, token usage) but has
**no access to the actual data** the traced session was about. When the agent
runs embedded in **data-fair**, the conversation is typically about the account's
datasets — and the evaluator cannot check claims that require looking at the live
data: e.g. "the assistant said the dataset has no description" or "the schema is
missing field labels". It can only judge from the trace text.

We want the evaluator, **when opened in a data-fair context**, to have the same
**read-only data-exploration tools** the normal agent has, scoped to the
**account of the conversation under review**, so it can extend its evaluation to
the real data (missing description elements, schema quality, whether a claimed
search would actually return rows, etc.).

## Goals

- Give the evaluator the read-only data-exploration tool family the normal agent
  has in data-fair, instantiated **inside the agents repo** (not via the
  iframe/WebMCP tool-sharing channel).
- Scope every read to the **conversation's owner account**, so a **superadmin**
  reviewing another account's trace explores *that* account's data, not their own.
- Degrade gracefully when data-fair is not reachable (pure-agents deployment /
  dev stack) — the tools are always registered but report unavailability instead
  of breaking the evaluator.

## Non-goals

- No navigation, metadata-write, data-entry, or creation tools — read-only
  exploration only. The evaluator reviews a past session; it must not drive or
  mutate the live host.
- No reliance on the WebMCP-over-BroadcastChannel iframe tool-sharing the normal
  agent uses (explicitly rejected in favour of reusing the tool package here).
- No `publicationSite` scoping in v1 — traces do not capture it (see Deferred).
- No new server-side endpoint or service credentials in the agents API. Auth
  reuses the reviewing admin's own data-fair session.

## Approach (client-side, session-reuse)

The agents UI is served same-origin under the data-fair domain when embedded
(`d-frame` → `/agents/{type}/{id}/`), and the data-fair API lives at
`${$sitePath}/data-fair/api/v1` on that same origin. So the evaluator — running
in the reviewing admin's browser — can call the data-fair API **directly** with
`credentials: 'include'`, and data-fair authorizes the reads using the admin's
existing session. This mirrors data-fair's own `ui/src/composables/dataset/
agent-data-tools.ts`, but lives in the agents repo.

The exploration tools are built from the published
**`@data-fair/agent-tools-data-fair`** package (the same `schema` / `buildQuery`
/ `formatResult` data-fair itself wires), added as a UI dependency. We supply our
own `execute` that fetches from the data-fair API.

`useAgentChat` stays on the existing `localTools` path (it is either `localTools`
*or* the frame aggregator — never both); we simply assemble a **larger
`localTools` set** by merging the new data tools with the existing trace tools.
No change to the frame-aggregator logic.

## Components

### 1. New UI dependency

Add `@data-fair/agent-tools-data-fair` (v0.6.x) to `ui/package.json`. It is a
zero-dependency package exporting per-tool `schema`, `buildQuery`, `formatResult`,
`annotations`.

### 2. New module — `ui/src/traces/evaluator-data-tools.ts`

`buildEvaluatorDataTools(opts): Record<string, Tool>` where
`opts = { accountType, accountId, department?, dataFairApiPath }`.

Builds the read-only family from the package:

- `list_datasets` — execute injects an **owner filter** into the query so results
  are scoped to the conversation account:
  `owner = department ? \`${type}:${id}:${department}\` : \`${type}:${id}\``
  (format per data-fair `api/src/misc/utils/find.ts`: `owner=type:id[:department]`).
- `describe_dataset`, `get_dataset_schema`, `search_data`, `aggregate_data`,
  `calculate_metric`, `get_field_values` — these take a globally-unique
  `datasetId` (obtained from the owner-scoped `list_datasets`), so they need no
  extra scoping.
- `get_dataset_metadata_raw` — **evaluator-specific, not from the package.**
  `GET ${dataFairApiPath}/datasets/${datasetId}` (no `select`) → the complete
  enriched metadata doc, returned as `JSON.stringify(dataset, null, 2)`. The
  curated tools deliberately trim metadata: `describe_dataset`'s `formatResult`
  reshapes columns to a curated set and `get_dataset_schema` selects only
  `schema,title,slug` — so neither surfaces field attributes like `x-refersTo`,
  `x-calculated`, `x-extension`, `x-capabilities`, `format`, `readOnly`, nor
  dataset-level config (extensions, masterData, rest/virtual, attachments,
  primaryKey). This raw view lets the evaluator (a) judge metadata quality
  directly (missing titles/descriptions/concepts/labels, license, topics) and
  (b) **meta-evaluate the traced agent's own tools** — compare the raw truth
  against what the agent's `describe_dataset`/`get_dataset_schema` calls actually
  surfaced, and flag when curated tooling dropped something relevant. Read-only,
  global `datasetId`, no owner scoping. Same graceful-degradation path.

Each `execute`:

1. `const { path, query } = pkg.buildQuery(params)` (+ owner injection for
   `list_datasets`);
2. `fetch(\`${opts.dataFairApiPath}/${path}?<query>\`, { credentials: 'include' })`;
3. on success: `pkg.formatResult(...)` and return the text/structuredContent shape
   the existing tools use;
4. on `!res.ok` or a thrown network error: return a clear **graceful-degradation**
   string, e.g. *"Data exploration is unavailable here (the data-fair API returned
   HTTP 404). This evaluator may be running outside a data-fair deployment."* —
   so the model stops retrying.

The module does no `import.meta.glob` (unlike `architecture-docs.ts`), so it is
unit-testable under the non-Vite runner with a stubbed `fetch`.

### 3. `ui/src/components/EvaluatorChat.vue`

Derive `dataFairApiPath = $sitePath + '/data-fair/api/v1'` from `~/context`, and
merge the data tools into `localTools`:

```ts
localTools: {
  ...buildEvaluatorTools(props.recorder, { ...existing }, props.recorderB),
  ...buildEvaluatorDataTools({
    accountType: props.accountType,   // = conversation owner (already passed)
    accountId: props.accountId,
    department: props.department,      // add to props if available from owner
    dataFairApiPath
  })
}
```

`accountType`/`accountId` already come from the **conversation's** resolved owner
(`TraceReview.vue` → `GET /traces/conversation/:convId`), so superadmin targeting
is automatic. Tool-name collisions are impossible (trace tools are camelCase, data
tools snake_case).

### 4. `ui/src/traces/evaluator-prompt.ts`

Add a short note to `EVALUATOR_PROMPT`: when reviewing a data-fair session the
evaluator has read-only tools (`list_datasets`, `search_data`, `get_dataset_schema`,
`get_dataset_metadata_raw`, …) scoped to the conversation's account, and should
use them to verify data/metadata claims (missing descriptions, schema quality,
whether a search would return rows) rather than judging from the trace text alone.
Call out that `get_dataset_metadata_raw` returns the *full* metadata and can be
used both to assess metadata quality and to check whether the agent's own tools
omitted relevant information. Note these tools may report unavailability when not
in a data-fair deployment (or when a superadmin is not in admin mode).

### 5. Tool exposure — flat, not a sub-agent

The data tools are added **flat** to the evaluator's `localTools`, *not* wrapped
in a `subagent_dataset_data` pseudo-tool the way data-fair exposes them to the
normal agent. Rationale: the evaluator is the high-reasoning "quality controller"
and must see raw tool results to judge them; a sub-agent would interpose the
weaker `tools`-role model and return only a digest — the wrong tradeoff for
ground-truth checking. Flat also matches how the evaluator already uses its
trace-inspection tools (`getTraceOverview`, …). (The `useAgentChat` sub-agent
machinery is always on, so a `subagent_*` entry *would* be auto-wrapped — we
deliberately don't use it here.) Considered for a v2 if exploration grows heavy
enough to crowd the evaluator's context, in which case a sub-agent with an
evaluation-specific prompt would be introduced.

### 6. Compare mode

The data tools are owner-scoped, and comparison is restricted to traces of the
**same owner**, so both traces A and B share one account. No `trace: A|B` selector
is needed on the data tools (unlike the trace-inspection tools).

## Authorization

Reads reuse the reviewing admin's own data-fair session cookie (same-origin), so
data-fair's existing permission model decides what is visible. No data-fair change.

- **Account admin reviewing own account:** as an org admin they already have list
  rights on their org's datasets; `owner=<their account>` returns them. Works.
- **Superadmin reviewing another account:** the lever for *datasets* is
  **`adminMode`**, the shared simple-directory session elevation. In data-fair's
  `permissions.filterCan`, an `adminMode` session matches **all owners**
  (`{ 'owner.type': { $exists: true } }`), so combined with our `owner=type:id`
  filter it returns exactly the conversation account's datasets.
  - **`showAll=true` is *not* used.** It is honored only for global-mode
    resources (remote-services, base-applications) in `api/src/misc/utils/find.ts`;
    for datasets (normal mode) it is silently ignored. We do not send it.
  - **Decision: rely on `adminMode`, degrade otherwise.** The agents superadmin
    review route gates on `isAdmin` (capability), *not* active `adminMode`. If the
    reviewing superadmin has elevated to admin mode, cross-account exploration
    works; if not, the tools return only what that session is permitted to see
    (graceful degradation, same path as the unavailable case). Optionally, the
    evaluator prompt / UI may hint that enabling admin mode unlocks full
    exploration. No security-expanding data-fair change.

## Deferred

- **`publicationSite` scoping.** Traces store only `owner` today. Scoping by
  publication site would first require capturing `publicationSite` in the gateway
  trace-recording path (`api/src/traces/*`) and reconstruction. Out of scope for
  v1; account-only scoping ships the core value.

## Testing

- **Unit** (`*.unit.spec.ts` pattern): `buildEvaluatorDataTools` with a stubbed
  `fetch` — assert (a) `list_datasets` injects the correct `owner=type:id`
  (and `type:id:department`) filter; (b) a successful response is passed through
  `formatResult`; (c) `get_dataset_metadata_raw` calls `GET /datasets/{id}` with
  no `select` and returns the raw JSON; (d) a `!ok`/throwing fetch yields the
  graceful-degradation message rather than throwing.
- **No e2e:** the agents dev stack has no data-fair service, so live exploration
  cannot be exercised there; behaviour is covered by the unit test with a stub.

## Files touched

- `ui/package.json` — add `@data-fair/agent-tools-data-fair`.
- `ui/src/traces/evaluator-data-tools.ts` — new builder module.
- `ui/src/components/EvaluatorChat.vue` — merge data tools into `localTools`;
  pass `department` if available.
- `ui/src/traces/evaluator-prompt.ts` — short capability note.
- `tests/.../evaluator-data-tools.unit.spec.ts` — new unit test.

No `~/data-fair/data-fair` change: superadmin cross-account exploration relies on
the existing `adminMode` session elevation (degrades gracefully when off).
