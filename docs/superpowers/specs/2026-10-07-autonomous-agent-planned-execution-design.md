# Planned execution for autonomous agents

**Status:** design approved in discussion (2026-10-07), awaiting review of this written spec
**Implements:** P2 "scheduled executions" of `2026-09-22-autonomous-agents-p0-design.md`, with the P1
approval gate (`2026-10-01-tool-approval-gate-design.md`) as its first step, and the self-knowledge part
of what P4 called "self-planning".

## What this is for

Planned execution is what makes an autonomous agent autonomous: it acts without anyone instructing it.

What was asked:

- a planned task is a prompt plus a schedule, configured by hand first, in the spirit of data-fair
  processings;
- each execution is a single turn, never appended to a pseudo conversation;
- admins can consult the history of executions;
- the agent has self-knowledge: it can read its own configuration and explore its execution history to
  answer questions about itself;
- self-configuration — planning its own tasks from a chat — is allowed, but only through a validation by
  an instructor.

Settled in discussion:

- autonomous agents are auditable by nature: consent and privacy gates apply to personal-assistant
  conversations only, so an admin reads execution history without a consent gate;
- manual task editing is admin-only; instructors plan tasks indirectly, by asking the agent and
  validating what it proposes;
- an execution runs as the agent's own non-human identity and is billed to the agent, as its chat turns
  already are.

## State of the art, briefly

The field converges on: a stored prompt plus a cadence, a fresh session per run, a run list per schedule
with run-now and pause, and continuity through explicit notes or history rather than a growing thread
(Claude Code routines, Managed Agents, Devin, Cursor, LangGraph stateless crons). Consumer assistants
(ChatGPT Tasks, Gemini) append runs to one chat instead. Recurring pitfalls: runaway cost from forgotten
or looping schedules, "green" meaning only "didn't crash", silent failures, timezone confusion, memory
poisoning. Common answers: a minimum interval (often one hour), auto-pause after repeated failures,
failure-only notifications, an outcome the agent reports separately from technical success. Most systems
run schedules as their creator; this design's non-human identity is ahead of them. Claude Code routines
state the principle adopted here for approvals: a stored prompt "can't act as approval or consent".

From data-fair processings, reused: scheduling rules as a structured array converted to cron and computed
with croner in a timezone; one planned next run per resource; locks with a TTL for crash safety; events
pushed on failure; auto-disable after repeated failures. Avoided: no run timeout, the trigger source lost
once a run starts, count-based pruning on every finish.

## Decisions

| Question | Decision |
| --- | --- |
| Where does one execution live? | A new record type, a **task run**, in its own collection — never a thread. |
| What does a schedule hang off? | A **planned task**, its own resource under the agent; an agent has several. |
| Who edits tasks? | Admins, directly. Instructors, indirectly: they ask the agent, and validate its proposal. |
| How is a result delivered? | Always to the history. A notification only on failure, `needs-attention` or a pause. |
| How is a proposal validated? | In the chat, by the instructor who asked, with a button — through the approval gate. |
| Self-knowledge in executions? | Yes: a task run can read past runs, for continuity without a growing thread. |
| Tools in an unattended run | The agent's approval policy decides; a tool that needs approval (or is denied) is removed. |
| The approval gate | Built first, as part of this work. Default: `destructive: 'approve'`, others `allow`. |
| Where the scheduler runs | A polling loop inside the API process. |
| Tools the agent cannot use | Visible on demand through self-knowledge, with the reason, so it can explain refusals. |

Defaults, agreed: a minimum interval of one hour (a deployment setting); at most 20 tasks per agent; an
execution bounded by the existing per-turn time and credit limits; a task never runs twice at once (a due
run whose predecessor is still running is recorded `skipped`); one catch-up run after downtime, never a
backlog; five consecutive failed runs pause the task; history is kept (retention may become a deployment
setting later).

## Data model

### On the agent

`approvals?: { readOnly?, write?, destructive? }`, each `'allow' | 'approve' | 'deny'`, as in the gate
design (unannotated tools count as `write`). Defaults: `destructive: 'approve'`, the others `allow`. This
departs from the gate design's "ships open"; the user chose it.

### `autonomous-agent-tasks`

| Field | Notes |
| --- | --- |
| `id`, `agentId`, `owner` | owner is the agent's organization |
| `title`, `prompt` | the prompt is the task, framed to the model as an assignment, never as consent |
| `scheduling` | processings' rule array (monthly / weekly / daily / hours), with `timeZone` |
| `enabled` | the admin's switch |
| `pausedReason` | set by the five-failure rule; cleared when an admin re-enables |
| `nextRunAt` | the one planned run; recomputed on create, edit and re-enable |
| `createdBy`, `updatedBy` | `{ userId, userName, at }`; from a chat, the approving instructor, plus `conversationId` |

Indexes: `{ nextRunAt: 1 }` (the scheduler), `{ agentId: 1 }`.

### `autonomous-agent-task-runs`

