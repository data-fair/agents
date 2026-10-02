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

- **What can be tampered with collapses to the irreducible.** The earlier spec had to state that the
  browser's `stopWhen` guards are advisory, bypassable by a patched bundle or a devtools session, with
  the gateway as the only real bound, and that moderation applied to one loop only. That asymmetry is a
  defect, not a trade — and it is the narrow version of a bigger point, set out in full under "the
  security argument, correctly stated" below.

**The condition I wrote for reversing is met.** That spec said the reversal becomes right "if a personal
conversation ever becomes a server-side artifact". Per-user stored conversation history is exactly that.

### One argument withdrawn on inspection

- **"openapi-mcp bootstrapping is a per-page-view cost in the browser."** It argues for *openapi-mcp*
  being server-side, which was already the plan — not for the loop being server-side. A browser loop can
  be an MCP *client* of a server-side openapi-mcp: one `tools/list` round trip per page, no OpenAPI
  document parsing in the browser at all. That is what MCP is for.

Recorded because a spec that keeps a bad argument invites someone to lean on it.

### The security argument, correctly stated

An earlier revision of this section withdrew it too, on the grounds that "loop guards cannot protect the
platform". That reasoning **collapsed two different trust relationships into one** and then judged the
argument against the one it was never about. Corrected here, because the error is instructive and the
argument is strong.

- *"Can we stop any agent misusing the platform?"* — authorization, rate limits, approval gates on
  destructive operations. Lives at the MCP server, applies to any fast actor regardless of who drives
  it, and loop location is irrelevant to it. An external agent acting as a user can do what that user
  can do; that is the definition of acting as a user, not a hole. Whether such an agent obeys its
  instructions or gets injected is **its harness's problem and its user's**, and not something this
  service can fix.
- *"Can we be clear about what OUR agent does, with OUR models, on OUR budget, and be accountable for
  its output?"* — that is the loop, and it gets unambiguously clearer server-side.

The second is better stated as a reduction in what can be tampered with than as "guards become
enforcing". Concretely, measured against the code:

| | today | after |
| --- | --- | --- |
| the history the model sees | client-composed, so forgeable | server-held |
| the moderation call | client-initiated, so skippable | in the loop, unavoidable |
| `stopWhen`, step limit, repeated-call guard | advisory | enforcing |
| compaction and the context budget | client-decided | server-decided |
| tool results **including the provenance envelope** | client-written | server-written for every tool but the page's own |
| which model role is asked for | client-chosen | server-chosen |
| spend accounting | per request at the gateway | per step in the loop |

A patched client today can do every one of those. After the move it can lie about **contextual tool
results and host state, and nothing else** — both irreducible, since the page runs those tools, and both
already treated as untrusted input by the envelope. The tamperable surface collapses to the part that
cannot be moved.

Two further consequences of the same kind: the **gateway is itself a liability surface** — an
OpenAI-compatible endpoint accepting arbitrary message arrays from a browser — so deleting it removes an
authenticated API we have to reason about, not merely a hop. And **moderation becomes uniform**: today it
applies to the browser loop only and the autonomous executor has none.

What this does **not** fix, so the claim stays honest: prompt injection through tool results and host
state remains, because that channel is irreducibly user-side.

**So the remaining case, after both corrections:** the two-loop duplication caused every context bug on
this branch; the tamperable surface collapses to the irreducible; the gateway's API surface goes;
moderation becomes uniform; durable history and memories get their natural home. With capability on a
published MCP server a browser loop and a server loop are **equally capable**, so the tool argument is
gone — but the accountability argument is second-strongest rather than withdrawn. §7's measures decide
whether it pays.

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

**The loop is the existing executor, generalised — not a new loop.** `api/src/conversations/`
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

**7. `systemPrompt` cannot move as it stands, and it is the one hole that would survive.** The browser
loop takes a system prompt from its caller: `DfAgentChatDrawer` exposes it as a **prop**, so a host
application gives the assistant its persona, and `ui/src/pages/[type]/[id]/chat.vue` reads it from a
**URL query parameter**.

Accepting that on a server-held loop would reintroduce exactly what §1's table says the move removes.
Every other client-controlled input is gone — history, guards, moderation, compaction, model choice —
and a client-supplied *system prompt* would be the single remaining piece of client-controlled
**instruction**. From a query string. That is a worse hole than any of the ones being closed, and it
would quietly undercut the argument that is now the second-strongest reason for the whole change.

