/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */

import { test } from 'playwright/test'
import WebSocket from 'ws'
import { axiosAuth, clean, directoryUrl } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')

test.describe('Chat API', () => {
  test.beforeEach(async () => {
    await clean()
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
      chatModel: {
        id: 'mock-model',
        name: 'Mock Model',
        provider: {
          type: 'mock',
          name: 'Mock Provider',
          id: 'mock-provider'
        }
      }
    }

    await user.put('/api/settings/user/test-standalone1', settingsData)

    const wsUrl = `ws://localhost:${process.env.DEV_API_PORT}/api/chat`
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
