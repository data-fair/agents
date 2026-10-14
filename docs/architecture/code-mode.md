# Code mode

One tool, `code_mode`, offered to **every agent** on every surface (chats and planned task runs, the
personal assistant included) with no setting. The model writes one JavaScript script; the script returns a
value, and that value is the call's result.

- **Plain scripting**: a script that calls no tool transforms text and JSON (count, filter, reshape,
  compute a date) more reliably than the model does in its head.
- **Tool chaining**: a script calls the agent's own tools as `await tools.name(input)`, filters what they
  return and calls the next. The intermediate results never enter the model's context; only the script's
  return value does.

This is the established pattern, not an invention: Anthropic's programmatic tool calling and "code
execution with MCP", Cloudflare's Code Mode, and the AI SDK's own `@ai-sdk/code-mode`, which this service
uses. A long chain of small calls is where round-tripping every result through the model costs the most
tokens, latency and attention; one script replaces it.

**It adds no authority.** A script calls only what the model could call directly in the same step, through
the same call path, as the same identity, with the same per-tool bounds. Everything a script reaches outside
its sandbox is a tool. **It reduces prompt-injection exposure** rather than adding to it: the data a script
handles is not read by the model, so text planted in a tool's output can no longer steer the next call
unless the script returns it. That is the control/data split CaMeL argues for (Debenedetti et al.,
arXiv 2503.18813), in its cheapest form: our script is written by the model *before* it sees the data. The
script's return value still reaches the model inside the provenance envelope (server `code-mode`), since it
may quote tool output verbatim.

The design and its alternatives: `docs/superpowers/specs/2026-10-12-agent-files-and-scripting-design.md`, §6.

## The tool

- Input `{ js }`, the package's own. JavaScript; TypeScript syntax is stripped, not checked. Top-level
  `await` and `return`.
- The description is the package's: the TypeScript signatures of every callable tool, generated from its
  input schema, with its output schema as the return type (`Promise<unknown>` without one). The output schema
  is the code-facing tool's only (`SourcedTool.codeOutputSchema`, set in `codeFacingTools`; the model's tools
  are unchanged): the file tools declare theirs (`FILE_CODE_OUTPUT_SCHEMAS`: `read_file` a string, `write_file`
  a record, `ls` an array of records), and an MCP tool carries the `outputSchema` its server declared, which is
  what its `structuredContent` follows. Most servers declare none (openapi-mcp does not), so we drop the
  package's "Tool call examples" block and append a short paragraph of ours (`describeScriptTool`): console
  output, failures as exceptions, **the conventions of what a tool returns** (an MCP tool its structured result
  as an object when it has one, otherwise its text as a string to `JSON.parse`; a result carrying files
  `{ text, files }`; `read_file` the whole text), "check what you got before writing or importing it", and which
  tools can only be called directly. The conventions are there because a script that guesses a shape parses
  nothing, silently: in the first simulation of an export-filter-import task, the model guessed `read_file`
  returned `{ text }`, imported an empty table, and needed four scripts.
- The `js` argument's description is ours too (`SCRIPT_ARGUMENT_DESCRIPTION`): the package's promises the
  call examples we drop.
