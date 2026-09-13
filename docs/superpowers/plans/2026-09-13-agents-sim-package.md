# `@data-fair/lib-agents-sim` package extraction — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Claude Code bridge and the reusable simulation primitives into a fifth workspace, `lib-sim/`, published as `@data-fair/lib-agents-sim`, so `~/data-fair/data-fair` and `~/data-fair/portals` can consume them.

**Architecture:** The package exports primitives only — chat driver, gateway capture, persona, transcript, report, isolation, types — plus the bridge as a `bin`. Each host repo keeps its own cases, login, settings seeding and runner spec. `agents` is the first consumer of its own package, which is how the extracted boundary gets proven before anyone else adopts it.

**Tech Stack:** Node 24 (native TypeScript stripping), TypeScript with `tsc` emit for publication, Playwright as a peer dependency, `@anthropic-ai/claude-agent-sdk` + `@modelcontextprotocol/sdk` as optional peers.

**Spec:** `docs/superpowers/specs/2026-09-13-agents-sim-package-design.md`

## Global Constraints

- **Package name `@data-fair/lib-agents-sim`, directory `lib-sim/`, first version `0.1.0`.** Public on npm, matching `@data-fair/lib-vue-agents` and `@data-fair/lib-vuetify-agents`.
- **`@playwright/test` is a peerDependency.** Two Playwright copies in one tree break fixtures in ways that are painful to diagnose.
- **`@anthropic-ai/claude-agent-sdk` and `@modelcontextprotocol/sdk` are OPTIONAL peerDependencies** — listed under `peerDependencies` AND marked optional in `peerDependenciesMeta`. The SDK declares `peerDependencies.zod: ^4.0.0`; installing it is what hoisted zod 4 here and broke `ai`'s type inference (TS2589 in `api/src/moderation/service.ts`). Consumers that only want the harness primitives must not pay that cost.
- **Primitives only.** The package never owns the turn loop, the cases, login, or settings seeding. If a task finds itself adding an "adapter interface", stop — that is the boundary this design explicitly rejected.
- **No product behaviour changes.** Nothing under `api/`, `ui/`, `lib-vue/` or `lib-vuetify/` changes.
- **Code style:** neostandard — no semicolons, single quotes, 2-space indent. `npm run lint-fix` before every commit.
- **Build convention:** `outDir: "."`, compiled `.js`/`.d.ts` land beside sources, exactly as `lib-vue` does.
- **Repo-internal imports use relative source paths** (`../../lib-sim/isolation.ts`), so `npm run test-unit` keeps working without a build. Only `simulations/` imports by package name, which is what exercises the published shape — and it already requires built workspace packages.

## File Structure

| File | Responsibility |
|---|---|
| `lib-sim/package.json`, `lib-sim/tsconfig.json` | Workspace + publish config, modelled on `lib-vue/` |
| `lib-sim/index.ts` | Barrel: the package's entire public surface |
| `lib-sim/types.ts` | `SimulationCase`, `Transcript`, `RunSidecar` |
| `lib-sim/isolation.ts` | Moved from `dev/claude-bridge/` — used by both halves |
| `lib-sim/chat-driver.ts` | `createChatDriver(root)`, root-agnostic (Task 4) |
| `lib-sim/gateway-capture.ts` | Moved from `simulations/runner/` |
| `lib-sim/persona.ts` | Moved from `simulations/runner/` |
| `lib-sim/transcript.ts` | Moved from `simulations/runner/` |
| `lib-sim/cases.ts` | `selectCases(all, names)` — the generic half of today's `findCases` |
| `lib-sim/report.ts` | `reportCases(cases, evidenceDir)` — the generic half of today's report |
| `lib-sim/bridge/*.ts` | The bridge, moved wholesale; `bridge/index.ts` is the `bin` |
| `lib-sim/bin/init.ts` | `df-agents-sim-init` — copies templates into a consumer's `.claude/` |
| `lib-sim/templates/` | Judge definition + `/simulate` skill, for copying |
| `simulations/cases/index.ts` | Stays: the case array only |
| `simulations/simulate.sim.spec.ts` | Stays: the runner, importing the package |
| `simulations/report.ts` | Stays: a thin wrapper over `reportCases` |

