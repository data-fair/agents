# Autonomous Agents P0-C2 (Observability) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Watching an autonomous agent work is live rather than polled, and every model call it makes is traceable.

**Architecture:** The service becomes a websocket publisher using the stack's existing `ws-server`/`ws-emitter` pub/sub (mongo-tailed, so it survives several API processes). One channel per conversation, authorized by the same `canInstruct` rule as the HTTP routes. The executor publishes document-level events plus throttled text revisions, each carrying the message `seq` so a client that misses one can refetch with `?sinceSeq=`. Each model call the executor makes is recorded through the existing `recordTraceRequest`.

**Tech Stack:** Node 24, Express 5, MongoDB, `@data-fair/lib-express/ws-server.js`, `@data-fair/lib-node/ws-emitter.js`, `ws` (already an `api` dependency), Playwright (`unit` / `api`).

**Spec:** `docs/superpowers/specs/2026-09-22-autonomous-agents-p0-design.md`

## Scope

Plan **C2 of three** for the P0 runtime. A and B are merged; **C1 is merged and complete** — an autonomous agent runs a real model turn, calls MCP tools as its own identity, and is bounded by loop guards, a credit budget, a wall-clock ceiling and abort.

- **C2 (this plan)** — websockets and traces. No UI.
- **C3** — the UI: agent list, thread view reusing `AgentChatMessages.vue` through the `ChatMessage` type now in `shared/`, and the vjsf config form.

Out of scope here: any Vue component, and any change to what the executor *does* — C2 only makes what it already does observable. If a task finds itself changing turn behaviour, that is a signal it has drifted.

## Global Constraints

- **Naming:** "autonomous agent" written out in every identifier, route, channel and user-facing string. Never a bare `agent`. This service is itself called `agents` and its in-page assistant is already "the agent". Hyphenated prose compounds are the only exception.
- **Module conventions:** `operations.ts` = pure stateless functions, no `#mongo`, no `#config`, no in-memory state, no imports but other `operations.ts`. `service.ts` = stateful. `router.ts` = HTTP only, imported only by `app.ts`.
- **Types come from JSON schemas.** Edit the schema, run `npm run build-types`, then `touch api/index.ts` (nodemon does not watch `api/config/type/.type/`), then confirm `bash dev/status.sh` shows dev-api UP. A new type directory needs a hand-written one-line `index.ts` (`export * from './.type/index.js'`) — the generator emits `index.d.ts`/`index.js` instead, which `#types/<name>/index.ts` cannot resolve. `.type/` is gitignored.
- **No credential in any response, log, model prompt or websocket payload.** The NHI signing key, minted assertions, session cookies and catalog `apiKey` values live only in config and transport headers.
- **A websocket payload is a public surface.** Everything emitted on a channel reaches every authorized subscriber, so it carries only what a reader of that conversation may already see through the HTTP routes.
- **Quality gate before every commit:** `npm run lint-fix`, `npm run check-types`, then the FULL `npm run test-unit` and `npm run test-api` (not one directory). Run `npm run test-e2e` when a task touches `ui/`, `lib-vue/` or `lib-vuetify/` — it needs `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd ..` first.
- **Dev processes are user-managed.** Never start, stop, restart or kill any dev process or container. If a test fails with a connection error, run `bash dev/status.sh`, report it, and STOP.
- **Stage commits with explicit paths.** Never `git add -A`.
- Tests go in `tests/features/autonomous-agents/`. Note `tests/features/agents/` is the *in-page* assistant, a different feature.

## Facts established before writing this plan

Verified by reading the installed code, not assumed.

