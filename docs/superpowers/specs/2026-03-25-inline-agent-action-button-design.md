# Inline Agent Action Button (`DfAgentChatAction`)

## Overview

A new component for `@data-fair/lib-vuetify-agents` that provides an inline action button embeddable directly in pages next to specific actions. When clicked, it opens the agent chat drawer with a new session pre-filled with a context-specific prompt. The button reflects the chat session status while it owns the session.

## Motivation

The existing `DfAgentChatToggle` opens a general-purpose chat. There is no way to launch a contextual agent session tied to a specific page action (e.g. "help me create a dataset" or "help me configure a processing"). This component fills that gap.

## Design

### Component: `DfAgentChatAction`

A small icon button (robot icon, similar size to the FAB toggle) designed for inline placement next to actions in pages.

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `actionId` | `string` | yes | — | Unique identifier for this action, used to track session ownership |
| `visiblePrompt` | `string` | yes | — | Message shown in the chat as a user message (flat/filled style) |
| `hiddenContext` | `string` | yes | — | Technical context injected into the system prompt, not visible in chat UI |
| `btnProps` | `object` | no | `{}` | Passthrough props for the underlying `v-btn` |
| `title` | `string` | no | `"Ask the assistant"` | Tooltip/title for the button |

**Behavior:**

- **Click:** Calls `state.openForAction(actionId, visiblePrompt, hiddenContext)`. Shows loading state if the iframe isn't ready yet.
- **Status display:** When `state.activeActionId === actionId`, mirrors the toggle's icon/color/loading logic (working → accent + loading, waiting-user → warning + question icon, error → error + alert icon, idle → secondary + robot icon). When not the active action, shows neutral secondary style.
- **No unread badge:** Unlike the toggle, no badge. The button only opens the drawer, never closes it.
- **Dispose:** On `onScopeDispose`, calls `state.clearAction(actionId)` to end the session.

### Composable changes: `useAgentChatDrawer`

The existing singleton composable gets new state and methods.

**New state:**

- `ready: Ref<boolean>` — set to `true` by the drawer once the iframe signals it's fully loaded. Reset to `false` whenever `iframeCreated` transitions from `false` to `true` (iframe recreation). Buttons read this to know when they can send messages.
- `activeActionId: Ref<string | null>` — tracks which inline button owns the current session. Only the button whose ID matches gets status updates.

**New methods:**

- `openForAction(actionId: string, visiblePrompt: string, hiddenContext: string)` — called by the inline button. Opens the drawer (creating the iframe if needed), waits for `ready`, then sends a `start-session` message to the iframe via `postMessageToIframe`. Sets `activeActionId` to the given ID.
- `clearAction(actionId: string)` — called on `onScopeDispose` of the inline button. If `activeActionId` matches, resets `activeActionId` to `null`. Sends a `session-cleared` message to the iframe only if the iframe is available (guards against the case where the iframe was already destroyed during navigation).
- `postMessageToIframe(msg: object)` — sends a message to the chat iframe. Internally delegates to a function registered by the drawer component (see below). No-ops if the drawer has not registered yet.
- `registerIframeMessenger(fn: (msg: object) => void)` — called by `DfAgentChatDrawer` on mount to provide the composable with the ability to post messages to the iframe. The drawer implements this by calling `dFrameEl.value.contentWindow.postMessage(msg, '*')` on the underlying iframe element.

**Ready handshake:** The drawer listens for a `{ type: 'chat-ready' }` d-frame custom message from the iframe, then sets `ready = true`.

**Toggle interaction:** When the existing `DfAgentChatToggle` is clicked (calling `toggleDrawer`), `activeActionId` is not cleared. The toggle simply opens/closes the drawer. The action session continues to be reflected on the action button. If the user wants a fresh general session, they type a new message in the chat, which naturally moves the conversation away from the action context.

### D-frame message protocol extensions

**New messages — parent → iframe (via `window.postMessage`):**

Parent-to-iframe messages bypass d-frame's built-in message format. The drawer calls `iframeElement.contentWindow.postMessage(msg, '*')` directly. The chat page listens with `window.addEventListener('message', ...)` and filters for these custom message types.

- `{ type: 'start-session', visiblePrompt: string, hiddenContext: string }` — tells the chat to reset and start a new session with the given prompts.
- `{ type: 'session-cleared' }` — tells the chat that the action button was destroyed; the chat should display an informational message.

**New message — iframe → parent (via d-frame custom message):**

- `{ type: 'chat-ready' }` — sent by the chat page via `dFrameContent.sendMessage()` once it's fully mounted and able to receive messages. Named `chat-ready` (not `ready`) to avoid confusion with d-frame's internal `ready` handshake.

