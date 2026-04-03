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

### Props

Both components accept:

| Prop | Type | Description |
|------|------|-------------|
| `accountType` | `string` | `'user'` or `'organization'` |
| `accountId` | `string` | Account ID for the chat session |
| `src` | `string` | Custom iframe URL (overrides account-based URL resolution) |
| `chatTitle` | `string` | Title displayed in the chat header |
| `systemPrompt` | `string` | System prompt passed to the LLM |

Drawer-specific: `drawerProps` (pass-through to `VNavigationDrawer`).
Menu-specific: `btnProps`, `menuProps`, `cardProps` (pass-through to Vuetify components).

**Key files:** `lib-vuetify/DfAgentChatDrawer.vue`, `lib-vuetify/DfAgentChatMenu.vue`, `lib-vuetify/DfAgentChatToggle.vue`

---

## 2. Singleton State

Both drawer and menu use **singleton composables** — calling them from multiple components returns the same shared state:

```typescript
import { useAgentChatDrawer } from '@data-fair/lib-vuetify-agents'

const state = useAgentChatDrawer()
// state.drawerOpen, state.agentStatus, state.hasUnread, state.fabIcon, state.fabColor
```

Open/close state is persisted to `localStorage` (`df-agent-chat-open` / `df-agent-menu-open`), so the drawer remembers its position across page navigations.

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
2. Otherwise → `{origin}/agents/{accountType}/{accountId}/chat?title=...&systemPrompt=...`

Query parameters are URL-encoded. The URL can be customized for different deployments.

---

## Key Files

| File | Role |
|------|------|
| `lib-vuetify/DfAgentChatDrawer.vue` | Floating drawer with iframe |
| `lib-vuetify/DfAgentChatMenu.vue` | Popover menu with iframe |
| `lib-vuetify/DfAgentChatToggle.vue` | FAB button with status indicator |
| `lib-vuetify/useAgentChatBase.ts` | Shared state factory: status, unread, BroadcastChannel |
| `lib-vuetify/useAgentChatDrawer.ts` | Drawer singleton composable |
| `lib-vuetify/useAgentChatMenu.ts` | Menu singleton composable |
| `lib-vuetify/types.ts` | Message type definitions |
| `lib-vue/use-frame-server.ts` | Expose tools via MCP over BroadcastChannel |
| `lib-vue/use-agent-tools.ts` | Register tools via WebMCP polyfill |
| `lib-vue/use-agent-sub-agent.ts` | Declare sub-agents |