- **`ws-server.start(server, db, canSubscribe)`** (`node_modules/@data-fair/lib-express/ws-server.js:13`) attaches a `WebSocketServer` to the existing http server. Clients send `{type: 'subscribe'|'unsubscribe', channel}` and get `subscribe-confirm` / `unsubscribe-confirm`, or `{type:'error', status:403}`. Authorization is `canSubscribe(channel, sessionState, message)` — **skipped entirely for `sessionState.user.adminMode`** (line 41), so a superadmin in admin mode subscribes to anything. The session comes from `session.req(req)` on the upgrade request, i.e. **from cookies**, so a test client must send the auth cookie.
- **`ws-emitter`** (`node_modules/@data-fair/lib-node/ws-emitter.js`) exposes `init(db)` and `emit(channel, data)`. `emit` **inserts a mongo document per call**, which `ws-server`'s tailed cursor fans out. That cost is why deltas must be throttled rather than emitted per token.
- **Neither is used anywhere in this repo yet** — C2 is the first use, so there is no existing channel-naming or client convention here to follow.
- **`ws` is already an `api` dependency** (`^8.19.0`), so tests can open a real client with no new install.
- **`recordTraceRequest(input: BuildTraceInput)`** (`api/src/traces/service.ts:11`) is the single entry point. `BuildTraceInput` needs `owner`, `conversationId`, `contextId`, `modelRole`, `providerName`, `providerType`, `resolvedModel`, `body`, `response`, `usage`, `prices`, `eurosPerCredit`, `timing`, and optional `userId`/`userName`/`moderation`/`flags`.
- **`parseContextId`** (`api/src/traces/operations.ts:33`) derives `contextKind` from the contextId's prefix: `sub:<name>:<idx>:<uid>`, `compaction:<uid>`, `turn:<uid>`, else `unknown`. **So `turn:` and `compaction:` already cover an autonomous run — no schema change is needed** to make its traces well-typed.
- **The gateway gates trace storage on `settings.storeTraces === true` AND an `x-trace-consent: yes` request header** (`api/src/gateway/router.ts:195-198`). The header is set by the browser after a per-user consent prompt.
- **Traces are fetched with `GET /api/traces/:type/:id/:conversationId`** (`api/src/traces/router.ts:68`), which returns `{results}` and requires `assertAccountRole(session, owner, 'admin')` — so a test must use a client that is an admin of the owner. The sibling `GET /api/traces/conversation/:conversationId` (line 15) **404s when there are no traces**, so it is the wrong route for asserting absence; the three-segment form returns `{results: []}`.
- **The mock model already streams one character per `text-delta`, every 10ms** (`api/src/models/mock-model.ts:517-529`). A long-answer seam therefore needs only to return a long string — no new streaming machinery — and a ~300-character answer produces ~300 delta parts over ~3s, which is exactly what a throttling assertion needs.
- **Per-step token counts are already in hand** in the executor's `onStepFinish` (`step.usage`), which is how spend is accumulated. Turn totals for a trace should be accumulated there too rather than read from `result.totalUsage`, so the trace, the usage records and the run all derive from one source.
- **`api/src/server.ts`** already holds `const server = createServer(app)` and calls `locks.start(mongo.db)` in `start()`, so both the http server and the db are in hand at the right moment. `stop()` is where `wsServer.stop()` belongs, beside `locks.stop()`.
- **The executor's turn already tracks everything an event needs:** `runTurn` creates the assistant message (`pending: true`) before the turn and finalises it after; `runModelLoop` accumulates `content`, `reasoning` and `toolCalls` while iterating `result.fullStream`; `incrementRunSpend` records spend per step.

## Decisions

**Ruling C2-1 — one channel per conversation, named `autonomous-agent-conversations/<conversationId>`.** Not per run and not per agent. Per run would make a client subscribe again for every turn and miss anything between them; per agent would broadcast one thread's content to subscribers of another, which the shared-timeline decision makes a real disclosure rather than just noise. The slash form deliberately differs from the conversation *lock* id (`autonomous-agent-conversation:<id>`, colon-separated) so the two namespaces cannot be confused at a glance. *Cost if wrong:* a client following several threads opens several subscriptions on one socket, which the protocol already supports.

**Ruling C2-2 — a text event carries the accumulated content and a revision number, not a per-token diff.** Applying a diff requires every prior diff to have arrived in order; applying an accumulated snapshot requires only that the client ignore a revision it has already passed. Since `ws-emitter` inserts a mongo document per emit, events are throttled to ~4/s regardless, so the snapshot's extra bytes cost far less than a resync protocol would. *Cost if wrong:* a very long answer re-sends its prefix a few times per second; if that ever matters, the revision number is already the hook a diff mode would need.

**Ruling C2-3 — an autonomous run's traces are gated on `settings.storeTraces` alone, with no consent header.** The gateway's second gate exists because an in-page chat's messages live only in the user's browser, so storing them server-side is a new disclosure that needs the person's consent. An autonomous conversation is *already* stored server-side by design — that is what C1 built — so a trace adds prompt/response detail about data the org already holds, not a new category of it. There is also no browser in the loop to ask, and P2's scheduled runs will have no instructing user at all. *Cost if wrong:* an org that enabled `storeTraces` for the in-page chat also gets traces for its autonomous agents without a separate opt-in; the retention TTL and the erasure work already planned for P1 cover both the same way.

