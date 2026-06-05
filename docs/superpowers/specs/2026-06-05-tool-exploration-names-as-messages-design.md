# Tool exploration: names-as-messages

## Problem

In exploration mode, `buildExplorationSystem` injects a full tool catalog
(`- <name>: <one-line description>` for *every* page tool) into the system
prompt. Inspecting the physical request to the model shows the system prompt
bloated with all tool descriptions — which contradicts the point of
exploration. The tool *schemas* are already deferred (`prepareStep` restricts
`activeTools` to `explore_tools` + sub-agents + promoted tools), so the catalog
text is the only thing leaking the full tool set into the prompt.

## Goal

Stop putting any tool catalog in the system prompt. Surface available tool
**names** through the message stream as incremental `<tools-available>` events,
announced per turn as a delta. Activation is unchanged: the model calls
`explore_tools` with an intent, the summarizer matches against the full
in-memory registry, and matched tools are promoted into `activeTools`.

The system prompt is left completely untouched — the always-active
`explore_tools` tool is self-describing, so no instruction text is needed there.

## Non-goals

- No change to which tool *schemas* are sent (`prepareStep`/`activeTools` already
  withholds them).
- No change to the `explore_tools` / summarizer activation flow. The summarizer
  still reads full tool descriptions from the in-memory `plainTools` registry;
  that data never crossed the main model's wire and is unaffected.
- No "detailed description after exploration" work — a promoted tool's full
  description + schema already reaches the model once it becomes active, so this
  is already satisfied.

## Design

### Delivery model

Incremental "tools added" events, computed as a **per-turn delta** (Approach A).
The message is injected only at turn boundaries, never mid-turn, so it can never
land between an assistant tool-call and its tool-result (which would break the
assistant→tool ordering providers require) and never races the active stream.

The message uses `role: 'user'` with a `<tools-available>` wrapper. It is **not**
`role: 'system'`: the gateway hoists/merges system messages to the top
(`api/src/gateway/router.ts:198-200`), which would destroy the sequence.

Events go into `history` (model context) only, not `messages.value` (UI bubbles),
so they don't appear as chat bubbles. The trace already snapshots tools
independently (`onToolsChanged` → `recorder.snapshotTools`), and the messages also
appear naturally in the recorded request.

### Changes — `ui/src/composables/tool-exploration.ts`

- **Delete** `buildExplorationSystem` and `buildToolCatalog` (nothing feeds the
  system prompt anymore).
- **Add** pure formatter `formatToolsAvailableMessage(names: string[]): string`:

  ```
  <tools-available>
  Not yet callable — pass your intent to explore_tools to activate the ones you need:
  search-data, get-dataset, list-datasets
  </tools-available>
  ```

  Names only, comma-separated. No descriptions.
- **Add** pure helper `newlyAvailableTools(currentNames: string[], announced: Set<string>): string[]`
  returning the order-preserving, de-duplicated names in `currentNames` not in
  `announced`. Keeps the delta logic unit-testable outside the composable.
- `createExploreTool`, `selectPromotions`, `EXPLORE_TOOL_NAME`,
  `SELECT_TOOL_NAME` unchanged.

### Changes — `ui/src/composables/use-agent-chat.ts`

- Add `let announcedTools = new Set<string>()` next to `promotedTools`
  (around line 135).
- In the `if (explorationEnabled)` block (currently lines 633–647):
  - The hidden set to announce is `plainTools` (sub-agents are always callable
    and are not announced).
  - Compute `delta = newlyAvailableTools(Object.keys(plainTools), announcedTools)`.
  - If `delta.length`, **insert** one message into `history` immediately *before*
    this turn's user message (the history tail) so the user message stays last —
    models and the mock act on the final user message:
    `history.splice(history.length - 1, 0, { role: 'user', content: formatToolsAvailableMessage(delta) })`,
    then add the delta names to `announcedTools` and record them in a turn-scoped
    `announcedThisTurn` for moderation rollback.
  - **Prune:** intersect `announcedTools` and `promotedTools` with the live tool
    names each turn, so a tool that disappears (server disconnect) un-announces
    and un-promotes; if it returns later it re-announces.
- Remove the `streamSystem` reassignment — pass `options.systemPrompt` straight
  to `streamText`'s `system`.
- Clear `announcedTools` on compaction (next to the existing
  `promotedTools.clear()`) and in `reset()` (next to the `promotedTools` reset).

### Moderation-block rollback

The moderation guard may block a turn after messages were pushed. The existing
handler popped a single tail message assuming it was the user message. Because the
`<tools-available>` notice is inserted just *before* the user message, the user
message remains the tail: the handler pops it first, then — if `announcedThisTurn`
is non-empty — pops the notice and deletes those names from `announcedTools` (so
they re-announce on the retried turn). This keeps `history` and `announcedTools` in
sync after a block.

### Compaction behaviour

Compaction runs inside `sendMessage` (line 492) *before* the exploration block,
so recovery happens within the same turn:

1. `history.push(user msg)`.
2. `compactHistory` rebuilds `history = [summaryMsg, userMsg]` and clears both
   `promotedTools` and `announcedTools`.
3. The exploration block sees an empty `announcedTools`, so
   `newlyAvailableTools` returns the full current tool set and inserts one fresh
   `<tools-available>` message just before the user message.
4. `streamText` runs with `history = [summaryMsg, toolsAvailableMsg, userMsg]`.

Result: a self-contained post-compaction history — the summary carries the
conversational past, the fresh `<tools-available>` carries the current tool
inventory, and no tools are promoted (the model re-explores as needed). The old
`<tools-available>` messages were inside the compacted region and are discarded;
clearing promotions in lockstep keeps names and activations in sync. The three
consecutive `user` messages (`summaryMsg`, `toolsAvailableMsg`, `userMsg`) match
the existing two-consecutive-`user` pattern compaction already produces, so it
introduces no new ordering hazard.

### Data flow

```
MCP servers → aggregator.onToolsChanged → tools.value

sendMessage turn:
  history.push(user msg)              // user msg is the tail
  compactHistory()                   // preserves user msg as the tail
  if exploration:
    prune announcedTools / promotedTools to live tool names
    delta = newlyAvailableTools(plainNames, announcedTools)
    if delta:
      history.splice(len-1, 0, { role: 'user', content: formatToolsAvailableMessage(delta) })  // before user msg
      announcedTools += delta;  announcedThisTurn = delta
  streamText({ system: options.systemPrompt, ..., prepareStep })  // activeTools unchanged
  // on moderation block: pop user msg, then (if announcedThisTurn) pop notice + un-announce

explore_tools call → summarizer matches → promote → next step activeTools grows
```

Net effect on the physical request: the system prompt loses the whole catalog
block; in its place a short `<tools-available>` user message appears once per
newly-available batch, names only.

## Tests

- `tests/features/tool-exploration/1.*.unit.spec.ts`: drop tests for the deleted
  `buildToolCatalog` / `buildExplorationSystem`; add tests for
  `formatToolsAvailableMessage` (names-only formatting) and `newlyAvailableTools`
  (delta, de-dup, order preservation, empty cases).
- Review existing api/e2e exploration tests for any assertion that the system
  prompt contains the catalog (`Available tools:`); update them to assert the
  `<tools-available>` message instead. The mock-model `<candidate-tools>` seam is
  unaffected.

## Quality gates

`npm run lint-fix`, `npm run check-types`, `npm run test` (at least the
`tool-exploration` specs), and `docker build -t agents .`.
