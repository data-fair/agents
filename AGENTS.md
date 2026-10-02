# Development notes for agents

## Typing

Types are mostly managed from JSON schemas (for example @api/types/settings/schema.js), prepared using `npm run build-types` and imported from #types in which is an alias for @api/types/index.ts.

## Quality checks

1. Linter: `npm run lint-fix`
2. Type checking: `npm run check-types`
3. Docker build passing: `docker build -t agents .`

## Dev environment

Development processes (dev-api, dev-ui, docker compose services) are managed by the user, not by you. **Never attempt to start, stop, restart, or kill any dev process or container.**

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
`list_road_closures`. Only the last returns data — the others are structural (a string reflector, a
fixed empty schema, and a target for `toolFilter`), so it is the one to use when you need to see an
agent actually fetch something and quote it.

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

`GET /_bridge/status` reports how many conversations are holding a live `claude` session.
It binds `127.0.0.1` only: it is unauthenticated and spends your subscription.

Root `package.json` pins `@anthropic-ai/claude-agent-sdk`'s zod to `3.25.76` via `overrides`.
The SDK asks for zod ^4, and a second zod major in the tree makes `api`'s inference blow the
instantiation depth limit (TS2589 in `api/src/moderation/service.ts`). The override is scoped
to the SDK so a legitimate bump of `api`'s own zod is not silently clamped.

Design, measurements and the isolation guarantee:
`docs/superpowers/specs/2026-09-12-claude-code-bridge-and-simulation-harness-design.md`.

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
Run specific tests: `npm run test tests/features/settings.spec.ts`

If a test fails with a connection error, run `bash dev/status.sh` to diagnose, then stop and ask the user for help.

Test users are defined in @dev/resources/users.template.json and organizations in @dev/resources/organizations.json. Modify these as little as possible, but if you do you need to force reload of the simple-directory container `docker compose restart simple-directory`.

`dev/resources/users.json` is **generated** — `dev/init-env.sh` renders it from `users.template.json`, resolving `{NGINX_PORT}` and any other `{ENV_VAR}` placeholder, and it is gitignored. Edit the template, never the rendered file. It exists because docker-compose mounts the rendered file straight into simple-directory, which reads it verbatim and does no substitution of its own — so a fixture that names a URL (the autonomous-agent NHI fixtures name this service as their issuer) cannot write the randomised port literally. An unresolved placeholder fails the render loudly rather than reaching simple-directory and surfacing later as an unexplained 401 from the token exchange.

The two `*-autonomous-agent-nhi` users are non-human identities an autonomous agent authenticates as. Each needs an `email` (simple-directory lowercases it unguarded), must belong to exactly one organization, and must carry no `allowedIps`/`ipBinding` — every autonomous agent shares one egress address. Their `nhi.subject` must equal `autonomous-agent:<agent id>`, which is why a dev-only seam creates a fixture agent with a chosen id. `tests/features/autonomous-agents/dev-fixtures.unit.spec.ts` enforces all of this — including the pairing itself, read out of `dev/fixtures.ts` and the specs rather than restated, so renaming an agent id without renaming the subject fails a unit test instead of surfacing as that uniform 401.

Tests are separated in playwright projects: unit (pure functions), api (stateful API endpoints through HTTP) and e2e (UI with playwright browser intrumentation). When working on the e2e part you can use subagents `playwright-test-generator` and `playwright-test-generator`.

In case of failures you might find error contexts in @test-results.

### Workspace packages must be built before running tests

This project has workspace packages whose compiled `.js` files are gitignored, so they must be built before the code that imports them will run.

`lib-vuetify/` and `lib-vue/` are needed for **e2e** tests:
- `cd lib-vuetify && npm run build`
- `cd lib-vue && npm run build`

`lib-sim/` is needed for **`npm run simulate`**, not for e2e — nothing under `tests/` imports the built package (the unit specs import its `.ts` sources directly):
- `cd lib-sim && npm run build`

If e2e tests fail with "element(s) not found", check that `lib-vuetify` and `lib-vue` are built before investigating further.

### Debugging e2e failures

When e2e tests fail, follow this order:
1. Check workspace package builds (`ls lib-vuetify/*.js`, `ls lib-vue/*.js`)
2. Use the Playwright MCP tools (`browser_open`, `browser_navigate`, `browser_snapshot`, `browser_console_messages`) to inspect failing pages — do NOT write custom Playwright scripts
3. Check `test-results/` for traces and screenshots
4. Only then dig into component code

### Scenario simulations

`npm run simulate` drives judged browser conversations: a simulated user with a
persona and a goal talks to the real chat on a `_dev` page, or to an autonomous
agent's thread page (`surface: 'autonomous-agent'`), whose account and agent the
runner seeds itself — settings included, since a case driving an account whose
model mapping points at the mock would be graded on the mock's canned reply while
still reporting a valid run. The persona can also
look at, click and type on the page itself (not the composer), so a claim like
"I don't see it" is checkable against what it actually observed, not invented.
A judge subagent then reads the transcript, observations included. Needs the
dev stack and built workspace packages — `lib-sim` included: `simulations/`
imports it by package name, so a stale build silently runs the old code and
still reports the run valid — and `npm run dev-bridge`. Orchestrated by the
`/agents-sim` skill; cases live in `simulations/cases/index.ts`. Never added to
`playwright.config.ts` — a bare `npm run test` would otherwise spend plan
quota.

## Code patterns

Topical architecture docs (for understanding the service) live in `docs/architecture/` — one file per concern (sub-agents, loop-guards, mcp-tools, host-events, providers, configuration, quotas-usage, context-management, autonomous-agents, integration-context, embedding, moderation, tool-exploration, conversation-review) plus `overview.md`. Read on a need-to-know basis.

When working on this project, read the following files on a need-to-know basis to understand conventions:

- API route pattern: @api/src/settings/router.ts
- API operations pattern: @api/src/settings/operations.ts
- Browser tool registration (WebMCP): @lib-vue/use-agent-tools.ts
- MCP client, as an autonomous agent's own identity: @api/src/mcp-servers/client.ts
- Vue page pattern: @ui/src/pages/admin/[type]/[id]/index.vue
- Unit test pattern: @tests/features/settings/settings.unit.spec.ts
- API test pattern: @tests/features/settings/settings.api.spec.ts
- E2E test pattern: @tests/features/settings/settings.e2e.spec.ts
- Type generation from JSON schemas: @api/types/settings/schema.js