**Ruling C2-4 — C2 emits and tests the server side of the seq-gap contract; the client half lands in C3.** Every event carries the message `seq`, which is what lets a client notice a hole and refetch with `?sinceSeq=`. Building the client detector now would mean writing it without the component that consumes it. *Cost if wrong:* nothing until C3, which is where the detector's own tests belong.

---

### Task 1: The websocket channel and its authorization

**Files:**
- Create: `api/src/autonomous-agent-runtime/events.ts`
- Create: `tests/features/autonomous-agents/events.unit.spec.ts`
- Create: `tests/support/ws.ts`
- Modify: `api/src/server.ts` (start/stop the ws server and the emitter)
- Modify: `tests/features/autonomous-agents/runtime.api.spec.ts`

**Interfaces:**
- Consumes: `canInstruct` (`api/src/autonomous-agents/operations.ts`), `mongo.autonomousAgentConversations`, `mongo.autonomousAgents`.
- Produces:
  - pure: `conversationChannel(conversationId: string): string`, `channelConversationId(channel: string): string | undefined`
  - stateful: `canSubscribeAutonomousAgent(channel, sessionState): Promise<boolean>`, `emitConversationEvent(conversationId, event): Promise<void>`
  - test support: `openWsClient(cookieString)` returning `{ subscribe, next, close }`

- [ ] **Step 1: Write the failing unit test**

Create `tests/features/autonomous-agents/events.unit.spec.ts`:

```ts
/**
 * stateless unit tests for the autonomous agent event channel naming
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { conversationChannel, channelConversationId } from '../../../api/src/autonomous-agent-runtime/events.ts'

test.describe('conversationChannel', () => {
  test('round-trips a conversation id', () => {
    const channel = conversationChannel('abc123')
    assert.equal(channelConversationId(channel), 'abc123')
  })

  test('is distinct from the conversation LOCK id, which is colon-separated', () => {
    // The lock id is `autonomous-agent-conversation:<id>`. Sharing a spelling between a lock
    // key and a subscribable channel is how one ends up used as the other.
    assert.equal(conversationChannel('abc123').includes(':'), false)
    assert.notEqual(conversationChannel('abc123'), 'autonomous-agent-conversation:abc123')
  })

  test('names the feature in full, so a channel list is readable', () => {
    assert.match(conversationChannel('abc123'), /autonomous-agent/)
  })

  test('rejects a channel belonging to something else', () => {
    assert.equal(channelConversationId('datasets/abc123'), undefined)
    assert.equal(channelConversationId('autonomous-agent-conversations/'), undefined)
    assert.equal(channelConversationId(''), undefined)
  })

  test('rejects a channel with extra path segments rather than guessing', () => {
    // A subscriber must not be able to widen its subscription by appending a segment.
    assert.equal(channelConversationId('autonomous-agent-conversations/abc123/messages'), undefined)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test-unit -- tests/features/autonomous-agents/events.unit.spec.ts`
Expected: FAIL — cannot resolve `api/src/autonomous-agent-runtime/events.ts`.

- [ ] **Step 3: Write the pure half plus the authorization**

Create `api/src/autonomous-agent-runtime/events.ts`. The pure functions first:

```ts
/**
 * The websocket surface of an autonomous agent conversation.
 *
 * One channel per conversation (Ruling C2-1): per-run would make a client re-subscribe every
 * turn and miss anything between them, and per-agent would broadcast one thread's content to
 * another thread's subscribers — a real disclosure, since a timeline is shared by several
 * people.
 */

const CHANNEL_PREFIX = 'autonomous-agent-conversations/'

export function conversationChannel (conversationId: string): string {
  return `${CHANNEL_PREFIX}${conversationId}`
}

/**
 * The conversation a channel names, or undefined when the channel is not ours.
 *
 * Deliberately strict: exactly one non-empty segment after the prefix. A subscriber must not
 * be able to widen or redirect a subscription by appending segments.
 */
export function channelConversationId (channel: string): string | undefined {
  if (!channel.startsWith(CHANNEL_PREFIX)) return undefined
  const rest = channel.slice(CHANNEL_PREFIX.length)
  if (!rest || rest.includes('/')) return undefined
  return rest
}
```

