# Scenario simulation harness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A repeatable suite of judged scenario simulations: a persona with a goal drives a real browser against a real page with real WebMCP tools, and a judge reads the transcript and reports where the product misled the user.

**Architecture:** A Playwright project with its own config (`playwright.sim.config.ts`) so simulations never run during `npm run test`. Each case opens one of the `ui/src/pages/_dev/*` chat pages, and a **simulated user** — a Claude Agent SDK subprocess holding a persona and a goal — decides each message by reading what the assistant actually said. The evidence is the sequence of `/v1/chat/completions` requests captured off the network, not the DOM. Verdicts come from a judge subagent dispatched by the `/simulate` skill, because a Playwright process cannot dispatch one.

**Tech Stack:** Playwright, `@anthropic-ai/claude-agent-sdk`, the Claude Code bridge from the previous plan, Node 24 native TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-12-claude-code-bridge-and-simulation-harness-design.md` (§3)

## Global Constraints

- **The bridge must be running** (`npm run dev-bridge`) and the dev stack up (`bash dev/status.sh`). The runner asserts this and fails with a clear message rather than a timeout.
- **Isolation applies to every Claude role.** The simulated user and the judge import `isolationOptions`/`createNeutralCwd` from `dev/claude-bridge/isolation.ts` — neutral cwd, `settingSources: []`, `tools: []`, `strictMcpConfig: true`, scrubbed env. Spec §1.2: launched from this repo, a persona inherits the auto-memory index and knows the bugs the scenario exists to find.
- **No expected output anywhere.** A case carries a goal, never an assertion about the final data. Runs are judged from transcripts.
- **Never add simulations to `playwright.config.ts`.** It runs every project when invoked bare, so `npm run test` would start burning plan quota.
- **Models are pinned and recorded:** `SIM_ASSISTANT_MODEL` (default `sonnet`), `SIM_USER_MODEL` (default `haiku`), `SIM_JUDGE_MODEL` (default `sonnet`). Written into every sidecar and printed by the report.
- **Sequential by default.** Three Claude roles per case on one subscription; `workers: 1`.
- **Code style:** neostandard — no semicolons, single quotes, 2-space indent. `simulations/` is linted and type-checked with no config change (it is absent from both ignore lists — unlike `dev/`).

## File Structure

| File | Responsibility |
|---|---|
| `playwright.sim.config.ts` | The separate project. Long timeouts, one worker, reuses the `tests/` state setup. |
| `simulations/cases/index.ts` | Case registry + lookup. Pure data. |
| `simulations/runner/settings.ts` | Seed owner settings pointing every model role at the bridge. |
| `simulations/runner/chat-driver.ts` | Browser interaction: send, wait for the turn to finish, read the rendered conversation. |
| `simulations/runner/gateway-capture.ts` | Attach a network listener; structure the `/v1/chat/completions` exchanges. |
| `simulations/runner/persona.ts` | The simulated user: prompt construction + the isolated SDK call. |
| `simulations/runner/transcript.ts` | Evidence types and file writing (`.json`, `.run.json`). |
| `simulations/simulate.sim.spec.ts` | One Playwright test per selected case, wiring the above. |
| `simulations/report.ts` | Read verdicts + sidecars, print the table, set the exit code. |
| `.claude/agents/simulation-judge.md` | The judge's definition and verdict schema. |
| `.claude/skills/simulate/SKILL.md` | The orchestration procedure. |
| `tests/features/simulations/*.unit.spec.ts` | Deterministic tests — run in `npm run test`, no model involved. |

---

### Task 1: Config, registry, and deterministic validation

Delivers a runnable (if empty) simulation project and the case registry, with tests that run offline in the normal suite.

**Files:**
- Create: `playwright.sim.config.ts`
- Create: `simulations/cases/index.ts`
- Create: `tests/features/simulations/cases.unit.spec.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `type SimulationCase`, `cases: SimulationCase[]`, `findCases (names: string[]): SimulationCase[]`

- [ ] **Step 1: Write the failing test**

Create `tests/features/simulations/cases.unit.spec.ts`:

```ts
/**
 * Deterministic checks on the simulation case registry. No model involved, so
 * these run in the normal suite; they prove each case is the case it claims to be.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { cases, findCases } from '../../../simulations/cases/index.ts'

test.describe('case registry', () => {
  test('is not empty', () => {
    assert.ok(cases.length > 0)
  })

  test('names are unique', () => {
    assert.equal(new Set(cases.map(c => c.name)).size, cases.length)
  })

  test('every case has a goal, a persona and a dev route', () => {
    for (const c of cases) {
      assert.ok(c.goal.length > 20, `${c.name}: goal should describe an outcome`)
      assert.ok(c.persona.length > 20, `${c.name}: persona should describe a person`)
      assert.ok(c.route.startsWith('/agents/_dev/'), `${c.name}: route ${c.route}`)
      assert.ok(c.maxTurns >= 2 && c.maxTurns <= 12, `${c.name}: maxTurns ${c.maxTurns}`)
    }
  })

  test('no case states an expected result — runs are judged, not diffed', () => {
    for (const c of cases) {
      assert.equal((c as Record<string, unknown>).expected, undefined)
    }
  })

  test('findCases selects by name and rejects unknown names', () => {
    assert.equal(findCases([cases[0].name]).length, 1)
    assert.equal(findCases([]).length, cases.length)
    assert.throws(() => findCases(['no-such-case']), /no-such-case/)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test-unit tests/features/simulations/cases.unit.spec.ts`
Expected: FAIL — cannot find module `simulations/cases/index.ts`

- [ ] **Step 3: Write the registry**

Create `simulations/cases/index.ts`:

```ts
/**
 * What a case is: a page with real WebMCP tools, a person, and something they
 * want. There is deliberately NO expected result — a run is judged by reading
 * its transcript, not by diffing its output against a blob written by whoever
 * wrote the case.
 *
 * Routes point at ui/src/pages/_dev/*, which register the same tools through
 * the same WebMCP path a host application uses.
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

export const cases: SimulationCase[] = [
  {
    name: 'air-quality',
    route: '/agents/_dev/chat-subagent',
    persona: 'You are an environmental officer at a mid-sized French city. You are comfortable with data but you are not a programmer, you do not know what a "schema" or an "aggregation" is, and you will not use those words. You are busy and you ask for what you want in plain language.',
    goal: 'You want to know which monitoring station has the worst PM2.5 air quality, and you want that answer shown on the screen so you can point at it in a meeting this afternoon.',
    maxTurns: 8
  },
  {
    name: 'register-person',
    route: '/agents/_dev/chat-vjsf',
    persona: 'You are an administrative assistant entering records into a form you have never seen before. You do not know what fields it has. You give information the way a person would — a little at a time, and not always in the order the form wants it.',
    goal: 'You need to record a new person: Marie Dupont, 34 years old, and her account should be active. You want to see the form actually filled in, not just be told it was done.',
    maxTurns: 6
  },
  {
    name: 'open-panel',
    route: '/agents/_dev/chat-live-tools',
    persona: 'You are a product manager poking at an internal tool. You are impatient, you describe outcomes rather than steps, and if something does not visibly happen you say so.',
    goal: 'You want some text of your choosing displayed in the panel on the page. The panel starts closed, so it has to be opened before anything can be shown there.',
    maxTurns: 6
  }
]

export function findCases (names: string[]): SimulationCase[] {
  if (names.length === 0) return cases
  return names.map(name => {
    const found = cases.find(c => c.name === name)
    if (!found) throw new Error(`unknown simulation case: ${name} (have: ${cases.map(c => c.name).join(', ')})`)
    return found
  })
}
```

- [ ] **Step 4: Run the test**

Run: `npm run test-unit tests/features/simulations/cases.unit.spec.ts`
Expected: 5 passed

- [ ] **Step 5: Write the Playwright config**

Create `playwright.sim.config.ts`:

```ts
/**
 * Simulations run from their own config, never from playwright.config.ts.
 * A bare `playwright test` runs every project in its config, so adding a
 * simulation project there would make `npm run test` spend plan quota.
 */
