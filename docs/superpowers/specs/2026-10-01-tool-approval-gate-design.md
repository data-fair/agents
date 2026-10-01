# The tool approval gate

**Status:** proposed, awaiting approval to implement
**Date:** 2026-10-01
**Implements:** the P1 row of `2026-09-22-autonomous-agents-p0-design.md` — "approval gate enabled".
P0 promised "plumbing present, gate open, so enabling it in P1 is configuration rather than surgery".
The plumbing was **not** present: annotations are recorded (since 2026-09-30) but nothing reads them, and
no policy exists. This builds it.

## The shape of the problem

An autonomous agent's tools can write. P0's defences are scope, observability and reversibility — not
prevention — and it says so plainly: *"with writes enabled, a prompt injection in tool output can cause a
write the NHI is permitted to make"*. The gate is the first preventive control: a class of call stops and
waits for a person.

The hard part is not the policy. It is that **a server-side turn cannot wait for a human.**

## Decision 1: a suspended turn is a FINISHED run, not a waiting one

A gated call ends the run with a new status `awaiting-approval`. The decision arrives later over HTTP and
starts a **new** run, which replays the stored conversation and continues.

The alternative — hold the turn open, poll for a decision — was rejected for the same reasons the
strategy-reversal analysis rejected distributed suspension: it holds the conversation lock, burns the
run deadline, dies on restart, and turns a human's lunch break into an outage. The suspension-as-new-run
shape costs nothing extra here because the architecture already provides every piece:

- the stored conversation is **revivable** by construction, so resuming is just `loadHistory`;
- nothing is held — no lock, no process, no in-memory controller — so a restart is survivable and an
  approval can sit for days (the chosen behaviour: no expiry);
- both executor invariants survive unchanged — the run reaches a terminal status, and leaves exactly one
  assistant message, which says what it is waiting for.

### Verified, not assumed

Probed against the installed SDK before designing (`ai` 6.0.277):

| Observation | Consequence |
| --- | --- |
| A turn stopping on an approval emits a `tool-approval-request` part and finishes with `finishReason: 'other'` | detectable without guessing |
| `approval-requested` converts to **no model messages at all** | an undecided call is simply absent from the replayed history; the stored part is the only record of it |
| `approval-responded` + `approved: true` converts to assistant(`tool-call` + `tool-approval-request`) + tool(`tool-approval-response`) | this is what the resume replays |
| On that replay the **SDK executes the tool itself**, emitting `tool-result` before the first `start-step`, without the model re-emitting the call | the resume needs no prompting trick |
| `output-denied` converts to the approval-response **plus** a `tool-result` carrying `error-text` = the reason | a denial is self-contained: the model sees it and why |

## Decision 2: policy is keyed on annotation class, per agent

Three classes, derived from the MCP annotations already recorded on every call:

| Class | Rule |
| --- | --- |
| `destructive` | `destructiveHint === true` — wins over a contradictory `readOnlyHint` |
| `readOnly` | `readOnlyHint === true` |
| `write` | everything else, **including a tool with no annotations at all** |

An unannotated tool is a `write`. Most hand-written MCP servers emit no annotations, so treating them as
read-only would leave the common case ungated; giving them a fourth `unknown` knob would add a policy
nobody can describe a use for. `readOnly` is a configurable class too, uniformly — a read-only tool can
still return a lot of somebody's data, and three uniform knobs are easier to explain than two plus an
exception.

Policy lives on the agent document, org-admin authored like `mcpServers`:

```
approvals?: { readOnly?: Policy, write?: Policy, destructive?: Policy }
Policy = 'allow' | 'approve' | 'deny'
```

**Every default is `allow`**, honouring P0's recorded decision: this change ships the mechanism, not a
behaviour change. An agent with no `approvals` object behaves exactly as it does today, which is also
what makes the migration a non-event. (A safer out-of-box default — `destructive: 'approve'` — is a
one-line change if wanted; it is deliberately not taken here because the recorded decision says the gate
ships open.)

## Decision 3: `deny` removes the tool, it does not refuse the call

A denied class is **filtered out of the run's tool set**, so the model never sees those tools and never
spends a step discovering it cannot use them. The tool set is already frozen at run start, so this is one
filter in one place rather than a new refusal path and a new part state.

This is a real capability that `toolFilter` cannot express: `toolFilter` is per-name, `deny` is per-class
— "never let this agent call anything destructive", which keeps holding as the catalog grows.

## How a gated turn runs

1. **Run start.** Each tool's class is resolved against the policy. `deny` → dropped. `approve` →
   `needsApproval: true`. `allow` → unchanged.
2. **The model calls a gated tool.** The SDK emits `tool-approval-request` and does not execute.
3. **The executor records** the part as `approval-requested` with `approval: { id, signature }`, appends
   a notice to the assistant message naming the tool and what it was asked to do, and finishes the run
   `awaiting-approval` / stop reason `awaiting-approval`.
