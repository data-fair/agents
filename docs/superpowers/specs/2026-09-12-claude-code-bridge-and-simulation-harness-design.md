# Claude Code bridge + scenario simulation harness

> Design spec for dev tooling: run `agents` on Claude Code subscription models, and
> measure the product by simulating realistic user scenarios against a real browser.
> Modelled on the WebMCP eval harness in `json-layout` (`core/webmcp-eval/`).

## Problem

Two gaps, one dependent on the other.

**1. No usable models in dev.** Working on `agents` — or on the agent integration in
`~/data-fair/data-fair` — needs a real model behind the assistant, tools, summarizer,
evaluator and moderator roles. The `mock` provider answers `"world"` to `"hello"` and
emits a canned tool call; it proves wiring, not behaviour. Every other provider in
`api/src/models/operations.ts:37` needs a paid API key. A Claude Code subscription is
already available and unused by the product.

**2. No way to measure whether the product actually works.** The Playwright suite
asserts mechanism: that a tool registered mid-turn is callable in the same turn
(`tests/features/chat-mcp/`), that settings round-trip, that a stalled stream aborts.
None of it answers *can a person get what they came for* — which is where the failures
recorded in the project's own memory live: silent conversation drops, reasoning models
stuck, chat hangs, moderation false positives. Those were all found by hand.

The second depends on the first: a simulation needs a real model driving the assistant.

## Goal

- `agents`, running in the dev workspace, answers with Claude Code subscription models,
  in both this repo and `~/data-fair/data-fair`, with no product code changes and nothing
  subscription-specific shipping in the Docker image.
- Conversations stay cheap as they grow: the bridge keeps prompt-cache continuity across
  turns rather than re-paying for the whole history each time. Treated as a requirement,
  not an optimisation — see §1.4 for what that does and does not buy.
- A repeatable suite of judged scenario simulations: a persona with a goal drives a real
  browser against a real page with real tools, and a judge reads the transcript and
  reports where the product misled the user.

## Non-goals

- A first-class `claude-code` provider type in the settings schema. Deferred until daily
  use proves the dev proxy insufficient.
- Persisting live sessions across bridge restarts. A restart drops to full replay, which
  is correct, only slower.
- Running simulations in CI. They need an authenticated `claude` and consume plan quota.
- Replacing the existing Playwright suite. This measures a different thing.

## Design

### 1. Feasibility, established by probe

All of the following was verified against `@anthropic-ai/claude-agent-sdk@0.3.269`
driving the native `claude` 2.1.269 binary, before this spec was written.

| question | result |
|---|---|
| Can a turn be stopped at the first tool call, handing it back uncalled? | yes |
| Does the tool handler stay unexecuted? | yes |
| Does stateless replay of history produce the right continuation? | yes |
| Does it run on the subscription? | yes — `apiKeySource: 'none'`, OAuth credentials |
| Can raw JSON Schema tool definitions be used? | yes, via the low-level MCP `Server` |
| Can a tool handler suspend across the HTTP boundary and the turn continue? | yes |
| Does resuming a session produce prompt-cache hits? | yes, above a size threshold |

Four findings constrain the design rather than merely confirming it:

**1.1 `canUseTool` is not the interception point.** A bare `allowedTools` entry
auto-approves before the callback runs — the SDK emits
`CLAUDE_SDK_CAN_USE_TOOL_SHADOWED` saying so. Interception reads `tool_use` blocks off
the assistant message and breaks the iterator. This is also simpler and catches parallel
calls in one message.

**1.2 Isolation is load-bearing, and `settingSources: []` is not enough.** With setting
sources already empty and cwd set to this repo, the assistant recited the auto-memory
index: *"11 documented items covering agent trace design, e2e flakiness fixes, moderation
options, chat hang issues, reasoning-model bugs"*. Auto-memory is keyed to the project
directory, so only a **neutral cwd** removes it. Measured:

| cwd | settingSources | input tokens | knows the product? |
|---|---|---|---|
| temp dir | `[]` | 455 | no |
| this repo | `[]` | 1543 | yes — names data-fair, lists the memory index |
| this repo | user/project/local | — | yes, plus `CLAUDE.md` / `AGENTS.md` |

This is not only a harness concern. The bridge process is started from the repo; if it
passed `process.cwd()` through, every manual dev chat would be answered by a model
reading `AGENTS.md` and the memory index — flattering and wrong. **The neutral cwd is an
invariant of the bridge, asserted by a test.**

