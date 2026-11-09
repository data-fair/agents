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

The dev environment is the shared one of the data-fair services (`@data-fair/lib-dev`, the
`data-fair-service` skill of data-fair/lib): one zellij session per checkout, readable by humans,
operated by agents only through `df-dev`. `dev/dev.json` declares what is specific to this repo (drawn
ports, panes and their readiness URLs, setup steps, optional containers), `.zellij.kdl` the panes: `status`
(containers), `ui`, `api`, `mcp` (the dev MCP server), `bridge` (suspended until someone presses Enter in
it), and a free shell.

The user starts the session (`npm run dev-zellij`). An agent never starts or kills it.

| Need | Command |
|---|---|
| What runs, what is broken | `npx --no df-dev status` (containers, panes running / exited / **not ready**, memory) |
| A process's output | `npx --no df-dev logs <pane> -n 100` (`api`, `ui`, `mcp`, `bridge`) |
| Restart one process | `npx --no df-dev restart <pane>`: Ctrl+C, rerun, waits for the pane's readiness URL |
| An optional container | `npx --no df-dev up events` / `down events`, then `restart api` so the config sees it |

- Read the logs before restarting: nodemon and vite already reload on file changes (the `mcp` pane too, on
  `dev/mcp-server.ts` and `tests/support/mcp-fixture.ts`).
- "not ready" from `restart` → report to the user with the logs, never retry in a loop.
- Never `docker compose restart`, `kill`, `zellij action`, nor `npm ci` / `npm install` while the env runs
  (watchers restart on half-installed modules).
- Always `npx --no`: a bare `npx df-dev` downloads an unrelated public package when the dependency is
  missing (dependency confusion). Scripts and CI call `./node_modules/.bin/df-dev`.

Containers: nginx, simple-directory and mongo are the core; `events` is optional (compose profile
`events`, started with `npm run dev-zellij -- --services events` or `df-dev up events`). While it does not
run, the api pane starts with `privateEventsUrl` unset (`df-dev absent-config`, dev/dev.json "optional"),
and the specs that need it skip. CI starts every profile.

Worktrees, from the main checkout: `npx --no df-worktree <branch>` / `npx --no df-worktree-delete <branch>`
(branch names: letters, digits, `.`, `_`, `-`, no `/`, and `agents_<branch>` at most 60 characters).

Ports are drawn per checkout into `.env` (`npx --no df-dev init-env`). Do not modify them. The URLs stay on
`localhost:$NGINX_PORT` (not the `DEV_HOST` df-dev also writes): the NHI fixtures' issuers and the
multi-host specs name it.

The dev file store of autonomous agents is the gitignored dev/data/files (api/config/development.js files).

### The dev MCP server

The `mcp` pane (`dev/mcp-server.ts`) serves the `dev-review-*-mcp` entries of the MCP catalog
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
gathers its tools — the seeded dev fixtures can then be read but not used, which is a confusing way to
discover this is not running. nodemon restarts it on a change to it or to `tests/support/mcp-fixture.ts`.

### Running on Claude Code models

The `bridge` pane runs a local OpenAI-compatible server on `BRIDGE_PORT` (drawn in `.env` like every
other dev port; it used to default to a fixed 3194, which meant two worktrees fought over it and the
second simply failed to start) backed by your Claude Code subscription, so the dev workspace can run on
real models without an API key. It starts suspended: the user presses Enter in it when they want it, so
it being idle is normal. Its output: `npx --no df-dev logs bridge`.

Configure it in the settings UI as an **OpenAI Compatible** provider with base URL
`http://localhost:$BRIDGE_PORT/v1` — the value in `.env`, not a fixed port — and **Compatibility
Mode `compatible`** (the default mode
targets `/v1/responses`, which the bridge does not implement). Leave the API key empty.
Model listing for org providers goes through lib-node's SSRF-guarded axios, which refuses
loopback; `df-dev init-env` writes `SSRF_PUBLIC_IPS=127.0.0.1,::1` to `.env` so the bridge is reachable.

Tick **Reads images** (`imageInput`) on its models for page screenshots and other tool images to reach Claude:
the bridge hands them on as MCP image parts (live tool loop) or image blocks (replayed history). Unset, an
OpenAI-compatible provider gets placeholders instead. The simulation runners set it.

`GET /_bridge/status` reports how many conversations are holding a live `claude` session.
It binds `127.0.0.1` only: it is unauthenticated and spends your subscription.

The whole tree is on one zod major (4). A second zod major makes `api`'s inference blow the
instantiation depth limit (TS2589 in `api/src/moderation/service.ts`): check `npm ls zod` shows a
single version after any bump touching it.

Claude Code cuts an MCP tool's description at 2048 characters, and the bridge serves every tool to it as an MCP tool: a longer description is cut in the listing with a pointer, and given whole in the system prompt (`lib-sim/bridge/openai.ts`, `MCP_DESCRIPTION_LIMIT`). Before that, `code_mode` was simulated without anything past its first tool signatures. No role it serves (assistant, persona, judge) learns more about the product than the product tells it: each query runs in a neutral temp cwd with no tools and a private `CLAUDE_CONFIG_DIR` carrying none of the operator's identity, and fails closed otherwise (`lib-sim/isolation.ts`, asserted by a test). Nothing caches below about 4k tokens of system prompt, so short dev chats showing no cache activity is expected.

### The api pane watches `shared/` too

The api pane runs nodemon from `api/`, so its default watch covers `api/**` only — while `shared/` reaches
the server through a workspace symlink under `node_modules`, which nodemon neither follows nor would see.
Editing the context policy or the loop guards therefore left the running server on the OLD code, silently
invalidating any api or e2e test of that change (it passed a mutation check that should have failed).
`api/nodemon.json` now names `../shared` explicitly in `watch`.