| Field | Notes |
| --- | --- |
| `id`, `taskId`, `agentId`, `owner` | |
| `trigger` | `schedule` or `manual` |
| `scheduledFor` | the slot it was claimed for |
| `prompt` | a snapshot of the task's prompt at the time |
| `parts` | the answer, in the conversation messages' part format, so rendering and export are shared |
| `outcome` | `{ status: 'done' \| 'nothing-to-do' \| 'needs-attention', summary }`, set by the agent; absent if it never reported |
| `status` | `running`, `done`, `error`, `aborted`, `interrupted`, `skipped` |
| `stopReason`, `error`, `calls`, `credits`, `systemPrompt`, `startedAt`, `endedAt` | the run telemetry |

The telemetry fields are **shared schema definitions** with conversation runs — the same shape, separate
documents. What the two run kinds share is code (budget, abort, recovery, telemetry buffering), not
storage. Indexes: `{ taskId: 1, startedAt: -1 }`, `{ agentId: 1, startedAt: -1 }`, `{ status: 1 }`.

### No proposal record

Planning from a chat is a tool call that always needs approval. The pending call is the proposal; its
approval part records who decided; approving executes it.

## The approval gate, with what changed since its design

The gate design (`2026-10-01-tool-approval-gate-design.md`) stands: a gated call ends the run with the
call left open; the decision arrives later; a new run continues and the AI SDK executes the approved call
on replay; `deny` removes the tool from the set; the double-execution guard and the compaction clamp
apply. Changes:

- the default above (`destructive: 'approve'`);
- the UI target it named (`ConversationRunStatus.vue`) was removed with the merged chat: the approval is a
  **card in the transcript** — the tool's title and server and its arguments (for `plan_task`, the task in
  readable form), Approve and Reject with an optional reason — and the activity line reads "Awaiting your
  approval". After the decision the card stays, as a record of who decided what;
- the decision arrives over the **chat socket** as well as HTTP, like Stop; only the person whose
  conversation it is decides;
- the run that follows a decision has trigger **`approval`**, beside `user` and `wake`;
- the same shape as the wait handover (`2026-10-06-wait-ends-the-turn-design.md`): a turn ends with a
  call left open, and a button settles it.

## Scheduler and execution flow

- **Claiming.** Every 10 seconds, each API instance reads tasks that are enabled, not paused, with
  `nextRunAt` in the past, and claims one by advancing its `nextRunAt` to the next slot after *now*, in a
  single update conditioned on the value it read. One instance wins; no lock is needed for the claim.
  Advancing from now gives the catch-up rule: one run after downtime, never a backlog.
- **Firing.** The winner checks the agent is enabled — a disabled agent's due task simply does not fire,
  its `nextRunAt` having already advanced — and that no run of this task is `running`; if one is, it
  records a `skipped` task run with the reason. Otherwise it creates a `running` task run and executes
  it holding a lock on the task, so a crashed instance's lock expires.
- **Recovery.** A task run `running` with nobody holding its lock is marked `interrupted`, never re-run —
  its tool calls may have fired. Added to the existing 30-second recovery pass, which also gains lock
  protection.
- **The turn.** The agent's system prompt, with a note that this is a scheduled execution with nobody
  present that must end by reporting an outcome; then one message, the task's title and prompt. Tools: the
  agent's MCP tools its policy allows, the self-knowledge tools, `report_outcome`. No page tools, no wait.
  Bounded by the per-turn time limit, credit budget, stall detection and abort; disabling the agent stops
  its task runs. Billed to the agent.
- **Ending.** Parts and outcome are written to the task run. Five consecutive failures (status `error` — a timeout
  included — or `interrupted`) pause the task with the reason. Notifications through data-fair's events service, one
  topic per task: a failed run, `needs-attention`, a pause. No `report_outcome` call leaves the outcome
  absent — a visible fact, not a guessed `done`.
- **Run now.** An admin action creating a `manual` task run immediately; refused while one is running.

**The cost to flag.** The executor is written around conversations: it loads history from messages,
writes the assistant message as it goes, and closes run and message together. The model loop is separated
from where it reads and writes — one interface ("history in, parts out, close"), implemented once for
conversations and once for task runs. The loop itself does not change.

## Self-knowledge and self-configuration tools

Configured autonomous agents only. Service-provided, exempt from the approval policy — except the
planning tools, which always need approval.

| Tool | Where | What |
| --- | --- | --- |
| `get_my_configuration` | chats, task runs | title, persona, instructions, approval policy; the tool inventory (usable now; offered by its servers but unusable, with the reason — tool filter, `deny`, or needs approval while nobody is present); catalog servers it is not connected to, by name and description (from configuration, no connection); its tasks with schedule in plain words, next run, enabled or paused and why |
| `list_my_task_runs` | chats, task runs | `{ taskId?, outcome?, status?, since?, limit }`, newest first, at most 20 rows: task, trigger, time, status, outcome and summary, credits |
| `get_task_run` | chats, task runs | one run: prompt, outcome, status or error, its answer with each tool result cut to a bounded excerpt |
| `report_outcome` | task runs | `{ status, summary }`, the turn's last call |
| `plan_task`, `update_task`, `delete_task` | chats only | always need approval; the card shows the task (or before and after); approving validates against the schema and limits, writes the task, records the approver and the conversation; a validation error returns to the model as the tool's error |