**1.3 A ~367-token preamble is irreducible.** A plain-string `systemPrompt` is a full
custom replacement (6523 cached tokens for the `claude_code` preset → 371 total for a
minimal custom prompt), but a floor remains and it contains the cwd path. The assistant
under test is therefore *not* byte-identical to what a production OpenAI or Mistral
assistant receives — every provider adds its own scaffolding, and parity of that kind is
unattainable in principle. What is attainable, and what this design guarantees, is that
**no role knows the product exists beyond what the product itself told it**. The temp
directory is given a meaningless name so the leaked path carries no signal.

**1.4 Caching is real, but only session continuity captures the part that grows.**
Measured with a ~9k-token system prompt on `claude-haiku-4-5`:

| configuration | cache behaviour |
|---|---|
| custom system prompt ≲ 4k tokens | no caching at all, in any configuration |
| fresh session, identical system prompt | reads 9039 — **system-prompt caching is free** |
| full replay, identical history, fresh session per turn | reads 9039, **re-writes 1250 every turn** |
| resumed session | reads the full 9382 prefix, **writes only the 201-token delta** |

Two consequences. First, prompt caching is content-addressed at the API level, so a
stateless replay already reuses the system prompt without any session bookkeeping —
the naive "no caching without resume" assumption is wrong. Second, the *conversation
history* is never read back under replay: it is re-written on every turn, so the cost
grows with the conversation exactly where it hurts. Session continuity is what removes
that, which is why it is in v1 rather than deferred.

Below roughly 4k tokens nothing caches regardless. Short dev conversations will
therefore show no cache activity at all; this is expected, not a fault.

### 2. The bridge — `dev/claude-bridge/`

A standalone Node process, started by the user like the other dev processes
(`npm run dev-bridge`), logging to `dev/logs/dev-bridge.log` per the `dev/status.sh`
conventions in `AGENTS.md`. Nothing under `api/` changes.

#### 2.1 Endpoints

Exactly what `agents` consumes, no more.

- `GET /v1/models` → `{data:[{id,name}]}`. Required: `fetchOpenAICompatibleModels`
  (`api/src/models/router.ts:41`) issues `GET {baseURL}/models` to populate the settings
  dropdown. Returns a fixed list (`opus`, `sonnet`, `haiku`, plus pinned dated ids) — no
  network call.
- `POST /v1/chat/completions` → SSE, OpenAI chunk shape.

**Provider configuration is not free-form.** The provider must be created as
`openai-compatible` with **`compatibility: 'compatible'`**, so the gateway routes through
`@ai-sdk/openai-compatible` to `/v1/chat/completions`. Left at `'default'`, `createModel`
(`api/src/models/operations.ts:62`) targets `/v1/responses`, which the bridge does not
implement. `apiKey` is optional for this provider type, so none is needed.

#### 2.2 Request mapping

1. `system` messages → the SDK's `systemPrompt` as a plain string (full replacement).
2. `tools[]` → a low-level MCP `Server` built per request, its `ListTools` handler
   returning the JSON Schemas verbatim, `alwaysLoad: true` so they are never deferred
   behind tool search. The high-level `McpServer` helper is unusable: it rejects raw
   JSON Schema, demanding Zod.
3. `messages[]` → resolved against the live-session map (§2.4). On the fast path only the
   new tool results are delivered into the running query; on a miss the whole array is
   rendered into a single transcript prompt for a fresh session.
4. Isolation, fixed and not caller-overridable: `tools: []`, `strictMcpConfig: true`,
   `settingSources: []`, freshly-created neutral temp cwd, `CLAUDE_CODE_*` scrubbed from
   the child env. Without `tools: []` the first probe run had 27 built-in tools in scope
   and the model reached for `ToolSearch` instead of the tool it was given.

#### 2.3 Response mapping and the suspended tool call

Stream assistant text as `delta.content` chunks. On reaching a `tool_use` block, collect
**every** `tool_use` in that assistant message (OpenAI permits parallel calls), strip the
`mcp__<server>__` prefix to recover the original tool name, and emit them as
`delta.tool_calls` with `finish_reason: 'tool_calls'`. Otherwise finish with `stop`.

The turn is **not** aborted at that point. Each MCP tool handler returns a promise that
stays unresolved; the bridge closes the HTTP response while the SDK query remains alive
with its handlers suspended. When the client's next request arrives carrying the
`tool_result`s, those promises resolve with the client-supplied content and the *same*
query continues.

This is what makes §1.4's caching work, and it is also the only way the `tool_use` is
answered by a real `tool_result` block. The alternative — abort, then resume and deliver
the tool result as user text — was probed and does produce a correct-looking answer, but
it leaves the `tool_use` permanently unanswered and relies on the model tolerating a
malformed exchange. Rejected as a foundation.

