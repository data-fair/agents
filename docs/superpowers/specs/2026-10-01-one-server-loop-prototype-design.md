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

One argument *for* it that the rejection never weighed:

- **Guards and moderation become enforcing rather than advisory.** The earlier spec had to state that
  the browser's `stopWhen` guards are advisory, bypassable by a patched bundle or a devtools session,
  with the gateway as the only real bound; and that moderation applied to one loop only. That asymmetry
  is a defect, not a trade.

**The condition I wrote for reversing is met.** That spec said the reversal becomes right "if a personal
conversation ever becomes a server-side artifact". Per-user stored conversation history is exactly that.

### Two arguments withdrawn on inspection

Both were raised in favour of this change and both turned out not to support it. Recorded because a
spec that keeps a bad argument invites someone to lean on it.

- **"openapi-mcp bootstrapping is a per-page-view cost in the browser."** It argues for *openapi-mcp*
  being server-side, which was already the plan — not for the loop being server-side. A browser loop can
  be an MCP *client* of a server-side openapi-mcp: one `tools/list` round trip per page, no OpenAPI
  document parsing in the browser at all. That is what MCP is for.
- **"Security is clearer server-side."** True of *our own* traffic, and that is worth real money and
  real product quality. But **loop guards cannot protect the platform**: a third-party agent reaching
  the same published MCP server as the user is untouched by our moderation and our step limits. Platform
  safety lives at the MCP server and in Data Fair's own permissions either way.

**So the honest remaining case is narrower than when this started:** one loop instead of two (the
duplication that caused every context bug on this branch), the gateway disappearing, guards that are not
bypassable for our own traffic, and durable history with memories. With capability on a published MCP
server, a browser loop and a server loop are **equally capable** — the tool argument is gone, not
weakened. This is a change made for our own product, not for the ecosystem's safety, and §7's measures
are what decide whether it pays.

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

### Parity is an invariant, not an aspiration

**This loop gets no tool surface another agent cannot reach.** The promise made to colleagues and
customers is that a third-party agent — a WebMCP-capable browser extension, another vendor's assistant,
anything with an NHI — has the same capabilities as ours. That is a constraint on where tools live and
who may reach them, and it is *independent* of where the loop runs. The loop is a **peer consumer** of
published surfaces, never a privileged one.

Concretely, two rules this prototype must not break:

1. **Capability comes from the published MCP server**, reached over HTTP the same way any client reaches
   it, authenticated as the user (forwarded session) or as the agent (NHI). Not a ClusterIP-only
   deployment with the profile gate off. If our loop can call a tool that an authenticated third-party
   client cannot, the promise is broken regardless of how the loop is structured.
2. **The page declares only genuinely contextual tools** — select, open, display, wait for the user —
   which any in-browser agent sees. Non-contextual capability moves to the server surface, and that is
   acceptable for parity *because that surface is published*, not because it stays in the page.

Why this needs writing down: the alternative is already the deployed design elsewhere, so drifting into
it is the default rather than a mistake someone has to make. See §9.

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
   **published** MCP server as the user, over the same ingress a third-party client uses (§3's parity
   invariant). Until the consolidation in §9 lands, the prototype points at whatever is reachable and
   records the gap rather than reaching for the privileged deployment.
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

## 5b. Findings from building it

Things the code revealed that the design did not anticipate. Recorded as they are found, because the
point of a prototype is what it teaches.

**1. For the personal assistant, the credential IS the socket.** Session forwarding means a turn's
identity comes from the connection, so a tab closed *before the turn starts* leaves it with no session,
and any catalog entry whose `auth` is `nhi-session` refuses. The executor's invariants still hold — a
terminal status, one assistant message that explains itself — and a test asserts exactly that rather
than pretending the turn succeeds. But it means:

- a personal turn is only as durable as the connection that started it, which is the opposite of the
  durability argument used *for* moving the loop;
- a scheduled run can never be the personal assistant, which independently confirms that scheduled runs
  are a different model rather than a conversation.

Mitigation available and not taken yet: capture the cookie when the turn begins rather than reading it
per tool gather, which widens the window from "the whole turn" to "the moment it starts". It does not
remove the class.

**1b. Fixing 2 narrowed 1, and left a subtler version of it.** With unreachable entries skipped, a
socketless personal turn no longer fails — it completes with **fewer tools than it should have had, and
nothing says so**. That is a real trade and not obviously the better one: failing loudly told the person
something was wrong.

