# Planned tasks

A **planned task** is a prompt attached to a configured [autonomous agent](./autonomous-agents.md) together with a schedule. An organization's admin writes it on the agent's page, or the agent plans it itself in a chat an administrator started, each change approved by an administrator through the approval gate ([planning](#self-knowledge-and-planning)). When a slot comes due the service runs ONE unattended turn of that agent on the prompt, records it as a **task run**, and tells an admin when it failed or needs attention.

Code: `api/src/tasks/` (`operations.ts` pure rules, `service.ts` task CRUD, `execution.ts` starting and following up a run, `scheduler.ts` the polling pass, `task-target.ts` the turn target, `notifications.ts`, `run-messages.ts`, `router.ts`), with the turn itself in `api/src/conversations/executor.ts` (`driveTurn`).

## Why it is shaped this way

- **A fresh turn per run, never a conversation.** Scheduled agents in the field converge on a stored prompt plus a cadence, a fresh session per run, a run list per schedule with run-now and pause, and continuity through notes or history rather than a growing thread (Claude Code routines, Managed Agents, Devin, Cursor, LangGraph stateless crons); consumer assistants (ChatGPT Tasks, Gemini) append runs to one chat instead. Here a run's continuity is its earlier runs, read on demand ([below](#self-knowledge-and-planning)), and memory.
- **It runs as the agent.** A task run acts as the agent's own non-human identity and is billed to the agent (`usageIdentityFor`), as its chat turns are; there is no instructing user to borrow. Most schedulers run a schedule as its creator.
- **A stored prompt is an assignment, not consent.** Claude Code routines state the principle: a stored prompt "can't act as approval or consent". So a task run is offered no tool that needs approval (see [the unattended tool policy](#the-turn)), rather than treating the admin who wrote the prompt as having approved every call it leads to.
- **The known pitfalls, each with its guard.** Scheduled agents fail by runaway cost from a forgotten or looping schedule, "green" meaning only "didn't crash", and silent failures. The answers are the common ones: a minimum interval (one hour by default), a cap per agent, a pause after repeated failures, notifications on failure only, and an outcome the agent reports separately from the run's technical status. Each run is also bounded by the per-turn time limit, its credit budget and the account's credit cap.
- **Processings' scheduling, minus its gaps.** From data-fair processings: the rule array computed with `croner` in a time zone, one planned next run per resource, a lock that expires with a crashed instance, events on failure, a pause after repeated failures. Not taken over: a run has a deadline, its trigger stays on the run (`trigger`, `triggeredBy`, `scheduledFor`), and history is not pruned on every finish — task runs are kept until their agent is deleted.
- **Auditable.** An admin reads every run of the agent, with no consent gate: consent applies to the personal assistant's conversations only, an autonomous agent's work is the organization's.

## Tasks and their schedule

| Collection | Holds |
| --- | --- |
| `autonomous-agent-tasks` | one task: `agentId`, `owner`, `title`, `prompt`, `scheduling`, `enabled`, `nextRunAt`, `pausedReason`, `resumedAt`, `createdBy`/`updatedBy` (who, when, and from which conversation) |

Schema: `api/types/autonomous-agent-task/schema.js`; the write body is `task-write-req`.

The schedule is data-fair processings' own rule array: each rule is monthly, weekly, daily or "every N hours", with its time zone (default `Europe/Paris`). `toCron` converts a rule to a cron expression and `nextRunAfter` (`api/src/tasks/operations.ts`) takes the earliest next slot across rules with `croner`, as processings does, so scheduling a task is scheduling a processing. `describeScheduling` renders it in `en` or `fr`. Each rule type is closed to its own keys in the schema, and both functions read only those, so the words are the schedule that runs.

Caps, enforced on every write that sets a schedule (`assertSchedule` in `api/src/tasks/service.ts`), all from `config.tasks`:

- `minIntervalSeconds` (default 3600): `minGapSeconds` samples the next 50 slots of the MERGED rules, so two rules ten minutes apart count as the same mistake as an every-ten-minutes rule. A schedule with no next slot is rejected too.
- `maxPerAgent` (default 20): checked on create, not atomically.
- `pollSeconds` (default 10) and `maxConsecutiveFailures` (default 5) are read by the scheduler and the pause.

The schedule is validated only when it is being set (task created, schedule changed, or task re-enabled): raising the minimum interval does not block editing the prompt of an existing task, and a title-only update keeps `nextRunAt`. The comparison (`scheduleKey`) is insensitive to key order.

A disabled task has no `nextRunAt` (the scheduler's poll is on it). A PUT with `enabled: true` on a **paused** task resumes it: `pausedReason` is cleared and `resumedAt` stamped. That is deliberate: the full form is how an admin acts on a paused task.

## Task runs are a kind of run

A task run is a document of the `runs` collection with `kind: 'task'` (a conversation's turn is `kind: 'conversation'`; `api/types/conversation-run/schema.js`). It has no conversation, so its content lives on the run itself: `prompt`, `parts` (the AI SDK parts, as a conversation's assistant message) and `outcome`, plus `taskId`, `trigger` (`schedule` or `manual`), `scheduledFor` (the slot) and `triggeredBy`. Its telemetry (`calls`, system prompt, credits, steps) is the same as a conversation run's. Statuses are the usual `running`, `done`, `error`, `aborted`, `interrupted`, plus `skipped` for a slot that did not run (below).

A task run is created and closed by the same `createRun` and `finishRun` as a conversation's (`api/src/conversations/service.ts`), minus the conversation. The conversation invariant holds: a run always reaches a terminal status. `finishRun` is conditional on the run still being `running`.

**Why one collection.** The two kinds differ only in where their content lives and a few fields; every reader of runs needs both. The credit budget, abort, the per-turn deadline, recovery and the agent kill switch key on runs; the export is built from runs; self-knowledge answers "what did I do" across chats and tasks; an admin audits everything an agent did in one query. Two collections would move the duplication from the documents into each of those readers.

**Why the content is embedded.** A conversation's content is unbounded and lives in `messages`; a task run's is bounded — one prompt, one answer, read whole, never appended to — so it is on the run. That is MongoDB's usual rule (embed what is bounded and read together, reference what grows), preferred to hanging every message off a run, which would normalise the model for no storage gain. Uniformity is had at the read layer instead.

**The read layer.** Everything that reads a transcript expects messages. `runAsMessages` (`api/src/tasks/run-messages.ts`) presents a task run as two: the prompt (a user message authored by `{ kind: 'task' }`) and what the model produced (the assistant message, `runId` set). The run route, the export and `read_conversation` all read a task run through it; the agent page's History tab renders those messages with the chat's own transcript component (`ui/src/components/agent-page/TaskRunView.vue`).

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

**Recovery.** `recoverOwnerlessRuns` (`api/src/conversations/executor.ts`) never resumes a task run: one that began may have fired its tools, and one that did not is the next slot's. A `running` task run that this process is not running and whose `task:` lock nobody holds is closed `interrupted` (error "interrupted by a restart") and followed up like any failure: it is notified and counts toward the pause. A deploy that lets the process drain does not get there: a
task run still running at the end of the shutdown grace is stopped as `shutdown` and closed `aborted` by
its own process, which is neither notified nor counted (see [autonomous agents](./autonomous-agents.md#recovery)).
Boot order matters (`api/src/server.ts`): the events queue starts BEFORE the recovery pass, since a run the pass interrupts is notified and pushing to a queue not yet started throws.

## The turn

`driveTurn` (`api/src/conversations/executor.ts`) runs one turn to a terminal state whatever it is a turn OF: the abort controller, buffered telemetry, the deadline, `performTurn`, and the classification of a throw. What the record IS lives behind a `TurnTarget` (`api/src/conversations/turn-target.ts`). `conversationTarget` is a chat's; `taskTarget(run, task)` (`api/src/tasks/task-target.ts`) is a task run's:

- history is the task's prompt as one user message (`Planned task "<title>": ...`); no frames, no page, no approvals to settle;
- `persist` writes the parts to the run, conditionally on it still being `running`;
- `close` and `fail` build the terminal patch (status, stop reason, parts with the stop explained, `outcome` if reported), run the follow-up, then finish the run (below);
- a turn **cut short** by a guard or a ceiling (`step-limit`, `repeated-calls`, `budget` — the run's own budget or the account cap reached mid-run) is closed `error`, its stop reason kept and the stop notice as its `error`: in a chat the person reads the notice, but nobody reads a task run, which did not do its task. It is notified and counts toward the pause, so a looping task pauses;
- moderation is a chat rule and does not apply: the prompt is admin-authored.

**Unattended tool policy.** Nobody is present, so a task run is offered only what cannot need a person:

- every tool needing approval is dropped, not gated (`unattended`, `api/src/conversations/approval-policy.ts`), whether the approval policy gated it or it gates itself (a service tool's own `needsApproval`): a gated call could only end the turn on a card no one will see;
- `wait_for_user_action` is not offered (it applies to a chat with a session only), and neither is any page tool;
- if the turn still ends on a wait or an approval request, `close` records it as an `error` (`CANNOT_WAIT`: "a task run cannot wait on a person");
- the `memory` service tool applies as on every surface.

**`report_outcome`.** A service tool of the task surface only (`api/src/conversations/service-tools.ts`), its name reserved in `api/src/conversations/service-tool-names.ts` so no page tool or sub-agent config can displace it. Input is `{ status: 'done' | 'nothing-to-do' | 'needs-attention', summary }`, a summary of at most 10,000 characters — room for several findings with their links; the notification title carries only its first 150 characters, the body all of it. The AI SDK advertises a tool's JSON schema but does not enforce it, so `validateTaskOutcome` checks the input and throws a message the model reads as the call's `output-error` and retries from. A second call replaces the first. No call leaves `outcome` absent, which is not the same as `done`. Its stored calls name the server `agent-service`.

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
| `GET /runs/:runId` | admin | a task run with its content, as the two `messages` of `runAsMessages` (not also as `prompt`/`parts`); a conversation run as metadata only (it points at its `conversationId`) |
| `POST /runs/:runId/abort` | admin | stop a task run (below); `404` for a conversation run |
| `GET /runs/:runId/export` | admin | a task run's JSONL, the same file as a conversation's export, its content presented as two messages by `runAsMessages` (`404` for a conversation run) |

Run now is the same run a slot starts, with trigger `manual`. It is **refused** (`409`) rather than queued while one is going, and when the agent is disabled (an unknown agent is a `404`). When the account's credit cap is exhausted it is also refused (`409`, the cap as the reason), and that start is recorded as a `skipped` run like a slot's. It IS allowed on a paused or disabled TASK: it is how an admin checks a fix before resuming.

**Stopping a task run.** A task run is aborted with `POST /api/autonomous-agents/:type/:id/:agentId/runs/:runId/abort`, by an admin of the account (`api/src/tasks/router.ts`): it is the organization's audit record, not a person's thread. It has no socket, so this route is its only stop, and it works across API instances: `abortRun` aborts the turn at once when this process holds it, and records `abortRequestedAt` on the run while it is still `running`. Every live turn polls its own run every 2 s (`watchStopRequests` in `driveTurn`, `STOP_POLL_MS`) and aborts itself when the field is set, or when its run document is gone (its agent or conversation was deleted). The route answers `{ aborted: true }` when it aborted locally or recorded the request, `false` for a run that already ended. Disabling or deleting the agent does the same for all its running runs (`abortRunsOfAgent`, with `abortReason: 'agent-stopped'`, so the turn is settled as a local kill switch settles it).

## Self-knowledge and planning

Service tools of a configured agent (never the personal assistant), registered in `api/src/conversations/service-tools.ts` and built in `api/src/self-knowledge/`. Their provenance server is `agent-self` (`SELF_KNOWLEDGE_SERVER_ID`).

**Self-knowledge** (`tools.ts`, `operations.ts`; read-only; chats and task runs):

- `get_my_configuration`: persona, instructions, approvals, whether memory is on, each catalog tool with its status (usable, needs approval, denied by policy, not selected by an administrator, server unreachable), the service tools offered this turn, and the catalog servers it is not connected to, and its tasks described by `describeScheduling` (`shared/task-schedule.ts`, the same text the planning tools reply with and the approval card shows);
- `list_my_runs`: its own runs, chats and task runs, through `listRuns` in `api/src/tasks/service.ts`, the read path the admin routes use. A conversation row names its conversation with its title and marks the one being had now (`(this conversation)`), so the agent never takes another conversation's turns for its own; the listing ends with how to read one: `read_conversation`, with the conversation's id or a task run's.
- `read_conversation`: any past conversation of the agent, whoever had it, or a task run, **in its export** — the same JSON Lines file maintainers download from the review page and the simulation judge reads (`buildConversationExport`, [conversation review](./conversation-review.md)). It is read by pages of 30,000 characters, each line prefixed with its number, from `line` and, inside a line longer than a page, from `offset` (`exportPage`) — the in-tool equivalent of the `sed -n` reading the `conversation-export` skill teaches: line 1 describes the file, line 2 is the outline (every record with its line, size and preview), large tool results are lifted into their own `blob` lines, and each run record carries the system prompt (instructions and memory) the agent had then. The tool description carries that reading guide. One format for every reader, rather than a second renderer for the agent; and an agent answering "why did you do that?" can read the whole tool result and what it was told at the time, not an excerpt.
- **When to read.** Both `list_my_runs` and `read_conversation` say in their description when to use them: when someone refers to something said or done earlier, read it before answering, and never say something did not happen without having read it. A judged run had the tools offered but answered from the model's trained default ("each conversation starts fresh") and denied a decision taken in another conversation; Anthropic notes the same of Claude.ai's past-chat search: the model may not look if it does not seem needed. The trigger lives in the tool descriptions rather than in a system-prompt sentence: one place, read with the tool.
- An agent has one history: it must be able to answer "why did you do that yesterday?" from another person's conversation, which is why those conversations are audited and carry no consent ([agent memory](./agent-memory.md#design)). Search is left out until a simulation shows listing by date is not enough.
- A past run's content comes back enveloped as data, like any tool result: reported, not obeyed. With task runs offered no planning tool, that is the guard against one run's poisoned input steering the next. The run listing never names who triggered a run.

A task run's prompt (`TASK_SURFACE_NOTE`) points at `list_my_runs` and `read_conversation` for its earlier runs — to compare and say what changed, but to do the task again and report only what this run read: a judged run that started minutes after the previous one re-reported its findings without fetching anything. The memory clause says the past stays readable, so a run reads what the previous one reported instead of copying findings into memory.

One system-prompt sentence for configured agents (`SELF_KNOWLEDGE_NOTE`, `api/src/conversations/operations.ts`) points at `get_my_configuration` before the agent says it cannot do something. The inventory itself is read on demand rather than written into every prompt, which would cost tokens on every turn and unsettle the prompt cache.

**Planning** (`planning.ts`; chat surface only): `plan_task`, `update_task` (the whole new task, with its `taskId`) and `delete_task`. Their input is the admin form's own schema (`task-write-req`), so the schedule is data-fair processings' rule format.

- **Approval.** Each carries `needsApproval: true` on the tool itself, since service tools are outside the approval policy and no policy can unset it. The card is titled from the annotation (`PLANNING_TOOL_ANNOTATIONS`: "Plan a task", "Change a task", "Delete a task") and shows the task in plain words, with Before and After for an update (`ui/src/components/agent-chat/ApprovalCard.vue`). After is what `updateTask` will store: a missing `enabled` keeps the stored one, and a paused task (shown with its reason in Before) is marked as resumed by the change, since any update that leaves it enabled lifts the pause. Task runs are not offered them: nobody could approve. There is no proposal record: the pending call is the proposal, its approval part records who decided, and approving executes it.
- **Only an administrator of the organization approves** (user decision, 2026-10-08), as only one writes tasks through the routes, and by the same mechanism as `request_web_access` ([web access](web-access.md#asking-for-more)): the tools are offered only in a chat whose run an administrator started (`run.triggeredByRole`), and `decideAndContinue` (`api/src/conversations/approvals.ts`, `ADMIN_DECISIONS`) refuses anyone else's approval with a 403 before anything is recorded, so the call stays pending. Rejecting is anyone's. In a chat where they are not offered, `get_my_configuration` says that planning needs an administrator (`PLANNING_NEEDS_ADMIN`), so the agent can explain rather than guess. The task routes' rollout gate (`reqWriteSession`, superadmin admin mode while `autonomousAgentsRequireAdminMode` is on) does not apply to an approval.
- **Actor.** The approved call executes inside the `approval` continuation run through `createTask`/`updateTask`/`deleteTask`, the same service functions as the admin routes. The task records the decider (the run's `triggeredBy`) as `createdBy`/`updatedBy`, with `conversationId` for the thread it came from. When two calls of one step are decided by different people, the last decider is recorded for both.
- **Audit.** The events-log entry is written by the service, not the route: from a route with `{ req }`, from a tool with `{ account, user }` of the decider.
- **Refusals are the call's error.** The task cap, the minimum interval, a schedule with no next slot, invalid input and a 404 (a task deleted since) come back as the tool's error text with their status, and the planning tools' description (`REFUSAL_NOTE` in `api/src/self-knowledge/planning.ts`) tells the model not to retry the same input. The caps are the ones in [the schedule section](#tasks-and-their-schedule); there is no second set for agents.
- **The agent knows how findings reach people.** `plan_task` and `update_task` describe the delivery rule (`DELIVERY_NOTE` in `planning.ts`): a person hears about a run only when it fails, its task is paused, or it reports `needs-attention`. So when someone asks to be told what a task finds, the agent writes the prompt to report `needs-attention` when there is something to report, and promises nothing else. A judged run had accepted "report back to me" for a task whose findings would have ended `done` and reached no one.

On the admin review page and in a task run's view, approval cards are read-only (one `readonly` prop on `ApprovalCard.vue`): a pending card there cannot be decided, it says so. The "Awaiting your approval" label uses the card's recorded title.

## The admin page

One page per agent, `ui/src/pages/[type]/[id]/agents/[agentId].vue` (`/agents/:type/:id/agents/:agentId`), is the ONE place to edit an agent (user decision, 2026-10-08). The organization list (`ui/src/components/AutonomousAgentsSection.vue`) only creates an agent, then opens its page, and links to it. Non-admins are redirected to the chat. The tab is `?tab=`:

- **configuration** (`ui/src/components/agent-page/AgentConfigurationTab.vue`): `ui/src/components/AutonomousAgentForm.vue`, shared with the create dialog, with the approval levels (defaults in `shared/approval-policy.ts`) and the state chips (`ui/src/components/AutonomousAgentStateChips.vue`).
- **tasks** (`AgentTasksTab.vue`): each task's schedule in plain words (`describeScheduling`), next run, on/off, the paused state and its reason before an admin saves, run now. The task form is generated by vjsf from the task-write schema.
- **history** (`AgentHistoryTab.vue`): the agent's runs newest first, task runs by default; `?run=<id>` opens a task run in `TaskRunView.vue`, rendered with the chat's transcript components from the `messages` of `GET /runs/:runId`. Status words are in `ui/src/utils/run-statuses.ts`.

**Notification links.** A task event carries a `url` to the page, built from the agent's `nhi.siteUrl` (`api/src/tasks/operations.ts`): `?tab=history&run=<runId>` for a failure or a `needs-attention` outcome, `?tab=tasks` for a pause.
