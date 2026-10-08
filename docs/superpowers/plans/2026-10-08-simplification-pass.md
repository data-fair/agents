# Simplification Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One way to do each thing in the agents service. Remove the duplicate paths, the leftovers and the single-user indirection the audit found, without changing what a person or an admin sees.

**Architecture:** This is mostly removal and consolidation, guided by the audit's evidence (`docs/superpowers/plans/2026-10-08-simplicity-audit.md`, cited as "Audit Fn"). Three tasks change a contract, each deliberately and each tested:
- conversation creation moves to the first prompt (F7);
- consent travels in the protocol instead of a cookie read on the server (F8);
- socket frames are declared as JSON schemas with generated types and validators, and an error frame carries a `status` (F16).

**Tech Stack:** Node 24 / TypeScript, Express, MongoDB, Vue 3 + Vuetify, `df-build-types` (JSON schema → types + ajv validators), Playwright `unit`/`api`/`e2e`.

**Spec:** the user's standing rule. The service must be as simple as possible: one way per thing, monolithic implementations with just the right modularity, no over-engineering, vetted state-of-the-art choices, and complexity in tests rather than in product code.

Scope approved on 2026-10-08:
- audit batch A: F1, F2, F3, F4, F5, F6, F10, F11, F12, F13, F14, F15, F18, F19, F22, F23, F24;
- F7, F8 and F16;
- two follow-ups from the HTTP-route removal (b9d7cff): the `status` on error frames, and the dev seed script depending on a tests helper.

Out of scope:
- F9 (one host frame), unless the user approves it later;
- F17 (render message parts directly; later);
- F20 and F21 (kept on purpose);
- F25 (only if F7 makes it fall out naturally);
- F26 (uncertain).

## Global Constraints

- Follow AGENTS.md:
  - never start, stop or restart dev processes;
  - `bash dev/status.sh` on a connection error;
  - one stateful test run at a time, in the foreground;
  - the Bash sandbox fails here, so run with it disabled;
  - git as plain separate commands.
- Quality gates before each commit touching code: `npm run lint-fix`, `npm run check-types`. Run `npm run build-types` after any schema edit.
- **Behaviour is unchanged** except in F7, F8 and F16 (and the `status` field). The proof is the unit, api and e2e suites passing.
  - Record the counts before each task, and again after it.
  - A changed count is a test deleted with its subject (dead code, a removed route or field). Name each one in the report, with why.
  - Never weaken a test to make it pass.
- No migration: nothing touched here has been stored by a release (`git grep` on `main` to confirm before dropping a stored field).
- Comments explain *why* for the current code. No history narration ("used to", "the browser loop", "the prototype", "§n").
- Each task ends with `grep` evidence that what it removed has no remaining caller in product code (api/, shared/, ui/src, lib-*, simulations/, dev/).

## Review Focus

1. **A person's chat after F7:** opening a fresh chat, the first message creating the thread, switching agents, resuming the latest thread, anonymous chats. Expected: unchanged from the person's point of view. Covered by the e2e chat specs, with tests added in Task 6.
2. **Billing after F2:** every model call is priced once, with cache tokens, poolId and run spend. Expected: the same usage records as before. Covered by the usage/quota api specs; Task 3 adds a unit test of the shared function.
3. **Review consent after F8:** a person who consented gets their personal-assistant thread reviewable; one who did not, does not; an audited thread is unaffected. Covered by tests/features/traces; Task 6 adds a socket-level test.
4. **A malformed or hostile frame after F16:** it is refused exactly as today (unknown type, bad tool names, duplicate names, a result and an error both present), with an error frame carrying a status. Covered by the agent-session protocol unit tests, kept as they are and extended.
5. **Live updates after F1:** a reloaded or second tab still gets history and live frames. Covered by the attach tests, unchanged.

---

### Task 1: Leftovers: dead code, stale schemas, stale comments (Audit F3, F5, F11, F15, F23, F24)

**Files:** per the audit entries.
- F3: delete `api/src/config-aliases.ts` and its unit test, and use the config directly.
- F5: delete the items in the F5 table, and retarget or delete the tests that only import them.
- F11:
  - `owner.type` enum becomes `['user', 'organization']` in the conversation, message and run schemas; remove the casts this frees;
  - `author.kind` gains `'task'`, or `run-messages.ts` stops writing an `author`. The second is preferred, since `author` is write-only;
  - drop `message.author` entirely (write-only, Audit F11). Check `git grep -n "author" main -- api/types/conversation-message` first: if `main` stores messages with `author`, keep the field.
