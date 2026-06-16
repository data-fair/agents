# Flatten sub-agents — experimental toggle

**Date:** 2026-06-16
**Branch:** `feat-agents-toggle-subagents`
**Status:** design approved, pending spec review

## Problem

The orchestrator-worker sub-agent pattern (see `docs/architecture/sub-agents.md`) runs
each delegated task in its own `ToolLoopAgent`: a separate model role (`tools`), its own
system prompt, its own multi-turn history, and a `toModelOutput` summary that hides the
sub-agent's trace from the main agent. This buys context reduction and tool partitioning,
but it is heavy machinery that is plausibly overengineered for most integrations.

We want to **test the hypothesis** that exposing all tools directly to the main agent —
rather than hiding them behind sub-agents — produces *better* tool use. This requires an
experimental, admin-only toggle that flattens sub-agents, mirroring the existing
tool-exploration toggle.

Tool-count bloat (the original motivation for delegation) is handled independently by the
existing **tool-exploration** toggle, so the two features stay orthogonal.

## Goal

When the flatten toggle is on:

- Every reserved sub-agent tool is exposed directly to the main agent from the first step.
- Each `subagent_*` pseudo-tool becomes a plain **guidance tool**: called with no
  arguments, it returns the sub-agent's own system prompt as text. The main agent may
  optionally call it to read the brief, then drives the reserved tools itself in the same
  loop.
- No `ToolLoopAgent`, no separate `tools` model, no per-sub-agent history, no
  `toModelOutput` summary, no sub-agent UI panels.

This is **option A** ("always flat"): reserved tools are available from the start and the
guidance tool is purely advisory. We are explicitly testing whether the assistant uses a
flat tool set well.

## Non-goals

- Not changing default behavior. Flatten defaults **off**; delegated mode is unchanged.
- Not merging sub-agent prompts into the main system prompt.
- Not gating reserved tools behind the guidance tool (that was option B, rejected).
- Not removing or deprecating the sub-agent delegation path.

## Design

### 1. Toggle wiring — mirror of tool-exploration

The exploration toggle is the exact template to follow.

**`ui/src/components/AgentChat.vue`**
- New ref, parallel to `explorationEnabled` (AgentChat.vue:148):
  ```ts
  const flattenEnabled = ref(!!props.isAdmin && localStorage.getItem('agent-chat-flatten') === '1')
  ```
- Pass to `useAgentChat` as a new option `flattenSubAgents: flattenEnabled.value`.
- New handler, parallel to `handleToolExploration` (AgentChat.vue:258):
  ```ts
  function handleFlattenSubAgents (enabled: boolean) {
    flattenEnabled.value = enabled
    if (enabled) localStorage.setItem('agent-chat-flatten', '1')
    else localStorage.removeItem('agent-chat-flatten')
    chat.setFlattenSubAgents(enabled)
    handleReset() // new tool set applies from a clean conversation
  }
  ```
- Wire the debug dialog's new prop/event through to this handler (same place the
  `toolExploration` prop/event is wired).

**`ui/src/composables/use-agent-chat.ts`**
- New option on `UseAgentChatOptions`: `flattenSubAgents?: boolean` (near
  `toolExploration?: boolean`, line 61).
- Live getter, parallel to `explorationEnabled` (line 137):
  ```ts
  const flatteningEnabled = () => !!options.flattenSubAgents
  ```
- New setter, parallel to `setToolExploration` (line 669):
  ```ts
  const setFlattenSubAgents = (enabled: boolean) => { options.flattenSubAgents = enabled }
  ```
- Add `setFlattenSubAgents` to the returned object (line 673).

**`ui/src/components/agent-chat/AgentChatDebugDialog.vue`**
- A second `v-switch` in the Settings tab, directly under the exploration switch
  (around line 148), bound to a new `flattenSubAgents` prop and emitting
  `update:flattenSubAgents`.
- i18n keys (en + fr):
  - `flatten`: en `"Flatten sub-agents (experimental)"`, fr `"Aplatir les sous-agents (expérimental)"`
  - `flattenHint`: en `"Exposes every sub-agent tool directly to the assistant instead of delegating. Each sub-agent becomes a guidance tool that returns its prompt. Changing this setting resets the conversation."`,
    fr `"Expose tous les outils des sous-agents directement à l'assistant au lieu de déléguer. Chaque sous-agent devient un outil de consigne qui renvoie son prompt. Changer ce réglage réinitialise la conversation."`
- New prop `flattenSubAgents?: boolean` and emit `'update:flattenSubAgents': [value: boolean]`.

### 2. Flattening logic — `sendMessage`

The only behavioral change is in `sendMessage` (use-agent-chat.ts:421-448), branching on
`flatteningEnabled()`.

**Reserved-tool removal.** `resolveSubAgents` still runs (we need each sub-agent's
`config.prompt`), but when flattening is on it must **not** delete reserved tools from
`mainTools`. Implementation: pass a flag to `resolveSubAgents`, or skip the
`delete mainTools[reservedName]` loop (lines 322-325) when flattening. Reserved tools thus
remain in the flat main set.

**Sub-agent tool construction.** In the `for (const [name, entry] of Object.entries(subAgents))`
loop (line 434), branch:

- *Delegated mode (flatten off):* unchanged — build the `ToolLoopAgent` and the async
  generator tool (lines 443-518+).
#### Per-sub-agent opt-out

