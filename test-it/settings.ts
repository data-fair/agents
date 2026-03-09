import { strict as assert } from 'node:assert'
import { it, describe, beforeEach } from 'node:test'
import 'dotenv/config'
import nock from 'nock'
import { axiosAuth, clean } from './utils/index.ts'

const user = await axiosAuth('test-standalone1@test.com')

describe('settings', () => {
  beforeEach(async () => {
    await clean()
  })

  it('should create and get settings', async () => {
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

  it('should update settings', async () => {
    const settingsData = {
      agents: { dataFairAssistant: { prompt: 'You are a helpful assistant.' } },
      providers: []
    }

    const updateRes = await user.put('/api/settings/user/test-standalone1', settingsData)
    assert.equal(updateRes.status, 200)
    assert.equal(updateRes.data.agents.dataFairAssistant.prompt, 'You are a helpful assistant.')
  })

  it('should list models from OpenAI API with mock', async () => {
    nock('https://api.openai.com')
      .get('/v1/models')
      .matchHeader('authorization', (val: any) => val.startsWith('Bearer '))
      .reply(200, {
        data: [
          { id: 'gpt-4o', name: 'GPT-4o' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
          { id: 'gpt-5', name: 'GPT-5' }
        ]
      })

    const settingsData = {
      providers: [
        {
          id: 'openai-test',
          type: 'openai',
          name: 'OpenAI',
          enabled: true,
          apiKey: 'sk-test-mock-key-123'
        }
      ],
      agents: {}
    }

    await user.put('/api/settings/user/test-standalone1', settingsData)

    const res = await user.get('/api/models/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.results))

    const openaiModels = res.data.results.filter((m: any) => m.provider.type === 'openai')
    assert.equal(openaiModels.length, 3)
    assert.equal(openaiModels[0].id, 'gpt-4o')
    assert.equal(openaiModels[1].id, 'gpt-4o-mini')
    assert.equal(openaiModels[2].id, 'gpt-5')

    nock.cleanAll()
  })
})
