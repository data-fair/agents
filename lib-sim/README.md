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

`@playwright/test` is a **peer dependency**: bring your own version, the
harness primitives are built against its `Page` / `FrameLocator` types and run
inside your own Playwright project.

## The bridge's optional peers

The bridge (`df-agents-bridge`) needs two more packages that are **optional
peers**, not regular dependencies, so that a consumer who only wants the
harness primitives (`createChatDriver`, `captureGateway`, `selectCases`,
`reportCases`, …) is not forced to install them:

```bash
npm i -D @anthropic-ai/claude-agent-sdk @modelcontextprotocol/sdk
```

Run `df-agents-bridge` without them and it exits with an actionable message
instead of a raw `ERR_MODULE_NOT_FOUND`, naming this same install command.

**zod warning.** If your tree also contains the `ai` package, installing the
Agent SDK may hoist zod 4 and break `ai`'s type inference. Add
`"overrides": { "@anthropic-ai/claude-agent-sdk": { "zod": "3.25.76" } }`.

## `df-agents-sim-init`

```bash
npx df-agents-sim-init [--force]
```

Copies the `/simulate` skill and the `simulation-judge` sub-agent definition
into your repo's `.claude/skills/simulate/SKILL.md` and
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

```ts
import { test } from '@playwright/test'
import {
  createChatDriver, captureGateway, nextUserMessage, isDone,
  writeEvidence, selectCases, type Transcript, type SimulationCase
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

    for (let i = 0; i < simCase.maxTurns; i++) {
      const message = await nextUserMessage(simCase, conversation, simCase.maxTurns - i)
      if (isDone(message)) break
      await chat.sendMessage(message)
      await chat.waitForTurn()
      conversation.length = 0
      conversation.push(...await chat.readConversation())
    }

    const transcript: Transcript = { case: simCase.name, goal: simCase.goal, persona: simCase.persona, route: simCase.route, conversation, gateway, consoleErrors: [] }
    writeEvidence(simCase.name, transcript, { case: simCase.name, valid: true, assistantModel: 'sonnet', userModel: 'haiku', turns: conversation.length / 2, durationMs: 0, finishedAt: new Date().toISOString() })
  })
}
```

Then judge each written transcript with the `simulation-judge` sub-agent (via
the copied `/simulate` skill), and turn the evidence directory into a pass/fail
summary with `reportCases(cases, evidenceDir)` — the host repo's own report
script decides where cases live and what to do with the failure count it
returns.
