# Giving the simulated user eyes and hands

> Design spec. The simulated user in the scenario harness currently cannot see the
> page it is talking about. This adds real perception and interaction, in the shape
> a person has.

## Problem

The persona receives only the chat transcript — `readConversation` returns the
contents of `.agent-chat__user-bubble` and `.assistant-content`, and
`personaPrompt` is given nothing else. Yet `persona.ts:48` instructs it:

> "If a reply is vague, unhelpful, or does not actually show you the result, say so."

A persona told to want visible results, with no way to check, invents the
complaint. The run of 2026-09-14 produced three of these in one suite:

| case | what the persona asserted | what it had observed |
|---|---|---|
| `open-panel` | "I'm looking at the screen and nothing is happening" | nothing |
| `iframe-set-data` | "the box is empty" | nothing |
| `register-person` | "I don't see the form on the page" | nothing |

Each judge then read the fabrication as ground truth. `open-panel`'s judge wrote
*"The person checked the screen, saw the panel still closed"* — an event that never
occurred. The transcript shows the tools succeeding (`open_panel {}` then
`set_display {"text":"Product Launch: Q4 2026"}`) with zero console errors.

This is the failure mode the first eval's own write-up warned about — *"a harness
can manufacture the failures it claims to detect"* — now demonstrated three times in
one run. It also means the baseline document's `register-person` conclusion rests
partly on the same sand: the assistant's unverifiable *claim* was real and visible
in the transcript, but "the person went looking and found nothing" was not.

## Goal

A simulated user that can look at the page and act on it, so that when it says "I
don't see it" the statement is checkable — and so that a judge can tell a real
product failure from a persona that never looked.

## Non-goals

- Raw Playwright access for the persona (see §2 — this is an exclusion, not a gap).
- The persona driving the whole session, including typing into the composer. The
  runner keeps the turn loop; §3 explains why.
- Re-judging the 2026-09-14 verdicts as part of this work. They are void and must be
  regenerated after the change, but that is a run, not an implementation task.

## Design

### 1. Mechanism: the one already in the repository

`createToolServer(tools, onCall)` (`lib-sim/tool-server.ts`) builds an in-process
low-level MCP server whose `CallTool` handler suspends on a promise the caller
resolves. The bridge uses it to hand a model's tool call out to the browser and wait.

The persona gets the same construction, with the handlers executed against the
runner's existing `page`. One browser, one page, no new dependency, and a mechanism
already exercised by every simulation run to date.

`@playwright/mcp` is explicitly **not** used: it is absent from the tree, it would
drive its own browser rather than the runner's page, and this repository pins
Playwright 1.63.0 — the version at which that package is recorded as broken.

### 2. The tool set, and why it is small

Three tools, shaped like a person rather than like a test framework:

| tool | returns / does |
|---|---|
| `look()` | the accessibility snapshot (`ariaSnapshot()`) of what is on screen |
| `click(name)` | clicks by accessible name/role |
| `type(name, text)` | fills a named field |

`ariaSnapshot` is available on both `Page` and `Locator` in the pinned Playwright,
and is what `@playwright/mcp` itself exposes as the page's appearance.

**No `evaluate`, no raw CSS selectors, no DOM access.** This exclusion is the
design. A persona that can run JavaScript would verify outcomes no human could —
making verdicts wrongly optimistic, the exact mirror of today's wrongly pessimistic
ones. The harness's value is that it reproduces what a person experiences; a
persona with superhuman access reproduces something else.

**Crossing the frame boundary.** A person sees the whole viewport, not one frame. In
an embedded case the chat is inside an `<iframe>`, so `look()` must span both. The
host supplies the roots to snapshot — it already knows whether a case is `embedded`
— keeping the package ignorant of host-specific wiring, consistent with the
primitives-only boundary.

### 3. One rule for the persona

It may look and interact freely, but to **talk** to the assistant it replies with
its message; the runner sends it. Without this the persona would type into the
composer itself and the loop would double-send.

This is what preserves `maxTurns`, the `DONE` sentinel and the empty-completion
guard as harness invariants rather than emergent behaviour — machinery that took
several review rounds to make honest, and which keeps the invalid-run distinction
meaningful.

