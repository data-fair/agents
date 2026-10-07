# Planned Tasks, Task Runs and the Scheduler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A configured autonomous agent carries planned tasks (a prompt plus a schedule). An in-process scheduler fires them as single-turn **task runs** (`kind: 'task'` in `runs`), unattended, under the agent's own identity. Admins can create, run now, pause, abort, list and export them.

**Architecture:**
- A task run is a run whose content (`prompt`, `parts`, `outcome`) is embedded on the run document.
- The model loop is reused unchanged through plan 2's `TurnTarget`. Plan 3 adds a `taskTarget`, and extracts `runTurn`'s lifecycle into a shared driver (`driveTurn`), so both kinds run to a terminal state the same way.
- The scheduler polls every 10 s. It claims a due task by advancing its `nextRunAt` atomically from the value it read, then fires it under a task lock. A due task whose previous run is still `running` records a `skipped` run.
- Notifications go through data-fair's events queue: a failed run, `needs-attention`, a pause.

**Tech Stack:** Node 24 / TypeScript (type-stripping), Express, MongoDB via `@data-fair/lib-node` (locks, events-queue), `croner` ^9.1.0 (new), AI SDK v6, JSON-schema types via `df-build-types`, Playwright projects `unit`/`api`/`e2e`.

**Spec:** `docs/superpowers/specs/2026-10-07-autonomous-agent-planned-execution-design.md`:
- "Data model", including the paragraph "Content stays where its size puts it; readers see one shape";
- "Scheduler and execution flow";
- the `report_outcome` row of the tools table;
- "Routes and UI": the tasks and runs routes only. The admin page is plan 5.

Additional inputs, already settled:
- plan 2's final review recommendations (memory: `planned-execution-plan3-inputs.md`, mirrored in the tasks below);
- the facts gathered for this plan: data-fair processings' scheduling schema and `toCRON`, and the events-queue call shape.

## Global Constraints

- Follow AGENTS.md:
  - never start, stop or restart dev processes;
  - `bash dev/status.sh` on a connection error;
  - **one stateful test run at a time**: never in parallel, never in the background while another is going.
  - The Bash sandbox fails here: run commands with it disabled. Run git as plain separate commands.
- Quality gates before each commit touching code: `npm run lint-fix`, `npm run check-types`. Run `npm run build-types` after any `schema.js`/`schema.json` edit.
- `operations.ts` files are pure (no `#mongo`, `#config`, in-memory state). `router.ts` files are imported only by `api/src/app.ts`.
- **Conversation behaviour does not change.** The existing suites pass unchanged. Task 4 is a refactor proven by them.
- Defaults (spec), as config `tasks`:
  - `{ minIntervalSeconds: 3600, maxPerAgent: 20, pollSeconds: 10, maxConsecutiveFailures: 5 }`;
  - a task run is bounded by the existing `turnTimeoutSeconds` and `turnCredits`.
- Names:
  - collection `autonomous-agent-tasks` (getter `mongo.autonomousAgentTasks`);
  - run `kind: 'conversation' | 'task'` (absent reads as `conversation`); triggers `schedule` and `manual`; status `skipped`;
  - lock `task:<taskId>`;
  - service tool `report_outcome` with `status: 'done' | 'nothing-to-do' | 'needs-attention'`;
  - event topics `agents:task-failed:<taskId>`, `agents:task-needs-attention:<taskId>`, `agents:task-paused:<taskId>`.
- No migration: no release has stored a task or a task run (upgrade-scripts convention).
- Comments explain *why*, in full sentences, matching the surrounding density.

## Review Focus

1. **A restart in the middle of a task run.** Expected: the run becomes `interrupted` (its tool calls may have fired) and is never re-run, and the failure counts toward the pause. The test is in Task 2 (recovery) and Task 5 (counting).
2. **Two API instances, or two passes, reaching the same due task.** Expected: exactly one task run. The test is in Task 6 (two concurrent passes).
3. **The server down for a day under an hourly task.** Expected: one catch-up run, then the normal cadence, never a backlog. The test is in Task 6.
4. **A task run reaching a tool that needs approval, or one that is denied.** Expected: the tool is not offered, and the MCP fixture records no call. The test is in Task 5.
5. **An agent disabled or deleted while tasks are due or running.** Expected:
   - disabled: no new task run fires, and a running one is aborted;
   - deleted: its tasks and all its runs, of both kinds, are erased.

   The tests are in Task 2 (delete cascade), Task 5 (disabled run-now) and Task 6 (disabled agent not fired).

---

### Task 1: Close the two races plan 2 left open

Both are pre-existing; plan 2's final review declined to judge them.

**Race 1 — stale wait.** A message posted while a turn that hands over is still finishing finds no `pendingWait` yet: the post-time `settlePendingWait` (router.ts ~452, agent-session/turn.ts ~104) settles nothing, and then `finishTurn` writes `pendingWait`. The user run starts with a wait the person already answered by writing. A later page action can wake the thread.

Fix: at the start of a `user` run, beside plan 2's re-rejection, settle any pending wait as interrupted. Under the conversation lock, the turn that handed over has closed.

**Race 2 — approved call overwritten.** The post-time `rejectPendingApprovals` also settles `approval-responded` parts as `output-error`. If an `approval` run is executing that call right now, its real result is then lost: `settleStoredToolPart` matches only `approval-responded`.

Fix: post-time rejection touches only undecided calls (`approval-requested`). The settlement of `approval-responded` parts stays in the run-start rejection, where the approval run has closed.

**Files:**
- Modify: `api/src/conversations/service.ts` (`rejectPendingApprovals` gains an option)
- Modify: `api/src/conversations/router.ts` (~454), `api/src/agent-session/turn.ts` (~106): post-time calls pass `{ undecidedOnly: true }`
- Modify: `api/src/conversations/executor.ts` (`runTurn`, beside `if (run.trigger === 'user') await rejectPendingApprovals(...)`)
- Test: `tests/features/autonomous-agents/approval-gate.api.spec.ts`, `tests/features/host-events/*.api.spec.ts` (ADD tests only)

**Interfaces:**
- Produces: `rejectPendingApprovals(conversationId, reason?, approvedError?, opts?: { undecidedOnly?: boolean }): Promise<number>`

- [ ] **Step 1: Write the failing tests**

In the approval-gate spec, in the describe that holds `messageAt` (the first one), add:

```ts
  test('a message posted while an approved call runs does not overwrite its result', async () => {
    // The approval run executes the approved slow_lookup; a message posted meanwhile must reject only calls
    // still undecided — the approved one finishes and keeps its real result.
    const agent = await createGatedAgent({ approvals: { readOnly: 'approve' } })
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { assistant } = await turn(conv.id, 'call tool slow_lookup {}')
    const approvalId = callPart(assistant, 'slow_lookup').approval.id
    const { runId: continuation } = (await decide(conv.id, approvalId, { approved: true })).data
    await new Promise(resolve => setTimeout(resolve, 500)) // slow_lookup takes 2s
    const { runId: answering } = (await orgAdmin.post(`${BASE}/${conv.id}/messages`, { content: 'hello' })).data
    await awaitRun(continuation)
    await awaitRun(answering)
    const part = callPart(await messageAt(conv.id, assistant.seq), 'slow_lookup')
    assert.equal(part.state, 'output-available', JSON.stringify(part))
    assert.deepEqual(fixture.invokedTools(), ['slow_lookup'])
  })
```

Check that `slow_lookup` is annotated `readOnlyHint: true` (tests/support/mcp-fixture.ts). If the agent schema's `approvals` rejects `readOnly: 'approve'`, use the class that `slow_lookup` falls in. `decide` is defined in that describe, and `createGatedAgent`, `turn`, `callPart`, `awaitRun` at the top.

**Note:** the posted message aborts the live approval run (the person spoke), so the approved call may end `output-error` "interrupted" through the run's own catch path. That is NOT the overwrite this task fixes. If the assertion fails that way, assert instead that the part's `errorText` is not `APPROVED_STEP_SUPERSEDED`'s text, and record the observed state in the report.

In the host-events wait api spec (the one testing "the person writes during a wait"; `grep -ln "wait for me" tests/features/host-events/*.api.spec.ts`), add a test that drives `wait for me` over the socket. It posts a prompt while the handing-over turn is still finishing, and asserts that the conversation ends with no open wait call and that a later host event wakes nothing. Use the existing tests in that file as the model for the socket helpers. The timing window is narrow: if it cannot be reproduced, keep the test as a regression guard for the start-of-run settle, and say so in the report.