import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './simulations',
  testMatch: /.*\.sim\.spec\.ts/,
  workers: 1,
  fullyParallel: false,
  // A judged scenario is many model turns, each of which can be a slow first token.
  timeout: 15 * 60 * 1000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:' + process.env.NGINX_PORT,
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'state-setup', testDir: './tests', testMatch: /state-setup\.ts/, teardown: 'state-teardown' },
    { name: 'state-teardown', testDir: './tests', testMatch: /state-teardown\.ts/ },
    { name: 'simulate', dependencies: ['state-setup'], use: { ...devices['Desktop Chrome'] } }
  ]
})
```

- [ ] **Step 6: Add the npm scripts**

In root `package.json` `scripts`, after `dev-bridge`:

```json
    "simulate": "playwright test -c playwright.sim.config.ts --project=simulate",
    "simulate:report": "node simulations/report.ts",
```

- [ ] **Step 7: Keep evidence out of git**

`.gitignore` has no `tmp` pattern (only `test-results`), so transcripts and verdicts
would otherwise be committed on every run. Append to `.gitignore`:

```
simulations/tmp
```

- [ ] **Step 8: Commit**

```bash
npm run lint-fix && npm run check-types
git add playwright.sim.config.ts simulations/ tests/features/simulations/ package.json .gitignore
git commit -m "feat(sim): simulation case registry and playwright project"
```

---

### Task 2: Settings seeding

**Files:**
- Create: `simulations/runner/settings.ts`
- Test: `tests/features/simulations/settings.unit.spec.ts`

**Interfaces:**
- Produces:
  - `BRIDGE_URL: string`
  - `bridgeSettings (modelId: string): Record<string, unknown>`
  - `seedSettings (modelId: string): Promise<void>`
  - `assertBridgeUp (): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `tests/features/simulations/settings.unit.spec.ts`:

```ts
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { bridgeSettings } from '../../../simulations/runner/settings.ts'

test.describe('bridge settings', () => {
  test('points every model role at the bridge provider', () => {
    const s = bridgeSettings('sonnet') as any
    for (const role of ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator']) {
      assert.equal(s.models[role].model.id, 'sonnet', `${role} model`)
      assert.equal(s.models[role].model.provider.id, 'bridge', `${role} provider`)
    }
  })

  test('uses openai-compatible in compatible mode', () => {
    // The default mode targets /v1/responses, which the bridge does not implement.
    const s = bridgeSettings('sonnet') as any
    assert.equal(s.providers[0].type, 'openai-compatible')
    assert.equal(s.providers[0].compatibility, 'compatible')
  })

  test('gives the admin role unlimited quota so a long scenario is not cut off', () => {
    const s = bridgeSettings('sonnet') as any
    assert.equal(s.quotas.admin.unlimited, true)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test-unit tests/features/simulations/settings.unit.spec.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement**

Create `simulations/runner/settings.ts`:

```ts
/**
 * Point an owner's settings at the Claude Code bridge, so the assistant under
 * test runs on a real model.
 */
import { superAdmin, defaultQuotas } from '../../tests/support/axios.ts'

export const BRIDGE_URL = process.env.BRIDGE_URL ?? 'http://localhost:3194/v1'
export const OWNER = { type: 'user', id: 'test-standalone1' } as const

const provider = {
  id: 'bridge',
  type: 'openai-compatible',
  name: 'Claude Code Bridge',
  enabled: true,
  baseURL: BRIDGE_URL,
  // MANDATORY. In 'default' mode createModel targets /v1/responses, which the
  // bridge does not implement (api/src/models/operations.ts).
  compatibility: 'compatible'
}

export function bridgeSettings (modelId: string) {
  const model = { id: modelId, name: modelId, provider: { type: 'openai-compatible', id: 'bridge', name: 'Claude Code Bridge' } }
  const role = { model, inputPricePerMillion: 0, outputPricePerMillion: 0 }
  return {
    providers: [provider],
    models: { assistant: role, tools: role, summarizer: role, evaluator: role, moderator: role },
    // The scenario user is an account admin; unlimited keeps a long conversation
    // from being cut short by quota rather than by the product.
    quotas: { ...defaultQuotas, admin: { unlimited: true, monthlyLimit: 0 } },
    storeTraces: false
  }
}

export async function seedSettings (modelId: string) {
  const admin = await superAdmin
  await admin.put(`/api/settings/${OWNER.type}/${OWNER.id}`, bridgeSettings(modelId))
}

