/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, defaultQuotas } from '../../support/axios.ts'
import { mockModels, deepMerge, mockSettings, putSettings } from '../../support/settings.ts'

const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const orgMember = await axiosAuth('test1-user1', { org: 'test1' })
const admin = await superAdmin

test.describe('Catalog API', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('org admin GET returns the global mock model with no settings stored', async () => {
    const res = await orgAdmin.get('/api/catalog/organization/test1')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, res.data.results.length)
    const globalModel = res.data.results.find((m: any) => m.id === 'mock-model' && m.source === 'global')
    assert.ok(globalModel, 'expected the dev-config global mock model in the catalog')
    assert.equal(globalModel.provider.id, 'global-mock')
  })

  test('org admin GET returns global + org models after a settings PUT', async () => {
    await putSettings(admin, 'organization/test1', deepMerge(structuredClone(mockSettings), { models: mockModels() }))

    const res = await orgAdmin.get('/api/catalog/organization/test1')
    assert.equal(res.status, 200)

    const globalModel = res.data.results.find((m: any) => m.id === 'mock-model' && m.source === 'global')
    assert.ok(globalModel, 'expected the global model still present')

    const orgModel = res.data.results.find((m: any) => m.id === 'mock-model' && m.source === 'org')
    assert.ok(orgModel, 'expected the org-defined model with source "org"')
    assert.equal(orgModel.provider.id, 'mock-provider')
  })

  test('?usage=tools filters to models flagged for that role', async () => {
    const toolsModel = { id: 'tools-model', name: 'Tools Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }
    const assistantOnlyModel = { id: 'assistant-only-model', name: 'Assistant Only', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }
    await putSettings(admin, 'organization/test1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: [
        { model: toolsModel, usage: ['tools'], multiplier: 0 },
        { model: assistantOnlyModel, usage: ['assistant'], multiplier: 0 }
      ],
      modelMapping: { assistant: { provider: 'mock-provider', id: 'assistant-only-model' } },
      quotas: defaultQuotas
    })

    const res = await orgAdmin.get('/api/catalog/organization/test1?usage=tools')
    assert.equal(res.status, 200)
    for (const m of res.data.results) {
      assert.ok(m.usage.includes('tools'), `expected model ${m.id} to be flagged for "tools"`)
    }
    assert.ok(res.data.results.some((m: any) => m.id === 'tools-model'))
    assert.ok(!res.data.results.some((m: any) => m.id === 'assistant-only-model'))
    // the dev-config global model is flagged for every role, so it stays in the filtered set
    assert.ok(res.data.results.some((m: any) => m.source === 'global' && m.id === 'mock-model'))
  })

  test('unknown usage value yields an empty result set', async () => {
    const res = await orgAdmin.get('/api/catalog/organization/test1?usage=not-a-role')
    assert.equal(res.status, 200)
    assert.deepEqual(res.data.results, [])
    assert.equal(res.data.count, 0)
  })

  test('plain org member (non-admin) is forbidden', async () => {
    await assert.rejects(orgMember.get('/api/catalog/organization/test1'), { status: 403 })
  })
})
