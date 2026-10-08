# Autonomous Agent Admin Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each autonomous agent gets one admin page with three tabs:
- **Configuration**: the agent's form.
- **Tasks**: its planned tasks, with schedule in plain words, next run, on/off, paused reason, run now, and create/edit/delete.
- **History**: its runs, newest first. A task run opens rendered with the chat's transcript components, with its export.

This plan also closes the plan-4 leftovers that belong to this page.

**Architecture:**
- One page, `ui/src/pages/[type]/[id]/agents/[agentId].vue`, built only from what exists:
  - the agent vjsf form;
  - a task form generated from the task write-request schema;
  - the tasks and runs routes;
  - the chat's message components for a run's transcript.
- The one server addition is that reading a task run also returns its content as messages through `runAsMessages`. That is the read-layer function the spec names, so the page renders a task run exactly as the export and `get_run` present it.
- The org page's agents section becomes a list that links to each agent's page.

**Tech Stack:** Vue 3 + Vuetify, `@koumoul/vjsf` (generated forms), `@data-fair/lib-vuetify` (section tabs, navigation), Express routes already in place, Playwright (unit / api / e2e projects), the mock model.

**Spec:** `docs/superpowers/specs/2026-10-07-autonomous-agent-planned-execution-design.md`, section "Routes and UI" ("An admin page per agent, three tabs …"). The as-built docs are `docs/architecture/planned-tasks.md` and `docs/architecture/autonomous-agents.md`.

## Global Constraints