Then, in the same file, the stateful half:

- `canSubscribeAutonomousAgent(channel, sessionState)`: return false for a channel that is not ours; load the conversation by id; load its autonomous agent; return `canInstruct(autonomousAgent, sessionState)`. Return **false**, never throw — `ws-server` turns a false into a 403 and an exception into a 500 that tells a caller more than it should.
- `emitConversationEvent(conversationId, event)`: `await wsEmitter.emit(conversationChannel(conversationId), event)`.

Write the event type as a discriminated union on `type`, with `seq` on every variant that concerns a message:

```ts
export type AutonomousAgentConversationEvent =
  | { type: 'message', seq: number, message: AutonomousAgentMessage }
  | { type: 'message-revision', seq: number, revision: number, content: string, reasoning?: string }
  | { type: 'run', run: AutonomousAgentRun }
```

Note the comment that must accompany it: every payload reaches every authorized subscriber, so it carries only what the HTTP routes already expose to a reader of that conversation.

- [ ] **Step 4: Run to verify the unit test passes**

Run: `npm run test-unit -- tests/features/autonomous-agents/events.unit.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Start and stop the ws server**

In `api/src/server.ts`'s `start()`, after `await locks.start(mongo.db)` and **before** `server.listen(config.port)`:

```ts
  await wsEmitter.init(mongo.db)
  await wsServer.start(server, mongo.db, canSubscribeAutonomousAgent)
```

In `stop()`, beside `await locks.stop()`, add `await wsServer.stop()`.

Order matters: the emitter's collection must exist before anything emits, and the ws server must be attached before the http server accepts connections.

- [ ] **Step 6: Write the test-side websocket client**

Create `tests/support/ws.ts`. It must be small and honest about why each piece exists:

```ts
/**
 * A minimal websocket client for api tests.
 *
 * ws-server authorizes a subscription from the COOKIE on the upgrade request (it calls
 * session.req(req)), so a client has to carry the same cookie the axios clients use — hence
 * the cookieString argument rather than a user id.
 */
import WebSocket from 'ws'

