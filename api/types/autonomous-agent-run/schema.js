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
