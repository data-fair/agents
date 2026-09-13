# First judged simulation run — 2026-09-13

> Baseline run of the scenario harness (`npm run simulate`), at commit `a7022ba`.
> **No fix is included in this branch.** This is the measurement the fix will be
> judged against.

## What ran

| | |
|---|---|
| Assistant under test | `sonnet`, via the Claude Code bridge (`dev/claude-bridge`) |
| Simulated user | `haiku` |
| Judges | one `simulation-judge` subagent per case, `sonnet` |
| Cases | the three in `simulations/cases/index.ts` |

All three runs were **valid** — no rate limit, no timeout, no browser failure, and
zero browser console errors in any of them.

| case | turns | verdict | frictions | duration | gateway exchanges |
|---|---|---|---|---|---|
| `air-quality` | 4 | **UNSATISFACTORY** | 3 | 191s | 44 |
| `register-person` | 5 | **UNSATISFACTORY** | 3 | 89s | 13 |
| `open-panel` | 2 | satisfied | 0 | 31s | 4 |

`npm run simulate:report` exits 1 on this evidence.

## The finding

Two judges, reading two unrelated transcripts, independently found the same defect:

> **The assistant does not connect "this person wants to SEE something" to the tool
> that puts things on screen — and it will state visual outcomes it has no way to
> observe.**

### Evidence A — the tool that was never called

`air-quality`. The person's goal named a screen explicitly: *"shown on the screen so
you can point at it in a meeting this afternoon."*

`set_display` was offered in **every one of the 44 gateway exchanges** and was
**never called once** in the entire run. The assistant produced the ranking as chat
markdown and stopped there. The person left to collect the data by hand.

### Evidence B — the claim it could not have checked

`register-person`. The assistant wrote the data correctly (`setFieldValue` on
`/name`, `/age`, `/active`, confirmed by `getData`), then told the person:

> "Done! The form is now fully filled in and showing on screen"

The tool result it had in hand confirms a **write**, not a **render**. The person
went looking, found nothing, and the next two turns were the assistant speculating
about "Data Fair dataset pages", modals and separate tabs, asking her to describe
her own setup — while `describeState` sat unused in its tool list. She gave up:
she would close the chat and go find the form herself.

This half is the more serious one. Every tool call succeeded; no unit or e2e test
in this repo can catch it. What failed was the assistant's account of what had
happened.

## What is *not* a product finding

Roughly half of `air-quality`'s friction is the dev page, not the product, and
should be discounted when reading the verdict:

- `ui/src/pages/_dev/chat-subagent.vue` serves a **3-record mock dataset**, and
  `query_data` returns identical data even for a fabricated dataset name.
- There is **no dataset-listing tool** — only `get_schema` by guessed name.

Given that, the assistant brute-forced ~20 plausible dataset names over ~85s. In a
real data-fair instance that path does not exist. Two things there *are* genuine
and survive the discount: it never used `set_display`, and it kept guessing long
after its own evidence said the search was futile.

Worth recording on the other side of the ledger: it **refused to present stale 2024
demo data as current**, rather than fabricating a number for someone walking into a
meeting. That is the right call and the harness should not lose sight of it.

## Why `open-panel` passing matters

`open_panel` then `set_display`, correct order, one turn. That is the direct
confirmation that the bridge's tool-set-aware continuation works against a real
model — before that fix (found in the whole-branch review, not by a test) the live
query kept the tool set from the first request of the turn, and this case would have
failed with the assistant unable to call the newly registered tool. The judge would
then have reported a **bridge artifact as a product friction**.

That near-miss is the main cautionary tale of this run: a harness can manufacture
the failures it claims to detect, and only the evidence trail makes the difference
visible.

## Options considered for the fix

Recorded here so the decision is reviewable; none is implemented on this branch.

**A — a system-prompt rule.** The assembled prompt in `ui/src/components/AgentChat.vue`
(`:165-193`) is short: in the failing run the assistant's entire instruction set was
close to *"You are a helpful AI assistant for the Data Fair platform. The user's
language is en."* Nothing about display tools; nothing about what it can observe.
Option A adds one i18n string to that list, in the established shape of the existing
`systemPromptMermaid` block — which already carries the same class of rule (*"A
chart's values must come from data you actually queried with the tools — never
invent or estimate them"*). Draft:

> When someone asks to see, show, or point at something, put it where they asked by
> calling the tool that does that — don't answer with the content in chat alone.
> After using a tool that changes the page, report only what the tool's result
> actually confirms: say what you did, never what the user can now see. You cannot
> see their screen.

Central, reaches every host page including data-fair, touches no tool. It is
instruction rather than enforcement — a model can ignore it — but this branch now
provides the means to check whether it did.

**B — make the false claim structurally unavailable.** Side-effecting tools already
return confirmations (`set_display` returns `{success: true, message: 'Display
updated'}`). Turn that into a contract: the assistant relays the tool's own
confirmation instead of its inference about the UI. More robust, because the claim
becomes grounded in evidence that exists — but every host tool must honour it,
including data-fair's `agent-tools/`, so it is a cross-repo convention.

**C — fix the tool descriptions.** `set_display` is described as *"Displays text in
the output area on the left side of the page"* — what it does, never when to reach
for it. Cheap and targeted, and json-layout's WebMCP eval found tool descriptions to
be exactly where models get misled. Per-tool and per-repo, and it does nothing about
the unverifiable-claim half.

**Recommendation: A first, plus C for the dev pages, then re-run this eval.** B is
the right answer only if measurement shows A did not hold; building the stronger
mechanism before knowing that spends the larger budget on an unproven diagnosis.

## Re-running this

```bash
npm run dev-bridge          # separate terminal; the runner checks it is up
rm -f simulations/tmp/sim-*
npm run simulate            # or SIM_CASES=register-person npm run simulate
# then follow .claude/skills/simulate/SKILL.md to dispatch a judge per valid case
npm run simulate:report
```

**When measuring a fix, weight the cases.** `register-person` is the clean test: the
false "showing on screen" claim is pure product behaviour with no environmental
noise. `open-panel` is the regression guard. `air-quality` is muddied by the mock
dataset described above — read its `set_display` omission, discount its dataset
hunt.

Runs are not deterministic (three models per case), so a single improved run is
weak evidence. Re-run a fix candidate more than once before believing it.
