# `@data-fair/lib-agents-sim` — extracting the bridge and harness into a published package

> Design spec. Makes the Claude Code bridge and the scenario simulation harness
> reusable from `~/data-fair/data-fair` and `~/data-fair/portals`, which today can
> only borrow them by copy-paste.

## Problem

Both pieces built on `chore-local-dev` live inside the `agents` repository and are
reachable only from it:

- `dev/claude-bridge/` — a local OpenAI-compatible server backed by the Claude Agent
  SDK, so a dev workspace runs on a subscription instead of an API key.
- `simulations/` — judged browser scenarios: a simulated user with a persona and a
  goal drives the real chat, a network capture records the evidence, a judge
  subagent verdicts the transcript.

The first judged run (`docs/simulations/2026-09-13-first-eval.md`) found a real
product defect that no unit or e2e test could catch. That value should not be
confined to one repository — data-fair and portals embed the same chat and talk to
the same gateway, and are where the product's actual tools live.

**The road already exists.** This repo publishes `@data-fair/lib-vue-agents` and
`@data-fair/lib-vuetify-agents`; data-fair's `ui/` and portals' `ui/` *and* `portal/`
already depend on both. Publishing a third package is a paved path, not a new one.

## Goal

One published package, `@data-fair/lib-agents-sim`, from which data-fair and portals
can run the bridge and build their own judged scenarios — with each repo keeping its
own cases, login and settings seeding.

## Non-goals

- **Adopting the package in data-fair or portals.** Separate repositories, separate
  plans. This spec ends when `agents` consumes the package and it is publishable.
- Fixing the defect the first eval found. Tracked separately.
- Baselines (`simulations/baselines/`), still deferred.
- Automating publication. It stays manual, as the two existing packages are.

## Design

### 1. Package shape

A fifth workspace, `lib-sim/`, published as `@data-fair/lib-agents-sim`, first
release `0.1.0`. The directory name follows the existing convention (`lib-vue` →
`@data-fair/lib-vue-agents`).

**Exports — the primitives:**

| Export | From |
|---|---|
| `createChatDriver(root)` → `sendMessage`, `waitForTurn`, `readConversation` | `chat-driver.ts` |
| `captureGateway(page)`, `summariseRequest(body)` | `gateway-capture.ts` |
| `nextUserMessage`, `personaSystemPrompt`, `personaPrompt`, `isDone`, `DONE` | `persona.ts` |
| `writeEvidence`, `evidenceDir` | `transcript.ts` |
| types `SimulationCase`, `Transcript`, `RunSidecar`, `GatewayExchange` | — |
| `createNeutralCwd`, `isolationOptions` | `isolation.ts` |
| `reportCases(names, evidenceDir)` | `report.ts` |

**Bins:** `df-agents-bridge` (the server), `df-agents-sim-report`, `df-agents-sim-init`.

**What stays in every host repo:** its cases, its login, its settings seeding, and its
own runner spec (~40 lines). That is where the three repos genuinely differ —
data-fair and portals each already have their own Playwright setup and login helpers,
and forcing all three through one abstraction would mean fighting three test
harnesses at once. The turn loop is duplicated per repo, deliberately: it is small,
and it is the part most likely to need local adjustment.

### 2. The `.claude/` templates problem

The judge definition (`.claude/agents/simulation-judge.md`) and the `/simulate` skill
cannot be loaded from `node_modules` — Claude Code reads them from the repository.

But the judge prompt encodes semantics learned the hard way, and a host repo writing
its own from scratch would re-learn them by getting wrong verdicts:

- `gateway[].toolCalls` is **cumulative** — exchange N holds every call from turns
  1..N, because the protocol resends the whole history. A judge that misses this
  reports the same call as repeated.
- The assistant's **final** reply never appears in `gateway` at all — no later
  request resends it — so it must be read from `conversation`. A judge that misses
  this concludes the assistant never answered.

So the package ships both as `templates/`, and `df-agents-sim-init` copies them into
the consuming repo's `.claude/`. **Copied, not linked**: they can drift from the
package, and that is the accepted cost of how `.claude/` loading works. The init bin
prints the package version it copied from, so drift is at least detectable.

### 3. The chat driver becomes root-agnostic

This is the only structural code change, and it is what makes host reuse possible.

In data-fair and portals the chat is not a page of their own: `lib-vuetify` embeds
**agents' own UI in an iframe** (d-frame; `AgentChat.vue` imports
`useVueRouterDFrameContent`). The good news is that the selectors are therefore
identical in all three repos — it is literally the same widget. The bad news is that
Playwright must reach them through a `FrameLocator`.