/** Fail loudly and early: without the bridge every case dies as an opaque timeout. */
export async function assertBridgeUp () {
  const statusUrl = BRIDGE_URL.replace(/\/v1$/, '') + '/_bridge/status'
  try {
    const res = await fetch(statusUrl, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    throw new Error(
      `The Claude Code bridge is not answering at ${statusUrl} (${err instanceof Error ? err.message : String(err)}).\n` +
      'Start it with: npm run dev-bridge'
    )
  }
}
```

- [ ] **Step 4: Run the test**

Run: `npm run test-unit tests/features/simulations/settings.unit.spec.ts`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
npm run lint-fix && npm run check-types
git add simulations/runner/settings.ts tests/features/simulations/settings.unit.spec.ts
git commit -m "feat(sim): seed owner settings against the claude-code bridge"
```

---

### Task 3: The browser chat driver

**Files:**
- Create: `simulations/runner/chat-driver.ts`

**Interfaces:**
- Produces:
  - `sendMessage (page: Page, text: string): Promise<void>`
  - `waitForTurn (page: Page, timeoutMs?: number): Promise<void>`
  - `readConversation (page: Page): Promise<Array<{ role: 'user' | 'assistant', text: string }>>`

No unit test: every function here is a thin wrapper over Playwright locators, so a
test would assert the mock rather than the page. It is exercised by every case.

- [ ] **Step 1: Implement**

Create `simulations/runner/chat-driver.ts`:

```ts
/**
 * Browser-side interaction with the agents chat.
 *
 * Turn completion is detected from the composer button, not from message text:
 * AgentChatInput renders a Stop button while `isStreaming` and a Send button
 * otherwise. Waiting for text would end the turn at the first token of a
 * multi-step tool conversation.
 */
import { expect, type Page } from '@playwright/test'

const INPUT = 'Type your message...'
const TURN_TIMEOUT_MS = 4 * 60 * 1000

export async function sendMessage (page: Page, text: string) {
  await page.getByPlaceholder(INPUT).fill(text)
  await page.getByRole('button', { name: 'Send' }).click()
}

export async function waitForTurn (page: Page, timeoutMs = TURN_TIMEOUT_MS) {
  const stop = page.getByRole('button', { name: 'Stop' })
  // The turn may already be finished by the time we look (a refusal, a cached
  // answer), so a missing Stop button is not an error — only a Stop button that
  // never goes away is.
  await stop.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  await expect(stop).toHaveCount(0, { timeout: timeoutMs })
}

export async function readConversation (page: Page) {
  return await page.evaluate(() => {
    const out: Array<{ role: 'user' | 'assistant', text: string }> = []
    for (const el of document.querySelectorAll('.agent-chat__user-bubble, .assistant-content')) {
      const role = el.classList.contains('agent-chat__user-bubble') ? 'user' as const : 'assistant' as const
      out.push({ role, text: (el.textContent ?? '').trim() })
    }
    return out
  })
}
```

- [ ] **Step 2: Commit**

```bash
npm run lint-fix && npm run check-types
git add simulations/runner/chat-driver.ts
git commit -m "feat(sim): browser chat driver with streaming-aware turn detection"
```

---

### Task 4: Gateway capture — the evidence

**Files:**
- Create: `simulations/runner/gateway-capture.ts`
- Test: `tests/features/simulations/gateway-capture.unit.spec.ts`

**Interfaces:**
- Produces:
  - `type GatewayExchange = { at: number, model: string, toolNames: string[], messageCount: number, lastUserMessage: string, toolCalls: Array<{ name: string, arguments: string }> }`
  - `summariseRequest (body: unknown): GatewayExchange | null`
  - `captureGateway (page: Page): GatewayExchange[]`

- [ ] **Step 1: Write the failing test**

Create `tests/features/simulations/gateway-capture.unit.spec.ts`:

```ts
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { summariseRequest } from '../../../simulations/runner/gateway-capture.ts'

test.describe('gateway capture', () => {
  test('records the tools the page actually registered', () => {
    const ex = summariseRequest({
      model: 'assistant',
      messages: [{ role: 'user', content: 'hi' }],
      tools: [
        { type: 'function', function: { name: 'get_schema' } },
        { type: 'function', function: { name: 'query_data' } }
      ]
    })
    assert.deepEqual(ex?.toolNames, ['get_schema', 'query_data'])
  })

  test('records the tool calls the assistant made', () => {
    const ex = summariseRequest({
      model: 'assistant',
      messages: [
        { role: 'user', content: 'worst station?' },
        { role: 'assistant', tool_calls: [{ id: 'c1', type: 'function', function: { name: 'query_data', arguments: '{"aggregation":"avg"}' } }] }
      ]
    })
    assert.deepEqual(ex?.toolCalls, [{ name: 'query_data', arguments: '{"aggregation":"avg"}' }])
  })

  test('records the last user message so a turn can be located in the transcript', () => {
    const ex = summariseRequest({ model: 'assistant', messages: [{ role: 'user', content: 'first' }, { role: 'assistant', content: 'ok' }, { role: 'user', content: 'second' }] })
    assert.equal(ex?.lastUserMessage, 'second')
    assert.equal(ex?.messageCount, 3)
  })

  test('ignores a body that is not a chat completion request', () => {
    assert.equal(summariseRequest({ nope: true }), null)
    assert.equal(summariseRequest('not json'), null)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test-unit tests/features/simulations/gateway-capture.unit.spec.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement**

Create `simulations/runner/gateway-capture.ts`:

```ts
/**
 * The evidence a run is judged on.
 *
 * Requests to the gateway carry the full message array AND the tool definitions
 * the page registered, so they show what the assistant was actually offered and
 * what it did with it — including sub-agent turns and compaction. The rendered
 * DOM only shows what survived to the screen.
 */
import type { Page } from '@playwright/test'

export type GatewayExchange = {
  at: number
  model: string
  toolNames: string[]
  messageCount: number
  lastUserMessage: string
  toolCalls: Array<{ name: string, arguments: string }>
}

type Body = {
  model?: string
  messages?: Array<{ role?: string, content?: unknown, tool_calls?: Array<{ function?: { name?: string, arguments?: string } }> }>
  tools?: Array<{ function?: { name?: string } }>
}

export function summariseRequest (body: unknown): GatewayExchange | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Body
  if (!Array.isArray(b.messages)) return null

  const users = b.messages.filter(m => m.role === 'user')
  const last = users[users.length - 1]
  return {
    at: Date.now(),
    model: b.model ?? '',
    toolNames: (b.tools ?? []).map(t => t.function?.name ?? '').filter(Boolean),
    messageCount: b.messages.length,
    lastUserMessage: typeof last?.content === 'string' ? last.content : '',
    toolCalls: b.messages.flatMap(m => (m.tool_calls ?? []).map(c => ({
      name: c.function?.name ?? '',
      arguments: c.function?.arguments ?? ''
    })))
  }
}

export function captureGateway (page: Page): GatewayExchange[] {
  const exchanges: GatewayExchange[] = []
  page.on('request', req => {
    if (!req.url().includes('/v1/chat/completions')) return
    let parsed: unknown
    try { parsed = JSON.parse(req.postData() ?? '') } catch { return }
    const summary = summariseRequest(parsed)
    if (summary) exchanges.push(summary)
  })
  return exchanges
}
```

- [ ] **Step 4: Run the test**

Run: `npm run test-unit tests/features/simulations/gateway-capture.unit.spec.ts`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
npm run lint-fix && npm run check-types
git add simulations/runner/gateway-capture.ts tests/features/simulations/gateway-capture.unit.spec.ts
git commit -m "feat(sim): capture gateway exchanges as the judged evidence"
```

---

### Task 5: The simulated user

**Files:**
- Create: `simulations/runner/persona.ts`
- Test: `tests/features/simulations/persona.unit.spec.ts`

