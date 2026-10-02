export default {
  $id: 'https://github.com/data-fair/agents/autonomous-agent-run',
  'x-exports': ['types'],
  title: 'Autonomous agent run',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'autonomousAgentId', 'conversationId', 'owner', 'trigger', 'status', 'startedAt'],
  properties: {
    id: { type: 'string' },
    autonomousAgentId: { type: 'string' },
    conversationId: { type: 'string' },
    owner: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'id'],
      properties: {
        type: { type: 'string', enum: ['organization'] },
        id: { type: 'string' },
        name: { type: 'string' },
        department: { type: 'string' }
      }
    },
    // 'user' now; P2 adds 'schedule'
    trigger: { type: 'string', enum: ['user'] },
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
    status: { type: 'string', enum: ['running', 'done', 'error', 'aborted', 'interrupted'] },
    stopReason: { type: 'string', enum: ['completed', 'step-limit', 'repeated-calls', 'budget', 'timeout', 'aborted', 'error'] },
    error: { type: 'string' },
    steps: { type: 'number', minimum: 0 },
    credits: { type: 'number', minimum: 0 },
    // The conversation version at which this run last changed, so a client can fetch run state
    // incrementally through the same cursor as messages.
    version: { type: 'number', minimum: 1 },
    startedAt: { type: 'string', format: 'date-time' },
    endedAt: { type: 'string', format: 'date-time' }
  }
}
