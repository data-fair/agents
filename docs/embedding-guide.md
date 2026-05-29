# Embedding Guide

The chat UI is designed to be **embedded as an iframe** in any data-fair application. `lib-vuetify` provides ready-made container components and composables.

---

## 1. Component Options

### Drawer — `DfAgentChatDrawer`

A floating side drawer (Vuetify `VNavigationDrawer`) that embeds the chat iframe:

```vue
<template>
  <DfAgentChatDrawer
    account-type="organization"
    account-id="my-org"
    chat-title="Data Assistant"
    system-prompt="You help users explore datasets."
  />
  <DfAgentChatToggle />
</template>
```

The drawer appears on the right side of the viewport at z-index 2500 (above `v-dialog`). Use `DfAgentChatToggle` to add a FAB button that opens/closes it.

### Menu — `DfAgentChatMenu`

An alternative that renders the chat as a popover menu (400x500px default):

```vue
<template>
  <DfAgentChatMenu
    account-type="organization"
    account-id="my-org"
    chat-title="Data Assistant"
    :menu-props="{ width: 500, height: 600 }"
  />
</template>
```

The menu includes a built-in activator button (FAB with status indicator) and a close button. It auto-focuses the iframe on open.

### Block — `DfAgentChatBlock`

Renders the chat iframe **flat inside the page** (no drawer, no popover, no FAB) — it fills its container and is always visible. This is the variant to use for embedding a custom chat directly in a portal page rather than as a floating overlay:

```vue
<template>
  <v-card style="height: 600px;">
    <DfAgentChatBlock
      account-type="organization"
      account-id="my-org"
      chat-title="Data Assistant"
      system-prompt="You help users explore datasets."
    />
  </v-card>
</template>
```

Because a block is always open there is no open/close state, no `localStorage` persistence, and no toggle/unread badge — give the parent element an explicit height since the iframe stretches to fill it.

### Props

All three components (drawer, menu, block) accept:

| Prop | Type | Description |
|------|------|-------------|
| `accountType` | `string` | `'user'` or `'organization'` |
| `accountId` | `string` | Account ID for the chat session |
| `src` | `string` | Custom iframe URL (overrides account-based URL resolution) |
| `chatTitle` | `string` | Title displayed in the chat header |
| `systemPrompt` | `string` | System prompt passed to the LLM (no length limit — see [Initial Configuration](#9-initial-configuration-systemprompt--title)) |
| `initConfigKey` | `string` | Override the per-variant init-config key. Only needed when mounting several instances of the same variant in one tab (defaults to `'drawer'` / `'menu'` / `'block'`) |

Drawer-specific: `drawerProps` (pass-through to `VNavigationDrawer`).
Menu-specific: `btnProps`, `menuProps`, `cardProps` (pass-through to Vuetify components).

**Key files:** `lib-vuetify/DfAgentChatDrawer.vue`, `lib-vuetify/DfAgentChatMenu.vue`, `lib-vuetify/DfAgentChatBlock.vue`, `lib-vuetify/DfAgentChatToggle.vue`

---

## 2. Singleton State

Drawer, menu and block each use a **singleton composable** — calling one from multiple components returns the same shared state:

```typescript
import { useAgentChatDrawer } from '@data-fair/lib-vuetify-agents'

const state = useAgentChatDrawer()
// state.drawerOpen, state.agentStatus, state.hasUnread, state.fabIcon, state.fabColor
```

Open/close state is persisted to `localStorage` (`df-agent-chat-open` / `df-agent-menu-open`), so the drawer remembers its position across page navigations. The block has no open/close state (it is always visible) and so persists nothing.

---

## 3. Status Indicator

The FAB button reflects the chat agent's current state:

| Status | Icon | Color |
|--------|------|-------|
| `idle` | robot | secondary |
| `working` | robot (loading spinner) | accent |
| `waiting-user` | question mark | warning |
| `error` | alert circle | error |

When tools change dynamically, the button flashes `accent` for 3 seconds (`toolsJustChanged`).

An unread badge (red dot) appears when the agent produces a response while the drawer is closed.

**Key file:** `lib-vuetify/useAgentChatBase.ts`

---

## 4. iframe Communication

The chat iframe and host app communicate through two channels:

### postMessage (via d-frame)

The iframe sends `AgentChatMessage` events to the host via the `d-frame` custom element's `@message` event:

| Message | Purpose |
|---------|---------|
| `{ type: 'agent-status', status }` | Updates FAB icon/color |
| `{ type: 'tools-changed' }` | Triggers accent flash |
| `{ type: 'unread', unread: boolean }` | Shows/hides unread badge |

### BroadcastChannel (tab-wide)

Used for session lifecycle — any frame on the same origin can interact:

| Message | Direction | Purpose |
|---------|-----------|---------|
| `agent-chat-ready` | Drawer → all | Announces drawer presence |
| `agent-start-session` | Action → drawer | Opens drawer and starts a chat with `visiblePrompt` + `hiddenContext` |
| `agent-session-cleared` | Action → all | Signals that an action button was unmounted |
| `agent-chat-ping` | Action → drawer | Discovery probe |
| `agent-chat-pong` | Drawer → action | Presence response |

**Key file:** `lib-vuetify/types.ts`

---

## 5. Exposing Tools from the Host App

The host application can expose tools to the chat agent via MCP over BroadcastChannel:

```vue
<script setup>
import { useFrameServer, useAgentTool } from '@data-fair/lib-vue-agents'

// Step 1: Start an MCP server on BroadcastChannel
useFrameServer('parent')

// Step 2: Register tools — they are automatically exposed to the chat iframe
useAgentTool({
  name: 'query_data',
  description: 'Run a SQL query on the current dataset',
  inputSchema: {
    type: 'object',
    properties: { sql: { type: 'string' } },
    required: ['sql']
  },
  execute: async ({ sql }) => {
    const result = await myApi.query(sql)
    return JSON.stringify(result)
  }
})
</script>
```

`useFrameServer('parent')` must be called **before** registering tools (or at least in the same setup scope). It replaces `navigator.modelContext` so that all registered tools are exposed via BroadcastChannel.

Tools are automatically unregistered when the component unmounts (via `onScopeDispose`).

The chat iframe's `FrameClientAggregator` discovers the server and makes the tools available to the LLM. See [MCP Tool Integration](./mcp-tool-integration.md) for the full protocol.

---

## 6. Declaring Sub-Agents

Host applications can also declare sub-agents that have exclusive access to specific tools:

```vue
<script setup>
import { useFrameServer, useAgentTool, useAgentSubAgent } from '@data-fair/lib-vue-agents'

useFrameServer('parent')

// Register tools
useAgentTool({ name: 'query_data', ... })
useAgentTool({ name: 'get_schema', ... })

// Declare a sub-agent that owns those tools
useAgentSubAgent({
  name: 'analyst',
  title: 'Data Analyst',
  description: 'Analyzes datasets using SQL queries',
  prompt: 'You are a data analyst. Use query_data and get_schema to answer questions.',
  tools: ['query_data', 'get_schema'],
  model: 'tools'
})
</script>
```

The main agent will delegate to `subagent_analyst` rather than calling `query_data` directly. See [Sub-Agent Orchestration](./subagent-orchestration.md) for details.

---

## 7. Starting Sessions Programmatically

Action buttons or host-app logic can trigger a chat session via BroadcastChannel:

```typescript
import { getTabChannelId } from '@data-fair/lib-vue-agents'

const channelId = getTabChannelId()
const bc = new BroadcastChannel(channelId)

bc.postMessage({
  channel: channelId,
  type: 'agent-start-session',
  visiblePrompt: 'Help me explore this dataset',
  hiddenContext: 'Dataset: sales_2024, columns: date, product, revenue, region'
})
```

The drawer composable listens for `agent-start-session` and automatically opens. The `visiblePrompt` is shown to the user; `hiddenContext` is passed to the agent without displaying it.

To check if a drawer is available before sending:

```typescript
bc.postMessage({ channel: channelId, type: 'agent-chat-ping' })
// Listen for 'agent-chat-pong' response
```

---

## 8. URL Resolution

The iframe URL is resolved as follows:
1. If `src` prop is provided → use it directly
2. Otherwise → `{origin}/agents/{accountType}/{accountId}/chat`

The drawer/menu/block components then append a single `?initConfig=<key>` query parameter (see next section). The `chatTitle` and `systemPrompt` are **no longer encoded in the URL** — they are passed through same-origin sessionStorage instead.

> **Legacy / direct-URL embeds:** the chat page still reads `?title=` and `?systemPrompt=` query params directly. This path is kept for backward compatibility (e.g. linking straight to the chat URL), but it is subject to URL length limits — prefer the init-config mechanism for anything but a short prompt.

---

## 9. Initial Configuration (systemPrompt & title)

The `systemPrompt` and `chatTitle` props are handed to the iframe through **same-origin sessionStorage**, not the URL. This is a one-shot "set then get" handoff: the host writes the config before the iframe loads, and the iframe reads it once on mount. It is **not** a reactive channel — changing the prop after the iframe is running does not update the live agent.

**Why not the URL?** The iframe URL passes through nginx, whose default request-line buffer (~8 KB) returns HTTP 414 above it. After percent-encoding (accented text expands ~3×), the safe ceiling for a URL-borne system prompt is only ~2 KB — too small for real custom-agent prompts. URL params also leak into nginx logs, browser history, and `Referer` headers. sessionStorage has no practical size limit and no such exposure, so **custom local chats (e.g. embedded in a portal) can carry an arbitrarily long system prompt.**

How it works:
1. Each component writes `{ prompt, title }` to sessionStorage under a per-variant key via `setAgentInitConfig(key, config)`.
2. The component appends `?initConfig=<key>` to the iframe URL.
3. The chat iframe (`AgentChat.vue`) reads its key from the URL and loads the config via `getAgentInitConfig(key)`, which takes precedence over its props.

The key defaults to the variant name (`'drawer'` / `'menu'` / `'block'`), so one of each can coexist in a tab without clobbering. Mounting several of the **same** variant in one tab requires distinct `initConfigKey` props.

You can also use the helpers directly when building a custom embed:

```typescript
import { setAgentInitConfig } from '@data-fair/lib-vue-agents'

setAgentInitConfig('my-chat', { prompt: 'You are a portal assistant…', title: 'Portal Help' })
// then load the iframe with `…/chat?initConfig=my-chat`
```

**Key file:** `lib-vue/agent-init-config.ts`

---

## Key Files

| File | Role |
|------|------|
| `lib-vuetify/DfAgentChatDrawer.vue` | Floating drawer with iframe |
| `lib-vuetify/DfAgentChatMenu.vue` | Popover menu with iframe |
| `lib-vuetify/DfAgentChatBlock.vue` | Flat in-page chat (always visible) |
| `lib-vuetify/DfAgentChatToggle.vue` | FAB button with status indicator |
| `lib-vuetify/useAgentChatBase.ts` | Shared state factory: status, unread, BroadcastChannel, URL resolution |
| `lib-vuetify/useAgentChatDrawer.ts` | Drawer singleton composable |
| `lib-vuetify/useAgentChatMenu.ts` | Menu singleton composable |
| `lib-vuetify/useAgentChatBlock.ts` | Block singleton composable |
| `lib-vuetify/types.ts` | Message type definitions |
| `lib-vue/agent-init-config.ts` | sessionStorage handoff for systemPrompt/title |
| `lib-vue/use-frame-server.ts` | Expose tools via MCP over BroadcastChannel |
| `lib-vue/use-agent-tools.ts` | Register tools via WebMCP polyfill |
| `lib-vue/use-agent-sub-agent.ts` | Declare sub-agents |
