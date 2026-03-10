import { test } from '../fixtures/login.ts'
import assert from 'node:assert/strict'
import { axiosAuth } from '../support/axios.ts'

const user = await axiosAuth('test-standalone1')

// Unit block
test.describe('Settings @unit', () => {
  test('should validate password complexity', () => {
    // ... pure logic testing
  })
})

// API block
test.describe('Settings @api', () => {
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
})

// E2E block
test.describe('Settings UI @e2e', () => {
  test('user can log in via form', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/settings', 'test-standalone1')
    // TODO: check settings form
  })
})
