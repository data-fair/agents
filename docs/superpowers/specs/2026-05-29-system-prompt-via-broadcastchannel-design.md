# Transmitting the system prompt to the chat iframe via BroadcastChannel

Date: 2026-05-29
Branch: `feat-custom-agent`

## Problem

The agent chat is embedded as an iframe. The host passes a `systemPrompt` to it
through a URL query parameter (`resolveAgentChatUrl` in
`lib-vuetify/useAgentChatBase.ts`, read back by `useStringSearchParam('systemPrompt')`
in `ui/src/pages/[type]/[id]/chat.vue`).

Query parameters have a hard practical ceiling. In this deployment the iframe URL
passes through nginx, whose default request-line buffer is ~8 KB and returns
HTTP 414 above it. After percent-encoding (multibyte/accented FR text expands ~3×)
and sharing that budget with the base URL, `title`, and other headers, the safe
ceiling for a system prompt is roughly **2 KB of source text**. Custom-agent system
prompts can easily exceed that. The prompt also leaks into nginx access logs,
browser history, and `Referer` headers.

## Goal

Transmit the system prompt from host to iframe over a channel with no size limit
and no URL exposure, while **keeping the query-param path working** for backward
compatibility (direct-URL embeds and `src`-based embeds).

## Approach

Reuse the exact mechanism the action button already uses
(`lib-vuetify/DfAgentChatAction.vue` → `ui/src/components/AgentChat.vue`):
a same-origin `BroadcastChannel` keyed by `getTabChannelId()`, with a
`sessionStorage` fallback for the case where the message is posted before the
iframe has loaded. This is proven to work in the deployment (agents app is served
same-origin under `/agents`), so it is the lowest-risk, most consistent choice.

The `@data-fair/frame` `d-frame` channel was considered but rejected: it is
asymmetric (clean iframe→parent `sendMessage`, but no parent→iframe custom-message
API — `DFrameContent.onMessage` silently ignores unknown message types), so it
would require more glue than the already-present BroadcastChannel pattern.

## Changes

### 1. New message type — `lib-vuetify/types.ts`

```ts
/** BroadcastChannel message sent by drawer/menu to set the iframe's system prompt */
export interface AgentSetSystemPrompt {
  channel: string
  type: 'agent-set-system-prompt'
  systemPrompt: string
}
```

Add `AgentSetSystemPrompt` to the `AgentActionMessage` union.

### 2. Shared helper — `lib-vuetify/useAgentChatBase.ts`

A new exported helper centralizes the send logic so the drawer and menu stay thin:

```ts
export function useSystemPromptChannel (getSystemPrompt: () => string | undefined): void
```

Behavior:
- Opens a `BroadcastChannel(getTabChannelId())`.
- `watch(getSystemPrompt, { immediate: true })`: when the prompt is a non-empty
  string, `postMessage({ channel, type: 'agent-set-system-prompt', systemPrompt })`
  and `sessionStorage.setItem('df-agent-system-prompt', systemPrompt)`.
- When the prompt is empty/undefined, `sessionStorage.removeItem('df-agent-system-prompt')`
  (and do not post) so a stale value cannot leak into a later prompt-less embed in
  the same tab.
- Closes the channel on scope dispose.

The `sessionStorage` write must happen synchronously during the parent's setup
(immediate watch) so it is present before the child iframe mounts and reads it.

### 3. Parent components — `DfAgentChatDrawer.vue`, `DfAgentChatMenu.vue`

Call `useSystemPromptChannel(() => props.systemPrompt)` in setup.

### 4. Stop encoding the prompt in the URL — `resolveAgentChatUrl`

Remove the `if (props.systemPrompt) params.set('systemPrompt', ...)` line. The
`title` param stays. This removes the size ceiling for the drawer/menu path. The
function keeps the `props.src` and `accountType/accountId` branches unchanged.

### 5. Iframe side — `ui/src/components/AgentChat.vue`

- Introduce an internal reactive ref seeded from `props.systemPrompt`
  (still sourced from the query param via `chat.vue`), and use it in
  `finalSystemPrompt` instead of `props.systemPrompt` directly.
- Extend the existing `actionChannel.onmessage` handler to handle
  `agent-set-system-prompt`: update the ref.
- On mount, alongside the existing `df-agent-pending-action` read, also read
  `sessionStorage.getItem('df-agent-system-prompt')` and, if present, seed the ref.

Precedence: query param is the initial value; a BroadcastChannel message or
`sessionStorage` value overrides it when present. In the drawer/menu path the
query param is no longer set, so there is no real conflict.

## Backward compatibility

- `chat.vue` still reads `useStringSearchParam('systemPrompt')`, so any embedder
  passing `?systemPrompt=` directly, or supplying a custom `src` with the param,
  keeps working unchanged.
- Only `DfAgentChatDrawer`/`DfAgentChatMenu` switch to the channel.

## Timing / correctness

- The host writes `sessionStorage` synchronously in its setup (immediate watch),
  before the nested `d-frame` iframe mounts → the iframe's on-mount read finds it.
- The `BroadcastChannel` post covers the live-update case (prompt changes while the
  iframe is already open).
- `finalSystemPrompt` is a `computed`; updating the ref recomputes it. The prompt is
  in place before the user can send a first message and before any user-triggered
  action session, so the default-prompt window is not observable in practice.

## Out of scope

- No server-side prompt storage / `agentId` indirection (a separate, larger design).
- No change to the action-button `visiblePrompt`/`hiddenContext` flow.
- No change to the `@data-fair/frame` library.

## Testing

- **Unit**: `useSystemPromptChannel` posts on the channel and writes sessionStorage
  when the prompt is set; no-ops on empty; `resolveAgentChatUrl` no longer emits
  `systemPrompt` in the query string but still emits `title`.
- **API**: n/a (client-only change).
- **E2E**: with a host embedding the drawer and a `systemPrompt`, the iframe chat
  uses that prompt (assert via the debug view / first assistant behavior). Verify a
  prompt larger than the old ~2 KB ceiling works. Verify the legacy `?systemPrompt=`
  direct-URL path still applies the prompt.
