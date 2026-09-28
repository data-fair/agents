# Autonomous Agents P0-C3 (UI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An org admin can create an autonomous agent, send it work, and watch it work — in the browser, with no new rendering or transport code.

**Architecture:** Three thin layers over what C1 and C2 already expose. A pure mapper turns a stored `AutonomousAgentMessage` into the `ChatMessage` the existing `AgentChatMessages.vue` already renders. A composable holds the version cursor: it fetches with `?sinceVersion=`, subscribes to the conversation channel through `@data-fair/lib-vue/ws.js`, and refetches whenever a notification says the conversation moved. Two pages — a config page reusing the vjsf component `build-types` already generates, and a thread page.

**Tech Stack:** Vue 3 + Vuetify, `vue-router/vite` file-based routing, `@data-fair/lib-vue` (`useSession`, `useWS`), `@koumoul/vjsf` (pre-compiled), Playwright (`unit` / `api` / `e2e`).

**Spec:** `docs/superpowers/specs/2026-09-22-autonomous-agents-p0-design.md`

## Scope

Plan **C3 of three**, and the last of P0's runtime. A and B are merged; **C1** (storage, routes, executor, budgets) and **C2** (notifications, incremental fetch, traces) are merged and complete.

This plan writes **no new API route and no new transport**. If a task finds itself adding either, that is a signal it has drifted — everything it needs is already served and tested.

Out of scope: scheduling, memories, skills, sub-agent delegation, the write-approval gate (all P1+).

## Global Constraints

- **Naming:** "autonomous agent" written out in every identifier, route, component name and user-facing string. Never a bare `agent` — this service is itself called `agents` and its in-page assistant is already "the agent". Hyphenated prose compounds are the only exception.
- **Reuse, do not re-implement.** `AgentChatMessages.vue` renders the transcript, `useWS` owns the socket, `vjsf-autonomous-agent-write-req.vue` is the config form. A task that writes its own message renderer, its own WebSocket, or its own form has gone wrong.
- **Every user-facing string is translated**, English and French, following the existing pages. Both `vjsf-…-en.vue` and `vjsf-…-fr.vue` variants exist and are selected the way `OrgConfigSection.vue` does it.
- **`ui/components.d.ts` and `ui/dts/*` are generated and additive-only** — stage their churn, never hand-edit.
- **Quality gate before every commit:** `npm run lint-fix`, `npm run check-types`, the FULL `npm run test-unit` and `npm run test-api`, and — because every task here touches `ui/` — `npm run test-e2e`, which first needs `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd ..`.
- **Write e2e specs by hand.** The Playwright MCP tooling has been broken since playwright 1.63, so the `playwright-test-generator` / `-healer` agents are not usable here; follow `tests/features/settings/settings.e2e.spec.ts` as the pattern.
- **Dev processes are user-managed.** Never start, stop, restart or kill any dev process or container. On a connection error run `bash dev/status.sh`, report, and STOP.
- **Stage commits with explicit paths.** Never `git add -A`. Commit subjects must be lowercase after the type — commitlint rejects `fix(x): C2 review …`.
- Tests go in `tests/features/autonomous-agents/`. `tests/features/agents/` is the *in-page* assistant, a different feature.

## Facts established before writing this plan

Verified by reading the code, not assumed.