**Deviation from the spec, deliberate:** the spec listed a `df-agents-sim-report` bin. Dropped — a report must know the host's case list, and a bin cannot without prescribing where cases live, which contradicts primitives-only. The exported `reportCases` plus each host's five-line wrapper is the same thing without the indirection.

---

### Task 1: The `lib-sim` workspace skeleton

Delivers an empty but real workspace that installs, builds, lints and type-checks. Everything else moves into it.

**Files:**
- Create: `lib-sim/package.json`, `lib-sim/tsconfig.json`, `lib-sim/index.ts`, `lib-sim/types.ts`
- Modify: `package.json` (workspaces array)
- Test: `tests/features/lib-sim/barrel.unit.spec.ts`

**Interfaces:**
- Produces: the workspace; `SimulationCase`, `Transcript`, `RunSidecar` types.

- [ ] **Step 1: Write `lib-sim/package.json`**

```json
{
  "name": "@data-fair/lib-agents-sim",
  "version": "0.1.0",
  "description": "Primitives for judged browser simulations of the data-fair agents chat, plus a Claude Code bridge exposing the Agent SDK as an OpenAI-compatible provider.",
  "main": "index.js",
  "type": "module",
  "files": [
    "**/*.js",
    "**/*.d.ts",
    "templates/**"
  ],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "tsc"
  },
  "license": "MIT",
  "peerDependencies": {
    "@playwright/test": "^1.58.0"
  }
}
```

Dependencies and bins are added in Tasks 2 and 6, when the code that needs them lands.

- [ ] **Step 2: Write `lib-sim/tsconfig.json`**

Same as `lib-vue/tsconfig.json` but with `**/*.ts` in `include`, because this package has subdirectories:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": ".",
    "rootDir": ".",
    "lib": ["ESNext", "DOM"]
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "templates"]
}
```

- [ ] **Step 3: Write `lib-sim/types.ts`**

Moved verbatim from `simulations/runner/transcript.ts` and `simulations/cases/index.ts`, with the `GatewayExchange` import left for Task 3:

```ts
/**
 * The shapes a host repo needs to write cases and read evidence.
 */

