# Parallel sub-agents — concurrency-safe rendering (gap 1)

> Design spec for the first work item of `feat-better-subagents`. Closes gap 1 of
> `docs/subagent-orchestration-review.md`.

## Problem

The review (and `docs/architecture/sub-agents.md:26,130`) states sub-agents run
**sequentially** — "even if the main agent requests multiple sub-agent calls in one
step, the orchestrator runs them one after another." Parallel workers are the headline
reason to do multi-agent orchestration (Anthropic reported up to ~90% wall-clock
reduction on decomposable work; the analyst+writer split is exactly that case).

**Finding that reframes the work.** The claim of orchestrator-level serialization is
incorrect for the AI SDK in use (`ai@6.0.116`). In the streaming path
(`node_modules/ai/dist/index.mjs:6213`), each tool call is dispatched via
`executeToolCall(...).then().catch().finally()` — **without `await`** — into a shared
`toolResultsStream`. Multiple tool calls in one assistant step are already fired
**concurrently**. There is no serialization to remove.

The real blocker is **shared mutable UI state that concurrent workers clobber**:

- `mainScope.current.subAgentMessages` is a *single* `ChatMessage[]`. Two concurrent
  sub-agents attached to the same parent assistant message both do
  `parent.subAgentMessages = [...subScope.messages]` → they overwrite each other.
- The render loop (`AgentChatMessages.vue:101`) already iterates **once per `subagent_`
  invocation**, but renders that single shared `message.subAgentMessages` (line 121/124)
  and `message.subAgentTurn` (line 115) inside **every** panel. So two calls show the
  *same* transcript in both panels.
- The global `activity` ref is single-valued; concurrent workers stomp each other's
  live phase line.
- `subAgentHistory[name]` / `subAgentCallCount[name]` are safe for *distinct* names
  (synchronous prelude, no `await` between read and increment), but two concurrent
  calls to the *same* sub-agent race on history.

So gap 1 is a **data-model + rendering change** (per-`toolCallId` panel slots), not a
concurrency-dispatch change.

## Goal

Two (or more) sub-agent calls emitted in a single assistant step render in their own
panels, each streaming its own transcript and live phase, with correct multi-turn
history — without clobbering each other.

## Non-goals (deferred)

- Richer delegation task contract (gaps 2 & 3).
- Bounding/compacting sub-agent history (gap 4).
- Changing `toModelOutput`'s text-only return (gap 5).

## Design

### 1. Data model

In `use-agent-chat.ts`, replace on `ChatMessage`:

```ts
subAgentMessages?: ChatMessage[]
subAgentTurn?: number
```

with a per-call map keyed by the delegating tool-call id:

```ts
subAgentPanels?: Record<string /* toolCallId */, {
  messages: ChatMessage[]
  turn: number
}>
```

The moderation flag stays on the *yielded* refusal message (not the slot): for a
yield-only async generator the SDK sets `toModelOutput`'s `output` to the **last
yielded value** (`@ai-sdk/provider-utils` `executeTool`), so `toModelOutput` reads
the refusal — with its `moderationBlocked` — straight off the yield, unchanged.

Mirror the shape in `auto-scroll.ts` (`ScrollMessage`), whose growth signal must
iterate every panel's `messages`, not the single old array.

One slot per delegated call ⇒ concurrent workers write to disjoint keys ⇒ no clobber.

### 2. Execute closure (`use-agent-chat.ts` ~579-690)

`liveParent()` and `parentToolCallId` already exist. At each `yield`, write the slot:

```ts
const parent = liveParent()
if (parent) {
  (parent.subAgentPanels ??= {})[parentToolCallId] = {
    messages: [...subScope.messages],
    turn: callIndex,
  }
}
```

Reassign the slot object with a fresh `messages` array (keeps the existing Vue-reactive
new-array trick). The refusal branch (content-filter) and the error branch append into
the same slot; the refusal keeps `moderationBlocked` on its own yielded message so
`toModelOutput` still sees it.

### 3. Per-panel activity

Add a reactive map exposed by the composable:

```ts
const subAgentActivities = ref<Record<string /* toolCallId */, ChatActivity>>({})
```

Move the sub-agent phase writes — `subScope.setActivity` (currently lines ~613-617) and
the `starting` enter-gap (line ~622) — off the global `activity` ref into
`subAgentActivities.value[parentToolCallId] = { kind: 'subagent', ... }`. Reassign the
object (`{ ...map, [id]: ... }`) so Vue re-renders. Delete the entry when the generator
finishes (success, refusal, error, or abort) so the panel's spinner line clears.

The global `activity` ref then carries **only** main-agent phases
(`compacting` / `thinking` / `analyzing`, including the post-sub-agent
`analyzing { subAgent }` bottom line). The `'subagent'` kind no longer flows through the
global ref.

`AgentChatMessages.vue`: `subAgentActivityLabel` keys on `invocation.toolCallId` (reads
`subAgentActivities[invocation.toolCallId]`) instead of matching a single global
`activity.name` against the tool name.

### 4. `toModelOutput`

Unchanged mechanism — the SDK passes the generator's last `output` value. It sources the
moderation flag from the per-call slot's last message instead of the shared array. No
behavioral change to what the main agent sees.

### 5. Same-name concurrency guard

Distinct sub-agents (analyst + writer) are fully safe and run in parallel. Two concurrent
calls to the **same** sub-agent share `subAgentHistory[name]` and would race (both read
empty prior history, last write wins, one turn lost). Since a sub-agent is one stateful
conversation, **serialize same-name calls** via a `Map<string, Promise<void>>` chain: a
new call to `name` awaits the previous call's completion before reading/writing its
history. Full parallelism across different names; ordered turns within one name. The
`subAgentCallCount` increment stays in the synchronous prelude (already race-free for the
index).

### 6. Docs

- Fix `docs/architecture/sub-agents.md:26,130`: the SDK dispatches tool calls
  concurrently (unawaited `executeToolCall`); sub-agents of **different** names run in
  parallel, same-name calls are serialized. Document the per-`toolCallId` panel model.
- Update the data-structures section (`subAgentPanels`).

## Testing

- **Unit** (`agent-stream-parts` / a new helper): two interleaved sub-agent streams keyed
  by different `toolCallId`s land in separate slots; interleaved writes don't cross.
- **Unit**: same-name serialization — two queued calls to one name produce ordered,
  non-lost history.
- **E2E** (mock provider): a prompt that makes the lead emit two `subagent_*` calls in one
  step renders two panels, each with its own transcript; both reach "done". Assert both
  `subagent-activity` lines can be present concurrently (per-panel), and the transcripts
  differ. Reuse the existing sub-agent e2e harness/mock conventions.
- Confirm empirically (during implementation) that the two workers' gateway calls overlap
  in time (the finding) — e.g. via trace timestamps or mock timing — so the design rests on
  observed concurrency, not just a code reading.

## Risk / blast radius

Contained to: `use-agent-chat.ts`, `agent-stream-parts.ts` (type only, if shared),
`AgentChatMessages.vue`, `auto-scroll.ts`, `_dev/chat.vue` (reads `subAgentMessages`),
and the two doc files. No server/gateway changes. The robustness layer
(error/abort/watchdog/moderation/compaction) is untouched.