- **`AgentChatMessages.vue` is reusable as a read-only transcript.** Its props are `messages: ChatMessage[]`, `isStreaming`, `activity`, `subAgentActivities`, `chatError`, `welcomeText`, `toolTitle`, `actionVisiblePrompt`, `mermaidEnabled`, and optional `simpleSubAgents` / `showReasoning` (`ui/src/components/agent-chat/AgentChatMessages.vue:304-333`). It emits `navigate`, `fix-mermaid`, `mermaid-error` and `update:scrolled`. `ChatMessage` already lives in `@agents/shared/chat-message` — that is what C1 Task 1's extraction was for.
- **`@data-fair/lib-vue/ws.js` already provides the client:** `useWS(path)` → `{ opened, ws, subscribe, unsubscribe }`, built on `reconnecting-websocket`, and it **re-sends its `subscribe` frames on reconnect** (`ws.js:19`). That gives reconnect/resubscribe for free, and it also means a reconnect re-runs the server's `canSubscribe` against a fresh cookie — which is the mitigation for C2's "a subscription is never revalidated" residue.
- **The vjsf config form already exists:** `npm run build-types` generates `ui/src/components/vjsf/vjsf-autonomous-agent-write-req{,-en,-fr}.vue` from Plan A's write-req schema (see the `--vjsf-dir` flag in the root `build-types` script). `OrgConfigSection.vue` shows how a page picks the locale variant and passes `:options="vjsfOptions"`.
- **Pages are file-based** under `ui/src/pages` via `vue-router/vite`, with `[type]/[id]/…` for the account. `ui/src/pages/[type]/[id]/index.vue` is the admin page and already redirects a non-admin to `/…/chat`; it uses `useI18n`, `useSession`, `getAccountRole`, `setBreadcrumbs`, and `DfSectionTabs`/`DfToc` from `@data-fair/lib-vuetify`.
- **`ui/src` imports from `api/src` only as a TYPE** (`ui/src/context.ts:1`), and `ui/tsconfig.json`'s `paths` exposes only `#api/types` and `#api-doc/*` — there is no precedent for a runtime value import across that boundary, which is why the channel helpers move to `shared/` instead.
- **This feature's test directory uses no numeric prefixes** (`runtime.api.spec.ts`, `nhi.unit.spec.ts`, …), unlike some others (`1.tool-exploration.unit.spec.ts`). Match the directory it lives in.
- **Components fetch with plain `fetch(…, { credentials: 'include' })`** (`ui/src/components/TracesSection.vue:79`), not a wrapper.
- **The API surface C3 consumes, all already tested:**
  - `GET|POST /api/autonomous-agents/:type/:id` and `PUT|DELETE /api/autonomous-agents/:type/:id/:agentId` — CRUD (Plan A), admin-gated, plus `…/:agentId/tools` and `…/mcp-servers`.
  - `POST /api/autonomous-agent-conversations/:type/:id` — create a thread; `GET` the same path with `?autonomousAgentId=` — list threads.
  - `GET /api/autonomous-agent-conversations/:type/:id/:conversationId/messages?sinceVersion=N` — incremental fetch, returning `{results, count, version}`. **`version` is the cursor to store**; `sinceSeq` exists but cannot see an in-place update.
  - `POST` the same path — append a user message, returns the message plus `runId`.
  - `GET /api/autonomous-agent-runs/:type/:id/:runId` and `POST …/:runId/abort`.
  - Websocket channel `autonomous-agent-conversations/<conversationId>`, payload `{conversationId, version}` only.
- **A stored message maps onto `ChatMessage` with one wrinkle:** `AutonomousAgentMessage.toolCalls` is `{toolCallId?, toolName, serverId?, arguments?, annotations?, failed?, error?}[]`, while `ChatMessage.toolInvocations` is `{toolCallId, toolName, state: 'pending'|'done'}[]`. The mapper has to choose a `state`, and `failed` has no representation in `ChatMessage` at all.
- **`enabled`, `instructors`, `persona`, `toolDisclosure` and `mcpServers`** are all on the agent document (`api/types/autonomous-agent/schema.js`); `nhi.clientId` is set by enrolment and a PUT that omits `nhi` **drops it**, because the write route rebuilds that field from the body.

## Decisions

**Ruling C3-1 — the transcript is read-only and reuses `AgentChatMessages.vue` unchanged.** No prop may be added to it for this feature. Where autonomous-agent data has no place to go — a failed tool call, a tool's `serverId`, a run's stop reason — it is surfaced *around* the transcript (a run status strip) rather than by widening a component that the in-page assistant also renders. *Cost if wrong:* some autonomous-agent detail is one glance away instead of inline; widening a shared component to carry it would risk the in-page chat, which has 123 e2e tests riding on it.

**Ruling C3-2 — the version cursor is the only sync mechanism; the notification is just a trigger.** The composable fetches with `?sinceVersion=<last seen>`, stores the `version` from the response, and treats a notification purely as "fetch now". It never trusts a notification's version as data and never polls on a timer while connected. On reconnect it refetches from its stored cursor before trusting the socket again, because `reconnecting-websocket` can miss notifications while down. *Cost if wrong:* one extra fetch per reconnect.

