export default {
  $id: 'https://github.com/data-fair/agents/autonomous-agent-message',
  'x-exports': ['types'],
  title: 'Autonomous agent message',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'conversationId', 'autonomousAgentId', 'owner', 'seq', 'role', 'author', 'createdAt'],
  properties: {
    id: { type: 'string' },
    conversationId: { type: 'string' },
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
    seq: { type: 'number', minimum: 1 },
    role: { type: 'string', enum: ['user', 'assistant'] },
    // Mandatory. A shared timeline means several people contribute, so an unattributed
    // message is unreadable and un-erasable.
    author: {
      type: 'object',
      additionalProperties: false,
      required: ['kind'],
      properties: {
        kind: { type: 'string', enum: ['user', 'autonomous-agent'] },
        userId: { type: 'string' },
        userName: { type: 'string' }
      }
    },
    content: { type: 'string' },
    reasoning: { type: 'string' },
    toolCalls: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['toolName'],
        properties: {
          toolCallId: { type: 'string' },
          toolName: { type: 'string' },
          serverId: { type: 'string' },
          // readOnlyHint / destructiveHint, recorded per call so the write surface is
          // queryable before P1's approval gate is switched on
          annotations: { type: 'object', additionalProperties: true },
          // The tool was called and did NOT return a usable result. Recorded because the
          // model sees the error and usually carries on talking, so without this a failed
          // call is indistinguishable from a successful one to anyone reading the thread.
          failed: { type: 'boolean' },
          error: { type: 'string' }
        }
      }
    },
    runId: { type: 'string' },
    // true while the executor is still appending to this message
    pending: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    // The conversation version at which this message last changed. `?sinceVersion=` filters on
    // it, which is what makes an IN-PLACE update (the assistant message being filled in, at an
    // unchanged seq) visible to an incremental fetch — `seq` alone can only reveal new messages.
    version: { type: 'number', minimum: 1 }
  }
}
