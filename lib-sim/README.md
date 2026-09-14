# @data-fair/lib-agents-sim

Primitives for judged browser simulations of an [agents](https://github.com/data-fair/agents)
chat: drive a real conversation with a simulated user in a real browser, capture
what happened, and hand the transcript to a judge. It does not own cases, login,
settings seeding, or the turn loop — those stay in the host repo, which knows
its own routes, fixtures and account setup. It also ships a small Claude Code
bridge (a dev tool, not a simulation primitive) that exposes the Claude Agent
SDK as an OpenAI-compatible provider, so a dev workspace can drive the assistant
under test on a Claude subscription instead of a metered API key.

## Install

```bash
npm i -D @data-fair/lib-agents-sim
```

## Which half needs which peer

Every peer is **optional**, because the package has two independent halves and
few consumers want both. Install only what the half you use needs.

| You want | Install |
| --- | --- |
| The **harness** primitives (`createChatDriver`, `captureGateway`, `selectCases`, `reportCases`, `writeEvidence`, …) | `@playwright/test` |
| The **bridge** (`df-agents-bridge`) | `@anthropic-ai/claude-agent-sdk` and `@modelcontextprotocol/sdk` |

```bash
# harness only
npm i -D @playwright/test
# bridge only
npm i -D @anthropic-ai/claude-agent-sdk @modelcontextprotocol/sdk
```

The harness primitives are built against Playwright's `Page` / `FrameLocator`
types and run inside your own Playwright project, so bring your own version.
The bridge needs nothing from Playwright, which is why a bridge-only consumer
is not forced into a browser install.

Run `df-agents-bridge` without the two SDKs and it exits with an actionable
message instead of a raw `ERR_MODULE_NOT_FOUND`, naming the install command
above.

**zod warning.** If your tree also contains the `ai` package, installing the
Agent SDK may hoist zod 4 and break `ai`'s type inference. Add
`"overrides": { "@anthropic-ai/claude-agent-sdk": { "zod": "3.25.76" } }`.

## `df-agents-sim-init`

```bash
npx df-agents-sim-init [--force]
```

Copies the `/agents-sim` skill and the `simulation-judge` sub-agent definition
into your repo's `.claude/skills/agents-sim/SKILL.md` and
`.claude/agents/simulation-judge.md`. These cannot be loaded from
`node_modules` — Claude Code reads them from the repository — so they are
copied, not referenced, and **can drift** from the version in this package.
The command prints the package version it copied from so drift is at least
detectable; without `--force` it skips a file that already exists rather than
overwriting local edits.

## Minimal runner example

A host repo owns the Playwright test that drives one case end to end. For a
chat embedded in an iframe (the common case for a host application), pass
`page.frameLocator('iframe')` to `createChatDriver`; for a page where the chat
*is* the page, pass `page` itself — the driver's selectors are identical
either way.

The driver matches the composer's visible strings, which the chat renders in the
session's locale. Pass the locale your application runs in — `createChatDriver(root,
{ locale: 'fr' })` — or the run dies as a 15-minute "element not found" with
nothing pointing at the cause. The default is `'en'`.

```ts
import { test } from '@playwright/test'
import {
  createChatDriver, captureGateway, nextUserMessage, isDone,
  writeEvidence, selectCases, createPagePerception, type Transcript, type SimulationCase
} from '@data-fair/lib-agents-sim'

const cases: SimulationCase[] = [
  { name: 'find-a-dataset', route: '/embed/chat', persona: 'A curious analyst.', goal: 'Find last quarter\'s sales dataset.', maxTurns: 6 }
]