The per-server MCP `timeout` is raised (10 min) so a handler suspended across a slow
client turn is not killed; the default would abort a tool call waiting on a human-driven
action button.

Map the `result` message's usage into the OpenAI `usage` object so existing cost and
quota accounting keeps functioning. The reported `total_cost_usd` is list-price
bookkeeping, not billing — consumption is against the plan's rate limits. This gets a
comment in the code so the numbers in the usage UI are not mistaken for real spend.

Errors — rate limit reached, `claude` not authenticated, SDK error result — map to
OpenAI-shaped errors. Otherwise they surface as the silent-drop and hang classes already
recorded in this project's memory, which would be a self-inflicted repeat of bugs already
fixed.

#### 2.4 Session continuity, and why it cannot go stale

The bridge keeps a map of live conversations:

```
key   = sha256 of the incoming messages[] prefix, excluding the new suffix
value = { query, pendingToolCalls: Map<tool_call_id, resolve>, lastSeen }
```

On each request the bridge hashes candidate prefixes of `messages[]` (the delta since the
last turn is normally one or two messages, so a handful of split points are tried) and
looks for a live entry.

- **Hit, and the request supplies exactly the `tool_call_id`s that entry is waiting on** —
  resolve those promises; the live query continues. This is the fast path.
- **Miss, divergence, or a suffix that is a new user message rather than the awaited tool
  results** — abort any live query for that key and start fresh with a full replay.

**Staleness is structurally impossible, not merely guarded against.** The key is a content
hash of the exact prefix, so any edit to history — compaction replacing turns with a
summary (`docs/architecture/compaction.md`), `redactHistoryMediaToolResults` rewriting
tool results, a user retrying a turn — changes the hash and becomes a cache *miss*, which
degrades to replay. There is no path by which a superseded history is silently answered;
the worst case is the performance of the no-cache design.

**Lifecycle.** Entries carry a TTL (idle 15 min) and are swept; abandoned conversations —
a closed browser tab — have their queries aborted rather than leaking a `claude`
subprocess. A bounded number of live sessions is enforced, evicting least-recently-used,
so a long dev session cannot accumulate processes without limit. The count of live
sessions is exposed on a `GET /_bridge/status` endpoint, because "why is my machine
slow" needs an answer that is not `ps`.

**Restart drops everything**, by design (see non-goals): the map is in memory, and a
restarted bridge simply replays.

### 3. The simulation harness — `simulations/`

#### 3.1 Why a separate Playwright config

`playwright.config.ts` runs every project when invoked without `--project`, so a
simulation project added there would make `npm run test` burn plan quota. Simulations get
`playwright.sim.config.ts`, importing `tests/fixtures/login.ts` and
`tests/support/axios.ts`. Reusing the login fixture is deliberate: it encodes the
simple-directory exchange-token rotation handling fixed in `efa20ba`, and re-deriving
that would reproduce a solved bug.

#### 3.2 A case

`simulations/cases/index.ts`:

```ts
{ name, app: 'agents' | 'data-fair', baseURL?, route, persona, goal, seed?, maxTurns, tags }
```

`agents` cases target the existing `ui/src/pages/_dev/*` harness pages — `chat-mcp`,
`chat-subagent`, `chat-live-tools` already register real WebMCP tools, so most scenario
pages exist. `data-fair` cases carry their own `baseURL` and target real data-fair pages,
exercising `agent-tools/` and `ui/src/composables/agent/*`.

`seed?` is an optional setup hook run before the browser opens — for cases that need
fixtures in place (a dataset, a configured application), reusing `dev/fixtures.ts` where
it already provides them.

There is **no expected output**. A run is judged from its transcript, not diffed against
a blob written by whoever wrote the case.

#### 3.3 Running a case

1. `clean()`, then seed settings over the admin API: one `openai-compatible` provider
   (`compatibility: 'compatible'`, `baseURL` = the bridge) with all five model roles
   assigned.
2. Log in, navigate to the route.
3. Attach a network listener to `**/v1/chat/completions`. **This is the evidence.**
   Request bodies carry the full message array and the tool definitions the page actually
   registered; responses carry what the model actually returned — including sub-agent
   turns, compaction and tool calls. The rendered DOM shows only what survived to the
   screen. Rendered assistant text and console errors are captured alongside.
4. Turn loop until the simulated user emits `DONE` or `maxTurns` is hit: ask the user
   subprocess for its next message, type, send, wait for the turn to settle, capture.
