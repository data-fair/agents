# Concise replies: before / after the reply-style clause — 2026-10-30

> The product prompt change of `docs/superpowers/specs/2026-10-30-concise-replies-design.md` (goal 3),
> measured with the brevity judge calibrated in `2026-10-30-judge-calibration.md`.
> Before: commit `c54086a`. After: commit `5ec10e6` (`REPLY_STYLE_NOTE` in `buildSystemPrompt`, chat turns
> only; the personal assistant's persona no longer invites "a note while you work").

## What ran

| | |
|---|---|
| Assistant under test | `sonnet` via the bridge; persona `sonnet`, tools roles `haiku` |
| Cases | `air-quality`, `register-person`, `workflow-hand-back` (personal assistant, page tools); `autonomous-agent-tool-use`, `autonomous-agent-cannot-answer`, `autonomous-agent-approval` (configured agent, MCP) |
| Repeats | 2 per condition — 12 + 12 judged runs. One after-r2 `approval` run was invalid (premise not met) and was rerun once (run 49 of the budget). |
| Judge | `simulation-judge` at commit `9dcc490`, unchanged across both conditions; identical dispatch |
| The default simulated agent persona | unchanged ("You answer briefly…"), so the configured-agent cases already started from a brevity instruction |

## Result

```
condition  judged  satisfied  substance kept  tight/acc/padded  padding/msg  final words  interim notes  words/msg
before     12      1          0.92            3/8/1             0.91         65.54        0.42           66.95
after      12      1          0.92            7/5/0             0.35         34.89        0.75           44.48
```

```
case                            before                              after
air-quality                     acceptable 144w / padded 131.7w     acceptable 44w / acceptable 78w
autonomous-agent-approval       acceptable! 88w / acceptable 54.8w  acceptable! 35w / tight 33.2w
autonomous-agent-cannot-answer  tight 62w / tight 57w               tight 35w / tight 38w
autonomous-agent-tool-use       acceptable 58w / acceptable 53w     acceptable 49w / tight 45w
register-person                 acceptable 40.5w / acceptable 49w   acceptable 21.5w / tight 17.5w
workflow-hand-back              acceptable 29.5w / tight 19w        tight 11.5w / tight 11w
```

- **Padding −62%** (0.91 → 0.35 items per user message), **final replies −47%** (65 → 35 words), everything the
  person read −34% per message. Tight runs 3 → 7; no padded run after.
- **No substance lost.** `satisfied` 12/12 both sides; `substance kept` 11/12 both sides, and the one miss each
  side is the same case and the same class (approval state, below), present before the change.
- Every case got shorter. The biggest drop is on the personal-assistant pages (`air-quality` 138 → 61 words
  on average), the cases with no brevity instruction of their own before.
- **What went up:** interim notes, 0.42 → 0.75 per run. That is the "one short sentence before work that takes
  several steps" the clause allows; judges counted it as padding once (a two-step job, "barely needed"), and
  never as narration. Narration of tool calls disappeared: no `narration` item in any after run.

What the padding was, before — quoted by the judges: `« Let me know if you'd like the display adjusted (e.g.,
current/latest reading instead of peak value, or a chart). »`, `« Is there anything else you'd like to do with
it? »`, a repeated closing summary of a form already visible on the page. After: one opt-in closer in 12 runs, and
on `air-quality` the station list repeated in the chat after `set_display` had put it on the page.

## What the clause did not fix (and was not meant to)

All present in the baseline, reported consistently by the judges, and each a candidate for its own change:

- **Approval state.** When the person types while an approval is pending, the call is declined
  (`"The person sent a new message instead of deciding."`); the assistant never says so, and the run started by
  an approval sometimes writes as if the approval were still to come ("a fresh approval prompt should be waiting").
  The record has the denial and the result in history: the model is not using them. The card itself shows no
  reason for "Declined".
- **Reply language.** On the personal-assistant pages, replies came in French to an English speaker with
  `language: en` in host state — 3 of 6 baseline page runs, 2 of 6 after. Not caused by the clause (it predates
  it); the clause's example uses « » quotes, which a judge suspected, so it may be worth making neutral.
- **Naming internals.** "my tools only cover…", district slugs (`city-center`), item ids, despite `AUDIENCE_NOTE`
  — fewer after, not gone.
- **`get_my_configuration` before refusing** (`SELF_KNOWLEDGE_NOTE`) is skipped in every `cannot-answer` run.
- **"Current" for upcoming closures** in `tool-use`; invented "save the form" next steps in `register-person`.
- **Dev fixture noise** (not product): the page cases are offered the review catalog's tools (`wipe_everything`,
  `explode`…) and its road-closure skills; `query_data` leaks NO2 rows through a PM2.5 filter.

## Decision

Keep the clause as written. The gain is large and consistent, the anti-goals held (no substance lost, no silence
finding), and the remaining defects are not about length. Next: the same comparison in data-fair (goal 4).
