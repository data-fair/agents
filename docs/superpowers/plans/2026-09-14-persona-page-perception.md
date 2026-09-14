# Persona page perception — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the simulated user actually look at the page and act on it, so that "I don't see it" is a checkable statement rather than an invention.

**Architecture:** A new `lib-sim/page-perception.ts` builds an in-process MCP server exposing three human-shaped tools — `look`, `click`, `type` — whose handlers run against the runner's existing Playwright root(s) and record every call as an observation. `nextUserMessage` gains an optional perception argument; the runner creates one per case and writes its observations into the transcript, so a judge can tell a real failure from a persona that never looked.

**Tech Stack:** Node 24 (native TypeScript stripping), `@modelcontextprotocol/sdk` low-level `Server`, Playwright `ariaSnapshot`, the Claude Agent SDK for the persona subprocess.

**Spec:** `docs/superpowers/specs/2026-09-14-persona-page-perception-design.md`

## Global Constraints

- **No `evaluate`, no raw CSS selectors, no DOM access in the persona's tool set.** This exclusion IS the design: a persona that can run JavaScript verifies outcomes no human could, trading today's wrongly-pessimistic verdicts for wrongly-optimistic ones. Task 1 adds a test that fails if the tool set grows such an escape hatch.
- **The persona never sends chat messages itself.** It replies with its message and the runner sends it. Otherwise the loop double-sends and `maxTurns`, the `DONE` sentinel and the empty-completion guard stop being harness invariants.
- **Isolation is unchanged:** neutral cwd, `settingSources: []`, `tools: []`, `strictMcpConfig: true`. The persona gains exactly one MCP server — the page — and still no built-in Claude Code tools.
- **`maxTurns` for the persona query rises from `1` to `6`** — enough for look → act → look → reply, low enough to bound a confused persona. A starting point to revisit from a real run, not a measured value.
- **Stored snapshots are truncated to 4000 characters** with an explicit `…[truncated]` marker. Also a starting point.
- **Package changes are additive**, so the published `0.2.0` contract keeps working and the version moves to `0.3.0`.
  *(Post-review correction: `Transcript.observations` shipped required, not optional — see spec §5 and `lib-sim/README.md`. Kept required deliberately, as the one intentional breaking change.)*
- **Code style:** neostandard — no semicolons, single quotes, 2-space indent. `npm run lint-fix` before every commit.
- **Repo-internal tests import `lib-sim` source by relative path**; only `simulations/` imports by package name and therefore needs `npm -w @data-fair/lib-agents-sim run build` first.

## File Structure

| File | Responsibility |
|---|---|
| `lib-sim/page-perception.ts` | The tool set, its MCP server, the Playwright handlers, observation recording, snapshot truncation |
| `lib-sim/persona.ts` | Accepts an optional perception; wires the MCP server and `allowedTools` into the query |
| `lib-sim/types.ts` | `Observation`; `Transcript.observations` |
| `lib-sim/index.ts` | Barrel re-exports |
| `simulations/simulate.sim.spec.ts` | Creates a perception per case from its roots, stamps the turn, passes it through, writes observations to evidence |
| `.claude/agents/simulation-judge.md` + `lib-sim/templates/simulation-judge.md` | Told that observations exist and that an unobserved visual claim is a harness fault |
| `tests/features/lib-sim/page-perception.unit.spec.ts` | The exclusion guard, truncation, observation recording |

**Correction to the spec, deliberate:** §1 says the persona uses "the same construction" as the bridge. It reuses the *pattern*, not `createToolServer` itself — that function takes OpenAI tool definitions and suspends its handlers across an HTTP boundary, and the persona needs neither. A separate small module is simpler than generalising a function with two consumers that share no requirements.

---

### Task 1: The perception module

**Files:**
- Create: `lib-sim/page-perception.ts`
- Test: `tests/features/lib-sim/page-perception.unit.spec.ts`

**Interfaces:**
- Produces:
  - `type PerceptionRoot = { label: string, root: { locator: (sel: string) => any, getByRole: Function, getByText: Function, getByLabel: Function } }` — structurally satisfied by Playwright's `Page` and `FrameLocator`
  - `type Observation = { turn: number, tool: string, args: unknown, result: string }`
  - `type PagePerception = { server: unknown, observations: Observation[], setTurn: (turn: number) => void, toolNames: string[] }`
  - `createPagePerception (roots: PerceptionRoot[]): PagePerception`
  - `SNAPSHOT_CAP = 4000`, `truncate (text: string): string`
  - `MCP_SERVER_NAME = 'page'`