- F15: delete the misleading comments the audit lists, and do one pass for "used to", "browser loop", "prototype", "gateway" and "§" in product code. Keep only what explains current code.
- F23: delete the tracked one-line shims (`index.js`/`index.d.ts` beside `index.ts`) for the task types, matching the other types. Leave the force-tracked `.type/` dirs, a pattern shared with `main`. Remove the untracked local leftovers `api/types/autonomous-agent-{run,conversation,message}/` with `rm -r` (nothing to commit).
- F24: one review page for both routes. The breadcrumb comes from the route; the two `traces/[convId].vue` pages become one component used by both. The "traces" naming stays (renaming routes is out of scope).

- [ ] **Step 1:** Record the baseline: `npx playwright test --project=unit`, then `--max-failures=0 --project=api`, then `--max-failures=0 --project=e2e`, one at a time.
- [ ] **Step 2:** Make the removals, in the order F3, F5, F11, F23, F24, F15. After each, run `npm run check-types` and the unit project.
- [ ] **Step 3:** Run `npm run build-types`, lint and types, then the three suites. Expected: the same counts, minus the deleted tests named in the report.
- [ ] **Step 4:** Commit: `chore(cleanup): remove leftovers — dead code, stale schemas and comments`.

---

### Task 2: Indirection with a single user (Audit F12, F13, F14, F18)

- F12: inline the session providers in `performTurn`. `SessionProvider` stays a type where it is consumed (`mcp-servers/client.ts`). Delete `api/src/agent-identity/` if nothing else remains in it; check `nhiSessionProvider`'s other uses first (`grep -rn "agent-identity" api/src`). The diagnostic route may use it.
- F13:
  - move the task-run half of `recoverOwnerlessRuns` into `api/src/tasks/execution.ts` (`recoverOwnerlessTaskRuns`), and call both from `server.ts` (boot and the 30 s pass) and from the dev seam;
  - move `wakeIfAnswered` to `api/src/conversations/waits.ts`, and import it in `turn-target.ts` instead of injecting it. If that still makes a cycle, import it anyway: ESM tolerates function-level cycles not used at evaluation. Prove it with the suites.
- F14: `PERSONAL_AGENT_ID` and one builder replace the `STANDARD_AGENTS` registry, the descriptors and `listStandardAgents`. `isStandardAgentId(id)` becomes `id === PERSONAL_AGENT_ID`. The UI's literal `'personal'` uses a shared constant (`shared/agent-audit.ts` already lists the standard ids: make it `PERSONAL_AGENT_ID`, plus `isAuditedAgentId`). Keep the `/agents` route's response shape.
- F18:
  - extract `rebuildNhi(body, req)` for the agent POST and PUT;
  - derive `AUTONOMOUS_AGENT_WRITABLE_KEYS` from the write-req schema (`Object.keys(writeReqSchema.properties)`) and delete the sync unit test that compared the two copies. Its subject disappears.

- [ ] Steps: baseline; change; build-types, lint, types; the three suites (same counts, minus tests named); commit `refactor(cleanup): remove single-user indirection`.

---

### Task 3: One way to charge a model call (Audit F2)

**Files:**
- Create: `chargeModelCall` in `api/src/usage/service.ts`
- Modify: the 7 sites in the audit (executor lead step and sub-agent worker, `turn-history.ts` compaction, `turn-gates.ts`, `moderation/service.ts` ×2, `memory/reflection.ts`, `summary/router.ts`)
- Test: `tests/features/usage/charge-model-call.unit.spec.ts` for the pure pricing half, extracted as `priceModelCall(usage, entry, eurosPerCredit)` in `usage/operations.ts` if not already `computeCreditBreakdown`

**Interface:**