- [ ] **Step 2: Run them to verify they fail (or record that the race does not reproduce)**

Run: `npx playwright test --project=api tests/features/autonomous-agents/approval-gate.api.spec.ts -g "approved call runs"` and the host-events test.

- [ ] **Step 3: Implement**

`rejectPendingApprovals`: add the `opts` parameter. With `undecidedOnly`:
- the update has no `parts.$[q]` clause and no `q` array filter;
- the initial `findOne` guard is unchanged.

Post-time callers (router.ts ~454, turn.ts ~106) pass `undefined, undefined, { undecidedOnly: true }`. Comment why: a call already approved may be executing in an `approval` run, and only the run-start rejection, under the lock, may settle it.

`runTurn`, right after the existing user-run rejection:

```ts
    // And a wait handed over by a turn that was still finishing when the message was posted: the post found
    // no `pendingWait` to settle, then that turn's close wrote one. The person answered it by writing.
    if (run.trigger === 'user') await settlePendingWait(run.conversationId, wait => interruptedWaitResult(wait.expecting))
```

Add the imports for `settlePendingWait` (`./waits.ts`) and `interruptedWaitResult` (`./interrupted-turn.ts`). `settlePendingWait` is a no-op when there is no wait.

- [ ] **Step 4: Run the tests**

Run: `npx playwright test --max-failures=0 --project=api tests/features/autonomous-agents tests/features/host-events`
Expected: PASS.

- [ ] **Step 5: Lint, types, commit**

```bash
npm run lint-fix
npm run check-types
git add api/src/conversations tests/features/autonomous-agents tests/features/host-events api/src/agent-session/turn.ts
git commit -m "fix(autonomous-agents): no stale wait, and a message never overwrites an approved call's result"
```

---

### Task 2: Task runs exist safely in the store

Before anything creates a task run, every reader and writer of `runs` must tolerate one.

**Files:**
- Modify: `api/types/conversation-run/schema.js`
- Modify: `api/src/conversations/operations.ts` (`RunStatus` gains `'skipped'`)
- Modify: `api/src/conversations/service.ts`:
  - add `createTaskRun`, `finishTaskRun`;
  - guard `incrementRunSpend`'s unbuffered path;
  - `createRun` stays conversation-only.
- Modify: `api/src/conversations/executor.ts`:
  - `liveRuns` entry `conversationId?: string, taskId?: string`;
  - `recoverOwnerlessRuns` handles `kind: 'task'` separately and never resumes it.
- Modify: `api/src/conversations/router.ts` (`runsRouter` GET and abort branch on `kind === 'task'`: account admin, no conversation)
- Modify: `api/src/autonomous-agents/service.ts` (`deleteAutonomousAgentData` deletes runs by `agentId` and tasks by `agentId`, before the early return)
- Modify: `api/src/mongo.ts` (runs indexes `{ taskId: 1, startedAt: -1 }`, `{ agentId: 1, startedAt: -1 }`)
- Modify: `api/src/app.ts`:
  - dev seam `POST /api/test-env/task-run` inserts a task run;
  - `autonomous-agent-data/:agentId` counts runs by `agentId`.
- Test: `tests/features/tasks/task-runs-store.api.spec.ts`

**Interfaces:**
- Produces:
  - `createTaskRun(run: Omit<ConversationRun, 'id' | 'version'> & { kind: 'task', taskId: string }): Promise<ConversationRun>`, an insert with no conversation version bump;
  - `finishTaskRun(run: { id: string }, patch: Partial<ConversationRun>): Promise<boolean>`, with the same "only while running" condition and buffer drain as `finishTurn`, and no conversation.
- Schema: run gains `kind` (enum `conversation`, `task`), `taskId`, `prompt` (string), `parts` (array), `outcome` (`{ status: enum done|nothing-to-do|needs-attention, summary: string }`) and `scheduledFor` (date-time). `trigger` gains `schedule` and `manual`, `status` gains `skipped`, and `conversationId` leaves `required`.

- [ ] **Step 1: Write the failing api tests**

`tests/features/tasks/task-runs-store.api.spec.ts`:

```ts
/**
 * stateful API tests: a task run (kind 'task', no conversation) is tolerated by every reader and writer of runs.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const member = await axiosAuth('test1-user1', { org: 'test1' })

const createAgent = async () => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Tasker', persona: 'x', mcpServers: [], enabled: true })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}
const insertTaskRun = async (agentId: string, over: any = {}) =>
  (await admin.post('/api/test-env/task-run', { agentId, taskId: 'task-1', status: 'running', ...over })).data

test.describe('Task runs in the store', () => {
  test.beforeEach(async () => { await clean(); await putMockSettings(admin, 'organization/test1') })

  test('an admin reads a task run; a member cannot', async () => {
    const agent = await createAgent()
    const run = await insertTaskRun(agent.id, { status: 'done', prompt: 'p', parts: [{ type: 'text', text: 'answer' }] })
    const read = (await orgAdmin.get(`/api/runs/organization/test1/${run.id}`)).data
    assert.equal(read.kind, 'task')
    assert.equal(read.taskId, 'task-1')
    await assert.rejects(member.get(`/api/runs/organization/test1/${run.id}`), { status: 403 })
  })

  test('recovery interrupts a task run nobody runs, and never resumes it', async () => {
    const agent = await createAgent()
    const run = await insertTaskRun(agent.id)
    const recovered = (await admin.post('/api/test-env/recover-ownerless-runs')).data
    assert.equal(recovered.resumed, 0)
    const read = (await orgAdmin.get(`/api/runs/organization/test1/${run.id}`)).data
    assert.equal(read.status, 'interrupted')
    assert.equal(read.error, 'interrupted by a restart')
  })

  test('a task run whose task lock is held is left alone', async () => {
    const agent = await createAgent()
    const run = await insertTaskRun(agent.id)
    await admin.post('/api/test-env/lock-task', { taskId: 'task-1' })
    try {
      await admin.post('/api/test-env/recover-ownerless-runs')
      assert.equal((await orgAdmin.get(`/api/runs/organization/test1/${run.id}`)).data.status, 'running')
    } finally {
      await admin.post('/api/test-env/unlock-task', { taskId: 'task-1' })
    }
  })

  test('deleting the agent erases its task runs', async () => {
    const agent = await createAgent()
    await insertTaskRun(agent.id, { status: 'done' })
    await admin.delete(`/api/autonomous-agents/organization/test1/${agent.id}`)
    const data = (await admin.get(`/api/test-env/autonomous-agent-data/${agent.id}`)).data
    assert.equal(data.runs, 0)
  })

  test('aborting a task run this process is not running answers as for a conversation run', async () => {
    const agent = await createAgent()
    const run = await insertTaskRun(agent.id)
    const res = await orgAdmin.post(`/api/runs/organization/test1/${run.id}/abort`)
    assert.equal(res.data.aborted, false)
  })
})
```

Check the existing abort route's response for a run this process is not running (conversations/router.ts ~57). Match its shape in the last test.

Add the seams in `api/src/app.ts`'s dev block, next to `lock-conversation`:
- `POST /api/test-env/task-run`: insert `{ id: nanoid(), kind: 'task', agentId, taskId, owner: { type: 'organization', id: 'test1' }, trigger: 'manual', status, startedAt: now, ...rest }` directly in `mongo.runs`, and return it;
- `POST /api/test-env/lock-task` / `unlock-task`: `locks.acquire('task:' + taskId, 'test')` / `locks.release(...)`.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx playwright test --project=api tests/features/tasks/task-runs-store.api.spec.ts`
Expected: FAIL. The seam 404s, recovery resumes or crashes on the missing conversation, and the run route 404s.

- [ ] **Step 3: Implement**

Schema (`api/types/conversation-run/schema.js`):
- remove `conversationId` from `required`;
- add the properties listed under Interfaces;
- update the trigger comment ("P2 adds 'schedule'") to describe both kinds.

Then run `npm run build-types`. `RunStatus` in operations.ts gains `'skipped'`; `isRunTerminal` is unchanged.

`service.ts`:

```ts
/**
 * A TASK run (kind 'task'): no conversation to bump, its content lives on the run itself. Created already
 * `running` by the scheduler or run-now, or `skipped`.
 */