- [ ] **Step 1: Write the failing test**

Create `tests/features/lib-sim/page-perception.unit.spec.ts`. The Playwright calls are thin wrappers, so what is worth testing is the exclusion, the truncation and the recording — driven through fake roots that record what was asked of them:

```ts
/**
 * The persona's page tools. The exclusion test is the important one: the design
 * deliberately withholds evaluate and raw selectors, because a persona that can
 * run JavaScript verifies what no person could — which would make verdicts
 * wrongly optimistic instead of wrongly pessimistic.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createPagePerception, truncate, SNAPSHOT_CAP, MCP_SERVER_NAME } from '../../../lib-sim/page-perception.ts'

const fakeRoot = (snapshot: string, log: string[] = []) => ({
  locator: (sel: string) => ({ ariaSnapshot: async () => snapshot, click: async () => { log.push('click ' + sel) }, fill: async (t: string) => { log.push('fill ' + t) } }),
  getByRole: (role: string, opts: { name: string }) => ({ first: () => ({ click: async () => { log.push(`click ${role}:${opts.name}`) }, fill: async (t: string) => { log.push(`fill ${role}:${opts.name}=${t}`) }, count: async () => 1 }) }),
  getByText: (name: string) => ({ first: () => ({ click: async () => { log.push('clickText:' + name) }, count: async () => 1 }) }),
  getByLabel: (name: string) => ({ first: () => ({ fill: async (t: string) => { log.push(`fillLabel:${name}=${t}`) }, count: async () => 1 }) })
})

test.describe('the tool set', () => {
  test('exposes exactly look, click and type', () => {
    const p = createPagePerception([{ label: 'page', root: fakeRoot('- button "Send"') as any }])
    assert.deepEqual(p.toolNames.sort(), ['click', 'look', 'type'])
  })

  test('exposes no escape hatch that a person would not have', () => {
    // Guard on the design's core exclusion. If someone adds `evaluate`, a raw
    // selector tool, or DOM access as a convenience, this must fail.
    const p = createPagePerception([{ label: 'page', root: fakeRoot('') as any }])
    for (const banned of ['evaluate', 'eval', 'query', 'querySelector', 'selector', 'dom', 'html', 'script']) {
      assert.ok(!p.toolNames.some(n => n.toLowerCase().includes(banned)), `tool set must not expose "${banned}"`)
    }
  })

  test('names the mcp server so allowedTools can be derived', () => {
    assert.equal(MCP_SERVER_NAME, 'page')
  })
})

test.describe('snapshot truncation', () => {
  test('leaves a short snapshot alone', () => {
    assert.equal(truncate('- button "Send"'), '- button "Send"')
  })

  test('caps a long one and says it did', () => {
    const long = 'x'.repeat(SNAPSHOT_CAP + 500)
    const out = truncate(long)
    assert.ok(out.length < long.length)
    assert.ok(out.endsWith('…[truncated]'), 'a reader must be able to tell the snapshot was cut')
  })
})

test.describe('observations', () => {
  test('records every call with the turn the runner stamped', async () => {
    const p = createPagePerception([{ label: 'page', root: fakeRoot('- button "Send"') as any }])
    p.setTurn(3)
    await p.call('look', {})
    assert.equal(p.observations.length, 1)
    assert.equal(p.observations[0].turn, 3)
    assert.equal(p.observations[0].tool, 'look')
    assert.ok(p.observations[0].result.includes('button "Send"'))
  })

  test('look spans every root, labelled, so a framed page is visible too', async () => {
    const p = createPagePerception([
      { label: 'page', root: fakeRoot('- heading "Host"') as any },
      { label: 'chat frame', root: fakeRoot('- button "Send"') as any }
    ])
    const out = await p.call('look', {})
    assert.ok(out.includes('Host'))
    assert.ok(out.includes('Send'))
    assert.ok(out.includes('chat frame'), 'each root is labelled so the persona knows what it is looking at')
  })

  test('a failed action is recorded, not thrown, so the persona can react', async () => {
    const empty = { ...fakeRoot(''), getByRole: () => ({ first: () => ({ count: async () => 0, click: async () => { throw new Error('nope') } }) }) }
    const p = createPagePerception([{ label: 'page', root: empty as any }])
    const out = await p.call('click', { name: 'Nothing' })
    assert.ok(/not find|no element/i.test(out), 'the persona is told it could not click, in words it can act on')
    assert.equal(p.observations.at(-1)?.tool, 'click')
  })
})
```