export type SimulationCase = {
  /** Evidence files are named after this; keep it filesystem-safe. */
  name: string
  route: string
  /** Who the simulated user is. Becomes its system prompt. */
  persona: string
  /** What they came for, in their own words. */
  goal: string
  /** Give up after this many user turns; the judge sees how far it got. */
  maxTurns: number
}
```

- [ ] **Step 4: Write the barrel `lib-sim/index.ts`**

```ts
export type { SimulationCase } from './types.ts'
```

Later tasks append to this file as they move code in.

- [ ] **Step 5: Register the workspace**

In root `package.json`, add `"lib-sim"` to the `workspaces` array, after `"lib-vuetify"`.

- [ ] **Step 6: Write the barrel test**

Create `tests/features/lib-sim/barrel.unit.spec.ts`. This exists because the barrel is the package's entire public surface and nothing else would notice it drifting:

```ts
/**
 * The barrel is what consumers import. A name dropped from it is a breaking
 * change no other test would catch, so it is asserted explicitly.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import * as pkg from '../../../lib-sim/index.ts'

test.describe('package barrel', () => {
  test('exports exactly the documented value surface', () => {
    // Types erase at runtime, so only VALUE exports appear here. Update this
    // list deliberately: an unlisted addition is an accidental public API, and
    // a disappearance is a breaking change for two other repositories.
    const expected: string[] = []
    assert.deepEqual(Object.keys(pkg).sort(), expected.sort())
  })
})
```

- [ ] **Step 7: Install, build, verify**

```bash
npm install
npm run lint-fix && npm run check-types
npm -w @data-fair/lib-agents-sim run build
npm run test-unit tests/features/lib-sim/barrel.unit.spec.ts
```

Expected: install links the workspace (`ls -l node_modules/@data-fair/lib-agents-sim` shows a symlink to `lib-sim`), build emits `index.js`, `index.d.ts`, `types.js`, `types.d.ts`, lint and types clean, 1 test passes.

- [ ] **Step 8: Ignore build output**

The convention is a per-workspace `.gitignore`, not a root entry — `lib-vue/.gitignore`
and `lib-vuetify/.gitignore` are each exactly:

```
*.js
*.d.ts
!env.d.ts
```

Create `lib-sim/.gitignore` with the same three lines. Without it, `tsc` output
lands next to the sources and gets committed on the next `git add -A`.

Note this means `lib-sim/bin/init.ts` compiles to a gitignored `bin/init.js`, which
is correct: it is build output, present in the npm tarball via the `files` array and
absent from git.

- [ ] **Step 9: Commit**

```bash
npm run lint-fix
git add package.json package-lock.json .gitignore lib-sim/ tests/features/lib-sim/
git commit -m "feat(lib-sim): workspace skeleton for @data-fair/lib-agents-sim"
```

---

### Task 2: Move the bridge

**Files:**
- Move: `dev/claude-bridge/{conversation,isolation,openai,sessions,server,tool-server,index}.ts` → `lib-sim/` (`isolation.ts` at the root, the rest under `lib-sim/bridge/`)
- Move: `tests/features/claude-bridge/` → `tests/features/lib-sim/` (keeping filenames)
- Modify: `package.json` (`dev-bridge` script, bridge deps), `lib-sim/package.json` (bin + deps), `tsconfig.json`, `eslint.config.mjs`, `dev/status.sh`, `AGENTS.md`

**Interfaces:**
- Consumes: the Task 1 workspace.
- Produces: `createNeutralCwd()`, `scrubEnv(env)`, `isolationOptions(cwd, env?)` from `lib-sim/isolation.ts`; the `df-agents-bridge` bin.

- [ ] **Step 1: Move the files with git mv, preserving history**

```bash
mkdir -p lib-sim/bridge
git mv dev/claude-bridge/isolation.ts lib-sim/isolation.ts
for f in conversation openai sessions server tool-server index; do
  git mv dev/claude-bridge/$f.ts lib-sim/bridge/$f.ts
done
rmdir dev/claude-bridge
mkdir -p tests/features/lib-sim
git mv tests/features/claude-bridge/*.spec.ts tests/features/lib-sim/
rmdir tests/features/claude-bridge
```

- [ ] **Step 2: Fix the imports the move broke**

In `lib-sim/bridge/*.ts`, the import of `./isolation.ts` becomes `../isolation.ts` (it is now one level up). Every other intra-bridge import is unchanged, since those files moved together.

In the moved test files under `tests/features/lib-sim/`, rewrite the import paths: `../../../dev/claude-bridge/X.ts` becomes `../../../lib-sim/X.ts` for `isolation`, and `../../../lib-sim/bridge/X.ts` for the rest.

Run `npm run check-types` and fix whatever it names — that is the authoritative list of what the move broke.

- [ ] **Step 3: Add the bridge's dependencies and bin to `lib-sim/package.json`**

Add to the file written in Task 1:

```json
  "bin": {
    "df-agents-bridge": "bridge/index.js"
  },
  "peerDependencies": {
    "@playwright/test": "^1.58.0",
    "@anthropic-ai/claude-agent-sdk": "^0.3.269",
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "@anthropic-ai/claude-agent-sdk": { "optional": true },
    "@modelcontextprotocol/sdk": { "optional": true }
  }
```

Keep the two SDKs in the ROOT `package.json` devDependencies — `agents` still installs them for its own use, and the root `overrides` entry stays.

- [ ] **Step 4: Repoint the dev script and the status probe**

Root `package.json`: `"dev-bridge": "mkdir -p dev/logs && node lib-sim/bridge/index.ts 2>&1 | tee dev/logs/dev-bridge.log"` — it runs the `.ts` directly, so no build is needed for interactive use.

`dev/status.sh`: the probe URL is unchanged, but the comment naming `npm run dev-bridge` still applies — read the file and update any path reference.

- [ ] **Step 5: Retire the `dev/`-specific build config**

The bridge no longer lives under `dev/`, so the narrowing added when it did is now dead:
- `eslint.config.mjs`: remove `'!dev/claude-bridge'` and `'!dev/claude-bridge/**'` from the ignores array, leaving `'dev/*'`.
- `tsconfig.json`: remove the `dev/claude-bridge` include narrowing, restoring the plain `"dev"` exclusion.

`lib-sim/` is covered by neither ignore list, so it is linted and type-checked like the other workspaces.

- [ ] **Step 6: Update `AGENTS.md`**

The "Running on Claude Code models" section names `dev/claude-bridge`. Update the path. Also extend the existing "Workspace packages must be built before running tests" note to list `lib-sim` alongside `lib-vue` and `lib-vuetify`.

- [ ] **Step 7: Verify**

```bash
npm run lint-fix && npm run check-types
npm run test-unit tests/features/lib-sim/
npm -w @data-fair/lib-agents-sim run build
node lib-sim/bridge/index.ts &   # then curl, then kill by PID
curl -s http://localhost:3194/v1/models | head -c 80
curl -s http://localhost:3194/_bridge/status
```

Expected: the bridge's existing unit tests pass at their current count, and both endpoints answer. **Kill the bridge by the PID you captured** — do not `pkill -f` on a pattern that also matches your own shell command line, which silently kills the shell.

- [ ] **Step 8: Commit**

```bash
npm run lint-fix
git add -A
git commit -m "refactor(lib-sim): move the claude-code bridge into the package"
```

---

### Task 3: Move the harness primitives

**Files:**
- Move: `simulations/runner/{chat-driver,gateway-capture,persona,transcript}.ts` → `lib-sim/`
- Create: `lib-sim/cases.ts`, `lib-sim/report.ts`
- Modify: `simulations/cases/index.ts`, `simulations/report.ts`, `simulations/simulate.sim.spec.ts`, `lib-sim/index.ts`, moved test files

**Interfaces:**
- Consumes: `lib-sim/isolation.ts` (Task 2), `SimulationCase` (Task 1).
- Produces, all from the barrel: `captureGateway`, `summariseRequest`, `GatewayExchange`; `nextUserMessage`, `personaSystemPrompt`, `personaPrompt`, `isDone`, `DONE`; `writeEvidence`, `evidenceDir`, `Transcript`, `RunSidecar`; `selectCases(all, names)`; `reportCases(cases, evidenceDir)`.

- [ ] **Step 1: Move the four primitive modules**

```bash
for f in chat-driver gateway-capture persona transcript; do
  git mv simulations/runner/$f.ts lib-sim/$f.ts
done
git mv tests/features/simulations/gateway-capture.unit.spec.ts tests/features/lib-sim/
git mv tests/features/simulations/persona.unit.spec.ts tests/features/lib-sim/
```

`simulations/runner/settings.ts` stays — settings seeding is host-specific.

- [ ] **Step 2: Fix imports in the moved files**

- `lib-sim/persona.ts`: `'../../dev/claude-bridge/isolation.ts'` → `'./isolation.ts'`; `'../cases/index.ts'` → `'./types.ts'`.
- `lib-sim/transcript.ts`: its `GatewayExchange` import path becomes `'./gateway-capture.ts'`; move its `Transcript`/`RunSidecar` type declarations into `lib-sim/types.ts` and import them back, so all shared shapes live in one file.
- Moved tests: `'../../../simulations/runner/X.ts'` → `'../../../lib-sim/X.ts'`.

`npm run check-types` names anything missed.

- [ ] **Step 3: Write `lib-sim/cases.ts`**

The generic half of today's `findCases`, which currently closes over the repo's own array:

```ts
import type { SimulationCase } from './types.ts'

/**
 * Select cases by name, or all of them when no name is given. Throws on an
 * unknown name rather than silently running a subset — a typo that quietly
 * runs nothing is worse than an error.
 */