**Ruling C3-3 — a pending assistant message drives the streaming indicator, not a run lookup.** C2 made the partial answer real: a `pending: true` assistant message carries the text so far. So `isStreaming` is `messages.some(m => m.pending)`, which needs no second request and cannot disagree with what is rendered. The run is still fetched, but only for the status strip and the abort button. *Cost if wrong:* a turn whose message write lags a run transition shows the indicator for one extra fetch cycle.

---

### Task 1: The message mapper and the conversation composable

**Files:**
- Create: `shared/autonomous-agent-chat-message.ts`
- Create: `ui/src/composables/use-autonomous-agent-conversation.ts`
- Create: `tests/features/autonomous-agents/chat-message.unit.spec.ts`

**Interfaces:**
- Consumes: `ChatMessage` (`@agents/shared/chat-message`), `AutonomousAgentMessage` (`#types`), `useWS` (`@data-fair/lib-vue/ws.js`), `conversationChannel` (`api/src/autonomous-agent-runtime/operations.ts`).
- Produces:
  - pure: `autonomousAgentMessageToChat(message): ChatMessage`, `autonomousAgentMessagesToChat(messages): ChatMessage[]`, `mergeBySeq(existing, incoming): AutonomousAgentMessage[]`
  - composable: `useAutonomousAgentConversation({ accountType, accountId, conversationId })` → `{ messages, chatMessages, isStreaming, version, error, refresh, post, connected }`

The mapper lives in `shared/` because it bridges two types that both live there or in `#types`, and because a pure function with three awkward decisions in it deserves unit tests that need no browser.

- [ ] **Step 1: Write the failing test**

Create `tests/features/autonomous-agents/chat-message.unit.spec.ts`:

```ts
/**
 * stateless unit tests for mapping a stored autonomous agent message onto the ChatMessage
 * shape the existing transcript component renders
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { autonomousAgentMessageToChat, autonomousAgentMessagesToChat, mergeBySeq } from '@agents/shared/autonomous-agent-chat-message'

const base = {
  id: 'm1', conversationId: 'c1', autonomousAgentId: 'a1',
  owner: { type: 'organization' as const, id: 'test1' },
  seq: 1, role: 'user' as const, author: { kind: 'user' as const, userId: 'u1', userName: 'Alice' },
  createdAt: '2026-09-28T10:00:00Z'
}

test.describe('autonomousAgentMessageToChat', () => {
  test('carries role and content through', () => {
    const chat = autonomousAgentMessageToChat({ ...base, content: 'hello' } as any)
    assert.equal(chat.role, 'user')
    assert.equal(chat.content, 'hello')
  })

  test('a message with no content maps to an empty string, never undefined', () => {
    // ChatMessage.content is required and the renderer indexes into it; a pending assistant
    // message legitimately has none yet.
    const chat = autonomousAgentMessageToChat({ ...base, role: 'assistant', author: { kind: 'autonomous-agent' } } as any)
    assert.equal(chat.content, '')
  })

  test('reasoning is carried so the foldable panel can show it', () => {
    const chat = autonomousAgentMessageToChat({ ...base, content: 'x', reasoning: 'thinking' } as any)
    assert.equal(chat.reasoning, 'thinking')
  })

  test('a tool call of a FINISHED message is done, not pending', () => {
    const chat = autonomousAgentMessageToChat({
      ...base, role: 'assistant', content: 'x', pending: false,
      toolCalls: [{ toolCallId: 't1', toolName: 'echo' }]
    } as any)
    assert.deepEqual(chat.toolInvocations, [{ toolCallId: 't1', toolName: 'echo', state: 'done' }])
  })

  test('a tool call of a PENDING message is pending, so the spinner is honest', () => {
    const chat = autonomousAgentMessageToChat({
      ...base, role: 'assistant', content: '', pending: true,
      toolCalls: [{ toolCallId: 't1', toolName: 'echo' }]
    } as any)
    assert.equal(chat.toolInvocations?.[0].state, 'pending')
  })

  test('a FAILED tool call is still shown as done, not as running forever', () => {
    // ChatMessage has no failure state for a tool call. Reporting 'pending' would leave a
    // spinner turning for a call that will never return; the failure is surfaced outside the
    // transcript instead (see Ruling C3-1).
    const chat = autonomousAgentMessageToChat({
      ...base, role: 'assistant', content: 'x', pending: false,
      toolCalls: [{ toolCallId: 't1', toolName: 'echo', failed: true, error: 'boom' }]
    } as any)
    assert.equal(chat.toolInvocations?.[0].state, 'done')
  })

  test('a tool call with no id still renders rather than being dropped', () => {
    const chat = autonomousAgentMessageToChat({
      ...base, role: 'assistant', content: 'x', toolCalls: [{ toolName: 'echo' }]
    } as any)
    assert.equal(chat.toolInvocations?.length, 1)
    assert.equal(typeof chat.toolInvocations?.[0].toolCallId, 'string')
  })

  test('maps a list in seq order regardless of input order', () => {
    const chats = autonomousAgentMessagesToChat([
      { ...base, seq: 2, content: 'second' },
      { ...base, seq: 1, content: 'first' }
    ] as any)
    assert.deepEqual(chats.map(c => c.content), ['first', 'second'])
  })
})

test.describe('mergeBySeq', () => {
  test('replaces a message that came back updated, rather than duplicating it', () => {
    // The whole point of ?sinceVersion=: an in-place update returns the SAME seq.
    const existing = [{ ...base, seq: 1, content: 'hello' }, { ...base, id: 'm2', seq: 2, content: '', pending: true }] as any
    const merged = mergeBySeq(existing, [{ ...base, id: 'm2', seq: 2, content: 'world', pending: false }] as any)
    assert.equal(merged.length, 2)
    assert.equal(merged[1].content, 'world')
    assert.equal(merged[1].pending, false)
  })

  test('appends a genuinely new message', () => {
    const merged = mergeBySeq([{ ...base, seq: 1 }] as any, [{ ...base, id: 'm2', seq: 2 }] as any)
    assert.deepEqual(merged.map((m: any) => m.seq), [1, 2])
  })

  test('keeps the result sorted by seq even when an update arrives out of order', () => {
    const merged = mergeBySeq([{ ...base, seq: 2 }] as any, [{ ...base, id: 'm1', seq: 1 }] as any)
    assert.deepEqual(merged.map((m: any) => m.seq), [1, 2])
  })

  test('an empty incoming batch changes nothing', () => {
    const existing = [{ ...base, seq: 1 }] as any
    assert.deepEqual(mergeBySeq(existing, []), existing)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test-unit -- tests/features/autonomous-agents/chat-message.unit.spec.ts`
