# Turn Target and Service-Tool Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate the model loop from conversations behind one "turn target" interface, and gather the service's own tools (`wait_for_user_action`, `memory`) into a registry, so planned execution (plan 3) can run a turn whose record is a task run. Also fix the two approval-gate gaps parked by plan 1.

**Architecture:**
- `runModelLoop` (api/src/conversations/executor.ts) keeps producing parts exactly as today. Everything it does that is about a CONVERSATION moves behind a `TurnTarget` (api/src/conversations/turn-target.ts):
  - loading and compacting the stored history, and folding the page's context into it;
  - persisting the turn's structure mid-turn;
  - streaming frames to whoever watches;
  - settling a call an earlier turn made;
  - exposing the answer so far to a page attaching mid-turn.
- `conversationTarget(...)` is the one implementation in this plan.
- `performTurn` gets its service tools from a registry (api/src/conversations/service-tools.ts). Each entry states when it applies (chat or task surface; which agents) and builds its tools. A page tool or a sub-agent config can never displace a service tool.
- The loop's control flow, its stop rules, its billing and its frames do not change.

**Tech Stack:** Node 24 / TypeScript (type-stripping, `.ts` imports), AI SDK v6 (`ai` 6.0.277: `streamText`, `Tool`, `ModelMessage`), MongoDB via `@data-fair/lib-node`, Playwright projects `unit`, `api`, `e2e`.

**Spec:** `docs/superpowers/specs/2026-10-07-autonomous-agent-planned-execution-design.md` — "Order of work" item 2, "The cost to flag" (Scheduler and execution flow), "A registry for service-provided tools" and "Boundary with agent memory" (Self-knowledge section), and the approval-gate section's rules on a new message and a wait sharing a step.

## Global Constraints

- Follow AGENTS.md:
  - never start, stop or restart dev processes;
  - check `bash dev/status.sh` on a connection error;
  - **one stateful test run at a time**: never run api/e2e specs in parallel or in the background while another run is going.
- Quality gates before each commit that touches code: `npm run lint-fix`, then `npm run check-types`.
- Tasks 3 and 4 are a refactor with no behaviour change. **No existing test is edited.** The proof is the unit, api and e2e suites passing unchanged.
  - The one deliberate change is Task 4's displacement rule: a page tool named like ANY service tool is dropped, and no service tool is ever reserved for a sub-agent worker. Today that holds for `memory` only. Task 4 tests it.
- `api/src/**/operations.ts` files stay pure. New pure modules stay free of `#mongo`, `#config` and in-memory state.
- Names:
  - `TurnTarget` and `TurnFrames`, `conversationTarget(run, messageSeq, conversation)` (in turn-target.ts);
  - `TurnSurface = 'chat' | 'task'`, `SERVICE_TOOL_NAMES`, `buildServiceTools(ctx)`.
- Comments explain *why*, in full sentences, matching the surrounding density.

## Review Focus

1. **A turn nobody watches (posted over HTTP, resumed after a restart).** Expected: no frame is sent, the record is complete. Covered unchanged by the existing api suites (every `turn()` helper posts over HTTP). Task 3 must keep `frames` safe to call with no session.
2. **A page that attaches mid-turn.** Expected: it is shown the answer so far, and only the turn's own message. Covered unchanged by `tests/features/agent-session/*` attach tests. Task 3 moves `liveTurns`; `liveTurnOf` must keep its signature.
3. **A turn that throws or is stopped mid-stream.** Expected: settled from the in-memory parts, nothing lost. Covered unchanged by `interrupted-turn` specs. Task 3 must keep the catch path reading the same registry the loop writes.
4. **A page that registers a tool named `memory` or `wait_for_user_action`.** Expected: the service's own tool runs and is attributed to it. The test is in Task 4.
5. **A person who approves a call that the gate stopped in the same step a wait handed over.** Expected: the wait is settled, the approved call runs once, and nothing is left waiting. The test is in Task 2.

---

### Task 1: A new message rejects a pending approval even while the stopping run is finishing

The parked plan-1 gap. `rejectPendingApprovals` runs when the message is POSTED (router.ts ~454, agent-session/turn.ts ~105). If the run that asked is still finishing, its `finishTurn` writes the in-memory parts back, `approval-requested` included, and the rejection is lost. The card then reappears in a message that is no longer the last. The fix: the turn that answers a new message rejects again when it STARTS. Runs of a conversation are serialised by its lock, so by then the asking run has closed its message. Rejecting is idempotent.

**Files:**
- Modify: `api/src/conversations/executor.ts` (`runTurn`, before `appendMessage`)
- Test: `tests/features/autonomous-agents/approval-gate.api.spec.ts` (append inside the existing `describe`)

**Interfaces:**
- Consumes: `rejectPendingApprovals(conversationId, reason?, approvedError?)` from `./service.ts` (defaults to `PENDING_APPROVAL_SUPERSEDED` / `APPROVED_STEP_SUPERSEDED`).

- [ ] **Step 1: Write the failing test**

Append inside `test.describe('The approval gate', …)`, after the last test:

```ts
  test('a message posted while the asking turn is still finishing still rejects its approval', async () => {
    // Posting rejects pending approvals at once, but the turn that asked still owns its message: its own
    // last writes put `approval-requested` back. The turn answering the message rejects again when it
    // starts, under the conversation's lock, once the asking turn has closed its message.
    const agent = await createGatedAgent()
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`${BASE}/${conv.id}/messages`, { content: 'call tools slow_lookup wipe_everything' })).data
    let asking: any
    for (let i = 0; i < 100 && !asking; i++) {
      const messages = (await orgAdmin.get(`${BASE}/${conv.id}/messages`)).data.results
      const message = messages.find((m: any) => m.runId === runId)
      if (message && callPart(message, 'wipe_everything')?.state === 'approval-requested') asking = message
      else await new Promise(resolve => setTimeout(resolve, 50))
    }
    assert.ok(asking, 'the approval request is stored while the step still runs')
    assert.equal(asking.pending, true)

    const { runId: answering } = (await orgAdmin.post(`${BASE}/${conv.id}/messages`, { content: 'hello' })).data
    await awaitRun(runId)
    await awaitRun(answering)

    const part = callPart(await messageAt(conv.id, asking.seq), 'wipe_everything')
    assert.equal(part.state, 'output-denied')
    assert.equal(part.approval.reason, 'The person sent a new message instead of deciding.')
    const messages = (await orgAdmin.get(`${BASE}/${conv.id}/messages`)).data.results
    assert.ok(!messages.some((m: any) => (m.parts ?? []).some((p: any) => p.state === 'approval-requested')))
    assert.ok(!fixture.invokedTools().includes('wipe_everything'))
  })
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test --project api tests/features/autonomous-agents/approval-gate.api.spec.ts -g "still finishing still rejects"`

Expected: FAIL at `part.state` (`approval-requested`), or at the `!messages.some(...)` assertion.
- If it passes on the first try, the timing did not reproduce the race. Rerun it 5 times (`--repeat-each=5`).
- If it still always passes, report DONE_WITH_CONCERNS with that evidence rather than weakening the test. The fix in Step 3 stands on the reasoning above either way.

- [ ] **Step 3: Implement**

In `api/src/conversations/executor.ts`, `runTurn`, inside the `try`, as its FIRST statement (before `message = await appendMessage(...)`):

```ts
    // A turn answering the person's MESSAGE rejects whatever approval is still pending, again. Posting
    // already did, but the turn that asked may then still have been finishing — its own last writes put
    // `approval-requested` back, and the card reappeared in a message that is no longer the last. Here,
    // under the conversation's lock, that turn has closed its message. Idempotent: usually there is
    // nothing left to reject.
    if (run.trigger === 'user') await rejectPendingApprovals(run.conversationId)
```

Check how a user-posted run's trigger is spelled in `createRun` calls (`grep -n "trigger:" api/src/conversations/router.ts api/src/agent-session/turn.ts`). Use that value: `'user'` is expected.

- [ ] **Step 4: Run the tests**

Run: `npx playwright test --project api tests/features/autonomous-agents/approval-gate.api.spec.ts`
Expected: PASS (all, including the new one).

- [ ] **Step 5: Lint, types, commit**

```bash
npm run lint-fix && npm run check-types
git add api/src/conversations/executor.ts tests/features/autonomous-agents/approval-gate.api.spec.ts
git commit -m "fix(autonomous-agents): a message rejects a pending approval even while the asking turn finishes"
```

---

### Task 2: Deciding on an approval settles a wait handed over in the same step

The parked plan-1 gap. When the model calls `wait_for_user_action` and a gated tool in one step, the turn ends `waiting` with a call `approval-requested` beside the wait. Acting on the page rejects the approval (plan 1, M3). But DECIDING on the approval starts the continuation run while `pendingWait` stays set and the wait call has no result: the replay carries an open call, and a later action on the page wakes a conversation that has moved on. The fix: the decision that starts the continuation first settles the pending wait of that message, with a result saying the person decided instead.

**Files:**
- Modify: `api/src/conversations/approvals.ts` (`decideAndContinue`)
- Modify: `api/src/conversations/service.ts` (one constant beside `PENDING_APPROVAL_ACTED`)
- Test: `tests/features/autonomous-agents/approval-gate.api.spec.ts` (append inside the `describe`)

**Interfaces:**
- Consumes: `settlePendingWait(conversationId, answer: (wait) => string): Promise<PendingWait | undefined>` from `./waits.ts`. It claims `pendingWait` atomically, settles the wait call `output-available`, and sends the message frame and a cleared activity.
- Produces: `export const WAIT_SUPERSEDED_BY_DECISION = 'The person did not act on the page: they decided on the approval request instead.'` in `api/src/conversations/service.ts`.

- [ ] **Step 1: Write the failing test**

Append inside the `describe`:

```ts
  test('deciding on a call stopped beside a wait settles the wait, and the call runs once', async () => {
    // The wait handed the turn over and the gate stopped a call in the same step. Deciding is the person's
    // move: the wait is settled (nothing is left waiting, no later page action wakes the thread), and the
    // continuation replays a step whose every call has a result.
    const agent = await createGatedAgent()
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const socket = await openAgentSession(await orgAdmin.cookieJar.getCookieString(directoryUrl))
    socket.send({ type: 'hello', tools: [], conversationId: conv.id })
    await socket.next()
    socket.send({ type: 'prompt', content: 'wait and call wipe_everything' })
    const asked = await collectUntil(socket, fs => fs.some(f => f.type === 'turn-end'))
    assert.equal(asked.find(f => f.type === 'turn-end').stopReason, 'waiting')
    const pending = asked.filter(f => f.type === 'message' && f.role === 'assistant').at(-1)
    const approvalId = pending.parts.find((p: any) => p.toolName === 'wipe_everything').approval.id

    socket.send({ type: 'approval', approvalId, approved: true })
    const continued = await collectUntil(socket, fs => fs.some(f => f.type === 'turn-end'))
    assert.equal(continued.find(f => f.type === 'turn-end').stopReason, 'completed')

    const message = await messageAt(conv.id, pending.seq)
    const wait = message.parts.find((p: any) => p.toolName === 'wait_for_user_action')
    assert.equal(wait.state, 'output-available')
    assert.equal(wait.output, 'The person did not act on the page: they decided on the approval request instead.')
    assert.equal(callPart(message, 'wipe_everything').state, 'output-available')
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything'])

    // Nothing is left waiting: an action on the page now wakes nothing.
    socket.send({ type: 'host-events', events: [{ name: 'clicked Create', detail: 'the wizard', at: Date.now() }] })
    await new Promise(resolve => setTimeout(resolve, 1500))
    const runs = (await orgAdmin.get(`${BASE}/${conv.id}/runs`)).data.results
    assert.equal(runs.filter((r: any) => r.trigger === 'wake').length, 0)
    socket.close()
  })
```