```ts
/**
 * Price one model call and record it everywhere it counts: usage (with the untrusted pool), the run's
 * spend and telemetry when a run is given. ONE function, because the seven copies it replaces had
 * already drifted (cache tokens ignored by compaction; the pool id fixed at three sites separately).
 */
export async function chargeModelCall (input: {
  owner: AccountKeys
  identity: UsageIdentity
  modelRole: ModelRole
  entry: CatalogEntry
  usage: { inputTokens?: number, outputTokens?: number, noCacheTokens?: number, cacheReadTokens?: number, cacheWriteTokens?: number, finishReason?: string }
  run?: { id: string, steps?: number, durationMs?: number }
}): Promise<CreditBreakdown>
```

It does the following:
- `computeCreditBreakdown(...)`;
- `recordUsage` (only when total > 0, with `poolId`);
- `incrementRunSpend(run.id, total, run.steps ?? 0)` and `recordCall(run, …)` when a run is given.

It returns the breakdown, so callers that bound a budget keep doing it.

- [ ] Steps:
  1. baseline;
  2. a unit test of `computeCreditBreakdown` with cache tokens, if one does not exist;
  3. implement `chargeModelCall`;
  4. replace each site, keeping each site's role, identity and run semantics exactly. Read each first: compaction bills the run, moderation does not, and so on;
  5. lint, types, and the three suites. Pay attention to `tests/features/usage`, `quotas`, `moderation`, `memory`, `tasks`. Same counts;
  6. commit `refactor(usage): one function charges a model call`.

---

### Task 4: One live channel and one run route (Audit F1, F19, F6)

- F1:
  - remove the HTTP polling surface: `bumpConversationVersion` and every `version` write and field (conversation, message, run schemas), the `sinceVersion`/`sinceSeq` filters on `GET …/messages`, and the UI mapper's `mergeBySeq`/`messagesToChat`/`runId`;
  - `rejectPendingApprovals`'s re-read by version: replace it with a re-read of the messages it matched (collect their seqs before the update);
  - delete the api tests that asserted versions or cursors, and name them;
  - keep `GET …/messages` and `GET …/runs` of a conversation as plain full reads (the export and review paths, and tests).
- F19: one `createRun` (both kinds, no version bump) and one close: `finishTurn` keeps the message write for conversations, and the buffer-drain-plus-loser block exists once, shared by both kinds.
- F6:
  - move the task-run abort to `POST /api/autonomous-agents/:type/:id/:agentId/runs/:runId/abort` (tasks router, admin);
  - delete `runsRouter` (`/api/runs`) and `assertMayReachRun`;
  - tests that read a run through `/api/runs/:runId` switch to the agent's `GET …/runs/:runId` (admin) for task runs. For conversation runs they use the conversation's runs list (`GET …/:conversationId/runs`, owner);
  - update the socket-turn helper (`tests/support/socket-turn.ts`) accordingly.

- [ ] Steps: baseline; remove; build-types, lint, types; the three suites (same counts, minus tests named); commit `refactor(chat): the socket is the only live channel; one route per run kind`.

---

### Task 5: One chat UI, one tool partition, the test seams in one place (Audit F4, F10, F22)

- F4: delete `ui/src/pages/_dev/session-chat.vue`. Port its spec's two assertions to the real chat on an existing `_dev` page (`_dev/chat.vue` or `chat-live-tools.vue`): a turn streams into the page, and a page-only tool is called by the server. Delete `tests/features/agent-session/session-chat.e2e.spec.ts` once ported.
- F10: drop the browser-side tool partition (`ui/src/utils/tools-partition.ts`, `repartition()` on every tool change). The debug dialog shows the server's record of the last turn's offered tools (`run.toolNames`, already stored), read when the dialog opens. Delete the partition's unit tests (their subject disappears) and name them.
- F22: move the `/api/test-env/*` seams out of `app.ts` into `api/src/test-env/router.ts`, mounted under the same `NODE_ENV === 'development'` guard, with no behaviour change. Move the dev in-memory record of pushed task events from `tasks/notifications.ts` into that module (a wrapper the router installs), so the product notifier has no dev branch.

- [ ] Steps: baseline; change; lint, types, the three suites (same counts, minus tests named, plus ported ones); commit `refactor(ui): one chat UI and one tool partition; test seams in their own module`.

---

### Task 6: One way to start a conversation and to send consent (Audit F7, F8)

