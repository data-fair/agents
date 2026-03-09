export default {
  $id: 'https://github.com/data-fair/agents/model',
  title: 'Model',
  type: 'object',
  required: ['id', 'name', 'provider'],
  properties: {
    id: { type: 'string', title: 'Model ID' },
    name: { type: 'string', title: 'Name' },
    provider: {
      type: 'object',
      required: ['type', 'name', 'id'],
      properties: {
        type: { type: 'string', title: 'Provider Type' },
        name: { type: 'string', title: 'Provider Name' },
        id: { type: 'string', title: 'Provider ID' }
      }
    }
  }
}
