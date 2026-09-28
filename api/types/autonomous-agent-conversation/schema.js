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
    messageSeq: { type: 'number', minimum: 0 },
    // Monotonic across EVERY change to the conversation: a message appended, a message updated
    // in place (the assistant's content as it grows), a run transition. It is what the websocket
    // notification carries and what `GET .../messages?sinceVersion=` fetches from, so a client
    // needs nothing but this number to catch up.
    //
    // A counter rather than a timestamp on purpose: two writes in the same millisecond make a
    // timestamp-based cursor either skip one or re-deliver it, while an $inc cannot collide.
    version: { type: 'number', minimum: 0 }
  }
}
