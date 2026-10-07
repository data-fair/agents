import { ownerSchema, memoryAuthorSchema } from '../agent-memory/schema.js'

// Append-only: one row per change of a memory document. Never updated, except to redact.
export default {
  $id: 'https://github.com/data-fair/agents/agent-memory-version',
  'x-exports': ['types'],
  title: 'Agent memory version',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'storeId', 'owner', 'path', 'op', 'version', 'author', 'createdAt'],
  properties: {
    id: { type: 'string' },
    storeId: { type: 'string' },
    owner: ownerSchema,
    path: { type: 'string' },
    previousPath: { type: 'string' },
    op: { type: 'string', enum: ['create', 'update', 'delete', 'rename', 'restore'] },
    version: { type: 'integer', minimum: 0 },
    description: { type: 'string' },
    content: { type: 'string' },
    author: memoryAuthorSchema,
    createdAt: { type: 'string', format: 'date-time' },
    redacted: {
      type: 'object',
      additionalProperties: false,
      required: ['at', 'by'],
      properties: {
        at: { type: 'string', format: 'date-time' },
        by: { type: 'object', additionalProperties: false, required: ['id'], properties: { id: { type: 'string' }, name: { type: 'string' } } }
      }
    }
  }
}