**Interfaces:**
- Consumes: `SimulationCase`; `createNeutralCwd`, `isolationOptions` from `dev/claude-bridge/isolation.ts`.
- Produces:
  - `DONE = 'DONE'`
  - `personaSystemPrompt (c: SimulationCase): string`
  - `personaPrompt (conversation: Array<{ role: string, text: string }>, turnsLeft: number): string`
  - `nextUserMessage (c, conversation, turnsLeft): Promise<string>`

- [ ] **Step 1: Write the failing test**

Create `tests/features/simulations/persona.unit.spec.ts`:

```ts
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { personaSystemPrompt, personaPrompt, DONE } from '../../../simulations/runner/persona.ts'
import { cases } from '../../../simulations/cases/index.ts'

const c = cases[0]

test.describe('persona prompting', () => {
  test('the system prompt carries the persona and the goal', () => {
    const p = personaSystemPrompt(c)
    assert.ok(p.includes(c.persona))
    assert.ok(p.includes(c.goal))
  })

  test('the system prompt never mentions the product or its internals', () => {
    const p = personaSystemPrompt(c).toLowerCase()
    for (const leak of ['data-fair', 'webmcp', 'vjsf', 'mcp', 'tool call', 'json schema']) {
      assert.ok(!p.includes(leak), `persona prompt leaks "${leak}"`)
    }
  })

  test('the first turn asks for an opening message with no transcript', () => {
    const p = personaPrompt([], 5)
    assert.ok(p.includes('first message'))
  })

  test('later turns carry the conversation so far', () => {
    const p = personaPrompt([{ role: 'user', text: 'hello' }, { role: 'assistant', text: 'how can I help' }], 3)
    assert.ok(p.includes('how can I help'))
    assert.ok(p.includes(DONE))
  })

  test('warns the persona when it is nearly out of turns', () => {
    assert.ok(personaPrompt([{ role: 'assistant', text: 'x' }], 1).includes('last'))
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test-unit tests/features/simulations/persona.unit.spec.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement**

Create `simulations/runner/persona.ts`:

```ts
/**
 * The simulated user.
 *
 * It is a person with a goal, not a test script: it may be vague, change its
 * mind, or push back, which is what makes this a simulation rather than a
 * fixture. It runs under the same isolation as every other Claude role here —
 * launched from this repo it would inherit the auto-memory index and know the
 * bugs the scenario exists to find (spec §1.2).
 */
import { query } from '@anthropic-ai/claude-agent-sdk'
import { createNeutralCwd, isolationOptions } from '../../dev/claude-bridge/isolation.ts'
import type { SimulationCase } from '../cases/index.ts'

export const DONE = 'DONE'
const NEUTRAL_CWD = createNeutralCwd()

export function personaSystemPrompt (c: SimulationCase): string {
  return [
    c.persona,
    '',
    `What you want: ${c.goal}`,
    '',
    'You are talking to an assistant through a chat box on a web page. Behave like a real person:',
    '- Say what you want in your own words. Do not explain how the assistant should do it.',
    '- If a reply is vague, unhelpful, or does not actually show you the result, say so.',
    '- If you are asked a question, answer it.',
    '- Do not be artificially cooperative, and do not thank the assistant for work it has not done.',
    '',
    'Reply with ONLY the message you would type next — no quotes, no narration, no stage directions.',
    `When you have what you wanted, or you are convinced you will not get it, reply with exactly ${DONE} and nothing else.`
  ].join('\n')
}

export function personaPrompt (conversation: Array<{ role: string, text: string }>, turnsLeft: number): string {
  if (conversation.length === 0) return 'Write your first message to the assistant.'
  const transcript = conversation.map(m => `${m.role === 'user' ? 'you' : 'assistant'}: ${m.text}`).join('\n\n')
  const warning = turnsLeft <= 1
    ? '\n\nThis is your last message. If you already have what you needed, reply ' + DONE + '.'
    : ''
  return [
    'The conversation so far:',
    '',
    transcript,
    '',
    `Write your next message, or ${DONE} if you are finished.${warning}`
  ].join('\n')
}

export async function nextUserMessage (
  c: SimulationCase,
  conversation: Array<{ role: string, text: string }>,
  turnsLeft: number
): Promise<string> {
  let text = ''
  for await (const msg of query({
    prompt: personaPrompt(conversation, turnsLeft),
    options: {
      ...isolationOptions(NEUTRAL_CWD),
      model: process.env.SIM_USER_MODEL ?? 'haiku',
      systemPrompt: personaSystemPrompt(c),
      maxTurns: 1
    }
  })) {
    if (msg.type === 'assistant') {
      for (const block of (msg as any).message?.content ?? []) {
        if (block.type === 'text' && block.text) text += block.text
      }
    }
  }
  return text.trim()
}
```

- [ ] **Step 4: Run the test**

Run: `npm run test-unit tests/features/simulations/persona.unit.spec.ts`
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
npm run lint-fix && npm run check-types
git add simulations/runner/persona.ts tests/features/simulations/persona.unit.spec.ts
git commit -m "feat(sim): adaptive simulated user under the same isolation as the bridge"
```

