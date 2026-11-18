# On-demand tool loading

A full-scope autonomous agent is offered about a hundred MCP tools (data-fair, portals, catalogs,
processings, metrics, registry, the `form_*` tools) before the person says anything. Providers advise far
fewer: OpenAI "aim for fewer than 20 functions available at the start of a turn"
([function calling](https://developers.openai.com/api/docs/guides/function-calling)); Anthropic finds
selection accuracy "degrades once you exceed 30–50 available tools", and deferred tools raised Opus 4 from
49% to 74% on its eval ([advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use)).
Production runs smaller open models, which degrade sooner. Money matters less: those providers cache a
repeated prefix on their own ([Prompt caching](./providers.md#prompt-caching)). What a large set costs is
selection accuracy and context, the share compaction then has to reclaim.

So above a size threshold, a turn sends the core tools, `load_tools`, and a **catalog** in the system prompt
instead of every MCP tool definition. The model loads what it needs by exact name; a loaded tool stays
loaded for the rest of the conversation. Code: `api/src/conversations/tool-loading.ts` (pure), wired in
`api/src/conversations/model-loop.ts`.

## What is deferred, and when

- **Deferrable:** the MCP tools of the turn (`toolOrigins`: the built-in platform server, catalog and
  external servers), for every agent, the personal assistant included. Never: the service's own tools
  (`SERVICE_TOOL_NAMES`, `load_tools` among them), page tools, and an MCP tool a page tool shadows (the
  page's wins, [§7 of MCP tools](./mcp-tools.md#7-the-tool-set-is-live-within-a-turn)).
- **When:** the deferrable tools' definitions (description and input schema, as the provider gets them,
  `estimateTokens`) exceed `toolDeferralPercent` (default **10**, env `TOOL_DEFERRAL_PERCENT`) of the
  assistant model's context window. That is Claude Code's `auto` rule
  ([MCP tool search](https://code.claude.com/docs/en/mcp)). Below it the turn is exactly as before. Decided
  once per turn, before the stream: the catalog is part of the prompt. `100` turns it off; there is no
  per-agent setting.

## The catalog

A "Tools to load" section of the system prompt (`renderToolCatalog`, after the server guides): one
sentence on how to load, then per server a flat list, `full_name — first sentence of its description`
(cut to 120 characters, defused like any server text).

- **Every deferrable tool, loaded or not.** It is an index, not the list of what is missing: a load then
  changes the tool definitions only, never the prompt, so the next turn's first request starts as the
  previous turn's last step did.
- **Names, not categories** (Anthropic suggests a line of categories; Claude Code and OpenAI show names):
  about 2k tokens for a hundred tools, against tens of thousands of definitions, and names are what lets a
  weak model ask for exactly the tool it needs.
- **Flat, full names.** The service prefixes (`datafair_`, `portals_`, …) are already in the names; a
  shortened name under a heading is one a weak model would load wrongly.

## `load_tools({ names })`

Exact names only, several in one call, no cap. Known names load (again silently if already loaded);
unknown ones are reported in the result (`{ loaded, unknown }`); a call loading nothing fails. A loaded
tool is in the step's tool definitions from the next step on — the model gets its schema there, as with
[OpenAI's deferred tools](https://developers.openai.com/api/docs/guides/tools-tool-search) and Claude Code's.

**No search.** Search answers a set of thousands of tools with nothing listed (Anthropic's tool search,
the AI SDK's `toolSearch`); with every name in the catalog the model never has to find a tool it cannot
see. **Not the AI SDK's `toolSearch()` + `deferLoading`** (`ai@7.0.104+`,
[tool search](https://ai-sdk.dev/docs/ai-sdk-core/tool-search)): its input is a free-text query, and its
discovered set is private to one generation, i.e. one turn, so a second copy would have been needed to carry
loads across turns. The filter is the SDK's per-step one instead: `prepareStep` returns `activeTools`
([loop control](https://ai-sdk.dev/docs/agents/loop-control)), every tool of the live map but the
deferrable ones not loaded. **The load step cannot be skipped:** a name gives no argument schema, and some
serving stacks (vLLM with constrained tool calling) cannot emit a call to a tool absent from the request.

Provider-side tool search (Anthropic `tool_reference`, OpenAI `tool_search`), which loads without
changing the prefix, is not used: LiteLLM drops it on every non-Anthropic route
([LiteLLM](https://docs.litellm.ai/docs/providers/anthropic_tool_search.md)), and production is not on
Anthropic.

## Loaded for the conversation

The loaded set is read from the history the turn is given (`loadedToolNames`): every tool it called, and
every name a successful `load_tools` result loaded — an object within the turn, its JSON text once the turn
is stored and replayed (the record keeps a result's text). This turn's own loads are added from its steps
(`loadedInSteps`). A pure function of the history: the next turn, a revived conversation and an approval
run offer the same set, and an approved deferred write runs under its own name (the SDK executes an
approved call against the unfiltered `tools`). Compaction can shrink it — what the summary dropped is no
longer loaded — which is acceptable, compaction already rewriting the prefix. Nothing unloads a tool.

## Around it

- **Code mode follows the active set** ([code mode](./code-mode.md)): its signatures are those of the tools
  the model can call this step, and the map is rebuilt when a load adds one, as when page tools change. A
  script calling a tool not loaded meets the package's unknown-tool error. `load_tools` is direct-only.
- **A call to a listed tool not loaded** fails, without running, with a message telling the model to load
  it (`repairToolCall`, `notLoadedMessage`): what Claude Code does for an unloaded deferred tool. Treating it
  as an implicit load would make the catalog the tool list again in all but name.
- **What a run records** (`toolNames`, `toolDefinitionsRef`): the tools the model was actually given on some
  step. Deferred tools never shown are not recorded; the catalog is in the recorded system prompt.
- **No loop guard of its own:** the step limit and `repeatedCallGuard` bound repeated loads, and a load by
  exact name has no reason to be retried.

## On a production request

The first request of a full-scope autonomous agent captured in production on 2026-11-17, before the tool
surfaces were trimmed (147 tools), replayed offline through this module: 135 MCP tools deferrable (~52k
estimated tokens, past the threshold for any window under ~520k); the request drops from 438k characters
(427k of them tool definitions, 199k of those `code_mode`) to 51k — 13 tools (22k, `code_mode` over the
agent's own tools 6k), a 17.5k-character catalog and the messages. Each tool loaded later adds about 1.6k
characters on average. The catalog is ~130 characters a line, most summaries reaching the 120-character cut.

## The cost of a load

Measured 2026-11-18 on GreenPT through LiteLLM (`BENCH_PATHS=tools node dev/bench-prompt-cache.ts`: an ~8k-token
system prompt and 30 tools, ~4.7k tokens; cached tokens of ~10.9k, each variant sent twice):

| model | warm | one tool appended | again | one tool inserted mid-list | again |
|---|---|---|---|---|---|
| DeepSeek v4.1 Flash | 10,496 | 10,496 | 10,752 | 8,448 | 10,752 |
| GLM 5.3 | 10,880 | 4,352 | 11,008 | 0 | 2,176 |
| GLM 5.3 Flash | 10,752 | 3,072 | 11,008 | 1,024 | 11,008 |

DeepSeek keeps its cache up to the changed tool; GLM loses most of it. Either way the following request is
cached again, so a load costs about one uncached request, once. This is why loads are sticky and the catalog
never changes, and why a load **appends**: each step sends the always-on tools first, in the map's order, then the
loaded ones in the order they were loaded (`toolOrderFor`, passed as the SDK's `toolOrder` with `activeTools`).
In the map the MCP tools come first, so without it a load would insert near the head of the list. `tool_choice: 'none'` must not be sent: GreenPT then drops the tools from the prompt.

## In simulations

data-fair's five autonomous-agent cases (`simulations/cases/autonomous-agents.ts` there), 2026-11-18, on the
Claude Code bridge (sonnet), the agent's identity at full scope: 31 tools, data-fair's MCP alone, under the
threshold of a 128k window, so deferral was forced (`TOOL_DEFERRAL_PERCENT=3`) against the same image with
`100`. One round each, judged by `simulation-judge`:

| | off | on |
|---|---|---|
| satisfied | 5/5 | 5/5 |
| tools sent per step | 31 | 11–15 |
| assistant input tokens, all turns summed | 1.13M | 0.58M |
| final reply, words | 115 | 95 |

Every on run loaded exactly the tools it then called, by exact name, mostly in one call right after
`read_skill`; no call to a tool not loaded, no failed load, no tool reloaded on a later turn. The cost the
judges note is the load step itself, and once a second load where the skill read had already named the tool
(see Skills loading their tools, below).

## Left out

- **Skills loading their tools:** a skill naming its tools (`metadata.tools`) could load them when
  `read_skill` reads it, saving a step. One way of loading first; reconsider if runs show a skill read,
  then its tools loaded, every time.
- **Scope headings:** the platform's OAuth scopes (simple-directory `GET /api/scopes`; each tool's OpenAPI
  `security`, which openapi-mcp's `toolsForScopes` filters on) already narrow a scoped agent's set, which
  makes deferral mostly a full-scope matter. They could title the catalog's groups, but the MCP listing
  does not say which scopes a tool needs: openapi-mcp would have to expose them in each tool's `_meta`.

The earlier design, `explore_tools` in the in-browser loop (a summarizer model picking tools for the
assistant), was removed with that loop.

## Tests

`tests/features/conversations/tool-loading.unit.spec.ts` (the pure module) and
`tests/features/conversations/tool-loading.api.spec.ts`: deferral forced on the dev fixture by a small
model context window; the mock's `list tools` answers the names a step was offered, and
`load and call <name>` loads a tool then calls it.
