# One server-side loop: prototype design

**Status:** proposed, awaiting approval to implement
**Date:** 2026-10-01
**Branch:** `proto-single-loop` (worktree), based on `feat-autonomous-agents`
**Reverses:** `2026-09-30-one-agent-loop-two-platforms-design.md`, whose rejection of this rested on
premises that have since changed — enumerated below, because the written record currently argues the
other way.

**Why a prototype rather than a plan:** the decision is worth more than the code. Doing most of the
work and then judging is cheaper than reasoning about it for another week, *provided the judging
criteria are fixed in advance* — otherwise a half-built prototype gets judged on how it feels. §7 fixes
them.

## 1. What changed since the rejection

My earlier rejection had six load-bearing objections. Four do not survive:

| Objection | What changed |
| --- | --- |
| "Contextual tools become RPC to an ephemeral user-controlled endpoint, inverting the trust direction" | Overstated. The browser already executes those tools and their results already enter the loop's context; the provenance envelope already treats every tool result as untrusted. What moves is who *asks*. A patched client that fabricates a tool result is strictly less dangerous than today's patched client, which runs the whole loop. |
| "Two tool universes, not two implementations of one" | Non-contextual read-only tools become openapi-mcp, i.e. server-side. The browser keeps only genuinely contextual tools — page actions, display, `wait_for_user_action`. A minority, not a parallel universe. |
| "Token streaming regresses into the delta protocol this branch deleted" | What was deleted was an HTTP-polling delta protocol for *several watchers of a stored conversation*. A websocket token stream to one browser is a different mechanism, and it is what the socket is for. |
| "The gateway is the trust boundary and cannot be deleted while any loop runs in the browser" | Circular: it is only an objection if a browser loop is kept. The gateway has no consumers outside our own UI (verified), so with no browser loop it has no reason to exist. |

Two survive and are accepted costs: **per-conversation server compute**, and **churn on code reworked
twice this week**.

And two arguments *for* it that the rejection never weighed:

- **openapi-mcp bootstrapping is a per-page-view cost in the browser** — fetch and parse a set of
  OpenAPI documents on every page open — and a once-per-process cost on the server.
- **Guards and moderation become enforcing rather than advisory.** The earlier spec had to state that
  the browser's `stopWhen` guards are advisory, bypassable by a patched bundle or a devtools session,
  with the gateway as the only real bound; and that moderation applied to one loop only. That asymmetry
  is a defect, not a trade.

**The condition I wrote for reversing is met.** That spec said the reversal becomes right "if a personal
conversation ever becomes a server-side artifact". Per-user stored conversation history is exactly that.

## 2. Decisions taken (from this conversation)

1. **The loop runs in the API process that holds the conversation's websocket.** Colocation is what
   makes the reply path trivial: no sticky routing, no cross-process rendezvous, no lock.
2. **Conversations are not shared.** One conversation has one user. The shared timeline — several
   instructors on one thread — is dropped.
3. **Storage is a per-user conversation history**, not an indexed shared store.
4. A conversation is **with an agent**: the user's personal assistant, or a configured agent with a
   persona (what "autonomous agent" means today).
5. **Agent memories** are anticipated, not built.
6. **Traces stay visible only with consent.** Either as today (separate storage) or folded into one
   storage with a consent flag on the data — §5 picks.

## 3. Decisions this design takes, and why

**A dedicated bidirectional websocket, not the existing pub/sub channel.** Verified:
`@data-fair/lib-express/ws-server` accepts only `subscribe`/`unsubscribe` from a client and rejects
anything else with a 400, and its fan-out is mongo-backed for a fleet. It is a downstream notification
bus, correctly. The agent session needs request/response *to* the browser, so it gets its own endpoint on
the same HTTP server. This avoids changing a shared library (which this project requires be justified
with numbers) and keeps colocation honest: one socket, one process, both directions.

**The loop is the existing executor, generalised — not a new loop.** `api/src/autonomous-agent-runtime/`
already is a server-side stateful loop with stored `UIMessage` parts, guards, spend accounting,
compaction and recovery. The personal assistant becomes an agent whose identity is the user's forwarded
session instead of an NHI. Writing a second loop would recreate the duplication this whole exercise is
about removing.

**One port survives: identity.** Forwarded user session, or the agent's own NHI. Everything else that
the two-platform spec made a port — history, model access, spend, output — has exactly one
implementation once the loop is one loop, and a port with one implementation is indirection with a cost
and no benefit. (This is the correction to that spec: the engine extraction and this reversal are
**substitutes**, not complements.)