---

### Task 6: The runner

**Files:**
- Create: `simulations/runner/transcript.ts`
- Create: `simulations/simulate.sim.spec.ts`

**Interfaces:**
- Produces: `type Transcript`, `type RunSidecar`, `evidenceDir`, `writeEvidence (name, transcript, sidecar)`

- [ ] **Step 1: Write the evidence module**

Create `simulations/runner/transcript.ts`:

```ts
/**
 * Evidence files, split in two on purpose.
 *
 * The transcript is what the judge reads. The sidecar records whether the run
 * was VALID — a case that fails to dispatch must report `not run` rather than
 * silently re-reporting the previous run's verdict, which is why both are
 * deleted before a suite and only rewritten by a case that actually executes.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { GatewayExchange } from './gateway-capture.ts'

export const evidenceDir = path.join(process.cwd(), 'simulations', 'tmp')

export type Transcript = {
  case: string
  goal: string
  persona: string
  route: string
  conversation: Array<{ role: string, text: string }>
  gateway: GatewayExchange[]
  consoleErrors: string[]
}

export type RunSidecar = {
  case: string
  valid: boolean
  error?: string
  assistantModel: string
  userModel: string
  turns: number
  durationMs: number
  finishedAt: string
}

export function writeEvidence (name: string, transcript: Transcript, sidecar: RunSidecar) {
  fs.mkdirSync(evidenceDir, { recursive: true })
  fs.writeFileSync(path.join(evidenceDir, `sim-${name}.json`), JSON.stringify(transcript, null, 2))
  fs.writeFileSync(path.join(evidenceDir, `sim-${name}.run.json`), JSON.stringify(sidecar, null, 2))
}
```

- [ ] **Step 2: Write the runner spec**

Create `simulations/simulate.sim.spec.ts`:

```ts
/**
 * One judged scenario per case. There are no assertions about what the
 * assistant should say — the test fails only when the run itself is invalid
 * (the bridge is down, the page did not load, the turn never finished).
 * Whether the product served the user is the judge's call, from the transcript.
 */
import { test } from '../tests/fixtures/login.ts'
import { findCases } from './cases/index.ts'
import { seedSettings, assertBridgeUp } from './runner/settings.ts'
import { sendMessage, waitForTurn, readConversation } from './runner/chat-driver.ts'
import { captureGateway } from './runner/gateway-capture.ts'
import { nextUserMessage, DONE } from './runner/persona.ts'
import { writeEvidence, type Transcript } from './runner/transcript.ts'
import { clean } from '../tests/support/axios.ts'

const ASSISTANT_MODEL = process.env.SIM_ASSISTANT_MODEL ?? 'sonnet'
const USER_MODEL = process.env.SIM_USER_MODEL ?? 'haiku'
const selected = findCases((process.env.SIM_CASES ?? '').split(',').map(s => s.trim()).filter(Boolean))

for (const simCase of selected) {
  test(`simulation: ${simCase.name}`, async ({ page, goToWithAuth }) => {
    const started = Date.now()
    const consoleErrors: string[] = []
    let turns = 0
    let error: string | undefined

    await assertBridgeUp()
    await clean()
    await seedSettings(ASSISTANT_MODEL)

    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    const gateway = captureGateway(page)

    const conversation: Array<{ role: string, text: string }> = []
    try {
      await goToWithAuth(simCase.route, 'test-standalone1')
      await page.getByPlaceholder('Type your message...').waitFor({ state: 'visible', timeout: 30000 })

      for (let i = 0; i < simCase.maxTurns; i++) {
        const message = await nextUserMessage(simCase, conversation, simCase.maxTurns - i)
        if (message === DONE || message === '') break
        turns++
        await sendMessage(page, message)
        await waitForTurn(page)
        conversation.length = 0
        conversation.push(...await readConversation(page))
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    }

    const transcript: Transcript = {
      case: simCase.name,
      goal: simCase.goal,
      persona: simCase.persona,
      route: simCase.route,
      conversation,
      gateway,
      consoleErrors
    }
    writeEvidence(simCase.name, transcript, {
      case: simCase.name,
      valid: !error,
      error,
      assistantModel: ASSISTANT_MODEL,
      userModel: USER_MODEL,
      turns,
      durationMs: Date.now() - started,
      finishedAt: new Date().toISOString()
    })

    // An invalid run must never be judged, so surface it as a test failure.
    if (error) throw new Error(`run invalid: ${error}`)
  })
}
```

- [ ] **Step 3: Run one case end to end**

Requires the dev stack (`bash dev/status.sh`), the workspace packages built
(`lib-vue`, `lib-vuetify`), and `npm run dev-bridge` running.

```bash
SIM_CASES=register-person npm run simulate
```

Expected: the case runs, `simulations/tmp/sim-register-person.json` exists and its
`conversation` holds several turns, and its `.run.json` reports `valid: true`.
Read the transcript before moving on — a run that "passed" but shows the persona
talking past the assistant means the harness, not the product, needs work.

- [ ] **Step 4: Commit**

```bash
npm run lint-fix && npm run check-types
git add simulations/
git commit -m "feat(sim): scenario runner writing judged transcripts"
```