Check the runs route's response shape (`router.get('/:type/:id/:conversationId/runs'`, router.ts ~417). Adapt `.data.results` if it returns a bare array.

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test --project api tests/features/autonomous-agents/approval-gate.api.spec.ts -g "beside a wait settles"`
Expected: FAIL, because the wait part is still `input-available` (or the continuation errors on the open call).

- [ ] **Step 3: Implement**

`api/src/conversations/service.ts`, next to `PENDING_APPROVAL_ACTED`:

```ts
/**
 * The result a pending wait is settled with when the person decided on an approval stopped in the same
 * step instead of acting on the page: the decision is their move, and the turn continues from it.
 */
export const WAIT_SUPERSEDED_BY_DECISION = 'The person did not act on the page: they decided on the approval request instead.'
```

`api/src/conversations/approvals.ts`: import `WAIT_SUPERSEDED_BY_DECISION` from `./service.ts` and `settlePendingWait` from `./waits.ts`. In `decideAndContinue`, after `watcher?.send({ type: 'activity', activity: null })` and before `createRun(...)`:

```ts
  // A WAIT HANDED OVER IN THE SAME STEP is settled by the decision, as acting on the page settles the
  // approval (executor.ts wakeIfAnswered): the person moved, and the continuation must replay a step
  // whose every call has a result. Only the wait of THIS message — a wait elsewhere is not this step's.
  if (conversation.pendingWait?.messageSeq === message.seq) {
    await settlePendingWait(conversation.id, () => WAIT_SUPERSEDED_BY_DECISION)
  }
```

`conversation` is as the caller read it. If `pendingWait` is not in what the route or socket read (check `requireConversation` / `resolveOwnConversation` projections), read it here instead:

```ts
  const waiting = await mongo.conversations.findOne({ id: conversation.id }, { projection: { _id: 0, pendingWait: 1 } })
```

That needs `import mongo from '#mongo'`. Then test `waiting?.pendingWait?.messageSeq === message.seq`.

- [ ] **Step 4: Run the tests**

Run: `npx playwright test --project api tests/features/autonomous-agents/approval-gate.api.spec.ts tests/features/host-events`
Expected: PASS.

- [ ] **Step 5: Lint, types, commit**

```bash
npm run lint-fix && npm run check-types
git add api/src/conversations/approvals.ts api/src/conversations/service.ts tests/features/autonomous-agents/approval-gate.api.spec.ts
git commit -m "fix(autonomous-agents): deciding on an approval settles a wait handed over in the same step"
```

---

### Task 3: The turn target — the model loop no longer knows it serves a conversation

A refactor with no behaviour change. `runModelLoop` today reads and writes the conversation directly:
- `loadHistory` + `compactHistory` + `withHostContext` + `pendingWaitReminder`;
- `updateMessage(run.conversationId, messageSeq, …)` (`persistStructure`);
- `watcher().send(…)` frames (`stream`, `activity`, `sendMessageFrame`, the sub-agent `onTrace`/`onPhase`, the final frame);
- `settleStoredToolPart(run.conversationId, …)` (`settleEarlierCall`);
- `liveTurns.set(run.conversationId, …)`.

All of that moves behind `TurnTarget`. `runTurn` builds a `conversationTarget` and passes it down. Nothing else in the loop changes.

**Files:**
- Create: `api/src/conversations/turn-target.ts`
- Modify: `api/src/conversations/executor.ts` (`performTurn`, `ModelLoopContext`, `runModelLoop`, `runTurn`; `liveTurns` and `liveTurnOf` move out)
- Modify: `api/src/agent-session/turn.ts` (import `liveTurnOf` from its new home)
- Test: none new. The proof is the existing suites unchanged (Global Constraints).

**Interfaces:**
- Produces, from `api/src/conversations/turn-target.ts`:
  - `interface TurnFrames { delta(kind: 'text' | 'reasoning', text: string): void; activity(value: ChatActivity | null, parentToolCallId?: string): void; message(parts: MessagePart[], pending: boolean): void; subAgent(frame: { parentToolCallId: string, name: string, parts: MessagePart[], pending: boolean }): void }`
  - `interface TurnHistoryRequest { run: ConversationRun, identity: UsageIdentity, budget: number, settings: Awaited<ReturnType<typeof getSettings>>, abortSignal: AbortSignal, agentId: string }`
  - `interface TurnTarget { session?: AgentSession; historyUpToSeq?: number; history(request: TurnHistoryRequest): Promise<{ messages: ModelMessage[], credits: number, hostBlockChars: number }>; persist(parts: MessagePart[]): Promise<void>; frames: TurnFrames; settleEarlierCall(toolCallId: string, settled: Parameters<typeof settleStoredToolPart>[2]): Promise<void>; track(parts: () => MessagePart[]): void }`
  - `conversationTarget(run: ConversationRun, messageSeq: number, conversation: Conversation): TurnTarget`
  - `liveTurnOf(conversationId: string): { messageSeq: number, parts: MessagePart[] } | undefined` (moved verbatim from executor.ts)
  - `releaseLiveTurn(conversationId: string, messageSeq: number): void` and `liveParts(conversationId: string, messageSeq: number): MessagePart[] | undefined` (for runTurn's `finally` and catch path)

- [ ] **Step 1: Baseline**

Run the suites once and record the counts in your report, so "unchanged" has a number:
- `npx playwright test --project=unit`
- `npx playwright test --max-failures=0 --project=api`
- `npx playwright test --max-failures=0 --project=e2e`

- [ ] **Step 2: Create `api/src/conversations/turn-target.ts`**

```ts
/**
 * Where a turn reads its context from and writes its record to: the seam between the model loop and a
 * conversation.
 *
 * The loop (executor.ts, runModelLoop) produces a turn's parts and nothing else. Everything that makes
 * those parts a CONVERSATION's lives here:
 *  - loading and compacting the stored history, and folding the page's context into it;
 *  - persisting the structure mid-turn;
 *  - streaming frames to whoever watches;
 *  - settling a call an earlier turn made;
 *  - exposing the answer so far to a page attaching mid-turn.
 * One implementation today. A planned task's run is the second (docs/superpowers/specs/
 * 2026-10-07-autonomous-agent-planned-execution-design.md): its record is the run itself, and nobody
 * watches it.
 */