**The capability is legitimate and already has the right shape.** A conversation is *with an agent*, and
an agent's persona is configuration. A host that wants its own assistant persona should name an agent,
not supply prose — and the mechanism exists: the conversation is created with an `agentId`,
and `hello` already carries `agentId`. The personal assistant is simply the default agent.

So the recommendation is: **`systemPrompt` becomes `agentId`** on the drawer's prop and on the chat
page's parameter. That preserves what hosts use it for, moves the text server-side where it cannot be
tampered with, and removes a query-parameter prompt injection that exists today.

It is an integration-surface change, so it was a product decision rather than something to take
unilaterally.

**Decided and implemented.** Standard agents with fixed ids, personas as static strings in
`api/src/agent-session/standard-agents.ts` (later from configuration — that changes where the string
comes from, not the shape of anything around it). `personal` is the default. The three host components
and both `_dev` pages name an agent; `systemPrompt` is ignored with a one-time warning rather than
silently dropped, so a host that has not migrated gets told why its persona vanished. The chat route's
`?systemPrompt=` is gone.

Two things this did NOT fix, stated plainly because the finding is about a hole:

- **On the gateway path the hole is still wide open, and no prop could close it.** The browser loop
  assembles the instructions and sends them to the gateway as `system:`; the gateway is a model proxy,
  so its client controls that field by construction. `agentId` is carried through `AgentChat.vue` but
  not yet consulted there. It becomes load-bearing when that component is pointed at the session — so
  this hole closes with the swap, not before, and the swap is the only thing that closes it.
- The e2e guard is an **absence** assertion, which is the only shape available for a removed
  capability and the shape most likely to pass for the wrong reason. It was falsified: re-wiring the
  query parameter makes it fail.

By contrast `reset` needed nothing: re-attaching to a new conversation rebinds the registry, replays an
empty history, and the server's state for the thread is new by construction. The only server-side
subtlety is that buffered host events are dropped on a rebind to a *different* conversation while
retained page state survives — the state is still true of the page, the buffer is for a model that will
never see it.

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

### Reading 3 — the swap (2026-10-02)

`AgentChat.vue`, the real chat, now runs on the server-held loop. Scoped deliberately to the main
chat: the gateway and `use-agent-chat` both stay in the tree, for reasons in "what the swap could not
delete" below.

**Code.** The adapter that replaced the browser loop for this path is **299 lines**
(`use-session-chat.ts`) plus **93** for the tool partition it shares with the old path, against the
**1229** of `use-agent-chat.ts`. The comparison is only fair with the reason stated: the adapter
contains no loop at all. No model call, no tool orchestration, no history management, no compaction,
no idle watchdog — those exist once, on the server, where the autonomous agents already needed them.
That is the structural claim this prototype was built to test, and it holds: the second loop was not
reduced, it was *deleted as a concept*. What remains on the client is assembly, and assembly is the
size you would expect.

The component itself changed by about forty lines, nearly all of it deletion. That matters more than
the ratio. If pointing the real chat at the server had required rewriting the chat, the architecture
would not be a drop-in and this section would be making excuses instead of a measurement.

**Four defects the swap surfaced**, none of which any test had caught, and all of which were invisible
precisely because the pieces looked wired:

1. **Host state was write-only.** `formatHostState` had no caller anywhere in `api/`. The socket filled
   the store and `wait_for_user_action` drained its events, so the store looked used — but retained
   state never reached a model. An assistant asked "what am I looking at?" had the answer in memory
   beside it and no way to read it. This is the most instructive one: the prototype had been exercised
   by a dev page that never asked about the page, so the gap had nothing to fail against.
2. **Frames sent before the socket opened were dropped silently.** The window is wide — the page
   renders, the composer enables, and the conversation still has to be created over HTTP before the
   socket is constructed. Someone typing immediately lost their first message with no error anywhere.
   The dev page's test had happened to wait for `data-attached` first, which is how a real bug hid
   behind a passing test.
3. **The system prompt contradicted itself** for standard agents: every agent was told it acts "under
   its own service identity", two paragraphs after a persona saying it acts as the person.