Flattening is **not transparent** for every sub-agent. Some are used by host prompts as
black-box **producers**: a delegated call returns a finished deliverable that an action's
hidden context then applies (e.g. data-fair's `dataset_summarizer` returns summary text,
and the `summarize-dataset` action then calls `set_dataset_summary`). Flattening such a
sub-agent inverts the contract — calling the guidance tool now returns *instructions*, not
the deliverable — and also discards any pinned model role (e.g. the cheap `summarizer`
model).

So a sub-agent can stay delegated even when the global toggle is on. The decision is a small
pure helper, `shouldFlattenSubAgent(config, flatten)` in `ui/src/composables/sub-agent-flatten.ts`:

```ts
export function shouldFlattenSubAgent (config: { model?: string, delegateOnly?: boolean }, flatten: boolean): boolean {
  if (!flatten) return false
  // Opt-out default: a sub-agent that pins a non-default model is kept delegated (its model
  // routing and producer/return contract would be lost when flattened). lib-vue materializes
  // the default to 'tools', so a non-'tools' value is an explicit pin. An explicit
  // `delegateOnly` in the sub-agent config overrides the heuristic either way.
  const stayDelegated = config.delegateOnly ?? (config.model !== undefined && config.model !== 'tools')
  return !stayDelegated
}
```

`delegateOnly?: boolean` is added to lib-vue's `SubAgentOptions` (`useAgentSubAgent`) and
emitted into the config JSON, so integration authors can mark producer sub-agents that don't
pin a special model (e.g. `dataset_description_writer`). `SubAgentConfig` in
`use-agent-chat.ts` gains the same optional field.

Consequence for tool partitioning: reserved-tool removal becomes **per sub-agent**.
`resolveSubAgents` keeps reserved tools in the main set only for sub-agents that *will* be
flattened; sub-agents that stay delegated still have their reserved tools removed (exclusive
to their `ToolLoopAgent`). The flat/delegated branch in `sendMessage` is chosen per entry via
the same helper. This makes **mixed mode** valid: in one turn some sub-agents flatten while
others stay delegated.

- *Flat mode (flatten on, sub-agent flattened):* register a plain guidance tool instead, under the
  **de-prefixed** name so it renders as an ordinary tool chip rather than an empty
  sub-agent expansion panel (`AgentChatMessages.vue` keys panel rendering off the
  `subagent_` name prefix, line 61/86):
  ```ts
  const flatName = name.replace(/^subagent_/, '')
  mainLLMTools[flatName] = tool({
    description: (entry.tool as any).description || '',
    inputSchema: jsonSchema({ type: 'object', properties: {}, additionalProperties: false }),
    execute: async () => entry.config.prompt
  })
  ```
  No arguments (confirmed decision). No `subAgentHistory` / `subAgentCallCount`, no
  streaming generator, no `toModelOutput`. The model now sees and calls `data_analyst`
  (not `subagent_data_analyst`); reserved tools are already exposed flat, so after reading
  the brief the main agent drives them itself in the same loop.

The `subAgentHistory` / `subAgentCallCount` maps (lines 431-432) are only constructed/used
in delegated mode.

### 3. UI and traces

No UI changes beyond the toggle. In flat mode no `subAgentMessages` are produced and the
guidance tools are registered under de-prefixed names, so the collapsible sub-agent panels
never appear; the guidance tool shows as an ordinary tool chip and everything renders in the
main message flow. Trace requests carry no `sub:` context headers, so the trace reviewer
shows a single main-agent flow — correct for flat mode.

### 4. Interaction with tool-exploration

Independent and composable. With both toggles on, `partitionTools` yields a flat set
(reserved tools + guidance tools, all ordinary tools), and the existing
`prepareStep`/`activeTools` exploration gating (lines 533+) then hides that flat set behind
`explore_tools` exactly as it does today. No special-casing required. The guidance tools,
like sub-agent pseudo-tools today, are treated as ordinary promotable/always-available tools
per the exploration logic already in place.

## Testing

The flatten logic lives inside `useAgentChat`'s `sendMessage` (`partitionTools` is not
exported), so coverage follows the established pattern for this area: **e2e via the
`/agents/_dev/chat-subagent` dev page** with the mock provider (mirroring
`tests/features/chat-subagent/chat-subagent.e2e.spec.ts`). New spec
`tests/features/chat-subagent/chat-subagent-flatten.e2e.spec.ts`:

- **Toggle**: the "Flatten sub-agents" switch in the debug Settings tab is visible and,
  when flipped, persists `agent-chat-flatten=1` in localStorage.
- **Flat reserved-tool exposure**: with flatten pre-enabled (init script sets the
  localStorage key), the main agent calls the reserved `get_schema` tool directly — a
  `get_schema` chip appears in the main message flow and **no** sub-agent expansion panel
  appears. (In delegated mode `get_schema` is removed from the main set, so this is the
  decisive behavioral difference.)
- **Guidance tool**: with flatten on, the de-prefixed `data_analyst` tool is callable and
  renders as an ordinary chip, never a "Data Analyst" panel.

**Regression:** existing delegated-mode sub-agent e2e tests stay green (flatten defaults
off).

## Files touched

- `ui/src/components/AgentChat.vue` — ref, option pass-through, handler, dialog wiring
- `ui/src/composables/use-agent-chat.ts` — option, getter, setter, `sendMessage` branch,
  `resolveSubAgents` flag
- `ui/src/components/agent-chat/AgentChatDebugDialog.vue` — switch, prop, emit, i18n
- `docs/architecture/sub-agents.md` — short note documenting the flatten toggle
- tests — unit coverage for the flat build path
