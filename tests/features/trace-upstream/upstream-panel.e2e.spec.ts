import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { createServer, type Server } from 'node:http'
import { superAdmin, clean, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

function startStub (): Promise<{ server: Server, url: string }> {
  return new Promise(resolve => {
    const server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' })
      const c = (delta: any, finish: any = null) => `data: ${JSON.stringify({ id: 'x', object: 'chat.completion.chunk', choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`
      res.write(c({ role: 'assistant', reasoning_content: 'thinking deeply' }))
      res.write(c({ content: 'Hi' }))
      res.write(c({}, 'stop'))
      res.write('data: [DONE]\n\n'); res.end()
    })
    server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${(server.address() as any).port}/v1` }))
  })
}

test('the upstream provider panel renders for a captured trace', async ({ page, goToWithAuth }) => {
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
    await admin.post('/api/gateway/user/test-standalone1/v1/chat/completions', { model: 'assistant', stream: true, messages: [{ role: 'user', content: 'hi' }] }, { headers: { 'x-trace-conversation': conv, 'x-trace-ctx': 'turn:t1', 'x-trace-consent': 'yes' }, responseType: 'text' })
    await expect.poll(async () => (await admin.get(`/api/traces/conversation/${conv}`)).data?.results?.length ?? 0, { timeout: 10000 }).toBeGreaterThan(0)

    await goToWithAuth(`/agents/user/test-standalone1/traces/${conv}`, 'test-standalone1')
    // Switch to "Raw" mode to expose physical-request entries (hidden in default "Interpreted" mode)
    await page.getByRole('button', { name: 'Raw' }).click()
    // expand the physical-request entry (details + upstream panel lazy-load on expand)
    await page.locator('.v-expansion-panel-title', { hasText: 'physical-request' }).first().click()
    await expect(page.getByText('Upstream (provider)').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('thinking deeply')).toBeVisible({ timeout: 10000 })
  } finally {
    stub.server.close()
  }
})
