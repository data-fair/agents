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
| The **harness** primitives (`createChatDriver`, `selectCases`, `reportCases`, `writeEvidence`, …) | `@playwright/test` |
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

**Send recovery.** `sendMessage` bounds its fill/click at `SEND_TIMEOUT_MS`
(15s) rather than waiting indefinitely. If the first attempt fails — typically
an overlay left open over the composer — it presses Escape (the ordinary way a
person dismisses something in their way) and retries once before throwing. It
never passes `{ force: true }`: punching through an overlay a real user could
not reach would report a success a person could never have had.

```ts
import { test } from '@playwright/test'
import {
  createChatDriver, chatDriverStrings, nextUserMessage, isDone,
  writeEvidence, selectCases, createPagePerception, type TranscriptInput, type SimulationCase
} from '@data-fair/lib-agents-sim'

const cases: SimulationCase[] = [
  { name: 'find-a-dataset', route: '/embed/chat', persona: 'A curious analyst.', goal: 'Find last quarter\'s sales dataset.', maxTurns: 6 }
]

for (const simCase of selectCases(cases, [])) {
  test(`simulation: ${simCase.name}`, async ({ page }) => {
    await page.goto(simCase.route)

    const locale = 'en' as const
    const strings = chatDriverStrings(locale)
    const chat = createChatDriver(page.frameLocator('iframe'), { locale })
    const conversation: Array<{ role: string, text: string }> = []
    // Lets the persona look at, click and type into the real page instead of
    // guessing at what is on screen — see "Give the persona eyes" below.
    // offLimits is not optional in practice: without it the persona can (and
    // will) click into the composer and press Send itself, double-sending its
    // message on top of the runner's own send below.
    const perception = createPagePerception(
      [{ label: 'page', root: page }],
      { offLimits: [strings.input, strings.send, strings.stop, strings.reset] }
    )
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

    // The server's record of the run — see "The conversation export" below. `fetchExports` is yours:
    // it lists the person's reviewable threads and downloads each one's export.
    const exports = await fetchExports()
    const transcript: TranscriptInput = { case: simCase.name, goal: simCase.goal, persona: simCase.persona, route: simCase.route, conversation, consoleErrors: [], observations: perception.observations, exports }
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

`createPagePerception(roots, opts?)` gives the simulated user a
`look`/`click`/`type` MCP tool set over the real Playwright page(s), so it can
check what is actually on screen instead of guessing. Pass one root per
visible surface — a chat embedded in an iframe has both the host page and the
frame:

```ts
const perception = createPagePerception(
  [
    { label: 'page', root: page },
    { label: 'chat panel', root: page.frameLocator('iframe') }
  ],
  { offLimits: [strings.input, strings.send, strings.stop, strings.reset] }
)
```

**Pass `offLimits`.** It is the second argument's only option, and it is not
optional in practice: it is the list of accessible names — typically the
composer's input, send, stop and reset controls, from `chatDriverStrings` — that
`click`/`type` refuse before even looking the element up. The persona's system
prompt is told *"the composer will refuse you"* only when this list is
non-empty (an empty or omitted `offLimits` refuses nothing, silently). Without
it, the persona can and will type its own message into the composer and press
Send itself — double-sending on top of the runner's own `chat.sendMessage`
below, and usually invalidating the run. A `reset` control is worth including
too: a mid-run click erases the transcript the run exists to produce.

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

**Breaking change in 0.3.0.** `Transcript.observations` is a required field,
not an optional one — deliberately: an optional field would let a host wire up
`perception` and forget to add `observations` to its transcript object, and
ship runs that look valid while the judge sees no evidence at all. Upgrading
from 0.2.0 means adding `observations: perception?.observations ?? []` (or
`[]` where perception is not used) to the transcript you build; a TypeScript
compile error will name the field for you.

### The conversation export

The model side of a run is read from the agents service's **conversation export**
(`GET /api/review/:type/:id/:conversationId/export`) — the same JSONL file a
maintainer downloads to debug a real session, so a simulation is judged on what a
production incident would be. It holds every message part (tool calls with their
arguments and results) and, per run, the system prompt and each model call: role,
model, tokens, the tools offered, the page context folded in.

Fetching it is the host's job, because it needs the host's accounts. The route
sits behind the review gates, so the runner has to open them:

- the account's settings must have `reviewPersonalAssistant: true`;
- the person must have consented — set the `agent-chat-trace-consent=yes` cookie
  on the page's origin before it loads (it also keeps the consent sheet out of
  the persona's way);
- the export itself is a superadmin route, in admin mode.

List the threads with `GET /api/review/:type/:id`, keep the person's own
(`userId`), download each export as text, and pass them to `writeEvidence` as
`{ conversationId, agentId, jsonl }`. `parseConversationExport` and
`recordedToolCalls` are exported for a host that wants its own counts.

**Breaking change in 0.10.0.** `captureGateway` and `Transcript.gateway` are gone,
and so is `agentToolCalls`. They captured the browser's requests to the model
gateway, which the agents service no longer makes: its loop runs server-side for
every chat, so the capture recorded nothing while the run still read valid.
`Transcript.exports` replaces both, and `RunMetrics` is now derived from the
exports (`requestsByRole`, `toolCalls`, `failedToolCalls`, `credits`, …); its
model-side counts are `null` when no export was read, never `0`.

### Where the evidence goes

`writeEvidence(name, transcript, sidecar, dir?)` writes `sim-<name>.json` (the
transcript the judge reads), one `sim-<name>.<conversationId>.export.jsonl` per
export, and `sim-<name>.run.json` (the validity sidecar).
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
