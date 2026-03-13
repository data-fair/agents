/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, clean } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')
const otherUser = await axiosAuth('test1-user1')

const mockModel = { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } }

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
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    const createRes = await user.put('/api/settings/user/test-standalone1', settingsData)
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
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    const updateRes = await user.put('/api/settings/user/test-standalone1', settingsData)
    assert.equal(updateRes.status, 200)
    assert.equal(updateRes.data.models.assistant.model.id, 'mock-model')
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
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    await user.put('/api/settings/user/test-standalone1', settingsData)

    const res = await user.get('/api/models/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.results))

    const mockModels = res.data.results.filter((m: any) => m.provider.type === 'mock')
    assert.equal(mockModels.length, 1)
    assert.equal(mockModels[0].id, 'mock-model')
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
      { type: 'ollama', name: 'Ollama', apiKey: 'sk-ollama-test-123', baseURL: 'http://localhost:11434' }
    ]

    for (const p of providerTypes) {
      const settingsData = {
        providers: [{ id: `provider-${p.type}`, ...p, enabled: true }],
        models: { assistant: { model: mockModel } },
        limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
      }

      const res = await user.put('/api/settings/user/test-standalone1', settingsData)
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
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    await user.put('/api/settings/user/test-standalone1', initialData)

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
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    const res = await user.put('/api/settings/user/test-standalone1', updateData)
    assert.equal(res.status, 200)
    assert.equal(res.data.providers[0].name, 'OpenAI Updated')
    assert.equal(res.data.providers[0].enabled, false)
    assert.equal(res.data.providers[0].apiKey, '********')

    const getRes = await user.get('/api/settings/user/test-standalone1')
    assert.equal(getRes.data.providers[0].apiKey, '********')
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
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    const res = await user.put('/api/settings/user/test-standalone1', settingsData)
    assert.equal(res.status, 200)
    assert.equal(res.data.providers[0].type, 'ollama')
    assert.equal(res.data.providers[0].baseURL, 'http://localhost:11434')
  })

  test('should update settings multiple times (idempotency)', async () => {
    const settingsData1 = {
      providers: [{ id: 'p1', type: 'mock', name: 'Mock 1', enabled: true }],
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    const res1 = await user.put('/api/settings/user/test-standalone1', settingsData1)
    assert.equal(res1.status, 200)

    const settingsData2 = {
      providers: [{ id: 'p2', type: 'mock', name: 'Mock 2', enabled: true }],
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    const res2 = await user.put('/api/settings/user/test-standalone1', settingsData2)
    assert.equal(res2.status, 200)
    assert.equal(res2.data.providers.length, 1)
    assert.equal(res2.data.providers[0].name, 'Mock 2')

    const getRes = await user.get('/api/settings/user/test-standalone1')
    assert.equal(getRes.data.providers[0].name, 'Mock 2')
  })

  test('should handle empty providers array', async () => {
    const settingsData = {
      providers: [],
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    const res = await user.put('/api/settings/user/test-standalone1', settingsData)
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
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    await assert.rejects(
      user.put('/api/settings/user/test-standalone1', settingsData),
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
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    await assert.rejects(
      user.put('/api/settings/user/test-standalone1', settingsData),
      { status: 400 }
    )
  })

  test('should fail when accessing another user settings', async () => {
    await user.put('/api/settings/user/test-standalone1', { providers: [], models: { assistant: { model: mockModel } }, limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 } })
    await assert.rejects(otherUser.get('/api/settings/user/test-standalone1'), { status: 403 })
  })

  test('should fail when updating another user settings', async () => {
    await user.put('/api/settings/user/test-standalone1', { providers: [], models: { assistant: { model: mockModel } }, limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 } })
    await assert.rejects(otherUser.put('/api/settings/user/test-standalone1', { providers: [], models: { assistant: { model: mockModel } }, limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 } }), { status: 403 })
  })

  test('should add multiple providers in single request', async () => {
    const settingsData = {
      providers: [
        { id: 'p1', type: 'openai', name: 'OpenAI', enabled: true, apiKey: 'sk-test1' },
        { id: 'p2', type: 'anthropic', name: 'Anthropic', enabled: true, apiKey: 'sk-test2' }
      ],
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    const res = await user.put('/api/settings/user/test-standalone1', settingsData)
    assert.equal(res.status, 200)
    assert.equal(res.data.providers.length, 2)
  })

  test('should remove providers not included in update', async () => {
    const initialData = {
      providers: [
        { id: 'p1', type: 'openai', name: 'OpenAI', enabled: true },
        { id: 'p2', type: 'anthropic', name: 'Anthropic', enabled: true }
      ],
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    await user.put('/api/settings/user/test-standalone1', initialData)

    const updateData = {
      providers: [
        { id: 'p1', type: 'openai', name: 'OpenAI', enabled: true }
      ],
      models: { assistant: { model: mockModel } },
      limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
    }

    const res = await user.put('/api/settings/user/test-standalone1', updateData)
    assert.equal(res.status, 200)
    assert.equal(res.data.providers.length, 1)
    assert.equal(res.data.providers[0].id, 'p1')
  })
})
