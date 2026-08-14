import { superAdmin, defaultQuotas } from './tests/support/axios.ts'

const admin = await superAdmin
await admin.put('/api/settings/organization/test1', {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: [{
    model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
    usage: ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator'],
    multiplier: 1
  }]
})
await admin.put('/api/settings/organization/test1/org', {
  modelMapping: { assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' } },
  quotas: defaultQuotas,
  moderation: { enabled: false, categories: ['anonymous', 'external'] },
  storeTraces: false
})
console.log(JSON.stringify((await admin.get('/api/settings/organization/test1')).data, null, 2))
console.log(JSON.stringify((await admin.get('/api/catalog/organization/test1?usage=assistant')).data, null, 2))
