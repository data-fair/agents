# System-aware evaluator — design

Date: 2026-06-18
Status: approved design, pending implementation plan

## Problem

The trace **evaluator** (an admin-only chat that reviews stored conversation
traces, defined in `ui/src/traces/`) knows *how to drive the trace-inspection
tools* but has **no mental model of the platform it evaluates**. Its system
prompt never tells it that this system has distinct model roles, a compaction
mechanism, a moderation gate, sub-agents, quotas, or that it usually runs
embedded inside data-fair / portals with their own tools.

Concrete failure that motivated this work: asked whether **compaction** had
worked, the evaluator answered "yes" because it saw `cache` tokens in a request
— conflating prompt-caching with the compaction *feature*, which it didn't know
existed. This is a knowledge gap, not a reasoning failure.

The repo already contains the right knowledge source: `docs/architecture/*.md`
(one concise file per concern). The evaluator simply isn't connected to it, and
those docs aren't yet shaped for this dual use.

## Goals

- Give the evaluator a working model of the platform's behaviour so it can
  reason about features like compaction, moderation, sub-agents, quotas.
- Give it the typical **integration context** (data-fair / portals) and the
  tools/data it encounters there.
- Keep the evaluator's request context lean — pull depth on demand, don't bloat
  every request.
- Keep the architecture docs healthy for their existing human-developer use.

## Non-goals

