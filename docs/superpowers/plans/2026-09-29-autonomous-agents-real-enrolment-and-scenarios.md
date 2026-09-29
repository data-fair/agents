# Autonomous Agents: Real Dev Enrolment, Scenarios and Fixtures — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A real NHI enrolment works in dev, so the token exchange is exercised by the suite instead of first in staging — and an autonomous agent's whole journey (create → enrol → instruct → answer, with real MCP tools as its own identity) is covered by api tests, e2e, judged simulations and hand-reviewable fixtures.

**Architecture:** Two fixture NHIs live in `dev/resources/users.json`, which docker-compose already mounts into simple-directory. The randomised dev port is handled by `{NGINX_PORT}` placeholders — substituted upstream in simple-directory's `FileStorage` (its proper home) and, so this repo does not wait on an SD release, also rendered locally by `dev/init-env.sh`. Because simple-directory pins an NHI's `subject`, a dev-only seam creates an autonomous agent with a *chosen* id so the fixture's subject matches; the production invariant (subject strictly derived from the agent id, one NHI per agent) is untouched.

**Tech Stack:** Node 24, Express 5, MongoDB, simple-directory (file storage), Playwright (`unit` / `api` / `e2e` / `simulate`), `lib-sim` (judged browser simulations).

**Spec:** `docs/superpowers/specs/2026-09-22-autonomous-agents-p0-design.md`

## Scope

P0's five plans (A, B, C1, C2, C3) are merged and complete: an autonomous agent runs real model turns against MCP servers as its own identity, bounded and observable, with a UI. The one thing dev could never do was **create the NHI** those turns authenticate as, so two tests were skipped and the exchange was unproven outside staging.

This plan closes that, then uses it: the scenarios it unlocks are the point, not the plumbing.

**Two repos.** Task 1 lands in `~/data-fair/simple-directory_chore-dev-nhis` (branch `chore-dev-nhis`); every other task is in this repo. Commit them separately — they release separately.

## Global Constraints

- **Naming:** "autonomous agent" written out in every identifier, route, fixture and user-facing string. Never a bare `agent`.
- **Module conventions:** `operations.ts` pure, `service.ts` stateful, `router.ts` HTTP only.
- **No credential in a response, a log, a model prompt or a websocket payload.** The NHI signing key, minted assertions and session cookies live only in config and transport headers.
- **Dev processes are user-managed.** Never start, stop, restart or kill a dev process or container. After a change that needs simple-directory or dev-api restarted, run `bash dev/status.sh`, say plainly that a restart is needed and why, and STOP rather than working around it. `docker compose restart simple-directory` does NOT pick up env changes (they are baked at container creation) — only `up -d` does.
- **Port assignments are in `.env` and are randomised per checkout** (`dev/init-env.sh`: `1024 + RANDOM % 48000`). Never hardcode one; derive it.
- **Quality gate before every commit:** `npm run lint-fix`, `npm run check-types`, the FULL `npm run test-unit` and `npm run test-api`. Run `npm run test-e2e` for any task touching `ui/`, `lib-vue/`, `lib-vuetify/` or `lib-sim/` (it needs `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd ..` first). Baselines: **854 unit / 249 api + 2 skipped / 134 e2e**.
- **Commit subjects are lowercase after the type** — commitlint rejects `fix(x): C2 review …`.
- **Stage with explicit paths.** Never `git add -A`.
- `npm run simulate` spends real model quota through the Claude Code bridge and is never part of `npm run test`. Run it deliberately, once, when the task says to.

## Facts established before writing this plan

Verified by reading the running container and both repos. Do not re-derive.