---

### Task 7: Judge, report, and the skill

**Files:**
- Create: `.claude/agents/simulation-judge.md`
- Create: `simulations/report.ts`
- Create: `.claude/skills/simulate/SKILL.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Write the judge definition**

Create `.claude/agents/simulation-judge.md`:

```markdown
---
name: simulation-judge
description: Judge one scenario simulation transcript and return a JSON verdict. Use when asked to verdict a simulation run produced by the /simulate skill.
tools: Read
---

You are judging whether a chat assistant actually served a person, from the
transcript of one simulated conversation.

You are given a case name, the person's goal, and a path to a transcript. Read
the transcript with `Read`; do not ask for it to be pasted.

The transcript holds:
- `conversation` — what the person and the assistant said, as rendered on screen
- `gateway` — every request the page made, carrying the tools it offered and the
  tool calls the assistant actually made
- `consoleErrors` — browser errors during the run

Judge the run against the goal, not against your idea of a good answer. The
person is not a tester: if they had to ask three times, that is a finding even
if the final answer was correct.

**The friction list is the point.** A score says a run went badly; a friction
point says which reply or tool result misled the person and what they concluded.
That is what turns a run into a concrete change to a prompt or a tool
description. Look especially for:
- the assistant claiming it did something the `gateway` record shows it never did
- a tool offered but never used when it was obviously needed, or called with
  arguments that misread the person's words
- the same tool called repeatedly with no progress
- the person having to supply information the assistant could have looked up
- an answer that is correct but never shown where the person asked for it

Return ONLY raw JSON, no code fence, in exactly this shape:

{
  "case": "<case name>",
  "satisfied": true | false,
  "summary": "<one sentence: did the person get what they came for>",
  "frictions": [
    { "turn": <number>, "what": "<what the assistant or a tool did>", "effect": "<what the person concluded or had to do>" }
  ],
  "notes": "<anything a maintainer should know, or empty>"
}

`satisfied` is true only if the person's goal was actually met and visibly so.
An empty `frictions` array is a real answer when a run went cleanly.
```

- [ ] **Step 2: Write the report**

Create `simulations/report.ts`:

```ts
/**
 * Reads the evidence and says what happened. Exit code is non-zero if any case
 * was unsatisfactory, invalid, not judged, or never ran — a suite that cannot
 * fail is not a suite.
 */
import fs from 'node:fs'
import path from 'node:path'
import { findCases } from './cases/index.ts'
import { evidenceDir } from './runner/transcript.ts'

const selected = findCases(process.argv.slice(2))

const read = (file: string) => {
  try { return JSON.parse(fs.readFileSync(path.join(evidenceDir, file), 'utf8')) } catch { return null }
}

let failures = 0
const rows: string[][] = [['case', 'model', 'turns', 'verdict', 'frictions', 'duration']]

for (const c of selected) {
  const run = read(`sim-${c.name}.run.json`)
  const verdict = read(`sim-${c.name}.verdict.json`)
  let state: string
  let frictions = '-'

  if (!run) { state = 'not run'; failures++ } else if (!run.valid) { state = `invalid (${run.error ?? 'unknown'})`; failures++ } else if (!verdict || verdict.case !== c.name) { state = 'not judged'; failures++ } else {
    state = verdict.satisfied ? 'satisfied' : 'UNSATISFACTORY'
    if (!verdict.satisfied) failures++
    frictions = String(verdict.frictions?.length ?? 0)
  }

  rows.push([
    c.name,
    run?.assistantModel ?? '-',
    String(run?.turns ?? '-'),
    state,
    frictions,
    run ? `${Math.round(run.durationMs / 1000)}s` : '-'
  ])
}

const widths = rows[0].map((_, i) => Math.max(...rows.map(r => r[i].length)))
for (const row of rows) console.log(row.map((cell, i) => cell.padEnd(widths[i])).join('  '))

for (const c of selected) {
  const verdict = read(`sim-${c.name}.verdict.json`)
  if (!verdict?.frictions?.length) continue
  console.log(`\n${c.name}: ${verdict.summary}`)
  for (const f of verdict.frictions) console.log(`  - turn ${f.turn}: ${f.what} → ${f.effect}`)
}

console.log(failures === 0 ? '\nall cases satisfied' : `\n${failures} case(s) need attention`)
process.exit(failures === 0 ? 0 : 1)
```

- [ ] **Step 3: Write the skill**

Create `.claude/skills/simulate/SKILL.md`:

```markdown
---
name: simulate
description: Run the scenario simulations - drive real browser conversations with a simulated user, then dispatch a judge per transcript. Use when asked to run the simulations, or after changing a system prompt, a tool description, or the chat orchestration.
---

# Running the scenario simulations

Unit and e2e tests answer "does this mechanism work". This answers "did a person
get what they came for", by having a simulated one try and then judging the
transcript.

## Before you start

Three things must be true, and each fails confusingly if it is not:

1. The dev stack is up — `bash dev/status.sh`.
2. The workspace packages are built — `ls lib-vue/*.js lib-vuetify/*.js`. If they
   are missing, e2e-style runs fail with "element not found".