- No repo/GitHub source-browsing tool (considered and rejected as overkill:
  auth, security, scope; the curated docs cover what's needed).
- No restructuring/rewriting of the existing architecture docs' explanations —
  only a light trim (see below).
- No change to how the evaluator model role is resolved or billed.

## Approach (hybrid)

Chosen over "prompt-overview only" (can't dig into detail) and a repo-explore
tool (overkill). The evaluator gets a short always-present overview **plus** an
on-demand tool to read the full architecture docs.

### 1. Architecture docs — light trim (all existing `docs/architecture/*.md`)

A conservative pass over **every** existing doc:

- Remove fragile `file:line` and symbol references that drift as code changes.
- Cut obvious verbosity.
- **Do not** restructure or rewrite the explanations themselves.

Rationale: these docs become the evaluator's knowledge base, and removing flaky
references makes them both more durable for humans and safer to feed to a model.

### 2. New doc — `docs/architecture/integration-context.md` (authored)

The one doc we write from scratch, because the knowledge lives outside this repo
(in `~/data-fair/data-fair` and `~/data-fair/portals`). Conceptual, durable, no
fragile references. Covers:

- How the agent is embedded into **data-fair** and into **portals** (iframe /
  `d-frame`, where it appears, what owner/account context is passed).
- The concrete tools the agent is typically given in those contexts (dataset
  search, catalog/metadata exploration, etc.) — verbatim tool names, one line
  each.
- The typical data/domain context: what a portal is, what datasets look like,
  what users are doing when they chat there.
- Known integration gaps/quirks an evaluator should weigh when judging a
  session (sourced from data-fair's `agent-integration-gaps.md`).

Source material (gathered from `~/data-fair/data-fair` and `~/data-fair/portals`;
to be distilled into the doc, kept conceptual and free of fragile references):

- **Embedding:** the agent runs in a browser **iframe** (`DfAgentChatDrawer`)
  beside the host app, sharing the user's session (user/org owner). Tools run
  **client-side** via **WebMCP over BroadcastChannel** — the agents service
  never calls the data-fair / portals API directly. Activation is gated per
  account (`agent-chat` setting).
- **data-fair back-office tools** (the rich context — ~37 tools across
  subagents), grouped by family: navigation (`navigate`, `list_pages`,
  `get_current_location`); dataset exploration (`list_datasets`,
  `describe_dataset`, `get_dataset_schema`, `search_data`, `aggregate_data`,
  `calculate_metric`, `get_field_values`); metadata/expression editing
  (`set_dataset_summary`, `set_dataset_description`, `set_expression`,
  `test_expression`, `set_property_config`); data entry
  (`open_add_line_dialog`, `open_edit_line_dialog`); applications
  (`list_applications`, `describe_application`, `get_application_config`);
  creation wizards (dataset/application); connectors & catalogs
  (`list_processings`, `list_catalogs`, `explore_github`); geolocation
  (`geocode_address`, `get_user_geolocation`).
- **portals manager tools:** VJSF form subagents only — `pageConfig_form`,
  `portalConfig_form` (translate natural language into form mutations via
  StatefulLayout/WebMCP; user still saves).
- **Domain:** *datasets* = tabular data with schemas exposed as APIs;
  *applications* = visualizations built on datasets; *portals* = public sites
  publishing selected datasets/apps. Users are back-office admins / dataset
  owners / portal designers.
- **Quirks an evaluator must know:** tool responses carry **absolute URLs** that
  the model must use verbatim (relative links break inside the cross-origin
  iframe); a `_c_`-prefixed column filter silently matches nothing; filter
  capability is **error-driven** (invalid filters return HTTP 400 with guidance,
  the agent self-corrects); metadata/expression writes only populate the edit
  **form** — the user must still Save/Publish, the agent cannot commit
  autonomously.

### 3. Docs bundling — `ui/src/traces/architecture-docs.ts`

A small module that raw-imports all `docs/architecture/*.md` at build time:

```ts
const modules = import.meta.glob('../../../docs/architecture/*.md', {
  query: '?raw', import: 'default', eager: true
})
```

It produces a `{ topic → markdown }` map keyed by filename without extension
(`compaction`, `moderation`, `overview`, `integration-context`, …) and exports
the sorted list of available topics. In-memory, no runtime fetch, no API
endpoint, consistent with the other client-side evaluator tools. (Vite root is
`ui/`; the architecture docs are public and the review page is admin-gated, so
bundling them is acceptable.)

### 4. New evaluator tool — `readArchitectureDoc`

Added to `buildEvaluatorTools` in `ui/src/traces/evaluator-tools.ts`:

- Input: `topic` — string, enum constrained to the available topic names.
- Returns the requested doc's markdown.
- On an unknown/missing topic, returns the list of valid topics instead of
  failing, so the agent can recover.

The agent pulls a doc only when a question needs it, keeping context lean.

### 5. Evaluator prompt overview — `ui/src/traces/evaluator-prompt.ts`

Add a tight "How this platform works" section to `EVALUATOR_PROMPT` that:

- Names the core concepts so the agent knows they **exist**: the model roles
  (assistant / tools / summarizer / moderator / evaluator), **compaction**,
  the **moderation** gate, **sub-agents**, **quotas / usage**, the **gateway**,
  and MCP / dataset tools.
- States that the agent usually runs embedded in **data-fair / portals**, and
  to read `integration-context` to understand the tools and data involved.
- Instructs it to read `readArchitectureDoc('overview')` first for the system
  map, then pull the specific doc (e.g. `compaction`) when evaluating that
  behaviour.

The overview stays conceptual and stable (these feature names rarely change);
all depth defers to the docs, so the prompt won't drift.

### 6. Tests

A unit test following the existing `*.unit.spec.ts` pattern:

- the docs map loads non-empty and includes expected topics
  (`overview`, `compaction`, `integration-context`);
- `readArchitectureDoc` returns content for a known topic;
- an unknown topic returns the topic list rather than throwing.

No e2e test needed — this is prompt/tooling configuration.

## Net effect

The evaluator gains a general working model of the platform and its integration
context, so it reasons from how the system actually behaves rather than guessing
from raw trace signals. The original compaction question is one illustration:
with this knowledge the evaluator can recognise compaction as a real feature and
read its doc to judge it properly — but the improvement is general, not a
hardcoded answer to any single case.

## Files touched

- `docs/architecture/*.md` — light trim (all existing files).
- `docs/architecture/integration-context.md` — new, authored.
- `ui/src/traces/architecture-docs.ts` — new bundling module.
- `ui/src/traces/evaluator-tools.ts` — add `readArchitectureDoc`.
- `ui/src/traces/evaluator-prompt.ts` — add platform overview.
- test file under the unit spec pattern — new.
