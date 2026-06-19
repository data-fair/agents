# Compare two traces in trace review

## Goal

Let an admin reviewing one stored conversation trace load a second trace beside it and
compare the two — visually side by side and through the evaluator chat. No assumption
that the two traces are "the same task": the comparison is purely raw side-by-side, and
the evaluator can be asked to compare them on demand.

## Scope

- Add a second `SessionRecorder` to the existing trace review page, selected via a
  "Compare with…" picker.
- Lay out two `TraceView`s plus the evaluator chat, with a collapsible evaluator pane.
- Generalize the evaluator tools so the single evaluator chat can query either trace.

Out of scope (explicitly):

- No built-in quantitative or content-level diff/highlighting between the two traces.
  Each trace keeps its own existing summary header; comparison is left to the human eye
  and the evaluator.
- No new API endpoints. Everything reuses existing trace routes.
- No cross-owner comparison.

## Entry point & data flow

The review route (`/traces/:id/review`) gains an optional query param **`?compare=:idB`**.

- A **"Compare with…"** control in the review page opens a dialog listing the account's
  other stored conversations — the same data the activity page shows, fetched from the
  existing paginated `GET /traces/:type/:id` route (preview, user, timestamp, request
  count). The current conversation (`:id`) is excluded from the list.
- Selecting a conversation sets `?compare=:idB` via `router.replace` (no full reload).
- When `compare` is present, the page fetches the second trace exactly as it fetches the
  first (`GET /traces/conversation/:idB`), reconstructs it with `reconstructTrace`, and
  wraps it in a second `SessionRecorder` (`recorderB`).
- A clear ("✕") control removes the `compare` param and returns to single view.

### Error / guard handling

- If trace B fails to load (not found, network error), show an inline error in the B
  pane and keep the rest of the page functional; the user can pick another or clear.
- The evaluator chat is owner-scoped (`accountType`/`accountId`). Trace B must belong to
  the same owner as trace A. The picker only lists the current owner's conversations, so
  this holds by construction; as a defensive check, if B's resolved owner differs from
  A's, treat it as a load error and do not enter compare mode.

## Layout

Reuse today's fixed-viewport, per-pane-scroll pattern (`height: 100vh`, each pane
`overflow-y: auto`).

- **Single mode (unchanged):** `TraceView` A (md=6) | `EvaluatorChat` (md=6).
- **Compare mode:** `TraceView` A | `TraceView` B | `EvaluatorChat`, each roughly a
  third on `md` and up; stacked on small screens.
  - The evaluator pane has a **collapse toggle**. Collapsed, the two traces expand to
    half-width each and the evaluator becomes a thin rail with an expand button.
  - Each pane scrolls independently and keeps its own existing summary header. No
    cross-trace highlighting.

Exact breakpoint/column values are an implementation detail; the requirement is: two
traces side by side with a collapsible evaluator that yields its width to the traces when
collapsed.

## Evaluator can query both traces

`buildEvaluatorTools` is generalized from a single `recorder` to a **labeled set** of
recorders. Today's caller passes one (`A`); compare mode passes two (`A`, `B`).

Signature change:

```
buildEvaluatorTools(traces: Record<'A' | 'B', SessionRecorder>, opts) // B optional
```

(or an equivalent labeled structure that preserves a single-recorder path).

Behavior:

- **Single trace (one label):** tools have **no** trace selector — identical signatures
  and output to today. Existing unit tests stay green unchanged.
- **Two traces:** every trace-scoped tool gains a **required `trace: 'A' | 'B'`**
  parameter and routes to the matching recorder. Affected tools:
  `getTraceOverview`, `getTraceEntry`, `getTraceEntries`, `getSessionConfig`,
  `summarizePhysicalRequest`. Each description notes that two traces (A and B) are loaded
  and that the `trace` parameter selects which one.
  - `readArchitectureDoc` is **not** trace-scoped and is unchanged.
- The evaluator **system prompt** gets a short compare-mode preamble, injected only when
  two traces are loaded: e.g. "Two traces are loaded, A and B. Each trace tool takes a
  `trace` parameter selecting which one to inspect. When asked to compare, inspect both."
  The single-trace prompt is untouched.

This keeps one evaluator chat that addresses either trace via a parameter, rather than
duplicating the tool set.

## Components & files

- `ui/src/traces/evaluator-tools.ts` — generalize `buildEvaluatorTools` to a labeled
  recorder set; add the `trace` param + description text only when more than one label is
  present.
- `ui/src/traces/evaluator-prompt.ts` — add the compare-mode preamble (exported separately
  or appended conditionally by `EvaluatorChat.vue`).
- `ui/src/components/EvaluatorChat.vue` — accept an optional `recorderB` prop; build the
  labeled set and select the compare preamble when B is present.
- `ui/src/pages/traces/[id]/review.vue` — hold `recorderA` + optional `recorderB`; watch
  `route.query.compare` to load/unload B; own the picker dialog open state and the
  evaluator collapse state; render the single- vs compare-mode layout.
- New picker component (e.g. `ui/src/components/TraceComparePicker.vue`) — a dialog that
  fetches and lists the owner's conversations (reusing the activity/`TracesSection`
  fetch shape), excludes the current one, and emits the chosen `conversationId`.
- Optional small header-controls element for the Compare / clear / collapse buttons (may
  live inline in `review.vue` if trivial).
- i18n: en/fr strings for "Compare with…", picker title, clear, collapse/expand, B-load
  error.

## Testing

- **Unit (`evaluator-tools`):**
  - With two recorders: assert each trace-scoped tool exposes the required `trace` param
    and that calling with `trace: 'A'` vs `trace: 'B'` reads from the corresponding
    recorder.
  - With one recorder: assert the tool shape is unchanged from today (no `trace` param).
- **E2E:**
  - Open a trace, click "Compare with…", pick a second conversation; assert both
    `TraceView`s render and `?compare=` is set in the URL.
  - Ask the evaluator a cross-trace question; assert a tool call carries `trace: 'B'`
    (and that both traces are reachable).
  - Collapse/expand the evaluator pane; assert the traces resize.
  - Clear compare; assert the URL param is gone and single view returns.

## Non-goals / YAGNI

- No diff engine, no metric delta strip, no content alignment between traces.
- No persistence of "comparison sessions" — state lives entirely in the URL
  (`?compare=`).
- No multi-trace (3+) comparison; exactly two.