export const openWsClient = async (cookieString: string) => {
  const ws = new WebSocket(`ws://localhost:${process.env.DEV_API_PORT}`, { headers: { cookie: cookieString } })
  const inbox: any[] = []
  const waiters: ((msg: any) => void)[] = []
  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString())
    const waiter = waiters.shift()
    if (waiter) waiter(msg)
    else inbox.push(msg)
  })
  await new Promise<void>((resolve, reject) => {
    ws.once('open', resolve)
    ws.once('error', reject)
  })

  /** The next message, waiting up to `timeoutMs` — so a missing event fails loudly. */
  const next = async (timeoutMs = 5000): Promise<any> => {
    if (inbox.length) return inbox.shift()
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('no websocket message within timeout')), timeoutMs)
      waiters.push(msg => { clearTimeout(timer); resolve(msg) })
    })
  }

  return {
    next,
    subscribe: async (channel: string) => {
      ws.send(JSON.stringify({ type: 'subscribe', channel }))
      return await next()
    },
    close: () => ws.close()
  }
}
```

Get the cookie string the way `tests/features/gateway/gateway.api.spec.ts` does: `await ax.cookieJar.getCookieString(directoryUrl)`.

- [ ] **Step 7: Write the api tests for authorization**

Add a `test.describe('Autonomous agent conversation events')` block to `runtime.api.spec.ts`. Use the same `createAgent`/`enrol`/`putMockSettings` helpers the model-loop block uses. **Every test must `close()` its client in a `finally` or an `afterEach`** — a leaked socket keeps the dev-api's connection open and later surfaces as an unrelated timeout.

- an admin of the owning org subscribing to its conversation's channel gets `subscribe-confirm`;
- a listed instructor gets `subscribe-confirm`, from another account too;
- **an org member who is NOT listed gets `{type: 'error', status: 403}`** — the same rule as the HTTP routes, through the same `canInstruct`;
- a channel for a conversation of another account is refused;
- a malformed channel (`autonomous-agent-conversations/x/y`) is refused;
- an anonymous client (no cookie) is refused.

Note in the spec that a superadmin in admin mode is **not** a useful test subject here: `ws-server` skips `canSubscribe` entirely for `adminMode`, so such a test would pass without exercising our rule at all.

- [ ] **Step 8: Verify and commit**

Run: `npm run lint-fix && npm run check-types && npm run test-unit && npm run test-api`

```bash
git add api/src/autonomous-agent-runtime/events.ts api/src/server.ts tests/support/ws.ts tests/features/autonomous-agents
git commit -m "feat(autonomous-agents): websocket channel per conversation, authorized by canInstruct"
```

---

### Task 2: Live events from the executor

**Files:**
- Modify: `api/src/autonomous-agent-runtime/executor.ts`
- Modify: `api/src/autonomous-agent-runtime/service.ts` (emit where documents change)
- Modify: `api/src/autonomous-agent-runtime/router.ts` (emit the user's own message)
- Modify: `tests/features/autonomous-agents/runtime.api.spec.ts`

**Interfaces:**
- Consumes: `emitConversationEvent`, `conversationChannel` (Task 1).
- Produces: no new exports — this task makes existing writes observable.

**What must be emitted, and where:** every event follows a persisted change, never precedes one, so a client that reloads from the HTTP routes always agrees with what it was told.

- `appendMessage` → `{type: 'message', seq, message}`. This covers both the user's message (posted by the router) and the assistant's `pending: true` placeholder.
- `updateMessage` on finalisation → `{type: 'message', seq, message}` again, carrying the finished document.
- Throttled during the turn → `{type: 'message-revision', seq, revision, content, reasoning?}`.
- `createRun` / `finishRun` → `{type: 'run', run}`.

- [ ] **Step 1: Write the failing test**

Add to `runtime.api.spec.ts`, in the events block:

```ts
  test('a subscriber sees the user message, the assistant turn and the run, in order', async () => {
    const agent = await createAgent()
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data
    const client = await openWsClient(await orgAdminCookie())
    try {
      const confirm = await client.subscribe(conversationChannel(conv.id))
      assert.equal(confirm.type, 'subscribe-confirm')

      await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })

      // Collect until the assistant message arrives finished. Asserting on a fixed number of
      // events would pin the throttle's timing, which is not a contract.
      const events: any[] = []
      for (let i = 0; i < 40; i++) {
        const msg = await client.next()
        if (msg.channel !== conversationChannel(conv.id)) continue
        events.push(msg.data)
        const done = msg.data.type === 'message' && msg.data.message.role === 'assistant' && msg.data.message.pending === false
        if (done) break
      }

      const user = events.find(e => e.type === 'message' && e.message.role === 'user')
      assert.ok(user, 'the poster must see their own message on the channel, like every other subscriber')
      assert.equal(user.message.content, 'hello')
      assert.equal(user.seq, user.message.seq)

      const finished = events.find(e => e.type === 'message' && e.message.role === 'assistant' && e.message.pending === false)
      assert.ok(finished)
      assert.equal(finished.message.content, 'world')
      assert.ok(finished.seq > user.seq, 'seq is monotonic, so ordering is observable')

      const run = events.filter(e => e.type === 'run').pop()
      assert.ok(run, 'the run must be observable, not only the messages')
      assert.notEqual(run.run.status, 'running')
    } finally {
      client.close()
    }
  })

  test('every message event carries the seq a client needs to detect a gap', async () => {
    // The gap detector itself is C3's; C2's contract is that the seq is always there to
    // detect one with. An event without it makes a hole indistinguishable from an ordering
    // difference, and the client silently diverges.
    const agent = await createAgent()
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data
    const client = await openWsClient(await orgAdminCookie())
    try {
      await client.subscribe(conversationChannel(conv.id))
      await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })
      for (let i = 0; i < 40; i++) {
        const msg = await client.next()
        if (msg.channel !== conversationChannel(conv.id)) continue
        if (msg.data.type === 'run') continue
        assert.equal(typeof msg.data.seq, 'number', `${msg.data.type} must carry a seq`)
        assert.ok(msg.data.seq >= 1)
        if (msg.data.type === 'message' && msg.data.message.pending === false) break
      }
    } finally {
      client.close()
    }
  })

  test('a long answer is throttled: far fewer revisions than characters', async () => {
    // Every emit is a mongo insert (ws-emitter), so per-token emission would be a write storm.
    const agent = await createAgent()
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data
    const client = await openWsClient(await orgAdminCookie())
    try {
      await client.subscribe(conversationChannel(conv.id))
      await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'long answer' })
      let revisions = 0
      let finalContent = ''
      for (let i = 0; i < 60; i++) {
        const msg = await client.next()
        if (msg.channel !== conversationChannel(conv.id)) continue
        if (msg.data.type === 'message-revision') revisions++
        if (msg.data.type === 'message' && msg.data.message.role === 'assistant' && msg.data.message.pending === false) {
          finalContent = msg.data.message.content
          break
        }
      }
      assert.ok(finalContent.length > 200, 'this test needs a long answer to be meaningful')
      assert.ok(revisions < finalContent.length / 10, `expected throttling, got ${revisions} revisions for ${finalContent.length} chars`)
    } finally {
      client.close()
    }
  })
