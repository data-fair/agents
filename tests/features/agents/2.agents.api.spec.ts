/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import WebSocket from 'ws'
import { axiosAuth, clean, directoryUrl } from '../../support/axios.ts'

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

  test('should connect via WebSocket and exchange messages', async () => {
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

    const wsUrl = `ws://localhost:${process.env.DEV_API_PORT}/agents/api/agents/back-office-assistant/chat`
    const ws = new WebSocket(wsUrl, { headers: { cookie: await user.cookieJar.getCookieString(directoryUrl) } })

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for init-state-ok')), 5000)
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString())
        if (msg.type === 'ready') {
          ws.send(JSON.stringify({ type: 'init-state', history: [], tools: [] }))
        }
        if (msg.type === 'init-state-ok') {
          clearTimeout(timeout)
          resolve()
        }
      })
      ws.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })

    ws.close()
  })
})
