# Better sub-agent panels — design

> Branch: `feat-better-subagents`. UX polish for how delegated sub-agents are
> displayed in the chat transcript. **No orchestration changes** — this is purely
> the rendering layer (`use-agent-chat.ts` is untouched).

## Goal

Three related improvements to the sub-agent display:

1. **Stop auto-opening** sub-agent panels — they should render collapsed by
   default and the user expands them manually.
2. **Better panel display** — wrap each sub-agent in a `v-alert` box, show its
   live activity status even when collapsed, and use a clearer "delegated
   subtask" leading icon.
3. **New per-user flag to simplify sub-agent output** — when on, a delegation
   renders as a plain tool chip (exactly like any other tool call) instead of a
   panel.

## Where the code lives

- `ui/src/components/agent-chat/AgentChatMessages.vue` — renders the transcript,
  the sub-agent expansion panels (`:86-175`), the tool-chip row (`:57-85`), the
  panel auto-open watcher (`:414-425`), and the in-panel activity line
  (`:160-171`).
- `ui/src/components/agent-chat/auto-scroll.ts` — pure helpers; `streamedLength`
  (autoscroll growth signal) and `latestSubAgentPanel` (auto-open index).
- `ui/src/components/AgentChat.vue` — reads flags, owns the flag refs, passes
  props to `AgentChatMessages`, persists flags (`:187-203, :314-343`).
- `ui/src/utils/agent-flags.ts` — `AgentFlags` interface, `DEFAULT_FLAGS`,
  `readFlags`, cookie (de)serialization.
- `ui/src/components/agent-chat/AgentChatDebugDialog.vue` — Settings tab with the
  experimental flag switches (`:166-203`) + EN/FR i18n + emits.

## Change 1 — Stop auto-opening panels

**Current behaviour:** an `openPanels` reactive map plus a watcher
(`AgentChatMessages.vue:414-425`) auto-opens the latest sub-agent panel of the
last message while the transcript is following the tail, driven by
`latestSubAgentPanel()`. The accordion (`v-expansion-panels`) keeps a single open
index per message.

**New behaviour:** panels render **collapsed by default**; the user expands
manually. Open state becomes a per-`toolCallId` reactive `expanded` map, so each
sub-agent box opens/closes independently (no single-open accordion constraint —
this matters for concurrent sub-agents in one message).

**Edits:**
- Remove the `openPanels` map, `openPanelFor`, `setOpenPanel`, and the auto-open
  `watch` (`AgentChatMessages.vue:414-425`).
- Add `const expanded = reactive<Record<string, boolean>>({})` keyed by
  `invocation.toolCallId`; a header click toggles `expanded[toolCallId]`.
- Remove `latestSubAgentPanel` from `auto-scroll.ts` and its unit-test case.
- `streamedLength` (the autoscroll growth signal) is **unchanged** — it counts
  sub-agent message data regardless of DOM expansion, so autoscroll keeps
  following while a collapsed sub-agent streams.

## Change 2 — v-alert container, closed-state activity, subtask icon

Replace the `v-expansion-panels`/`v-expansion-panel` accordion with one
**`v-alert`** per sub-agent invocation:

- `variant="tonal"`, `color` = `success` when `invocation.state === 'done'`,
  else `warning` (tints the whole box by status).
- **Leading icon:** `mdiSubdirectoryArrowRight` (delegated-subtask arrow), in the
  alert's icon slot. Status is conveyed by the alert color + the activity line,
  not by swapping this icon.
- **Header row** (clickable, toggles `expanded[toolCallId]`): title via
  `subAgentTitle(invocation.toolName)`, the `(tour N)` turn suffix when present,
  and a trailing chevron (`mdiChevronDown`/`mdiChevronUp`).
