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
