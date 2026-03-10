import { strict as assert } from 'node:assert'
import { it, describe, beforeEach } from 'node:test'
import 'dotenv/config'
import { axiosAuth, clean } from './utils/index.ts'

const admin = await axiosAuth('test-standalone1@test.com')

describe('agents', () => {
  beforeEach(async () => {
    await clean()
  })

  it('should list agents', async () => {
    const res = await admin.get('/api/agents')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 1)
    assert.equal(res.data.results[0].id, 'back-office-assistant')
    assert.equal(res.data.results[0].name, 'Data Fair Assistant')
  })

  it('should generate text with mock provider', async () => {
    const settingsData = {
      providers: [
        {
          id: 'mock-provider',
          type: 'mock',
          name: 'Mock Provider',
          enabled: true
        }
      ],
      agents: {
        backOfficeAssistant: {
          name: 'Test Assistant',
          prompt: 'You are a test assistant.',
          model: {
            id: 'mock-model',
            name: 'Mock Model',
            provider: {
              type: 'mock',
              name: 'Mock Provider',
              id: 'mock-provider'
            }
          }
        }
      }
    }

    await admin.put('/api/settings/user/test-standalone1', settingsData)

    const res = await admin.post('/api/agents/back-office-assistant/generate-text', {
      prompt: 'hello'
    })
    console.log('Test response:', res.data)
    assert.equal(res.status, 200)
    assert.equal(res.data.text, 'world')
    assert.equal(res.data.finishReason, 'stop')
  })

  it('should generate tool call with mock provider', async () => {
    const settingsData = {
      providers: [
        {
          id: 'mock-provider',
          type: 'mock',
          name: 'Mock Provider',
          enabled: true
        }
      ],
      agents: {
        backOfficeAssistant: {
          name: 'Test Assistant',
          prompt: 'You are a test assistant.',
          model: {
            id: 'mock-model',
            name: 'Mock Model',
            provider: {
              type: 'mock',
              name: 'Mock Provider',
              id: 'mock-provider'
            }
          }
        }
      }
    }

    await admin.put('/api/settings/user/test-standalone1', settingsData)

    const res = await admin.post('/api/agents/back-office-assistant/generate-text', {
      prompt: 'call tool searchDatasets {"query": "test"}'
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.text, '')
    assert.ok(res.data.toolCalls)
    assert.equal(res.data.toolCalls.length, 1)
    assert.equal(res.data.toolCalls[0].toolName, 'searchDatasets')
    assert.deepEqual(res.data.toolCalls[0].args, { query: 'test' })
    assert.equal(res.data.finishReason, 'tool-calls')
  })

  it('should return default response for unknown prompt with mock provider', async () => {
    const settingsData = {
      providers: [
        {
          id: 'mock-provider',
          type: 'mock',
          name: 'Mock Provider',
          enabled: true
        }
      ],
      agents: {
        backOfficeAssistant: {
          name: 'Test Assistant',
          prompt: 'You are a test assistant.',
          model: {
            id: 'mock-model',
            name: 'Mock Model',
            provider: {
              type: 'mock',
              name: 'Mock Provider',
              id: 'mock-provider'
            }
          }
        }
      }
    }

    await admin.put('/api/settings/user/test-standalone1', settingsData)

    const res = await admin.post('/api/agents/back-office-assistant/generate-text', {
      prompt: 'some random message'
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.text, 'what do you mean ?')
    assert.equal(res.data.finishReason, 'stop')
  })

  it('should return 404 for unknown agent', async () => {
    const settingsData = {
      providers: [
        {
          id: 'mock-provider',
          type: 'mock',
          name: 'Mock Provider',
          enabled: true
        }
      ],
      agents: {
        backOfficeAssistant: {
          name: 'Test Assistant',
          prompt: 'You are a test assistant.',
          model: {
            id: 'mock-model',
            name: 'Mock Model',
            provider: {
              type: 'mock',
              name: 'Mock Provider',
              id: 'mock-provider'
            }
          }
        }
      }
    }

    await admin.put('/api/settings/user/test-standalone1', settingsData)

    const res = await admin.post('/api/agents/back-office-assistant/generate-text', {
      prompt: 'hello',
      agentId: 'unknown-agent'
    })
    assert.equal(res.status, 404)
  })

  it('should return 400 when agent not configured', async () => {
    const settingsData = {
      providers: [],
      agents: {}
    }

    await admin.put('/api/settings/user/test-standalone1', settingsData)

    const res = await admin.post('/api/agents/back-office-assistant/generate-text', {
      prompt: 'hello'
    })
    assert.equal(res.status, 400)
  })
})