export const createTaskRun = async (run: Omit<ConversationRun, 'id' | 'version'> & { kind: 'task', taskId: string }): Promise<ConversationRun> => {
  const doc: ConversationRun = { ...run, id: nanoid(), version: 1 }
  await mongo.runs.insertOne({ ...doc })
  return doc
}

/** Close a task run once, while it is still running, with its buffered spend — finishTurn minus the conversation. */
export const finishTaskRun = async (run: { id: string }, patch: Partial<ConversationRun>): Promise<boolean> => {
  const buffered = drainRunBuffer(run.id)
  const result = await mongo.runs.updateOne(
    { id: run.id, status: 'running' },
    { $set: { ...patch, ...buffered.set, endedAt: new Date().toISOString() }, ...buffered.update }
  )
  if (!result.modifiedCount && (buffered.update as any).$inc) {
    // Lost the close (an abort and the end racing): the spend is still real.
    await mongo.runs.updateOne({ id: run.id }, buffered.update)
  }
  return result.modifiedCount === 1
}
```

Mirror exactly what `finishTurn` does with `drainRunBuffer`'s `set`/`update` and its loser branch. Read it first and copy its shape, rather than trusting the sketch above. In `incrementRunSpend`'s unbuffered path, skip the conversation `$inc` when the run has no `conversationId`.

`executor.ts`:
- the `liveRuns` value type gets `conversationId?: string, taskId?: string`;
- `abortRunsOfConversation` already compares `conversationId`, and an undefined one never matches;
- `recoverOwnerlessRuns`: its candidate query becomes `{ status: 'running', kind: { $ne: 'task' } }`;
- add a second pass:

```ts
  // TASK runs: never resumed — a task run that began may have fired its tools, and one that did not is
  // simply the next slot's to run. Ownerless when nobody holds its task's lock and this process is not
  // running it. Closed `interrupted`; the scheduler counts it toward the task's pause.
  const taskCandidates = await mongo.runs.find({ status: 'running', kind: 'task' }, { projection: { _id: 0 } }).toArray()
  const heldTaskLocks = new Set((await mongo.db.collection<{ _id: string }>('locks')
    .find({ _id: { $regex: '^task:' } }, { projection: { _id: 1 } }).toArray()).map(doc => String(doc._id).slice('task:'.length)))
  for (const run of taskCandidates) {
    if (liveRuns.has(run.id) || (run.taskId && heldTaskLocks.has(run.taskId))) { skipped++; continue }
    await finishTaskRun(run, { status: 'interrupted', stopReason: 'error', error: 'interrupted by a restart' })
    interrupted++
  }
```

Declare `skipped` with `let` if it is a `const`.

`conversations/router.ts` `runsRouter`: GET and abort read the run as today. When `run.kind === 'task'`, the check is `assertAccountRole(session, owner, 'admin')` (task runs are an organization's audit record), not conversation ownership. Then, for abort, `abortRun(run.id)` as today.

`autonomous-agents/service.ts` `deleteAutonomousAgentData`: before the early return, add `await mongo.runs.deleteMany({ agentId })` and `await mongo.autonomousAgentTasks?.deleteMany({ agentId })`. Write the tasks line only once Task 3 has created the getter; in this task, add the `runs` line and a comment that Task 3 adds tasks. Return `runs` from that count. Keep `memories` first, as it is.

`app.ts` `autonomous-agent-data/:agentId`: `runs: await mongo.runs.countDocuments({ agentId })`.

`mongo.ts` runs indexes: add `'task-keys': [{ taskId: 1, startedAt: -1 }, {}]` and `'agent-keys': [{ agentId: 1, startedAt: -1 }, {}]`.

- [ ] **Step 4: Run the tests**

Run: `npx playwright test --project=unit`, then `npx playwright test --max-failures=0 --project=api tests/features/tasks tests/features/autonomous-agents`.
Expected: PASS, with the existing ones unchanged.

- [ ] **Step 5: Lint, types, commit**

```bash
npm run lint-fix
npm run check-types
git add api/types api/src tests/features/tasks
git commit -m "feat(tasks): task runs are a kind of run every reader and writer tolerates"
```

---

### Task 3: The tasks resource

**Files:**
- Create: `api/types/autonomous-agent-task/schema.js` (types), `api/doc/autonomous-agents/task-write-req/schema.js` (validator)
- Create: `api/src/tasks/operations.ts` (pure scheduling: `toCron`, `nextRunAfter`, `minGapSeconds`, `describeScheduling`), `api/src/tasks/service.ts`, `api/src/tasks/router.ts`
- Modify: `api/types/index.ts`, `api/src/mongo.ts` (getter `autonomousAgentTasks`, indexes `{ id: 1 } unique`, `{ nextRunAt: 1 }`, `{ agentId: 1 }`), `api/src/app.ts` (mount; test-env DELETE cleans tasks), `api/src/autonomous-agents/service.ts` (delete tasks by agentId)
- Modify: `api/config/type/schema.json`, `api/config/default.js`, `api/config/custom-environment-variables.js` (`tasks: { minIntervalSeconds, maxPerAgent, pollSeconds, maxConsecutiveFailures }`)
- Modify: `api/package.json` (`"croner": "^9.1.0"`). Run `npm install` from the repo root; it is a normal dependency add. Then check `docker build -t agents .` still succeeds in Task 8.
- Test: `tests/features/tasks/scheduling.unit.spec.ts`, `tests/features/tasks/tasks.api.spec.ts`

**Interfaces:**
- Types:
  - `AutonomousAgentTask`: `{ id, agentId, owner, title, prompt, scheduling: Scheduling[], enabled, pausedReason?, nextRunAt?, createdBy, updatedBy, createdAt, updatedAt }`;
  - `createdBy` and `updatedBy` are `{ userId, userName?, at, conversationId? }`.
- `Scheduling` follows processings' shape exactly: `{ type: 'monthly'|'weekly'|'daily'|'hours', month: '*', dayOfWeek, dayOfMonth, lastDayOfMonth?, hour, hourStep?, minute, timeZone }` (see the facts: monthly/weekly/daily/hours variants, `timeZone` default `Europe/Paris`).
- From `api/src/tasks/operations.ts`:
  - `toCron(rule: Scheduling): string` (processings' `toCRON`);
  - `nextRunAfter(rules: Scheduling[], after: Date): Date`, the earliest next slot strictly after `after` across rules;
  - `minGapSeconds(rules: Scheduling[], from: Date, samples = 50): number`, the smallest gap between consecutive slots of the merged rules over the next `samples` slots;
  - `describeScheduling(rules: Scheduling[], locale: 'en' | 'fr'): string`, used by self-knowledge in plan 4 and the UI in plan 5. Keep it simple: one phrase per rule, joined.
- From `api/src/tasks/service.ts`:
  - `listTasks(owner, agentId)`;
  - `getTask(owner, agentId, taskId)`;
  - `createTask(owner, agent, body, user)`;
  - `updateTask(owner, agent, taskId, body, user)`, which clears `pausedReason` and recomputes `nextRunAt` when it re-enables;
  - `deleteTask(owner, agentId, taskId)`.
  - All writes validate the caps (`maxPerAgent`, `minIntervalSeconds`) and throw `httpError(400, reason)`.
- Routes, under `/api/autonomous-agents/:type/:id/:agentId/tasks`. Mount a router at `/api/autonomous-agents` declared BEFORE the agent router's `/:type/:id/:agentId` routes, or add the routes to the agent router file and keep the logic in `tasks/service.ts`.
  - GET `/` and GET `/:taskId`: admin or instructor (`canInstruct`).
  - POST `/`, PUT `/:taskId`, DELETE `/:taskId`: admin + `reqWriteSession`.
  - `POST /:taskId/run` (run now) is added in Task 5.

- [ ] **Step 1: Write the failing unit tests**

`tests/features/tasks/scheduling.unit.spec.ts`:

```ts
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { toCron, nextRunAfter, minGapSeconds } from '../../../api/src/tasks/operations.ts'

