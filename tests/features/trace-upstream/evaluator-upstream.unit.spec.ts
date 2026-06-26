import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { buildEvaluatorTools } from '../../../ui/src/traces/evaluator-tools.ts'

function fakeRecorder (upstream: any) {
  return { getUpstreamExchange: (i: number) => (i === 3 ? upstream : null) } as any
}

test('getUpstreamExchange returns request+raw response for a captured entry', async () => {
  const tools = buildEvaluatorTools(fakeRecorder({ request: { url: 'http://x/v1/chat/completions', body: { model: 'glm' }, bodyChars: 14 }, response: { status: 200, raw: 'reasoning bytes', rawChars: 15 } }), { accountType: 'user', accountId: 'u', apiPath: '/api' })
  const out = await (tools.getUpstreamExchange as any).execute({ index: 3 })
  assert.equal(out.includes('reasoning bytes'), true)
  assert.equal(out.includes('/chat/completions'), true)
})

test('getUpstreamExchange explains when no upstream was captured', async () => {
  const tools = buildEvaluatorTools(fakeRecorder(null), { accountType: 'user', accountId: 'u', apiPath: '/api' })
  const out = await (tools.getUpstreamExchange as any).execute({ index: 3 })
  assert.equal(/no upstream/i.test(out), true)
})