import type { ModelMessage } from 'ai'
import type { Conversation, ConversationRun } from '#types'
import type { MessagePart } from './operations.ts'
import type { ChatActivity } from '@agents/shared/agent-activity'
import type { UsageIdentity } from '../usage/enforce.ts'
import type { getSettings } from '../settings/service.ts'
import type { AgentSession } from '../agent-session/session.ts'
import { withHostContext } from '@agents/shared/host-events'
import { loadHistory, compactHistory } from './turn-history.ts'
import { pendingWaitReminder } from './interrupted-turn.ts'
import { updateMessage, settleStoredToolPart } from './service.ts'
import { sessionFor } from '../agent-session/registry.ts'

/** What a watcher is told while a turn runs. A target nobody watches sends nothing. */
export interface TurnFrames {
  delta: (kind: 'text' | 'reasoning', text: string) => void
  activity: (value: ChatActivity | null, parentToolCallId?: string) => void
  /** This turn's message as it stands; `pending` until the turn is over. */
  message: (parts: MessagePart[], pending: boolean) => void
  subAgent: (frame: { parentToolCallId: string, name: string, parts: MessagePart[], pending: boolean }) => void
}

export interface TurnHistoryRequest {
  run: ConversationRun
  identity: UsageIdentity
  budget: number
  settings: Awaited<ReturnType<typeof getSettings>>
  abortSignal: AbortSignal
  agentId: string
}

export interface TurnTarget {
  /** The page in front of the person, as the turn started: its tools and host events. Undefined is normal. */
  session?: AgentSession
  /** The history bound recorded on the turn's telemetry; a conversation's is the turn's own message. */
  historyUpToSeq?: number
  /** The model's context for this turn, within budget, as it is sent. */
  history: (request: TurnHistoryRequest) => Promise<{ messages: ModelMessage[], credits: number, hostBlockChars: number }>
  /** Persist the turn's structure as it stands: called when a call opens or settles. */
  persist: (parts: MessagePart[]) => Promise<void>
  frames: TurnFrames
  /** A result for a call an EARLIER turn made: an approved call the SDK executed on replay. */
  settleEarlierCall: (toolCallId: string, settled: Parameters<typeof settleStoredToolPart>[2]) => Promise<void>
  /** Expose the parts being produced to a reader attaching mid-turn (and to the turn's own catch path). */
  track: (parts: () => MessagePart[]) => void
}
```

Then MOVE `liveTurns`, its doc comment and `liveTurnOf` from executor.ts to this file verbatim, and add:

```ts
/** The parts a live turn of this conversation produced so far, when it is THIS message's turn. */
export const liveParts = (conversationId: string, messageSeq: number): MessagePart[] | undefined => {
  const live = liveTurns.get(conversationId)
  return live && live.messageSeq === messageSeq ? structuredClone(live.parts()) : undefined
}

/** Forget a turn once it is settled. Keyed by its message, so a later turn already registered is left alone. */
export const releaseLiveTurn = (conversationId: string, messageSeq: number) => {
  if (liveTurns.get(conversationId)?.messageSeq === messageSeq) liveTurns.delete(conversationId)
}
```

Then the implementation:

```ts
/**
 * A conversation's turn: history from its messages, the record on its assistant message (`messageSeq`,
 * created empty and pending by runTurn), frames to whoever watches it NOW.
 */