Expected: FAIL — cannot resolve `@agents/shared/autonomous-agent-chat-message`.

- [ ] **Step 3: Write the mapper**

Create `shared/autonomous-agent-chat-message.ts`. Import `ChatMessage` from `./chat-message.ts` and type the input structurally (the same trick `canInstruct` uses) so `shared/` does not depend on `#types`, which is an `api` import alias:

```ts
/** The stored fields this mapper reads. Structural, so shared/ needs no #types alias. */
export interface StoredAutonomousAgentMessage {
  seq: number
  role: 'user' | 'assistant'
  content?: string
  reasoning?: string
  pending?: boolean
  toolCalls?: { toolCallId?: string, toolName: string, failed?: boolean }[]
}
```

Each of the three awkward decisions gets the comment its test describes: the empty-content default, `state` following the *message's* pending flag rather than anything per-call, and a failed call mapping to `done` because a spinner that never stops is worse than a failure shown outside the transcript.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test-unit -- tests/features/autonomous-agents/chat-message.unit.spec.ts`
Expected: PASS (12 tests).

- [ ] **Step 5: Write the composable**

Create `ui/src/composables/use-autonomous-agent-conversation.ts`. It owns exactly one piece of state that matters — the cursor — and must:

- fetch `GET …/messages?sinceVersion=<cursor>` (omitting the parameter when the cursor is 0), merge with `mergeBySeq`, and store `version` from the response. **Never** derive the cursor from the messages received: when the last change was a run transition, no message comes back and the cursor would stall.
- subscribe through `useWS` to `conversationChannel(conversationId)` and call `refresh()` on any notification, ignoring the payload's contents beyond that (Ruling C3-2).
- watch `opened` and, on a transition back to true, `refresh()` **before** trusting the socket again — `reconnecting-websocket` can miss notifications while down.
- expose `isStreaming` as `messages.some(m => m.pending)` (Ruling C3-3).
- `post(content)` → the message POST, then `refresh()`.
- `unsubscribe` and stop on scope dispose, so a page change cannot leave a listener attached.

