import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { buildEvaluatorDataTools } from '../../../ui/src/traces/evaluator-data-tools.ts'

test.describe('evaluator data tools (unit)', () => {
  test('list_datasets injects the account owner filter', async () => {
    const calls: any[] = []
    const tools = buildEvaluatorDataTools({
      accountType: 'organization',
      accountId: 'koumoul',
      dataFairApiPath: '/x',
      apiFetch: async (path, o) => { calls.push({ path, query: o?.query }); return { results: [], count: 0 } }
    })
    await (tools.list_datasets as any).execute({}, {})
    assert.equal(calls[0].path, 'datasets')
    assert.equal(calls[0].query.owner, 'organization:koumoul')
  })

  test('owner filter includes department when present', async () => {
    const calls: any[] = []
    const tools = buildEvaluatorDataTools({
      accountType: 'organization',
      accountId: 'koumoul',
      department: 'dep1',
      dataFairApiPath: '/x',
      apiFetch: async (_path, o) => { calls.push({ query: o?.query }); return { results: [] } }
    })
    await (tools.list_datasets as any).execute({}, {})
    assert.equal(calls[0].query.owner, 'organization:koumoul:dep1')
  })

  test('a fetch failure degrades gracefully instead of throwing', async () => {
    const tools = buildEvaluatorDataTools({
      accountType: 'user',
      accountId: 'u1',
      dataFairApiPath: '/x',
      apiFetch: async () => { const e: any = new Error('nope'); e.response = { status: 404 }; throw e }
    })
    const res = await (tools.list_datasets as any).execute({}, {})
    assert.match(res, /unavailable/i)
    assert.match(res, /404/)
  })
})