export const conversationTarget = (run: ConversationRun, messageSeq: number, conversation: Conversation): TurnTarget => {
  // WHO SEES THIS TURN: whoever watches the conversation now, read at each send. The session the turn
  // started with is still what its page tools and host events belong to; but a reload or a second tab
  // replaces it mid-turn, and a turn sending to the session it began with went silent for the page
  // actually open — not even its `turn-end` arrived.
  const watcher = () => sessionFor(run.conversationId)
  const session = sessionFor(run.conversationId)
  return {
    session,
    historyUpToSeq: messageSeq,
    history: async ({ run, identity, budget, settings, abortSignal, agentId }) => {
      // MOVED VERBATIM from runModelLoop: the compactHistory(...) call over
      // loadHistory(run.conversationId, messageSeq, conversation), then pendingWaitReminder, then
      // the withHostContext folding into `history` with its long comment — returning
      // { messages: history, credits: compacted.credits, hostBlockChars: hostBlocks.chars }.
    },
    persist: async (parts) => { await updateMessage(run.conversationId, messageSeq, { parts, pending: true }) },
    frames: {
      delta: (kind, text) => { watcher()?.send({ type: 'delta', kind, text }) },
      activity: (value, parentToolCallId) => {
        watcher()?.send({ type: 'activity', activity: value, ...(parentToolCallId ? { parentToolCallId } : {}) })
      },
      message: (parts, pending) => { watcher()?.send({ type: 'message', seq: messageSeq, role: 'assistant', parts, pending }) },
      subAgent: (frame) => { watcher()?.send({ type: 'subagent', ...frame }) }
    },
    settleEarlierCall: async (toolCallId, settled) => {
      const message = await settleStoredToolPart(run.conversationId, toolCallId, settled)
      if (message) watcher()?.send({ type: 'message', seq: message.seq, role: 'assistant', parts: message.parts as MessagePart[], pending: false })
    },
    track: (parts) => { liveTurns.set(run.conversationId, { messageSeq, parts }) }
  }
}
```

The `history` body is the code at executor.ts ~399-429, moved as-is with its comments. Replace `session` with the local `session`, and `messageSeq`/`conversation` with the closure's. Check the `activity` frame shape against `shared/agent-session-protocol.ts` (~144): the sub-agent `onPhase` sends `parentToolCallId` beside `activity` today, and the plain activity sends none. Keep both exactly as they are.

- [ ] **Step 3: Rewire `runModelLoop`**

In `api/src/conversations/executor.ts`:

1. `ModelLoopContext`:
   - remove `messageSeq`, `session` and `conversation`;
   - add `target: TurnTarget`;
   - keep everything else.
2. At the top of `runModelLoop`:
   - destructure `target` instead of them;
   - delete `const watcher = …`;
   - add `const session = target.session`, so the page-tool code below (pageToolNames, startingPageTools, `browserToolSet(session)`) reads unchanged.
3. Replace the history block (from `const compacted = await compactHistory(` to the end of the `const history = …` statement) with:

   ```ts
   const { messages: history, credits: compactionCredits, hostBlockChars } = await target.history({ run, identity, budget, settings, abortSignal, agentId: autonomousAgent.id })
   ```

   Then:
   - set `let credits = compactionCredits`;
   - replace `hostBlocks.chars` in `recordCall` with `hostBlockChars`;
   - replace `historyUpToSeq: messageSeq` with `...(target.historyUpToSeq !== undefined ? { historyUpToSeq: target.historyUpToSeq } : {})`.
4. Frames:
   - `stream` becomes `target.frames.delta(kind, delta)`;
   - `activity(value)` becomes `target.frames.activity(value)`;
   - in `buildDelegation`, `onTrace`'s send becomes `target.frames.subAgent({ parentToolCallId: trace.parentToolCallId, name: trace.name, parts: trace.parts as MessagePart[], pending: trace.pending })`;
   - `onPhase`'s send becomes `target.frames.activity(phase ? { kind: 'subagent', name, phase } : null, parentToolCallId)`;
   - `sendMessageFrame(pending)` becomes `target.frames.message(parts, pending)`;
   - the final `watcher()?.send({ type: 'message', … finalParts, pending: awaitingApproval })` becomes `target.frames.message(finalParts, awaitingApproval)`.
5. `persistStructure` becomes `await target.persist(parts)` everywhere (delete the helper, or make it a one-line wrapper).
6. `settleEarlierCall` becomes `target.settleEarlierCall` (delete the local helper).
7. `liveTurns.set(run.conversationId, …)` becomes `target.track(() => parts)`.
8. Remove the now-unused imports (`loadHistory`, `compactHistory`, `withHostContext`, `pendingWaitReminder`, `updateMessage` if unused, …). Let `check-types` and lint guide you.

In `performTurn`:
- its parameters become `(run, abortSignal, target: TurnTarget)`, and the agent is resolved as today;
- `const session = sessionFor(run.conversationId)` becomes `const session = target.session`;
- pass `target` instead of `messageSeq`/`session`/`conversation` to `runModelLoop`.

In `runTurn`:
- build the target right after `appendMessage`: `const target = conversationTarget(run, message.seq, conversation)`. Pass it to `performTurn(run, abortController.signal, target)`.
- In the catch path, replace the `liveTurns` read (`const live = liveTurns.get(…)` … `live.parts()`) with `liveParts(run.conversationId, message.seq)`, keeping the store fallback:

  ```ts
  const live = liveParts(run.conversationId, message.seq)
  const persisted = live ? { parts: live } : await mongo.messages.findOne(…).catch(() => null)
  ```

- In the `finally`, replace the `liveTurns.delete` line with `if (message) releaseLiveTurn(run.conversationId, message.seq)`.

`api/src/agent-session/turn.ts`: import `liveTurnOf` from `'../conversations/turn-target.ts'`, and keep `startRun` from executor.ts.

- [ ] **Step 4: Prove nothing changed**

Run the three suites again, one at a time, with the same commands as Step 1. Expected: the same counts, all passing.

Also check the loop's independence:

```bash
grep -n "conversationId\|sessionFor\|updateMessage\|settleStoredToolPart\|liveTurns" api/src/conversations/executor.ts
```

Between `const runModelLoop` and the end of that function, expect only `run.conversationId` in debug/log strings (the empty-completion warning). Any other hit is a leak of the conversation into the loop.

- [ ] **Step 5: Lint, types, commit**

```bash
npm run lint-fix && npm run check-types
git add api/src/conversations/turn-target.ts api/src/conversations/executor.ts api/src/agent-session/turn.ts
git commit -m "refactor(autonomous-agents): the model loop reads and writes through a turn target"
```

---

### Task 4: The service-tool registry

`wait_for_user_action` and `memory` are wired into `performTurn` by hand. Each has its own condition: someone watching, or memory enabled. Each has its own provenance and annotations, and a special case in the page-tool overlay and in the sub-agent partition. They become two entries of one registry. An entry states:
- the surface it applies to (`chat` today; `task` from plan 3);
- whether the agent qualifies;
- how it builds its tools.

The displacement rules apply to every service tool name.

**Files:**
- Create: `api/src/conversations/service-tool-names.ts` (pure: the reserved names)
- Create: `api/src/conversations/service-tools.ts` (the registry)
- Modify: `api/src/conversations/executor.ts` (`performTurn` builds service tools from the registry; `runModelLoop`'s overlay guard uses the names)
- Modify: `api/src/agent-session/sub-agents.ts` (never reserve a service tool)
- Test: `tests/features/conversations/service-tools.unit.spec.ts`; `tests/features/agent-session/sub-agents.unit.spec.ts` (ADD a test — do not edit existing ones); `tests/features/memory/memory-tool.api.spec.ts` (ADD a test)

**Interfaces:**
- Produces, from `service-tool-names.ts`: `export const SERVICE_TOOL_NAMES: ReadonlySet<string>`, the names `wait_for_user_action` and `memory`.
- Produces, from `service-tools.ts`:
  - `type TurnSurface = 'chat' | 'task'`
  - `interface ServiceToolContext { agent: AutonomousAgent, run: ConversationRun, surface: TurnSurface, session?: AgentSession }`
  - `interface BuiltServiceTools { tools: Record<string, Tool>, serverByTool: Map<string, string>, annotationsByTool: Map<string, Record<string, unknown>>, memory?: MemoryDocument[] }`
  - `buildServiceTools(ctx: ServiceToolContext): Promise<BuiltServiceTools>`

- [ ] **Step 1: Write the failing unit tests**

`tests/features/conversations/service-tools.unit.spec.ts`:

```ts
/**
 * stateless unit tests: the service's own tool names, which no page tool or sub-agent config may take.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { SERVICE_TOOL_NAMES } from '../../../api/src/conversations/service-tool-names.ts'

test.describe('service tool names', () => {
  test('the wait and the memory tool are the service\'s own', () => {
    assert.deepEqual([...SERVICE_TOOL_NAMES].sort(), ['memory', 'wait_for_user_action'])
  })
})
```

In `tests/features/agent-session/sub-agents.unit.spec.ts`, ADD after `the agent memory tool is never reserved for a worker`:

```ts
  test('no service tool is ever reserved for a worker, the wait included', async () => {
    const { built, build } = recordingBuilder()
    const tools = {
      query_data: fake('rows'),
      wait_for_user_action: fake('wait'),
      [`${SUBAGENT_PREFIX}analyst`]: subAgentTool({ prompt: 'p', tools: ['query_data', 'wait_for_user_action'] })
    }
    const { mainTools, reserved } = await partitionSubAgents(tools, build)
    assert.deepEqual(built[0].tools, ['query_data'])
    assert.deepEqual(reserved, ['query_data'])
    assert.ok('wait_for_user_action' in mainTools, 'the lead keeps it')
  })
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx playwright test --project unit tests/features/conversations/service-tools.unit.spec.ts tests/features/agent-session/sub-agents.unit.spec.ts`
Expected: FAIL, because the module does not exist and the wait is reserved.

- [ ] **Step 3: Implement the names and the sub-agent rule**

`api/src/conversations/service-tool-names.ts`:

```ts
/**
 * The names of the service's own tools (./service-tools.ts). Pure, so the sub-agent partition and the
 * page-tool overlay can import it without the registry's stateful builders.
 *
 * Reserved: a page registering a tool by one of these names, or a sub-agent config naming one, must not
 * displace the service's tool — the person would be answered by the page's, under the service's name.
 */
import { WAIT_TOOL_NAME } from '@agents/shared/host-events'
import { MEMORY_TOOL_NAME } from '../memory/operations.ts'

export const SERVICE_TOOL_NAMES: ReadonlySet<string> = new Set([WAIT_TOOL_NAME, MEMORY_TOOL_NAME])
```

`api/src/agent-session/sub-agents.ts`:
- replace the `MEMORY_TOOL_NAME` import with `SERVICE_TOOL_NAMES` from `'../conversations/service-tool-names.ts'`;
- replace `reservedName !== MEMORY_TOOL_NAME` with `!SERVICE_TOOL_NAMES.has(reservedName)`;
- reword its comment: "The service's own tools are never reserved either: a page config must not hand them to a worker (or hide them from the lead)."

Run Step 2's command. Expected: PASS.

- [ ] **Step 4: Write the failing api test (a page tool cannot displace a service tool)**

Append to `tests/features/memory/memory-tool.api.spec.ts`, inside its `describe`. Copy the imports `openAgentSession` from `'../../support/ws.ts'` and `directoryUrl` from `'../../support/axios.ts'` if they are not there yet.

```ts
  test('a page tool named `memory` does not displace the agent\'s memory tool', async () => {
    const agent = await createAgent({ enabled: true })
    const conversationId = await thread(agent.id)
    const socket = await openAgentSession(await orgAdmin.cookieJar.getCookieString(directoryUrl))
    // The page claims a tool by the service's name. Were it offered, the call would go to the page,
    // which never answers here — the turn would hang until its ceiling.
    socket.send({ type: 'hello', conversationId, tools: [{ name: 'memory', description: 'page memory', inputSchema: { type: 'object', properties: {} } }] })
    await socket.next()
    socket.send({ type: 'prompt', content: call({ command: 'view' }) })
    const frames: any[] = []
    while (!frames.some(f => f.type === 'turn-end')) frames.push(await socket.next())
    const message = frames.filter(f => f.type === 'message' && f.role === 'assistant').at(-1)
    const part = message.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'memory')
    assert.equal(part.state, 'output-available')
    assert.equal(part.toolMetadata.serverId, 'agent-memory')
    assert.match(part.output, /Your memory is empty/)
    socket.close()
  })
