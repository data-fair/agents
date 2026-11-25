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

Docker runs the containers (nginx, simple-directory, mongo; `events` is optional, compose profile `events`);
the api, the ui and the dev MCP server run as node processes.

- `npm run dev` — the containers (`npm run dev-deps`), then the api, the ui and the dev MCP server in the
  terminal (Ctrl+C stops them), at `http://localhost:5700/agents/`. Their logs are in `dev/logs/`
  (`DEV_LOG_DIR`, `DEV_LOG_PREFIX`); `npm run dev` accepts docker compose arguments (`-- --profile events`).
- `npm run dev-deps` — the containers only, plus `npm run dev-setup`.
- `npm run dev-setup` — idempotent builds (types, workspace packages, ui), no container.
- `npm run dev:api`, `dev:ui`, `dev:mcp` — one process each, with the variables of `.env` exported.
- `npm run stop-dev-deps` — stops the containers.

Default ports (5700-5710) are in `dev/default.env`, copied to `.env` the first time: `.env` overrides it and is
never overwritten. Production names (`MONGO_URL`,
`PRIVATE_DIRECTORY_URL`, `PRIVATE_MCP_URL`...) override `api/config/development.js`. The optional events
service is absent when `EVENTS_PORT` is empty (`npm run dev` blanks it when its container is not running),
and the specs that need it skip. CI runs the same path with every profile.

The site is `http://$DEV_HOST:$NGINX_PORT`: the tests and dev scripts name it so (the NHI issuers, the
multi-host specs).

- Read the logs before restarting: nodemon and vite already reload on file changes (the `mcp` process too,
  on `dev/mcp-server.ts` and `tests/support/mcp-fixture.ts`).
- Do not start, stop or restart the dev processes or containers of the user: ask.

The dev file store of autonomous agents is the gitignored dev/data/files (api/config/development.js files).

Design specs and implementation plans are not kept in this repository; durable architecture docs live in `docs/architecture/`.

### The dev MCP server

The `mcp` process (`dev/mcp-server.ts`, `npm run dev:mcp`) serves the `dev-review-*-mcp` entries of the MCP catalog
(`api/config/development.js`), on `DEV_MCP_PORT` (the test fixture owns `MCP_FIXTURE_PORT`, and each spec
starts and stops its own).