export function selectCases (all: SimulationCase[], names: string[]): SimulationCase[] {
  if (names.length === 0) return all
  return names.map(name => {
    const found = all.find(c => c.name === name)
    if (!found) throw new Error(`unknown simulation case: ${name} (have: ${all.map(c => c.name).join(', ')})`)
    return found
  })
}
```

- [ ] **Step 4: Write `lib-sim/report.ts`**

Move the body of `simulations/report.ts`, turning it from a script into a function. It takes the cases and the evidence directory instead of importing them:

```ts
/**
 * Reads the evidence and says what happened. Returns the failure count so the
 * caller sets the exit code — a suite that cannot fail is not a suite.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { SimulationCase } from './types.ts'

type Verdict = { case: string, satisfied: boolean, summary: string, frictions: Array<{ turn: number, what: string, effect: string }> }

function isValidVerdict (v: unknown, caseName: string): v is Verdict {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return o.case === caseName &&
    typeof o.satisfied === 'boolean' &&
    Array.isArray(o.frictions) &&
    typeof o.summary === 'string'
}

export function reportCases (cases: SimulationCase[], evidenceDir: string): number {
  const read = (file: string) => {
    try { return JSON.parse(fs.readFileSync(path.join(evidenceDir, file), 'utf8')) } catch { return null }
  }
  let failures = 0
  const rows: string[][] = [['case', 'model', 'turns', 'verdict', 'frictions', 'duration']]

  for (const c of cases) {
    const run = read(`sim-${c.name}.run.json`)
    const verdict = read(`sim-${c.name}.verdict.json`)
    let state: string
    let frictions = '-'
    if (!run) { state = 'not run'; failures++ } else if (!run.valid) { state = `invalid (${run.error ?? 'unknown'})`; failures++ } else if (!isValidVerdict(verdict, c.name)) { state = 'not judged'; failures++ } else {
      state = verdict.satisfied === true ? 'satisfied' : 'UNSATISFACTORY'
      if (verdict.satisfied !== true) failures++
      frictions = String(verdict.frictions.length)
    }
    rows.push([c.name, run?.assistantModel ?? '-', String(run?.turns ?? '-'), state, frictions, run ? `${Math.round(run.durationMs / 1000)}s` : '-'])
  }

  const widths = rows[0].map((_, i) => Math.max(...rows.map(r => r[i].length)))
  for (const row of rows) console.log(row.map((cell, i) => cell.padEnd(widths[i])).join('  '))

  for (const c of cases) {
    const verdict = read(`sim-${c.name}.verdict.json`)
    if (!isValidVerdict(verdict, c.name) || verdict.frictions.length === 0) continue
    console.log(`\n${c.name}: ${verdict.summary}`)
    for (const f of verdict.frictions) console.log(`  - turn ${f.turn}: ${f.what} → ${f.effect}`)
  }

  console.log(failures === 0 ? '\nall cases satisfied' : `\n${failures} case(s) need attention`)
  return failures
}
```

Preserve whatever the current `simulations/report.ts` does beyond this — read it before rewriting and carry across anything not represented here.

- [ ] **Step 5: Extend the barrel**

`lib-sim/index.ts` becomes:

```ts
export type { SimulationCase, Transcript, RunSidecar } from './types.ts'
export { createNeutralCwd, scrubEnv, isolationOptions } from './isolation.ts'
export { captureGateway, summariseRequest, type GatewayExchange } from './gateway-capture.ts'
export { nextUserMessage, personaSystemPrompt, personaPrompt, isDone, DONE } from './persona.ts'
export { writeEvidence, evidenceDir } from './transcript.ts'
export { selectCases } from './cases.ts'
export { reportCases } from './report.ts'
export { createChatDriver, type ChatRoot, TURN_TIMEOUT_MS } from './chat-driver.ts'
```

`createChatDriver` does not exist until Task 4 — add that line there, not here, or the build fails.

- [ ] **Step 6: Rewire the repo's own simulations**

`simulations/cases/index.ts` keeps only the array:

```ts
import type { SimulationCase } from '@data-fair/lib-agents-sim'

export const cases: SimulationCase[] = [ /* the three existing cases, unchanged */ ]
```

`simulations/report.ts` becomes a thin wrapper:

```ts
import { reportCases, selectCases, evidenceDir } from '@data-fair/lib-agents-sim'
import { cases } from './cases/index.ts'

