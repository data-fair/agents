import { test, expect } from '@playwright/test'
import { createServer, type Server } from 'node:http'
import { superAdmin, clean, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

function startStub (): Promise<{ server: Server, url: string }> {
  return new Promise(resolve => {
    const server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' })
      const id = 'chatcmpl-stub'
      const chunk = (delta: any, finish: any = null) => `data: ${JSON.stringify({ id, object: 'chat.completion.chunk', choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`
      res.write(chunk({ role: 'assistant', reasoning_content: 'I am thinking about it' }))
      res.write(chunk({ content: 'Hello world' }))
      res.write(chunk({}, 'stop'))
      res.write('data: [DONE]\n\n')
      res.end()
    })
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as any).port
      resolve({ server, url: `http://127.0.0.1:${port}/v1` })
    })
  })
}

test('gateway stores the raw upstream request/response (incl. reasoning) when consented', async () => {
  await clean()
  const stub = await startStub()
  try {
    await admin.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'compat', type: 'openai-compatible', name: 'Stub', enabled: true, baseURL: stub.url, apiKey: 'stub-key', compatibility: 'compatible' }],
      models: { assistant: { model: { id: 'glm', name: 'glm', provider: { type: 'openai-compatible', name: 'Stub', id: 'compat' } } } },
      storeTraces: true,
      quotas: defaultQuotas
    })

    const conv = crypto.randomUUID()
    await admin.post('/api/gateway/user/test-standalone1/v1/chat/completions', {
      model: 'assistant',
      stream: true,
      messages: [{ role: 'user', content: 'hi' }]
    }, { headers: { 'x-trace-conversation': conv, 'x-trace-ctx': 'turn:t1', 'x-trace-consent': 'yes' }, responseType: 'text' })

    await expect.poll(async () => {
      const res = await admin.get(`/api/traces/conversation/${conv}`, { validateStatus: () => true })
      if (res.status !== 200) return ''
      return res.data?.results?.[0]?.upstream?.response?.raw ?? ''
    }, { timeout: 10000 }).toContain('I am thinking about it')

    const { data } = await admin.get(`/api/traces/conversation/${conv}`)
    expect(data.results[0].upstream.request.url).toContain('/chat/completions')
    expect(data.results[0].upstream.response.status).toBe(200)
  } finally {
    stub.server.close()
  }
})

test('no upstream is stored when consent is absent', async () => {
  await clean()
  const stub = await startStub()
  try {
    await admin.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'compat', type: 'openai-compatible', name: 'Stub', enabled: true, baseURL: stub.url, apiKey: 'stub-key', compatibility: 'compatible' }],
      models: { assistant: { model: { id: 'glm', name: 'glm', provider: { type: 'openai-compatible', name: 'Stub', id: 'compat' } } } },
      storeTraces: true,
      quotas: defaultQuotas
    })
    const conv = crypto.randomUUID()
    await admin.post('/api/gateway/user/test-standalone1/v1/chat/completions', {
      model: 'assistant', stream: true, messages: [{ role: 'user', content: 'hi' }]
    }, { headers: { 'x-trace-conversation': conv, 'x-trace-ctx': 'turn:t1' /* no consent */ }, responseType: 'text' })
    // nothing is stored without consent → the conversation fetch 404s or is empty
    const res = await admin.get(`/api/traces/conversation/${conv}`, { validateStatus: () => true })
    expect(res.status === 404 || (Array.isArray(res.data) && res.data.length === 0)).toBeTruthy()
  } finally {
    stub.server.close()
  }
})
