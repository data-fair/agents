/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, clean } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')

test.describe('Agents API', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('should list agents', async () => {
    const res = await user.get('/api/agents')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 1)
    assert.equal(res.data.results[0].id, 'back-office-assistant')
    assert.equal(res.data.results[0].name, 'Data Fair Assistant')
  })

  test('should generate text with mock provider', async () => {
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

    await user.put('/api/settings/user/test-standalone1', settingsData)

    const res = await user.post('/api/agents/back-office-assistant/generate-text', {
      prompt: 'hello'
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.text, 'world')
    assert.equal(res.data.finishReason, 'stop')
  })

  test('should generate tool call with mock provider', async () => {
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

    await user.put('/api/settings/user/test-standalone1', settingsData)

    const res = await user.post('/api/agents/back-office-assistant/generate-text', {
      prompt: 'call tool searchDatasets {"query": "test"}'
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.text, '')
    assert.ok(res.data.toolCalls)
    assert.equal(res.data.toolCalls.length, 1)
    assert.equal(res.data.toolCalls[0].toolName, 'searchDatasets')
    assert.deepEqual(res.data.toolCalls[0].input, { query: 'test' })
    assert.equal(res.data.finishReason, 'tool-calls')
  })

  test('should return default response for unknown prompt with mock provider', async () => {
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

    await user.put('/api/settings/user/test-standalone1', settingsData)

    const res = await user.post('/api/agents/back-office-assistant/generate-text', {
      prompt: 'some random message'
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.text, 'what do you mean ?')
    assert.equal(res.data.finishReason, 'stop')
  })

  test('should return 404 for unknown agent', async () => {
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

    await user.put('/api/settings/user/test-standalone1', settingsData)

    await assert.rejects(
      user.post('/api/agents/unknown-agent/generate-text', { prompt: 'hello' }),
      { status: 404 }
    )
  })

  test('should return 400 when agent not configured', async () => {
    const settingsData = {
      providers: [],
      agents: {}
    }

    await user.put('/api/settings/user/test-standalone1', settingsData)

    await assert.rejects(
      user.post('/api/agents/back-office-assistant/generate-text', { prompt: 'hello' }),
      { status: 400 }
    )
  })
})