### Chat page changes (`AgentChat.vue`)

**On mount:**

- Emits `{ type: 'chat-ready' }` via `dFrameContent.sendMessage()` to the parent.
- Delays the default welcome message by 200ms after emitting `chat-ready`. If a `start-session` message arrives during that window, the welcome message is suppressed entirely (prevents flash). For normal sessions (no `start-session`), the 200ms delay is imperceptible.

**On `start-session`:**

- Re-creates the `useAgentChat` composable instance to get a fresh chat state with the new system prompt. This ensures `hiddenContext` is cleanly injected as part of the system prompt from the start, rather than mutated mid-session.
- Displays the `visiblePrompt` as a user message with a distinct "action prompt" style — flat/filled card instead of the normal outlined style, to differentiate from a normal session.
- Triggers `sendMessage` to start the agent.
- Logs both `visiblePrompt` and `hiddenContext` to the session recorder (trace).

**On `session-cleared`:**

- Appends an info message in the chat, e.g. "This assistance session has ended because you navigated away from the action."

**Message listener:** Adds `window.addEventListener('message', handler)` on mount (cleaned up on unmount) to receive parent-to-iframe messages. The handler checks `event.data.type` for `'start-session'` and `'session-cleared'`.

### Visual differentiation

Action-initiated sessions are visually distinct from normal sessions:

- The initial user message uses a flat/filled card style instead of outlined.
- This makes it immediately clear that this session was started by an action button, not typed by the user.

### Session lifecycle

1. User clicks `DfAgentChatAction` on a page.
2. Drawer opens (iframe created if needed). If iframe is being created, `ready` is reset to `false`.
3. Button waits for `ready` state (shows loading).
4. `start-session` message sent to iframe via `postMessageToIframe`.
5. Chat re-creates its `useAgentChat` instance, displays action prompt, starts agent.
6. Status flows back via existing `agent-status` d-frame protocol → reflected on the action button.
7. If the user navigates away (button destroyed via `onScopeDispose`):
   - `clearAction` is called.
   - If iframe is available, `session-cleared` sent → info message displayed.
   - `activeActionId` reset to `null`.
8. The session in the chat persists (messages remain) but the action button no longer tracks it.

### Replacing sessions

Clicking a different action button replaces the current session:

- `openForAction` with a new `actionId` sends a new `start-session`, which triggers a full chat re-creation.
- `activeActionId` is updated to the new button.

## File changes

### Package `lib-vuetify/`

1. **`types.ts`** — New message types: `ChatReadyMessage`, `StartSessionMessage`, `SessionClearedMessage`. New union type for parent-to-iframe messages.
2. **`useAgentChatDrawer.ts`** — New state (`ready`, `activeActionId`), new methods (`openForAction`, `clearAction`, `postMessageToIframe`, `registerIframeMessenger`), handle `chat-ready` message in `onDFrameMessage`, reset `ready` on iframe recreation.
3. **`DfAgentChatDrawer.vue`** — On mount, call `state.registerIframeMessenger()` with a function that posts messages to the iframe's contentWindow. Add handling for the d-frame ref.
4. **`DfAgentChatAction.vue`** — New component (described above).
5. **`index.ts`** — Export `DfAgentChatAction` and new types.

### UI `agents/ui/`

6. **`AgentChat.vue`** — Add `window.addEventListener('message', ...)` for incoming parent messages (`start-session`, `session-cleared`). Emit `chat-ready` via `dFrameContent.sendMessage()` on mount. Delay welcome message by 200ms. Re-create `useAgentChat` on `start-session`.
7. **`AgentChatMessages.vue`** — Render action prompts with flat/filled style. Render "session ended" info messages.
8. **Session recorder** — Log `start-session` content (both visible and hidden) to trace.
9. **`pages/_dev/chat-action.vue`** — New dev page demonstrating the component.

### Testing

10. **E2E Playwright tests** covering:
    - Clicking an action button opens the drawer with the visible prompt displayed in flat style.
    - The hidden context is not visible in the chat messages.
    - Clicking a second action button replaces the session.
    - Status on the action button reflects agent status.
    - Destroying the action button shows the "session ended" message in the chat.
    - If the iframe wasn't loaded yet, the button shows loading then opens once ready.
    - The welcome message does not flash when a `start-session` arrives quickly after `chat-ready`.

## Non-goals

- Filtering tools per action (the agent has access to all tools; the hidden context guides it toward relevant ones).
- Multiple concurrent sessions (new action replaces existing session).
- Closing the drawer from the action button (only opens/focuses).
- Custom rendering via slots (consistent small icon button).
