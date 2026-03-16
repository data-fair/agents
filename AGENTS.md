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

## Code patterns

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
