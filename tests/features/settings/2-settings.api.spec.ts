/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, clean } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')

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
      agents: {}
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
      agents: { dataFairAssistant: { prompt: 'You are a helpful assistant.' } },
      providers: []
    }

    const updateRes = await user.put('/api/settings/user/test-standalone1', settingsData)
    assert.equal(updateRes.status, 200)
    assert.equal(updateRes.data.agents.dataFairAssistant.prompt, 'You are a helpful assistant.')
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
      agents: {}
    }

    await user.put('/api/settings/user/test-standalone1', settingsData)

    const res = await user.get('/api/models/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.results))

    const mockModels = res.data.results.filter((m: any) => m.provider.type === 'mock')
    assert.equal(mockModels.length, 1)
    assert.equal(mockModels[0].id, 'mock-model')
  })
})
