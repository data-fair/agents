# Trace review: actual models + per-request costs — design

Date: 2026-06-18
Status: approved design, pending implementation plan

## Problem

The trace review header (`TraceView.vue`) shows request count, cumulated
duration, and total input/output tokens — but never which **model** actually
served each physical request, nor any **cost**. Reviewers can't tell whether a
turn ran on the expensive or cheap model, and there is no monetary view at all.

The data is mostly already there: the stored `TraceRequest` persists `provider`
and the resolved `request.model`, but `reconstructTrace` drops them before the
UI sees them. Cost is the only genuinely missing datum.

## Goals

- Show the **actual model** (resolved id + provider) on each physical-request
  entry in the trace.
- Show a **total cost** in the review header, and a **per-request cost** on each
  physical-request entry.
- Compute cost accurately, from the prices in effect when the request ran.

## Non-goals

- No per-model aggregation table/chips in the header (considered; the simpler
  per-request view was chosen — can be added later).
- No backfill of cost onto already-stored traces (30-day TTL gives full natural
  coverage within a month).
- No currency configuration — euros, centralized in one formatter.

## Decisions

- **Cost is stored at record time** (not recomputed from settings at review
  time): accurate to the pricing in effect, and keeps the review page from
  having to fetch settings. Chosen over UI-side recompute.
- **Per-request presentation** (model + cost on each entry; only total cost in
  the header), chosen over a per-model header breakdown.
- **Currency: euros**, rendered via one `formatCost` helper.

## Approach

### 1. Store cost on the trace (API)

- `api/src/traces/types.ts` — add to `TraceRequest`:
  `cost?: { input: number; output: number; total: number }`. Optional, so
  pre-feature documents (no `cost`) are distinguishable from a genuine zero.
- `api/src/traces/operations.ts` — extend `BuildTraceInput` with
  `inputPricePerMillion: number` and `outputPricePerMillion: number`, and have
  `buildTraceRequestDoc` compute the breakdown inline:
  `input = inputTokens * inputPricePerMillion / 1_000_000`,
  `output = outputTokens * outputPricePerMillion / 1_000_000`,
  `total = input + output`. Inline arithmetic keeps `operations.ts` pure (its
  contract forbids importing other modules, including `usage/operations`'
  `computeCost`); the formula is one line and is unit-tested here.
  Always populate `cost` for new docs (even when prices are 0).
- `api/src/gateway/router.ts` — the `recordTrace` closure passes the
  `inputPricePerMillion` / `outputPricePerMillion` already in scope (from
  `getModelConfig(settings, modelId)`). These are the same prices usage
  tracking already uses (`computeCost` at the streaming/non-streaming finish);
  no new pricing resolution.

Model identity needs **no** schema change — `provider` and `request.model` are
already persisted.

### 2. Carry model + cost through reconstruction (UI)

- `ui/src/traces/session-recorder.ts` — add to `PhysicalRequestTrace`:
  `model?: string`, `provider?: { name: string; type: string }`,
  `cost?: { input: number; output: number; total: number }`.
- `ui/src/traces/reconstruct-trace.ts` — in the `physicalRequests` map, add
  `model: r.request.model`, `provider: r.provider`, `cost: r.cost`.

### 3. Header total cost (UI)

- `getSummary()` (session-recorder) — add `totalCost?: number` = sum of
  `cost.total` over requests that carry a `cost`. Leave it `undefined` when no
  request has cost (so old traces show no misleading `0 €`).
- `TraceView.vue` header totals row — append `· {formatCost(totalCost)}` only
  when `summary.totalCost` is defined.

### 4. Per-request model + cost (UI)

- On each physical-request entry, render the actual model (resolved id +
  provider name) next to the existing role label, and the per-request cost in
  the entry's metrics line. Example entry:
  `assistant · claude-opus-4 (Anthropic) · 3.2k in · 1.8k out · 0.0041 €`.
- The exact entry rendering (label/preview in `getTraceOverview`, plus any
  expanded detail in `TraceView`) is located during implementation; model goes
  by the role, cost goes in the metrics line, both shown only when present.
- Side benefit: the evaluator's `getTraceEntry` returns the full entry, so the
  evaluator also gains model + cost visibility with no extra work.

### 5. Cost formatting (UI)

- Add a small `formatCost(value: number): string` helper beside the existing
  `formatTokens` / `formatDuration`, returning euros with precision suited to
  small amounts, e.g. `0.0041 €`. Single source of the currency symbol.

### 6. Testing

- API unit (trace operations): `buildTraceRequestDoc` computes `cost.input`,
  `cost.output`, and `cost.total` from tokens × prices; total = input + output;
  zero prices → zero cost.
- UI unit (reconstruct): `reconstructTrace` carries `model`, `provider`, and
  `cost` onto each `PhysicalRequestTrace`.
- UI unit (summary): `getSummary` sums `totalCost` across costed requests and
  stays `undefined` when none carry cost.

## Files touched

- `api/src/traces/types.ts` — `cost` field on `TraceRequest`.
- `api/src/traces/operations.ts` — `BuildTraceInput` prices + cost computation.
- `api/src/gateway/router.ts` — pass prices into `recordTrace`.
- `ui/src/traces/session-recorder.ts` — `PhysicalRequestTrace` fields + summary
  `totalCost`.
- `ui/src/traces/reconstruct-trace.ts` — carry model/provider/cost.
- `ui/src/components/agent-chat/TraceView.vue` — header cost + per-request
  model/cost + `formatCost`.
- Tests under the existing unit-spec patterns.