The system prompt of a configured agent gains one line: before saying it cannot do something, check its
configuration. The inventory is on demand rather than in every prompt, which would cost tokens on every
turn and unsettle the prompt cache. The personal assistant takes the whole catalog and has no policy, so
none of this applies to it.

**Past runs are data.** Earlier runs' answers and summaries come back inside the untrusted-data envelope
any tool result gets, attributed to the agent's own history: what a past run read is reported, not obeyed.
That is the guard against memory poisoning across runs; task runs also cannot change configuration.

**A registry for service-provided tools.** `wait_for_user_action` is wired by hand into the turn today.
It, these tools and the memory tools of the sibling work go through one small registry: each entry states
when it applies (chat or task run; personal assistant or configured agent) and builds its tools for that
turn.

**Boundary with agent memory** (sibling work, branch `feat-agent-memory`): these tools read records the
service keeps — configuration, tasks, task runs. What the agent chooses to write down, and search over its
past conversations, belong to the memory work. Both use the registry.

## Routes and UI

- **Tasks** — `/api/autonomous-agents/:type/:id/:agentId/tasks`: list and read for admins and
  instructors; create, update, delete and `POST …/:taskId/run` for admins.
- **Task runs** — `/api/autonomous-agents/:type/:id/:agentId/task-runs`, admins: a paginated list
  filterable by task, status and outcome, without parts; one run with parts; abort; a JSONL download
  through the conversation export's builder.
- **Approvals** — `{ approved, reason? }` over the chat socket and
  `POST /api/conversations/:type/:id/:conversationId/approvals/:toolCallId`.
- **An admin page per agent**, three tabs: *Configuration* (the existing form plus approval levels);
  *Tasks* (schedule in plain words, next run, on/off, paused reason, run now; a form with processings'
  scheduling rules); *History* (task runs newest first — time, task, trigger, status, outcome, credits — a
  row opening the run rendered with the chat's transcript components, with the export button). The
  existing list keeps its edit dialog and links to the page.

## Order of work

Five plans, each shippable and tested on its own:

1. **The approval gate** — approval levels (destructive defaults to `approve`), classification, `deny`
   removal, the turn ending on a pending approval, the decision over socket and HTTP, the `approval` run,
   the chat card, the double-execution guard and the compaction clamp. It stands alone: chats get
   approvals before anything is scheduled.
2. **The model loop separated from conversations, and the service-tool registry** — a refactor with no
   behaviour change, proven by the existing suites unchanged; `wait_for_user_action` becomes the
   registry's first entry. The point to coordinate with the memory work.
3. **Tasks, task runs and the scheduler** — the collections, claiming, firing and skipping, recovery, the
   pause, notifications, run-now, abort, routes, export.
4. **Self-knowledge and self-configuration tools** — including `plan_task` through the gate.
5. **The admin page, and simulations** — e2e tests on the mock; a simulation case where an instructor asks
   the agent to plan a weekly report and approves it, with the premise that an approval happened. Judging
   scheduled runs from their export alone (a case with no persona) is noted for later, not designed here.

## Testing

- Whether a tool ran is checked on the MCP fixture's own record of calls, never on what the model says
  (the gate design's rule).
- The scheduler is tested through the API with the mock model. A test-only route triggers one scheduler
  pass, and "now" is injectable, so tests never wait for a clock.
- Claiming under concurrency: two passes at once, one task run.
- Catch-up: a task overdue by several slots fires once.
- Overlap: a due task with a `running` run records `skipped`.
- Recovery: a `running` task run without its lock becomes `interrupted` and is not re-run.
- The pause: five failures pause the task; re-enabling clears it and recomputes `nextRunAt`.
- Tool policy: in a task run, an `approve` or `deny` tool is absent and the fixture never sees a call.
- `plan_task`: pending card, no task yet; approved, the task exists with the approver recorded and a
  scheduler pass finds it; rejected, no task, and the model is told why.
- Self-knowledge: `get_my_configuration` lists an excluded tool with its reason; `list_my_task_runs`
  returns past runs; a past run's injected instruction comes back inside the data envelope.
- Notifications: a failed run, `needs-attention` and a pause each push their event.

## Risks

- **Runaway cost** — bounded per run by the existing budget and time limit, across runs by the minimum
  interval, the task cap, the five-failure pause and the account's credit cap.
- **Approval fatigue** — `destructive: 'approve'` gates only tools declared destructive; `write` stays
  `allow` unless an admin raises it.
- **A pending approval sits for ever** — accepted, as in the gate design: nothing is held, and it is
  visible in the chat.
- **Poisoned continuity** — past runs are returned as data, and task runs cannot change configuration.
- **The executor refactor** — the largest change; isolated in its own plan and proven by the existing
  suites passing unchanged.