`createChatDriver(root)` accepts a `Page` **or** a `FrameLocator`:

- `sendMessage` and `waitForTurn` need no change — `getByPlaceholder` and
  `getByRole` exist on both, as does the Stop/Send turn detection.
- `readConversation` must change. It currently calls `page.evaluate`, which
  `FrameLocator` does not have. It becomes
  `root.locator('.agent-chat__user-bubble, .assistant-content').evaluateAll(...)`,
  preserving document order and class-based role detection while working identically
  through a frame.

`captureGateway(page)` needs no change: `page.on('request')` fires for subframe
requests, so it captures the embedded chat's traffic as-is.

Opening a drawer so the iframe exists at all is host-specific and stays in the host's
runner.

### 4. Dependencies, and the tree hazard

`@playwright/test` is a **peerDependency**. Two Playwright copies in one tree break
fixtures in ways that are painful to diagnose.

`@anthropic-ai/claude-agent-sdk` is an **optional peerDependency** — declared under
`peerDependencies` and marked `peerDependenciesMeta: { "@anthropic-ai/claude-agent-sdk":
{ "optional": true } }`, so npm neither installs it nor warns when it is absent. This
is deliberate and load-bearing:

> The SDK declares `peerDependencies.zod: ^4.0.0`. Installing it in *this* repo is
> what hoisted zod 4 and broke `ai`'s type inference — the `TS2589` errors in
> `api/src/moderation/service.ts` that a scoped `overrides` entry now suppresses.
> data-fair and portals have no such override, so a plain dependency would perturb
> their trees on install.

Only the `df-agents-bridge` bin needs the SDK. A repo that wants the harness
primitives — to drive a chat against a provider it already has — should not pay for
it. The bin fails with a clear message naming the install command if the SDK is
absent.

Consumers that *do* install it are told, in the package README, that they may need
`"overrides": { "@anthropic-ai/claude-agent-sdk": { "zod": "3.25.76" } }` if their
tree also contains the `ai` package.

`@modelcontextprotocol/sdk` is likewise only needed by the bridge, and travels with it.

### 5. Migration inside `agents`

`dev/claude-bridge/` moves into `lib-sim/`. `simulations/` keeps its cases and its
runner spec, and imports everything else from the workspace.

This is deliberate dogfooding: `agents` proves the extracted surface works before
either other repo adopts it, instead of the boundary turning out wrong across three
codebases at once. The existing simulation run continuing to pass **is** the
integration test of the extraction.

Consequential follow-ons:
- `lib-sim/` gets its own `tsconfig.json`, as `lib-vue` and `lib-vuetify` do — which
  retires the narrowed `dev/claude-bridge` include in the root `tsconfig.json` and
  the matching eslint un-ignore, both added when the bridge lived under `dev/`.
- `dev/status.sh` and the `AGENTS.md` bridge section reference the old path and the
  `npm run dev-bridge` script; both need updating.
- The root `overrides` entry stays — `agents` still installs the SDK for its own use.

## Testing

- **Moved unit tests keep running.** The bridge's and harness's existing unit tests
  travel with the code; `npm run test-unit` must still pass at its current count.
- **The extraction's integration test is the harness itself**: `npm run simulate`
  against the three existing cases, which must still produce valid runs. A failure
  here means the boundary is wrong.
- **The root-agnostic driver needs a real frame test.** Unit-testing `createChatDriver`
  against a `FrameLocator` asserts a mock. Instead, add a fourth case, or a variant of
  an existing one, that drives the chat through `lib-vuetify`'s embedded widget on one
  of the `_dev` iframe pages (`chat-iframe.vue`, `chat-iframe-tools.vue` already
  exist). Without this, the iframe path ships untested and the first consumer
  discovers the bug.
- **The bin must fail well without the SDK.** A test asserting the absent-SDK path
  prints an actionable message, since that is the first thing a consumer will hit.

## Risk / blast radius

- **`agents` itself:** moderate. Files move, imports change repo-wide, and build
  config shifts. Mitigated by the simulation suite as an end-to-end check.
- **Product code:** none. No file under `api/`, `ui/`, `lib-vue/` or `lib-vuetify/`
  changes behaviour.
- **Consumers:** the package is a new interface two repos will depend on. The
  primitives-only boundary keeps that surface small, but it is still a surface — a
  breaking change to `createChatDriver` or the evidence types would mean a major
  bump for both.
- **Untested-by-construction:** `server.ts` still has no tests (recorded on the
  previous branch), and the `abortController` wiring still has no regression guard —
  the SDK declares the option optional, so deleting it compiles. Moving the file does
  not fix that, and publishing it raises the cost of the gap.
