export default {
  $id: 'https://github.com/data-fair/agents/limits',
  'x-exports': ['types', 'validate'],
  title: 'Limits',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'type', 'lastUpdate'],
  properties: {
    type: { type: 'string' },
    id: { type: 'string' },
    name: { type: 'string' },
    lastUpdate: { type: 'string', format: 'date-time' },
    defaults: { type: 'boolean', title: 'these limits were defined using default values only, not specifically defined' },
    consumptionMonth: { type: 'string', title: 'YYYY-MM month the consumption counter belongs to, used to reset defaults docs monthly' },
    ai_credits: {
      type: 'object',
      additionalProperties: false,
      properties: {
        limit: { type: 'number' },
        consumption: { type: 'number' }
      }
    }
  }
}