- **Closed-state activity:** the live activity label (`subAgentActivityLabel`)
  moves into the header row so it shows **even when collapsed** — a small spinner
  (`mdiLoading`, `agent-chat__spin`) + the phase text (e.g. "Running a tool…").
  Only while `isStreaming && index === messages.length - 1`. When done, no
  activity line.
- **Body:** a `v-expand-transition` wrapping the existing full trace (the
  `subAgentPanels[toolCallId].messages` loop with sub-message markdown + tool
  chips, and the `subAgentDone` fallback), shown only when
  `expanded[toolCallId]`.

The existing `data-testid="subagent-activity"` is preserved on the activity line
(now in the header). The left-border styling on `.agent-chat__subagent-panels`
is replaced by the alert's own border; obsolete accordion CSS
(`AgentChatMessages.vue:504-513`) is removed.

## Change 3 — "Simplify sub-agent output" flag

A new per-user, presentation-only flag rendering each delegation as a plain tool
chip instead of a panel.

**`agent-flags.ts`:**
- Add `simpleSubAgents: boolean` to `AgentFlags`.
- `DEFAULT_FLAGS`: `simpleSubAgents: false`.
- `readFlags`: parse `simpleSubAgents: !!v.simpleSubAgents`.

**`AgentChat.vue`:**
- `const simpleSubAgentsEnabled = ref(initialFlags.simpleSubAgents)`.
- Include it in `persistFlags()`.
- Pass `:simple-sub-agents="simpleSubAgentsEnabled"` to `AgentChatMessages`.
- `handleSimpleSubAgents(enabled)` sets the ref + `persistFlags()`, and **does
  NOT** call `handleReset()` — it changes nothing about the conversation, tools,
  or system prompt (contrast mermaid/subAgents/toolExploration, which all reset).

**`AgentChatDebugDialog.vue`:**
- New `v-switch` in the Settings tab bound to a `simpleSubAgents` prop, emitting
  `update:simpleSubAgents`.
- EN/FR `simpleSubAgents` label + `simpleSubAgentsHint` (note: no conversation
  reset; presentation only).

**`AgentChatMessages.vue`:**
- New prop `simpleSubAgents: boolean`.
- When `simpleSubAgents` is true:
  - The tool-chip row renders `subagent_*` invocations as chips too — the
    existing guard `!invocation.toolName.startsWith('subagent_')` becomes
    `(simpleSubAgents || !invocation.toolName.startsWith('subagent_'))`, with the
    chip label using `subAgentTitle(...)` for `subagent_*` names. Same color
    logic (`done` → success, else warning).
  - The whole v-alert sub-agent block (Change 2) is skipped (`v-if` gains
    `&& !simpleSubAgents`).
- **Accepted limitation:** in simplified mode there is no live phase text for a
  running sub-agent — just the spinning chip, exactly like any other tool. The
  bottom activity line still ignores `kind === 'subagent'`.

## Data flow summary

```
cookie (agent-flags) ──readFlags──▶ AgentChat.vue refs ──props──▶ AgentChatMessages.vue
        ▲                                   │
        └────── persistFlags ◀── debug dialog Settings switches (update:* emits)
```

`simpleSubAgents` flows identically to the existing `mermaid` flag, minus the
conversation reset.

## Testing

**Unit (`auto-scroll.ts` test):**
- Remove the `latestSubAgentPanel` case.
- Keep `streamedLength` cases (unchanged behaviour).

**E2E (sub-agent panel specs):**
- Update specs that asserted auto-open to assert **collapsed by default** and
  **manual expand** reveals the trace.
- Add: a collapsed panel shows the live activity label in its header while the
  sub-agent runs.
- Add: with the simplify flag on, a delegation renders as a chip (no v-alert
  panel present); turning it off restores the panel.
- Reuse the mock seam introduced by the recent parallel-panel commits.

## Out of scope

- Orchestration intelligence (parallelism, task contract, history bounding) —
  tracked separately in `docs/subagent-orchestration-review.md`.
- Any server / trace-storage change.