4. **The same action was reported to the model twice** once state was sent every turn — caught by a
   test written for the fix to defect 1, not by the fix itself.

**What the swap could not delete, and why the §7 net-code number is still a projection.** Finding 4
said `use-agent-chat` and the gateway cannot be split. That was right and incomplete: it is a
*three-way* coupling, and the third leg is the expensive one.

- `EvaluatorChat.vue` is a second `useAgentChat` consumer. Its tools close over the trace recorder in
  the browser and over architecture docs bundled by `import.meta.glob`. Moving it server-side is
  cleaner there in principle — the trace is already stored server-side and the docs are on disk — but
  it is a rewrite of a working admin feature, not a repoint.
- Anonymous users are refused by the socket (`agent-session/service.ts`). The gateway still serves
  them.
- Moderation does not exist server-side: 16 references in `gateway/router.ts`, none in the session
  path.
- Four api suites (`limits-enforcement`, `usage`, `moderation`, `trace-compare`) use the gateway
  merely as the way to make a billable model call. They would each need a new driver.

**Suite cost: 28 of 140 e2e tests.** This is the number to argue with, so it is itemised rather than
summarised. Every one of them tests behaviour that lived in the browser loop:

| Group | n | What it means |
|---|---|---|
| Host-event activation semantics | 9 | The browser sent state only at activation points (first turn, post-compaction, post-reset) with keyed-event dedupe. The server sends it every turn. Simpler, costs tokens, and the dedupe rules are unimplemented. |
| Sub-agent panels | 5 | Server-side sub-agents run; the panel wiring and step-cap reporting differ. |
| Moderation | 4 | Genuinely absent server-side. Not a test to rewrite — a feature to port. |
| Mid-turn tool refresh | 3 | A tool registered mid-turn becoming callable in the same turn. One of the three is exploration mode, which is shelved. |
| Compaction / hang / empty-completion | 4 | Assert the browser's own trace entries and indicators. The server does all three; the assertions are about the old mechanism. |
| Stale frames, trace consent, and two others | 3 | Trace consent rides on the gateway's `x-trace-storage` response header, which the socket has no equivalent of yet. |

Read honestly: roughly nine of these are a feature gap (moderation, activation semantics) and the rest
are tests pinned to a mechanism that moved. That is a real bill either way, and it is the strongest
argument the other direction has. It should be weighed against what the first column of this section
says: the alternative is maintaining both loops indefinitely, which is what produced four invisible
defects in the half that was supposed to be the simple one.

## 8. Deployment precondition: consolidating `data-fair/mcp` — NOT an iteration blocker

**Scope of this section, stated first because an earlier revision got it wrong.** This service is
independent of any particular MCP server: it talks to whatever the catalog is configured with, and in
dev that is mock tools and the local fixture. So nothing here blocks building, testing or iterating on
the single-loop architecture, and an earlier verdict that said "consolidate first, then migrate the
loop" over-escalated a deployment precondition into a development dependency.

What it *is*: a precondition for **deploying** this architecture. Before the new shape ships, the MCP
server has to be ready for it — and §5b.5 gives an independent reason to want that ready first, since
sub-agents are cheap server-side only once data tools are server-side too.

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

**Out of scope here, and not on the critical path.** The prototype proceeds against whatever the dev
catalog offers — mock tools and the local fixture — and records where it had to deviate. The parity
invariant in §3 still binds whenever this architecture meets a real deployment: our loop must reach the
published server the way any client reaches it, never a ClusterIP-only one with the profile gate off.

## 9. What this prototype needs from the dev environment

It is a second checkout, so it needs its own `npm install`, and exercising it needs a dev stack for this
worktree — its own ports and containers, which the user starts. Until then this branch can be written and
type-checked but not run. Worth settling before §4 starts rather than at the point of wanting to measure
latency.

## 10. Design review: what the new design should shed (2026-10-02)

A review of the finished prototype oriented on simplicity and performance, asking in each case
whether a choice still earns its keep now that there is one loop rather than two. Evidence is cited
so each item can be argued with.

### 10.1 The naming is the largest stale choice