```

Check how other api specs read frames until `turn-end` (`grep -rn "socket.next()" tests/features | head`) and the `hello` tool descriptor shape (`shared/agent-session-protocol.ts`). Adapt the loop and descriptor to match.

- [ ] **Step 5: Implement the registry**

`api/src/conversations/service-tools.ts`:

```ts
/**
 * The service's own tools: what the loop offers beside the catalog's and the page's.
 *
 * One registry instead of a hand-wired branch per tool in performTurn. Each entry states:
 *  - when it applies — the SURFACE (a chat, or a planned task's run, which nobody watches) and the agent;
 *  - how it builds its tools for this turn.
 * Provenance and annotations come from the entry, so a stored call names its source like a catalog call
 * does. Service tools are outside the approval gate (approval-policy.ts covers catalog tools), and no
 * page tool or sub-agent config can displace them (./service-tool-names.ts).
 */
import type { Tool } from 'ai'
import type { AutonomousAgent, ConversationRun } from '#types'
import type { AgentSession } from '../agent-session/session.ts'
import { createWaitTool } from '@agents/shared/host-events'
import { withProvenance } from './operations.ts'
import { agentStoreId, memoryEnabledFor, MEMORY_TOOL_NAME, MEMORY_SERVER_ID, MEMORY_TOOL_ANNOTATIONS, type MemoryDocument } from '../memory/operations.ts'
import { loadMemory } from '../memory/service.ts'
import { createMemoryTool } from '../memory/tool.ts'
import { WAIT_TOOL_NAME } from '@agents/shared/host-events'

