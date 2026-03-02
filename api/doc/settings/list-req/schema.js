export default {
  $id: 'https://github.com/data-fair/agents/settings/list-req',
  title: 'List settings req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'object',
      additionalProperties: false,
      properties: {
        _id: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        owner: {
          type: 'object',
          additionalProperties: false,
          properties: {
            type: { type: 'string', enum: ['user', 'organization'] },
            id: { type: 'string' },
            name: { type: 'string' },
            department: { type: 'string' }
          }
        },
        globalPrompt: { type: 'string' }
      }
    }
  }
}
