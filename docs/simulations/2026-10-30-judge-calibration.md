# Judge calibration for brevity — 2026-10-30

> Can the judge's new `brevity` block (lib-sim/templates/simulation-judge.md) tell a padded prompt from a
> tight one, and catch a short reply that lost substance? Run at commit `c54086a`, before any prompt change.

## What ran

| | |
|---|---|
| Assistant under test | `sonnet`, via the Claude Code bridge |
| Simulated user | `sonnet` (default) |
| Tools roles | `haiku` (default) |
| Judges | one `simulation-judge` per valid run, identical dispatch |
| Cases | `autonomous-agent-tool-use`, `autonomous-agent-server-skill`, `autonomous-agent-cannot-answer`, `autonomous-agent-approval` |
| Conditions | the default simulated persona ("current"), `SIM_PERSONA_VARIANT=bloated`, `SIM_PERSONA_VARIANT=lossy` (`simulations/cases/persona-variants.ts`) |
| Repeats | 2 per condition — 24 runs, 23 valid (lossy-r2 `autonomous-agent-approval`: premise not met, the person never decided on an approval; not judged) |

## Result

```
condition  judged  substance kept  tight/acc/padded  padding/msg  final words  interim notes  words/msg
current    8       1               3/5/0             0.5          65.79        0              63.86
bloated    8       1               0/2/6             3.72         159.61       1.88           193.81
lossy      7       0.71            5/2/0             0.03         22.44        0              21.69
```

Per case (rating, `!` = substance missing, final reply words):

```
case                            current                               bloated                           lossy
autonomous-agent-approval       acceptable 118.7w / acceptable 92.6w  padded 147.2w / padded 181.7w     acceptable! 26.3w
autonomous-agent-cannot-answer  tight 59w / acceptable 74w            acceptable 123w / acceptable 93w  tight 11.5w / tight 24w
autonomous-agent-server-skill   tight 23w / tight 57w                 padded 194w / padded 170w         tight 14.5w / tight 14.5w
autonomous-agent-tool-use       acceptable 35w / acceptable 67w       padded 156w / padded 212w         acceptable! 29.3w / tight 37w
```

`satisfied` was true in all 23 runs: none of the variants cost the person the goal, so `satisfied` alone
could never have told these prompts apart. That is the case for a separate brevity axis.

## Does the judge discriminate?

**Padding — yes, clearly.** `bloated` gets 7x the padding per message of `current`, 6 of 8 runs `padded`, and
every padding item is a verbatim quote of the kind the variant asked for (narration of each tool call, a
`Recap:` paragraph, an opt-in offer). The two `bloated` runs rated only `acceptable` are both
`cannot-answer`, where no tool is called and there is nothing to narrate — the judge said so, rather than
inventing padding.

**Substance — yes, when there is loss to catch.** The two lossy runs that really dropped something were
caught despite being among the shortest: `approval` r1 (no explanation before the approval card, no word on
the declined approval, no plain outcome — four omissions listed) and `tool-use` r1 (two of three closures
called "current" though not yet started). The judge did not reward the short reply for its length.

**The deterministic metrics agree** with the judge's ordering on every axis: final reply words
bloated 160 > current 66 > lossy 22; interim notes only under `bloated`.

## Limitations

- **The lossy variant is weak on Sonnet.** In 5 of 7 runs the model ignored "leave out dates" because the
  person asked for dates outright, and the judges said so. The substance check was exercised by 2 runs, not
  7. A stronger test needs a case where the needed substance is something the person does not ask for.
- **Judges are not blind.** The sidecar names the variant and the export carries its persona text; several
  judges remarked that the run "should be rated padded". The prompt text cannot be hidden without hiding
  what the judge checks against. Mitigation: padding items are verbatim quotes, checkable, and the metrics
  give the same ordering without any judge.
- **Borderline omissions are graded inconsistently.** "All three closures called current" was a `missing`
  item in lossy `tool-use` r1 but a low `conversation` finding in current `tool-use` r1 and r2. Treat one
  `!` as weak evidence; look at the rate over repeats.

## What the current prompt does, seen on the way

Not the object of this run, but consistent across judges, and the baseline for the prompt change:

- Even under the current persona, `approval` runs carry 3 padding items and the most words (93–119), and the
  assistant names the action "the reset" while the approval card says "Wipe everything" — a careful person
  then holds off.
- The assistant mentions its tools ("my tools only cover…") although `AUDIENCE_NOTE` forbids it; under
  `bloated` it does so in every reply — an operator persona asking for narration overrides the standing
  rule.
- It refuses without calling `get_my_configuration` (`SELF_KNOWLEDGE_NOTE`), in every `cannot-answer` run.
- Upcoming closures are presented as "current" (every `tool-use` run).

## Decision

The judge is fit to compare prompts on padding; its substance check works but has been exercised on few
runs. No change to the judge text. Proceed to the before/after on the product prompt, reading
`substance kept` over repeats rather than per run.
