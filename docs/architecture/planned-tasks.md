# Planned tasks

A **planned task** is a prompt an organization's admin attaches to a configured [autonomous agent](./autonomous-agents.md) together with a schedule (plan 4 adds the agent planning one itself, through the approval gate). When a slot comes due the service runs ONE unattended turn of that agent on the prompt, records it as a **task run**, and tells an admin when it failed or needs attention. Design: `docs/superpowers/specs/2026-10-07-autonomous-agent-planned-execution-design.md`.

Code: `api/src/tasks/` (`operations.ts` pure rules, `service.ts` task CRUD, `execution.ts` starting and following up a run, `scheduler.ts` the polling pass, `task-target.ts` the turn target, `notifications.ts`, `run-messages.ts`, `router.ts`), with the turn itself in `api/src/conversations/executor.ts` (`driveTurn`).

## Tasks and their schedule

| Collection | Holds |
| --- | --- |
| `autonomous-agent-tasks` | one task: `agentId`, `owner`, `title`, `prompt`, `scheduling`, `enabled`, `nextRunAt`, `pausedReason`, `resumedAt`, `createdBy`/`updatedBy` (who, when, and from which conversation) |

Schema: `api/types/autonomous-agent-task/schema.js`; the write body is `task-write-req`.

The schedule is data-fair processings' own rule array: each rule is monthly, weekly, daily or "every N hours", with its time zone (default `Europe/Paris`). `toCron` converts a rule to a cron expression and `nextRunAfter` (`api/src/tasks/operations.ts`) takes the earliest next slot across rules with `croner`, as processings does, so scheduling a task is scheduling a processing. `describeScheduling` renders it in `en` or `fr`.

Caps, enforced on every write that sets a schedule (`assertSchedule` in `api/src/tasks/service.ts`), all from `config.tasks`:

- `minIntervalSeconds` (default 3600): `minGapSeconds` samples the next 50 slots of the MERGED rules, so two rules ten minutes apart count as the same mistake as an every-ten-minutes rule. A schedule with no next slot is rejected too.
- `maxPerAgent` (default 20): checked on create, not atomically.
- `pollSeconds` (default 10) and `maxConsecutiveFailures` (default 5) are read by the scheduler and the pause.

The schedule is validated only when it is being set (task created, schedule changed, or task re-enabled): raising the minimum interval does not block editing the prompt of an existing task, and a title-only update keeps `nextRunAt`. The comparison (`scheduleKey`) is insensitive to key order.

