# Simplicity audit — branch `feat-autonomous-agents` vs `main`

Read-only. Scope: api/, shared/, ui/, lib-vue/, lib-vuetify/, lib-sim/, simulations/ (generated `.type/`, `validate.js`, `ui/src/components/vjsf/*` skipped).
Out of scope (in progress elsewhere): removing `POST …/:conversationId/messages` and `POST …/approvals/:approvalId`, narrowing `POST /api/runs/…/abort` to task runs. Several findings below become *more* true once that lands, and say so.

Method: `git diff --stat main...HEAD`, reading the core modules (executor, turn-target, service, router, agent-session/*, use-session-chat, use-agent-session, AgentChat, protocol), and grep-based caller counts. "prod callers" = importers under api/src, shared, ui/src, lib-*, simulations, dev — excluding tests. Anything not verified is marked **(uncertain)**.

Sizes: S < ~1h, M = half-day to a day, L = several days.

## Counts per category

| Category | Findings |
|---|---|
| 1. Two ways to do one thing | 9 (F1, F2, F4, F6, F7, F8, F9, F10, F17) |
| 2. Leftovers (dead code, stale schemas/comments, test-only modules) | 8 (F3, F5, F11, F15, F18, F19, F23, F24) |
| 3. Single-user abstractions / cycle dodges | 4 (F12, F13, F20, F25) |
| 4. Over-engineering | 4 (F14, F16, F21, F22) |
| 5. Divergence from state of the art / stack primitives | 2 (F16 also, F26) |

(F16 counts in both 4 and 5.) Total: 26 numbered findings. Ranked by value (simplicity gained per effort), highest first.

---

## F1 — An HTTP polling protocol (`version` counter + `?sinceVersion`/`?sinceSeq`) that no client uses  — cat. 1/2, **M**, high value

**Where**
- `api/src/conversations/service.ts:233-249` `bumpConversationVersion`, called by `appendMessage` (:264), `updateMessage` (:289), `settleStoredToolPart` (:311), `decideApproval` (:346), `rejectPendingApprovals` (:420), `createRun` (:447), `finishTurn` (:587); `createTaskRun` writes `version: 1` (:457).
- `api/src/conversations/router.ts` `GET /:type/:id/:conversationId/messages` (sinceVersion/sinceSeq cursor, returns `version`), `GET /:type/:id/:conversationId/runs`.
- `version` fields in `api/types/conversation/schema.js:74`, `conversation-message/schema.js:81-84`, `conversation-run/schema.js:146-148`.
- `ui/src/utils/autonomous-agent-chat-message.ts:100-117` `messagesToChat`, `mergeBySeq` (and `StoredConversationMessage.runId`, documented as read by a "run-status strip" that no longer exists).
- Comments built around it: `finishTurn` doc (:564-578, "the end-of-turn signal a reader polling `?sinceVersion=` stops on"), `saveCompaction` doc (:628-634), `createRun` / `startRun` docs ("the run document is how a caller follows along").

**Evidence**
- `grep -rn "sinceVersion\|sinceSeq" ui/src lib-sim simulations` → only a comment in `autonomous-agent-chat-message.ts`; the only callers are `tests/features/autonomous-agents/runtime.api.spec.ts` (:223-234, :980-1041).
- `grep "apiPath}/conversations" ui/src` → only list/create/agents (use-session-chat.ts:316,338; AgentChat.vue:333,343). No UI or lib-sim call to `/messages`, `/runs`, or `/api/runs`.
- `mergeBySeq` / `messagesToChat`: zero prod callers, only `tests/features/autonomous-agents/chat-message.unit.spec.ts`.
- The chat is fed by the socket (`sendHistory` + `message` frames), which keys by `seq`, not by version.

**Simplest fix**: once the socket-only change lands, drop the polling surface: remove `bumpConversationVersion` and every `version` write/field, the `sinceVersion`/`sinceSeq` filters, `mergeBySeq`/`messagesToChat`/`runId` in the UI mapper, and the related comments. Keep `GET …/messages` only if an external API client is an intended product (then a plain full read suffices).
**Risk**: medium-low. One real internal use: `rejectPendingApprovals` (:438) re-reads "messages changed by this update" with `{ version }` to push frames — replace with the filter it already has (`conversationId` + the rejected states) or `findOneAndUpdate` per message. Several api specs assert on versions and need deleting.

## F2 — Seven hand-copied "price a model call → record usage (→ run spend → run telemetry)" blocks — cat. 1, **M**, high value

**Where**: `executor.ts:489-545` (sub-agent worker step), `executor.ts:634-668` (lead step), `turn-history.ts:167-208` (compaction), `turn-gates.ts:~150` (moderation telemetry), `moderation/service.ts:195-225` and `:302-320`, `memory/reflection.ts:208-229` (`bill`), `summary/router.ts:77-96`.

**Evidence**: `grep -rn "recordUsage(\|computeCreditBreakdown(\|recordCall(" api/src` → 7 `computeCreditBreakdown`+`recordUsage` sites, 3 `recordCall` sites. Drift already happened twice: the comment repeated at three sites "without it [poolId], their chat spend never reached the pool"; compaction (turn-history.ts:167) passes no cache-token details while the lead step does.

**Simplest fix**: one `chargeModelCall({ owner, identity, role, entry, usage, run?, steps? })` in `usage/service.ts` that prices, records usage (with poolId), increments run spend and records the call when a run is given. Each site becomes one call. Removes ~120-150 lines and the drift class.
**Risk**: medium (billing). Covered by existing usage/quota api specs.

## F3 — `config-aliases.ts`: a deprecation mechanism for names that were never released — cat. 2, **S**, high value per effort

**Where**: `api/src/config-aliases.ts` (whole file), `api/src/config.ts:4,10-11`, comment in `api/config/custom-environment-variables.js` ("Formerly AUTONOMOUS_AGENT_RUN_CREDITS …").
**Evidence**: `git grep -c "autonomousAgentRun" main -- api` → no match. The old keys `autonomousAgentRunCredits`/`autonomousAgentRunTimeoutSeconds` exist only on this branch; no deployment can be setting them. Matches the project's own rule (memory: "migrate only data a release stored").
**Fix**: delete the file and its unit test; `config.ts` validates `nodeConfig` directly; drop the comment.
**Risk**: none.

## F4 — `ui/src/pages/_dev/session-chat.vue`: a second chat UI survived — cat. 1, **S-M**, high value

**Where**: `ui/src/pages/_dev/session-chat.vue` (220 lines): its own transcript, its own `useAgentSession` wiring, its own conversation creation (`$fetch …/conversations` :203), its own aggregator.
**Evidence**: the only consumer is `tests/features/agent-session/session-chat.e2e.spec.ts` (2 tests: "a turn runs on the server and streams into the page", "the server calls a tool that only exists in this page"). It is the prototype's page, exactly the duplicate-chat pattern the user already removed once; `use-agent-session.ts`'s header still argues for keeping layers this page uses.
**Fix**: delete the page; port the two assertions onto the real chat on an existing `_dev` page (`_dev/chat.vue` / `chat-live-tools.vue` already register page tools).
**Risk**: low (dev page). The `data-first-token-ms` measurement it exposes would go; recreate in the spec if wanted.

## F5 — Dead product code that only tests import (or nobody) — cat. 2, **S** each, high value per effort

| Item | Where | Evidence |
|---|---|---|
| `summarizeToolArguments` / `TOOL_ARGUMENTS_LIMIT` | `ui/src/utils/tool-arguments.ts` | 0 prod importers; header says "the executor writes it into a run's trace, and the run-status strip shows it" — neither exists. 1 unit test. |
| `isEmptyTurn` | `ui/src/composables/empty-turn.ts` | 0 prod importers; browser-loop logic, the server now does it (`EMPTY_COMPLETION_MESSAGE`, executor.ts:1039). Tests: `empty-turn/1.empty-turn.unit.spec.ts`, `runtime.unit.spec.ts`. |
| `useFrameTools` | `ui/src/composables/use-frame-tools.ts` | 0 importers, already dead on `main`; `use-session-chat` builds its own aggregator. |
| `mergeBySeq`, `messagesToChat`, `StoredConversationMessage.runId` | `ui/src/utils/autonomous-agent-chat-message.ts:100-117` | see F1. |
| `ChatMessage.stepLimitReached` | `ui/src/utils/chat-message.ts:33-37` | never set or read in ui/src; comment refers to browser-loop `toModelOutput`. |
| `liveAgentSessionCount`, `attachedSessionCount` | `api/src/agent-session/service.ts:34`, `registry.ts:59` | 0 references anywhere ("the prototype's … signal"). With them gone, the `sessions` Map in service.ts serves only the `callOnlyLiveAgentSession` test seam and shutdown. |
| `ModerationRun.traceInfo`, `.cost`, `ModerationVerdictRecord` and the `trace` bookkeeping | `api/src/moderation/service.ts:108-115,145,263`, `moderation/types.ts:9-15` | `grep traceInfo` → only the definition; `.cost()` never called. "for trace embedding" — traces are gone. |
| `export default useSessionChat` | `use-session-chat.ts` last line | only the named export is imported. |
| SSR guard `if (typeof window === 'undefined') return undefined` + `if (!chatResult) throw` | `use-session-chat.ts` top, `AgentChat.vue:~306` | "Matches `useAgentChat`'s contract" — that composable is gone; the UI is an SPA. |

**Fix**: delete; delete or retarget the tests. **Risk**: none to low.

## F6 — Two routes read a run — cat. 1, **S**, medium-high value

**Where**: `GET /api/runs/:type/:id/:runId` (`conversations/router.ts`, `runsRouter`, guarded by `assertMayReachRun`) and `GET /api/autonomous-agents/:type/:id/:agentId/runs/:runId` (`tasks/router.ts:105-119`, admin-only, strips telemetry for conversation runs). Mounted in `app.ts` as `/api/runs` and inside the tasks router.
**Evidence**: different authorization and projection for the same document. No UI/lib-sim caller of `/api/runs` (grep of `apiPath}/` prefixes). After the in-progress change narrows abort to task runs, `/api/runs` holds a task-run abort beside a generic read, while every other task-run route lives in the tasks router.
**Fix**: move the (task-run) abort to `POST /api/autonomous-agents/:type/:id/:agentId/runs/:runId/abort` in `tasks/router.ts`, delete `runsRouter` and `assertMayReachRun`. A person's conversation runs, if needed at all, are already `GET …/conversations/…/:conversationId/runs` (also no in-repo client, see F1).
**Risk**: low; coordinate with the in-progress abort change.

## F7 — Two ways to create a conversation, plus a lazy/eager switch and a `'pending'` sentinel — cat. 1, **M**, medium value

**Where**: HTTP `POST /api/conversations/:type/:id` (signed-in, `conversations/router.ts`) vs the socket `hello` (anonymous, `agent-session/service.ts` `anonymousHello` → `createAnonymousConversation`). On the client: `createConversation`, `findLatestConversation`, `newConversation`, `start()` with three branches, `lazyConversation` (only `AgentChat.vue:288`, `= props.multiAgent`), and the `'pending'` echo (`session.ts` `conversationId ?? 'pending'`, filtered in `use-session-chat.ts` watch, comment "treating that as an id would make the first send skip creation").
**Evidence**: the protocol already defines "a hello without conversationId starts a fresh thread" — just only for anonymous callers. Signed-in hello without an id gets `'pending'`.
**Fix**: one rule for both: a hello without `conversationId` binds to nothing; the first `prompt` creates the thread server-side (same checks as the POST route: `assertCanOwnAgent`, `assertMayTalkTo`) and `attached`/`message` frames name it. Then drop the HTTP create route (or keep it only for API clients), the eager mode, `'pending'`, and most of `start()`.
**Risk**: medium — touches front-office behaviour ("eager chat reports a revoked grant immediately", use-session-chat.ts switchAgent doc) and several e2e specs. **(uncertain whether the user wants the HTTP create route kept for external clients.)**

## F8 — Consent reaches the server two ways — cat. 1, **S-M**, medium value

**Where**: cookie parsed at upgrade (`agent-session/service.ts` `hasTraceConsent(req.headers.cookie)`) **and** a `trace-consent` frame (`shared/agent-session-protocol.ts`, `session.ts` `case 'trace-consent'`, `use-session-chat.ts` `watch(consentRef …)`); the HTTP message route reads the cookie a third way (being removed). Then copied onto the conversation on every turn (`turn.ts` `setReviewConsent`).
**Evidence**: the frame exists only because "the cookie is only read at UPGRADE" (protocol comment).
**Fix**: the client sends its current consent in `hello` and on change (or on each `prompt`); the server stops parsing the cookie (`hasTraceConsent` in `shared/trace-consent.ts` then has no server consumer). The cookie stays the browser's own persistence.
**Risk**: low; lib-sim sets the cookie before page load, which still works (the client reads it and sends it).

## F9 — Page facts travel in two frames (`host-state` and keyed `host-events`) — cat. 1, **S-M**, medium-low value **(uncertain)**

**Where**: `shared/agent-session-protocol.ts` `host-state` / `host-events`; `session.ts` converts `host-state` entries into keyed events pushed on the same `HostEventStore`, `null` meaning withdraw; `use-session-chat.ts` sends withdrawals as `reportHostState({ [key]: null })` and events as `host-events`; `AgentChat.vue` `hostContext` uses `host-state`.
**Evidence**: both end as `hostEvents.push({ key, … })` / `withdraw(key)` on one store.
**Fix**: one `host-events` frame whose events may be keyed, plus an explicit `{ key, withdrawn: true }` event; drop `host-state`.
**Risk**: low, protocol-internal (both ends in this repo). Value is modest; do it if the protocol is touched anyway (F16).

## F10 — A second tool partition runs in the browser on every tool change, only for the debug dialog — cat. 1, **S**, medium value

**Where**: `ui/src/utils/tools-partition.ts` (93 lines) vs `api/src/agent-session/sub-agents.ts` `partitionSubAgents`; `use-session-chat.ts` `repartition()` called from `onToolsChanged`, i.e. on every navigation/frame change, and it CALLS every `subagent_*` tool to read its roster.
**Evidence**: `resolvedPartition` is read only by `AgentChat.vue` → `AgentChatDebugDialog`.
**Fix**: compute it when the debug dialog opens (or show the server's own record, `run.toolNames`, already stored per turn). Keeps one partition that matters (the server's).
**Risk**: low.

## F11 — Stale schemas forcing casts — cat. 2, **S**, medium value

- `owner.type` is `enum: ['organization']` in `api/types/conversation/schema.js:30`, `conversation-message/schema.js:17`, `conversation-run/schema.js:43`, but personal-assistant conversations live on user accounts. Worked around by casts: `service.ts` `owner as Conversation['owner']` (comment "Typed organization-only by the schema, but a standard agent's thread may sit on a personal account"), `resolveAgent` `as unknown as AutonomousAgent`. Fix: `['user', 'organization']`.
- `conversation-message` `author.kind` enum is `['user', 'autonomous-agent']` while `tasks/run-messages.ts:19` writes `{ kind: 'task' }`.
- `message.author` itself is **write-only**: written in `turn.ts:110`, `executor.ts:1190` (`userName: conversation.title` for the assistant!), the HTTP route; `grep "\.author\b"` finds no reader outside memory versions (a different `author`). It is the shared-timeline attribution, obsolete now that "a conversation belongs to ONE person" (service.ts `assertOwnsConversation`). Fix: drop the field (role + `conversation.userId` say it).
**Risk**: low; no upgrade needed for an unreleased collection.

## F12 — `agent-identity/`: a two-file "port" for two one-liners — cat. 3, **S**, medium-low value

**Where**: `api/src/agent-identity/operations.ts` (type `SessionProvider` + `forwardedSessionProvider = c => async () => c`), `agent-identity/service.ts` (`nhiSessionProvider` + a re-export). One caller: `executor.ts:283-285`.
**Fix**: inline in `performTurn`: `const cookie = autonomousAgent.nhi ? () => getAutonomousAgentSession(autonomousAgent) : async () => session?.sessionCookie()`; keep `SessionProvider` as a type in `mcp-servers/client.ts` where it is consumed. Two implementations exist, so the *function type* is fine; the module pair and re-export are the indirection.
**Risk**: none.

## F13 — Import-cycle dodges — cat. 3, **S**, medium-low value

- `wakeIfAnswered` is passed into `conversationTarget(…, wakeIfAnswered)` "rather than imported (that would be a cycle)" (`turn-target.ts:246-253`, `executor.ts:1198`).
- `recoverOwnerlessRuns` does `await import('../tasks/execution.ts')` "a static import would be a cycle" (`executor.ts:1373-1375`).
**Fix**: move the task-run half of `recoverOwnerlessRuns` (executor.ts:1365-1380) into `tasks/execution.ts` and call both from `server.ts`; move `wakeIfAnswered` to `waits.ts` beside `settlePendingWait` (or simply import it: ESM tolerates function-level cycles that are not used at module evaluation).
**Risk**: low.

## F14 — `standard-agents.ts`: a registry, descriptors and a list API for exactly one agent — cat. 4, **S-M**, medium-low value

**Where**: `api/src/agent-session/standard-agents.ts` (`STANDARD_AGENTS` with only `personal`, `StandardAgentDefinition.instructions` never set, `StandardAgentDescriptor`, `listStandardAgents`, comments "a deployment that wants its own adds one here (and later through configuration)"); loops over it in `conversations/router.ts` (`/agents`, history filter). The literal `'personal'` is repeated in the UI (`use-session-chat.ts` `activeAgentId = ref(options.agentId ?? 'personal')`, `AgentChat.vue` `agentId === 'personal'`).
**Fix**: `PERSONAL_AGENT_ID` + one `personalAgent(owner, catalog)` builder; `isStandardAgentId(id) → id === PERSONAL_AGENT_ID`. Re-generalise only when a second standard agent is actually planned.
**Risk**: low. **(Check plan 4/5 first: if "self-knowledge" adds a second built-in agent, keep the registry.)**

## F15 — Stale comments describing code that is gone — cat. 2, **S-M**, medium value (readability)

Counts in product code: "gateway" 23, "browser loop" 25, "used to" 48, "prototype" 6, "§" refs 8, "(since removed)" 4. The ones that now mislead (say something false about current code):
- `app.ts`: three orphaned comment blocks stacked before `/api/test-env/autonomous-agent` ("Dev-only seams for the boot sweep…", "…per-conversation serialisation…", "Enrolment cannot be completed…") describe seams defined elsewhere; memory-command seam says "before the tool itself is wired into a turn" — it is wired (`service-tools.ts`).
- `autonomous-agents/router.ts:20-22`: "api/src/traces/router.ts has the same constraint" — file deleted.
- `AgentChat.vue` `agentId` prop doc: "Not yet consulted on THIS path: the browser loop assembles its own instructions…" — false, it is consulted.
- `AgentChat.vue` `startActionSession`: "(see use-agent-chat sendMessage)".
- `ui/src/utils/agent-flags.ts:1-6`: cookie "rides along on every chat-completion call (the server records them onto stored traces)" and "imported by the unit-tested trace reconstruction layer" — no server reader (`grep agent-chat-flags api` → none), trace reconstruction deleted. (The cookie could then be plain localStorage, optional.)
- `conversations/service.ts:25-31`: dangling JSDoc "Authorization for every runtime route…" with no declaration under it; `:463-470` "Add one step's spend to a run…" sits above `setReviewConsent`, not `incrementRunSpend`.
- `executor.ts:198-201` "The gateway aborted the response in that case"; `use-session-chat.ts` header ("This is the SWAP", "§7's judgment", "compare this file's length to the 1229 lines it replaces"); `session.ts` "The loop lands here; until then a session is a transport", "§4.4's work"; `service.ts` `callOnlyLiveAgentSession` "which is §4.4"; `standard-agents.ts` "finding §5b.7", "§5b.2"; `resolveAgent` "the claim this prototype tests".
**Fix**: one pass deleting history narration; keep only what explains current code. **Risk**: none.

## F16 — Hand-written frame parsers instead of the project's schema-driven validation — cat. 4/5, **M**, medium value **(judgement call)**

**Where**: `shared/agent-session-protocol.ts` `parseClientMessage` (strict, ~130 lines) and `parseServerMessageForClient` (lenient, ~80 lines), with hand-written TS unions beside them.
**Evidence**: every other boundary in the service is a JSON schema compiled to types + ajv validator (`api/types/*/schema.js`, `#doc/*`, AGENTS.md "Types are mostly managed from JSON schemas"). Here the type and the validator are two hand-kept copies. The client parser re-validates field by field frames from our own server.
**Fix**: declare the client frames as one JSON schema (oneOf on `type`) and generate type + validator like the rest; on the client, `JSON.parse` + switch on `type`, ignoring unknown types (the stated reason for leniency) without per-field checks.
**Risk**: medium (security-sensitive boundary; keep the strict rules — name charset, unique tool names, exactly-one-of result/error — as schema constraints). The tool-name and the custom error messages are the main things to preserve.

## F17 — Two representations of a message in the UI — cat. 1, **L**, medium value, do later

**Where**: stored `MessagePart[]` (shared/message-parts.ts) → `autonomousAgentMessageToChat` → legacy `ChatMessage` (`ui/src/utils/chat-message.ts`, "Moved verbatim from the browser loop's composable"), which `AgentChatMessages`, `ConversationReview`, sub-agent panels render.
**Evidence**: the mapper exists so "the transcript is reused unchanged" after the browser loop went; it flattens text parts into `content`, loses step boundaries, maps 7 tool states onto 4.
**Fix**: render `MessagePart[]` directly in `AgentChatMessages`; delete `ChatMessage` and the mapper.
**Risk**: medium-high (largest UI change here; many e2e specs). Value is real but effort is the largest; schedule after F1-F10.

## F18 — Duplicated NHI rebuild in agent POST/PUT, and a hand-maintained writable-key list — cat. 2, **S**, low-medium

- `autonomous-agents/router.ts` POST (:58-72) and PUT (:163-177) repeat the same 10-line comment and the same `nhi` strip/rebuild. Extract `rebuildNhi(body, req)`.
- `ui/src/utils/autonomous-agent-draft.ts` `AUTONOMOUS_AGENT_WRITABLE_KEYS` is a copy of the write-req schema's properties "kept in sync by a unit test". Derive from the schema (`Object.keys(schema.properties)`) instead of testing a copy.
**Risk**: none.

## F19 — Run-close and run-create duplicated per kind — cat. 2, **S**, low

`service.ts`: `finishRun` → `finishTurn`; `finishTaskRun` repeats the "losing racer still owes the buffer" block verbatim (:600-606 vs :617-621). `createRun` vs `createTaskRun` differ only by the version bump (which F1 removes). After F1, one `createRun` and one `closeRun(run, patch, message?)` suffice.
**Risk**: low.

## F20 — Service-tool "registry" (`applies`/`build` entries) — cat. 3, **no action now**

`api/src/conversations/service-tools.ts`: 3 entries behind an `ENTRIES[]` + `applies/build` indirection, where three `if`s would read the same. Justified only if plan 4 adds entries (`plan_task`, self-knowledge) — which it does. Keep; listed so it is a conscious choice.

## F21 — `autonomousAgentsRequireAdminMode` rollout flag — cat. 4, **no action now**

`api/config/default.js`, `reqWriteSession` in `autonomous-agents/service.ts`, 3 routers + memory router. A temporary gate (memory: "superadmin gate is temporary"); the long comment in `conversations/router.ts:29-44` explains why runtime routes ignore it. Remove with plan 5 (admin page); until then keep.

## F22 — 300 lines of test seams in `app.ts`, and a dev event buffer in a product module — cat. 4, **S**, low

- `app.ts:66-417`: ~25 `/api/test-env/*` routes (all used by tests — verified by grep) inline in the app file. Move to `api/src/test-env/router.ts` mounted under the same NODE_ENV guard: no behaviour change, the product app file becomes readable.
- `tasks/notifications.ts`: `devRecord`/`pushedTaskEvents` buffer inside the product notifier. Could live in that test-env router as a wrapper. Low priority.

## F23 — Tracked generated shims, inconsistent with the other types — cat. 2, **S**, low

`api/types/autonomous-agent-task/index.js` + `index.d.ts` and `api/doc/autonomous-agents/task-write-req/index.js` + `index.d.ts` are tracked one-liners (`export * from './.type/index.js'`) beside `index.ts`; the other new types have `index.ts` only. Also `api/doc/autonomous-agents/autonomous-agent-write-req/.type/*` and `api/types/autonomous-agent/.type/*` are force-tracked despite `.type/` in `.gitignore` (the same pattern exists on main for `settings/put-req` and `limits/post-req`, so check intent before changing).
Note on the caller's example: `api/types/autonomous-agent-run/`, `autonomous-agent-conversation/`, `autonomous-agent-message/` are **not in git** — untracked local directories holding only a gitignored `.type/` from an old build. Local `rm -r` only; nothing to commit.

## F24 — Duplicate review pages (pre-existing) and "traces" naming — cat. 2, **S**, low

`ui/src/pages/[type]/[id]/traces/[convId].vue` and `ui/src/pages/admin/[type]/[id]/traces/[convId].vue` are identical except the breadcrumb target (already so on main). One page with the breadcrumb from a prop or route meta would do. The "traces" word survives in routes, `TracesSection`, `ui/src/traces/` (one file), `storeTraces` for what is now conversation review — naming only, do it if F15's pass touches them.

## F25 — `use-agent-session.ts` / `use-session-chat.ts` split justified by a test's compilation context — cat. 3, **no action / low (uncertain)**

The split is defended in the header ("two COMPILATION CONTEXTS") because a unit test imports `toDescriptors`. That is test convenience shaping product structure; with F4 done, `use-agent-session` has one consumer. Low value; leave unless the composables are reworked for F7/F8.

## F26 — `recoverOwnerlessRuns` reads `@data-fair/lib-node/locks` internals — cat. 5, **S**, low-medium **(uncertain)**

`executor.ts:1335-1338` and `:1367-1368` query `mongo.db.collection('locks')` with `_id` regexes, i.e. lib-node's storage layout, to know which conversations/tasks are held. If lib-node changes its storage, recovery silently resumes runs that are live elsewhere. I did not verify whether lib-node exposes a query for held locks; if not, either add one to lib-node (memory: "justify any lib change with numbers") or try `locks.acquire` per candidate (which it already does for resumes via `startRun`).

---

## Not findings (checked, fine)

- `TurnTarget` with conversation and task implementations: two real implementations.
- `HostEventStore` in `shared/` used by both sides; `subscribeHostEvents` sanitizing at the BroadcastChannel boundary.
- Simulation `surface` option: only drives seeding; the driver has one chat surface.
- Approval policy, compaction policy, loop guards: pure modules with one prod importer each plus unit tests — appropriate modularity.
- Exports used only within their own file (≈60 constants/types such as `STOP_POLL_MS`, `DECLARED_CLIENT_IP`): harmless over-exporting, not worth a pass.
- `systemPrompt` deprecated prop in the three lib-vuetify components: a published package's migration path; keep for a release. (`AgentInitConfig.prompt` is now never written by `hostInitConfig`, so its doc "Ignored, and warned about" only holds for the props path.)
- No-UI-caller routes that are plausible API/admin surfaces for plan 5: `GET /api/autonomous-agents/…/:agentId/session` and `/tools` (diagnostics), the tasks CRUD, the person's `DELETE /api/conversations/…/:conversationId` (erasure; no UI caller found — the review page deletes through `/api/review`). Not proposed for removal.
