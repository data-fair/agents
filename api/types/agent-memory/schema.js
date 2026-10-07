// One memory document: the CURRENT state of one path of one store. History lives in
// agent-memory-versions. See docs/architecture/agent-memory.md.
const author = {
  type: 'object',
  additionalProperties: false,
  required: ['kind'],
  properties: {
    kind: { type: 'string', enum: ['agent', 'reflection', 'user'] },
    agentId: { type: 'string' },
    runId: { type: 'string' },
    conversationId: { type: 'string' },
    // A write made during a planned task's run, which has no conversation.
    taskId: { type: 'string' },
    toolCallId: { type: 'string' },
    fromSeq: { type: 'number' },
    toSeq: { type: 'number' },
    userId: { type: 'string' },
    userName: { type: 'string' }
  }
}

export const ownerSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'id'],
  properties: { type: { type: 'string' }, id: { type: 'string' }, name: { type: 'string' }, department: { type: 'string' } }
}

export { author as memoryAuthorSchema }

export default {
  $id: 'https://github.com/data-fair/agents/agent-memory',
  'x-exports': ['types'],
  title: 'Agent memory',
  type: 'object',
  additionalProperties: false,
  required: ['storeId', 'owner', 'path', 'description', 'content', 'version', 'createdAt', 'updatedAt', 'updatedBy'],
  properties: {
    storeId: { type: 'string' },
    owner: ownerSchema,
    path: { type: 'string' },
    description: { type: 'string' },
    content: { type: 'string' },
    version: { type: 'integer', minimum: 1 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    updatedBy: author
  }
}