export type TurnSurface = 'chat' | 'task'

export interface ServiceToolContext {
  agent: AutonomousAgent
  run: ConversationRun
  surface: TurnSurface
  /** The page in front of the person, when one is watching. */
  session?: AgentSession
}

export interface BuiltServiceTools {
  tools: Record<string, Tool>
  serverByTool: Map<string, string>
  annotationsByTool: Map<string, Record<string, unknown>>
  /** The agent's memory as of run start, when the memory entry applied: rendered into the system prompt. */
  memory?: MemoryDocument[]
}

interface ServiceToolEntry {
  name: string
  applies: (ctx: ServiceToolContext) => boolean
  build: (ctx: ServiceToolContext, into: BuiltServiceTools) => Promise<void>
}

const ENTRIES: ServiceToolEntry[] = [
  {
    // `wait_for_user_action`: only when someone is actually there to act. Calling it ends the turn (see
    // `handover` in runModelLoop and ./waits.ts). Unwrapped, as before: its result is the loop's own
    // handover marker, not data from a server.
    name: WAIT_TOOL_NAME,
    applies: ctx => ctx.surface === 'chat' && !!ctx.session,
    build: async (_ctx, into) => { into.tools[WAIT_TOOL_NAME] = createWaitTool() }
  },
  {
    // THE AGENT'S MEMORY (docs/architecture/agent-memory.md). Read ONCE, here: the block rendered from it
    // is part of the system prompt, the run's stable prefix — writes made during the turn appear from the
    // next run. On every surface: it does not need anyone watching.
    name: MEMORY_TOOL_NAME,
    applies: ctx => memoryEnabledFor(ctx.agent),
    build: async ({ agent, run }, into) => {
      const storeId = agentStoreId(agent.id)
      into.memory = await loadMemory(storeId)
      Object.assign(into.tools, withProvenance({
        [MEMORY_TOOL_NAME]: createMemoryTool({
          storeId,
          owner: run.owner,
          allowDelete: true,
          author: toolCallId => ({ kind: 'agent', agentId: agent.id, runId: run.id, conversationId: run.conversationId, ...(toolCallId ? { toolCallId } : {}) })
        })
      }, () => MEMORY_SERVER_ID))
      into.serverByTool.set(MEMORY_TOOL_NAME, MEMORY_SERVER_ID)
      into.annotationsByTool.set(MEMORY_TOOL_NAME, MEMORY_TOOL_ANNOTATIONS)
    }
  }
]