The cause is that the skip decision conflates two different things: *"the server is down"* (an
availability event, where skipping is right) and *"we have no credential for it"* (a capability loss the
person should be told about). Separating them is the obvious next refinement, and the `skippedServers`
list already carries the reason needed to do it.

**2. "Every catalog entry, unfiltered" makes one broken server break the assistant.** FIXED.
`forEachListedTool` throws a 502 naming the failing server, which is right for a *configured* agent —
its selection is deliberate, so a failure is a misconfiguration worth surfacing loudly. The personal
assistant's selection is "everything in the catalog", so the same failure is an availability event,
and it takes down the whole assistant for a server the person never chose and may not need.

Fixed as a parameter rather than a behaviour change, because the two semantics are genuinely different:
a deliberate selection throws, "everything" skips and reports. `data-fair/mcp`'s own composer already
draws this line — *"a failing service is excluded and reported; only a bad index throws"*. Both halves
are asserted, and the skip is mutation-checked. See 1b for what it left behind.

**3. A guard written for configured agents refused every personal turn.** The executor refuses an agent
with no enrolled NHI, because for a configured agent that means a toolless turn that looks like a
capability problem. The personal assistant has no NHI *by design*, so the guard had to learn about the
one exception. Noted because it is the shape of thing to expect from reusing the loop: not conflicts of
structure, but guards whose premises were narrower than they looked.

**4. Deleting the gateway and moving sub-agents are ONE decision, not two.** A sub-agent is a model
loop, and the only way a browser calls a model in this architecture is the gateway. So the attractive
hybrid — keep workers in the browser, pay one round trip per *delegation* instead of one per inner tool
call — is unavailable: a browser-side worker needs the gateway to exist.

This matters for the judgement because §7 counts the gateway's deletion as a principal gain, and it is
now visibly conditional on carrying the heaviest part of the browser loop across. They stand or fall
together.

**5. The latency exposure of sub-agents inverts, but only if the tool migration happens.** A worker's
inner calls become round trips when its tools are PAGE tools, and workers are the heaviest tool users by
design — the reserved-tool partition exists precisely to concentrate tool use in them. That would make
them the design's real latency cost, far more than reading 1 suggested.

Except that the tools they typically reserve — `query_data`, `get_schema` — are *data* tools, which are
exactly the ones moving to the published MCP server. In the target architecture a worker's calls are
server-local and the exposure goes **down** rather than up: a delegation costs one round trip to fetch
its config, and nothing after that.

So sub-agents are cheap server-side *in the end state* and expensive *during the transition*, while page
tools still carry data operations. That ordering is now a reason to sequence the tool migration before
any rollout, not just alongside it.

**6. Host events were the cheapest piece, not the riskiest.** §4 listed them alongside sub-agents as
work to be done server-side, and the two-platform spec called them a browser concern. The module turned
out to contain **zero browser APIs** — its own header says it is "kept free of Vue and the `~` alias so
the node unit runner can import it" — so moving it was a rename plus two protocol frames. The store, the
pure formatters and `createWaitTool` all work unchanged, with the page feeding them over the socket
instead of directly.

And it discharges the objection this reversal was originally rejected over. `wait_for_user_action` was
described as "a distributed suspension holding a conversation lock". With the loop colocated with the
socket it is neither distributed nor a lock: an in-process promise, settled by the next frame on the
same connection in the same process. Asserted directly — a wait resolves with what the person did,
times out with text that tells the model to end its reply, and refuses a second concurrent wait.

The lesson generalises: of the two pieces the design feared most, one (sub-agents) was small code with
large consequences, and the other (host events) was a rename. Fearing the wrong one cost nothing here,
but it is a reason to read the remaining estimates sceptically.

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

### Reading 1 — contextual tool round trip (2026-10-01, after §4.2)

`node dev/measure-session-latency.ts`, 200 samples, server-side wait, both ends on localhost:

| mean | p50 | p90 | p99 | max |
| --- | --- | --- | --- | --- |
| 0.28 ms | 0.23 ms | 0.42 ms | 0.89 ms | 1.46 ms |

**The structural fact this measurement surfaced matters more than the number.** The new path is not an
*alternative* to the old one, it is the old one **plus one round trip**: in the browser, `serveCall`
still invokes the aggregator's tool, which still reaches the page's WebMCP server over
BroadcastChannel/postMessage exactly as today. So there is no "which is faster" comparison to make, and
no need to measure the old path separately — the delta is precisely one client-to-server round trip per
contextual tool call.

