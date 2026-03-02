import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import 'dotenv/config'
import nock from 'nock'
import { startApiServer, stopApiServer, axiosAuth, clean } from './utils/index.ts'

const user = await axiosAuth('alban.mouton@koumoul.com')

const testAccount = {
  type: 'user' as const,
  id: 'albanm',
  name: 'Test User'
}

describe('settings', () => {
  before(async () => {
    await startApiServer()
  })
  beforeEach(async () => {
    await clean()
  })
  after(async () => {
    await stopApiServer()
  })

  it('should create and get settings', async () => {
    const settingsData = {
      owner: testAccount,
      globalPrompt: 'You are a helpful assistant.',
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
      ]
    }

    const createRes = await user.post('/api/settings', {
      body: settingsData,
      query: {}
    })
    assert.equal(createRes.status, 201)
    assert.equal(createRes.data.owner.type, 'user')
    assert.equal(createRes.data.owner.id, 'test-user-id')
    assert.equal(createRes.data.globalPrompt, 'You are a helpful assistant.')
    assert.equal(createRes.data.providers.length, 1)
    assert.equal(createRes.data.providers[0].type, 'openai')
    assert.equal(createRes.data.providers[0].openai.apiKey, 'sk-test-key-123')

    const getRes = await user.get(`/api/settings/${createRes.data._id}`)
    assert.equal(getRes.status, 200)
    assert.equal(getRes.data.globalPrompt, 'You are a helpful assistant.')
  })

  it('should list settings', async () => {
    const listRes = await user.get('/api/settings')
    assert.equal(listRes.status, 200)
    assert.ok(Array.isArray(listRes.data.results))
    assert.ok(listRes.data.count >= 1)
  })

  it('should patch settings', async () => {
    const listRes = await user.get('/api/settings')
    const settings = listRes.data.results[0]

    const patchRes = await user.patch(`/api/settings/${settings._id}`, {
      body: {
        globalPrompt: 'You are a coding assistant.'
      },
      query: {}
    })
    assert.equal(patchRes.status, 200)
    assert.equal(patchRes.data.globalPrompt, 'You are a coding assistant.')
  })

  it('should delete settings', async () => {
    const settingsData = {
      owner: testAccount,
      globalPrompt: 'To be deleted',
      providers: []
    }

    const createRes = await user.post('/api/settings', {
      body: settingsData,
      query: {}
    })
    assert.equal(createRes.status, 201)

    const deleteRes = await user.delete(`/api/settings/${createRes.data._id}`)
    assert.equal(deleteRes.status, 204)

    const getRes = await user.get(`/api/settings/${createRes.data._id}`)
    assert.equal(getRes.status, 404)
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
      owner: testAccount,
      globalPrompt: 'Test',
      providers: [
        {
          id: 'openai-test',
          type: 'openai',
          name: 'OpenAI',
          enabled: true,
          openai: {
            apiKey: 'sk-test-mock-key-123'
          }
        }
      ]
    }

    await user.post(`/api/settings/${testAccount.type}/${testAccount.id}`, {
      body: settingsData,
      query: {}
    })

    const res = await user.get('/api/models')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.results))

    const openaiModels = res.data.results.filter((m: any) => m.providerType === 'openai')
    assert.equal(openaiModels.length, 3)
    assert.equal(openaiModels[0].id, 'gpt-4o')
    assert.equal(openaiModels[1].id, 'gpt-4o-mini')
    assert.equal(openaiModels[2].id, 'gpt-5')

    nock.cleanAll()
  })
})