Two things to know when it still looks stale:

- **nodemon reads its own config only at startup.** Changing `api/nodemon.json` restarts the app but not
  nodemon, so a watch-list change needs the pane restarted once: `npx --no df-dev restart api`.
- Verify with the log, not with a guess: look for a fresh `API server listening` line in
  `npx --no df-dev logs api`. A restart takes a second or two, and a test fired too early
  runs against the old process.

### When something is down

If a service is down, do not try to fix the infrastructure. Instead:
1. Run `npx --no df-dev status` to identify what's down.
2. Read the pane's logs (`npx --no df-dev logs <pane>`), or `docker compose logs <service>` for a container.
3. Report the problem clearly to the user with the status output and any relevant log lines.

## Testing

Run tests: `npm run test`
Run specific tests: `npm run test tests/features/settings/settings.api.spec.ts`
Run the smoke set: `npm run test-smoke`

The suite runs in two levels (`docs/architecture/testing.md`): the pre-push hook (`dev/pre-push.sh`) runs
the type check, the unit tests, the `@smoke` api/e2e set and the spec files the push changed; pull
requests and release tags run everything. When iterating, run only the related specs.

If a test fails with a connection error, run `npx --no df-dev status` to diagnose, then stop and ask the user for help.

**One stateful run at a time.** The api and e2e projects share the dev database, and every spec's `clean()` deletes all `test*` documents — so a second run started while one is going wipes the first's freshly seeded data. That looks exactly like product flakiness: a different pair of failures each time, each passing alone, typically a 403 because a spec's own quota settings vanished. `tests/support/stateful-lock.ts` now refuses a second run at setup with an explicit message; do not work around it. In practice this means: never launch a test run in the background while an earlier one you started is still going, and wait for it before re-running a single spec. A unit-only run takes no lock and can run any time.

Test users are defined in `dev/resources/users.template.json` and organizations in `dev/resources/organizations.json`. Modify these as little as possible, but if you do you need to force reload of the simple-directory container `docker compose restart simple-directory`.

`dev/resources/users.json` is **generated** — `dev/render-users.ts` renders it from `users.template.json` (run by `df-dev setup`, by the status pane before it starts the containers, and by CI), resolving `{NGINX_PORT}` and any other `{ENV_VAR}` placeholder, and it is gitignored. Edit the template, never the rendered file. It exists because docker-compose mounts the rendered file straight into simple-directory, which reads it verbatim and does no substitution of its own — so a fixture that names a URL (the autonomous-agent NHI fixtures name this service as their issuer) cannot write the drawn port literally. An unresolved placeholder fails the render loudly rather than reaching simple-directory and surfacing later as an unexplained 401 from the token exchange.

The two `*-autonomous-agent-nhi` users are non-human identities an autonomous agent authenticates as. Each needs an `email` (simple-directory lowercases it unguarded), must belong to exactly one organization, and must carry no `allowedIps`/`ipBinding` — every autonomous agent shares one egress address. Their `nhi.subject` must equal `autonomous-agent:<agent id>`, which is why a dev-only seam creates a fixture agent with a chosen id. `tests/features/autonomous-agents/dev-fixtures.unit.spec.ts` enforces all of this — including the pairing itself, read out of `dev/fixtures.ts` and the specs rather than restated, so renaming an agent id without renaming the subject fails a unit test instead of surfacing as that uniform 401.

Tests are separated in playwright projects: unit (pure functions), api (stateful API endpoints through HTTP) and e2e (UI with playwright browser intrumentation). When working on the e2e part you can use the Claude Code agents `playwright-test-generator` and `playwright-test-generator`.

In case of failures you might find error contexts in `test-results`.

### Workspace packages must be built before running tests

This project has workspace packages whose compiled `.js` files are gitignored, so they must be built before the code that imports them will run.

`npx --no df-dev setup` builds them all, `npm run build-libs` again after a change.

`lib-vuetify/` and `lib-vue/` are needed for **e2e** tests.

`lib-sim/` is needed for **`npm run simulate`**, and for the specs importing `simulations/cases` (`tests/features/simulations/cases.unit.spec.ts`, `tests/features/lib-sim/cases.unit.spec.ts`, `tests/features/lib-sim/persona.unit.spec.ts`, `tests/features/simulations/exports.api.spec.ts`), which reach the built package through it — unbuilt, the whole run fails at collection with `Cannot find module …/lib-agents-sim/index.js`.

If e2e tests fail with "element(s) not found", check that `lib-vuetify` and `lib-vue` are built before investigating further.

### Debugging e2e failures

When e2e tests fail, follow this order:
1. Check workspace package builds (`ls lib-vuetify/*.js`, `ls lib-vue/*.js`)
2. Use the Playwright MCP tools (`browser_open`, `browser_navigate`, `browser_snapshot`, `browser_console_messages`) to inspect failing pages — do NOT write custom Playwright scripts
3. Check `test-results/` for traces and screenshots
4. Only then dig into component code

A single e2e test failing at random, a different one each run, is first a question for
the ui pane's output (`npx --no df-dev logs ui`): a vite `optimized dependencies changed. reloading` line during the run reloaded
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
A judge agent (`simulation-judge`) then reads the transcript, observations included, and the
server's record of the run: the runner downloads each conversation's export —
the same file used to debug a real session — so the seeded account stores
traces and the browser carries the consent cookie. Needs the
dev stack and built workspace packages — `lib-sim` included: `simulations/`
imports it by package name, so a stale build silently runs the old code and
still reports the run valid — and the `bridge` pane started. Orchestrated by the
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
