# One agent loop, two platforms

**Status:** proposed, awaiting approval to implement
**Date:** 2026-09-30
**Decision recorded:** the in-browser loop is **not** moved to the server. Loop *location* stays
per-surface; the loop *itself* becomes one implementation behind a platform boundary.

## Why this, and not the reversal

Moving every loop server-side was considered and rejected. The duplication that prompted the question is
real — every bug fixed on 2026-09-30 existed *because* there are two loops: an idle watchdog present in
one and absent in the other, compaction unbilled because the server bypasses the gateway that does the
billing, and a message model that had diverged three ways. But the duplication is not caused by loop
location. It is caused by the second loop having been **re-implemented rather than extracted**:
`tool-result.ts` byte-identical in two places, the identity subject string written twice, stream
consumption written twice, and half of `shared/` unused by the API.

The reversal would have traded that bounded cost for structural ones: contextual tools become RPC to an
ephemeral user-controlled endpoint (inverting the trust direction the moderation fail-open argument rests
on), `wait_for_user_action` becomes a distributed suspension holding a conversation lock, token streaming
regresses into the delta protocol this branch deliberately deleted, anonymous conversations become server
state, and per-user server compute replaces free client orchestration.

Kept from that analysis: **if a personal conversation ever becomes a server-side artifact** — durable,
multi-device, resumable — the reversal is right. This design is what makes that a change of one adapter
rather than a rewrite. It is also cheaper than it looked: the gateway has no consumers outside our own
UI, so the reversal would retire it rather than having to maintain it as a compatibility surface.

## Principle

One engine. Everything that differs between the browser and the server is a **port** the engine is given,
never a branch inside it. A port exists only where two real implementations exist **today** — no ports for
hypothetical platforms, because a port with one implementation is indirection with a cost and no benefit.

## The ports

Each of these has two genuinely different implementations right now:

| Port | Browser | Server |
| --- | --- | --- |
| **History** | in-memory array, rebuilt per turn | stored parts, `seq`/`version`, persisted recap |
| **Tools** | WebMCP aggregation, in-page, user's own permissions | operator MCP catalog, remote, as the agent's NHI |
| **Identity** | the user's own session, implicit | the agent's NHI, exchanged and cached |
| **Model access** | the gateway (OpenAI-compatible HTTP) | provider SDK directly |
| **Spend** | gateway-owned, per request | executor-owned, per step |
| **Output** | reactive state, token by token | throttled persist + version notification |

Three notes on that table.

**The tool port must not be unified.** WebMCP and the MCP catalog are different tool universes, not two
implementations of one — there is no `api/src/tools/`, so the server-side machinery is entirely new.

**The gateway has no consumers outside our own UI**, so it carries no compatibility burden and can be
changed or removed freely. But it is **not merely a model proxy — it is the trust boundary**, and that
is why the spend and moderation ports are required rather than incidental. Quotas, usage recording and
moderation must be enforced server-side; for a browser-resident loop the model call is the only place the
request crosses onto the server, so that is necessarily where enforcement sits. The consequence: the
gateway cannot be deleted while any loop runs in the browser, however few consumers it has.

**Shared guard code does not mean equal protection.** Verified: the browser evaluates
`stopWhen: [stepCountIs(STEP_LIMIT), repeatedCallGuard()]` *in the browser*. Those guards are therefore
**advisory** there — a patched bundle or a devtools session bypasses them — and the real bound is the
gateway's per-request `enforceQuotas`. The same code in the executor is **enforcing**, because nothing
between it and the provider is user-controlled. The engine must not let that distinction blur: a reader
seeing one guard module should not conclude both platforms are equally protected, and any future guard
that matters for cost or abuse has to have a server-side counterpart when the loop is in the browser.

## What becomes one implementation

- **The turn loop**: assemble messages, apply the context policy, call the model with tools and guards,
  consume the stream into parts, decide the stop reason, finalise.
- **Guards**: `STEP_LIMIT`, the repeated-call guard, the per-run budget, and the idle watchdog — already
  shared as constants, not yet as application.
- **Context policy**: the tiered clear → measure → compact decision
  (`2026-09-30-tiered-context-management-design.md`, which already requires this).
- **Message model**: `UIMessage` parts
  (`2026-09-30-adopt-the-ai-sdk-message-model-design.md`).
- **Stop-reason semantics** and the two invariants the server already states — a run always reaches a
  terminal status, and always leaves exactly one assistant message. The browser has no equivalent written
  down; it should inherit them.