Note the test drives a `p.call(tool, args)` helper rather than the MCP transport — the transport is the SDK's, and exercising it here would test their code, not ours. `call` is the same function the server's `CallTool` handler invokes.

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test-unit tests/features/lib-sim/page-perception.unit.spec.ts`
Expected: FAIL — cannot find module `lib-sim/page-perception.ts`

- [ ] **Step 3: Implement**

Create `lib-sim/page-perception.ts`:

```ts
/**
 * What the simulated user can perceive and do.
 *
 * Three tools, shaped like a person rather than like a test framework: look at
 * the screen, click something by its visible name, type into a named field.
 * There is deliberately no evaluate, no raw selector and no DOM access — a
 * persona that can run JavaScript verifies outcomes no human could, which would
 * make verdicts wrongly optimistic in exactly the way a blind persona makes them
 * wrongly pessimistic.
 *
 * The handlers run in-process against the runner's live Playwright roots, so
 * there is one browser and one page. Every call is recorded as an observation,
 * because a judge cannot otherwise tell a real complaint from an invented one.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'

export const MCP_SERVER_NAME = 'page'
export const SNAPSHOT_CAP = 4000

export type PerceptionRoot = { label: string, root: any }
export type Observation = { turn: number, tool: string, args: unknown, result: string }

export type PagePerception = {
  server: { type: 'sdk', name: string, instance: unknown, alwaysLoad: true }
  observations: Observation[]
  setTurn: (turn: number) => void
  toolNames: string[]
  call: (tool: string, args: Record<string, unknown>) => Promise<string>
}

export function truncate (text: string): string {
  return text.length <= SNAPSHOT_CAP ? text : text.slice(0, SNAPSHOT_CAP) + '…[truncated]'
}

const TOOLS = [
  {
    name: 'look',
    description: 'Look at the screen. Returns what is currently visible, as an accessibility outline of the page. Use this before saying anything about what you can or cannot see.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'click',
    description: 'Click something by the visible text or label on it, exactly as a person would point at it.',
    inputSchema: { type: 'object', properties: { name: { type: 'string', description: 'The visible text or accessible name of what to click' } }, required: ['name'] }
  },
  {
    name: 'type',
    description: 'Type into a field identified by its visible label.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, text: { type: 'string' } }, required: ['name', 'text'] }
  }
]

export function createPagePerception (roots: PerceptionRoot[]): PagePerception {
  const observations: Observation[] = []
  let turn = 0

  const look = async () => {
    const parts: string[] = []
    for (const { label, root } of roots) {
      let snap = ''
      try { snap = await root.locator('body').ariaSnapshot() } catch (err) {
        snap = `(could not read: ${err instanceof Error ? err.message : String(err)})`
      }
      parts.push(`## ${label}\n${snap}`)
    }
    return truncate(parts.join('\n\n'))
  }

  const firstMatch = async (finders: Array<() => any>) => {
    for (const find of finders) {
      try {
        const loc = find()
        if (await loc.count() > 0) return loc
      } catch { /* a finder that throws simply does not match */ }
    }
    return null
  }

  const click = async (name: string) => {
    for (const { root } of roots) {
      const loc = await firstMatch([
        () => root.getByRole('button', { name }).first(),
        () => root.getByRole('link', { name }).first(),
        () => root.getByText(name).first()
      ])
      if (loc) { await loc.click(); return `clicked "${name}"` }
    }
    return `could not find anything called "${name}" to click`
  }

  const type = async (name: string, text: string) => {
    for (const { root } of roots) {
      const loc = await firstMatch([
        () => root.getByRole('textbox', { name }).first(),
        () => root.getByLabel(name).first()
      ])
      if (loc) { await loc.fill(text); return `typed into "${name}"` }
    }
    return `could not find a field called "${name}"`
  }

  const call = async (tool: string, args: Record<string, unknown>): Promise<string> => {
    let result: string
    if (tool === 'look') result = await look()
    else if (tool === 'click') result = await click(String(args.name ?? ''))
    else if (tool === 'type') result = await type(String(args.name ?? ''), String(args.text ?? ''))
    else result = `unknown tool: ${tool}`
    observations.push({ turn, tool, args, result })
    return result
  }

  const instance = new Server({ name: MCP_SERVER_NAME, version: '1.0.0' }, { capabilities: { tools: {} } })
  instance.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))
  instance.setRequestHandler(CallToolRequestSchema, async (req) => ({
    content: [{ type: 'text', text: await call(req.params.name, (req.params.arguments ?? {}) as Record<string, unknown>) }]
  }))

  return {
    server: { type: 'sdk', name: MCP_SERVER_NAME, instance, alwaysLoad: true },
    observations,
    setTurn: (n: number) => { turn = n },
    toolNames: TOOLS.map(t => t.name),
    call
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npm run test-unit tests/features/lib-sim/page-perception.unit.spec.ts`
Expected: 8 passed

- [ ] **Step 5: Commit**

```bash
npm run lint-fix && npm run check-types
git add lib-sim/page-perception.ts tests/features/lib-sim/page-perception.unit.spec.ts
git commit -m "feat(lib-sim): page perception tools for the simulated user"
```

---

### Task 2: Wire perception into the persona

**Files:**
- Modify: `lib-sim/persona.ts`, `lib-sim/index.ts`
- Test: `tests/features/lib-sim/barrel.unit.spec.ts`, `tests/features/lib-sim/persona.unit.spec.ts`

**Interfaces:**
- Consumes: `PagePerception`, `MCP_SERVER_NAME` from Task 1.
- Produces: `nextUserMessage (c, conversation, turnsLeft, opts?: { perception?: PagePerception }): Promise<string>`; barrel exports `createPagePerception`, `truncate`, `SNAPSHOT_CAP`, `MCP_SERVER_NAME`, and the `PerceptionRoot`/`Observation`/`PagePerception` types.

- [ ] **Step 1: Change `nextUserMessage`**

Add the optional argument and pass the server through. `maxTurns` rises to a named constant so the reason is recorded next to the number:

```ts
// The persona now looks and acts before replying, so one turn is not enough:
// look → act → look → reply, with room to spare. Low enough that a confused
// persona cannot spend the run clicking around. A starting point, to be revisited
// from a real run rather than guessed at twice.
export const PERSONA_MAX_TURNS = 6
```

In the query options, replace `maxTurns: 1` with `maxTurns: PERSONA_MAX_TURNS`, and when `opts?.perception` is given add:

```ts
      mcpServers: { [MCP_SERVER_NAME]: opts.perception.server },
      allowedTools: opts.perception.toolNames.map(n => `mcp__${MCP_SERVER_NAME}__${n}`)
```

Leave `...isolationOptions(neutralCwd)` spread FIRST, as it is today — it is what keeps `tools: []`, the neutral cwd and `strictMcpConfig` from being overridden, and a review already caught one regression there.

- [ ] **Step 2: Tell the persona it can see**

`personaSystemPrompt` currently says *"If a reply is vague, unhelpful, or does not actually show you the result, say so."* That instruction is what invites fabrication. When perception is available the prompt must also carry:

```
You can look at the screen yourself with the look tool, and you can click and type
on the page. Before you say anything about what is or is not on the screen, look.
Never claim you cannot see something you have not looked for.
To talk to the assistant, just reply with your message — do not type it into the page.
```

Add it as a separate exported string, `PERCEPTION_INSTRUCTIONS`, appended by `personaSystemPrompt` only when perception is in use, so a blind persona's prompt is unchanged.

- [ ] **Step 3: Extend the barrel and its guard**

Add to `lib-sim/index.ts`:

```ts
export { createPagePerception, truncate, SNAPSHOT_CAP, MCP_SERVER_NAME as PAGE_MCP_SERVER_NAME } from './page-perception.ts'
export type { PerceptionRoot, Observation, PagePerception } from './page-perception.ts'
export { PERSONA_MAX_TURNS, PERCEPTION_INSTRUCTIONS } from './persona.ts'
```

`tests/features/lib-sim/barrel.unit.spec.ts` maintains an explicit list of the public value surface and exists so additions are deliberate — update it. It should FAIL before you do; if it does not, say so in your report, because that means the guard is not working.

- [ ] **Step 4: Add persona tests**

In `tests/features/lib-sim/persona.unit.spec.ts`, add:

```ts
test('the perception instructions tell it to look before claiming', () => {
  const p = personaSystemPrompt(cases[0], true)
  assert.ok(p.includes('look'), 'the persona must be told it can look')
  assert.ok(/never claim you cannot see/i.test(p))
})

test('a blind persona keeps its original prompt', () => {
  // Consumers on 0.2.0 must behave exactly as before.
  assert.equal(personaSystemPrompt(cases[0], false), personaSystemPrompt(cases[0]))
})

test('the turn budget is documented where the number lives', () => {
  assert.equal(PERSONA_MAX_TURNS, 6)
})
```

Adjust `personaSystemPrompt`'s signature to take an optional second argument for whether perception is in use.

- [ ] **Step 5: Verify**

```bash
npm run lint-fix && npm run check-types
npm run test-unit
```
Report the total, and explicitly whether the barrel guard failed before you updated it.

- [ ] **Step 6: Commit**

```bash
git add lib-sim/persona.ts lib-sim/index.ts tests/features/lib-sim/
git commit -m "feat(lib-sim): let the persona use page perception"
```

---

### Task 3: Record observations as evidence

**Files:**
- Modify: `lib-sim/types.ts` (`Transcript` is declared there, line 19), `simulations/simulate.sim.spec.ts`

**Interfaces:**
- Consumes: `Observation` (Task 1), `nextUserMessage(…, opts)` (Task 2).
- Produces: `Transcript.observations: Observation[]`.

- [ ] **Step 1: Add the field**

In `lib-sim/types.ts`, add `observations: Observation[]` to the `Transcript` type at
line 19, importing `Observation` from `./page-perception.ts`. `types.ts` already
imports `GatewayExchange` the same way, so follow that existing direction — and note
`page-perception.ts` must NOT import from `types.ts`, or the two create a cycle.

- [ ] **Step 2: Wire the runner**

In `simulations/simulate.sim.spec.ts`, after `root` is resolved and before the turn loop:

```ts
    // A person sees the whole viewport, not one frame: when the chat is embedded,
    // the persona looks at both the host page and the frame.
    const perception = createPagePerception(
      simCase.embedded
        ? [{ label: 'page', root: page }, { label: 'chat panel', root: page.frameLocator('iframe') }]
        : [{ label: 'page', root: page }]
    )
```

Inside the loop, before asking for the next message: `perception.setTurn(i + 1)`, and pass `{ perception }` as the new fourth argument to `nextUserMessage`.

Add `observations: perception.observations` to the transcript object handed to `writeEvidence`.

- [ ] **Step 3: Verify offline**

```bash
npm -w @data-fair/lib-agents-sim run build
npm run lint-fix && npm run check-types
npm run test-unit
npx playwright test -c playwright.sim.config.ts --list
```
Expected: unit total unchanged from Task 2, 4 simulation cases listed. Report both.

- [ ] **Step 4: Commit**

```bash
git add lib-sim/types.ts simulations/simulate.sim.spec.ts
git commit -m "feat(sim): record what the simulated user actually looked at"
```

---

### Task 4: Teach the judge, and release the package

**Files:**
- Modify: `.claude/agents/simulation-judge.md`, `lib-sim/templates/simulation-judge.md` (must stay byte-identical — a guard test enforces it), `lib-sim/package.json`, `lib-sim/README.md`

- [ ] **Step 1: Add the instruction to BOTH judge files**

In the section describing what the transcript holds, add:

```markdown
- `observations` — what the person actually looked at and did, recorded per turn:
  `{ turn, tool, args, result }`. `look` returns the accessibility outline of the
  screen at that moment.

A claim about what is on screen must be supported by a preceding `look` in
`observations`. A persona asserting a visual fact it never observed is a HARNESS
fault, not product friction — say so plainly in `notes` and do not count it as a
friction point. This has happened: a run once had the person insist a panel was
closed having never looked, and the judge reported it as a product failure.
```

Copy the file so both are byte-identical, then confirm: `diff -q lib-sim/templates/simulation-judge.md .claude/agents/simulation-judge.md`.

- [ ] **Step 2: Bump the version**

`lib-sim/package.json` → `"version": "0.3.0"`. The change is additive: `nextUserMessage`'s new argument is optional and `personaSystemPrompt`'s second argument is optional, so `0.2.0` consumers are unaffected.

- [ ] **Step 3: Document it in the README**

Add a short section under the existing runner example showing perception being created and passed, and stating plainly that without it the persona cannot see the page and must not be asked to judge what is on screen. Mention that `df-agents-sim-init` copies the judge definition, so an existing consumer needs to re-run it to pick up the new instruction.

- [ ] **Step 4: Verify**

```bash
npm -w @data-fair/lib-agents-sim run build
npm run lint-fix && npm run check-types
npm run test-unit
cd lib-sim && npm pack --dry-run
```
Confirm the pack listing still ships `templates/*.md`, `README.md` and no `.ts` sources; report the file count.

- [ ] **Step 5: Commit**

```bash
git add .claude/agents/simulation-judge.md lib-sim/
git commit -m "feat(lib-sim): teach the judge to check claims against observations"
```

---

### Task 5: Prove it against the real product

This is the task the whole change exists for. It needs the dev stack, built workspace packages and the bridge, so **the controller runs it** — a subagent must not start dev processes.

- [ ] **Step 1: Re-run the four cases**

```bash
rm -f simulations/tmp/sim-*
npm run simulate
```

- [ ] **Step 2: Check the acid test first**

`open-panel`'s persona demonstrably fabricated on 2026-09-14. Read
`simulations/tmp/sim-open-panel.json` and answer explicitly:

1. Does `observations` contain a `look` before any statement the persona makes about the screen?
2. Does the `look` result actually show whether the panel opened?
3. If the persona still complains, is the complaint now supported by what it saw?

If the answer to (1) is no, the change has not worked and the persona prompt needs
strengthening before anything else is judged.

- [ ] **Step 3: Re-judge every valid case**

Dispatch one `simulation-judge` per case as the `/agents-sim` skill describes, write the verdicts, and run `npm run simulate:report`. The three verdicts from 2026-09-14 are void and are replaced by these.

- [ ] **Step 4: Correct the baseline document**

`docs/simulations/2026-09-13-first-eval.md` records `register-person` as an
unsatisfactory run. Half of that finding is sound — the assistant claimed "the form
is now fully filled in and showing on screen", which its tool result did not
support, and that is visible in the transcript. The other half — that the person
looked and found nothing — was never observed. Add a dated note saying so, and
pointing at this change. Do not rewrite the original findings: it is a record of
what was believed at the time.

- [ ] **Step 5: Commit the new evidence write-up**

Write `docs/simulations/<date>-perception-run.md` in the shape of the existing eval
doc: what ran, the table, what the observations show, and what is now trustworthy
that was not.

---

## Self-Review

**Spec coverage:** §1 mechanism → Task 1 (with the recorded correction that it reuses the pattern, not `createToolServer`). §2 tool set and the exclusion → Task 1, including the guard test. §2 frame boundary → Task 3's runner wiring, which supplies both roots. §3 the one rule → Task 2's `PERCEPTION_INSTRUCTIONS`. §4 evidence and the judge instruction → Tasks 3 and 4. §4 snapshot sizing → Task 1's `truncate`/`SNAPSHOT_CAP`. §5 package surface and `0.3.0` → Tasks 2 and 4. §6 isolation → Task 2 Step 1, which keeps the spread first. Risks (maxTurns, cost) → Task 2's `PERSONA_MAX_TURNS` and Task 5's real run.

**Placeholder scan:** the two numbers the spec flagged as starting points (`SNAPSHOT_CAP = 4000`, `PERSONA_MAX_TURNS = 6`) are concrete in the code with the reasoning in a comment, not left to the implementer.

**Type consistency:** `Observation` is defined once in `page-perception.ts` and imported by `types.ts`; `PagePerception.call` is used by the tests and by the MCP handler; `MCP_SERVER_NAME` is re-exported from the barrel as `PAGE_MCP_SERVER_NAME`: the bridge has a constant of the same name in `bridge/openai.ts` (value `'bridge'`) which is NOT barrel-exported, so there is no collision today — the alias keeps it that way and makes the call site unambiguous. Task 2's `allowedTools` uses the local name inside `persona.ts`.

**Known limitation, deliberate:** the Playwright wrappers in `page-perception.ts` are exercised by fakes in the unit test and by real runs in Task 5, not by a browser test of their own. A browser test of `click`/`type` would largely assert Playwright's behaviour. If Task 5 shows the finders missing real elements, that is where to add coverage — with the real page that failed.
