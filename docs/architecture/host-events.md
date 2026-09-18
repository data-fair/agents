# Host events

The chat only learns what it asks for, and only when a message arrives — unless the host
tells it. This document covers how a host page reports what happened and what is true
now, how the chat delivers that to the model without ever starting a turn, and the one
tool that lets the agent hand the next step to the user and get it back.

## The model

The host reports **events**, one primitive. An event is *keyed* when it describes
something with a current value (the location, a wizard's state): the chat retains only
the last event per key and coalesces pending ones per key. An unkeyed event is a
transition (creation done, dialog dismissed). Navigation is emitted once, keyed
`location`: retention holds where the user is, the delivery is the transition.

Rule of thumb for a page author: **emit an event when the assistant should be told even
if it was not looking, or even if the state afterwards looks the same; give it a key when
a later occurrence supersedes it.** Typing a title is state (keyed `wizard`); pressing
Create is a transition (`item-created`); leaving the page is both (`navigated`, keyed
`location`).

Retention is consulted only when a conversation *activates* — first turn, after reset,
after compaction — the moments the model has no history to integrate from. After that
the model receives events only, each exactly once **per model**, persisted, in
chronological order. Nothing is re-sent, nothing is ephemeral, and the host never starts
a turn. "Per model" matters when a sub-agent is involved: a sub-agent's own tool calls
get their own copy of pending events (appended to that tool's result, inside the
sub-agent's private history) without draining the shared buffer, so the same events also
reach the lead — once — on its own next turn. See point 2 under Consuming below.

```mermaid
flowchart LR
  Page["Page: emitAgentEvent / useAgentState"] -->|BroadcastChannel| Store[HostEventStore]
  Store -->|keyed| Retention["retention: last event per key<br/>+ ring of last 10 unkeyed"]
  Store -->|"push()"| Pending[pending buffer, coalesced per key]
  Pending -->|"a wait is outstanding"| Wait["wait_for_user_action resolves"]
  Pending -->|"caused by a tool call"| ToolResult["appended to that tool's result"]
  Pending -->|otherwise| NextTurn["drained into the next sendMessage"]
  Retention -->|"on activation only"| NextTurn
```

## Publishing (`@data-fair/lib-vue-agents`)

- `emitAgentEvent(name, detail?, { key? })` posts `{ type: 'agent-event', event }` on the
  tab BroadcastChannel (`getTabChannelId()`). `detail` is serialised (JSON for objects)
  and capped at 1000 chars (`EVENT_DETAIL_MAX_CHARS`), suffixed `… [truncated]` when it
  overflows. A raw string `detail` also has its real newlines escaped (mirroring what
  `JSON.stringify` already does for the object branch) and the wrapper sentinels
  (`</hidden-context>`, `</host-events>`, `</host-state>`) neutralised, before the cap —
  otherwise a host mirroring free user text (a wizard title, a description field) could
  break the line-oriented `<host-events>`/`<host-state>` block format or, worse, forge an
  early close of the `<hidden-context>` wrapper and have the rest reconstructed and
  rendered as the user's own message in the trace viewer.
- `useAgentState(key, source)` watches a ref/getter (`immediate: true, deep: true`) and
  emits a keyed event when the serialised value changes; on scope dispose it posts
  `agent-state-withdrawn`, which only removes the key from retention (the model is not
  told — if leaving mattered, emit `navigated`). It answers the chat's
  `agent-state-request` by re-emitting the last value, so a chat that loads after the page
  rebuilds retention.
- The three message shapes (`agent-event`, `agent-state-withdrawn`,
  `agent-state-request`) share one `channel` field but otherwise diverge, so the publisher
  side types the post function as `HostEventPost = (msg: DistributiveOmit<HostEventMessage,
  'channel'>) => void` — a hand-rolled distributive omit (`T extends any ? Omit<T, K> :
  never`), because a plain `Omit` over a union collapses it to the common `type` field
  first and loses `event`/`key` in the process. `createStateEmitter` takes this `post` as
  a parameter so the emit-on-change logic is unit-testable without a real
  `BroadcastChannel`.

## Consuming (`ui/src/composables/host-events.ts`, `use-host-events.ts`)

`HostEventStore` holds retention (a `Map` of last event per key, iteration order doubling
as first-seen key order for `snapshot()`, capped at `STATE_MAX_KEYS` distinct keys —
oldest dropped first; plus a ring of the last `RECENT_MAX` unkeyed events), the pending
buffer (undelivered, coalesced per key; unkeyed events additionally ringed at
`PENDING_MAX` — keyed ones already self-limit to one slot per key) and at most one
pending wait (`waitForEvent`/`isWaiting`). `push()` feeds a waiter if one is outstanding
instead of buffering — an event never both resolves a wait and sits in the pending
buffer. `clearPending()` drops the buffer *and* settles an outstanding wait as
`'aborted'` (retention is untouched: the pages are still there); `reset()` in
`use-agent-chat.ts` calls it after `abort()`, which has usually already resolved the wait
through the same abort signal, so this is the backstop for whichever one gets there
first. `cancelWait()` is the narrower, idempotent sibling used at the end of every turn
(`sendMessage`'s `finally`): it settles an outstanding wait as `'aborted'` without
touching the pending buffer or retention — a structural backstop for a waiter whose only
other exit is `options.abortSignal`, which the AI SDK types as optional.
`useHostEvents` feeds the store from the channel and, on creation, posts one
`agent-state-request` so pages that mounted earlier re-emit their keyed state; it also
shape-guards each raw `agent-event` payload at the channel boundary (a string `name`, a
finite `at` falling back to `Date.now()`, a non-string `key` dropped rather than
coerced) since a buggy host can post anything on a BroadcastChannel.
`use-agent-chat.ts` delivers:

1. **Pending wait** — the event is the result of `wait_for_user_action`.
2. **Caused by a host tool call** — after the settle barrier (see
   [MCP tool integration](./mcp-tools.md)) and one macrotask, pending events are appended to the
   tool's result as a `<host-events>` block: the event lands in history exactly where it
   happened (the Playwright "action returns the resulting page" shape). Sub-agent tools
   get the same wrapper (`withHostConsequences` in `use-agent-chat.ts`), but with one
   difference: the main agent's own tools **drain** the shared buffer (the main agent's
   history is the shared history the buffer is owed to), while a sub-agent's tools only
   **peek** it (`HostEventStore.peekPending`, non-destructive) — the sub-agent gets its
   own copy appended to its own (private) tool result, but the events stay pending in the
   shared buffer. Draining there would tell only the sub-agent: the lead never sees more
   than a one-shot text summary of the sub-agent's transcript (`toModelOutput`), and
   retention doesn't help either, since it's only consulted at activation. Leaving them
   pending means the lead's own next turn (or its own host tool call) delivers them
   normally — this is the intended shape of "exactly once per model", not a leak.
3. **Otherwise** — at the next `sendMessage`, pending events are drained into the
   `<hidden-context>` wrapper of that user turn (before any action-button context).
4. **Activation** — when `history` is empty (first turn, after reset) or
   [compaction](./compaction.md) ran, a `<host-state>` block (retained keys, then recent
   unkeyed events) is placed in that wrapper ahead of the events.

On an activation turn only, the events drained in step 4 are first filtered against that
same `<host-state>` snapshot: a keyed event whose key the snapshot already reports is
dropped, because otherwise the model would see the same fact twice in one turn — once as
retained state, once as a drained event (this is exactly what happens on mount, where
`useAgentState`'s `immediate: true` watcher both seeds retention and leaves a pending
event behind). Unkeyed events are never represented in the state list, so they are never
filtered — a transition like `item-created` still has to be told, activation or not. Off
activation there is no state block to duplicate against, so nothing is filtered and every
pending event is drained as usual. This asymmetry is deliberate, not an oversight: "only
on activation" and "only keyed" both have to hold, or the fix either stops working
(non-activation turns already had nothing to duplicate) or starts eating real transitions.

Both blocks say they are reported by the application, not written by the user; the
[moderation](./moderation.md) gate and trace reconstruction see them as ordinary hidden
context — the same `<hidden-context>` sentinel an action button's context rides in, so
nothing new has to be taught to either.

This has a sharp edge worth writing down: the moderation gate classifies the *whole*
user message, hidden context included, as the user's. So a wizard title the user typed —
mirrored through `useAgentState` into a `<host-events>`/`<host-state>` block riding in
that same turn — can get a turn blocked that the user did not author the offending
content on directly (they typed it into a form field, not the chat). And because the
drain (`takePending()`) happens before the gateway call returns its verdict, a blocked
turn loses those events with it — they are not re-buffered. This is correct per the
design (a direct API caller could otherwise forge the sentinels to dodge the gate by
claiming host-authorship — see [moderation](./moderation.md)), but nobody had written it
down, and it is the kind of thing a first integrator hits and has to puzzle out from
scratch.

Sub-agent tools crossing the settle barrier (see point 2 above) is a behaviour change
that reaches beyond host events: before, only the main agent's own tool calls paid the
`settleTools()` wait; now every sub-agent tool call does too, whether or not it caused
any host events. The cost is zero when no rebuild is in flight (the common case — it
resolves immediately), but a sub-agent tool call can now wait on a rebuild the main
agent's own tool calls provoked, where it previously would not have.

## `useAgentLocation`

Nothing here tracks navigation on its own: a host publishes what it knows, and
retention puts it in the activation snapshot. Every host with a router wants the
same thing, so `useAgentLocation(() => ({ path, name?, params?, query?,
breadcrumbs? }))` is that code once, publishing under the canonical `location`
key.

Its job beyond `useAgentState` is the absolute `url`, derived from `path` against
the current origin unless the host supplies its own (a path prefix, a different
public origin). A judged run had the assistant hand the person a relative path
that the chat rendered as inert plain text — not even a broken link — while the
absolute URL sat unused in the host-state block of the very same request.
`buildAgentLocation` is exported separately so a host can unit-test what it
publishes without a browser.

## `wait_for_user_action`

A chat-built-in tool (`WAIT_TOOL_NAME`) merged into the main tool set only — never into
sub-agents — present once the store has actually heard from the host (retained state or
a pending event — not merely "a host store exists"): the tool's own description invites
the model to call it, so advertising it to a page that has never published anything
would only ever end in a bounded, pointless dead turn. Re-checked on every tool-set
rebuild (turn start and every mid-turn rebuild), so a page that starts publishing
mid-conversation gains the tool at the next one. `{ expecting, timeoutSeconds? }`
(default 300s, max 600s). It resolves on **what the person did, not on the next event whatever it
is**. The store already separates two kinds of event: an unkeyed transition is something
that happened, keyed state is what is true now — and state refreshes for many reasons,
including the assistant's own action finishing late. A wait resolves on a transition, or on
a `location` change (the one keyed change that means the person left), whenever either
arrives — already pending when the tool is called, or later. Other keyed state never
resolves a wait: it stays pending and is delivered as a follower when the wait completes.
The chat still knows nothing about expectations — the model judges whether "user navigated
to /elsewhere" is what it waited for.

Why by kind and not by time: a judged run had `advance_to_confirmation` report
`{ready:false}` on its result and `{ready:true}` once a title-conflict API check came back.
That refresh landed before the wait was armed, the wait took it as the person acting, the
model retried, and the retry blocked for the full timeout. Had the API been a little slower
the refresh would have landed after the wait and resolved it just the same — so "only events
after the wait started" moves the failure around with network latency rather than removing
it. What distinguishes the refresh from a click is what it is, not when it came. Timeout and abort return plain text (`No user action within N seconds…`,
`Wait cancelled.`); a second call while pending returns `Already waiting for the user.`
(the store itself would reject a concurrent `waitForEvent`, but the tool checks
`isWaiting()` first so the model gets a sentence instead of a thrown error). **It blocks at most once per turn.** A second call in the same reply returns immediately
(`You already waited in this reply…`) instead of arming another timeout: the person cannot
act while the turn is still open, so a second block can only run out the clock. The
repeated-call [loop guard](./loop-guards.md) does not catch this, because the model rewords
`expecting` each time and the guard keys on arguments. Two judged runs paid for its
absence — one where a keyed state re-emission caused by the assistant's own tool call
settled the wait instantly and it re-issued the identical call, one where three waits with
reworded `expecting` strings cost six minutes and produced two "take your time" bubbles.
**A wait that timed out does not block again until the host reports something.**
The per-turn cap cannot reach this: each new turn hands out a fresh allowance, so an
assistant that waits, times out and waits again next turn blocks for the full timeout
every time. A judged data-fair run spent 480s of a 567s run in four such timeouts,
writing a new "I'm still waiting" line after each one — while the timeout result was
already telling it to end its reply and let the user act. The store counts events
(`eventSeq`); while that count has not moved since the timeout, the person has not acted
and blocking again can only run out another clock, so the tool returns immediately
instead. It counts by the same rule `resolvesWait` uses, and for the same reason: a
refresh that clears the guard re-arms a full timeout on someone who is still away, and
whether that refresh lands just before or just after the timeout is a matter of network
latency. Only something the person did clears it.

Only a wait that genuinely BLOCKED spends the allowance. One answered straight from the
pending buffer never waited for the user at all — routinely a keyed state re-emission the
assistant's own tool call produced — and counting it refused the follow-up: a judged run
had the decisive wait for a Create click eaten by a `wizard ready:true` transition, the
real wait refused, and the person told three times to press a button the assistant had no
way to observe. `use-agent-chat.ts` supplies the turn identity; a host that wires no
`turnId` keeps the old unbounded behaviour. Key withdrawal never resolves a wait (a `v-if` toggling a panel
must not cancel one). While pending the chat shows a "Waiting for: …" line and chip and
the embedded host receives `agent-status: waiting-user`. Once it settles the chip reads
"Waited for: …": it stays in the transcript as a record of the step, and a judged run
watched a person read a resolved present-tense chip as live page state, conclude the
assistant had lied about creating their list, and spend four turns hunting a button that
no longer existed.

It is chat-built-in rather than a page tool because a page-side pending call dies with
the page on the navigation that follows Create — the exact moment that matters.

A pending wait also suspends the chat's own idle watchdog. `use-agent-chat.ts` arms a
`STREAM_IDLE_TIMEOUT_MS` (90s) timer on every stream part to catch a provider that holds
the socket open while emitting nothing; a declared wait emits no stream parts by design
and has its own default timeout of `WAIT_DEFAULT_SECONDS` (300s, `WAIT_MAX_SECONDS` 600
max), so before this was fixed the watchdog killed every realistic wait — a real run made
four gateway requests and then the turn simply died, the person's click never seen. The
fix suspends the watchdog rather than capping the wait: a declared wait is an intentional,
bounded pause that already has its own timeout and the user's own Stop button, and it
exists precisely to outlast a human deciding, so capping it under 90 seconds would also
make the documented 600-second maximum meaningless. Clearing the pending timer in
`onWaiting` was not enough by itself — `armWatchdog()` is called unconditionally for every
stream part, including the `finish-step` of the very step that announced the wait, which
arrives after the tool's `execute()` has already started — so it was re-arming the
watchdog underneath the wait it had just suspended. What actually holds is an independent
`waitSuspended` flag that `armWatchdog()` consults and short-circuits on; `onDone` clears
it and re-arms the watchdog, whichever way the wait ends. The same race threatened the UI
label: that same trailing `finish-step` also drives `setActivity`, which would otherwise
reset the chat's activity from `{ kind: 'waiting' }` back to `analyzing` mid-wait. A sticky
guard at the top of `setActivity` — once the current activity is `'waiting'`, only the
wait's own `onDone` may clear it — keeps the "Waiting for: …" line and chip up for the
whole pause.

## Cost

Context costs tokens, not turns. Every delivery here is a persisted message that becomes
cached prefix on later requests; nothing is re-sent. The only turn the host ever resumes
is a wait the agent itself declared, at most one continuation per wait. This replaces
the `get_current_location`-every-turn pattern, which spent a whole model request per
look.

## Dev page and tests

`ui/src/pages/_dev/chat-workflow.vue` is the data-fair creation wizard in miniature: it
publishes keyed `location` itself and embeds `WorkflowWizard.vue` (keyed `wizard`, the
`select_type`/`set_title`/`advance` page tools) and, once created, `WorkflowDetail.vue`
(keyed `detail`); the wizard emits unkeyed `item-created` and a "Leave page" button is the
departure a pending wait must survive. Mock seams (`api/src/models/mock-model.ts`):
`where am i`, `what happened`, `select note`, `wait for me`, `wait briefly`. Tests:
`tests/features/host-events/` (unit specs for the store and the state emitter, plus a
twelve-case e2e spec covering activation (twice — once for the retained-state content, once
pinning that its keyed facts are not also duplicated into a `<host-events>` block),
coalesced delivery, tool-call delivery, a resumed wait, a wait resolved by leaving the
page, a timeout, the idle watchdog staying quiet through a wait, the waiting activity
clearing the instant the wait resolves (the host's `waiting-user`/`working` signal), Stop
cancelling a wait, and reset re-activating. Simulation case: `workflow-hand-back`.

The judged simulation harness drives its persona only *between* runner turns, never while
an assistant turn is open, so `wait_for_user_action` in that case always runs out to its
own timeout rather than being resumed mid-turn by a click — a simulation transcript cannot
exercise the same-turn resume at all. Read the assistant's resulting "press Create
whenever you're ready" wrap-up as the intended hand-back, not a stall. The same-turn path
— clicking while the turn is still open — is instead pinned by
`tests/features/host-events/3.host-events.e2e.spec.ts`, which clicks Create mid-wait and
asserts exactly two gateway requests for the turn (the call that started the wait, then
the continuation after it resolves).

## Rejected alternatives

- A separate "situation" re-sent every turn (duplicated navigation as state and event,
  needed an ephemeral prepareStep injection, cost more over a long conversation).
- Inserting events into `history` mid-turn (lands before the turn's own messages).
- Auto-cancelling a wait on key withdrawal.
- Page-triggered turns (`agent-start-session` stays a user gesture on an action button).
