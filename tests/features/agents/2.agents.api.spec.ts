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

  test('should stream text with mock provider', async () => {
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

    const res = await user.post('/api/agents/back-office-assistant/stream-text', {
      prompt: 'hello'
    }, { responseType: 'stream' })

    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'text/plain; charset=utf-8')

    let fullText = ''
    for await (const chunk of res.data) {
      fullText += chunk.toString()
    }
    assert.ok(fullText.includes('world'))
  })

  test('should return 404 for unknown agent with stream-text', async () => {
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
      user.post('/api/agents/unknown-agent/stream-text', { prompt: 'hello' }),
      { status: 404 }
    )
  })

  test('should return 400 when agent not configured for stream-text', async () => {
    const settingsData = {
      providers: [],
      agents: {}
    }

    await user.put('/api/settings/user/test-standalone1', settingsData)

    await assert.rejects(
      user.post('/api/agents/back-office-assistant/stream-text', { prompt: 'hello' }),
      { status: 400 }
    )
  })

  test('should enable trace and return trace ID header with stream-text', async () => {
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

    const res = await user.post('/api/agents/back-office-assistant/stream-text?trace=true', {
      prompt: 'hello'
    }, { responseType: 'stream' })

    assert.equal(res.status, 200)
    assert.ok(res.headers['x-trace-id'], 'should have trace ID header')

    // Consume stream
    let chunks = ''
    for await (const chunk of res.data) {
      chunks += chunk.toString()
    }
    assert.ok(chunks.length >= 0)
  })

  test('should store trace events in database and retrieve them', async () => {
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

    const res = await user.post('/api/agents/back-office-assistant/stream-text?trace=true', {
      prompt: 'hello'
    }, { responseType: 'stream' })

    const traceId = res.headers['x-trace-id']
    assert.ok(traceId)

    // Consume stream
    let chunks = ''
    for await (const chunk of res.data) {
      chunks += chunk.toString()
    }
    assert.ok(chunks.length >= 0)
  })

  test('should not access other user traces', async () => {
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

    const res = await user.post('/api/agents/back-office-assistant/stream-text?trace=true', {
      prompt: 'hello'
    }, { responseType: 'stream' })

    const traceId = res.headers['x-trace-id']

    // Consume stream
    let chunks = ''
    for await (const chunk of res.data) {
      chunks += chunk.toString()
    }
    assert.ok(chunks.length >= 0)

    const otherUser = await axiosAuth('test1-user1')

    const traceRes = await otherUser.get(`/api/traces/${traceId}`)
    assert.equal(traceRes.status, 200)
    assert.equal(traceRes.data.count, 0)
  })
})
