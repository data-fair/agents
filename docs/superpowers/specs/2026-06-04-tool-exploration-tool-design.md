# Tool Exploration Tool — Progressive Tool Disclosure

**Date:** 2026-06-04
**Branch:** `feat-tool-exploration-tool`
**Status:** Design approved, pending spec review

## Problem

Tools are declared dynamically by browser pages via WebMCP and aggregated client-side
(`ui/src/transports/frame-client-aggregator.ts`), converted to AI SDK tools, and passed to
`streamText({ tools })` in `ui/src/composables/use-agent-chat.ts`. The list is never huge
(~20 tools today) but each carries a few phrases of description plus input/output schemas, so
sending the full set on every request is cumbersome. Worse, tools are added/removed based on
user activity in the page, and every mutation changes the tool set sent to the provider.

This causes (all four confirmed as motivations):

1. **Prompt-cache instability** — tool-list mutations bust the provider prompt cache.
   *(Caveat: only real if caching is actually active through the gateway — see Open Items.)*
2. **Context size / token cost** — full schemas bloat every request.
3. **Scale headroom** — 20 today, but lists may grow to 50–100+ where sending everything is
   untenable. We want the pattern in place now.
4. **Exploration / R&D** — a togglable experiment to study progressive tool-disclosure behavior,
   hence the trace-mode-style toggle.

## Core idea

Replace "send all tools every request" with **progressive disclosure**:

- The assistant always sees exactly one constant tool, `explore_tools`, plus a rolling catalog of
  tool *names* in the conversation tail.
- To actually use a tool, the assistant calls `explore_tools` with its intent. The summarizer
  model reads the full registry and selects the relevant tools, which are then **promoted** into
  the active set and become callable on the next step.
- Unused tools are **demoted** on conversation compaction.

The non-obvious point that drives the architecture: **a tool description is not a callable tool.**
The assistant can only call what is exposed to the provider. So exploration must have a real side
effect on the active tool set, not merely return descriptive text.

## Architecture

### 1. Toggle & scope

Mirror the existing tracing toggle exactly:

- Gated by the existing `debug` prop **and** `sessionStorage['agent-chat-explore'] === '1'`
  (tracing uses `sessionStorage['agent-chat-trace'] === '1'`, see `ui/src/components/AgentChat.vue`).
- **Off** → today's behavior unchanged (all aggregated tools passed directly in the `tools` map).
- **On** → exploration mode (below).

This gives the A/B harness needed for the R&D motivation: the same conversation can be run with
the toggle on or off and compared.

### 2. Active-tool-set mechanism (the real core)

- The **full registry** (all aggregated tools **plus** `explore_tools`) is passed as `tools` to
  `streamText`. AI SDK v6's `activeTools` gates which of those are actually sent to the provider.
- A `promoted` set (a closure-held ref in the chat composable) tracks which real tools are
  currently callable. It starts empty.
- `streamText`'s **`prepareStep`** callback reads `promoted` and returns
  `activeTools: ['explore_tools', ...promoted]` on each step. A tool promoted during step N is
  therefore callable on step N+1 — **within the same `streamText` turn**, no manual re-issue and
  no waiting for the next user message.
- **Cache/context win:** only active tool schemas reach the wire; `explore_tools` is a stable
  constant; `promoted` only ever *grows* during a turn (appends, never reorders), preserving any
  prefix cache.

This depends on `ai@6.0.116` supporting `prepareStep`/`activeTools` (verify exact signature — see
Open Items). The call site is `ui/src/composables/use-agent-chat.ts:562` (`streamText`,
`stopWhen: stepCountIs(10)`).

### 3. The `explore_tools` tool

- **Input:** `{ intent: string }`. A single free-text intent covers both use cases — "tools for
  task X" and "what's available?" — with no mode flag.
- **execute:** runs the **summarizer** model via `generateObject` (`provider.chat('summarizer')`,
  the same provider handle used by `compactHistory`), prompting it with the *full* registry (names,
  descriptions, schemas) and the `intent`. Returns a structured `{ summary: string,
  relevantTools: string[] }`.
- **Side effect:** the `relevantTools` names are added to `promoted`. The execute return value
  (text shown to the assistant) is the `summary`, optionally suffixed with "Now callable: …".
  The full schemas of promoted tools reach the assistant through the now-active `tools` map — not
  through this text.
- For a pure "what's available?" intent, the summarizer may select zero tools and just summarize.

### 4. Name catalog in the conversation tail

Implements the "tool-list mutation as messages" idea.

- A single rolling "available tools" message (names + one-line summaries) lives in the conversation
  **tail**, refreshed when `onToolsChanged` fires (from the aggregator). Only re-emitted when the
  set actually changes, to avoid spam.
- **Known wrinkle:** this catalog must **not** be a `system` message. The gateway merges all
  `system` messages into the top-level `system` prefix (`api/src/gateway/router.ts`), so putting
  the catalog there would mutate the cached prefix on every tool change — the exact opposite of the
  goal. It therefore rides as a **tail message** (a marked `user`-role note is the pragmatic
  choice). This is the one place the chosen "names in injected message" approach fights the
  provider message format. If caching turns out not to be active (Open Item 1), placement is purely
  cosmetic and can be revisited.

### 5. Demotion / compaction

- On the existing history compaction (24k-char threshold in `use-agent-chat.ts`), **reset
  `promoted` to `[]`**.
- Re-exploration is cheap because the name catalog is always present in the tail, so a full reset is
  simpler than per-tool TTLs and matches the "auto-compaction removes tool descriptions not used
  recently" intent. (Per-tool TTL was considered and rejected as premature.)

### 6. System prompt

One added instruction, appended to the existing system prompt only when the toggle is on:

> "Tools for this page are listed in the conversation. To use one, call `explore_tools` with your
> intent first; it makes the relevant tools available."

### 7. Data flow summary

```
toggle ON
  │
  ├─ activeTools = ['explore_tools']  (+ rolling name catalog in tail, refreshed on onToolsChanged)
  │
  ▼
assistant reads catalog → calls explore_tools({ intent })
  │
  ├─ summarizer (generateObject) over full registry → { summary, relevantTools }
  ├─ promoted += relevantTools                       (side effect)
  └─ returns summary text
  │
  ▼
prepareStep exposes activeTools = ['explore_tools', ...promoted]
  │
  ▼
assistant calls the now-active real tool(s) on the next step
  │
  ▼
on 24k compaction → promoted reset to []
```

## Testing

- **Unit** (pure): promotion/demotion set logic; parsing/validation of the summarizer's
  `{ summary, relevantTools }` output (including unknown tool names being ignored).
- **API/E2E:** with the toggle on, a turn that requires a known tool must first call
  `explore_tools`, then the real tool; assert the toggle-off path is byte-for-byte the current
  behavior.

## Open items to verify during planning

1. **Is provider prompt-caching actually active through the gateway?** If not, motivation #1 is
   aspirational and §4's wrinkle is moot — simplifying catalog placement.
2. **Exact `prepareStep`/`activeTools` signature in `ai@6.0.116`** — confirm it gates tools sent to
   the provider (not just local execution) and that mid-turn mutation of the referenced `promoted`
   set is read on the following step.

## Out of scope (YAGNI)

- Vector search / embeddings over tools — the list is small enough to fit in the summarizer context.
- Per-tool usage TTLs — full reset on compaction is sufficient for now.
- Server-side tool storage — tools remain client-aggregated as today.