const daily = (hour: number, minute = 0, timeZone = 'Europe/Paris') => ({ type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour, minute, timeZone }) as any
const hourly = (hourStep: number, minute = 0) => ({ type: 'hours', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: '*', hourStep, minute, timeZone: 'UTC' }) as any
const weekly = (dayOfWeek: string, hour: number) => ({ type: 'weekly', month: '*', dayOfMonth: '*', dayOfWeek, hour, minute: 0, timeZone: 'UTC' }) as any

test.describe('task scheduling', () => {
  test('rules become cron like processings', () => {
    assert.equal(toCron(daily(8, 30)), '30 8 * * *')
    assert.equal(toCron(hourly(2, 5)), '5 */2 * * *')
    assert.equal(toCron(weekly('1', 9)), '0 9 * * 1')
  })

  test('the next slot is strictly after the given time, in the rule\'s time zone', () => {
    // 07:00 UTC on a winter day is 08:00 in Paris: an 08:00 Paris rule at exactly that instant runs the next day.
    const at = new Date('2026-01-15T07:00:00.000Z')
    assert.equal(nextRunAfter([daily(8)], at).toISOString(), '2026-01-16T07:00:00.000Z')
    assert.equal(nextRunAfter([daily(8)], new Date('2026-01-15T06:59:00.000Z')).toISOString(), '2026-01-15T07:00:00.000Z')
  })

  test('several rules: the earliest wins', () => {
    const at = new Date('2026-01-15T00:00:00.000Z')
    assert.equal(nextRunAfter([weekly('1', 9), daily(3, 0, 'UTC')], at).toISOString(), '2026-01-15T03:00:00.000Z')
  })

  test('the minimum gap catches an hourly rule and two rules close together', () => {
    const from = new Date('2026-01-15T00:00:00.000Z')
    assert.equal(minGapSeconds([hourly(1)], from), 3600)
    assert.equal(minGapSeconds([daily(8, 0, 'UTC'), daily(8, 10, 'UTC')], from), 600)
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx playwright test --project=unit tests/features/tasks/scheduling.unit.spec.ts`. Expected: FAIL (module missing).

- [ ] **Step 3: Implement the pure scheduling module**

`api/src/tasks/operations.ts`:

```ts
/**
 * operations.ts contains pure stateless functions
 *
 * A planned task's schedule: data-fair processings' rule array (monthly / weekly / daily / every N hours,
 * each with its time zone), converted to cron and computed with croner exactly as processings does
 * (processings/shared/runs.ts), so an admin who schedules a processing schedules a task the same way.
 */
import { Cron } from 'croner'
import type { AutonomousAgentTask } from '#types'

export type Scheduling = AutonomousAgentTask['scheduling'][number]

export const toCron = (rule: Scheduling): string => {
  const r = rule as any
  const minute = r.minute + (r.minuteStep ? `/${r.minuteStep}` : '')
  const hour = r.hourStep ? `${r.hour === '*' ? '*' : r.hour}/${r.hourStep}` : String(r.hour)
  const dayOfMonth = r.lastDayOfMonth ? 'L' : r.dayOfMonth + (r.dayOfMonthStep ? `/${r.dayOfMonthStep}` : '')
  const month = r.month + (r.monthStep ? `/${r.monthStep}` : '')
  return `${minute} ${hour} ${dayOfMonth} ${month} ${r.dayOfWeek}`
}

/** The earliest slot strictly after `after`, across rules. */
export const nextRunAfter = (rules: Scheduling[], after: Date): Date => {
  let next: Date | null = null
  for (const rule of rules) {
    const candidate = new Cron(toCron(rule), { timezone: (rule as any).timeZone || 'Europe/Paris' }).nextRun(after)
    if (!candidate) throw new Error(`no next slot for the schedule ${JSON.stringify(rule)}`)
    if (!next || candidate < next) next = candidate
  }
  if (!next) throw new Error('a task needs at least one schedule rule')
  return next
}

/**
 * The smallest gap, in seconds, between consecutive slots of the merged rules over the next `samples` slots.
 * Checked against the deployment's minimum interval: a forgotten every-hour task is a cost, and two rules ten
 * minutes apart are the same mistake in another form.
 */
export const minGapSeconds = (rules: Scheduling[], from: Date, samples = 50): number => {
  let at = from
  let previous: Date | undefined
  let min = Infinity
  for (let i = 0; i < samples; i++) {
    const next = nextRunAfter(rules, at)
    if (previous) min = Math.min(min, (next.getTime() - previous.getTime()) / 1000)
    previous = next
    at = next
  }
  return min
}
```

Processings writes the hour field as `hour + '/' + hourStep` with `hour` being `'*'` for the hours type. Check the result against the unit test (`'5 */2 * * *'`) and simplify `toCron` to match processings exactly.

Add `describeScheduling` with a unit test of your own for one daily and one weekly rule, in en.

- [ ] **Step 4: Schemas, config, collection**

`api/types/autonomous-agent-task/schema.js`:
- the task document, as listed under Interfaces;
- `scheduling` is an array, `minItems: 1`, `maxItems: 10`;
- its items are processings' oneOf of four rule shapes, copied from the facts: `required: ['type','month','dayOfWeek','dayOfMonth','hour','minute']`, `$defs` hour/minute/timeZone;
- give `timeZone` `default: 'Europe/Paris'` and drop processings' `getItems: context.utcs` layout (plan 5 decides the UI);
- `prompt` maxLength 20000, `title` maxLength 200.

`api/doc/autonomous-agents/task-write-req/schema.js` picks `title`, `prompt`, `scheduling`, `enabled` (`additionalProperties: false`, `required: ['title','prompt','scheduling']`). Follow how `autonomous-agent-write-req/schema.js` picks from the type schema.

Run `npm run build-types`; add the exports to `api/types/index.ts`; add the mongo getter and indexes.

Config:
- `schema.json`: `tasks` object with the four integer keys, all required, minimum 1, except `minIntervalSeconds` with minimum 60;
- `default.js`: `tasks: { minIntervalSeconds: 3600, maxPerAgent: 20, pollSeconds: 10, maxConsecutiveFailures: 5 }`;
- env vars `TASKS_MIN_INTERVAL_SECONDS` etc. (json format) in `custom-environment-variables.js`.

Then `npm run build-types`.

- [ ] **Step 5: Write the failing api tests**

`tests/features/tasks/tasks.api.spec.ts`:

```ts
/**
 * stateful API tests: planned tasks, edited by admins, read by instructors.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const instructor = await axiosAuth('test1-user1', { org: 'test1' })

const daily = { type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
const createAgent = async () => (await admin.post('/api/autonomous-agents/organization/test1', {
  title: 'Tasker', persona: 'x', mcpServers: [], enabled: true,
  instructors: [{ mode: 'member', type: 'user', id: 'test1-user1' }]
})).data
const tasks = (agentId: string) => `/api/autonomous-agents/organization/test1/${agentId}/tasks`

test.describe('Planned tasks', () => {
  test.beforeEach(async () => { await clean(); await putMockSettings(admin, 'organization/test1') })

  test('an admin creates a task; its next run is planned and the creator recorded', async () => {
    const agent = await createAgent()
    const task = (await admin.post(tasks(agent.id), { title: 'Daily digest', prompt: 'summarise', scheduling: [daily] })).data
    assert.equal(task.enabled, true)
    assert.ok(new Date(task.nextRunAt) > new Date())
    assert.equal(task.createdBy.userId, 'superadmin')
    const listed = (await orgAdmin.get(tasks(agent.id))).data
    assert.deepEqual(listed.results.map((t: any) => t.id), [task.id])
  })

  test('an instructor reads tasks but cannot write them', async () => {
    const agent = await createAgent()
    await admin.post(tasks(agent.id), { title: 't', prompt: 'p', scheduling: [daily] })
    assert.equal((await instructor.get(tasks(agent.id))).data.results.length, 1)
    await assert.rejects(instructor.post(tasks(agent.id), { title: 't', prompt: 'p', scheduling: [daily] }), { status: 403 })
  })

  test('a schedule tighter than the minimum interval is refused with the reason', async () => {
    const agent = await createAgent()
    const tooOften = { ...daily, minute: 10 }
    await assert.rejects(admin.post(tasks(agent.id), { title: 't', prompt: 'p', scheduling: [daily, tooOften] }), (err: any) => {
      assert.equal(err.status, 400)
      assert.match(JSON.stringify(err.data), /interval/)
      return true
    })
  })

  test('at most maxPerAgent tasks per agent', async () => {
    const agent = await createAgent()
    for (let i = 0; i < 20; i++) await admin.post(tasks(agent.id), { title: `t${i}`, prompt: 'p', scheduling: [{ ...daily, hour: i % 24 }] })
    await assert.rejects(admin.post(tasks(agent.id), { title: 'one more', prompt: 'p', scheduling: [daily] }), { status: 400 })
  })

  test('disabling then re-enabling replans the next run; deleting the agent deletes its tasks', async () => {
    const agent = await createAgent()
    const task = (await admin.post(tasks(agent.id), { title: 't', prompt: 'p', scheduling: [daily] })).data
    const off = (await admin.put(`${tasks(agent.id)}/${task.id}`, { title: 't', prompt: 'p', scheduling: [daily], enabled: false })).data
    assert.equal(off.enabled, false)
    const on = (await admin.put(`${tasks(agent.id)}/${task.id}`, { title: 't', prompt: 'p', scheduling: [daily], enabled: true })).data
    assert.ok(on.nextRunAt)
    await admin.delete(`/api/autonomous-agents/organization/test1/${agent.id}`)
    await assert.rejects(admin.get(`${tasks(agent.id)}/${task.id}`), { status: 404 })
  })
})
```

Each task in the per-agent cap test sits on a different hour of one daily slot. If two tasks of one agent at the same time are allowed (the minimum interval is per task, per spec), that is fine. Check that `superadmin` is the user id of the `superAdmin` axios in tests/support/axios.ts.

- [ ] **Step 6: Implement service and routes**

`api/src/tasks/service.ts`:
- **Validation** of a write body:
  - `nextRunAfter` must succeed;
  - `minGapSeconds(rules, now) < config.tasks.minIntervalSeconds` gives a 400: "the schedule runs more often than the minimum interval of N minutes";
  - a create beyond `config.tasks.maxPerAgent` gives a 400.
- **nextRunAt** is computed from now on create, on an update whose schedule changed, and on re-enable (an update with `enabled: true` while `enabled` was false or `pausedReason` was set). Re-enable also `$unset`s `pausedReason`.
- **Agent:** writes require the agent to exist under the owner (404).
- **Audit:** `createdBy`/`updatedBy` are `{ userId, userName, at }`; `eventsLog.info('agents.task.create'|'update'|'delete', …)`.

Routes follow the autonomous-agents router's handler pattern (try/catch → next; `assertOrganizationOwner`; admin role; `reqWriteSession` last, writes only). Reads allow an instructor via `canInstruct(agent, session)`. List response: `{ results, count }`.

`deleteAutonomousAgentData` also deletes the agent's tasks.

- [ ] **Step 7: Run the tests**

Run: unit, then `npx playwright test --max-failures=0 --project=api tests/features/tasks tests/features/autonomous-agents`. Expected: PASS.

- [ ] **Step 8: Lint, types, commit**

```bash
npm run lint-fix
npm run check-types
git add api package.json package-lock.json tests/features/tasks
git commit -m "feat(tasks): planned tasks with processings-style schedules, edited by admins"
```

---

### Task 4: One driver runs any turn to a terminal state

A refactor with no behaviour change, the largest piece (plan 2 final review, recommendation 7). `runTurn` owns the lifecycle that every kind of run needs:
- the abort controller and `liveRuns`;
- `bufferRunWrites`;
- the deadline race;
- `performTurn`;
- the catch path, which classifies abort, timeout and a late block, and settles from live parts;
- the close;
- the finally.

It is extracted into `driveTurn(run, opener)`, generic over the target. The conversation specifics move behind the target: appending the message, the approval settlement, the notice, `finishTurn` with `pendingWait`, frames, cost, `turn-end`, `maybeReflect`, `wakeIfAnswered`, the late-block refusal parts.

**Files:**
- Modify: `api/src/conversations/turn-target.ts` (the interface grows; `conversationTarget` takes over the conversation's close and fail)
- Modify: `api/src/conversations/executor.ts` (`runTurn` becomes a thin conversation opener over `driveTurn`; `TurnHistoryRequest.run` dropped; `surface` read from the target)
- Test: none new. The proof is the unit, api and e2e suites unchanged, with counts recorded before and after.

**Interfaces:**
- `TurnTarget` gains:
  - `surface: TurnSurface`;
  - `partsSoFar(): MessagePart[] | undefined`, replacing the module-level `liveParts` lookup in the catch path (`track` stays for the attach path);
  - `close(result: TurnResult): Promise<void>`, the normal end;
  - `fail(failure: TurnFailure): Promise<void>`, where `TurnFailure = { stopReason: RunStopReason, status: 'error' | 'aborted' | 'done', error?: string, detail: string, aborted: boolean, lateBlocked: boolean, interrupt: InterruptReason }`.
- `TurnHistoryRequest` loses `run`; the target knows its own.
- `TurnResult` moves to `turn-target.ts`, exported, since targets consume it.
- Produces, in executor.ts:
  - `driveTurn(run: ConversationRun, open: () => Promise<TurnTarget>, closeBare: (patch: Partial<ConversationRun>) => Promise<unknown>): Promise<void>`;
  - `open` runs inside the try, because appending a message can fail;
  - `closeBare` closes the run when no target was ever opened;
  - `runTurn(run)` keeps its signature: it loads the conversation and calls `driveTurn` with a conversation opener.
- `performTurn` reads `surface` from `target.surface` and passes it to `buildServiceTools`.

- [ ] **Step 1: Baseline**

Record the three suites' counts:
- `npx playwright test --project=unit`
- `npx playwright test --max-failures=0 --project=api`
- `npx playwright test --max-failures=0 --project=e2e`

- [ ] **Step 2: Extract**

Move code, do not rewrite it. The split:

| Stays in `driveTurn` (generic) | Moves to `conversationTarget` |
| --- | --- |
| `liveRuns.set(run.id, { controller, agentId, conversationId: run.conversationId, taskId: run.taskId })` | `appendMessage` + the empty pending frame (in the opener, before `conversationTarget(...)` returns) |
| `bufferRunWrites(run.id)` | the `approval` run's `settleApprovedWithoutRunning` (both paths) |
| the deadline promise and `Promise.race([performTurn(run, signal, target), deadline])` | the stop notice and `finishTurn` with `pendingWait` |
| classifying the catch: `aborted`, `timedOut`, `lateBlocked`, `stopReason`, `status`, `interrupt` | the frames: message, cost, activity, turn-end; `maybeReflect`; `wakeIfAnswered` |
| `finally`: `clearTimeout`, `liveRuns.delete` | settling from `partsSoFar()` + the store fallback, the late-block refusal parts, `finishTurn` in `fail`; `releaseLiveTurn` |

The user-run rejections and wait settle from Task 1 and plan 2 stay at the top of the conversation opener, before `appendMessage`, exactly where they run today.

`MODERATION_LATE_BLOCK` stays in executor.ts and is passed through `TurnFailure.lateBlocked`.

- [ ] **Step 3: Prove nothing changed**

Re-run the three suites: the same counts, all passing. Then:

```bash
grep -n "conversationId" api/src/conversations/executor.ts
```

Every hit must be in the conversation opener, `startRun`/`nextPendingRun`, `abortRunsOfConversation`, `wakeIfAnswered`, recovery, or a log string. None may be in `driveTurn` or `runModelLoop`.

- [ ] **Step 4: Lint, types, commit**

```bash
npm run lint-fix
npm run check-types
git add api/src/conversations
git commit -m "refactor(autonomous-agents): one driver runs any turn to a terminal state"
```

---

### Task 5: Executing a task run

**Files:**
- Create: `api/src/tasks/task-target.ts` (`taskTarget(run, task)`)
- Create: `api/src/tasks/execution.ts` (`executeTaskRun(run, task)`, `startTaskRun(task, trigger, by?)`, `afterTaskRun(run, task)` = outcome, pause, notifications)
- Create: `api/src/tasks/notifications.ts` (pure `taskEvent(kind, task, run)` in `api/src/tasks/operations.ts` + a thin `pushTaskEvent` wrapper over `eventsQueue.pushEvent`, with a dev-only in-memory record exposed by a seam)
- Modify: `api/src/conversations/service-tools.ts` (`report_outcome` entry, surface `task`; `ServiceToolContext` gains `reportOutcome?: (outcome) => void`; memory author gains `taskId`), `api/src/conversations/service-tool-names.ts` (adds `report_outcome`)
- Modify: `api/types/agent-memory/schema.js` (author `taskId`) + build-types
- Modify: `api/src/conversations/approval-policy.ts` (pure `withoutGatedTools(tools, annotationsByTool, approvals)`: drops every tool whose resolved policy is not `allow`)
- Modify: `api/src/conversations/executor.ts`:
  - `performTurn`, on the task surface: `withoutGatedTools` instead of `applyApprovalPolicy`;
  - moderation only on the chat surface (stated as a surface rule, not a trigger list);
  - the empty-completion warning logs the kind and the task.
- Modify: `api/src/conversations/operations.ts` (`buildSystemPrompt(agent, memory?, surface?)`: the task note before the memory block)
- Modify: the tasks routes (`POST /:taskId/run`)
- Modify: `api/src/app.ts` (dev seam `GET /api/test-env/pushed-events`)
- Test: `tests/features/tasks/task-runs.api.spec.ts`, `tests/features/tasks/task-events.unit.spec.ts`, plus unit cases for `withoutGatedTools` and the prompt note

**Interfaces:**
- `taskTarget(run, task): TurnTarget`, with:
  - `surface: 'task'`, no session, no `historyUpToSeq`;
  - `history` = `[{ role: 'user', content: \`Planned task "${task.title}":\n\n${run.prompt}\` }]`, credits 0, hostBlockChars 0;
  - `persist(parts)` = `$set: { parts }` on the run;
  - `frames` are no-ops;
  - `settleEarlierCall` throws (unreachable: nothing in a task run asks for approval);
  - `track`/`partsSoFar` use a local holder;
  - `close(result)`: append the stop notice as the conversation does, then `finishTaskRun(run, { status: result.stopReason === 'error' ? 'error' : 'done', stopReason, parts, ...(outcome ? { outcome } : {}) })`, then `afterTaskRun`;
  - `fail(failure)`: settle the interrupted parts from `partsSoFar()`, `finishTaskRun` with the failure status, then `afterTaskRun`.
  - `result.awaitingApproval` or a `handover` cannot happen here (no gated tools, no wait). If one does, `close` records it as `error` with detail "a task run cannot wait on a person".
- `startTaskRun(task, trigger: 'schedule' | 'manual', opts: { scheduledFor?: string, by?: { userId, userName? } })`:
  1. refuse a disabled or missing agent: `undefined`, plus a reason for run-now;
  2. if a run of this task is `running`, record a `skipped` run (`createTaskRun` with status `skipped`, `endedAt` now, `error: 'the previous run of this task was still running'`) and return it;
  3. otherwise `createTaskRun` `running` with `prompt: task.prompt`;
  4. execute it under the lock `task:<taskId>`, not awaited: `locks.acquire`; if it is held, close the run `skipped` the same way; `driveTurn(run, async () => taskTarget(run, task), patch => finishTaskRun(run, patch))`; release in `finally`.
- `afterTaskRun(run, task)`:
  - `needs-attention` outcome: push `task-needs-attention`;
  - status `error`/`interrupted` (a timeout is `error`): push `task-failed`, then the pause check — the last `maxConsecutiveFailures` non-skipped task runs of the task, newest first; if there are that many and all are `error`|`interrupted`, set `pausedReason: 'paused after N consecutive failed runs'`, unset `nextRunAt` and push `task-paused`.
  - Recovery (Task 2) also calls `afterTaskRun` for runs it interrupts. Wire it there: recovery imports from `tasks/execution.ts` lazily or through a callback, to avoid an import cycle.
- `report_outcome` input: `{ status: enum done|nothing-to-do|needs-attention, summary: string (maxLength 1000) }`; returns `"Outcome recorded."`. A second call replaces the first.
- Prompt note (task surface): "This is a scheduled execution of one of your planned tasks. Nobody is present: there is no one to ask, and no action can be approved. Do what the task asks with the tools you have, then end by calling report_outcome with what you found or did."
- `POST /api/autonomous-agents/:type/:id/:agentId/tasks/:taskId/run`:
  - admin + `reqWriteSession`;
  - 409 while a run of the task is `running`;
  - 409 with the reason if the agent is disabled;
  - returns `{ runId }`.

- [ ] **Step 1: Write the failing tests**

`tests/features/tasks/task-runs.api.spec.ts`:

```ts
/**
 * stateful API tests: a task run is one unattended turn, recorded on the run.
 * Whether a tool ran is read from the MCP fixture's own record of calls.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean, axiosAuth } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const daily = { type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
const base = (agentId: string) => `/api/autonomous-agents/organization/test1/${agentId}/tasks`

const createAgent = async (over: any = {}) => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'Tasker', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true, ...over
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}
const createTask = async (agentId: string, prompt: string) =>
  (await admin.post(base(agentId), { title: 'Probe', prompt, scheduling: [daily] })).data
const runNow = async (agentId: string, taskId: string) =>
  (await admin.post(`${base(agentId)}/${taskId}/run`)).data.runId as string
const awaitRun = async (runId: string) => {
  for (let i = 0; i < 150; i++) {
    const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
    if (run.status !== 'running') return run
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('run never ended')
}
const events = async () => (await admin.get('/api/test-env/pushed-events')).data as any[]

test.describe('Task runs', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await admin.delete('/api/test-env/pushed-events')
    await putMockSettings(admin, 'organization/test1')
  })

  test('run now: one turn on the task prompt, recorded on the run, outcome reported', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id, 'call tool report_outcome {"status":"done","summary":"all good"}')
    const run = await awaitRun(await runNow(agent.id, task.id))
    assert.equal(run.kind, 'task')
    assert.equal(run.trigger, 'manual')
    assert.equal(run.status, 'done')
    assert.equal(run.prompt, task.prompt)
    assert.deepEqual(run.outcome, { status: 'done', summary: 'all good' })
    assert.ok(run.parts.some((p: any) => p.type === 'dynamic-tool' && p.toolName === 'report_outcome'))
    assert.match(run.systemPrompt, /scheduled execution/)
  })

  test('no report_outcome leaves the outcome absent, not a guessed done', async () => {
    const agent = await createAgent()
    const run = await awaitRun(await runNow(agent.id, (await createTask(agent.id, 'hello')).id))
    assert.equal(run.status, 'done')
    assert.equal(run.outcome, undefined)
  })

  test('a tool needing approval is not offered, and never runs', async () => {
    const agent = await createAgent()
    const run = await awaitRun(await runNow(agent.id, (await createTask(agent.id, 'call tool wipe_everything {}')).id))
    const part = run.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'wipe_everything')
    assert.notEqual(part?.state, 'output-available')
    assert.deepEqual(fixture.invokedTools(), [])
  })

  test('an allowed catalog tool runs', async () => {
    const agent = await createAgent()
    await awaitRun(await runNow(agent.id, (await createTask(agent.id, 'call tool echo {"value":"x"}')).id))
    assert.deepEqual(fixture.invokedTools(), ['echo'])
  })

  test('run now is refused while a run is going, and on a disabled agent', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id, 'slow hello')
    const runId = await runNow(agent.id, task.id)
    await assert.rejects(admin.post(`${base(agent.id)}/${task.id}/run`), { status: 409 })
    await awaitRun(runId)
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { title: 'Tasker', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: false })
    await assert.rejects(admin.post(`${base(agent.id)}/${task.id}/run`), { status: 409 })
  })

  test('an admin aborts a running task run', async () => {
    const agent = await createAgent()
    const runId = await runNow(agent.id, (await createTask(agent.id, 'stall')).id)
    await new Promise(resolve => setTimeout(resolve, 300))
    assert.equal((await orgAdmin.post(`/api/runs/organization/test1/${runId}/abort`)).data.aborted, true)
    const run = await awaitRun(runId)
    assert.equal(run.status, 'aborted')
  })

  test('needs-attention and failures notify; five failures in a row pause the task', async () => {
    const agent = await createAgent()
    const attention = await createTask(agent.id, 'call tool report_outcome {"status":"needs-attention","summary":"look"}')
    await awaitRun(await runNow(agent.id, attention.id))
    assert.ok((await events()).some(e => e.topic.key === `agents:task-needs-attention:${attention.id}`))

    const failing = await createTask(agent.id, 'stream error')
    for (let i = 0; i < 5; i++) await awaitRun(await runNow(agent.id, failing.id))
    const topics = (await events()).map(e => e.topic.key)
    assert.equal(topics.filter(t => t === `agents:task-failed:${failing.id}`).length, 5)
    assert.ok(topics.includes(`agents:task-paused:${failing.id}`))
    const paused = (await admin.get(`${base(agent.id)}/${failing.id}`)).data
    assert.match(paused.pausedReason, /5 consecutive failed runs/)
    assert.equal(paused.nextRunAt, undefined)
  })
})
```

- The re-enable test of the PUT above must not un-enrol the agent: re-run the enrol seam after the PUT if needed (see the memory-tool spec's "turning memory off" test).
- If `stream error` ends a run `done` rather than `error`, use another seam that makes the run fail (`empty` reports `error`: an empty completion is `stopReason: 'error'`).
- Check what `stall` + abort yields within the 300 s ceiling.

`tests/features/tasks/task-events.unit.spec.ts`: `taskEvent('failed' | 'needs-attention' | 'paused', task, run)` returns `{ title, topic: { key: 'agents:task-<kind>:<taskId>' }, sender: task.owner, visibility: 'private', resource: { type: 'autonomous-agent-task', id, title }, originator: { internalProcess: { id: 'agents-scheduler', name: 'Agents scheduler' } }, body? }`. Assert the topic keys and that a `needs-attention` body carries the outcome summary.

Unit cases:
- `withoutGatedTools` drops a destructive tool under default approvals, keeps a read-only one, and drops a `deny` one;
- `buildSystemPrompt(agent, undefined, 'task')` contains "scheduled execution" before any memory block, and `buildSystemPrompt(agent)` does not.

- [ ] **Step 2: Run them to verify they fail**

Run: unit for the new unit specs, then `npx playwright test --project=api tests/features/tasks/task-runs.api.spec.ts`. Expected: FAIL.

- [ ] **Step 3: Implement**

As specified under Interfaces. Notes:
- **Events:** `pushTaskEvent` guards `if (!config.privateEventsUrl && !config.secretKeys?.events) return` like processings. In development, also append the event to an in-memory array (capped at 200), which `GET /api/test-env/pushed-events` returns and `DELETE` clears. Comment that it lets tests see notifications without the events service's API.
- **Tool policy:** in `performTurn`, task surface: `const catalogTools = isStandardAgentId(id) ? rawTools : target.surface === 'task' ? withoutGatedTools(rawTools, annotationsByTool, agent.approvals) : applyApprovalPolicy(...)`. A standard agent has no tasks, but keep the branch order safe.
- **Moderation:** `target.surface === 'chat' && run.trigger !== 'wake' && run.trigger !== 'approval' && moderationApplies(...)`. Comment that a task's prompt is admin-authored and the turn runs as the agent's own identity, so the gate is a chat rule.
- **The `report_outcome` entry:** `applies: ctx => ctx.surface === 'task' && !!ctx.reportOutcome`; it builds an AI SDK `tool` with that input schema, calling `ctx.reportOutcome(input)`. The task target owns the holder, and `performTurn` passes `reportOutcome` when `target.reportOutcome` exists. Add an optional `reportOutcome?: (o) => void` to `TurnTarget`. Wrap it with `withProvenance(..., () => 'agent-service')` and record `serverByTool`, so the stored call names its source.
- **Memory author:** `...(run.taskId ? { taskId: run.taskId } : {})`, and `conversationId` only when present.

- [ ] **Step 4: Run the tests**

Run, one at a time:
- unit;
- `npx playwright test --max-failures=0 --project=api tests/features/tasks tests/features/autonomous-agents tests/features/memory`.

Expected: PASS.

- [ ] **Step 5: Lint, types, commit**

```bash
npm run lint-fix
npm run check-types
git add api tests/features/tasks
git commit -m "feat(tasks): a task run is one unattended turn, recorded on the run, with outcome, pause and notifications"
```

---

### Task 6: The scheduler

**Files:**
- Create: `api/src/tasks/scheduler.ts` (`runSchedulerPass(now?: Date, scope?: Record<string, unknown>): Promise<{ fired: number, skipped: number }>`)
- Modify: `api/src/server.ts` (interval every `config.tasks.pollSeconds`, cleared in `stop`; also call `eventsQueue.stop?.()` in `stop` if lib-node exposes it)
- Modify: `api/src/app.ts` (dev seam `POST /api/test-env/scheduler-pass` with `{ now?, owner? }` → `testOwnerScope`; dev seam `POST /api/test-env/task-next-run` setting a task's `nextRunAt`)
- Test: `tests/features/tasks/scheduler.api.spec.ts`

**Interfaces:**
- `runSchedulerPass`:
  1. read `{ enabled: true, pausedReason: { $exists: false }, nextRunAt: { $lte: now }, ...scope }`, at most 50, oldest `nextRunAt` first;
  2. for each, compute `next = nextRunAfter(task.scheduling, now)` and claim with `updateOne({ id, nextRunAt: <value read> }, { $set: { nextRunAt: next } })`. On `modifiedCount === 1` this pass owns the slot: `startTaskRun(task, 'schedule', { scheduledFor: <value read> })`.
  3. A disabled agent's task does not fire: its `nextRunAt` has already advanced. Count it under `skipped`, and record no run.
- Advancing from **now**, not from the slot, is the catch-up rule: one run after downtime, never a backlog.

- [ ] **Step 1: Write the failing tests**

`tests/features/tasks/scheduler.api.spec.ts`:

```ts
/**
 * stateful API tests: the scheduler claims a due task once, catches up once, skips an overlap.
 * Passes are triggered through a test seam with an injected "now"; nothing waits for a clock.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean, axiosAuth } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const hourly = { type: 'hours', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: '*', hourStep: 1, minute: 0, timeZone: 'UTC' }
const base = (agentId: string) => `/api/autonomous-agents/organization/test1/${agentId}/tasks`

const createAgent = async (enabled = true) => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Tasker', persona: 'x', mcpServers: [], enabled })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}
const dueTask = async (agentId: string, prompt = 'hello', dueAt = '2026-01-15T10:00:00.000Z') => {
  const task = (await admin.post(base(agentId), { title: 'Hourly', prompt, scheduling: [hourly] })).data
  await admin.post('/api/test-env/task-next-run', { taskId: task.id, nextRunAt: dueAt })
  return task
}
const pass = async (now: string) => (await admin.post('/api/test-env/scheduler-pass', { now })).data
const runsOf = async (agentId: string, taskId: string) =>
  (await orgAdmin.get(`/api/autonomous-agents/organization/test1/${agentId}/runs`, { params: { taskId } })).data.results
const settle = () => new Promise(resolve => setTimeout(resolve, 1500))

test.describe('The scheduler', () => {
  test.beforeEach(async () => { await clean(); await putMockSettings(admin, 'organization/test1') })

  test('a due task fires once, and its next run moves past now', async () => {
    const agent = await createAgent()
    const task = await dueTask(agent.id)
    assert.equal((await pass('2026-01-15T10:00:30.000Z')).fired, 1)
    await settle()
    const runs = await runsOf(agent.id, task.id)
    assert.equal(runs.length, 1)
    assert.equal(runs[0].trigger, 'schedule')
    assert.equal(runs[0].scheduledFor, '2026-01-15T10:00:00.000Z')
    assert.equal((await admin.get(`${base(agent.id)}/${task.id}`)).data.nextRunAt, '2026-01-15T11:00:00.000Z')
  })

  test('two passes at once fire one run', async () => {
    const agent = await createAgent()
    const task = await dueTask(agent.id)
    const [a, b] = await Promise.all([pass('2026-01-15T10:00:30.000Z'), pass('2026-01-15T10:00:30.000Z')])
    assert.equal(a.fired + b.fired, 1)
    await settle()
    assert.equal((await runsOf(agent.id, task.id)).length, 1)
  })

  test('overdue by many slots: one catch-up run, then the cadence', async () => {
    const agent = await createAgent()
    const task = await dueTask(agent.id, 'hello', '2026-01-14T10:00:00.000Z')
    assert.equal((await pass('2026-01-15T10:20:00.000Z')).fired, 1)
    assert.equal((await pass('2026-01-15T10:30:00.000Z')).fired, 0)
    await settle()
    assert.equal((await runsOf(agent.id, task.id)).length, 1)
    assert.equal((await admin.get(`${base(agent.id)}/${task.id}`)).data.nextRunAt, '2026-01-15T11:00:00.000Z')
  })

  test('a due task whose previous run still runs is recorded skipped', async () => {
    const agent = await createAgent()
    const task = await dueTask(agent.id, 'slow hello')
    await pass('2026-01-15T10:00:30.000Z')
    await admin.post('/api/test-env/task-next-run', { taskId: task.id, nextRunAt: '2026-01-15T11:00:00.000Z' })
    await pass('2026-01-15T11:00:10.000Z')
    await settle()
    const runs = await runsOf(agent.id, task.id)
    assert.deepEqual(runs.map((r: any) => r.status).sort(), ['done', 'skipped'])
  })

  test('a paused task, a disabled task and a disabled agent\'s task do not fire', async () => {
    const agent = await createAgent()
    const task = await dueTask(agent.id)
    await admin.put(`${base(agent.id)}/${task.id}`, { title: 'Hourly', prompt: 'hello', scheduling: [hourly], enabled: false })
    const off = await createAgent(false)
    await dueTask(off.id)
    assert.equal((await pass('2026-01-15T10:00:30.000Z')).fired, 0)
  })
})
```

The runs list route (`/api/autonomous-agents/:type/:id/:agentId/runs`) is built in Task 7. Order the work so that Task 6 adds a minimal version (list by agent, filter `taskId`, newest first, without content) and Task 7 completes it. Alternatively, read runs through the test-env agent-data seam extended with a list, and leave the route to Task 7. Use the first.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx playwright test --project=api tests/features/tasks/scheduler.api.spec.ts`. Expected: FAIL.

- [ ] **Step 3: Implement**

`api/src/tasks/scheduler.ts`: as specified under Interfaces, with a header comment on the claim (no lock, one winner) and on catch-up.

`api/src/server.ts`:

```ts
  // PLANNED TASKS: every pollSeconds, claim and fire the tasks that are due (api/src/tasks/scheduler.ts).
  // Every instance polls; the claim is an atomic advance of nextRunAt, so exactly one fires a slot.
  taskScheduler = setInterval(() => {
    runSchedulerPass().catch(err => console.error('task scheduler pass failed', err))
  }, config.tasks.pollSeconds * 1000)
```

Declare it with the other timers, and clear it in `stop()`.

The runs list route, minimal: `GET /api/autonomous-agents/:type/:id/:agentId/runs`, admin. Query params `taskId`, `kind`, `status`; `size` (≤ 100) and `page`; sorted `startedAt` desc; projection without `parts`, `prompt`, `systemPrompt`, `calls`. Returns `{ results, count }`.

- [ ] **Step 4: Run the tests**

Run, one at a time: unit; `npx playwright test --max-failures=0 --project=api tests/features/tasks`. Expected: PASS.

- [ ] **Step 5: Lint, types, commit**

```bash
npm run lint-fix
npm run check-types
git add api tests/features/tasks
git commit -m "feat(tasks): the scheduler claims due tasks once, catches up once, skips an overlap"
```

---

### Task 7: The run history, the export, and reflecting a task run

**Files:**
- Create: `api/src/tasks/run-messages.ts`: the read-layer function `runAsMessages(run): StoredMessageLike[]`. For a task run it returns two synthetic messages, `{ seq: 1, role: 'user', parts: [textPart(prompt)], author: { kind: 'task' } }` and `{ seq: 2, role: 'assistant', parts, runId }`. For a conversation run it is not used: conversation readers keep reading `messages`.
- Modify: the runs routes:
  - `GET /api/autonomous-agents/:type/:id/:agentId/runs` gains the `outcome` and `since` filters;
  - `GET .../runs/:runId` returns the run with content: the task run's `prompt` and `parts` (for a conversation run, its metadata plus `conversationId`);
  - `GET .../runs/:runId/export` is a task run's JSONL, built by `buildConversationExport({ conversation: { kind: 'task', id: run.id, taskId, agentId, title: <task title> }, messages: runAsMessages(run), runs: [runWithoutContent] })`, with the filename `task-run-<id>.jsonl`.
  - Admin-only: account admin, the same rule as reading task runs.
- Modify: `api/src/memory/reflection.ts`: a task run is reflected ONCE at its end (spec, "Boundary with agent memory"). Add `maybeReflectTaskRun(runId)`, which reads the run, checks the agent and `memoryEnabledFor`, and runs the same reflection pass over `transcriptForReflection(runAsMessages(run))`. The author is `{ kind: 'reflection', agentId, runId, taskId }`. The bookkeeping is `memoryReflection: { at, credits }` on the run (add it to the run schema). It is called fire-and-forget from `afterTaskRun` when the run is `done` and the agent has memory.
- Test: `tests/features/tasks/run-history.api.spec.ts`, plus a reflection case in `tests/features/memory/reflection.api.spec.ts` (ADD).

- [ ] **Step 1: Write the failing tests**

`tests/features/tasks/run-history.api.spec.ts`:
- Run a task twice (one `done` with `report_outcome needs-attention`, one plain `hello`) via run-now.
- List: assert newest first; that `?outcome=needs-attention` returns one; that list rows have no `parts`/`prompt`.
- `GET .../runs/:runId`: assert `prompt` and `parts` are present.
- `GET .../export`: parse the JSONL. Assert the `meta` line has `conversation.kind === 'task'`, that there are two `message` records (user prompt, assistant answer), and one `run` record. Assert a member gets 403.

In `tests/features/memory/reflection.api.spec.ts`, ADD: an agent with memory, a task whose prompt contains `remember: the weekly report goes to finance`, run now, then poll the `MEMORY.md` document until it contains the fact (the mock reflection seam records `remember:` lines). Assert the newest version's author is `{ kind: 'reflection', taskId, runId }`.

- [ ] **Step 2: Run them to verify they fail.** Expected: FAIL.

- [ ] **Step 3: Implement**

As specified. Reuse `buildConversationExport` unchanged. If it reads fields only a conversation has, feed the minimal record and note it. For reflection, extract the part of `reflect(conversation, agent, now)` that runs the model over a transcript, and bills and records under a given author, into a function both paths call. Keep the conversation path's behaviour and tests unchanged.

- [ ] **Step 4: Run the tests**

Run, one at a time: unit; `npx playwright test --max-failures=0 --project=api tests/features/tasks tests/features/memory tests/features/traces`. Expected: PASS.

- [ ] **Step 5: Lint, types, commit**

```bash
npm run lint-fix
npm run check-types
git add api tests/features/tasks tests/features/memory
git commit -m "feat(tasks): run history, task-run export and reflection, through one read-layer shape"
```

---

### Task 8: Documentation and the full suites

**Files:**
- Create: `docs/architecture/planned-tasks.md`
- Modify:
  - `AGENTS.md`: the architecture concern list gets `planned-tasks` in the same commit as the doc (a unit test compares the list with `docs/architecture`);
  - `docs/architecture/overview.md`: a row;
  - `docs/architecture/autonomous-agents.md`: "The turn and its target" names the task target and `driveTurn`; delete cascade;
  - `docs/architecture/agent-memory.md`: a task run is reflected once at its end;
  - the spec: Order of work item 3 done.

- [ ] **Step 1: Write `docs/architecture/planned-tasks.md`**

Write it as built, in the voice of the other files:
- tasks and their schedule (processings' rules, the minimum interval, the cap);
- task runs as a kind of run (content embedded, the read-layer shape);
- the scheduler (claim, fire, skip, catch-up, recovery);
- the turn (task target, unattended tool policy, `report_outcome`, the prompt note);
- the pause and notifications;
- routes;
- what plan 4 (self-knowledge, `plan_task`) and plan 5 (admin page) add.

Every file reference must name a real path.

- [ ] **Step 2: The full pass**

Run, one at a time:
- `npm run lint-fix`
- `npm run check-types`
- `npx playwright test --project=unit`
- `npx playwright test --max-failures=0 --project=api`
- `npx playwright test --max-failures=0 --project=e2e`
- `docker build -t agents .` (croner is new)

Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add docs/architecture AGENTS.md
git add -f docs/superpowers/specs/2026-10-07-autonomous-agent-planned-execution-design.md
git commit -m "docs(tasks): planned tasks, task runs and the scheduler, as built"
```