export const buildServiceTools = async (ctx: ServiceToolContext): Promise<BuiltServiceTools> => {
  const built: BuiltServiceTools = { tools: {}, serverByTool: new Map(), annotationsByTool: new Map() }
  for (const entry of ENTRIES) if (entry.applies(ctx)) await entry.build(ctx, built)
  return built
}
```

Merge the two `@agents/shared/host-events` imports into one. The memory entry's body moves from `performTurn` as it is.

- [ ] **Step 6: Use it in `performTurn` and the overlay**

In `performTurn` (executor.ts):
- remove the `...(session ? { [WAIT_TOOL_NAME]: createWaitTool() } : {})` line from the `tools` literal;
- remove the whole `let memory … if (memoryEnabledFor(autonomousAgent)) { … }` block;
- after the `tools` literal, add:

```ts
  // The service's own tools, from the registry (./service-tools.ts): spread LAST, so a catalog tool that
  // happens to share a name cannot stand in for one, and recorded like a catalog call's source.
  const service = await buildServiceTools({ agent: autonomousAgent, run, surface: 'chat', session })
  Object.assign(tools, service.tools)
  for (const [name, server] of service.serverByTool) serverByTool.set(name, server)
  for (const [name, annotations] of service.annotationsByTool) annotationsByTool.set(name, annotations)
  const memory = service.memory
```

`surface: 'chat'`: every run this plan executes is a conversation's. Plan 3 passes `'task'`.

In `runModelLoop`, the page overlay: replace `const mayBePageTool = (name: string) => !(memory && name === MEMORY_TOOL_NAME)` with:

```ts
  // The service's own tools are never page tools, even when a page registers one by that name
  // (./service-tool-names.ts): the page's would answer under the service's name.
  const mayBePageTool = (name: string) => !SERVICE_TOOL_NAMES.has(name)
```

Remove the imports that are now unused: `createWaitTool`, `loadMemory`, `createMemoryTool`, `agentStoreId`, `memoryEnabledFor`, `MEMORY_SERVER_ID`, `MEMORY_TOOL_ANNOTATIONS`, and `MEMORY_TOOL_NAME` if unused. Keep `WAIT_TOOL_NAME`: the loop's handover logic uses it.

**Behaviour check:** before, a page tool named `memory` was dropped only when memory was on. Now a page tool named `memory` or `wait_for_user_action` is always dropped. That is the plan's one deliberate change, and it is tested.

- [ ] **Step 7: Run the tests**

Run, one at a time:
- `npx playwright test --project unit`
- `npx playwright test --max-failures=0 --project api tests/features/memory tests/features/autonomous-agents tests/features/host-events tests/features/agent-session`
- `npx playwright test --max-failures=0 --project e2e tests/features/host-events tests/features/autonomous-agents`

Expected: PASS. Use the directories that exist under `tests/features` and name them in the report.

- [ ] **Step 8: Lint, types, commit**

```bash
npm run lint-fix && npm run check-types
git add api/src/conversations/service-tool-names.ts api/src/conversations/service-tools.ts api/src/conversations/executor.ts api/src/agent-session/sub-agents.ts tests/features/conversations/service-tools.unit.spec.ts tests/features/agent-session/sub-agents.unit.spec.ts tests/features/memory/memory-tool.api.spec.ts
git commit -m "refactor(autonomous-agents): the service's own tools come from one registry"
```

---

### Task 5: Documentation and the full suites

**Files:**
- Modify: `docs/architecture/autonomous-agents.md` (or the executor's architecture doc — `grep -ln "runModelLoop\|performTurn" docs/architecture/*.md` names it)
- Modify: `docs/architecture/agent-memory.md` (the memory tool is a registry entry)
- Modify: `docs/superpowers/specs/2026-10-07-autonomous-agent-planned-execution-design.md` (status line, order-of-work item 2)

- [ ] **Step 1: The architecture section**

In the doc that describes the executor, add a section `## The turn and its target`. Cover:
- the loop produces parts and knows nothing of conversations;
- the `TurnTarget` members and what the conversation implementation does for each (history with compaction and page context, persist on each call, frames to whoever watches now, settling an earlier turn's approved call, the live answer for a page attaching mid-turn);
- that plan 3 adds a task-run target.

Then a section `## The service's own tools`. Cover:
- the registry (`service-tools.ts`) and its two entries with their conditions (wait: chat with someone watching; memory: a configured agent with memory on, on every surface);
- that service tools are outside the approval gate;
- that no page tool or sub-agent config can displace one (`service-tool-names.ts`).

Mention the two approval fixes in the approval-gate section:
- a turn answering a message rejects pending approvals again when it starts;
- a decision settles a wait handed over in the same step, with `WAIT_SUPERSEDED_BY_DECISION`.

`docs/architecture/agent-memory.md`: where it says the executor wires the memory tool, say it is the registry's memory entry.

- [ ] **Step 2: The spec**

In the planned-execution spec, under "Order of work" item 2, append: ` — done (2026-10): turn-target.ts and service-tools.ts.` Add a line to the approval-gate section's bullets:

`- deciding on a call the gate stopped in the same step a wait handed over settles that wait ("The person did not act on the page: they decided on the approval request instead."), and a turn answering a new message rejects pending approvals again when it starts, so a rejection cannot be lost to the asking turn's last writes.`

- [ ] **Step 3: The full suites**

Run, one at a time:
- `npm run lint-fix`
- `npm run check-types`
- `npx playwright test --project=unit`
- `npx playwright test --max-failures=0 --project=api`
- `npx playwright test --max-failures=0 --project=e2e`

Expected: all pass. Compare the counts with Task 3's baseline: the difference must be exactly the tests this plan added.

- [ ] **Step 4: Commit**

```bash
git add docs/architecture
git add -f docs/superpowers/specs/2026-10-07-autonomous-agent-planned-execution-design.md
git commit -m "docs(autonomous-agents): the turn target and the service-tool registry"
```