**Move `conversationChannel` / `channelConversationId` from `api/src/autonomous-agent-runtime/operations.ts` into `shared/` and repoint the server at them** — do not import them from `api/src`, and do not duplicate the channel string. `ui/src` does import from `api/src` today, but only as a TYPE (`ui/src/context.ts:1`), and `ui/tsconfig.json`'s `paths` exposes only `#api/types` and `#api-doc/*`; a runtime value import from outside `ui`'s tree would be new ground for no benefit. `shared/` is already wired into both workspaces, which is what it is for. The server's unit spec that imports these two moves with them.

- [ ] **Step 6: Verify and commit**

Run: `npm run lint-fix && npm run check-types && npm run test-unit && npm run test-api`

```bash
git add shared/autonomous-agent-chat-message.ts ui/src/composables/use-autonomous-agent-conversation.ts tests/features/autonomous-agents/chat-message.unit.spec.ts
git commit -m "feat(autonomous-agents): map stored messages onto the shared chat transcript type"
```

---

### Task 2: The configuration page

**Files:**
- Create: `ui/src/components/AutonomousAgentsSection.vue`
- Modify: `ui/src/pages/[type]/[id]/index.vue` (add the section and its TOC entry)
- Create: `tests/features/autonomous-agents/autonomous-agents.e2e.spec.ts`

**Interfaces:**
- Consumes: the Plan A CRUD routes, `vjsf-autonomous-agent-write-req{-en,-fr}.vue`, `DfSectionTabs`/`DfToc`.
- Produces: a section component mounted on the existing admin page.

A **section on the existing admin page**, not a new route: that page already gates on admin, sets breadcrumbs, and holds every other org-level concern (settings, usage, moderation, traces). A separate route would duplicate all of it.

- [ ] **Step 1: Write the failing e2e test**

Create `tests/features/autonomous-agents/autonomous-agents.e2e.spec.ts`, following `tests/features/settings/settings.e2e.spec.ts` for the login fixture and navigation. Cover:

- an admin sees the autonomous agents section and can create one by filling the vjsf form (title, persona) and saving; the new agent appears in the list;
- its enabled state is visible and can be toggled, and the change survives a reload (proving it persisted, not just re-rendered);
- a non-admin member is redirected away from the page, as the existing page already does;
- the MCP server picker offers the catalog entries the API serves — assert one known dev id (`dev-public-mcp`) rather than a count, which would pin the dev config.

Use `data-testid` attributes rather than text selectors wherever a string is translated, so the French build does not break the spec.

- [ ] **Step 2: Run to verify it fails**

Run: `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd .. && npm run test-e2e -- tests/features/autonomous-agents/autonomous-agents.e2e.spec.ts`
Expected: FAIL — the section does not exist.

- [ ] **Step 3: Write the section component**

`AutonomousAgentsSection.vue` takes `accountType` / `accountId` props like its siblings. It lists the agents (title, enabled, MCP server count, whether an NHI is enrolled), and opens a dialog with the generated vjsf component to create or edit one.

Two things the form must get right, both already load-bearing on the API side:

- **A PUT that omits `nhi` drops the enrolment.** When editing an existing agent, send its current `nhi.clientId` back, or an edit silently un-enrols the agent and its next turn refuses. (The API rebuilds that field from the body by design — see `api/src/autonomous-agents/router.ts`.)
- **The obfuscated-secret pattern does not apply here** — an autonomous agent holds no secret of its own — so unlike the settings form there is nothing to preserve across a round trip except `nhi`.

Show `enabled: false` distinctly in the list: C1 made it a real kill switch, and an admin needs to see at a glance that an agent is stopped.

- [ ] **Step 4: Mount it on the admin page**

Add the section to `ui/src/pages/[type]/[id]/index.vue` beside `OrgConfigSection`, with a TOC entry. Keep it behind the same `isAdmin` computed the page already uses.

- [ ] **Step 5: Verify and commit**

Run: `npm run lint-fix && npm run check-types && npm run test-unit && npm run test-api && npm run test-e2e`

```bash
git add ui/src/components/AutonomousAgentsSection.vue ui/src/pages ui/components.d.ts ui/dts tests/features/autonomous-agents
git commit -m "feat(autonomous-agents): configuration section on the org admin page"
```

