/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, defaultQuotas } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin
const otherUser = await axiosAuth('test1-user1')
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const orgMember = await axiosAuth('test1-user1', { org: 'test1' })

const mockModel = { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } }
const orgModels = [{ model: mockModel, usage: ['assistant'], multiplier: 0 }]
const mockModelMapping = { assistant: { provider: 'mock', id: 'mock-model', name: 'Mock Model' } }

// API block: test HTTP and stateful database layer with HTTP client querying the dev server
test.describe('Settings API', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('should create and get settings', async () => {
    const settingsData = {
      providers: [
        {
          id: 'provider-1',
          type: 'openai',
          name: 'OpenAI',
          enabled: true,
          openai: {
            apiKey: 'sk-test-key-123',
            defaultModel: 'gpt-4o'
          }
        }
      ],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    const createRes = await putSettings(admin, 'user/test-standalone1', settingsData)
    assert.equal(createRes.status, 200)
    assert.equal(createRes.data.owner.type, 'user')
    assert.equal(createRes.data.owner.id, 'test-standalone1')
    assert.equal(createRes.data.providers.length, 1)
    assert.equal(createRes.data.providers[0].type, 'openai')
    assert.equal(createRes.data.providers[0].openai.apiKey, 'sk-test-key-123')

    const getRes = await user.get('/api/settings/user/test-standalone1')
    assert.equal(getRes.status, 200)
  })

  test('should update settings', async () => {
    const settingsData = {
      providers: [],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    const updateRes = await putSettings(admin, 'user/test-standalone1', settingsData)
    assert.equal(updateRes.status, 200)
    assert.equal(updateRes.data.models[0].model.id, 'mock-model')
    assert.deepEqual(updateRes.data.models[0].usage, ['assistant'])
    assert.equal(updateRes.data.modelMapping.assistant.id, 'mock-model')
  })

  test('should list mock models', async () => {
    const settingsData = {
      providers: [
        {
          id: 'mock-provider',
          type: 'mock',
          name: 'Mock Provider',
          enabled: true
        }
      ],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    await putSettings(admin, 'user/test-standalone1', settingsData)

    const res = await user.get('/api/models/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.results))

    const mockModels = res.data.results.filter((m: any) => m.provider.type === 'mock')
    assert.equal(mockModels.length, 4)
    assert.ok(mockModels.some((m: any) => m.id === 'mock-model'))
    assert.ok(mockModels.some((m: any) => m.id === 'mock-tools'))
    assert.ok(mockModels.some((m: any) => m.id === 'mock-summarizer'))
    assert.ok(mockModels.some((m: any) => m.id === 'evaluator-mock-model'))
  })

  test('surfaces per-provider model-listing errors without dropping working providers', async () => {
    const settingsData = {
      providers: [
        { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true },
        // unreachable endpoint: connection refused, fails fast and deterministically
        { id: 'broken-compat', type: 'openai-compatible', name: 'Broken Endpoint', enabled: true, baseURL: 'http://localhost:1/v1' }
      ],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }
    await putSettings(admin, 'user/test-standalone1', settingsData)

    const res = await user.get('/api/models/user/test-standalone1')
    assert.equal(res.status, 200)

    // the working provider still returns its models
    const mockModels = res.data.results.filter((m: any) => m.provider.type === 'mock')
    assert.equal(mockModels.length, 4)

    // the failing provider is reported instead of silently dropped
    assert.ok(Array.isArray(res.data.errors))
    const brokenError = res.data.errors.find((e: any) => e.providerId === 'broken-compat')
    assert.ok(brokenError, 'expected an error entry for the unreachable provider')
    assert.equal(brokenError.providerType, 'openai-compatible')
    assert.equal(brokenError.providerName, 'Broken Endpoint')
    assert.ok(typeof brokenError.message === 'string' && brokenError.message.length > 0)
  })

  test('reports no errors when every provider lists successfully', async () => {
    await putSettings(admin, 'user/test-standalone1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    })
    const res = await user.get('/api/models/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.deepEqual(res.data.errors, [])
  })

  test('should return empty defaults when no settings exist', async () => {
    const res = await user.get('/api/settings/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.equal(res.data.owner.type, 'user')
    assert.equal(res.data.owner.id, 'test-standalone1')
    assert.deepEqual(res.data.providers, [])
  })

  test('should create provider with different types', async () => {
    const providerTypes = [
      { type: 'anthropic', name: 'Anthropic', apiKey: 'sk-ant-test-123' },
      { type: 'google', name: 'Google', apiKey: 'sk-google-test-123' },
      { type: 'mistral', name: 'Mistral', apiKey: 'sk-mistral-test-123' },
      { type: 'openrouter', name: 'OpenRouter', apiKey: 'sk-or-test-123' },
      { type: 'ollama', name: 'Ollama', apiKey: 'sk-ollama-test-123', baseURL: 'http://localhost:11434' },
      { type: 'scaleway', name: 'Scaleway', apiKey: 'scw-test-123' },
      { type: 'openai-compatible', name: 'My Endpoint', apiKey: 'sk-compat-test-123', baseURL: 'http://localhost:8080/v1' }
    ]

    for (const p of providerTypes) {
      const settingsData = {
        providers: [{ id: `provider-${p.type}`, ...p, enabled: true }],
        models: orgModels,
        modelMapping: mockModelMapping,
        quotas: defaultQuotas
      }

      const res = await putSettings(admin, 'user/test-standalone1', settingsData)
      assert.equal(res.status, 200)
      assert.equal(res.data.providers.length, 1)
      assert.equal(res.data.providers[0].type, p.type)
      assert.equal(res.data.providers[0].name, p.name)
      assert.equal(res.data.providers[0].apiKey, '********')
    }
  })

  test('should preserve existing API key when updating with obfuscated placeholder', async () => {
    const initialData = {
      providers: [
        {
          id: 'provider-openai',
          type: 'openai',
          name: 'OpenAI',
          enabled: true,
          apiKey: 'sk-original-key-123'
        }
      ],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    await putSettings(admin, 'user/test-standalone1', initialData)

    const updateData = {
      providers: [
        {
          id: 'provider-openai',
          type: 'openai',
          name: 'OpenAI Updated',
          enabled: false,
          apiKey: '********'
        }
      ],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    const res = await putSettings(admin, 'user/test-standalone1', updateData)
    assert.equal(res.status, 200)
    assert.equal(res.data.providers[0].name, 'OpenAI Updated')
    assert.equal(res.data.providers[0].enabled, false)
    assert.equal(res.data.providers[0].apiKey, '********')

    const getRes = await user.get('/api/settings/user/test-standalone1')
    assert.equal(getRes.data.providers[0].apiKey, '********')
  })

  test('should handle openai-compatible provider without apiKey', async () => {
    const settingsData = {
      providers: [
        {
          id: 'provider-compat',
          type: 'openai-compatible',
          name: 'Local LM Studio',
          enabled: true,
          baseURL: 'http://localhost:1234/v1'
        }
      ],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    const res = await putSettings(admin, 'user/test-standalone1', settingsData)
    assert.equal(res.status, 200)
    assert.equal(res.data.providers[0].type, 'openai-compatible')
    assert.equal(res.data.providers[0].baseURL, 'http://localhost:1234/v1')
    assert.equal(res.data.providers[0].apiKey, undefined)
  })

  test('should handle ollama provider with baseURL', async () => {
    const settingsData = {
      providers: [
        {
          id: 'provider-ollama',
          type: 'ollama',
          name: 'Local Ollama',
          enabled: true,
          baseURL: 'http://localhost:11434'
        }
      ],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    const res = await putSettings(admin, 'user/test-standalone1', settingsData)
    assert.equal(res.status, 200)
    assert.equal(res.data.providers[0].type, 'ollama')
    assert.equal(res.data.providers[0].baseURL, 'http://localhost:11434')
  })

  test('should update settings multiple times (idempotency)', async () => {
    const settingsData1 = {
      providers: [{ id: 'p1', type: 'mock', name: 'Mock 1', enabled: true }],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    const res1 = await putSettings(admin, 'user/test-standalone1', settingsData1)
    assert.equal(res1.status, 200)

    const settingsData2 = {
      providers: [{ id: 'p2', type: 'mock', name: 'Mock 2', enabled: true }],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    const res2 = await putSettings(admin, 'user/test-standalone1', settingsData2)
    assert.equal(res2.status, 200)
    assert.equal(res2.data.providers.length, 1)
    assert.equal(res2.data.providers[0].name, 'Mock 2')

    const getRes = await user.get('/api/settings/user/test-standalone1')
    assert.equal(getRes.data.providers[0].name, 'Mock 2')
  })

  test('should handle empty providers array', async () => {
    const settingsData = {
      providers: [],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    const res = await putSettings(admin, 'user/test-standalone1', settingsData)
    assert.equal(res.status, 200)
    assert.deepEqual(res.data.providers, [])
  })

  test('should fail with invalid provider type', async () => {
    const settingsData = {
      providers: [
        {
          id: 'invalid-provider',
          type: 'invalid-type',
          name: 'Invalid Provider',
          enabled: true
        }
      ],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    await assert.rejects(
      putSettings(admin, 'user/test-standalone1', settingsData),
      { status: 400 }
    )
  })

  test('should fail with missing required provider fields', async () => {
    const settingsData = {
      providers: [
        {
          id: 'incomplete-provider',
          type: 'openai'
        }
      ],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    await assert.rejects(
      putSettings(admin, 'user/test-standalone1', settingsData),
      { status: 400 }
    )
  })

  test('should fail when accessing another user settings', async () => {
    await putSettings(admin, 'user/test-standalone1', {
      providers: [],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    })
    await assert.rejects(otherUser.get('/api/settings/user/test-standalone1'), { status: 403 })
  })

  test('should fail when updating another user settings', async () => {
    await putSettings(admin, 'user/test-standalone1', {
      providers: [],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    })
    await assert.rejects(otherUser.put('/api/settings/user/test-standalone1', {
      providers: [],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }), { status: 403 })
  })

  test('should add multiple providers in single request', async () => {
    const settingsData = {
      providers: [
        { id: 'p1', type: 'openai', name: 'OpenAI', enabled: true, apiKey: 'sk-test1' },
        { id: 'p2', type: 'anthropic', name: 'Anthropic', enabled: true, apiKey: 'sk-test2' }
      ],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    const res = await putSettings(admin, 'user/test-standalone1', settingsData)
    assert.equal(res.status, 200)
    assert.equal(res.data.providers.length, 2)
  })

  test('should remove providers not included in update', async () => {
    const initialData = {
      providers: [
        { id: 'p1', type: 'openai', name: 'OpenAI', enabled: true },
        { id: 'p2', type: 'anthropic', name: 'Anthropic', enabled: true }
      ],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    await putSettings(admin, 'user/test-standalone1', initialData)

    const updateData = {
      providers: [
        { id: 'p1', type: 'openai', name: 'OpenAI', enabled: true }
      ],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }

    const res = await putSettings(admin, 'user/test-standalone1', updateData)
    assert.equal(res.status, 200)
    assert.equal(res.data.providers.length, 1)
    assert.equal(res.data.providers[0].id, 'p1')
  })

  test('persists the storeTraces flag', async () => {
    const base = {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock', enabled: true }],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas,
      storeTraces: true
    }
    await putSettings(admin, 'user/test-standalone1', base)
    const res = await admin.get('/api/settings/user/test-standalone1')
    assert.equal(res.data.storeTraces, true)

    // verify the default: omitting storeTraces should persist false
    const withoutFlag = {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock', enabled: true }],
      models: orgModels,
      modelMapping: mockModelMapping,
      quotas: defaultQuotas
    }
    await putSettings(admin, 'user/test-standalone1', withoutFlag)
    const res2 = await admin.get('/api/settings/user/test-standalone1')
    assert.equal(res2.data.storeTraces, false)
  })
})

// The org admin owns modelMapping/quotas/moderation/storeTraces via PUT /api/settings/:type/:id/org.
// The mapping in these tests targets the deployment's global default model
// (global-mock/mock-model, from api/config/development.js) so the scenario needs
// no org-level providers/models at all — it also exercises the $setOnInsert
// upsert path (no settings doc exists yet for organization/test1).
test.describe('Org-admin settings endpoint', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('org admin can set modelMapping/quotas/storeTraces, GET reflects them', async () => {
    const body = {
      modelMapping: { assistant: { provider: 'global-mock', id: 'mock-model', name: 'Global Mock Model' } },
      quotas: { ...defaultQuotas, contrib: { unlimited: false, monthlyLimit: 42 } },
      storeTraces: true
    }
    const res = await orgAdmin.put('/api/settings/organization/test1/org', body)
    assert.equal(res.status, 200)
    assert.equal(res.data.modelMapping.assistant.id, 'mock-model')
    assert.equal(res.data.quotas.contrib.monthlyLimit, 42)
    assert.equal(res.data.storeTraces, true)

    const getRes = await orgAdmin.get('/api/settings/organization/test1')
    assert.equal(getRes.data.modelMapping.assistant.id, 'mock-model')
    assert.equal(getRes.data.quotas.contrib.monthlyLimit, 42)
    assert.equal(getRes.data.storeTraces, true)
  })

  test('plain org member (non-admin) is forbidden', async () => {
    await assert.rejects(orgMember.put('/api/settings/organization/test1/org', {
      modelMapping: { assistant: { provider: 'global-mock', id: 'mock-model', name: 'Global Mock Model' } }
    }), { status: 403 })
  })

  test('mapping to a nonexistent model is rejected', async () => {
    await assert.rejects(orgAdmin.put('/api/settings/organization/test1/org', {
      modelMapping: { assistant: { provider: 'no-such-provider', id: 'no-such-model' } }
    }), { status: 400 })
  })

  test('mapping a role to a model not flagged for that usage is rejected', async () => {
    // define an org model flagged only for 'summarizer' via the superadmin route
    await admin.put('/api/settings/organization/test1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: [{
        model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
        usage: ['summarizer'],
        multiplier: 0
      }]
    })

    await assert.rejects(orgAdmin.put('/api/settings/organization/test1/org', {
      modelMapping: { assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' } }
    }), { status: 400 })
  })

  test('superadmin PUT with { providers, models } does not clobber previously saved org fields', async () => {
    await orgAdmin.put('/api/settings/organization/test1/org', {
      modelMapping: { assistant: { provider: 'global-mock', id: 'mock-model', name: 'Global Mock Model' } },
      quotas: { ...defaultQuotas, contrib: { unlimited: false, monthlyLimit: 42 } },
      moderation: { enabled: true, categories: ['anonymous', 'external'] },
      storeTraces: true
    })

    const putRes = await admin.put('/api/settings/organization/test1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: orgModels
    })
    assert.equal(putRes.status, 200)
    // the superadmin PUT's own response already reflects the carried-over org fields
    assert.equal(putRes.data.modelMapping.assistant.id, 'mock-model')
    assert.equal(putRes.data.quotas.contrib.monthlyLimit, 42)
    assert.equal(putRes.data.moderation.enabled, true)
    assert.equal(putRes.data.storeTraces, true)

    const getRes = await admin.get('/api/settings/organization/test1')
    assert.equal(getRes.data.modelMapping.assistant.id, 'mock-model')
    assert.equal(getRes.data.quotas.contrib.monthlyLimit, 42)
    assert.equal(getRes.data.moderation.enabled, true)
    assert.equal(getRes.data.storeTraces, true)
    // and the superadmin write itself did take effect
    assert.equal(getRes.data.providers[0].id, 'mock')
  })

  test('org admin PUT does not wipe previously saved providers/models', async () => {
    await admin.put('/api/settings/organization/test1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: orgModels
    })

    await orgAdmin.put('/api/settings/organization/test1/org', { quotas: defaultQuotas })

    const getRes = await admin.get('/api/settings/organization/test1')
    assert.equal(getRes.data.providers.length, 1)
    assert.equal(getRes.data.providers[0].id, 'mock')
    assert.equal(getRes.data.models.length, 1)
  })

  test('superadmin PUT body containing an org-owned field is rejected (schema narrowed)', async () => {
    await assert.rejects(admin.put('/api/settings/user/test-standalone1', {
      providers: [],
      quotas: defaultQuotas
    }), { status: 400 })
  })
})