That makes the cost easy to state honestly: **~0.25 ms of fixed overhead from this code, plus the
user's own RTT, once per contextual tool call.** For a user at 30 ms RTT and a turn making three
contextual calls that is +90 ms against model latency measured in hundreds of milliseconds to seconds.
Parallel calls within one step go out concurrently (the session does not serialise them), so the RTTs
add up per *step*, not per call.

Correcting an earlier claim of mine: I described the existing path as "microseconds in-process". It is
not — it is already an MCP round trip over postMessage. The honest framing is the one above.

### Reading 2 — first token, in a real browser (2026-10-01, after §4.5a)

From pressing send to the first token rendered, measured in the page itself and reported by the e2e
spec: **28–31 ms** across runs, localhost, mock model.

Decomposed against reading 1, because the total on its own is not informative: the socket accounts for
well under 1 ms of it. The rest is the conversation append and the run document (two mongo writes), the
MCP tool gathering, and the model call itself.

**This is not yet a head-to-head**, and should not be read as one. The browser loop pays neither mongo
write — it persists nothing — and gathers its tools over postMessage rather than HTTP, so its own floor
is lower. What the server path buys for those milliseconds is the durable conversation that was the
point of moving. Against a real provider both are dominated by the model's own latency, measured in
hundreds of milliseconds upwards, so a ~30 ms floor is not material either way.

The honest head-to-head is still outstanding and needs the same instrument on the gateway path. It is
cheap to take — the browser loop is untouched on this branch — and is worth doing before the final
judgement rather than now, since §4.6 and §4.7 will both move work across the line.

## 8. Dependency: consolidating `data-fair/mcp`, which is not this repo's change

The parity invariant in §3 cannot be satisfied by this service alone. `data-fair/mcp` currently deploys
one image as two services, and its README names this service as the beneficiary of the privileged one:

| | `mode: public` | `mode: internal` |
|---|---|---|
| Reachable | ingress at `/mcp-server/` | ClusterIP only, no ingress |
| Profiles | gated by `PUBLIC_PROFILES` (default `["explore"]`) | unrestricted |
| Rate limiting | per IP | **off** |
| Consumers | external MCP clients | *"the agents service's autonomous runs"* |

Two things follow. First, **the promise is already untrue for writes**: with `PUBLIC_PROFILES` at
`["explore"]`, an external agent cannot even ask for `edit`. The consolidation is what makes the parity
claim true, and it is needed whether or not the loop moves. Second, **nothing depends on the privileged
deployment yet** — `api/config/default.js` has `mcpServers: []` — so this is the cheapest moment the
decision will ever have.

What consolidation actually costs, so it is not mistaken for a rename:

- **Rate limiting becomes load-bearing.** Today `internal` runs with limiting off *because it has no
  ingress*: unreachability is the control. One published server makes every profile internet-reachable
  and the limiter becomes the only thing between an anonymous caller and an expensive aggregate query.
  Once sessions are forwarded it should key on the authenticated principal, not on IP alone.
- **`IGNORE_RATE_LIMITING` becomes a sharp object.** A shared secret that bypasses Data Fair's own
  limits is defensible for an unreachable service; held by a loop acting per-user it means a user's
  agent traffic is unlimited while their direct traffic is not. That asymmetry needs an explicit
  decision, and the honest end state is that the secret stops existing.
- **A write surface goes on the public internet.** The gate moves from "which profiles are published" to
  "what may this principal do", which is the right place — Data Fair's own permissions — and it makes
  the approval gate (`2026-10-01-tool-approval-gate-design.md`) more valuable, not less.

Per-caller identity forwarding is already designed for: openapi-mcp's `createMcpHttpHandler` takes a
`context(request)` hook for exactly this, and its README calls the multi-caller server "`data-fair/mcp`
v2". Discovery is already partly built too — `GET /v0/servers` serves an MCP Registry API document, one
entry per profile, listing public profiles only in `public` mode.

**Out of scope here, tracked as a dependency.** The prototype proceeds against whatever is reachable and
records where it had to deviate.

## 9. What this prototype needs from the dev environment

It is a second checkout, so it needs its own `npm install`, and exercising it needs a dev stack for this
worktree — its own ports and containers, which the user starts. Until then this branch can be written and
type-checked but not run. Worth settling before §4 starts rather than at the point of wanting to measure
latency.
