# Architecture overview

**data-fair/agents** is a multi-provider AI chat service with tool-use capabilities, designed to be embedded into data-fair applications. The agent loop runs on the server, which also holds the conversation; the browser renders it and contributes page tools. It provides a websocket agent session, server-side orchestration with sub-agents, and an embeddable chat widget.

```mermaid
graph TB
  subgraph Monorepo
    UI[ui — Vue 3 SPA]
    API[api — Express 5 server]
    LV[lib-vue — composables]
    LVT[lib-vuetify — chat widgets]
  end

  UI -->|agent session websocket| API
  UI --> LV
  UI --> LVT
  LVT -->|iframe + BroadcastChannel| UI

  API -->|Vercel AI SDK| Providers[LLM Providers]
  API --> MongoDB[(MongoDB)]

  HostApp[Host Application] -->|embeds| LVT
```

| Workspace | Role |
|-----------|------|
| `api/` | Express server: the agent loop and conversation store, the agent session socket, settings, quotas and usage, moderation, review, summarization |
| `ui/` | Vue 3 + Vuetify 4 SPA: the chat (rendering the turn the server streams, gathering the page's tools for it), settings and review pages |
| `shared/` | What both the server and the browser read: the agent session protocol and its frame schemas, host events, message parts, the audited-agent rule — and nothing else (a unit test enforces that every module has a UI consumer) |
| `lib-vue/` | Vue composables: WebMCP tool registration, sub-agent declaration, BroadcastChannel transport |
| `lib-vuetify/` | Embeddable Vuetify components: chat drawer, menu, action button, toggle FAB |
| `lib-sim/` | The scenario-simulation harness (`npm run simulate`) and the dev bridge to Claude Code models |

Every conversation runs on ONE loop, on the server (`api/src/conversations/executor.ts`): the in-page
chat's personal assistant and configured [autonomous agents](./autonomous-agents.md) alike. The chat
talks to it over the agent session websocket (`api/src/agent-session/service.ts`, protocol in
`shared/agent-session-protocol.ts`), the only live channel and the only way to start a turn or decide
on an approval: there is no HTTP route for either, and no polling. The chat sends prompts, its page's
contextual tools, its host state and events, aborts and approval decisions; it receives the stored turn
as it is written (`delta`, `message`, `activity`, `subagent`, `cost`, `turn-end`), plus calls to those
tools. HTTP serves the rest: the agents a person may talk to, the history list, a conversation's
runs as a plain read, and deleting a thread. A transcript is read only over the socket (the history
sent on attach) and through review.

The frames are JSON schemas like every other boundary, compiled by `npm run build-types`:
`shared/agent-session-client-frame/schema.js` is what a browser may send, strictly validated (an
invalid frame is answered with the field that was wrong, never dropped silently);
`shared/agent-session-server-frame/schema.js` is what the server sends, typed only, and the browser
reads it leniently, ignoring a type it does not know. A refusal is an `error` frame carrying the status
the same refusal would have had over HTTP (400, 401, 403, 404, 409), or 500 for anything else.

Both directions are bounded. A browser frame is at most 1 MiB (`maxPayload`; a larger one closes the
socket with 1009) and its fields have sizes (`shared/agent-session-client-frame/limits.js`: a prompt of
200 000 characters, 100 tools, 100 host events of 1000 characters…), which the chat itself fits what it
forwards to. Towards a browser that is not reading fast enough (over 1 MiB waiting), frames a later one
replaces whole — an in-progress message or sub-agent transcript, a delta — are skipped before being
serialized (`isSupersededFrame`); the final message, calls to the page, activities and the turn's end
always go.

A conversation starts one way, for everyone: a `hello` without `conversationId` names the account and
the agent, and is checked at once, so a refused agent is reported when the chat opens; the first
`prompt` then creates the thread (`createConversation`), carrying its title, and an `attached` frame
names it. Opening a chat creates nothing. A `hello` with a `conversationId` binds to an existing thread
after the ownership check, and replays its stored transcript. A new prompt stops the previous turn of
the thread, whether it is live or still queued for its lock: the person spoke, and the agent answers
what they say now.

A signed-in person's conversations are stored and theirs to come back to. An **anonymous visitor's**
thread is stored only for the loop's sake: the socket that created it is the only one that can use it,
and it is purged when that socket closes (`purgeAbandonedAnonymous` sweeps one whose close never ran).
Their turns are charged per IP, in the untrusted pool — see [Quotas & usage](./quotas-usage.md).

The person's consent to [review](./conversation-review.md) travels in the protocol as well: the browser
keeps its answer in its own cookie and says it in the `hello`, and in a `review-consent` frame when it
changes. The server never reads that cookie.

AI provider/model configuration and credit-based quotas are layered across deploy-time env vars, per-org superadmin definitions, and org-admin distribution — see [Configuration](./configuration.md). Every model call, whoever makes it, is charged through one function, `chargeModelCall` (`api/src/usage/charge.ts`) — see [Quotas & usage](./quotas-usage.md).

**Development seams.** What the test suites need from the server — a reset of every `test*` document
and in-process cache, state manufactured on purpose (orphaned runs, held locks), clocks passed in as
data, a thread's stored messages read over HTTP — lives in one router, `api/src/test-env/router.ts`,
mounted under `/api/test-env` only when `NODE_ENV` is `development`. Product code does not know it
exists: where a test must observe something (the task notifications pushed to the events service),
the router wraps the product's own outlet.

## Why the loop runs on the server

A loop in the browser lets a patched client (a modified bundle, a devtools session) compose the history
the model sees, skip moderation, ignore the step and repetition guards, decide compaction, pick the
model role and write tool results, provenance envelope included — and it needs a model proxy accepting
arbitrary message arrays from browsers. With the loop here, all of that is held and enforced by the
service, and a client can lie only about **its page's tool results and host state**: irreducible, since
the page runs those tools, and already treated as untrusted input by the provenance envelope. Prompt
injection through that channel remains; nothing here claims otherwise. The same move gives the
conversation a durable home (revival, review, memory) and one place where quotas and moderation apply.

Accepted costs: every live conversation is a server-side loop holding a model stream, and a page tool
call costs one client-to-server round trip. `dev/measure-session-latency.ts` (both ends on localhost)
puts the fixed overhead at ~0.25 ms, p99 under 1 ms, so the real cost is the person's own RTT, once per
step — the calls of one step go out concurrently — against model latency of hundreds of milliseconds.

- **No privileged tool surface.** The loop's capabilities are what the page declares, which any in-page
  agent sees, and what the catalog's MCP servers publish over HTTP, reached as the person or as the
  agent's own identity exactly as any authenticated MCP client reaches them. A third-party agent with
  the same identity can do what ours can; a catalog entry pointing at a deployment no outside client can
  reach would break that, and is a deployment choice to avoid.
- **The socket is its own endpoint**, not the stack's pub/sub websocket (`@data-fair/lib-express/ws-server`),
  which accepts only `subscribe`/`unsubscribe` from a client: the session needs request/response toward
  the browser (page tool calls), which a notification bus is not, and bending it would mean changing a
  shared library.
- **A dropped socket does not stop a turn.** It completes and is stored, and a page attaching later is
  served it; only what was waiting on that page — a page tool call in flight — fails, with an error the
  model reads.

## Hosts

The platform serves every organization's domains from the same services, and simple-directory's
sessions are host-only, so every MCP call of an agent acts on exactly one **site** (an origin; the path
prefix is ignored, `api/src/sites/operations.ts`):

1. **Credentialed MCP is site-bound.** A catalog entry with `auth: nhi-session` is called with the
   site's `x-forwarded-host`, and with a token obtained for that site when it is one of the agent's
   **account sites**: the site it was enrolled on, plus its organization's sites as simple-directory
   lists them. Anywhere else it is called anonymously, and a credential never travels without its site.
   An entry with `sites: 'home'` (data-fair's platform server, which refuses anonymous callers) is called
   on the home site only, and only when the agent has a session there; its `homeAlternative` (the
   datasets server) stands for it everywhere else: on the portals, and on a home outside the account.
2. **Home site.** A chat acts on the site of the person's socket; a planned task, or a turn nobody
   watches, on `nhi.siteUrl`, captured when the agent is first configured. A chat outside the account
   runs anonymously, and the agent is told so.
3. **Account portals** are reached through the same tools, with an optional `portal` argument naming
   another account site. A `home` entry's tools take none: its `homeAlternative`'s tools are offered for the
   portals only, with a required `portal`. Platform tools on another portal of the same account would
   mostly duplicate the home ones; what differs from one portal to the next is its published catalog.
4. **Everything else is external MCP**: public endpoints an organization admin lists on the agent,
   called anonymously through the web egress guard. Web access reports the MCP servers a site publishes
   (its `/.well-known/ai-catalog.json`), and `request_mcp_access` asks an admin to connect one.
5. **The personal assistant** acts as the person: their cookie is sent with their socket's site only;
   no portal, no external server.


## The other documents

| Concern | Read |
|---|---|
| A turn's tools: page tools over the socket, the MCP catalog, `wait_for_user_action` | [MCP tool integration](./mcp-tools.md), [Host events](./host-events.md) |
| What the model is sent, and how a long conversation is kept within its window | [Context management](./context-management.md) |
| What stops a turn: step and repetition guards, budgets, the clock | [Loop guards](./loop-guards.md) |
| Delegating to workers | [Sub-agent orchestration](./sub-agents.md) |
| Configured agents with their own identity | [Autonomous agents](./autonomous-agents.md) |
| What an agent remembers across conversations | [Agent memory](./agent-memory.md) |
| Prompts an agent runs on a schedule, unattended | [Planned tasks](./planned-tasks.md) |
| Reading web pages, feeds and sitemaps under an allowlist | [Web access](./web-access.md) |
| Files an agent downloads, writes and hands to tools, without the bytes passing through the model | [Agent files](./agent-files.md) |
| Scripts the model writes to transform data and chain tool calls, intermediate results kept out of its context | [Code mode](./code-mode.md) |
| Providers, models, roles | [Multi-provider AI abstraction](./providers.md), [Configuration](./configuration.md) |
| Who may spend what, and what it cost | [Quotas & usage](./quotas-usage.md) |
| Refusing abusive input | [Input moderation guard](./moderation.md) |
| What an admin may read back | [Conversation review](./conversation-review.md) |
| Putting the chat in a host application | [Embedding](./embedding.md), [Integration context](./integration-context.md) |
| Shelved | [Progressive tool disclosure](./tool-exploration.md) |
