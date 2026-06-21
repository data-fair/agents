# Sub-agent activity indicator — design

Date: 2026-06-21
Branch: `feat-better-activity` (based on `origin/main` @ #40, the activity indicator)

## Problem

#40 added an activity indicator: a single discreet line at the bottom of the
transcript naming the current streaming phase (`compacting` / `thinking` /
`analyzing`) during gaps with no visible output. It is driven entirely by the
**main** stream loop in `ui/src/composables/use-agent-chat.ts`.

While a **sub-agent** runs, that line goes blank: `activity` is cleared on the
`tool-call` for the `subagent_*` tool and is never set again until the sub-agent
finishes. The only motion is the spinning panel *title*. So:

- **Enter gap** (delegating → sub-agent's first output) shows nothing.
- **Inside the sub-agent**, its own gaps (thinking before first text, running a
  tool — sub-agent tool chips do *not* spin — analyzing a tool result) show
  nothing.
- **Leave gap** is already covered: after the sub-agent's `tool-result` +
  `finish-step`, the main loop sets `activity = 'analyzing'`.

This reads as sluggish: long stretches where "nothing is happening" visually.

## Root cause: two divergent stream→message pipelines

The sub-agent feels different because it *is* built differently. There are two
separate `stream → ChatMessage[]` builders:

| | Main assistant | Sub-agent |
|---|---|---|
| Source | `result.fullStream` (delta parts) | `readUIMessageStream(subResult.toUIMessageStream())` (accumulating snapshots) |
| Builder | inline incremental mutation in the loop | `uiMessageToChatMessages()` rebuilds the array each yield |
| Tool "done" | `tool-result` part | `part.state === 'output-available'` |
| Content-filter | `finish` part → rollback | `await subResult.finishReason` → refusal |
| Errors | in-band `error` part → break (added in #38) | `try/catch` (thrown only) |

Two paths that should agree, maintained twice. The main reason the sub-agent has
no activity tracking is that its snapshot-based path never exposed the
fine-grained phase the main loop derives from delta parts.

`ToolLoopAgent.stream()` returns a `StreamTextResult` exposing `fullStream` with
the **same** `TextStreamPart` types the main loop handles, and `subResult.response`
/ `subResult.finishReason` remain available alongside it. So both pipelines can
be unified onto one builder.

## Approach (chosen): unify the builder + internal marker

Unify the two builders into one shared function, and render the sub-agent's phase
**inside its open panel** (the running sub-agent panel is open anyway), while
top-level phases stay on the bottom line.

This was chosen over the lower-risk alternative (derive the phase from the
existing snapshots with a heuristic, keep both builders, name-prefixed bottom
line) because that alternative leaves the divergence in place and *adds* a third
thing; unification removes the duplication that caused the gap in the first place
and gives the sub-agent main-loop-parity phases for free.

### A. One shared builder — `applyStreamPart(part, scope)`

A single function owns `stream → ChatMessage[]` for both loops. `scope` is a small
mutable context:

```ts
interface StreamScope {
  messages: ChatMessage[]        // sink: messages.value (main) | a panel's subAgentMessages (sub)
  current: ChatMessage | null    // message currently being appended to
  producedText: boolean
  stepHadTool: boolean
  lastToolName?: string
  setActivity: (phase: 'streaming' | 'tool' | 'analyzing' | 'thinking', toolName?: string) => void
}

function applyStreamPart (part: TextStreamPart<any>, scope: StreamScope): void
```

It handles the transitions currently written twice, preserving the existing
inline comments:

- `text-delta`: `producedText = true` and `setActivity('streaming')` when text is
  present; create/append `current`.
- `tool-call`: `stepHadTool = true`, `lastToolName = part.toolName`,
  `setActivity('tool', part.toolName)`; push a `pending` invocation onto `current`.
- `tool-result`: mark the matching invocation `done` (ignore `preliminary`).
- `tool-error`: mark the matching invocation `done` (chip would otherwise spin
  forever).
- `finish-step`: `current = null`;
  `setActivity(stepHadTool ? 'analyzing' : 'thinking', lastToolName)`; reset
  `stepHadTool` and `lastToolName`.

`uiMessageToChatMessages` and the `readUIMessageStream` import are **deleted**.
The sub-agent loop becomes:

```ts
for await (const part of subResult.fullStream) {
  applyStreamPart(part, subScope)
  if (currentAssistantMessage) currentAssistantMessage.subAgentMessages = subScope.messages
  yield subScope.messages
}
```

The divergent concerns stay at each call site:
- **Main loop** keeps its `finish`/content-filter rollback and in-band `error` →
  `streamError`/break branches before delegating the rest to `applyStreamPart`.
- **Sub-agent loop** keeps `await subResult.finishReason === 'content-filter'` →
  refusal and the `try/catch` → error-message fallback, unchanged.

### B. Activity state + per-scope policy

A single `activity` ref, now a discriminated union (exported from the composable):

```ts
export type ChatActivity =
  | { kind: 'compacting' }
  | { kind: 'thinking' }
  | { kind: 'analyzing', subAgent?: string }                                  // main agent reading a result
  | { kind: 'subagent', name: string, phase: 'starting' | 'thinking' | 'tool' | 'analyzing' }
```

Each scope translates the logical phase emitted by `applyStreamPart` into the
union, encapsulating the placement policy:

- **Main scope** `setActivity`:
  - `streaming` / `tool` → `null` (the main tool chip spins; for a `subagent_*`
    call the sub-agent's own panel line takes over).
  - `analyzing` → `{ kind:'analyzing', subAgent: toolName?.startsWith('subagent_') ? toolName : undefined }`.
  - `thinking` → `{ kind:'thinking' }`.
- **Sub scope** `setActivity` (closes over this sub-agent's tool `name`):
  - `streaming` → `null` (the panel's markdown cursor is the signal).
  - `tool` → `{ kind:'subagent', name, phase:'tool' }`.
  - `analyzing` → `{ kind:'subagent', name, phase:'analyzing' }`.
  - `thinking` → `{ kind:'subagent', name, phase:'thinking' }`.
  - Before the stream loop starts, the sub-agent sets
    `{ kind:'subagent', name, phase:'starting' }` once → eliminates the enter-gap
    blank.

`compacting` is still set directly in `compactHistory` as today.

### C. Component — contextual rendering

`AgentChatMessages.vue` renders the single `activity` in one of two places:

- `kind === 'subagent'` → a discreet spinner + label line **inside** the matching
  sub-agent panel (the pending invocation of the last assistant message). The
  bottom line shows nothing for this kind. If the user has collapsed the panel,
  the spinning title still indicates activity; only the phase detail is hidden,
  which is the right trade-off for a collapsed panel.
- any other kind → the existing bottom line (`data-testid="chat-activity"`),
  unchanged in markup and test id.

Label selection is extracted into a pure `activityLabelKey(activity)` helper
(returns an i18n key + interpolation params) so it is unit-testable without the
component. New i18n keys (en/fr):

- `activitySubAgentStarting` — "Starting…"
- `activitySubAgentThinking` — "Thinking…"
- `activitySubAgentTool` — "Running a tool…"
- `activitySubAgentAnalyzing` — "Analyzing tool result…"
- analyzing-with-name variant for the bottom line — "Analyzing {name}'s result…"

The sub-agent name shown is formatted with the component's existing
`subAgentTitle(name)`, so the panel line and the panel title agree.

`AgentChat.vue` and `EvaluatorChat.vue` pass the `activity` prop through
unchanged; only the prop *type* widens to `ChatActivity | null`.

### D. Safety bonus enabled by B

Routing the sub-agent through `fullStream` lets it capture an in-band `error`
part (the #38 silent-drop class) and send it to the existing error-message
fallback. The sub-agent currently only catches *thrown* errors, so an in-band
provider error mid-sub-stream could otherwise be dropped. The sub loop captures
an `error` part into a local `subStreamError`, breaks, and reuses the catch
path's error-message yield.

## Non-goals

- **Concurrent sub-agents in one step** would race the single `activity` line.
  Accepted: panels still track each sub-agent independently; the line shows
  whichever set last. Not engineered around.
- No specific **tool name** in the sub-agent label (generic "Running a tool…").
- Panel open/close, auto-scroll, and moderation behavior are unchanged except for
  the small internal activity line (a single transient row; height changes are
  already handled by the existing `ResizeObserver`).

## Testing

- **Unit (primary):**
  - `applyStreamPart` over representative part sequences (text only; text +
    tool-call + tool-result + finish-step; tool-error) producing the expected
    `ChatMessage[]` and `stepHadTool` transitions — now one path to cover instead
    of two.
  - `activityLabelKey(activity)` mapping for every union variant.
- **E2E:** extend the sub-agent spec using the mock model to assert the internal
  panel line appears during a sub-agent tool run — only if the mock provides a
  deterministic hold-point to observe the transient line; otherwise rely on unit
  coverage rather than a flaky transient-line assertion. Keep the existing
  chat-hang e2e (bottom-line compacting/timeout) green.

## Files touched

- `ui/src/composables/use-agent-chat.ts` — `ChatActivity` type; `applyStreamPart`
  + `StreamScope`; delete `uiMessageToChatMessages` and `readUIMessageStream`
  import; main loop delegates building to `applyStreamPart`; sub-agent loop reads
  `fullStream`; per-scope activity policies; sub-agent `starting` + in-band error
  capture.
- `ui/src/components/agent-chat/AgentChatMessages.vue` — `ChatActivity` prop type;
  `activityLabelKey` helper; internal panel activity line; new i18n keys.
- `ui/src/components/AgentChat.vue`, `ui/src/components/EvaluatorChat.vue` — prop
  type only.
- Unit test spec for `applyStreamPart` + `activityLabelKey`.
- (Optional) sub-agent e2e extension + mock-model seam.