### 4. Evidence: the other half of the fix

Eyes are useless to a judge that cannot see what was seen. `Transcript` gains:

```ts
observations: Array<{ turn: number, tool: string, args: unknown, result: string }>
```

Both judge definitions — `.claude/agents/simulation-judge.md` and
`lib-sim/templates/simulation-judge.md`, which a guard test keeps byte-identical —
are told that these exist and that:

> A claim about what is on screen must be supported by a preceding `look()` in
> `observations`. A persona asserting a visual fact it never observed is a HARNESS
> fault — report it as such, not as product friction.

That instruction is what would have caught today's three false verdicts.

**Snapshot sizing.** An aria snapshot is large and `air-quality`'s transcript is
already 137 KB. Each root's stored snapshot is truncated to **4000 characters**,
with an explicit `…[truncated]` marker: enough for a judge to verify what was
visible, without transcripts too expensive to judge or too large to read. The
cap applies per root, not to the joined result, so a large host page can never
crowd a second root (e.g. `## chat panel`) out of the log entirely. The number
is a starting point, not a measured optimum — revisit it once real transcripts
exist.

### 5. Package surface

Additive, so the version moves to `0.3.0` and the published `0.2.0` contract keeps
working:

- `createPagePerception(roots)` → `{ server, observations }` — the MCP server config
  to hand the persona, and the recorded observation log.
- `nextUserMessage(caseDef, conversation, turnsLeft, opts?)` gains an optional
  `perception`. Omitted, the persona behaves exactly as it does today.
- `Transcript.observations`.
- The barrel and its guard test.

**Correction (post-review).** `Transcript.observations` is a **required** field,
not additive in the strict sense — this is the one deliberate breaking change
for 0.3.0 consumers. It stays required on purpose: optional would let a host
wire `perception` in, forget the transcript field, and ship a blind run that
still reports `valid`. See `lib-sim/README.md` for the one-line upgrade.

### 6. Isolation is unchanged, and still load-bearing

Neutral cwd, `settingSources: []`, `tools: []`, `strictMcpConfig: true`. The persona
gains exactly one MCP server — the page — and still no built-in Claude Code tools.

It now sees the product's UI, which a user does. It still cannot see this
repository, which a user cannot. That distinction is the whole isolation guarantee
and this change does not touch it.

## Risks

- **`nextUserMessage` currently passes `maxTurns: 1`.** With tools the persona needs
  several steps per message (look → act → reply), so that bound must rise, and it
  becomes the cap on tool use per turn. Too low and the persona cannot finish
  looking; too high and a confused persona burns quota clicking around. **Set it to
  6** — enough for look → act → look → reply with room to spare, and low enough to
  bound a confused persona. Like the snapshot cap, this is a starting point to
  revisit from a real run, not a measured value.
- **Runs get materially slower and costlier.** Every user turn becomes a multi-step
  agent loop. `air-quality` already takes ~2 minutes; expect the suite to roughly
  double.
- **A persona can now change the page.** On `_dev` harness routes this is acceptable;
  it is worth remembering when host repos point cases at real application pages.
- **Branch cost, accepted deliberately.** This lands on `chore-local-dev`, which was
  complete, whole-branch reviewed and green. Adding a subsystem after that review
  means the review and its fix wave must be repeated before merge.

## Testing

- **A guard on the exclusion.** The exposed tool set must contain no `evaluate` or
  raw-selector escape hatch. This is the design's core constraint and the thing most
  likely to be added later as a convenience, so it gets a test that fails if the set
  grows one.
- **The tool wrappers themselves get no unit tests** — they are thin Playwright calls
  and a test would assert a mock. They are covered by real runs.
- **`open-panel` is the acid test.** Its persona demonstrably fabricated on
  2026-09-14. After this change its complaint must either be preceded by a `look()`
  that supports it, or the run must go differently. Re-run it more than once: three
  models per case means a single run is weak evidence.
- **The three void verdicts are regenerated** after the change, and the baseline
  document is corrected where it rests on the fabricated half.
