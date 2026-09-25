export default {
  $id: 'https://github.com/data-fair/agents/autonomous-agent-conversation',
  'x-exports': ['types'],
  title: 'Autonomous agent conversation',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'autonomousAgentId', 'owner', 'title', 'createdAt', 'messageSeq'],
  properties: {
    id: { type: 'string' },
    autonomousAgentId: { type: 'string' },
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
    title: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    lastMessageAt: { type: 'string', format: 'date-time' },
    // monotonic, starts at 1 — see nextMessageSeq
    messageSeq: { type: 'number', minimum: 0 }
  }
}