---

### Task 3: The thread page

**Files:**
- Create: `ui/src/pages/[type]/[id]/autonomous-agents/[agentId].vue`
- Create: `ui/src/components/AutonomousAgentRunStatus.vue`
- Modify: `tests/features/autonomous-agents/autonomous-agents.e2e.spec.ts`

**Interfaces:**
- Consumes: `useAutonomousAgentConversation` (Task 1), `AgentChatMessages.vue`, the conversation/run routes.
- Produces: the thread route, linked from the configuration section.

- [ ] **Step 1: Write the failing e2e test**

Add to the e2e spec:

- an admin opens an agent's thread page, posts a message, and sees the assistant's answer appear **without reloading** — the proof that the notification plus incremental fetch work end to end, and the single most valuable assertion in this plan;
- the run's terminal state is shown after the turn (a status strip, per Ruling C3-1);
- a thread list shows more than one conversation once two exist, and switching between them shows different messages;
- **a failed turn shows its explanation rather than an empty bubble** — drive it with the `stream error` mock directive, the same seam C2's tests use;
- an unlisted org member opening the page is refused (the API 403s; assert the page says so rather than rendering an empty thread).

For "without reloading", assert on the transcript's content after posting, with Playwright's auto-waiting — never a fixed `waitForTimeout`, which would pass on a page that polls and hide a broken socket.

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test-e2e -- tests/features/autonomous-agents/autonomous-agents.e2e.spec.ts`
Expected: FAIL — the route does not exist.

- [ ] **Step 3: Write the page**

The page: a conversation list down one side (create a thread, switch), the transcript via `AgentChatMessages.vue` fed from `chatMessages`, a composer, and `AutonomousAgentRunStatus.vue` showing the current or last run — its status, stop reason, steps, credits, and an abort button while it is running.

The status strip is where everything `ChatMessage` cannot carry goes (Ruling C3-1): a stop reason such as `budget` or `repeated-calls`, and any tool call recorded with `failed: true` — with its `arguments`, which C2 added precisely so a reviewer can see what a tool was asked to do.

The composer must stay enabled while a turn runs: C1's executor queues a message posted mid-turn under the conversation lock and drains it afterwards, so blocking the composer would hide a capability that is already built and tested.

- [ ] **Step 4: Link it from the configuration section**

Each agent in Task 2's list gets a link to its thread page. This is also the step that makes the feature reachable at all.

- [ ] **Step 5: Verify and commit**

Run: `npm run lint-fix && npm run check-types && npm run test-unit && npm run test-api && npm run test-e2e`

```bash
git add ui/src ui/components.d.ts ui/dts tests/features/autonomous-agents
git commit -m "feat(autonomous-agents): thread page with live transcript and run status"
```

---

## Done when

- An org admin can create, edit, enable and disable an autonomous agent from the existing admin page, using the generated vjsf form, without an edit silently dropping its enrolment.
- An admin or listed instructor can open a thread, post a message, and watch the answer arrive live — driven by a notification and `?sinceVersion=`, with no polling and no reload.
- A turn that fails, is truncated by a guard, or hits its budget explains itself in the UI; a failed tool call and what it was asked to do are visible.
- A running turn can be aborted from the page, and the composer stays usable while one runs.
- No new API route, no second message renderer, no hand-written WebSocket.
- `lint-fix`, `check-types`, `test-unit`, `test-api` and `test-e2e` all pass.

## Deliberately deferred

- Carried from C2: a revoked subscriber still learns that a conversation changed until its socket drops — `useWS`'s reconnect re-runs `canSubscribe`, which bounds it to one socket lifetime but does not close it; a compaction is traced with a cost but billed nowhere; a turn that fails before its first model call records no trace; reasoning does not drive a persist, so a long thinking phase looks idle; two ws test gaps (deleted agent, revoked mid-socket) and `tests/support/ws.ts` swallowing a socket error.
- Carried from B: the two environment-gap skips (dev cannot complete a real NHI enrolment); no 401-triggered session refresh; rotation overlap not expressible; `expires_in` unconfirmed.
- P1 and beyond: right-to-be-forgotten and retention across messages, runs and traces; the write-approval gate; sub-agent delegation; scheduling; memories and skills; the UI acting as enrolment facilitator so an admin keeps the two definitions coherent.
