# Development notes for agents

## Project intent

We are not trying to lead agent-harness development. Two goals, in this order of where custom work is justified:

1. **Deep, clean integration with the data-fair stack** (simple-directory identities and NHIs, openapi-mcp, events, processings, portals, quotas). This is why the harness is custom, and where original design is expected.
2. **Everywhere else, a harness close to the state of the art and to what people are used to elsewhere** (Claude, ChatGPT, Codex, Cursor, Managed Agents…). Prefer the established convention, the AI SDK's or MCP's own mechanism, or a widely used library over an original design. Diverging needs a stated reason, and "it is simpler for us" counts less than "users expect it to work this way".

When a design discussion drifts toward novelty outside the integration, say so.

## Typing

Types are mostly managed from JSON schemas (for example `api/types/settings/schema.js`), prepared using `npm run build-types` and imported from #types in which is an alias for `api/types/index.ts`.

## Quality checks

1. Linter: `npm run lint-fix`
2. Type checking: `npm run check-types`
3. Docker build passing: `docker build -t agents .`

## Dev environment

Development processes (dev-api, dev-ui, docker compose services) are managed by the user, not by you. **Never attempt to start, stop, restart, or kill any dev process or container.**

The dev file store of autonomous agents is the gitignored dev/data/files (api/config/development.js files).

### Checking status

Run `bash dev/status.sh` to see which services are up or down. This probes all known endpoints and reports their status. Always use this when:
- A test fails with a connection error
- You suspect a service might be down
- Before reporting an environment issue to the user

### Consulting logs

Log files are in `dev/logs/`:
- `dev/logs/dev-api.log` — API server (nodemon). Check this for startup failures or runtime errors.
- `dev/logs/dev-ui.log` — UI dev server (vite).
- `dev/logs/docker-compose.log` — All docker compose services (nginx, simple-directory, events, maildev, mongo).

Use `tail -n 50 dev/logs/<file>` to see recent output, or `grep -i error dev/logs/<file>` to find errors.

### The dev MCP server

`npm run dev-mcp` serves the `dev-review-*-mcp` entries of the MCP catalog (`api/config/development.js`),
on `NGINX_PORT + 31` (the test fixture owns +30, and each spec starts and stops its own). It is part of the `npm run dev-zellij` layout, so a normal dev session already
has it, and `dev/status.sh` probes it.

