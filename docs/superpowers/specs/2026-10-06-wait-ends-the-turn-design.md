# `wait_for_user_action` ends the turn

Status: proposal, for discussion before any code. Raised during the 2026-10-06 audit, when the
idle watchdog was fixed to pause while a wait runs (`createIdleWatchdog`) and the run-ceiling
interaction was left as is.

## Today

The wait **blocks inside the turn**. `createWaitTool` (`shared/host-events.ts`) parks the tool call
on `HostEventStore.waitForEvent` until the page reports something that resolves it
(`resolvesWait`), the clock runs out (default 300 s, max 600 s), or the turn is aborted. The run,
its lock, its MCP connections and its model stream all stay open for that time.

Everything around it exists to cope with that parking:

- **The idle watchdog** had to learn that an outstanding tool call is not a silent provider
  (`createIdleWatchdog`), or every wait longer than the stall timeout was killed as a stuck model.
- **The run ceiling** (`turnTimeoutSeconds`) still counts the parked time. A wait can legitimately
  outlast it; it is then ended as a timeout, and the stored turn says the clock ended it.
- **Speaking during a wait** must abort a live turn (`abortRunsOfConversation` with
  `PERSON_SPOKE`), wait for it to release the conversation lock, settle its open calls
  (`settleInterruptedParts`) and only then start the person's turn.
- **The timeout result** ("No user action within N seconds. End your reply now…") is a message the
  model then answers, at a cost, with a line the person usually does not need. The
  `timedOutAtSeq` guard exists because judged runs re-waited after timeouts (480 s of a 567 s run),
  and it is not even wired on the server loop (`turnId` is not passed).
- **A person who walks away** holds a run open until the clock, and a closed tab loses the wait.

## Proposal

The wait is a **handover**, not a pause. Calling it ends the turn; the person acting starts the
next one.

1. **Calling the tool ends the turn.** The tool records the handover and the loop stops after that
   step (`stopWhen: hasToolCall(WAIT_TOOL_NAME)` alongside the existing guards). The `message`
   handover text is stored as today (`waitHandover`). The wait part stays OPEN
   (`input-available`), and the conversation records what it is waiting on:
   `pendingWait: { messageSeq, toolCallId, expecting, since }`. The run closes normally — no clock,
   no lock, no connection held.
2. **The person acting wakes the conversation.** The agent session already receives every host
   event. When one that `resolvesWait` arrives for a conversation with a `pendingWait` and no live
   turn, the session settles the wait part with the events block — exactly the result the tool
   returns today, followers included — clears `pendingWait`, and starts a **wake turn**: a run with
   no user message, whose history ends on that settled tool result, so the model continues from it
   as it does now mid-turn. An event that arrives before the handover turn has closed is buffered in
   the store, as today, and checked when the turn ends.
3. **The person writing answers the wait.** A prompt on a conversation with a `pendingWait`
   settles the wait with `interruptedWaitResult` and starts the person's turn, with
   `pendingWaitReminder` as today. There is no live turn to abort, so the abort-and-wait-for-the-lock
   path goes away for this case (Stop and the autonomous-agent kill switch keep it).
4. **No clock.** A wait lasts until the person acts, writes, or starts another conversation. A
   closed tab simply leaves it pending: the next prompt settles it as in 3. The timeout result, the
   `timedOutAtSeq` guard and `WAIT_DEFAULT_SECONDS`/`WAIT_MAX_SECONDS` go away, and so does the
   run-ceiling conflict.

What stays the same: the tool's name, arguments and description (judged prompts were tuned on
them), the stored shape of a settled wait (so existing conversations replay unchanged), what
resolves a wait (`resolvesWait`), the followers, the reminder after an interruption, and the
`waiting` activity label — now derived from the open wait part of the last message rather than
streamed while a tool runs.

## What it costs and what changes

- **One run becomes several.** A handover workflow is a handover turn plus a wake turn per action.
  `turnCredits` and the step limit then apply per segment rather than to the whole workflow. That
  reads as correct (each segment is bounded work), but it is a change in what the ceiling caps.
- **A run with no user message.** Quota and billing apply to the wake turn as the person's (it is
  their action). Moderation has nothing to classify and is skipped. The run record needs to say it
  was a wake (`trigger: 'wake'` or similar) so the export reads right.
- **A new stop reason or flag** for "ended by handing over", so a run that waits is not read as a
  run that finished its work — in the export, the review page and the simulation metrics.
- **In-process, like today.** The session that receives the events is the process holding the
  socket, which is where the wake turn runs. Nothing crosses processes.
- **The chat driver and the judge.** `waitForTurn` returning `'waiting'` becomes "the turn ended on
  an open wait", which is simpler to detect: a stored state, not a live activity.

## Questions to settle first

1. **Is the wake visible in the transcript?** Recommended: no new bubble. The wait chip shows it
   was answered, with the event in its detail. The alternative, a small "you clicked Create" line,
   is more legible but invents a speaker the model never had.
2. **No clock at all, or a soft one?** Recommended: none. A soft deadline that settles the wait as
   "the person did not act" without waking the model would cost nothing, but it is still a clock,
   with nothing gained over letting the next prompt settle it.
3. **What does Stop do on a pending wait?** Recommended: settle it as stopped
   (`INTERRUPTED_RESULTS.stop`) without waking the model, so a person can dismiss a handover they do
   not intend to act on.
4. **Per-segment ceilings**, as above, or a budget that spans a handover workflow? Recommended:
   per segment. A workflow budget would need its own record across runs.

## Tests to write first

- A handover turn closes with the wait open and `pendingWait` set; the run holds nothing.
- A resolving host event wakes the conversation; the wait is settled with the events block; the
  wake turn's history ends on it; the model continues.
- An event that does not resolve (a keyed refresh) does not wake; it rides along as a follower.
- An event arriving before the handover turn closes still wakes it once it does.
- A prompt on a pending wait settles it as interrupted and carries the reminder.
- Stop on a pending wait settles it without a model call.
- The mock's existing wait seams (`api/src/models/mock-model.ts`) drive all of the above.