It reuses `tests/support/mcp-fixture.ts` rather than defining a second server, so what you exercise
by hand is exactly what the suite exercises: tools `echo`, `get_schema`, `ignored` and
`list_road_closures`, plus the file tools of autonomous agents — `import_table` (takes a file: an
`x-mcp-file` argument it fetches from the agents API's signed URL, answering its size and hash),
`export_closures` (returns a link to a CSV served at `/exports/` beside the MCP endpoint) and
`export_my_profile` (a link on the call's site, fetched with the agent's session) — and `closure_stats`,
which returns `structuredContent` beside its text, as data-fair's MCP does: a `code_mode` script gets the
object, the model the text. Only `list_road_closures`, `closure_stats` and the exports return data — the others are structural (a string reflector, a
fixed empty schema, and a target for `toolFilter`), so they are the ones to use when you need to see an
agent actually fetch something and quote it. `slow_update` and `bulk_update` are the annotation-free (write) twins of `slow_lookup` and `bulk`, for specs that put a slow or large write to a person (route `reviewer+person`). `set_note` (a write: no annotations) and `delete_note` (destructive) take `{ note }` and do nothing: they are the targets of the approval reviewer's specs, whose mock reviewer reads the note.

Under `/platform/` it stands in for data-fair's MCP, the built-in server of every autonomous agent with an
identity: `privateMcpUrl` in `api/config/development.js` points there. It serves the data tools only
(`list_road_closures`, `closure_stats`, `export_closures`, `export_my_profile`), renamed `platform_*`, and
its skills under `skill://platform/` — so the built-in server, which wins a name collision, never shadows a
tool of the per-spec fixture, whose call log a spec asserts on. CI starts it too (`reuse-quality.yml`).

Only autonomous agents need it. Without it, every agent with an identity fails with a 502 the moment it
gathers its tools — an agent seeded as dev data can then be read but not used, which is a confusing way to
discover this is not running. nodemon restarts it on a change to it or to `tests/support/mcp-fixture.ts`.

### Running on Claude Code models

A Claude Code bridge (a local OpenAI-compatible server backed by a Claude Code subscription, run outside this
repository) lets the dev workspace run on real models without an API key.

Configure it in the settings UI as an **OpenAI Compatible** provider with the bridge's base URL
(`http://localhost:<its port>/v1`) and **Compatibility Mode `compatible`** (the default mode
targets `/v1/responses`, which the bridge does not implement). Leave the API key empty.
Model listing for org providers goes through lib-node's SSRF-guarded axios, which refuses
loopback; `dev/default.env` sets `SSRF_PUBLIC_IPS=127.0.0.1,::1` so the bridge is reachable.

Tick **Reads images** (`imageInput`) on its models for page screenshots and other tool images to reach Claude:
the bridge hands them on as MCP image parts (live tool loop) or image blocks (replayed history). Unset, an
OpenAI-compatible provider gets placeholders instead.

`dev/guard-eval` measures the guards on such a model: `GUARD_EVAL_BASE_URL=http://localhost:<port>/v1 node dev/guard-eval/index.ts`.

The whole tree is on one zod major (4). A second zod major makes `api`'s inference blow the
instantiation depth limit (TS2589 in `api/src/moderation/service.ts`): check `npm ls zod` shows a
single version after any bump touching it.

On a Claude Code bridge, nothing caches below about 4k tokens of system prompt, so short dev chats showing no cache activity is expected.

### The api process watches `shared/` too

The api process runs nodemon from `api/`, so its default watch covers `api/**` only — while `shared/` reaches
the server through a workspace symlink under `node_modules`, which nodemon neither follows nor would see.
Editing the context policy or the loop guards therefore left the running server on the OLD code, silently
invalidating any api or e2e test of that change (it passed a mutation check that should have failed).
`api/nodemon.json` now names `../shared` explicitly in `watch`.

Two things to know when it still looks stale:

- **nodemon reads its own config only at startup.** Changing `api/nodemon.json` restarts the app but not
  nodemon, so a watch-list change needs the process restarted once (ask the user).
- Verify with the log, not with a guess: look for a fresh `API server listening` line in
  the API's log (`dev/logs/api.log` under `npm run dev`). A restart takes a second or two, and a test fired too early
  runs against the old process.

### When something is down

If a service is down, do not try to fix the infrastructure. Instead:
1. Check what answers (`curl -s http://localhost:$DEV_API_PORT/api/ping`, `docker compose ps`).
2. Read the process's log (`dev/logs/`), or `docker compose logs <service>` for a container.
3. Report the problem clearly to the user with what you checked and any relevant log lines.

## Testing

Run tests: `npm run test`
Run specific tests: `npm run test tests/features/settings/settings.api.spec.ts`
Run the smoke set: `npm run test-smoke`

The suite runs in two levels (`docs/architecture/testing.md`): the pre-push hook (`dev/pre-push.sh`) runs
the type check, the unit tests, the `@smoke` api/e2e set and the spec files the push changed; pull
requests and release tags run everything. When iterating, run only the related specs.

If a test fails with a connection error, check what is down (above), then stop and ask the user for help.

**One stateful run at a time.** The api and e2e projects share the dev database, and every spec's `clean()` deletes all the documents of the test sub-space `test_agents_` — so a second run started while one is going wipes the first's freshly seeded data. That looks exactly like product flakiness: a different pair of failures each time, each passing alone, typically a 403 because a spec's own quota settings vanished. `tests/support/stateful-lock.ts` now refuses a second run at setup with an explicit message; do not work around it. In practice this means: never launch a test run in the background while an earlier one you started is still going, and wait for it before re-running a single spec. A unit-only run takes no lock and can run any time.

Test users live in `tests/support/sd-fixtures.ts`: the test sub-space `test_agents_` (every user, organization and member id, and every email, starts with it; emails are `<id>@test.com`, passwords `passwd`). `tests/global-setup.ts` upserts it in simple-directory (db mode, its prefixed test API) before the spec files are loaded (not for a unit-only run), `tests/state-setup.ts` cleans and seeds it again under the stateful lock, and `clean()` (`DELETE /api/test-env?prefix=test_agents_`) only removes what these accounts own here. Edit that file to add or change a test account, nothing to restart.

The repository ships no dev data. A manual session needs, under another prefix than `test_agents_` so that the tests never clean it: an organization admin, a contributor and an outsider (seeded through simple-directory's test API, `POST /api/test-env/seed`, as `tests/support/sd-fixtures.ts` does), and settings for their organization with a model (the `mock` provider needs no key). Conversations, an autonomous agent and a usage history are optional; the api tests seed their own.

The two `test_agents_org1_*_agent_nhi` users are non-human identities an autonomous agent authenticates as. Each needs an `email` (simple-directory lowercases it unguarded), must belong to exactly one organization, and must carry no `allowedIps`/`ipBinding` — every autonomous agent shares one egress address. Their `nhi.subject` must equal `autonomous-agent:<agent id>`, which is why a dev-only seam creates a fixture agent with a chosen id. `tests/features/autonomous-agents/nhi-fixtures.unit.spec.ts` enforces all of this — including the pairing itself, read out of the specs rather than restated, so renaming an agent id without renaming the subject fails a unit test instead of surfacing as that uniform 401.

Tests are separated in playwright projects: unit (pure functions), api (stateful API endpoints through HTTP) and e2e (UI with playwright browser intrumentation). When working on the e2e part the Playwright test agents provided by the development environment can help.

In case of failures you might find error contexts in `test-results`.

### Workspace packages must be built before running tests

This project has workspace packages whose compiled `.js` files are gitignored, so they must be built before the code that imports them will run.

`npm run dev-setup` builds them all, `npm run build-libs` again after a change.

`lib-vuetify/` and `lib-vue/` are needed for **e2e** tests.

If e2e tests fail with "element(s) not found", check that `lib-vuetify` and `lib-vue` are built before investigating further.

### Debugging e2e failures

When e2e tests fail, follow this order:
1. Check workspace package builds (`ls lib-vuetify/*.js`, `ls lib-vue/*.js`)
2. Use the Playwright MCP tools (`browser_open`, `browser_navigate`, `browser_snapshot`, `browser_console_messages`) to inspect failing pages — do NOT write custom Playwright scripts
3. Check `test-results/` for traces and screenshots
4. Only then dig into component code

A single e2e test failing at random, a different one each run, is first a question for
the ui process's output (`dev/logs/ui.log` under `npm run dev`): a vite `optimized dependencies changed. reloading` line during the run reloaded
whatever page the test was on. `ui/vite.config.ts` gives vite every dependency at startup so this
does not happen; a line naming a new dependency means that list missed it.

### Scenario simulations

The judged scenario simulations of this chat (a simulated person on the `_dev` pages, on the chat opened on an
autonomous agent, and unattended task runs) are not kept in this repository: they run against a whole-platform
dev environment, never from `npm run test`. They drive what this repository serves in development, so a change
to one of these is a change to them too:

- the `_dev` pages (`ui/src/pages/_dev/`);
- the dev MCP process (`dev/mcp-server.ts` over `tests/support/mcp-fixture.ts`): the `platform_*` stand-in, the
  `dev-review-*` catalog servers of `api/config/development.js`, the `/exports/` pages and the planted injection
  sources (`INJECTED_*`);
- the development seams of `api/src/test-env/router.ts`: `autonomous-agent` (an agent enrolled with a fixture
  identity and a chosen platform server), `personal-assistants`, `age-agent-history`, `consolidate-memory`, and
  the prefixed clean;
- the conversation and task run exports (`docs/architecture/conversation-review.md`), the record a run is judged on.

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