3. The bridge is running — `npm run dev-bridge`. The runner checks this and says so.

Ask the user to start anything that is down. Never start or stop dev processes yourself.

## Steps

1. **Read the case list** in `simulations/cases/index.ts`. Note each `name` and `goal`.

2. **Delete evidence from earlier runs.**

   ```bash
   rm -f simulations/tmp/sim-*
   ```

   Evidence persists and is only rewritten by a case that actually runs. Without
   this, a case that fails to dispatch reports the previous run's verdict as
   though it were this one's. Deleting first turns that into a visible `not run`.

3. **Run the cases.**

   ```bash
   npm run simulate                              # every case
   SIM_CASES=air-quality npm run simulate        # one case
   ```

   Models are pinned by `SIM_ASSISTANT_MODEL` (default `sonnet`) and
   `SIM_USER_MODEL` (default `haiku`), and recorded per run, so verdicts from
   different tiers are never compared silently.

4. **Ignore the runner's own account of how it went.** The transcript at
   `simulations/tmp/sim-<case>.json` is the evidence. A Playwright `passed` line
   means the run was valid, not that the product behaved.

   A case whose sidecar says `valid: false` must NOT be judged — read
   `simulations/tmp/sim-<case>.run.json` for the recorded error instead.

5. **Dispatch one `simulation-judge` subagent per valid case.** Give it paths, not
   pasted content — transcripts carry every gateway request:

   - the case name and its goal
   - the transcript path, `simulations/tmp/sim-<case>.json`
   - ask for the JSON verdict its own definition specifies

6. **Write each verdict** to `simulations/tmp/sim-<case>.verdict.json` as raw JSON.
   Strip any code fence the judge added. A malformed verdict reports as
   `not judged`, which is deliberate — check the file rather than being surprised.

7. **Report.**

   ```bash
   npm run simulate:report
   ```

   Relay the summary and the friction list. Exit code is non-zero if any case was
   unsatisfactory, invalid, not judged, or never ran.

## Reading the result

The friction list is the point. "Unsatisfactory" tells you a run went badly; a
friction point names the reply or tool result that misled the person and what they
did next — that is what turns a run into a concrete change.

Rate limits are the practical ceiling: three Claude roles per case on one
subscription. A run cut short by a rate limit is an **invalid run**, not a product
failure — check the sidecar before concluding anything.
```

- [ ] **Step 4: Document it in `AGENTS.md`**

Under "Testing", after the e2e debugging section, add:

```markdown
### Scenario simulations

`npm run simulate` drives judged browser conversations: a simulated user with a
persona and a goal talks to the real chat on a `_dev` page, and a judge subagent
reads the transcript. Needs the dev stack, built workspace packages, and
`npm run dev-bridge`. Orchestrated by the `/simulate` skill; cases live in
`simulations/cases/index.ts`. Never added to `playwright.config.ts` — a bare
`npm run test` would otherwise spend plan quota.
```

- [ ] **Step 5: Full verification**

```bash
npm run lint-fix && npm run check-types && npm run test-unit
rm -f simulations/tmp/sim-*
npm run simulate
```

Then dispatch judges per step 5 of the skill, write the verdicts, and run
`npm run simulate:report`. The suite is working when the report prints a verdict
per case and the friction lists say something a maintainer could act on.

- [ ] **Step 6: Commit**

```bash
git add .claude/agents/simulation-judge.md .claude/skills/simulate/ simulations/report.ts AGENTS.md
git commit -m "feat(sim): judge, report and the simulate skill"
```

---

## Self-Review

**Spec coverage:** §3.1 separate config → Task 1. §3.2 case shape → Task 1. §3.3 running a case (seed, capture, turn loop, evidence split) → Tasks 2, 3, 4, 6. §3.4 isolation for every role → Task 5, reusing the bridge's `isolationOptions`. §3.5 simulated user → Task 5. §3.6 judge/report/baselines → Task 7. §3.7 rate limits → Task 7 (skill) and the sidecar's `valid` flag.

**Deliberate deferrals:**
- **data-fair cases.** The spec's "harness in agents, cases for both" still holds, but data-fair's `agents` service is the published image (`ghcr.io/data-fair/agents:main`) under `network_mode: host` — it *can* reach the bridge at `localhost:3194` with no data-fair code change, but it needs that stack running with the `dev` profile and its own account and fixtures. That is a second plan, not a task here. The `SimulationCase` type has no `app`/`baseURL` field yet for the same reason — adding one now would be a guess at what those cases need.
- **Baselines.** `simulations/baselines/<date>/` is in the spec but not built: copying verdict files is a `cp` away, and what a useful baseline looks like should follow from seeing real verdicts rather than being designed before them.

**Type consistency:** `GatewayExchange` is defined in `gateway-capture.ts` and imported by `transcript.ts`; `SimulationCase` in `cases/index.ts` is imported by `persona.ts` and the runner. `DONE` is exported from `persona.ts` and compared in the runner. The verdict shape in the judge definition matches the fields `report.ts` reads (`case`, `satisfied`, `summary`, `frictions[].turn/.what/.effect`).
