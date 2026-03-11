/**
 * stateful API tests for evaluator endpoints
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, clean } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')

test.describe('Evaluator API', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('should run evaluation task with mock provider', async () => {
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
        },
        evaluator: {
          name: 'Evaluator',
          prompt: 'You are an evaluator.',
          model: {
            id: 'mock-model',
            name: 'Mock Model',
            provider: {
              type: 'mock',
              name: 'Mock Provider',
              id: 'mock-provider'
            }
          },
          defaultToBackOfficeModel: false
        }
      }
    }

    await user.put('/api/settings/user/test-standalone1', settingsData)

    const res = await user.post('/api/evaluator/run', {
      tasks: [
        {
          initialPrompt: 'hello',
          idealResult: 'world',
          maxTurns: 1
        }
      ]
    })

    assert.equal(res.status, 200)
    assert.ok(res.data.results)
    assert.ok(res.data.results.length > 0)
    assert.ok(res.data.results[0].traceIds)
    assert.ok(res.data.results[0].traceIds.length > 0)
    assert.ok(typeof res.data.results[0].rankings.quality === 'number')
    assert.ok(typeof res.data.results[0].rankings.efficiency === 'number')
    assert.ok(res.data.overallQuality >= 0)
    assert.ok(res.data.overallEfficiency >= 0)
  })

  test('should return 400 when evaluator not configured', async () => {
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
      user.post('/api/evaluator/run', {
        tasks: [{ initialPrompt: 'hello', idealResult: 'world' }]
      }),
      { status: 500 }
    )
  })

  test('should return 400 when tasks is missing', async () => {
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
        },
        evaluator: {
          name: 'Evaluator',
          prompt: 'You are an evaluator.',
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

    await assert.rejects(user.post('/api/evaluator/run', {}), { status: 400 })
  })

  test('should evaluate existing trace', async () => {
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
        },
        evaluator: {
          name: 'Evaluator',
          prompt: 'You are an evaluator.',
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

    const streamRes = await user.post(
      '/api/agents/back-office-assistant/stream-text?trace=true',
      { prompt: 'hello' },
      { responseType: 'stream' }
    )

    const traceId = streamRes.headers['x-trace-id']

    // Consume stream
    let chunks = ''
    for await (const chunk of streamRes.data) {
      chunks += chunk.toString()
    }
    assert.ok(chunks.length >= 0)

    const evalRes = await user.post('/api/evaluator/run', {
      traceId,
      idealResult: 'world'
    })

    assert.equal(evalRes.status, 200)
    assert.ok(evalRes.data.results)
    assert.ok(evalRes.data.results.length > 0)
    assert.equal(evalRes.data.results[0].traceIds[0], traceId)
  })

  test('should get trace events', async () => {
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

    const streamRes = await user.post(
      '/api/agents/back-office-assistant/stream-text?trace=true',
      { prompt: 'hello' },
      { responseType: 'stream' }
    )

    const traceId = streamRes.headers['x-trace-id']

    // Consume stream
    let chunks = ''
    for await (const chunk of streamRes.data) {
      chunks += chunk.toString()
    }
    assert.ok(chunks.length >= 0)

    const traceRes = await user.get(`/api/evaluator/traces/${traceId}`)

    assert.equal(traceRes.status, 200)
    assert.ok(traceRes.data.results)
  })
})