It reuses `tests/support/mcp-fixture.ts` rather than defining a second server, so what you exercise
by hand is exactly what the suite exercises: tools `echo`, `get_schema`, `ignored` and
`list_road_closures`, plus the file tools of autonomous agents — `import_table` (takes a file: an
`x-mcp-file` argument it fetches from the agents API's signed URL, answering its size and hash),
`export_closures` (returns a link to a CSV served at `/exports/` beside the MCP endpoint) and
`export_my_profile` (a link on the call's site, fetched with the agent's session) — and `closure_stats`,
which returns `structuredContent` beside its text, as data-fair's MCP does: a `code_mode` script gets the
object, the model the text. Only `list_road_closures`, `closure_stats` and the exports return data — the others are structural (a string reflector, a
fixed empty schema, and a target for `toolFilter`), so they are the ones to use when you need to see an
agent actually fetch something and quote it.
Under `/profiled/` the same server behaves as a *profiled* one (catalog entry `dev-profiled-mcp`): a
vocabulary at `/profiled/profiles` mirroring data-fair's (`catalog`, `read`, `write` and their `_roads` cells)
and a tool set composed per `profiles` query at `/profiled/mcp`, with a 400 on an unknown profile.

Only autonomous agents need it. Without it, an agent wired to one of those catalog entries fails with
a 502 the moment it gathers its tools — the seeded dev fixtures can then be read but not used, which
is a confusing way to discover this is not running.

### Running on Claude Code models

`npm run dev-bridge` starts a local OpenAI-compatible server on `BRIDGE_PORT` (seeded by
`dev/init-env.sh` like every other dev port; it used to default to a fixed 3194, which meant two
worktrees fought over it and the second simply failed to start) backed by your Claude Code subscription, so the dev workspace can run
on real models without an API key. It is part of the `npm run dev-zellij` layout, so a
normal dev session already has it. Logs go to `dev/logs/dev-bridge.log`. It is optional —
`dev/status.sh` reporting it DOWN is normal unless you use it.

Configure it in the settings UI as an **OpenAI Compatible** provider with base URL
`http://localhost:$BRIDGE_PORT/v1` — the value in `.env`, not a fixed port — and **Compatibility
Mode `compatible`** (the default mode
targets `/v1/responses`, which the bridge does not implement). Leave the API key empty.
Model listing for org providers goes through lib-node's SSRF-guarded axios, which refuses
loopback; `npm run dev-api` sets `SSRF_PUBLIC_IPS=127.0.0.1,::1` so the bridge is reachable.

`GET /_bridge/status` reports how many conversations are holding a live `claude` session.
It binds `127.0.0.1` only: it is unauthenticated and spends your subscription.

Root `package.json` pins `@anthropic-ai/claude-agent-sdk`'s zod to `3.25.76` via `overrides`.
The SDK asks for zod ^4, and a second zod major in the tree makes `api`'s inference blow the
instantiation depth limit (TS2589 in `api/src/moderation/service.ts`). The override is scoped
to the SDK so a legitimate bump of `api`'s own zod is not silently clamped.

Claude Code cuts an MCP tool's description at 2048 characters, and the bridge serves every tool to it as an MCP tool: a longer description is cut in the listing with a pointer, and given whole in the system prompt (`lib-sim/bridge/openai.ts`, `MCP_DESCRIPTION_LIMIT`). Before that, `code_mode` was simulated without anything past its first tool signatures. No role it serves (assistant, persona, judge) learns more about the product than the product tells it: each query runs in a neutral temp cwd with no tools and a private `CLAUDE_CONFIG_DIR` carrying none of the operator's identity, and fails closed otherwise (`lib-sim/isolation.ts`, asserted by a test). Nothing caches below about 4k tokens of system prompt, so short dev chats showing no cache activity is expected.

### dev-api watches `shared/` too

`dev-api` runs nodemon from `api/`, so its default watch covers `api/**` only — while `shared/` reaches
the server through a workspace symlink under `node_modules`, which nodemon neither follows nor would see.
Editing the context policy or the loop guards therefore left the running server on the OLD code, silently
invalidating any api or e2e test of that change (it passed a mutation check that should have failed).
`api/nodemon.json` now names `../shared` explicitly in `watch`.

Two things to know when it still looks stale:

- **nodemon reads its own config only at startup.** Changing `api/nodemon.json` restarts the app but not
  nodemon, so a watch-list change needs `dev-api` itself restarted once — ask the user.
- Verify with the log, not with a guess: `wc -c dev/logs/dev-api.log` before and after the edit, or look
  for a fresh `API server listening` line. A restart takes a second or two, and a test fired too early
  runs against the old process.

### When something is down

If a service is down, do not try to fix the infrastructure. Instead:
1. Run `bash dev/status.sh` to identify what's down.
2. Check relevant logs in `dev/logs/` for errors.
3. Report the problem clearly to the user with the status output and any relevant log lines.

Port assignments are in `.env`. Do not modify them.

## Testing

Run tests: `npm run test`
Run specific tests: `npm run test tests/features/settings/settings.api.spec.ts`

If a test fails with a connection error, run `bash dev/status.sh` to diagnose, then stop and ask the user for help.

**One stateful run at a time.** The api and e2e projects share the dev database, and every spec's `clean()` deletes all `test*` documents — so a second run started while one is going wipes the first's freshly seeded data. That looks exactly like product flakiness: a different pair of failures each time, each passing alone, typically a 403 because a spec's own quota settings vanished. `tests/support/stateful-lock.ts` now refuses a second run at setup with an explicit message; do not work around it. In practice this means: never launch a test run in the background while an earlier one you started is still going, and wait for it before re-running a single spec. A unit-only run takes no lock and can run any time.

Test users are defined in `dev/resources/users.template.json` and organizations in `dev/resources/organizations.json`. Modify these as little as possible, but if you do you need to force reload of the simple-directory container `docker compose restart simple-directory`.

`dev/resources/users.json` is **generated** — `dev/init-env.sh` renders it from `users.template.json`, resolving `{NGINX_PORT}` and any other `{ENV_VAR}` placeholder, and it is gitignored. Edit the template, never the rendered file. It exists because docker-compose mounts the rendered file straight into simple-directory, which reads it verbatim and does no substitution of its own — so a fixture that names a URL (the autonomous-agent NHI fixtures name this service as their issuer) cannot write the randomised port literally. An unresolved placeholder fails the render loudly rather than reaching simple-directory and surfacing later as an unexplained 401 from the token exchange.

The two `*-autonomous-agent-nhi` users are non-human identities an autonomous agent authenticates as. Each needs an `email` (simple-directory lowercases it unguarded), must belong to exactly one organization, and must carry no `allowedIps`/`ipBinding` — every autonomous agent shares one egress address. Their `nhi.subject` must equal `autonomous-agent:<agent id>`, which is why a dev-only seam creates a fixture agent with a chosen id. `tests/features/autonomous-agents/dev-fixtures.unit.spec.ts` enforces all of this — including the pairing itself, read out of `dev/fixtures.ts` and the specs rather than restated, so renaming an agent id without renaming the subject fails a unit test instead of surfacing as that uniform 401.

Tests are separated in playwright projects: unit (pure functions), api (stateful API endpoints through HTTP) and e2e (UI with playwright browser intrumentation). When working on the e2e part you can use subagents `playwright-test-generator` and `playwright-test-generator`.

In case of failures you might find error contexts in `test-results`.

### Workspace packages must be built before running tests

This project has workspace packages whose compiled `.js` files are gitignored, so they must be built before the code that imports them will run.

`lib-vuetify/` and `lib-vue/` are needed for **e2e** tests:
- `cd lib-vuetify && npm run build`
- `cd lib-vue && npm run build`

`lib-sim/` is needed for **`npm run simulate`**, and for the specs importing `simulations/cases` (`tests/features/simulations/cases.unit.spec.ts`, `tests/features/lib-sim/cases.unit.spec.ts`, `tests/features/lib-sim/persona.unit.spec.ts`, `tests/features/simulations/exports.api.spec.ts`), which reach the built package through it — unbuilt, the whole run fails at collection with `Cannot find module …/lib-agents-sim/index.js`:
- `cd lib-sim && npm run build`

If e2e tests fail with "element(s) not found", check that `lib-vuetify` and `lib-vue` are built before investigating further.

### Debugging e2e failures

When e2e tests fail, follow this order:
1. Check workspace package builds (`ls lib-vuetify/*.js`, `ls lib-vue/*.js`)
2. Use the Playwright MCP tools (`browser_open`, `browser_navigate`, `browser_snapshot`, `browser_console_messages`) to inspect failing pages — do NOT write custom Playwright scripts
3. Check `test-results/` for traces and screenshots
4. Only then dig into component code

A single e2e test failing at random, a different one each run, is first a question for
`dev/logs/dev-ui.log`: a vite `optimized dependencies changed. reloading` line during the run reloaded
whatever page the test was on. `ui/vite.config.ts` gives vite every dependency at startup so this
does not happen; a line naming a new dependency means that list missed it.

### Scenario simulations

`npm run simulate` drives judged browser conversations: a simulated user with a
persona and a goal talks to the real chat on a `_dev` page, or to the same chat
opened on an autonomous agent (`surface: 'autonomous-agent'`), whose account and agent the
runner seeds itself — settings included, since a case driving an account whose
model mapping points at the mock would be graded on the mock's canned reply while
still reporting a valid run. The persona can also
look at, click and type on the page itself (not the composer), so a claim like
"I don't see it" is checkable against what it actually observed, not invented.
A judge subagent then reads the transcript, observations included, and the
server's record of the run: the runner downloads each conversation's export —
the same file used to debug a real session — so the seeded account stores
traces and the browser carries the consent cookie. Needs the
dev stack and built workspace packages — `lib-sim` included: `simulations/`
imports it by package name, so a stale build silently runs the old code and
still reports the run valid — and `npm run dev-bridge`. Orchestrated by the
`/agents-sim` skill; cases live in `simulations/cases/index.ts`. A case may declare a `premise` —
what must have happened for the run to test it, such as the person writing during a wait — and a run
where it did not hold is recorded invalid rather than judged. A case may span several conversations
(`conversations`: the person's DONE ends one and the runner opens the next), or be `unattended`: a
planned task the runner runs itself, with no persona at all, judged from the run's export. Never added to
`playwright.config.ts` — a bare `npm run test` would otherwise spend plan
quota.

## AI SDK version

`ai` and every `@ai-sdk/*` provider (plus `@openrouter/ai-sdk-provider`, `ai-sdk-ollama` and `@ai-sdk/code-mode`, which peer-pins one exact `ai` patch per release) are pinned to **exact** versions released together. Bump them together, never one alone, then run `npm dedupe` and check that `npm ls ai @ai-sdk/provider-utils` shows a single version of each. Why, and the v7 behaviours the code relies on: `docs/architecture/providers.md` ("AI SDK version").

## Code patterns

Topical architecture docs (for understanding the service) live in `docs/architecture/`, one file per concern; `docs/architecture/overview.md` indexes them. Read on a need-to-know basis.

When working on this project, read the following files on a need-to-know basis to understand conventions:

- API route pattern: `api/src/settings/router.ts`
- API operations pattern: `api/src/settings/operations.ts`
- Browser tool registration (WebMCP): `lib-vue/use-agent-tools.ts`
- MCP client, as an autonomous agent's own identity: `api/src/mcp-servers/client.ts`
- Vue page pattern: `ui/src/pages/admin/[type]/[id]/index.vue`
- Unit test pattern: `tests/features/settings/settings.unit.spec.ts`
- API test pattern: `tests/features/settings/settings.api.spec.ts`
- E2E test pattern: `tests/features/settings/settings.e2e.spec.ts`
- Type generation from JSON schemas: `api/types/settings/schema.js`