```

This needs a `long answer` seam in `api/src/models/mock-model.ts`, beside the others and matched with `commandLine()` like the rest. It only has to RETURN a long string (say 300+ characters): the mock's streaming path already emits one `text-delta` per character every 10ms, so the seam produces ~300 deltas over ~3s with no new machinery.

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test-api -- tests/features/autonomous-agents/runtime.api.spec.ts`
Expected: FAIL — `no websocket message within timeout`, since nothing emits yet.

- [ ] **Step 3: Emit on every persisted change**

Put the emits in `service.ts` next to the writes they follow (`appendMessage`, `updateMessage`, `createRun`, `finishRun`) rather than at the call sites, so a future caller cannot add a write that is silently unobservable. Two constraints:

- `updateMessage` and `finishRun` currently take a patch and return nothing; to emit the *resulting* document they must read it back. Use `findOneAndUpdate` with `returnDocument: 'after'` rather than a second query — two round trips would let a concurrent write make the event disagree with the document.
- **An emit failure must never fail a turn.** Wrap each in `.catch(err => console.error(...))`: the persisted document is the source of truth and the HTTP routes still serve it, so a dropped event degrades liveness, not correctness.

- [ ] **Step 4: Emit throttled revisions during the turn**

In `runModelLoop`, where `content` and `reasoning` accumulate from `result.fullStream`, emit a `message-revision` at most every 250ms (~4/s), with a monotonically increasing `revision` counter. Emit a final revision only if the last one is stale — the finalising `message` event already carries the finished content, so a trailing revision is redundant.