- **The exchange resolves an NHI through a storage READ.** `src/auth/router.ts:320` does `storages.globalStorage.getUser(body.client_id)` then checks `user.nhi` — not a direct mongo query, unlike `listNhis` (which is why *that* is marked "mongo-only feature (v1)" at `src/nhis/service.ts:45`). `FileStorage` implements `getUser`.
- **`FileStorage` passes an `nhi` field straight through.** It does `JSON.parse(readFileSync(...))` with no projection (`src/storages/file.ts:65`), and `cleanUser` (`:91`) only attaches `organizations`, deletes `password` and sets `isAdmin`. It does **no** placeholder substitution — that is the gap.
- **`cleanUser` does `res.email.toLowerCase()` unguarded**, so a fixture NHI user must carry an `email` or the read throws.
- **Every write in the exchange path is survivable.** The only one is `updateLogged` (`auth/router.ts:348`), which is `.catch()`-ed; `FileStorage.updateLogged` throws `Method not implemented.`, which therefore logs an internalError and does not fail the exchange.
- **`user.organizations` comes from `organizations.json` membership** (`getUserOrgas`), and the route demands `user.organizations.length === 1` — so a fixture NHI must be a member of exactly one organization.
- **docker-compose already mounts this repo's fixtures into the container:** `./dev/resources/users.json:/app/data/users.json` and the same for organizations. So a fixture NHI added here is the file simple-directory reads — no SD release needed for the *fixture*, only for the substitution.
- **The issuer URL is reachable from inside the simple-directory container.** All three services use `network_mode: host`, and `http://localhost:<NGINX_PORT>/agents/api/nhi/.well-known/openid-configuration` returns **200** from in there. OIDC discovery will work.
- **`NHIS_ALLOW_INSECURE_ISSUERS: true` and `MANAGE_NHIS: true` are already set** in docker-compose, so an `http://localhost` issuer passes `assertSafeIssuer` and the route is live (it answers 400 on an empty body, not 404).
- **simple-directory already has the substitution code**, in `/api/test-env/seed` for the mongo path: `for (const [key, value] of Object.entries(process.env)) if (value) raw = raw.replaceAll('{' + key + '}', value)`. Task 1 applies that same loop to `FileStorage`.
- **The subject is pinned per NHI.** `verifyAssertion(assertion, user.nhi.provider, user.nhi.subject, reqSiteUrl(req))`, and ours is `autonomous-agent:<agentId>` (`api/src/nhi/operations.ts:121`) with a nanoid id — so a static fixture cannot match unless the agent id is chosen.
- **`dev/fixtures.ts` already exists** (390 lines, `npm run dev-fixtures`): it authenticates as the real dev user `alban.mouton@koumoul.com`, targets `organization/dev1`, uses stable ids so a re-run is idempotent-ish, never deletes, and prints a "Browse the seeded data at:" summary. Autonomous-agent fixtures belong there, not in a new route.
- **`clean()` deletes only `owner.id: /^test/`**, which is why dev fixtures target `dev1` and survive the test suites.
- **The sim harness can already READ an autonomous agent's conversation.** `lib-sim/chat-driver.ts:155` reads `.agent-chat__user-bubble, .assistant-content`, both defined in `AgentChatMessages.vue` — which the thread page reuses. Only *sending* (`getByPlaceholder(strings.input)`, `getByRole('button', {name: strings.send})`) and *turn-done* (`[data-testid="chat-activity"][data-activity="waiting"]`) are specific to the in-page chat.
- **The types Task 7 builds on are `ChatRoot` (`Page | FrameLocator`) and `TurnOutcome` (`'ended' | 'waiting'`), both already exported from `lib-sim/chat-driver.ts`**; the diagnostic route Task 4 asserts against is `GET /api/autonomous-agents/:type/:id/:agentId/session`.
- **simple-directory has the same Playwright projects** (`test-unit`, `test-api`, `test-e2e`), so Task 1's change is unit-testable in its own repo.

## Decisions