**F7:**
- A `hello` without `conversationId` binds to nothing, for signed-in and anonymous callers alike.
- The first `prompt` on such a socket creates the thread server-side, with the same checks as the HTTP create route (`assertCanOwnAgent`, `assertMayTalkTo`) and the same title rule. The `attached` frame (or the first `message` frame) names the new id.
- Delete:
  - the HTTP `POST /api/conversations/:type/:id` create route;
  - the client's `createConversation`, eager mode and `lazyConversation`;
  - the `'pending'` sentinel;
  - most of `start()`.
- Keep: resuming the latest thread (`findLatestConversation`, a read), switching agents, anonymous chats.
- If the eager mode's one real benefit (a revoked grant reported immediately when the chat opens) matters, the `hello` answer carries the refusal for the selected agent without creating anything. Implement that, so the behaviour survives.

**F8:**
- The client sends its current review consent in `hello` and in the existing `trace-consent` frame on change.
- The server stops parsing the cookie (`hasTraceConsent(req.headers.cookie)` at upgrade).
- `setReviewConsent` on each turn reads the session's consent as today.
- The cookie stays the browser's own persistence.

**Tests:** extend the agent-session protocol unit tests (hello with consent; hello without a conversation then a prompt creates it). API tests via the socket helper:
- the first prompt creates the thread and the `attached` frame names it;
- a person who may not talk to the agent gets an error at `hello`, or at the first prompt, and nothing is created;
- consent sent in `hello` makes a personal-assistant thread reviewable.

E2E: the existing chat specs, which open a fresh chat and send a first message, must pass unchanged.

- [ ] Steps: baseline; failing tests; implement; build-types, lint, types; the three suites; commit `feat(chat): the first prompt starts a conversation; consent travels in the protocol`.

---

### Task 7: The socket protocol as JSON schemas; error frames carry a status (Audit F16, plus a removal follow-up)

**Files:**
- Create: `api/types/agent-session-client-frame/schema.js` (a `oneOf` on `type`, one branch per client frame: `hello`, `prompt`, `approval`, `abort`, `trace-consent`, `host-events`, `host-state`, `tools-changed`, `tool-result`, and every frame `parseClientMessage` accepts today). It carries the strict rules as schema constraints: the tool-name charset, `uniqueItems` on names, `oneOf` result/error, and length limits.
- Same for the server frames (`agent-session-server-frame`), typed only: the client keeps a lenient `JSON.parse` + switch on `type` that ignores unknown types.
- Modify: `shared/agent-session-protocol.ts`:
  - `parseClientMessage` becomes the generated validator plus the same custom error texts (`errorMessage` keywords, as other schemas in this repo do);
  - the hand-written unions become the generated types;
  - `parseServerMessageForClient` keeps only type dispatch.
- Error frame: `{ type: 'error', status: number, message: string }`. Statuses:
  - 400 for a malformed frame;
  - 403 for not allowed;
  - 404 for an unknown conversation or approval;
  - 409 for a conflict (a decision already taken, a turn still finishing).
- Modify: the session's error paths, so each passes its status (map from the `httpError` status where one is thrown).
- Modify: `tests/support/socket-turn.ts`: stop mapping message text to a status, and read `status`.

**Tests:**
- every existing protocol unit test passes unchanged in what it asserts (the refusal and its message);
- add tests for `status` on each error class;
- run `npm run build-types`.

- [ ] Steps: baseline; failing tests for `status`; schemas; switch parsing to the validators; lint, types; the three suites; commit `refactor(protocol): socket frames are JSON schemas; error frames carry a status`.

---

### Task 8: Untangle the dev seed, docs, and the full pass

- The dev seed script (`dev/fixtures.ts`) imports the test helper `tests/support/socket-turn.ts`.
  - Move the socket client helper to a module both may import: `dev/socket-turn.ts`, re-exported by `tests/support/socket-turn.ts`. Or keep it in tests and give the seed its own minimal client if that is simpler.
  - A dev script must not depend on `tests/`.
- Docs:
  - `docs/architecture/*.md`: remove mentions of what this plan removed (the HTTP create and message routes, `/api/runs`, versions and polling, standard-agent registry wording, the cookie consent read);
  - describe the first-prompt creation, the consent field, the frame schemas and the error status;
  - `AGENTS.md` if it mentions any of them.
- The full pass, one at a time:
  - `npm run lint-fix`, `npm run check-types`;
  - unit, api, e2e;
  - `docker build -t agents .`

- [ ] Commit `docs(cleanup): the simplified service as it is`.
