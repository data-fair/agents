export default {
  $id: 'https://github.com/data-fair/agents/conversation-run',
  'x-exports': ['types'],
  title: 'Conversation run',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'agentId', 'owner', 'trigger', 'status', 'startedAt'],
  properties: {
    id: { type: 'string' },
    agentId: { type: 'string' },
    // A run is of one of two kinds. A 'conversation' run is one turn of a conversation and carries its
    // `conversationId`. A 'task' run is one execution of a planned task: no conversation, its content
    // (`prompt`, `parts`, `outcome`) lives on the run itself. Absent means 'conversation'.
    kind: { type: 'string', enum: ['conversation', 'task'] },
    conversationId: { type: 'string' },
    taskId: { type: 'string' },
    // A task run: the message the task gave the model, and what the model produced.
    prompt: { type: 'string' },
    parts: { type: 'array', items: { type: 'object' } },
    // What a task run reported through report_outcome.
    outcome: {
      type: 'object',
      additionalProperties: false,
      required: ['status', 'summary'],
      properties: {
        status: { type: 'string', enum: ['done', 'nothing-to-do', 'needs-attention'] },
        summary: { type: 'string' }
      }
    },
    // A task run, reflected into the agent's memory once at its end: when, and what that pass cost.
    memoryReflection: {
      type: 'object',
      additionalProperties: false,
      properties: { at: { type: 'string', format: 'date-time' }, credits: { type: 'number' } }
    },
    // A task run: the slot it was due for.
    scheduledFor: { type: 'string', format: 'date-time' },
    owner: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'id'],
      properties: {
        type: { type: 'string', enum: ['user', 'organization'] },
        id: { type: 'string' },
        name: { type: 'string' },
        department: { type: 'string' }
      }
    },
    // 'user': the person wrote. 'wake': the person ACTED on a handover (wait_for_user_action), and the
    // turn continues from what they did — no message of theirs, so no moderation.
    // 'schedule' and 'manual' are the triggers of a TASK run: its slot came due, or an admin ran it now.
    // 'approval': a person decided on a pending approval, and the turn continues from the decision.
    trigger: { type: 'string', enum: ['user', 'wake', 'approval', 'schedule', 'manual'] },
    triggeredBy: {
      type: 'object',
      additionalProperties: false,
      properties: { userId: { type: 'string' }, userName: { type: 'string' } }
    },
    // The effective role the triggering person held, for quotas and usage attribution.
    //
    // Only a STANDARD agent needs it, and it is the difference between a quota that applies and one
    // that does not. A configured autonomous agent is an org-owned service identity: it is billed as
    // the agent at role 'admin', because no per-profile quota is meant to apply to it. A standard
    // agent acts AS the person, so the person's own role is what bounds their spend — without this,
    // every chat turn resolved to 'admin' and the per-role quotas were silently unenforced, and every
    // person's usage was recorded against one `autonomous-agent:personal` row.
    //
    // Stored on the run rather than recomputed by the executor because only the HTTP/socket boundary
    // has the session to derive it from.
    triggeredByRole: { type: 'string', enum: ['admin', 'contrib', 'user', 'external', 'anonymous'] },
    /**
     * Telemetry for each MODEL CALL this turn made.
     *
     * The one thing the old `trace-requests` collection held that the conversation cannot: a turn is
     * N model calls, while the conversation keeps one message for the whole turn, so per-call
     * provider, model, tokens, cost and duration have no other home. Everything else that collection
     * stored — who said what, the tool calls and their results — IS the conversation.
     *
     * Bounded by the step limit, so this array cannot grow without limit the way a message can.
     */
    calls: {
      type: 'array',
      default: [],
      items: {
        type: 'object',
        required: ['modelRole', 'model'],
        properties: {
          modelRole: { type: 'string' },
          model: { type: 'string' },
          provider: { type: 'string' },
          providerType: { type: 'string' },
          inputTokens: { type: 'number' },
          outputTokens: { type: 'number' },
          cacheReadTokens: { type: 'number' },
          cacheWriteTokens: { type: 'number' },
          credits: { type: 'number' },
          // Split by token class, because the total alone cannot show that cache reads were billed
          // at the cached rate — which is the thing most easily got wrong and least visible when it
          // is. `cachedInput` is part of the input spend, not a separate charge.
          creditsInput: { type: 'number' },
          creditsCachedInput: { type: 'number' },
          creditsOutput: { type: 'number' },
          durationMs: { type: 'number' },
          finishReason: { type: 'string' },
          // How much context this call actually sent, which is how context management is diagnosed:
          // a recap replacing a covered prefix shows up as a messageCount below the number of stored
          // messages, and clearing shows up as inputTokens far below the stored size. Counts and a
          // seq bound, so no content.
          messageCount: { type: 'number' },
          historyUpToSeq: { type: 'number' },
          // What the model COULD do, which the conversation cannot show: it records the calls made,
          // never the tools offered. The union over the turn's steps, since the page's tools are live
          // and may change between steps. Names only, sorted.
          toolNames: { type: 'array', items: { type: 'string' } },
          // How much page state and page events this call carried (the host blocks folded into the
          // person's message at call time, which are not stored with it). The one measure of how
          // much a host page talks to the model.
          hostBlockChars: { type: 'number' },
          // The system prompt is per TURN, not per call, so it is recorded once below rather than
          // repeated on every entry.
          steps: { type: 'number' }
        }
      }
    },
    /**
     * The instructions the model was given, recorded once per run.
     *
     * Reviewable without a second store, and the thing `reconstruct-trace` used to dig out of a
     * request body by filtering for a system-role message.
     */
    systemPrompt: { type: 'string' },
    status: { type: 'string', enum: ['running', 'done', 'error', 'aborted', 'interrupted', 'skipped'] },
    // 'waiting': the turn handed over to the person (wait_for_user_action) and ends there; their action
    // starts the next one. Not 'completed', which would read as work finished.
    // 'awaiting-approval': a call needs the person's approval; the turn ends there and their decision starts the next one.
    stopReason: { type: 'string', enum: ['completed', 'waiting', 'awaiting-approval', 'step-limit', 'repeated-calls', 'budget', 'timeout', 'aborted', 'error'] },
    error: { type: 'string' },
    // A stop asked for while the run was `running`, by whichever API process received it: the process
    // driving the turn polls its own run for it (see driveTurn), so a stop reaches a turn held by another
    // instance. `abortReason` says whose stop it was, so the turn is settled with the same reason a local
    // stop gives: absent for a person's stop, 'agent-stopped' when the agent was disabled or deleted.
    abortRequestedAt: { type: 'string', format: 'date-time' },
    abortReason: { type: 'string', enum: ['agent-stopped'] },
    steps: { type: 'number', minimum: 0 },
    credits: { type: 'number', minimum: 0 },
    // The conversation version at which this run last changed, so a client can fetch run state
    // incrementally through the same cursor as messages.
    version: { type: 'number', minimum: 1 },
    startedAt: { type: 'string', format: 'date-time' },
    endedAt: { type: 'string', format: 'date-time' }
  }
}