**Ruling R1 — the substitution lands in BOTH repos, deliberately.** Upstream in `FileStorage` because that is its home (it is simple-directory's fixture-loading concern, and the pattern already exists there for the mongo seed path) and it helps every consumer. Locally in `dev/init-env.sh` because the dev stack runs the `master` **image**, so nothing downstream of the substitution would be testable here until that image ships. Substituting an already-substituted file is a no-op, so the two compose safely and the local rendering can be dropped later without ceremony. *Cost if wrong:* one mechanism exists in two places for a while, documented as such in both.

**Ruling R2 — the agent id becomes choosable in dev, rather than the subject becoming overridable in production.** simple-directory pins `nhi.subject`, so a static fixture needs a known subject. Making the *agent id* settable through a dev-only seam keeps `autonomousAgentSubject` strictly derived and keeps one NHI bound to one agent — the "NHI link strictly enforced" requirement. An `nhi.subject` override on the agent document would have been smaller and would have let two agents share one identity. *Cost if wrong:* one more dev-only route.

**Ruling R3 — `dev/resources/users.json` becomes generated from a committed template.** `users.json` gains `{NGINX_PORT}` placeholders, so it cannot be consumed raw; `init-env.sh` renders it. The template is committed and the rendered file is gitignored, so the compose mount path stays exactly as it is and no docker-compose change is needed. `AGENTS.md` is updated, since it currently points contributors at `users.json` as the source of truth. *Cost if wrong:* a checkout that skips `init-env.sh` has no `users.json` and simple-directory fails to start — the same failure mode as skipping it for `.env`, which is already required.

**Ruling R4 — simulations get an injectable surface, rather than the thread page getting a fake `chat-activity` element.** The harness's reading half already works on the thread page because both reuse `AgentChatMessages.vue`; only send and turn-done differ. Parameterising those keeps the UI honest instead of contorting it to satisfy a test harness, and the default preserves today's behaviour so the existing in-page cases are untouched. *Cost if wrong:* a slightly larger `lib-sim` surface area, which its own unit specs cover.

---

### Task 1: simple-directory — substitute env placeholders in file storage

**Repo:** `~/data-fair/simple-directory_chore-dev-nhis` (branch `chore-dev-nhis`). **Nothing else in this plan touches that repo.**

**Files:**
- Modify: `api/src/storages/file.ts`
- Test: add to that repo's unit project (mirror an existing `test/features/*.unit.spec.ts` for placement and style)

**Interfaces:**
- Consumes: `process.env`.
- Produces: `FileStorage` resolving `{ENV_VAR}` placeholders in both fixture files.

- [ ] **Step 1: Read the existing precedent, then write the failing test**

The loop to mirror is in `api/src/test-env.ts`'s `/seed` route:

```js
for (const [key, value] of Object.entries(process.env)) {
  if (value) orgsRaw = orgsRaw.replaceAll(`{${key}}`, value)
}
```

Write a unit test for a small exported helper — `substituteEnvPlaceholders(raw: string, env: Record<string, string | undefined>): string` — rather than for the constructor, so it needs no filesystem. Cover: a placeholder is replaced; several occurrences of the same one are all replaced; an unset variable is left untouched (so a typo is visible rather than silently becoming empty); a string with no placeholder is returned unchanged; and `{}`/`{ }` are not treated as placeholders.

- [ ] **Step 2: Run it, see it fail, then implement**

Export the helper and use it on both reads in the constructor (`newUsersPath`/`oldUsersPath` and the organizations equivalents), so a fixture can carry `{NGINX_PORT}`. Comment why: the dev stack randomises its ports per checkout, so a fixture NHI's `provider` (its issuer URL) cannot be written literally.

- [ ] **Step 3: Verify and commit, in that repo**

Run that repo's `npm run lint-fix`, `npm run check-types`, `npm run test-unit`. Do not run its api/e2e suites — they need its own dev stack, which is not what is running.

```bash
git add api/src/storages/file.ts test
git commit -m "feat(storages): substitute env placeholders in file storage fixtures"
```

Then **report to the user** that this repo's change is committed but the agents dev stack runs the published `master` image, so it has no effect here until released — which is exactly why Task 2 renders the file locally too.

---

### Task 2: fixture NHIs, and rendering them for the randomised port

**Files:**
- Create: `dev/resources/users.template.json` (committed, with placeholders)
- Modify: `dev/resources/users.json` → becomes generated; add to `.gitignore`
- Modify: `dev/init-env.sh`, `AGENTS.md`
- Create: `tests/features/autonomous-agents/dev-fixtures.unit.spec.ts`

**Interfaces:**
- Produces: two fixture NHI users, and a rendered `users.json`.

- [ ] **Step 1: Move the current fixtures to a template and add the NHIs**

`git mv dev/resources/users.json dev/resources/users.template.json`, then add two entries. Keep every existing user byte-identical — the whole suite is built on them.

```json
{
  "id": "test-autonomous-agent-nhi",
  "email": "test-autonomous-agent-nhi@test.com",
  "nhi": {
    "provider": "http://localhost:{NGINX_PORT}/agents/api/nhi",
    "subject": "autonomous-agent:test-fixture"
  }
},
{
  "id": "dev-autonomous-agent-nhi",
  "email": "dev-autonomous-agent-nhi@test.com",
  "nhi": {
    "provider": "http://localhost:{NGINX_PORT}/agents/api/nhi",
    "subject": "autonomous-agent:dev-fixture"
  }
}
```

Each needs a comment in the file's own README or in `AGENTS.md` (JSON has no comments) explaining: `email` is required because `cleanUser` lowercases it unguarded; `provider` is this service's issuer and carries `{NGINX_PORT}` because dev ports are random; `subject` must equal `autonomous-agent:<the agent's id>`, which is why the seam in Task 3 lets a fixture agent choose its id. Deliberately **no** `allowedIps` and **no** `ipBinding` — every autonomous agent shares one egress address, and the exchange declares `127.0.0.1`.

In `dev/resources/organizations.json`, add `test-autonomous-agent-nhi` as a member of `test1` and `dev-autonomous-agent-nhi` as a member of `dev1` — **exactly one organization each**, which the route requires. Role: `contrib` is enough; it does not need admin.

- [ ] **Step 2: Render it in init-env.sh**

Add a step that reads the template, replaces `{NGINX_PORT}` (and any other `{VAR}` present in the env it just wrote), and writes `dev/resources/users.json`. Comment that this mirrors what simple-directory's own `FileStorage` does once released, and that it exists so this repo does not wait on that release.

Add `dev/resources/users.json` to `.gitignore`.

- [ ] **Step 3: Pin the fixture's coherence with a unit test**

The value here is catching a fixture that cannot possibly work, without needing the stack up. Assert against `users.template.json` and `organizations.json`:

- every user with an `nhi` has an `email` (else `cleanUser` throws);
- every user with an `nhi` is a member of exactly one organization (else the exchange refuses);
- every `nhi.provider` ends with the issuer path this service serves (`/agents/api/nhi`) — import `SERVICE_PATH_PART` from `api/src/nhi/operations.ts` rather than writing the string twice;
- every `nhi.subject` matches `autonomousAgentSubject(<something>)`'s shape, imported from the same module;
- no `nhi` carries `allowedIps` or `ipBinding`;
- the template contains no literal port number (a five-digit `:\d{4,5}` in a `provider`), so a hardcoded port cannot creep back in.

- [ ] **Step 4: Verify, then hand over**

Run `bash dev/init-env.sh` is the USER's call, not yours — it rewrites `.env` and would change every port. Instead: render to a temporary path yourself to prove the substitution works, `npm run test-unit`, then **report that simple-directory must be recreated (`docker compose up -d`) to read the new fixtures**, and STOP until the user confirms. The remaining tasks need that.

```bash
git add dev/resources/users.template.json dev/resources/organizations.json dev/init-env.sh .gitignore AGENTS.md tests/features/autonomous-agents/dev-fixtures.unit.spec.ts
git commit -m "feat(dev): fixture non-human identities for autonomous agents"
```

---

### Task 3: create an autonomous agent with a chosen id, and enrol it for real

**Files:**
- Modify: `api/src/app.ts` (replace the `enrol-autonomous-agent` seam)
- Modify: `tests/features/autonomous-agents/runtime.api.spec.ts`, `mcp-tools.api.spec.ts` (call sites)

**Interfaces:**
- Produces: `POST /api/test-env/autonomous-agent` — dev-only; creates an autonomous agent with a caller-chosen `id` and a real `nhi.clientId`, and returns it.

- [ ] **Step 1: Replace the seam**

The existing `POST /api/test-env/enrol-autonomous-agent` writes `nhi` onto an already-created agent with a placeholder client id, which is what made the enrolment fake. Replace it with one that creates the whole document, so a caller can choose the id the subject is derived from:

```ts
app.post('/api/test-env/autonomous-agent', async (req, res) => {
  // Dev-only. Two things the real routes cannot do, both needed for a REAL enrolment:
  //  - choose the id, because simple-directory pins an NHI's `subject` and ours is derived as
  //    `autonomous-agent:<id>`, so a static fixture NHI can only match a known id;
  //  - set `nhi` without the write route's rebuild-from-request, which needs an x-forwarded-host
  //    the test clients do not send.
  // The production invariant is untouched: the subject is still strictly derived, and one NHI
  // still belongs to one agent.
  const now = new Date().toISOString()
  const doc = {
    ...req.body.autonomousAgent,
    id: req.body.id,
    owner: req.body.owner,
    nhi: { clientId: req.body.clientId, siteUrl: req.body.siteUrl, issuer: req.body.issuer },
    createdAt: now,
    updatedAt: now
  }
  await mongo.autonomousAgents.replaceOne({ id: doc.id }, doc, { upsert: true })
  res.json(doc)
})
```

`siteUrl`/`issuer` come from the caller because only it knows the port; have the caller derive them from `process.env.NGINX_PORT` so nothing is hardcoded.

- [ ] **Step 2: Repoint the existing callers**

Every current `enrol-autonomous-agent` call site becomes a create-with-id call. Those tests do not care about the id, so give each a stable one derived from its test name. **This is the step that makes the previously-fake enrolments real**, so expect some to change behaviour — if a test starts failing because the enrolment now actually has to work, that is the point, not a regression to paper over.

- [ ] **Step 3: Verify and commit**

Run `npm run lint-fix && npm run check-types && npm run test-unit && npm run test-api`.

```bash
git add api/src/app.ts tests/features/autonomous-agents
git commit -m "feat(dev): create an autonomous agent with a chosen id for real enrolment"
```

---

### Task 4: prove the real exchange, and un-skip the two tests

**Files:**
- Modify: `tests/features/autonomous-agents/nhi-exchange.api.spec.ts`
- Modify: `tests/features/autonomous-agents/mcp-tools.api.spec.ts`

**Interfaces:** consumes Tasks 2 and 3. Produces no new code — this task is the payoff.

- [ ] **Step 1: Un-skip the enrolment test and make it real**

`nhi-exchange.api.spec.ts`'s skipped `'an enrolled autonomous agent obtains a real simple-directory session'`: create the agent with id `test-fixture` through Task 3's seam, with `clientId: 'test-autonomous-agent-nhi'`, and assert the session describe endpoint reports the NHI's identity. Delete the comment block explaining why it was skipped and replace it with what now makes it work.

The second skipped case (the changed-only enrolment guard) becomes writable too: enrol once, then PUT the same `clientId` again and assert no second exchange happened. Use whatever observable the describe endpoint exposes; if none does, assert the cached session is reused rather than re-minted.

- [ ] **Step 2: The scenario that was impossible — identity all the way to the MCP server**

This is the most valuable test in the plan. In `mcp-tools.api.spec.ts`, against the `dev-session-mcp` catalog entry (`auth: 'nhi-session'`, which no test could reach before):

- create and enrol the fixture agent;
- list its tools;
- assert the MCP fixture's `lastHeaders()` carries a **`cookie` containing `id_token`** — a real simple-directory session, minted by a real exchange, presented to a real MCP server as the agent's own identity;
- assert that header is absent for the `auth: 'none'` entry, so the test distinguishes the two modes rather than passing on any request;
- assert no assertion and no signing key appear anywhere in the recorded headers.

- [ ] **Step 3: A full conversation as that identity**

In `runtime.api.spec.ts`: the fixture agent, wired to `dev-session-mcp`, runs a turn that calls a tool. Assert the message records the tool call, the fixture executed it, **and** the fixture saw the session cookie on that call — the whole chain from a posted message to an authenticated tool invocation.

- [ ] **Step 4: Verify and commit**

Run `npm run lint-fix && npm run check-types && npm run test-unit && npm run test-api`. **Expect 251 api and 0 skipped.** If either skipped test still cannot pass, stop and report exactly what refuses it rather than re-skipping.

```bash
git add tests/features/autonomous-agents
git commit -m "test(autonomous-agents): prove the real nhi exchange end to end"
```

---

### Task 5: the full journey in e2e

**Files:**
- Modify: `tests/features/autonomous-agents/autonomous-agents.e2e.spec.ts`

- [ ] **Step 1: One flow, start to finish**

The existing e2e covers configuration and the thread separately. Add a single journey that only e2e can prove: a superadmin in admin mode creates an autonomous agent through the form, follows the link from the list into its thread, posts a message, sees the answer arrive without a reload, and sees the run's terminal state. It should touch no API directly except the Task 3 seam for enrolment.

- [ ] **Step 2: The seeded fixture is reviewable**

After Task 6, add a check that the seeded `dev1` fixture agent's thread page renders its seeded conversations — the guard that the fixtures stay usable as the UI changes, which is the whole point of them.

- [ ] **Step 3: Verify and commit**

`cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd .. && npm run test-e2e`, plus the unit and api suites.

```bash
git add tests/features/autonomous-agents
git commit -m "test(autonomous-agents): the full create-to-conversation journey"
```

---

### Task 6: dev fixtures for manual UI review

**Files:**
- Modify: `dev/fixtures.ts`

**Interfaces:** consumes Task 3's seam. One working autonomous agent, per the user's direction — no deliberately-broken second agent for now.

- [ ] **Step 1: Seed one working autonomous agent and a conversation history**

Extend `dev/fixtures.ts`, following its existing shape (real dev user, `organization/dev1`, stable ids, never deletes, idempotent-ish). Seed:

- one enabled autonomous agent, **id `dev-fixture`** so the `dev-autonomous-agent-nhi` fixture's subject matches, wired to `dev-public-mcp` and `dev-session-mcp`, with a persona worth reading;
- one conversation whose turn completed and called a tool;
- one whose turn failed (post `stream error`);
- one truncated by the repeated-call guard (post `loop forever`).

Drive them through the real routes and wait for each run to settle, so what you see in the UI is what the executor actually produces — not hand-written documents that could drift from it.

- [ ] **Step 2: Print where to look**

Extend the closing "Browse the seeded data at:" summary with the agent's configuration section and its thread url, so the fixtures are one command and one click from reviewable.

- [ ] **Step 3: Verify and commit**

Run `npm run dev-fixtures` and confirm it completes and prints the links. Then run the unit and api suites (it targets `dev1`, so it must not disturb them).

```bash
git add dev/fixtures.ts
git commit -m "feat(dev): seed a working autonomous agent and conversations for review"
```

---

### Task 7: judged simulations of an autonomous agent using its tools

**Files:**
- Modify: `lib-sim/chat-driver.ts`, `lib-sim/types.ts`
- Modify: `simulations/cases/index.ts`
- Test: add to the `lib-sim` unit specs

**Interfaces:**
- Produces: an optional `surface` on a simulation case, defaulting to today's in-page chat behaviour.

- [ ] **Step 1: Give the driver an injectable surface**

`readConversation` already works on the thread page (both reuse `AgentChatMessages.vue`). Only two things differ, so only two are parameterised:

```ts
/**
 * How to operate a chat-like surface. The default is the in-page assistant; the autonomous agent
 * thread page sends through its own composer and signals a turn through its run status rather
 * than the in-page chat's activity element.
 */
export type SimulationSurface = {
  fill: (root: ChatRoot, text: string) => Promise<void>
  send: (root: ChatRoot) => Promise<void>
  /** Resolves when the turn is over. */
  waitForTurn: (root: ChatRoot, timeoutMs: number) => Promise<TurnOutcome>
}
```

Add `surface?: 'in-page-chat' | 'autonomous-agent'` to `SimulationCase` and resolve it to an implementation in the driver. Keep the existing code path as the default so no current case changes behaviour — that is the constraint this task must not break.

Unit-test the resolution (default when unset, the autonomous one when named, a clear error for an unknown value). The selectors themselves are e2e's business, not a unit test's.

- [ ] **Step 2: Two cases, both about tool use and useful reporting**

In `simulations/cases/index.ts`, with `surface: 'autonomous-agent'` and a route pointing at the seeded `dev-fixture` agent's thread. Per the user's direction the interesting judgement is *does it use its tools and report usefully* — so:

- a persona who wants a concrete answer that can only come from calling a tool, phrased in plain language with no tool names;
- a persona who asks something its tools cannot answer, where the useful behaviour is saying so plainly rather than inventing it.

Both need the dev fixtures seeded first (Task 6) and `npm run dev-bridge` running.

- [ ] **Step 3: Run them once, deliberately, and read the verdicts**

Run `npm run simulate`, then `npm run simulate:report`. This spends real model quota, so run it once. Read the judge's verdicts and, if one reports something real about the autonomous agent's behaviour — a tool ignored, an unverifiable claim — record it as a finding rather than tuning the case until it passes.

- [ ] **Step 4: Verify and commit**

Run `npm run lint-fix && npm run check-types && npm run test-unit && npm run test-api && npm run test-e2e` (lib-sim is built for e2e).

```bash
git add lib-sim simulations
git commit -m "feat(sim): judged simulations of an autonomous agent using its tools"
```

---

## Done when

- A fixture NHI in `dev/resources/users.json` lets an autonomous agent complete a **real** token exchange in dev, and the two skipped tests are gone — **0 skipped**.
- An autonomous agent reaches an `auth: 'nhi-session'` MCP server carrying a real simple-directory session cookie, proven from the server's own recorded headers, and the `auth: 'none'` case proves the test distinguishes them.
- A posted message drives a turn that calls a tool as that identity, end to end.
- One e2e journey covers create → thread → post → answer → run status.
- `npm run dev-fixtures` seeds a working autonomous agent with completed, failed and truncated conversations, and prints where to review them.
- Two judged simulations exercise an autonomous agent using its MCP tools, with the existing in-page cases unchanged.
- `lint-fix`, `check-types`, `test-unit`, `test-api`, `test-e2e` all pass; the simple-directory change is committed on its own branch, in its own repo.

## Deliberately deferred

- A deliberately-broken second fixture agent (disabled, or unenrolled) for reviewing the degraded UIs — the user asked for one working agent first.
- A shared-timeline simulation (two instructors in one conversation) — the user chose tool use as the interesting judgement.
- The local rendering in `init-env.sh` becomes removable once the simple-directory change is released; leaving it is harmless but it is not meant to be permanent.
- Carried from C2/C3: a revoked subscriber still learns a conversation changed until its socket drops; a compaction is traced but not billed; a turn failing before its first model call is untraced; reasoning does not drive a persist.
- Carried from B, and now partly addressable by this plan's fixture: no 401-triggered session refresh, rotation overlap not expressible, `expires_in` unconfirmed against a real response.
