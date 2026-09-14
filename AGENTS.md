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

### Running on Claude Code models

`npm run dev-bridge` starts a local OpenAI-compatible server (default port 3194, override
with `BRIDGE_PORT`) backed by your Claude Code subscription, so the dev workspace can run
on real models without an API key. It is part of the `npm run dev-zellij` layout, so a
normal dev session already has it. Logs go to `dev/logs/dev-bridge.log`. It is optional —
`dev/status.sh` reporting it DOWN is normal unless you use it.

Configure it in the settings UI as an **OpenAI Compatible** provider with base URL
`http://localhost:3194/v1` and **Compatibility Mode `compatible`** (the default mode
targets `/v1/responses`, which the bridge does not implement). Leave the API key empty.

`GET /_bridge/status` reports how many conversations are holding a live `claude` session.
It binds `127.0.0.1` only: it is unauthenticated and spends your subscription.

Root `package.json` pins `@anthropic-ai/claude-agent-sdk`'s zod to `3.25.76` via `overrides`.
The SDK asks for zod ^4, and a second zod major in the tree makes `api`'s inference blow the
instantiation depth limit (TS2589 in `api/src/moderation/service.ts`). The override is scoped
to the SDK so a legitimate bump of `api`'s own zod is not silently clamped.

Design, measurements and the isolation guarantee:
`docs/superpowers/specs/2026-09-12-claude-code-bridge-and-simulation-harness-design.md`.

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

Test users are defined in @dev/resources/users.json and organizations in @dev/resources/organizations.json. Modify these as little as possible, but if you do you need to force reload of the simple-directory container `docker compose restart simple-directory`.

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
persona and a goal talks to the real chat on a `_dev` page, and a judge subagent
reads the transcript. Needs the dev stack, built workspace packages, and
`npm run dev-bridge`. Orchestrated by the `/simulate` skill; cases live in
`simulations/cases/index.ts`. Never added to `playwright.config.ts` — a bare
`npm run test` would otherwise spend plan quota.

## Code patterns

Topical architecture docs (for understanding the service) live in `docs/architecture/` — one file per concern (gateway, sub-agents, loop-guards, mcp-tools, providers, quotas-usage, compaction, embedding, moderation, tool-exploration, tracing) plus `overview.md`. Read on a need-to-know basis.

When working on this project, read the following files on a need-to-know basis to understand conventions:

- API route pattern: @api/src/settings/router.ts
- API operations pattern: @api/src/settings/operations.ts
- Dataset tool pattern: @api/src/tools/datasets/search-data.ts
- MCP server setup: @api/src/mcp/server.ts
- Vue page pattern: @ui/src/pages/settings.vue
- Unit test pattern: @tests/features/settings/1.settings.unit.spec.ts
- API test pattern: @tests/features/settings/2.settings.api.spec.ts
- E2E test pattern: @tests/features/settings/3.settings.e2e.spec.ts
- Type generation from JSON schemas: @api/types/settings/schema.js
