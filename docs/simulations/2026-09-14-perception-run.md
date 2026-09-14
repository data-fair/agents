# Simulation run with a seeing persona — 2026-09-14

> The first run in which the simulated user could look at the page. Compare with
> `2026-09-13-first-eval.md`, the blind baseline. **No product fix is included in
> this branch**; what changed is the harness's ability to tell truth from assertion.

## What ran

| | |
|---|---|
| Assistant under test | `sonnet`, via the Claude Code bridge |
| Simulated user | `haiku`, with `look` / `click` / `type` over the real page |
| Judges | one `simulation-judge` subagent per case, `sonnet` |
| Cases | the four in `simulations/cases/index.ts` |

| case | turns | verdict | frictions | duration |
|---|---|---|---|---|
| `air-quality` | 1 | satisfied | 2 | 69s |
| `register-person` | 1 | **satisfied** | 0 | 21s |
| `open-panel` | 1 | satisfied | 0 | 20s |
| `iframe-set-data` | 1 | satisfied | 0 | 15s |

`npm run simulate:report` exits 0.

## What the eyes changed

Every case now ends in one turn, where the baseline ran 4, 5 and 2. That is not the
harness short-circuiting: the persona asks, **looks**, sees the outcome, and stops.
There is nothing left to argue about with an assistant when you can check the result
yourself.

The evidence is in `observations`, which is new. `open-panel`'s closing look reads
`textbox "Display": Hello World`. `register-person`'s reads:

```
- textbox "Name": Marie Dupont
- textbox "Age": "34"
- checkbox "Active" [checked]
```

`iframe-set-data` demonstrates the frame boundary working — one look spanning both
roots, `## page` carrying `textbox "Data": Hello from the iframe` on the host and
`## chat panel` carrying the conversation from inside the iframe. A person sees the
whole viewport, not one frame, and now so does the persona.

## The finding that survived

`air-quality`'s judge reproduced the baseline's Evidence A **independently and with
better evidence**: `set_display` was never called, so the page's dedicated output
area sat on its placeholder for the whole conversation. The baseline could only show
this as an absence in the gateway log. This run shows it as a fact about the screen,
quoted from the turn-2 observation.

The case is `satisfied` this time because the person did get a pointable answer — in
the chat bubble. The friction is that the output panel, which is what that page
exists to exercise, stayed empty. That is the same defect, correctly weighted.

## What this run corrects

The 2026-09-14 pre-change run produced three verdicts resting on things the persona
could not have seen (`open-panel`: "I'm looking at the screen and nothing is
happening"; `iframe-set-data`: "the box is empty"; `register-person`: "I don't see the
form"). **Those three verdicts are void.** These replace them.

`register-person` is the sharpest correction. It was UNSATISFACTORY in the baseline,
partly because "the person went looking and found nothing". The form was filled the
whole time — the observation above is that same page, and a persona that can look is
satisfied by it in one turn. What remains true from the baseline is the other half:
the assistant said "showing on screen" when its tool result confirmed only a write.
That claim was real, is visible in the transcript, and is untouched by this change.

## Two harness defects this run found

Both were found by running, not by review, and both are fixed in this branch.

**1. The persona drove the chat itself.** Given a `type` tool and a visible composer,
it typed its message into the page and pressed Send in 3 of 4 cases, then burned its
remaining turns watching for a reply and never returned any text — every such run
invalid. The spec anticipated exactly this and defended it with a sentence in the
prompt; a sentence did not hold. `click`/`type` now refuse the composer's controls,
sourced from `chatDriverStrings` so the refusal is locale-correct rather than
English-only.

**2. A persona with hands can wedge the turn loop.** `air-quality`'s persona clicked
`Settings`; the overlay opened, and the runner's next send sat in `locator.click` for
**900 seconds** — the button reported visible, enabled and stable but outside the
viewport, retried 1444 times — until the test timeout. The send is now bounded, with
an Escape-and-retry and then an error that names the state. `Settings` remains
clickable: a real user can open it, and the runner is what must survive that. Only
`Reset conversation` is off-limits, because it erases the transcript the run exists to
produce.

The second is the more interesting one. The harness's failure mode was not a wrong
answer but fifteen minutes of silence followed by a diagnosis-free timeout, and no
test could have found it — only a persona with hands, on a real page.

## Reading this against the baseline

Weight the cases the same way: `register-person` is the clean test, `open-panel` the
regression guard, `air-quality` muddied by its 3-record mock dataset (see the baseline
for that discount, which still applies).

One run of four satisfied cases is **not** evidence that the product's unverifiable-claim
defect is gone. Nothing in this branch changes the product. What changed is that the
next run's verdicts can be checked against what the person actually saw — and that a
judge is now told, in both judge definitions, that a visual claim with no preceding
`look` is a harness fault rather than product friction.

## Re-running this

```bash
npm run dev-bridge          # separate terminal; the runner checks it is up
npm -w @data-fair/lib-agents-sim run build   # simulations/ imports the package by name
rm -f simulations/tmp/sim-*
npm run simulate
# then follow .claude/skills/agents-sim/SKILL.md to dispatch a judge per valid case
npm run simulate:report
```

Runs are not deterministic. `air-quality` in particular pushed back hard on stale 2024
data in one run and accepted it in the next, with no code change between them.