4. **Someone decides** (anyone who can instruct — the same grant as starting a turn, aborting one and
   erasing a thread; an instructor already borrows the agent's permissions, so they could have asked for
   the write directly):
   `POST /api/autonomous-agent-conversations/:type/:id/:conversationId/approvals/:approvalId`
   with `{ approved, reason? }`.
   - approved → the part becomes `approval-responded` (`approved: true`), signature preserved;
   - denied → the part becomes `output-denied` with the reason;
   - either way the conversation `version` is bumped so watchers see it, and a new run starts.
5. **The resume run** replays the history. For an approval, the SDK executes the call and hands the
   result back to the model, which continues the turn. For a denial, the model is told and reacts.

### The double-execution hazard, and the one new piece of code

On resume the result arrives for a call whose part lives in the **previous** stored message.
`settleToolPart` searches the current turn's parts, so it would find nothing and drop the update — leaving
the part `approval-responded` with no result. The next replay would then see an approved request without
a result and **execute the tool again**.

So the resume run settles that result onto the original message's part, moving it
`approval-responded` → `output-available` (or `output-error`). One part per call, carrying its whole
life, which is the message model's own principle; message N is mutated once, which this codebase already
does for partial persistence and stop notices.

This is the same at-least-once hazard the recovery rule exists to prevent, arriving by a different route,
and it is asserted against MCP-fixture ground truth rather than by reading the record.

### Compaction must not swallow an undecided approval

`approval-requested` converts to nothing, so a pending call contributes no model messages — and if a
compaction's recap came to cover the message holding it, the approved request would vanish from every
future replay and the tool would silently never run.

The compaction cut is therefore clamped to before the earliest message holding an undecided approval.
One guard, in `compactHistory`, where the cut is already aligned to a stored-message boundary.

## Security notes

- **`experimental_toolApprovalSecret` is set.** The SDK HMAC-signs each approval request at issuance and
  verifies it on replay. In this architecture the decision is written by our own route, so the primary
  defence is authorization — but the signature makes a stored `approved: true` that did **not** come
  through that route fail at replay, which is worth having for a value that authorises a write.
- **A policy denial is OUR text, not the tool's**, so it does not get the provenance envelope — the
  envelope's whole job is to attribute content to a server, and a refusal came from this service.
- **Approval does not widen reach.** The NHI's own permissions still bound every call; the gate can only
  ever subtract.
- Already true and unchanged: the tool set is frozen at run start, so nothing a tool returns can
  introduce a gated-but-unapproved call.

## Scope

- `api/types/autonomous-agent/schema.js` — `approvals`, three optional enums.
- `shared/tool-approval.ts` — `classifyTool(annotations)` and `resolvePolicy(class, approvals)`, pure.
  In `shared/` only if the browser loop comes to need it; **otherwise `api/src/autonomous-agent-runtime/
  operations.ts`**, per the contract that `shared/` holds what both platforms consume.
- `api/src/mcp-servers/client.ts` — the tool set honours `deny` and sets `needsApproval`.
- `api/src/autonomous-agent-runtime/executor.ts` — record the request, finish `awaiting-approval`,
  settle a resumed result onto the original part, clamp the compaction cut.
- `api/src/autonomous-agent-runtime/operations.ts` — the new status and stop reason, and its message.
- `api/src/autonomous-agent-runtime/router.ts` — the approvals route.
- `ui/src/components/AutonomousAgentRunStatus.vue` — the pending-approval panel: tool, server,
  arguments, Approve / Deny.
- `docs/architecture/autonomous-agents.md` — a section; the doc exists now.

## Testing

Ground truth from the MCP fixture (`invokedTools()`) wherever "did it run?" is the question — the model's
behaviour cannot answer it, which is the lesson the tool-failure conflation taught.

- classification: destructive, read-only, write, unannotated, and `readOnlyHint` + `destructiveHint`
  together;
- `allow` everywhere (the default) behaves exactly as today — the migration non-event, asserted;
- `deny` drops the tool from the advertised set and the fixture never executes it;
- `approve` suspends: run `awaiting-approval`, part `approval-requested`, **fixture shows no
  invocation**, and the assistant message says what it is waiting for;
- approving resumes and the fixture shows **exactly one** invocation; the part ends `output-available`
  on its original message;
- a second POST for the same approval id is refused and the fixture still shows one invocation;
- a further turn after a completed approval does not re-execute it — the double-execution guard,
  asserted on fixture ground truth;
- denying: `output-denied`, no invocation, and the model is told the reason;
- an unlisted org member is refused 403; a listed instructor is allowed;
- compaction never advances `coversUpToSeq` past a message with an undecided approval;
- a `deny`d destructive tool and an `approve`d write tool on the same agent, so the classes are shown to
  resolve independently.

## Risks

- **A thread can sit awaiting a decision for ever.** Chosen deliberately: the run is already terminal, so
  nothing is held, and an unanswered approval is a visible fact rather than a leak. If it becomes a
  nuisance, expiry-as-denial is additive.
- **The resume mutates an earlier message.** Bounded to one part's state, and the alternative (moving the
  part into the new message) loses the fact that the call was made in the earlier turn.
- **Approval fatigue.** A policy of `approve` on `write` gates unannotated tools too, which for a server
  that emits no annotations is every tool. That is the honest consequence of the classification choice,
  and the reason the defaults ship open rather than on.