The assistant message's id and seq are created in `runTurn`, so pass them into `runModelLoop` through its existing `ModelLoopContext` rather than re-reading the message.

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test-api -- tests/features/autonomous-agents/runtime.api.spec.ts`
Expected: PASS.

- [ ] **Step 6: Full suites and commit**

Run: `npm run lint-fix && npm run check-types && npm run test-unit && npm run test-api`

```bash
git add api/src/autonomous-agent-runtime api/src/models/mock-model.ts tests/features/autonomous-agents
git commit -m "feat(autonomous-agents): live conversation events with throttled text revisions"
```

---

### Task 3: Traces for autonomous runs

**Files:**
- Modify: `api/src/autonomous-agent-runtime/executor.ts`
- Modify: `tests/features/autonomous-agents/runtime.api.spec.ts`

**Interfaces:**
- Consumes: `recordTraceRequest` (`api/src/traces/service.ts`), `settings.storeTraces`.
- Produces: no new exports.

**Ruling C2-3 applies:** gated on `settings.storeTraces` alone, with no consent header — an autonomous conversation is already stored server-side, there is no browser to ask, and P2's scheduled runs will have no instructing user.

- [ ] **Step 1: Write the failing test**

Add to `runtime.api.spec.ts`:

```ts
  test('a turn is traced when the org stores traces, keyed to the run and the agent', async () => {
    await putMockSettings(admin, 'organization/test1', { storeTraces: true })
    const agent = await createAgent()
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    await pollRun(runId)

    const traces = (await admin.get(`/api/traces/organization/test1/${conv.id}`)).data
    assert.ok(traces.results.length >= 1, 'a traced turn must be retrievable by its conversation')
    const trace = traces.results[0]
    // 'turn' is an existing contextKind, so an autonomous run's traces are well-typed without
    // a schema change (parseContextId keys off the contextId prefix).
    assert.equal(trace.contextKind, 'turn')
    assert.match(trace.contextId, new RegExp(runId))
    // Same attribution as usage: the agent, not whoever sent the message.
    assert.equal(trace.userId, `autonomous-agent:${agent.id}`)
    assert.equal(trace.resolvedModel, 'mock-model')
  })

  test('no trace is stored when the org has not enabled it', async () => {
    await putMockSettings(admin, 'organization/test1', { storeTraces: false })
    const agent = await createAgent()
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    await pollRun(runId)

    // The three-segment route, not /traces/conversation/:id — that one 404s on an empty result
    // and so cannot express "no trace was stored".
    const traces = (await admin.get(`/api/traces/organization/test1/${conv.id}`)).data
    assert.equal(traces.results.length, 0, 'storeTraces is the only gate, and it is off')
  })

  test('a traced turn records the tool calls it made', async () => {
    await putMockSettings(admin, 'organization/test1', { storeTraces: true })
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }] })
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'call tool echo {"value":"x"}' })).data
    await pollRun(runId)

    const traces = (await admin.get(`/api/traces/organization/test1/${conv.id}`)).data
    const flat = JSON.stringify(traces.results)
    assert.match(flat, /echo/, 'the trace must show which tool the turn called')
  })
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test-api -- tests/features/autonomous-agents/runtime.api.spec.ts`
Expected: FAIL — no traces recorded.

- [ ] **Step 3: Record a trace per model call**

In `runModelLoop`, after the stream is consumed, call `recordTraceRequest` when `settings.storeTraces === true`:

- `owner`: the run's owner.
- `userId` / `userName`: the same values `usageIdentityFor` produces, so a trace and a usage record for one turn agree about who spent it.
- `conversationId`: the autonomous conversation id — this is what makes a run's traces retrievable beside its messages.
- `contextId`: `` `turn:${run.id}` ``, so `contextKind` resolves to `turn`.
- `modelRole`: `'assistant'`. `providerName`/`providerType`/`resolvedModel` come from the resolved `entry`.
- `body`: the request as sent — system prompt, history, and the tool names advertised. **Not the tool results**, which may carry MCP payloads; the trace is for diagnosing the loop, not for duplicating fetched data.
- `response`: accumulated `content`, the recorded `toolCalls`, and the finish reason.
- `usage`: turn totals accumulated in `onStepFinish` from `step.usage`, the same place spend comes from — so the trace, the usage records and the run cannot disagree.
- `prices` from `entry`, `eurosPerCredit` from config, `timing.durationMs` measured across the loop.

Do the same in `compactHistory` with `` contextId: `compaction:${run.id}` ``, so a compaction's cost is attributable rather than appearing as unexplained spend. It needs the run id, so pass it in.

**A trace failure must not fail a turn:** `recordTraceRequest` is fire-and-forget with a `.catch` that logs, exactly as the gateway treats it.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test-api -- tests/features/autonomous-agents/runtime.api.spec.ts`
Expected: PASS.

- [ ] **Step 5: Full suites and commit**

Run: `npm run lint-fix && npm run check-types && npm run test-unit && npm run test-api`

```bash
git add api/src/autonomous-agent-runtime tests/features/autonomous-agents
git commit -m "feat(autonomous-agents): trace every model call a run makes"
```

---

## Done when

- A subscriber authorized by `canInstruct` sees a conversation's user messages, the assistant's turn as it is produced, and the run's terminal state — live, with no polling.
- An unauthorized subscriber is refused 403 by the same rule that guards the HTTP routes, and a malformed or foreign channel is refused.
- Every message event carries the `seq` a client needs to detect a gap and refetch with `?sinceSeq=`.
- Text is throttled to a few revisions per second, not one event per token.
- A dropped or failed event degrades liveness only: the persisted documents and the HTTP routes remain the source of truth.
- Each model call a run makes — the turn and any compaction — is traced when the org enables it, attributed to the autonomous agent, and retrievable beside its conversation.
- `lint-fix`, `check-types`, `test-unit`, `test-api` all pass. (`test-e2e` only if a task touched `ui/` or the workspace packages, which none should.)

## Deliberately deferred

- **C3:** the UI — agent list, thread view, the client-side seq-gap detector and reconnect/resubscribe handling, and the vjsf config form.
- Carried from C1's review, unchanged by this plan: an abandoned turn keeps streaming after its run is closed (its spend is now recorded by `$inc`, so the run stays truthful); the lifecycle test block still proves itself only on refusing turns.
- Carried from B: the two environment-gap skips and their remedies; no 401-triggered NHI session refresh; rotation overlap not expressible; `expires_in` unconfirmed against a real simple-directory response.
- P1 and beyond: right-to-be-forgotten and retention control across messages, runs and traces; the write-approval gate; sub-agent delegation; scheduling; memories and skills.