`autonomous-agent-*` reaches 35 files, three collections (`conversations`,
`-messages`, `-runs`), the generated types (`Conversation/Message/Run`), the module
`autonomous-agent-runtime`, the field `agentId`, and the usage key
`autonomous-agent:<id>`. Every one of them now also holds, or describes, **an ordinary person's
chat** — a conversation whose `agentId` is `'personal'`.

This is not cosmetic. It is why `usageIdentityFor` billed every chat turn as the agent at role
'admin', why the quota refusal said "This autonomous agent could not run" to a person asking a
question, and why `assertCanInstruct` locked plain org members out of their own assistant. Three
defects found in one day, all downstream of a name that stopped being true.

**Recommendation:** rename to the general concept — `conversations`, `messages`, `runs`, `agentId` —
and keep "autonomous" only for what is actually autonomous (the configured agents, their NHIs, their
schedules). It is mechanical except for the collection names, which need a migration, and it is
cheapest now: everything built on these names from here inherits the confusion.

### 10.2 `parts` is the one type that is not uniform end to end

There are four representations of the same value:

| Where | Type |
|---|---|
| JSON schema (storage) | an open object with a few optional known keys |
| server, `operations.ts` | `UIPart = { type: string, [key: string]: unknown }` |
| the wire | `unknown[]` |
| client, `autonomous-agent-chat-message.ts` | `UIMessagePart<UIDataTypes, UITools>` — the AI SDK's real union |

The authoritative type already exists and is already imported: the client's. The server's is an open
bag, and the six `parts as any` casts in `executor.ts` (lines 827, 1062, 1111, 1208 and the two
`as unknown[]` sends) are not incidental sloppiness — they are the places where the open bag has to
be forced into the generated schema type.

**Recommendation:** adopt the SDK's `UIMessagePart` as the single type across storage, wire and
client, and stop describing parts in the JSON schema — validation already happens through
`safeValidateUIMessages` in `storedTurnsToModelMessages`, which is a stronger check than the schema
performs. That removes a parallel definition and every cast at once.

### 10.3 Trace storage is now largely redundant — and currently broken

**The finding, from a dumped document rather than from reading code:** a stored trace's
`request.body` is now `{ system, messageCount, historyUpToSeq, tools: <names> }`. There are no
messages in it, because the executor deliberately records a reference to a history it already stores
as the conversation.

But `ui/src/traces/reconstruct-trace.ts` reads `body.messages` for the transcript, reads tool
*definition objects* out of `body.tools` (which is now an array of strings), and derives the system
prompt from `messages[role === 'system']` (it is now `body.system`). So the review page renders
entries with empty content. **Its e2e test passes because it asserts that a `user-message` type chip
is visible — a label that renders whether or not the entry has any content.** Vacuous for its
purpose, and the third time on this branch that an assertion survived the thing it was guarding.

What a trace uniquely holds, once content is excluded: per-MODEL-CALL provider and resolved model,
usage, cost, timing, and the moderation verdict. A turn is N model calls, and the conversation keeps
one message for the whole turn, so that granularity has no other home. Everything else — who said
what, the tool calls and their results — is the conversation.

**Recommendation: yes, remove trace storage as a content store**, as the question proposes:

1. Admin review becomes a read of the conversation, authorized by the consent flag. Move
   `traceConsent` from the run to the **conversation**, where it belongs — consent is about the
   thread, not about each turn, and it is currently copied onto every run.
2. Keep per-call telemetry only where it has no other home: fold per-step usage/cost/model onto the
   run (it already carries `steps` and `credits`), and keep the moderation verdict with the
   moderation event that already exists.

That deletes a collection, five indexes, a TTL, a router, the whole reconstruction layer and the
duplicate consent concept. It also dissolves the cosmetic regression noted in §9's commit — the
stored-conversation list shows an id instead of a preview precisely because it reads trace bodies
rather than conversations.

### 10.4 The storage shape is right; the write pattern is not

One document per message, not one per conversation, and that is the correct call: conversation
length is unbounded while a document is capped at 16MB, an append is a single insert, and the read
path is a range scan on the unique `(conversationId, seq)`. The index set is well chosen —
`version` for the incremental cursor, `seq` unique so a duplicate is a write error rather than a
silently reordered conversation.