process.exit(reportCases(selectCases(cases, process.argv.slice(2)), evidenceDir) === 0 ? 0 : 1)
```

`simulations/simulate.sim.spec.ts`: replace the `./runner/*` imports with one import from `@data-fair/lib-agents-sim`, keeping its `./runner/settings.ts`, `../tests/fixtures/login.ts` and `../tests/support/axios.ts` imports as they are. Replace its `findCases(...)` call with `selectCases(cases, ...)`.

- [ ] **Step 7: Update the barrel test**

`tests/features/lib-sim/barrel.unit.spec.ts` from Task 1 asserted an empty value surface. Update its expected list to the value exports now present (everything in Step 5 except the `type` re-exports), so a dropped export fails loudly.

- [ ] **Step 8: Verify**

```bash
npm -w @data-fair/lib-agents-sim run build   # simulations/ imports by package name
npm run lint-fix && npm run check-types
npm run test-unit
npx playwright test -c playwright.sim.config.ts --list
```

Expected: the unit total is unchanged from before this task (tests moved, none deleted); `--list` still shows 3 simulation cases. Report both numbers.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(lib-sim): move the harness primitives into the package"
```

---

### Task 4: Make the chat driver root-agnostic

The one structural code change. Without it the package cannot drive an embedded chat, which is the entire point of the extraction.

**Files:**
- Modify: `lib-sim/chat-driver.ts`, `lib-sim/index.ts`, `simulations/simulate.sim.spec.ts`

**Interfaces:**
- Produces: `type ChatRoot = Page | FrameLocator`; `createChatDriver(root: ChatRoot): { sendMessage(text), waitForTurn(timeoutMs?), readConversation() }`; `TURN_TIMEOUT_MS`.

- [ ] **Step 1: Rewrite `lib-sim/chat-driver.ts`**

```ts
/**
 * Browser-side interaction with the agents chat.
 *
 * The root is a Page when the chat IS the page (this repo's _dev pages) and a
 * FrameLocator when it is embedded (data-fair, portals — lib-vuetify renders
 * agents' own UI in an iframe, so the selectors are identical either way).
 *
 * Turn completion is detected from the composer button, not from message text:
 * AgentChatInput renders a Stop button while streaming and a Send button
 * otherwise. Waiting for text would end the turn at the first token of a
 * multi-step tool conversation.
 */
