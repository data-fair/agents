# Test suite

Playwright is the runner of every level: `unit`, `api` and `e2e` projects, specs organised by feature
under `tests/features/<feature>/<name>.<unit|api|e2e>.spec.ts`. The judged agent simulations live under
their own `playwright.sim.config.ts`, so a bare `npm test` can never spend plan quota on them (AGENTS.md,
"Scenario simulations").

| Suffix | What | Needs |
|---|---|---|
| `*.unit.spec.ts` | pure functions | a `.env` (some import `#config`), no server |
| `*.api.spec.ts` | the API over HTTP and its socket | the dev env up; the `state-setup` project checks it and takes the stateful lock |
| `*.e2e.spec.ts` | the UI in Chromium | the dev env up; `e2e-warmup` visits the main routes once first, so a cold vite does not spend a test's timeout transforming them |

api and e2e tests share the dev database, so they run on one worker, and one run at a time
(`tests/support/stateful-lock.ts`, AGENTS.md "One stateful run at a time").

## Two levels: the @smoke set and the full suite

The full suite is too long to run on every push, so it runs in two levels, as in data-fair (its
`docs/architecture/testing.md`, the model shared by the services):

| When | Where | What |
|---|---|---|
| commit | `.husky/pre-commit` | `npm run lint` |
| push | `.husky/pre-push` → `dev/pre-push.sh` | type check, all unit tests, the `@smoke` api/e2e set, and the api/e2e spec files changed since `origin/main` |
| push | `commits.yml` | docker build + staging deploy only, no quality checks |
| pull request | `pull-requests.yml` → `reuse-quality.yml` | the full gate: lint, builds, type check, audit, and the whole unit/api/e2e suite (unit in the static job, api and e2e in two parallel jobs, every optional container started) |
| release tag | `releases.yml` → `reuse-quality.yml` | the full gate, before building the image |

`npm run quality` runs the whole gate locally, for when you want the certainty before pushing.

No nightly run: the shared convention keeps one for the biggest services only (data-fair, portals,
simple-directory); here every pull request and release already runs the full suite.

**Why changed spec files and not `--only-changed`.** Playwright's `--only-changed` follows the import
graph of test files. api and e2e tests reach the code over HTTP, so a change in `api/src` or `ui/src`
never shows up in their imports; only the spec files themselves can be selected reliably.

### The smoke set

Tests tagged `@smoke` (`test('…', { tag: '@smoke' }, async …)`) cover the core flows end to end — a
broken one means the product is broken for most users, not one feature: settings and the model catalog,
a chat turn over the socket and a page tool, the session exchange of an autonomous agent's identity and
its MCP servers, a task run, the quota refusal, the chat UI on its main surfaces and the review page.

Keep it small: the point is that it runs on every push. Tag a test only if it is fast (every run writes
the per-test durations to `dev/logs/test-timings.json`) and exercises a path many features depend on.
A feature-specific regression is what the pull request gate is for. Run it alone with
`npm run test-smoke`.

## Optional services

The core containers (nginx, simple-directory, mongo) always run. Each optional one has a compose
profile named after itself, and an entry in `dev/dev.json` "optional" unplugging it from the API's config
while it does not run (today: `events`). A test that needs one skips when it is down
(`tests/support/optional-services.ts`), so the default local env and the smoke set only need the core,
while CI starts every profile and runs them all. To work on an integration locally:
`npx --no df-dev up events`, then `npx --no df-dev restart api`.

## On a failure

Traces are kept for failed tests only: `npx playwright show-trace test-results/<test>/trace.zip`. In CI
a failed job uploads `test-results/` and `dev/logs/` (the API's, UI's and MCP server's output) as an
artifact, and prints the containers' logs.