The cost is in the streaming writes. `persistPartial` rewrites **the whole parts array of the
in-progress message every 250ms**, and `sendMessageFrame` pushes that same whole array over the
socket at the same rate — on top of a `delta` frame per token. Both are O(n²) bytes in the length of
an answer. The socket probe taken during §9 shows it plainly: for the five characters of "world"
there is a delta per character *and* a full `message` frame carrying the parts so far.

**Recommendation:** persist and push the structure on structural change — a step boundary, a tool
call, a tool result, the end — and let `delta` carry the text it is already carrying. The frames
exist so the client can render tool calls, which change a handful of times per turn, not four times
a second. An append-only `$push` on parts is the stronger version of the same fix.

### 10.5 Memory: the whole post-compaction window, two to three times over

`loadHistory` does `.toArray()` on every message since the compaction recap with
`projection: { _id: 0 }` — every field — then `storedTurnsToModelMessages` builds a second array of
`ModelMessage`, then `withHostContext` copies the array again to decorate one message. Nothing is
streamed, and nothing can be: `streamText` takes an array.

It is **bounded**, which is the important part: compaction caps the window at ~70% of the model's
context, so this is not a leak and does not grow with conversation age. Call it ~2–3× the context
window per concurrently live turn.

**Recommendation:** project `{ role: 1, parts: 1, seq: 1 }`. The model never sees `author`,
`createdAt`, `version`, `pending` or `id`, and they are loaded for every message of every turn.
Cheap, and it also narrows what a bug can leak into a prompt.

### 10.6 Module separation: three splits that no longer pay, one that does

- **`executor.ts` is 1218 lines** and now owns the quota gate, the moderation gate, the account-cap
  check, the trace recorder, compaction and the model loop. This is the split worth making, and the
  seam is now obvious: the three pre-loop gates are one concern, and `runTurn` reads as a list of
  them.
- ~~**`use-agent-session.ts` + `use-session-chat.ts`** are two layers with one consumer and could be
  merged.~~ **WRONG — retracted while acting on it.** They are two layers with two COMPILATION
  CONTEXTS: the socket client imports nothing through the `~` alias because the root tsc compiles it
  (a unit test imports `toDescriptors`), while the adapter has eight `~` imports and cannot be
  reached from a unit test at all. Merging them would take the socket protocol out of the unit
  suite. The reason is now recorded in the file so it is not proposed again.
- **`api/src/conversations/`** exists because the `shared/` contract guard evicted four modules when the
  browser loop was deleted. It is a holding pen rather than a boundary; the two small ones
  (`agent-subagent-output.ts` at 54 lines, `compaction-prompt.ts` at 45) belong beside their only
  caller.
- **`shared/` is clean.** All nine modules have a consumer on both sides of the socket, which is what
  the guard is for. No action.

### 10.7 Testability: a real gain, mostly unrealized

141 e2e tests in 39 files take 8.5 minutes, against 256 api and 973 unit. Of the 26 e2e failures the
swap left, roughly **20 test behaviour that is now server-side and reachable without a browser**:

| Group | n | Where it belongs now |
|---|---|---|
| Host events | 9 | The store and `withHostContext` are pure (unit); the frames are api-testable through `tests/support/ws.ts` |
| Sub-agents | 5 | Orchestration is `agent-session/sub-agents.ts` — api, with the panels left to one e2e |
| Moderation | 4 | Already covered by the 19 new api tests; e2e needs only "the refusal renders" |
| Compaction | 2 | Server-side — api |
| Hang / empty completion | 2 | Server-side watchdog and fallback — api |

What genuinely still needs a browser: a page registering WebMCP tools, frame aggregation across
iframes, and rendering. That is a handful of tests, not thirty.

**Recommendation:** rewrite that group as api tests against the socket rather than repairing them as
e2e. It fixes the outstanding 26 and shrinks the slowest suite at the same time — the clearest
practical dividend of the move, and the one §7 did not think to count.

### 10.8 Fixed during this review

The system prompt stated the permission ceiling **twice in consecutive paragraphs**: once from the
standard agent's persona and once from `buildSystemPrompt`'s non-NHI clause, added earlier the same
day. Removed from the persona, where it was a string every future persona would have had to remember
to include, and kept where it is derived from the identity. A unit test now asserts its ABSENCE from
every persona, because the duplication is what went wrong rather than the sentence.