- **The user's rule.**
  - As simple and straightforward as possible.
  - ONE way to do each thing: one place to edit an agent, one task form, one rendering of a transcript.
  - Complexity in tests, not product code.
  - Reuse:
    - the generated vjsf components (`npm run build-types` with `'vjsf'` in a schema's `x-exports`);
    - `DfSectionTabs`;
    - the chat transcript components (`ui/src/components/agent-chat/`);
    - `describeScheduling` from `@agents/shared/task-schedule`.
- **Access, unchanged from the routes.**
  - The page, its tabs and every write are for org admins, plus superadmin admin mode while `autonomousAgentsRequireAdminMode` is on. The routes already enforce both, and the UI follows them.
  - Instructors who are not admins keep the chat (`/[type]/[id]/chat?agentId=…`) and see no admin page.
- **Wording.** Every UI string in fr and en, in the component's `<i18n>` block.
- **Layout.** Works at phone width: a 16px side gutter, no horizontal scroll. Tables become lists below `md`.
- **Test procedure.** One api/e2e run at a time (`tests/support/stateful-lock.ts`). The mock model drives api/e2e. Simulations are run by the controller only.

## Review Focus

1. **A paused task is still `enabled`.** The Tasks tab shows `pausedReason` and says saving the task resumes it (`updateTask` resumes on any update). A test in Task 3.
2. **History distinguishes what is easy to conflate:**
   - a `skipped` run (previous still running; account credit cap), with its reason;
   - a run with no outcome reported ("no outcome reported", never shown as done);
   - a running run (its credits are 0 until it closes, so show "running" rather than 0).

   A test in Task 4.
3. **Run now on a paused or disabled task is allowed**, on a disabled agent it is refused. The button reflects the route's answer, with the error shown. A test in Task 3.
4. **The admin review page shows approval cards read-only.** It has no decide listener today, and a click leaves the card stuck in "sending". A test in Task 5.
5. **A notification links to the page.** A failed, needs-attention or paused task event carries a URL to that run in the History tab. A test in Task 1.

---

### Task 1: Server pieces the page needs

**Files:**
- Modify: `api/src/tasks/router.ts`. `GET …/runs/:runId` returns, for a task run, the run plus `messages: runAsMessages(run)`. A conversation run is unchanged (metadata).
- Modify: `api/src/tasks/operations.ts`, `taskEvent`. Add `url` to the event, built from the deployment's public URL (see how other events or `siteUrl` are built in this codebase): `<public url>/agents/<owner.type>/<owner.id>/agents/<agentId>?tab=history&run=<runId>`.
  - The caller passes `agentId` and `runId`.
  - A `paused` event links to `?tab=tasks`.
- Modify: `api/doc/autonomous-agents/task-write-req/schema.js`. Add `'vjsf'` to `x-exports`, plus the `x-vjsf` / `x-vjsf-locales` the agent write-request schema declares.
  - Run `npm run build-types`, which generates `ui/src/components/vjsf/vjsf-task-write-req*.vue`.
  - If the scheduling `oneOf` needs layout hints for vjsf (a discriminator on `type`, as the providers array has), add them in `api/types/autonomous-agent-task/schema.js` without changing validation.
- Test: `tests/features/tasks/task-runs.api.spec.ts`. A task run's read returns `messages` with two entries: the prompt and the answer.
- Test: the task-event unit test (`tests/features/tasks/*.unit.spec.ts`). The event carries the URL.

- [ ] **Step 1.** Write the failing tests, see them fail, implement, see them pass.
- [ ] **Step 2.** `npm run build-types`, check-types, lint, unit, `tests/features/tasks` api.
- [ ] **Step 3.** Commit `feat(tasks): a task run reads as messages; events link to the agent page; a task form`.

### Task 2: The agent page, Configuration tab, and the list linking to it

**Files:**
- Create: `ui/src/pages/[type]/[id]/agents/[agentId].vue`.
  - A header with the agent title, its enabled/identity state chips (as the list shows them), and "Open chat".
  - `DfSectionTabs` with `configuration`, `tasks` and `history`. The tab is in the query (`?tab=`), so a notification URL opens the right one.
  - Breadcrumbs as the other pages set them (`setBreadcrumbs`).
- Create: `ui/src/components/agent-page/AgentConfigurationTab.vue`. The agent vjsf form (`vjsf-autonomous-agent-write-req`) with `FormActions` (save/cancel, `hasDiff`), loading the agent from `GET /api/autonomous-agents/:type/:id/:agentId` and saving with PUT. Enrolment (`useAutonomousAgentEnrolment`) and the memory dialog (`AgentMemoryDialog`) move here from the list.
- Modify: `ui/src/components/AutonomousAgentsSection.vue`.
  - Each list item links to the agent page.
  - The edit dialog, the memory button and the enrol button are removed. The page is the one place to edit an agent.
  - The create dialog stays: creating needs a title and persona before a page exists. After creating, it navigates to the new agent's page.
- Test: `tests/features/autonomous-agents/agent-page.e2e.spec.ts`:
  - From the org page's list, open an agent's page.
  - Edit its persona, save, reload: persisted.
  - The approval levels are in the form.
  - `?tab=tasks` opens the Tasks tab.
  - A non-admin instructor reaching the URL sees the access message the org page uses, not the form.
- Test: existing autonomous-agent e2e specs that used the edit dialog are updated to go through the page. Name each.

- [ ] **Step 1.** Failing e2e, then implement, then pass.
- [ ] **Step 2.** `npm -w ui run build`, lint, check-types, the autonomous-agents e2e directory.
- [ ] **Step 3.** Commit `feat(ui): one admin page per autonomous agent; the list links to it`.

### Task 3: Tasks tab

**Files:**
- Create: `ui/src/components/agent-page/AgentTasksTab.vue`.
- Test: `tests/features/tasks/tasks.e2e.spec.ts`.

**Behaviour:**
- **The list** (`GET …/tasks`). Per task:
  - title;
  - `describeScheduling(scheduling, locale)`;
  - next run, as a localized date-time;
  - an enabled switch, which saves through PUT with the whole task;
  - a paused chip with `pausedReason`, and next to it "Saving the task resumes it";
  - **Run now** (`POST …/tasks/:taskId/run`), with the route's error shown in place: a disabled agent, or a run already running;
  - edit and delete, with delete confirmed.
- **The form.** Create and edit open one dialog with `vjsf-task-write-req` (Task 1). A 400 (cap, interval, schedule) is shown in the dialog, which stays open.
- **Counter.** "N of 20 tasks", from `config.tasks.maxPerAgent` if the UI config exposes it. Check `$uiConfig`, and if it doesn't, leave the counter out rather than adding config plumbing.

- [ ] **Step 1: Failing e2e.**
  - Create a weekly task through the form. The list shows "every Monday at 08:00 (Europe/Paris)" (en) and a next run.
  - A schedule under the minimum interval shows the 400 message in the dialog.
  - Seed a paused task through the API (the test-env seam, or five failed runs as the scheduler api specs do). The paused chip, the reason and the resume hint show; saving clears the chip.
  - Run now on that task creates a run (visible in History in Task 4, so here assert the route's 201 through the UI's success message).
  - Run now on a disabled agent shows the refusal.
  - Delete removes the task.
- [ ] **Step 2.** Implement, then pass. ui build, lint, check-types.
- [ ] **Step 3.** Commit `feat(ui): an agent's planned tasks, planned and run from its page`.

### Task 4: History tab and the run view

**Files:**
- Create: `ui/src/components/agent-page/AgentHistoryTab.vue`.
- Create: `ui/src/components/agent-page/TaskRunView.vue`.
- Test: `tests/features/tasks/history.e2e.spec.ts`.

**Behaviour:**
- **The list** (`GET …/runs?kind=task` by default; a toggle shows conversation runs, `kind=conversation`; a status filter).
  - Per run: time, task title or "conversation", trigger, status, outcome status and summary (clipped), credits.
  - Each state reads distinctly:
    - `skipped` with its reason;
    - "no outcome reported" when a finished task run has no `outcome`;
    - `running` with no credits figure;
    - `error`/`interrupted` with the error.
  - Paginated as the route is (page/size).
- **Opening a task run** (`?run=<runId>`, so a notification URL lands on it) shows `TaskRunView`:
  - the run's header (task, trigger, status, outcome);
  - its `messages` rendered with the same message components the chat uses, read-only, with no composer and no cards to decide;
  - an Export button (`GET …/runs/:runId/export`);
  - Abort on a running run (`POST …/runs/:runId/abort`).
- **Opening a conversation run** links to the conversation review page that already exists (`/[type]/[id]/traces/[convId]`), not a second transcript view.

- [ ] **Step 1: Failing e2e** (mock model; seed runs through the API: run-now on a task, the credit-cap skip path from the tasks api specs, a run without `report_outcome`):
  - History lists them with the distinct labels above.
  - Opening the task run shows its prompt and answer in transcript form, and Export downloads a `.jsonl`.
  - The `?tab=history&run=<id>` URL opens directly on the run.
- [ ] **Step 2.** Implement, then pass. ui build, lint, check-types.
- [ ] **Step 3.** Commit `feat(ui): an agent's run history, a task run read like a conversation`.

### Task 5: Plan-4 leftovers on the chat side

**Files:**
- Modify: `ui/src/components/agent-chat/ApprovalCard.vue` and `AgentChatMessages.vue`. A `readonly` mode: no buttons, and a line "Awaiting the person's decision". `ConversationReview.vue` uses it.
- Modify: the activity label "Awaiting your approval: <name>" (`AgentChatMessages.vue` ~213-220). Name the call with the same title the card and the chip use: the pending part's recorded `annotations.title` via the transcript, not the raw tool name. One name.
- Test: an e2e on the review page with a pending approval: no Approve button, the read-only line shows. The approval-gate e2e asserts the activity label equals the card's title.

- [ ] **Step 1.** Failing tests, then implement, then pass. The approval-gate, planning and review e2e specs.
- [ ] **Step 2.** Commit `fix(chat): a reviewed approval card is read-only; one name for a pending call`.

### Task 6: Docs, simulation case, full suites

- Modify: `docs/architecture/planned-tasks.md`, the UI section (the page, tabs, deep links, notification URL). Also `docs/architecture/autonomous-agents.md`: editing happens on the page, and the list creates and links.
- Modify: the spec's "Order of work". Mark plan 5 done.
- Modify: `simulations/cases/index.ts`, a case `autonomous-agent-plans-too-often`.
  - An org admin asks the agent to check something "every 30 minutes" and approves the card.
  - Premise: the decided `plan_task` call ended `output-error` (the minimum interval).
  - The judge grades whether the agent then explains plainly and proposes the nearest allowed schedule.
- [ ] **Step 1.** Write the docs (every cited path exists).
- [ ] **Step 2.** The case and its premise unit test. `--list` shows it.
- [ ] **Step 3.** Full suites one at a time: unit, then api `--max-failures=0`, then e2e `--max-failures=0`. Then `docker build -t agents .`.
- [ ] **Step 4.** Commit `docs(agent-page): the admin page as built; a simulation case`.