5. Write `simulations/tmp/sim-<case>.json` (transcript) and `sim-<case>.run.json`
   (sidecar: pinned models, effective bridge options, durations, exit status, errors).
   The split is load-bearing — a case that fails to dispatch must report `not run`, not
   silently re-report the previous run's verdict.

#### 3.4 Isolation applies to every role

All three Claude roles — assistant under test, simulated user, judge — get identical
isolation: neutral cwd, `settingSources: []`, `tools: []`, `strictMcpConfig: true`,
scrubbed env. Only the payload differs:

| role | receives |
|---|---|
| assistant under test | exactly the gateway's system prompt, messages and tools |
| simulated user | persona + goal + conversation so far |
| judge | the case goal + the transcript |

A simulated user launched from this repo would inherit the auto-memory index and know the
bugs the scenario exists to find (§1.2). The bridge records its effective options into
each sidecar, so a contaminated run is visible rather than inferred.

#### 3.5 The simulated user

An SDK subprocess, isolated as above, with the persona as `systemPrompt` and the
conversation so far as prompt. It returns the next user message, or `DONE` when its goal
is met or it gives up. It is instructed to behave like a real user — to be vague, to
change its mind, to push back — not to be a cooperative test fixture.

#### 3.6 Judge, report, baselines

A `simulation-judge` subagent (`.claude/agents/`) receives the case, its goal and the
transcript *path* (transcripts are large), and returns a JSON verdict: satisfied yes/no,
plus a **friction list** — which assistant turn or tool result misled the user, and what
they concluded. The friction list is the product; the score is a filing aid.

`npm run simulate [case...]` runs every case in the registry, or only those named.
`npm run simulate:report [case...]` prints case / model / turns / verdict / frictions / duration,
exiting non-zero on unsatisfactory, invalid, not-judged or not-run. Baselines live in
`simulations/baselines/<date>/`. A `/simulate` skill holds the procedure, including
*ignore the runner's own account of how it went — the transcript is the evidence*.

Models are pinned by `SIM_ASSISTANT_MODEL`, `SIM_USER_MODEL`, `SIM_JUDGE_MODEL`, recorded
per run and printed by the report, so verdicts from different tiers are never compared
silently.

#### 3.7 Rate limits

Three Claude roles per case on one plan. Runs are sequential by default; parallelism is
opt-in. The runner must recognise a rate-limit result and report it as an **invalid run**
— a truncated conversation judged as a product failure is worse than no result.

## Testing

- **Bridge, pure functions** — messages→prompt rendering, `mcp__` prefix round-trip, SDK
  message→OpenAI chunk mapping, error mapping. Playwright `unit` project, under
  `tests/features/claude-bridge/`, per the pattern in
  `tests/features/settings/settings.unit.spec.ts`.
- **Bridge, isolation invariant** — a test asserting the options handed to the SDK carry a
  neutral cwd, empty `settingSources`, empty `tools` and `strictMcpConfig`. This is the
  §1.2 guarantee; it must fail loudly if someone "simplifies" the cwd handling.
- **Bridge, session continuity** — the §2.4 state machine, with the SDK faked so it runs
  deterministically and offline: a matching prefix plus awaited `tool_call_id`s resolves
  the pending handlers; a diverged prefix, a compacted history, and an unexpected suffix
  each fall back to replay and abort the live query; TTL and LRU eviction abort rather
  than leak. The staleness claim is the one most worth a test, since its failure mode is
  silent and wrong answers rather than an error.
- **Harness, deterministic** — case registry validation (every case names a reachable
  route, unique names, required fields) with no model involved, so it runs in `npm run test`.
- **Judged runs** — the harness itself, run manually via `/simulate`.

## Risk / blast radius

- **Product code:** none. The bridge is a dev process; the harness is a separate config.
  The only shared files touched are `package.json` scripts and `dev/status.sh`.
- **Fidelity:** the assistant under test carries a ~367-token Claude/SDK preamble that a
  production provider would not send (§1.3). Stated, not hidden; it carries no product
  knowledge.
- **Live sessions:** the bridge now holds `claude` subprocesses open between requests
  (§2.4). Mismanaged, this leaks processes. Bounded by TTL, an LRU cap and explicit aborts
  on divergence, and observable via `/_bridge/status`. This is the main complexity the
  caching requirement buys, and it is contained in one module.
- **Non-determinism:** three models per run means no two runs are identical. This is why
  verdicts are judged and baselines are dated rather than asserted equal.
- **Plan quota:** the main practical limit. Sequential by default, and `npm run test` is
  kept clear of simulations by the separate config (§3.1).