import { expect, type Page, type FrameLocator } from '@playwright/test'

export type ChatRoot = Page | FrameLocator

const INPUT = 'Type your message...'

// The app's own watchdog is a 90s IDLE timer that re-arms per stream part, so a
// legitimate multi-step turn has no fixed ceiling on total time. This bounds the
// harness generously rather than recording a slow-but-working turn as a failure.
export const TURN_TIMEOUT_MS = 10 * 60 * 1000

export function createChatDriver (root: ChatRoot) {
  return {
    async sendMessage (text: string) {
      await root.getByPlaceholder(INPUT).fill(text)
      await root.getByRole('button', { name: 'Send' }).click()
    },

    async waitForTurn (timeoutMs = TURN_TIMEOUT_MS) {
      const stop = root.getByRole('button', { name: 'Stop' })
      // The turn may already be finished by the time we look, so a missing Stop
      // button is not an error — only one that never goes away is.
      await stop.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
      await expect(stop).toHaveCount(0, { timeout: timeoutMs })
    },

    async readConversation () {
      // evaluateAll, not page.evaluate: FrameLocator has no evaluate, and this
      // runs in the right frame's context either way while preserving document order.
      return await root.locator('.agent-chat__user-bubble, .assistant-content').evaluateAll(els =>
        els.map(el => ({
          role: el.classList.contains('agent-chat__user-bubble') ? 'user' as const : 'assistant' as const,
          text: (el.textContent ?? '').trim()
        }))
      )
    }
  }
}
```

No unit test: every function is a thin Playwright locator wrapper, so a test would assert a mock. The real exercise is Task 5's iframe case plus the three existing cases, which run this code against a live page.

- [ ] **Step 2: Add it to the barrel**

Append the `createChatDriver` line from Task 3 Step 5 to `lib-sim/index.ts`.

- [ ] **Step 3: Update the runner to use the driver object**

In `simulations/simulate.sim.spec.ts`, replace the three free-function calls with a driver built once after navigation:

```ts
const chat = createChatDriver(page)
// ...
await chat.sendMessage(message)
await chat.waitForTurn()
const next = await chat.readConversation()
```

Keep the existing read-then-clear-then-push ordering — clearing before the read resolves would empty the transcript if it threw.

- [ ] **Step 4: Verify**

```bash
npm -w @data-fair/lib-agents-sim run build
npm run lint-fix && npm run check-types
npm run test-unit
npx playwright test -c playwright.sim.config.ts --list
```

Expected: unchanged unit count, 3 cases listed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(lib-sim): make the chat driver work through a frame"
```

---

### Task 5: Exercise the iframe path

The spec's load-bearing test. `/agents/_dev/chat-iframe` already reproduces the host pattern — its parent page registers `set_data` through `navigator.modelContext`, embeds `/_dev/chat-iframe-child` (which renders `AgentChat`) in a real `<iframe>`, and the tool crosses over BroadcastChannel. Nothing in this repo has ever driven a chat through a frame, so this task is as much investigation as implementation.