- **Moderation**, which today applies to one loop only. Moving it into the engine closes that asymmetry
  rather than leaving it as a gateway side effect.

## What deliberately stays separate

This is the guard against over-abstraction, and it is as much the point as the unification. The
architecture review was explicit that forcing the two compaction *orchestrations* into one shape would
have been worse; that judgement stands.

- **Compaction inputs differ, correctly.** The server has no prior response object so it counts the whole
  history as unmeasured and errs early; the browser uses the provider-reported previous-turn count. That
  becomes a **parameter** to the shared decision, not a second implementation — divergence expressed as
  data.
- **Delivery granularity differs.** The server stores one message per turn (a schema contract); the
  browser opens a new assistant bubble per step. The reconciling mechanism is `StepStartUIPart`: step
  boundaries are representable *inside* one message, so splitting becomes a rendering choice at the sink
  rather than a different stream consumer. This is what made the two consumers irreconcilable before.
- **Sub-agents** exist only in the browser. The engine supports them as an optional capability; it does
  not get a port for them.
- **Recovery, locking and the run document** are server-only concepts and stay in the executor.

## `shared/` gets a contract

Measured today: of ten modules, **five have both an API and a UI consumer**
(`agent-loop-guards`, `compaction-policy`, `compaction-prompt`, `autonomous-agent-channel`,
`autonomous-agent-identity`) and **five have only the UI** (`agent-stream-parts`,
`agent-subagent-output`, `chat-message`, `tool-exploration`, `autonomous-agent-chat-message`). So
`shared/` presently means "where things go" for half its contents, which is why it stopped signalling
anything — and it is what produced the third hand-written copy of the message-parts union, justified by
avoiding an alias the module's only consumers do not need.

The rule: **`shared/` holds what both platforms consume.** UI-only modules move back under `ui/src`.
That is a precondition for the engine, not a tidy-up, because the engine's contract is "everything in
`shared/` is platform-neutral by construction".

**Implemented.** The five UI-only modules moved to `ui/src/utils/`, and
`tests/features/shared-contract/shared-contract.unit.spec.ts` now enforces the rule in both
directions — every shared module must have an api consumer AND a ui consumer — plus that no shared
module imports a platform-only alias (`#…`, `~/…`, or a reach into `api/`/`ui/`). `shared/` is now
six modules, all genuinely shared: the five above plus `tool-arguments`, which the message-model
migration added when the trace and the run-status strip came to need one bounded rendering of a
call's arguments.

## Dependencies

This design is downstream of both queued specs and should not start before them:

- the **message model** migration makes the two stream consumers the same operation ("append parts"),
  which is what makes one engine possible at all;
- the **context policy** already requires one shared decision with both loops routed through it, which is
  the engine's first real seam.

Doing them in that order means the engine is extracted from two loops that already agree on data, rather
than trying to unify data and control flow at once.

## Preventing drift

The pattern is established and has already caught real divergence this week: assert the **call**, not the
import. A drift test that only checks a module is imported passes while the constant sits unused — which
is exactly how the idle watchdog came to exist in one loop only. Each shared decision gets a test pinning
that both call sites route through it.

## What it buys beyond deduplication

- **The loop becomes unit-testable.** Today it is reachable only through HTTP with a mock model, which is
  why a tool failure has never been exercised at any level. With ports, a fake tool provider can fail, a
  fake history can be malformed, and a fake model can return nothing — none of which needs a stack.
- **It closes the gap toward the SDK's own abstraction.** The browser already uses `ToolLoopAgent`, though
  only for sub-agents; its main loop and the executor both call `streamText` directly. So the engine is
  not a novel shape — it is the shape the library offers, which one surface has already adopted in part.
- **`executor.ts` splits.** At ~890 lines it holds the loop, history, compaction, recovery and tracing;
  extracting the engine forces the three seams the simplicity review named.
- **The reversal stays available.** If personal conversations become server-side artifacts, that is a new
  History and Output adapter, not a new loop.

## Risks

- **Over-abstraction is the main one.** Mitigated by the rule that a port needs two implementations today,
  and by the explicit list of what stays separate. A port count that grows without a second implementation
  is the signal this went wrong.
- **A god-engine.** If the engine ends up with flags selecting behaviour rather than ports supplying it,
  nothing has been gained. The test: every `if` about *which platform* is a port that was missed.
- **Churn on code that has just been rewritten twice.** Real, and the reason for the dependency order:
  the engine should be the last of the three changes, not the first.