for (const simCase of selectCases(cases, [])) {
  test(`simulation: ${simCase.name}`, async ({ page }) => {
    const gateway = captureGateway(page)
    await page.goto(simCase.route)

    const chat = createChatDriver(page.frameLocator('iframe'))
    const conversation: Array<{ role: string, text: string }> = []
    // Lets the persona look at, click and type into the real page instead of
    // guessing at what is on screen — see "Give the persona eyes" below.
    const perception = createPagePerception([{ label: 'page', root: page }])
    let error: string | undefined

    try {
      for (let i = 0; i < simCase.maxTurns; i++) {
        perception.setTurn(i + 1)
        const message = await nextUserMessage(simCase, conversation, simCase.maxTurns - i, { perception })
        if (isDone(message)) break
        await chat.sendMessage(message)
        await chat.waitForTurn()
        // Read into a local FIRST, then replace: clearing up front means a throw
        // from readConversation leaves the transcript empty, losing every prior
        // turn — and an empty transcript is the one thing a judge cannot judge.
        const read = await chat.readConversation()
        conversation.length = 0
        conversation.push(...read)
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    }

    const transcript: Transcript = { case: simCase.name, goal: simCase.goal, persona: simCase.persona, route: simCase.route, conversation, gateway, consoleErrors: [], observations: perception.observations }
    // `valid` is derived, never hardcoded: the sidecar exists to tell a run that
    // really happened apart from one that fell over, so that `reportCases` says
    // "invalid (…)" instead of re-reporting the previous run's verdict.
    writeEvidence(simCase.name, transcript, {
      case: simCase.name, valid: !error, error,
      assistantModel: 'sonnet', userModel: 'haiku',
      turns: conversation.length / 2, durationMs: 0, finishedAt: new Date().toISOString()
    })
    if (error) throw new Error(`run invalid: ${error}`)
  })
}
```

Then judge each written transcript with the `simulation-judge` sub-agent (via
the copied `/agents-sim` skill), and turn the evidence directory into a pass/fail
summary with `reportCases(cases, evidenceDir)` — the host repo's own report
script decides where cases live and what to do with the failure count it
returns.

### Give the persona eyes

`createPagePerception(roots)` gives the simulated user a `look`/`click`/`type`
MCP tool set over the real Playwright page(s), so it can check what is actually
on screen instead of guessing. Pass one root per visible surface — a chat
embedded in an iframe has both the host page and the frame:

```ts
const perception = createPagePerception([
  { label: 'page', root: page },
  { label: 'chat panel', root: page.frameLocator('iframe') }
])
```

Before each turn, tell it which turn is starting — this stamps every
observation the persona records during that turn — then pass it through
`nextUserMessage`'s options so the persona's query gets the tool set:

```ts
perception.setTurn(i + 1)
const message = await nextUserMessage(simCase, conversation, simCase.maxTurns - i, { perception })
```

Every `look`/`click`/`type` call is recorded into `perception.observations` as
`{ turn, tool, args, result }`; put that array into the transcript's
`observations` field so the judge can check a visual claim against what was
actually seen. **Without `perception`, the persona cannot see the page at
all** — do not write a case or a judge prompt that expects it to notice or
react to anything visual (a panel opening, a chart rendering, a result
appearing) unless perception is wired in.

`df-agents-sim-init` copies the `simulation-judge` definition into your repo,
and the copied version now includes the instruction to check visual claims
against `observations`. If you already ran `df-agents-sim-init` before this
was added, re-run `npx df-agents-sim-init --force` to pick it up — otherwise
your judge keeps trusting unverified visual claims.

### Where the evidence goes

`writeEvidence(name, transcript, sidecar, dir?)` writes `sim-<name>.json` (the
transcript the judge reads) and `sim-<name>.run.json` (the validity sidecar).
`dir` defaults to the exported `evidenceDir`, which is
`path.join(process.cwd(), 'simulations', 'tmp')` — resolved against the host
repo's working directory, so the default only makes sense if you run your suite
from the repository root. Pass `dir` explicitly to put evidence anywhere else,
and hand the same directory to `reportCases(cases, dir)` so the reader and the
writer agree.

## Scripts the copied `/agents-sim` skill expects

`df-agents-sim-init` copies the skill **verbatim**, and the skill refers to npm
scripts by the names the origin repository uses. It cannot know yours, so define
these three in your `package.json` (adjust the paths to your layout):

```json
{
  "scripts": {
    "dev-bridge": "df-agents-bridge",
    "simulate": "playwright test -c playwright.sim.config.ts --project=simulate",
    "simulate:report": "node simulations/report.ts"
  }
}
```

- `dev-bridge` — starts the bridge the simulated user and the assistant both
  talk to. Must be running before `simulate`.
- `simulate` — runs your Playwright project containing the scenario specs. Keep
  it out of your default `test` script: a bare `npm test` would otherwise spend
  plan quota.
- `simulate:report` — calls `reportCases(cases, evidenceDir)` and exits non-zero
  on the failure count it returns.

If you prefer different names, edit the copied
`.claude/skills/agents-sim/SKILL.md` to match — but remember that a later
`df-agents-sim-init --force` overwrites it.