**Files:**
- Modify: `simulations/cases/index.ts`, `simulations/simulate.sim.spec.ts`

- [ ] **Step 1: Read the page before writing the case**

```bash
sed -n '1,60p' ui/src/pages/_dev/chat-iframe.vue
cat ui/src/pages/_dev/chat-iframe-child.vue
```

Note the iframe's DOM position and any attribute usable as a stable `frameLocator` selector. If there is exactly one iframe on the page, `page.frameLocator('iframe')` is sufficient and preferable to a brittle selector.

- [ ] **Step 2: Add the case**

Append to the array in `simulations/cases/index.ts`:

```ts
  {
    name: 'iframe-set-data',
    route: '/agents/_dev/chat-iframe',
    persona: 'You are an office worker who has been given a link to an internal tool and told it can fill things in for you. You have no idea how it works underneath and no interest in finding out. You say what you want in plain words and you expect to see it happen.',
    goal: 'You want the text "Hello from the iframe" put into the data box on the page. You want to see it actually appear there, not just be told it was done.',
    maxTurns: 5
  }
```

- [ ] **Step 3: Teach the runner to resolve the root**

A case whose chat is embedded needs a `FrameLocator`. Add an optional field to the case rather than hard-coding the route, so later cases can opt in:

In `simulations/cases/index.ts`, extend the local case shape with `embedded?: boolean` (the package's `SimulationCase` stays as it is — this is host-specific wiring, and the package must not grow an adapter):

```ts
export type LocalCase = SimulationCase & { embedded?: boolean }
export const cases: LocalCase[] = [ /* ... */ ]
```

and set `embedded: true` on the new case.

In `simulations/simulate.sim.spec.ts`, after navigation:

```ts
const root = simCase.embedded ? page.frameLocator('iframe') : page
const chat = createChatDriver(root)
await root.getByPlaceholder('Type your message...').waitFor({ state: 'visible', timeout: 30000 })
```

replacing the existing unconditional `page.getByPlaceholder(...).waitFor(...)`.

- [ ] **Step 4: Confirm the three unknowns with a live run**

This needs the dev stack, built workspace packages, and the bridge — all of which the user starts. Ask them to start the bridge if it is down; never start or stop dev processes yourself.

```bash
rm -f simulations/tmp/sim-*
SIM_CASES=iframe-set-data npm run simulate
```

Then read `simulations/tmp/sim-iframe-set-data.json` and record, in the report, an explicit answer to each:

1. **Turn detection through a frame** — did `waitForTurn` track the Stop/Send toggle, or did turns end early/hang? Evidence: the number of conversation entries versus `turns` in the sidecar.
2. **The BroadcastChannel registration race** — was `set_data` present in the `toolNames` of the FIRST gateway exchange, or did it only appear later? If only later, the runner needs an explicit wait before the first message, and this task is not done.
3. **Subframe request capture** — is `gateway` non-empty? If it is empty, `page.on('request')` does not see subframe traffic, `captureGateway` needs fixing, and the evidence layer would be silently blank for every host repo. This is the most consequential of the three.

If any answer is bad, fix it here — that is what this task is for.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test(sim): drive the chat through an iframe, as host apps do"
```

---

### Task 6: Publishing metadata

**Files:**
- Create: `lib-sim/templates/simulation-judge.md`, `lib-sim/templates/simulate-skill.md`, `lib-sim/bin/init.ts`, `lib-sim/README.md`
- Modify: `lib-sim/package.json`

- [ ] **Step 1: Copy the two `.claude/` files into templates**

```bash
mkdir -p lib-sim/templates
cp .claude/agents/simulation-judge.md lib-sim/templates/simulation-judge.md
cp .claude/skills/simulate/SKILL.md lib-sim/templates/simulate-skill.md
```

They are copied, not moved: this repo keeps using its own, and the templates are what consumers receive.

- [ ] **Step 2: Write the init bin**

```ts
#!/usr/bin/env node
/**
 * Copies the judge definition and the /simulate skill into the consuming repo's
 * .claude/ directory. They cannot be loaded from node_modules — Claude Code reads
 * them from the repository — so they are copied and can drift. The version is
 * printed so drift is at least detectable.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const templates = path.join(here, '..', 'templates')
const pkg = JSON.parse(fs.readFileSync(path.join(here, '..', 'package.json'), 'utf8'))
const cwd = process.cwd()

const targets = [
  { from: 'simulation-judge.md', to: path.join(cwd, '.claude', 'agents', 'simulation-judge.md') },
  { from: 'simulate-skill.md', to: path.join(cwd, '.claude', 'skills', 'simulate', 'SKILL.md') }
]

for (const { from, to } of targets) {
  fs.mkdirSync(path.dirname(to), { recursive: true })
  if (fs.existsSync(to) && !process.argv.includes('--force')) {
    console.log(`skipped (exists, use --force): ${path.relative(cwd, to)}`)
    continue
  }
  fs.copyFileSync(path.join(templates, from), to)
  console.log(`wrote ${path.relative(cwd, to)}`)
}
console.log(`from @data-fair/lib-agents-sim@${pkg.version}`)
```

Register it: `"df-agents-sim-init": "bin/init.js"` in the `bin` map.

- [ ] **Step 3: Write `lib-sim/README.md`**

It must state, concretely: what the package is; that `@playwright/test` is a peer; that the bridge needs `npm i -D @anthropic-ai/claude-agent-sdk @modelcontextprotocol/sdk` because they are optional peers; the zod warning verbatim —

> If your tree also contains the `ai` package, installing the Agent SDK may hoist zod 4 and break `ai`'s type inference. Add `"overrides": { "@anthropic-ai/claude-agent-sdk": { "zod": "3.25.76" } }`.

— that `df-agents-sim-init` copies the judge and skill and that they can drift; and a minimal runner example showing `createChatDriver(page.frameLocator('iframe'))` for an embedded chat.

- [ ] **Step 4: Verify the published shape**

```bash
npm -w @data-fair/lib-agents-sim run build
cd lib-sim && npm pack --dry-run 2>&1 | tail -40; cd ..
```

Confirm the listing contains `index.js`, `index.d.ts`, the primitive `.js`/`.d.ts`, `bridge/*.js`, `bin/init.js`, `templates/*.md`, `README.md` — and contains **no** `.ts` sources and no `tests/`. If `.ts` files appear, the `files` array is wrong.

- [ ] **Step 5: Confirm the bin fails well without the SDK**

The optional peer means a consumer can run the bridge without it. Verify the failure is actionable rather than a raw module-not-found: read `lib-sim/bridge/index.ts`, and if it does not already, wrap the SDK import so a missing module prints a message naming the install command. Add a unit test asserting that message exists as a string constant in the module, so it cannot be silently deleted.

- [ ] **Step 6: Full verification**

```bash
npm run lint-fix && npm run check-types && npm run test-unit && npm run test-api
```

Then report the unit and api counts.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(lib-sim): templates, init bin and publishing metadata"
```

---

## Self-Review

**Spec coverage:** §1 package shape → Tasks 1, 3, 6. §2 templates problem → Task 6. §3 root-agnostic driver → Task 4, exercised in Task 5. §4 dependencies and the zod hazard → Task 2 Step 3 (optional peers) and Task 6 Step 3 (documented). §5 migration inside agents → Tasks 2 and 3, including the tsconfig/eslint retirement and `dev/status.sh`/`AGENTS.md`. Testing section → Task 3 Step 8 (moved tests), Task 5 (the frame test and its three unknowns), Task 6 Step 5 (absent-SDK message).

**Deliberate spec deviation:** the `df-agents-sim-report` bin is dropped, with the reasoning recorded in the File Structure section — a bin cannot know the host's cases without prescribing where they live.

**Known risk this plan does not remove:** `lib-sim/bridge/server.ts` still has no tests, and the `abortController` wiring still has no regression guard (the SDK declares the option optional, so deleting it compiles). Moving the file does not change that, and publishing raises the cost. It is out of scope here but should be the first follow-up.

**Type consistency:** `SimulationCase` is defined once in `lib-sim/types.ts` and imported everywhere; `Transcript`/`RunSidecar` move there in Task 3 Step 2 and are re-exported from the barrel. `ChatRoot`, `createChatDriver` and `TURN_TIMEOUT_MS` are introduced in Task 4 and barrel-exported there, not in Task 3. `selectCases(all, names)` replaces the old `findCases(names)` at every call site (runner and report), and `reportCases(cases, evidenceDir)` returns a failure count that the host's wrapper turns into an exit code.