**Contextual tools are request/response over the socket**, with a correlation id, a timeout, and results
wrapped in the same provenance envelope as any other tool result. A browser-returned result is untrusted
input, exactly as an MCP server's is.

**The gateway is deleted.** It is the single largest measurable simplification and it is only available
once no loop runs in the browser. Quotas, usage recording and moderation move into the loop, which is
where they stop being enforceable-only-at-one-hop.

**A dropped socket does not kill a turn** — the turn completes and is persisted, and the client refetches
on reconnect. The exception is a turn blocked on a contextual tool call or `wait_for_user_action`: the
only thing that can answer is gone, so those fail with the existing stop-reason machinery.

**Anonymous users get no history.** "Per-user history" with no user means an in-memory conversation for
the socket's lifetime, never persisted. This also answers the earlier objection that anonymous
conversations become server state: they do not.

## 4. What has to be built

Roughly in dependency order. Each is a commit-sized unit, not a task list.

1. **The agent session socket** — authenticate from the session cookie, bind to a conversation,
   bidirectional framing with correlation ids, server to client token streaming.
2. **The browser tool bridge** — the page registers its contextual WebMCP tools with the session; the
   server advertises them to the model and calls them over the socket.
3. **The personal agent** — an agent record with no NHI, identity = forwarded session, calling the
   internal MCP server as the user.
4. **Conversation storage, simplified** — per-user, with an agent reference; drop the shared-timeline
   machinery (one `author` per message becomes user-or-agent, not an attribution envelope defending
   against other instructors).
5. **Port the in-page chat** onto the session socket; delete `use-agent-chat`'s loop, its compaction
   application, its sub-agent orchestration and its tool-exploration bookkeeping.
6. **Sub-agents, server-side** — the browser's nested `ToolLoopAgent`s move into the loop. Expected to
   be the largest single piece, and the one most likely to surprise.
7. **Host events, server-side** — page state folded into context, which today is a browser concern.
8. **Delete the gateway** and the delta protocol it served.
9. **Moderation and guards in the loop**, applied to every surface.

## 5. Traces and privacy

One storage, consent-flagged, rather than two. A conversation is stored because the loop needs it; a
*trace* is the same content annotated with what the request and response actually were. Keeping two
stores was a consequence of the browser holding conversations and the server holding only traces — which
stops being true here.

So: the conversation is the record, visible to its own user; an org admin sees nothing by default; what
consent unlocks is admin visibility, flagged per conversation, with the existing 30-day retention
applying to that flag rather than to the content. This needs its own review before implementation — it
is the one part of this design with a compliance consequence, and §4 can proceed without it.

## 6. What is knowingly lost

Stated plainly, because a prototype that hides its costs cannot be judged:

- **Multi-user conversations**, deliberately. Also what made the attribution envelope necessary — a
  simplification, but an org admin can no longer watch an agent's thread.
- **A home for P2's scheduled runs.** A scheduled autonomous run has no user and no socket, so
  "per-user conversations colocated with a socket" has nowhere to put it. The loop can still run
  headless — it does today — but the conversation's owner and the absence of a live channel both need an
  answer. **This is the sharpest unresolved question in the design** and it is not blocking for the
  prototype.
- **Free client orchestration.** Every active conversation becomes a server-side loop holding a model
  stream.
- The `_dev` pages and the simulation harness drive the browser chat directly; both need repointing.

## 7. How the gains get judged

Fixed now, so the judgement is not retrospective:

| Measure | How |
| --- | --- |
| **Net code** | lines added vs deleted across api/ ui/ shared/ lib-*/, counted per area, with the gateway and the browser loop called out separately |
| **Concepts** | count of `docs/architecture/` topics still needed; number of message models; number of ports; number of places quotas/moderation are enforced |
| **Latency** | first token, and a contextual tool round trip, measured on the dev stack before and after |
| **Testability** | tests covering paths unreachable before — a contextual tool that fails, a loop guard that actually stops a browser conversation |
| **Findings dissolved** | which of the branch review's open findings disappear rather than being fixed |
| **Server cost** | memory and CPU for N concurrent conversations, measured rather than asserted |

**Revert triggers:** contextual tool latency bad enough to be felt in normal use; sub-agents or host
events needing more code server-side than they replace; or net code going *up*.

## 8. What this prototype needs from the dev environment

It is a second checkout, so it needs its own `npm install`, and exercising it needs a dev stack for this
worktree — its own ports and containers, which the user starts. Until then this branch can be written and
type-checked but not run. Worth settling before §4 starts rather than at the point of wanting to measure
latency.
