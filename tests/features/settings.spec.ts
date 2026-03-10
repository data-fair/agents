import { test } from '../fixtures/login.ts'
import assert from 'node:assert/strict'
import { axiosAuth, clean } from '../support/axios.ts'
import { beforeEach } from 'node:test'

const user = await axiosAuth('test-standalone1')

// Unit block: test pure functions from operations.ts
test.describe('Settings @unit', () => {
  // ... pure logic testing
})

// API block: test HTTP and stateful database layer with HTTP client querying the dev server
test.describe('Settings @api', () => {
  beforeEach(clean)

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

// E2E block: use full playwright capabilities to test the UI and indirectly the API
test.describe('Settings UI @e2e', () => {
  beforeEach(clean)
  test('Authenticated user can use settings form', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/settings', 'test-standalone1')
    // TODO: check settings form
  })
})