A disabled task has no `nextRunAt` (the scheduler's poll is on it). A PUT with `enabled: true` on a **paused** task resumes it: `pausedReason` is cleared and `resumedAt` stamped. That is deliberate: the full form is how an admin acts on a paused task.

## Task runs are a kind of run

A task run is a document of the `runs` collection with `kind: 'task'` (absent means `conversation`; `api/types/conversation-run/schema.js`). It has no conversation, so its content lives on the run itself: `prompt`, `parts` (the AI SDK parts, as a conversation's assistant message) and `outcome`, plus `taskId`, `trigger` (`schedule` or `manual`), `scheduledFor` (the slot) and `triggeredBy`. Its telemetry (`calls`, system prompt, credits, steps) is the same as a conversation run's. Statuses are the usual `running`, `done`, `error`, `aborted`, `interrupted`, plus `skipped` for a slot that did not run (below).

A task run is created and closed by the same `createRun` and `finishRun` as a conversation's (`api/src/conversations/service.ts`), minus the conversation. The conversation invariant holds: a run always reaches a terminal status. `finishRun` is conditional on the run still being `running`.

**The read layer.** Everything that reads a transcript expects messages. `runAsMessages` (`api/src/tasks/run-messages.ts`) presents a task run as two: the prompt (a user message authored by `{ kind: 'task' }`) and what the model produced (the assistant message, `runId` set). The export and memory reflection both read a task run through it.

Task runs are deleted with their agent (the delete cascade in `api/src/autonomous-agents/service.ts`): `kind: 'task'` runs by `agentId`, and the agent's tasks, before the conversations; conversation runs keep their conversation-keyed deletion.

## The scheduler

`runSchedulerPass(now, scope)` (`api/src/tasks/scheduler.ts`) is called from `api/src/server.ts` every `pollSeconds`, by every instance. It reads up to 50 enabled, unpaused tasks with `nextRunAt <= now`, oldest first, and for each:

- **Claim.** An atomic `updateOne({ id, nextRunAt: <slot read> }, { $set: { nextRunAt: next } })`. No lock: of two instances reading the same slot only one modifies the document, and that one owns the slot.
- **Catch-up.** `next` is computed after NOW, not after the slot. A task overdue by many slots (downtime) runs once and follows its cadence; a backlog is never replayed.
- **A corrupt schedule pauses the task.** If `nextRunAfter` throws on a stored schedule, the task gets a `pausedReason` and no `nextRunAt` (conditional on the slot read, so one instance logs it), instead of being retried and logged every pass.
- **Fire or skip.** After the claim, `startTaskRun(task, 'schedule', { scheduledFor })`. The pass returns `{ fired, skipped }`; a refused start or a `skipped` run counts as skipped. The slot is spent either way, so a disabled agent's task does not fire a stale slot on re-enable.

In development the poll excludes `test*` owners (`schedulerScope` in `server.ts`): the api specs drive their tasks through `POST /api/test-env/scheduler-pass` with an injected clock, and a real-clock poll would claim their due slots first. `POST /api/test-env/task-next-run` sets a slot directly.

## Starting a run and the lock

`startTaskRun` (`api/src/tasks/execution.ts`):

1. Refused, with a reason and nothing recorded, when the agent no longer exists or is disabled (the executor's kill switch would otherwise record the same refusal as a failed run, counted toward a pause).
2. When the account's credit cap is exhausted (`checkAccountCreditCap`), records a `skipped` run whose `error` names the cap, and stops there: an empty wallet is the account's state, not the task failing, so there is no notification and no step toward a pause, and the task runs again on its next slot once credit returns. A quota refusal that still happens at the turn's own gate (the cap reached between this check and the turn, or a role quota) is closed the same way by the task target: `skipped`, its refusal text as `error`.
3. **Takes the lock `task:<taskId>` BEFORE inserting the running run.** Recovery interrupts a `running` task run whose lock nobody holds, so a run inserted first could be interrupted in the gap.
4. If the lock is held, records a `skipped` run (error `PREVIOUS_RUN_STILL_RUNNING`) instead, so a slot that did not run is visible rather than silently lost. A lock held while no run of the task is `running` is the moment between a run's close and its lock release, so it is retried briefly (3 × 200 ms) first: run now pressed just as a run ended is not recorded skipped.
5. Otherwise inserts the `running` run and starts `executeTaskRun` WITHOUT awaiting it: the run is how a caller follows it. The lock is released in a `finally`, so a throw cannot wedge the task.

`executeTaskRun` calls `driveTurn(run, open, closeBare)` with a `taskTarget`.

**Recovery.** `recoverOwnerlessRuns` (`api/src/conversations/executor.ts`) never resumes a task run: one that began may have fired its tools, and one that did not is the next slot's. A `running` task run that this process is not running and whose `task:` lock nobody holds is closed `interrupted` (error "interrupted by a restart") and followed up like any failure: it is notified and counts toward the pause. Boot order matters (`api/src/server.ts`): the events queue starts BEFORE the recovery pass, since a run the pass interrupts is notified and pushing to a queue not yet started throws.

## The turn

`driveTurn` (`api/src/conversations/executor.ts`) runs one turn to a terminal state whatever it is a turn OF: the abort controller, buffered telemetry, the deadline, `performTurn`, and the classification of a throw. What the record IS lives behind a `TurnTarget` (`api/src/conversations/turn-target.ts`). `conversationTarget` is a chat's; `taskTarget(run, task)` (`api/src/tasks/task-target.ts`) is a task run's:

- history is the task's prompt as one user message (`Planned task "<title>": ...`); no frames, no page, no approvals to settle;
- `persist` writes the parts to the run, conditionally on it still being `running`;
- `close` and `fail` build the terminal patch (status, stop reason, parts with the stop explained, `outcome` if reported), run the follow-up, then finish the run (below);
- a turn **cut short** by a guard or a ceiling (`step-limit`, `repeated-calls`, `budget` — the run's own budget or the account cap reached mid-run) is closed `error`, its stop reason kept and the stop notice as its `error`: in a chat the person reads the notice, but nobody reads a task run, which did not do its task. It is notified and counts toward the pause, so a looping task pauses;
- moderation is a chat rule and does not apply: the prompt is admin-authored.

**Unattended tool policy.** Nobody is present, so a task run is offered only what cannot need a person:

- catalog tools go through `withoutGatedTools` (`api/src/conversations/approval-policy.ts`): only those whose approval class resolves to `allow`; a tool that would need approval is dropped, not gated, as a gated call could only end the turn on a card no one will see;
- `wait_for_user_action` is not offered (it applies to a chat with a session only), and neither is any page tool;
- if the turn still ends on a wait or an approval request, `close` records it as an `error` (`CANNOT_WAIT`: "a task run cannot wait on a person");
- the `memory` service tool applies as on every surface.

**`report_outcome`.** A service tool of the task surface only (`api/src/conversations/service-tools.ts`), its name reserved in `api/src/conversations/service-tool-names.ts` so no page tool or sub-agent config can displace it. Input is `{ status: 'done' | 'nothing-to-do' | 'needs-attention', summary }`, a summary of at most 1000 characters. The AI SDK advertises a tool's JSON schema but does not enforce it, so `validateTaskOutcome` checks the input and throws a message the model reads as the call's `output-error` and retries from. A second call replaces the first. No call leaves `outcome` absent, which is not the same as `done`. Its stored calls name the server `agent-service`.

**The prompt note.** `buildSystemPrompt(agent, memory, surface)` (`api/src/conversations/operations.ts`) adds `TASK_SURFACE_NOTE` on the task surface: it is a scheduled execution, nobody is present, nothing can be asked or approved, end by calling `report_outcome`.

## The pause and notifications

`afterTaskRun(run, task)` (`api/src/tasks/follow-up.ts`) follows a run's end. The task target calls it BEFORE writing the terminal status (so a reader who stops on it finds what followed); recovery calls it for a run it interrupts. It can never prevent the close: the target catches its failure and the finish runs in a `finally`, and the follow-up runs once per run. The task is read afresh, and one deleted meanwhile is not followed up. In order:

1. A `done` run is **reflected**, fire-and-forget (see [agent memory](./agent-memory.md#reflection)).
2. `outcome.status === 'needs-attention'` pushes a `needs-attention` event.
3. Only `error` and `interrupted` count as failures; an abort is an admin's act. For those: **the pause first**, the notifications after. `failedInARow` looks at the last `maxConsecutiveFailures` runs (this run from the argument, as it is still `running` in the store, plus earlier ones; `skipped` runs ignored, an abort or a success breaks the streak). Only runs started after `resumedAt` count, so a resumed task is not re-paused by the failures that paused it. The pause is a conditional update (`pausedReason` not set) that sets `pausedReason` and unsets `nextRunAt`, so two failures closing together pause and notify once.
4. A `failed` event, and a `paused` event when this run paused the task.

Notifications (`taskEvent` in `operations.ts`, `pushTaskEvent` in `api/src/tasks/notifications.ts`) are best-effort and never throw, because the pause must not depend on one. They are keyed per task, `agents:task-<kind>:<taskId>` (kinds `failed`, `needs-attention`, `paused`), private, with the owner as sender, the task as resource and `agents-scheduler` as the originating process, so an admin subscribes to one task or, by prefix, to all. **Texts are in French**, as data-fair processings' are; the body is the run's error or the agent's own summary. They go through `@data-fair/lib-node/events-queue.js`, started only when both `privateEventsUrl` and `secretKeys.events` are configured. In development the test-env router (`api/src/test-env/router.ts`) records them in memory by wrapping `eventsQueue.pushEvent`, so tests can read them; the notifier has no dev branch.

## Routes

`api/src/tasks/router.ts`, mounted at `/api/autonomous-agents` before the agents router (`api/src/app.ts`). All under `/:type/:id/:agentId`, organization-owned.

| Route | Who | |
| --- | --- | --- |
| `GET /tasks`, `GET /tasks/:taskId` | whoever may instruct the agent | list and read |
| `POST /tasks`, `PUT /tasks/:taskId`, `DELETE /tasks/:taskId` | admin of the account, behind the rollout gate (`reqWriteSession`) | `201`, `200`, `204` |
| `POST /tasks/:taskId/run` | admin, rollout gate | **run now**: `202 { runId }` |
| `GET /runs` | admin | runs of the agent, newest first, without `parts`, `prompt`, `systemPrompt`, `calls`; filters `taskId`, `kind` (`task`, or `conversation` — matched as "not `task`", since a conversation run carries no `kind`; any other value is a `400`), `status`, `outcome`, `since`; paged (`size` up to 100, `page`) |
| `GET /runs/:runId` | admin | a task run with its content; a conversation run as metadata only (it points at its `conversationId`) |
| `POST /runs/:runId/abort` | admin | stop a task run (below); `404` for a conversation run |
| `GET /runs/:runId/export` | admin | a task run's JSONL, the same file as a conversation's export, its content presented as two messages by `runAsMessages` (`404` for a conversation run) |

Run now is the same run a slot starts, with trigger `manual`. It is **refused** (`409`) rather than queued while one is going, and when the agent is disabled (an unknown agent is a `404`). When the account's credit cap is exhausted it is also refused (`409`, the cap as the reason), and that start is recorded as a `skipped` run like a slot's. It IS allowed on a paused or disabled TASK: it is how an admin checks a fix before resuming.

**Stopping a task run.** A task run is aborted with `POST /api/autonomous-agents/:type/:id/:agentId/runs/:runId/abort`, by an admin of the account (`api/src/tasks/router.ts`): it is the organization's audit record, not a person's thread. It has no socket, so this route is its only stop, and it works across API instances: `abortRun` aborts the turn at once when this process holds it, and records `abortRequestedAt` on the run while it is still `running`. Every live turn polls its own run every 2 s (`watchStopRequests` in `driveTurn`, `STOP_POLL_MS`) and aborts itself when the field is set, or when its run document is gone (its agent or conversation was deleted). The route answers `{ aborted: true }` when it aborted locally or recorded the request, `false` for a run that already ended. Disabling or deleting the agent does the same for all its running runs (`abortRunsOfAgent`, with `abortReason: 'agent-stopped'`, so the turn is settled as a local kill switch settles it).

## What the next plans add

- **Plan 4, self-knowledge and `plan_task`**: tools through which the agent reads its own configuration and proposes a task, through the approval gate (a person approves, so `createdBy.conversationId` records the thread it came from).
- **Plan 5, the admin page**: the UI for tasks and their runs, showing the paused state and reason before an admin saves, and simulations of an instructor planning a task.