- No `fetch`, filesystem, `require`, `process`, `eval`, `Function`, timers or crypto in the sandbox; built-in
  prototypes are frozen (`run`'s security model). `Date.now` exists.
- Annotations: not read-only, not destructive, not idempotent, open-world. A script may call writing tools;
  each keeps its own annotations and its own gate.
- Its calls are stored under the server `code-mode`, like any service tool's.
- `code_mode` is a reserved service tool name (`service-tool-names.ts`): a page cannot register a tool by
  that name.

`get_my_configuration` reports it in a `## Code mode` section: what it is, what cannot be called from it,
and its limits.

## Engine and limits

`@ai-sdk/code-mode` (1.0.94, exact-pinned with `ai` 7.0.137, see
[providers](./providers.md#ai-sdk-version)) runs on vercel-labs `run`: QuickJS-ng compiled to WASM, in a
pool of worker threads, a fresh context per run, a versioned serializer at the boundary, and workers
retired when they cannot return to a clean state. The WASM is embedded in the package's worker source, so
there is no native module, no file asset and nothing for the Docker image to do.

**The pool is per process and refuses rather than queues when full.** Its size is `codeModeMaxWorkers`
(`CODE_MODE_MAX_WORKERS`, default 4), set once at startup (`configureCodeMode`, `experimental_setMaxWorkers`).
Without it the package sizes the pool from the pod's memory, up to 32 workers at 64 MiB each; four keeps the
memory budget explicit. A full pool answers the model "too many scripts are running … try again in a moment,
or call the tools directly", and the instance stays responsive.

The policy (`CODE_MODE_POLICY`, `api/src/code-mode/operations.ts`):

| Limit | Value | Why |
|---|---|---|
| `timeoutMs` | 120 s | **Wall clock, tool waits included.** The spec's 10 s predates scripts calling tools: a catalog query plus a download does not fit in it. The turn's own deadline still bounds the whole. |
| CPU | 10 s | `run`'s own default (`cpuTimeoutMs`), which the package does not expose. Guest CPU only, so a busy loop dies at 10 s while a script waiting on tools does not. |
| `memoryLimitBytes` | 64 MiB | QuickJS heap. Text and JSON need no more; it is the unit the pool is sized in. |
| `maxStackSizeBytes` | 2 MiB | the package's default |
| `maxSourceBytes` | 64 KiB | a script is a few dozen lines; anything longer is data that belongs in a file |
| `maxResultBytes` | 1 MiB | the model reads 20,000 characters of it anyway; a larger result is told to go to `write_file` |
| `maxConsoleOutputBytes` | 64 KiB | the model reads 5,000 characters of it |
| `maxToolInputBytes`, `maxToolOutputBytes` | 16 MiB | at least the 10 MB a script may read or write as a file, plus JSON escaping |
| `maxBridgeRequests` | 100 | tool calls per script, equal to `STEP_LIMIT`: a script cannot make more calls than a turn could steps |
| `maxInFlightBridgeRequests` | 8 | concurrent tool calls (`Promise.all`); the package's 32 would let one script fan out against one MCP server |
| `SCRIPT_TRANSFER_BYTES` | 24 MiB | **everything a script passes to and gets from its tools, together** (ours, enforced in `codeFacingTools`; see below) |

**Why a transfer budget.** `run` keeps every call's input and result until the script ends: it is the record a
paused script is replayed from (each completed call answered from it, not run again). That record is bounded
by `maxContinuationBytes`, 32 MiB, which the package neither sets nor exposes, and past it the script dies with
"CodeModeProtocolError: Continuation state exceeds the 33554432 byte size limit" — reading a 10 MB file twice
was enough. So each call is counted the way `run` counts its entry (the value's JSON, kept as a string inside
the entry's JSON: escaped twice, so a CSV's quotes weigh four bytes each), and the call that would pass 24 MiB
fails in words: refused before it runs when its input is what passes, or, when its result is, reported as
having run (a write happened) with a result the script cannot have. The protocol error itself is translated too,
should an entry outweigh the count. The consequence is deliberate: **a script is for orchestration and small
data**, not for streaming large files through the sandbox. Every vendor of a light code mode (this package,
Cloudflare's isolates, Anthropic's programmatic tool calling) ships a separate full runtime for bulk work; ours
is data-fair itself — a temporary dataset, its API and filtered exports — and its processings for a
transformation to repeat. Serializing a large input is also slow inside QuickJS: a 25 MiB string passed to a
tool exhausted the 10 s of CPU before reaching it.

Every invocation's abort signal is the turn's, so Stop, the deadline and a deploy's drain stop a script. The
script's own timeout aborts its nested calls' signal too (`run` aborts the invocation's controller on any
terminal failure). A nested call gets that signal, and the MCP clients pass it to the request (catalog and
external, `{ signal }` on `client.request`), as the model's own calls do: a call is cancelled where it can be.
**A call already sent may still complete** — a server that received a write does not undo it, and a tool that
ignores its signal finishes on its own — so the timeout message says the script was stopped and that a call
it had already sent may still have completed ("check before repeating a write"). Such a call is recorded as
stopped (below), and its late answer is ignored.

**Why this sandbox** (spec §6.6, restated briefly): `isolated-vm` is in maintenance mode and had a critical
guest-to-host escape (GHSA-864f-rcv7-6rh4) — a V8 bug there escapes into the API process; `node:vm` is not a
security boundary and `vm2` was abandoned after repeated escapes; hand-rolling `quickjs-emscripten` is what
`run` already is, and that package's latest release bundles a QuickJS-ng in the range of CVE-2026-3979, so it
would also mean tracking the engine's fixes ourselves; a micro-VM (Firecracker, gVisor, e2b) is only needed for packages, a filesystem, network or
long processes, none of which text and JSON need. WASM QuickJS is defence in depth, as the package's docs put
it: **the tools are the trust boundary**, each validating its input and enforcing its own bounds.

## Why not `experimental_toolCallers`

The package's headline form, `experimental_codeModeTool` with `streamText`'s `experimental_toolCallers`,
binds the model's own tools into the script. We build the tool with `experimental_createCodeModeTool` over
a map we pass instead (`api/src/code-mode/tool.ts`), for three reasons:

1. **A script would get the model's tools unchanged**: enveloped, returning text. Moving the envelope into
   `toModelOutput` so `execute` can return data is unsafe here: what is stored is `execute`'s return, and a
   replay converts stored turns **without tools** (`storedTurnsToModelMessages`), so `toModelOutput` never
   runs on replay and a replayed result would reach the model unwrapped.
2. **The caller configuration is fixed when `streamText` is constructed**, against the initial `tools`, and
   throws on an unknown name. The tool set is live within a turn ([MCP tools §7](./mcp-tools.md#7-the-tool-set-is-live-within-a-turn));
   a page tool registered mid-turn could never be named in it.
3. **Tool-caller messages move.** `loopGuardPrepareStep` rebuilds every step's messages, so the SDK would
   re-append the caller's catalog message at the end of each request instead of carrying it in place
   (upstream vercel/ai#20572 is about exactly this).

`createCodeModeTool(tools, options)` is a plain tool over any map, and the package still generates the
TypeScript signatures, so this costs nothing. `assembleTools` (`model-loop.ts`) rebuilds it with the set,
on the first step and whenever the page's tools change, so a script reaches exactly what the model can reach
at that step. The package is imported only in `api/src/code-mode/tool.ts` and `code-tools.ts`: its API is
experimental.

## What a script can call

The turn's **main** tool set, after the sub-agent partition (so a worker's reserved tools are already out),
filtered by `codeCallable` (`api/src/code-mode/operations.ts`). Excluded, with the reason for each:

| Excluded | Why |
|---|---|
| any tool with `needsApproval` | the package refuses a nested call needing approval without an approval callback, and its docs say not to expose such tools; a script cannot pause for a person. Lifting this goes through `run`'s signed continuations (upstream vercel/ai#18143). |
| `wait_for_user_action` | it ends the turn |
| `request_web_access`, `request_mcp_access`, `plan_task`, `update_task`, `delete_task` | they ask an administrator |
| `read_skill` | a skill is guidance for the model; inside a script it is data nobody reads |
| every `subagent_*` delegation | a model loop inside a script (upstream vercel/ai#18145), and a worker's trace is keyed on the model's own call |
| `code_mode` | itself |

Everything else is callable: catalog and external MCP tools, the file and web tools, `memory`, and
`report_outcome`. A unit test pins the excluded names against the service's own constants.

- **Page tools** are the raw page set (`rawBrowserToolSet(session, …, { drainEvents: false })`): no envelope,
  and **host events are not drained**. A script could not pass them on to the model, so they stay pending for
  the model's next direct page call or its next turn. A page tool that shadows a catalog tool for the model
  shadows it for a script too. A task run has no page, so none.
- **Not a sub-agent.** Code mode is not routed through a `tools` worker: both keep intermediate results out of
  the lead's context, with different workers, and nesting them adds a model hop for no isolation gain. Every
  reference implementation gives scripting to the agent that plans the work.
- **Sub-agent workers do not get `code_mode`.** It is a service tool name, so a page config listing it
  reserves nothing. Spec §6.3 allows a page worker to list it; that is deferred until a page declares one.

## Data for code, text for the model

One tool, two `execute`s. `SourcedTool.codeExecute` (`api/src/conversations/operations.ts`) is what a
script receives; when absent, the script receives what `tool.execute` returns. The model's tool, the
record and replay never see it.

| Tool | A script gets | The model gets |
|---|---|---|
| catalog / external MCP tool (`client.ts`, `external.ts`) | `structuredContent` when the server sent one (data-fair's MCP does), else the text | the text; `structuredContent` is dropped |
| an MCP result with `resource_link`s | `{ text, files: [{ file_path, mimeType, size }] }`, plus `errors` for a link not saved | the text, with "Saved to your files: …" lines |
| an MCP result with image content | its text only (or its `structuredContent`); the images are not passed | the text and the images |
| `read_file` | the whole text file, up to 10 MB; an error beyond, naming the size | a page of numbered lines |
| `ls` | records `{ file_path, mimeType, size, expiresAt }` | a rendered listing |
| `write_file` | up to **10 MB** of text, answering a record | at most 1 MB, answering a sentence |
| other service tools, page tools | what `execute` returns (usually text) | the same, enveloped |

`structuredContent` is not validated against a declared `outputSchema`: openapi-mcp emits it without one,
and a validation of a value only scripts read would add a failure mode, not a guarantee (the catalog client
uses `client.request()` rather than `callTool()` for that reason, [MCP tools](./mcp-tools.md#result-formatting)).
`write_file` is held to 1 MB for the model because it would have to write the content out in full as
output tokens; a script writes what it computed, and the 10 MB matches what it can read back. The link
records satisfy the seam spec §4.2 left for code: a script chains "export, then import" by passing
`files[0].file_path` to the next tool's file argument.

## Each call is a call

A nested call goes through **the call path** (`withCallPath(sourced, ctx, 'code')`,
`api/src/files/call-path.ts`): the same file handling as the model's calls — a file argument is a path
signed for that call, a URL echoed back is scrubbed to the path, links become stored files — differing only
in what it returns (records rather than lines, above). It is not wrapped in the provenance envelope: the
script is not the model.

**Recorded as a trace.** The package emits no event for nested calls (upstream vercel/ai#18144): `streamText`'s
callbacks, telemetry and stream see only the outer `code_mode` call. So our code-facing wrapper
(`codeFacingTools`, `api/src/code-mode/code-tools.ts`) records each call into a `data-subagent` trace under
the `code_mode` call (`name: 'code_mode'`), keyed by the package's nested id `<outer>:tool-<n>`. It is the
mechanism sub-agent workers already use, so there is one way to show nested work:

- streamed as `subagent` frames while the script runs, coalesced within 25 ms (`TRACE_FLUSH_MS`, as the
  session's text deltas): each frame carries the whole trace, so one per open and settle made the traffic
  quadratic in the script's calls;
- each call's input is recorded **bounded** (`boundRecordedInput`, `parts-recorder.ts`): every string cut at
  10,000 characters with its length named, and an input still larger than a stored result kept as the head of
  its JSON. A script passes tools megabytes (`write_file` takes 10 MB from code); verbatim, a few such calls
  in a trace stored on one message would pass MongoDB's 16 MB document cap. Nothing replays these inputs, so
  nothing is lost to the model; the model's own calls are stored unbounded, as before;
- stored on the assistant message when the script ends: `finish` settles any call still open as "stopped: the
  script ended before this call answered", sends the final frame, and ignores whatever answers after it — a
  late frame would replace the finished trace in the chat with an empty pending one;
- left out of replay — the point: the model never sees intermediate results;
- rendered by the chat like a worker's: with the default `simpleSubAgents` display flag, a status chip on
  the `code_mode` call; with the flag off, a panel under the call, titled "Script", listing the nested calls.

Nested calls are not entries of the run's `calls` telemetry, which records model calls.

**Guards.** A nested call is not a model step (spec §6.5 expected it to count; it cannot without SDK events):

- the step limit and the repeated-call guard see the `code_mode` call, not what it does — five identical
  scripts with identical results are a repeat like any other;
- a script is bounded by its own policy (100 calls, 8 at once, 120 s, 10 s of CPU, above);
- the per-tool caps inside `execute` count nested calls as they are: the web tools' 50 calls per run, the
  external MCP servers' 50;
- the idle watchdog is paused while `code_mode` runs, as for any tool;
- tools cost no credits; the model steps around a script are billed as before, and the run's credit budget
  and deadline apply.

**The envelope** wraps the script's result as it wraps any tool result, under the server `code-mode`.

**Errors the model can act on** (`scriptErrorMessage`):

- A tool failure inside a script is rethrown as `CodeModeToolError(message)`, which the script can catch and
  which, uncaught, fails the script with the tool's own message. Any other error the package replaces with
  "Host tool failed.", which tells the model nothing. Each carries a **code of its own**
  (`CODE_MODE_TOOL_ERROR:<nested call id>`): the package keeps every such error a script's calls threw and,
  when the script fails, reports the first with the failure's code (`findPreservedCodeModeError`), so with the
  class's shared code a script that caught one failure and died of a later one was reported as the first.
- The package's and `run`'s limits are translated into sentences: CPU, wall clock, bridge limit, an
  unawaited call ("await every tool call"), a full pool, a source too large, a result too large ("write the
  data to a file with write_file and return its path"). A syntax error or the script's own `throw` keeps its
  name and message.
- An abort is passed through untouched: it is the turn's, not the script's, and the loop must recognise it.

The failure reaches the model as the `code_mode` call's `output-error`, enveloped like any thrown failure.

## Console and result

The package writes `console.*` to the worker's stdout — the **server's** logs — and returns only the value,
so a script's diagnostics would leak into the logs and never reach the model. A prelude (`wrapScript`)
shadows `console` inside the script and returns `{ value, logs }`; it sits entirely on the script's first
line, so a syntax error or a stack names the line the model wrote. Values are logged as `JSON.stringify`
would, falling back to `String` for a circular value or a BigInt.

What the model reads (`renderScriptResult`): the value (a string as is, anything else as indented JSON, or
"The script returned nothing."), cut at **20,000** characters with the same truncation notice as any large
result ([context management](./context-management.md)), then "Console output:" and the log, cut at 5,000.

## Description cost

The signatures repeat the direct tools' input schemas, so every turn pays for the tool set roughly twice.
That cost is the spec's choice: no tool is code-only, because hiding a tool from the model is a context
optimisation to decide with measurements, not by default. The package's examples block called every tool in
one `Promise.all`, growing linearly with the set, and was dropped. Measuring the footprint is macro review
R4, pending.

## Code

- `api/src/code-mode/operations.ts` — pure: the policy, the prelude, result rendering, error translation,
  the description, `codeCallable`.
- `api/src/code-mode/tool.ts` — the tool over `createCodeModeTool`; `configureCodeMode` (the pool, from
  `api/src/server.ts`).
- `api/src/code-mode/code-tools.ts` — the code-facing map (`codeFacingTools`) and the trace
  (`createCodeTrace`).
- `api/src/files/call-path.ts` — mode `'code'`: `codeExecute`, link records.
- `api/src/files/tools.ts` — `createFileCodeExecutes`; `api/src/mcp-servers/client.ts`, `external.ts` —
  the MCP `codeExecute`; `api/src/agent-session/browser-tools.ts` — `rawBrowserToolSet`.
- `api/src/conversations/model-loop.ts` — `assembleTools` builds it with the live set; the trace is stored
  through `storeSubAgentTrace`.

Tests: `tests/features/code-mode/code-mode.unit.spec.ts` (the engine against the real package: sandbox,
console, line numbers, errors, limits, abort, description), `code-tools.unit.spec.ts` (`codeCallable`, data
and recording, failures, the uncaught failure reported as itself, bounded inputs, a trace closed after a
timeout with nothing sent after it, coalesced frames, the file tools' return types),
`tests/features/autonomous-agents/external-mcp.unit.spec.ts` (a call's abort signal reaches the MCP request), `code-mode.api.spec.ts` (through the mock model: `structuredContent` and nested
records, files end to end, gated and reserved tools absent, errors, the personal assistant, self-knowledge),
`tests/features/agent-session/sub-agents.api.spec.ts` (a worker's reserved tool is out of a script's reach),
`code-mode.e2e.spec.ts` (the nested calls listed under the `code_mode` call, and after a reload),
`tests/features/files/call-path.unit.spec.ts` (mode `'code'`). The fixture's `closure_stats` returns
`structuredContent` without an `outputSchema`, as data-fair's MCP does. The unattended simulation case
`code-mode-clean-and-import-task-run` does export, filter and import in one script.

## Sources

- `@ai-sdk/code-mode`: https://ai-sdk.dev/docs/ai-sdk-core/code-mode ; `run`: https://github.com/vercel-labs/run
- vercel/ai#18143 (approvals in code mode): https://github.com/vercel/ai/issues/18143 ; #18144 (telemetry and
  lifecycle hooks for nested calls): https://github.com/vercel/ai/issues/18144 ; #18145 (sub-agent tools
  across callers): https://github.com/vercel/ai/issues/18145 ; #20572 (code-mode conversation messages):
  https://github.com/vercel/ai/pull/20572
- Anthropic, programmatic tool calling: https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling ;
  code execution with MCP: https://www.anthropic.com/engineering/code-execution-with-mcp
- Cloudflare, Code Mode: https://blog.cloudflare.com/code-mode/
- CaMeL, Defeating Prompt Injections by Design: https://arxiv.org/abs/2503.18813
- isolated-vm escape GHSA-864f-rcv7-6rh4: https://endorlabs.com/learn/ghsa-864f-rcv7-6rh4-critical-type-confusion-vulnerability-in-isolated-vm
- QuickJS-ng CVE-2026-3979: https://osv.dev/vulnerability/CVE-2026-3979
