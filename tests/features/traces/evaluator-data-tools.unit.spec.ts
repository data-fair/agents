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

  test('search_data fetches by datasetId and returns formatted text (no owner filter)', async () => {
    const calls: any[] = []
    const tools = buildEvaluatorDataTools({
      accountType: 'user',
      accountId: 'u1',
      dataFairApiPath: '/x',
      apiFetch: async (path, o) => { calls.push({ path, query: o?.query }); return { total: 0, results: [] } }
    })
    const res = await (tools.search_data as any).execute({ datasetId: 'ds1' }, {})
    assert.equal(calls[0].path, 'datasets/ds1/lines')
    assert.equal(calls[0].query.owner, undefined)
    assert.equal(typeof res, 'string')
  })

  test('get_dataset_schema issues both the schema and samples requests', async () => {
    const paths: string[] = []
    const tools = buildEvaluatorDataTools({
      accountType: 'user',
      accountId: 'u1',
      dataFairApiPath: '/x',
      apiFetch: async (path) => { paths.push(path); return path.endsWith('/lines') ? { results: [] } : { schema: [], title: 'T', slug: 's' } }
    })
    await (tools.get_dataset_schema as any).execute({ datasetId: 'ds1' }, {})
    assert.ok(paths.includes('datasets/ds1'))
    assert.ok(paths.includes('datasets/ds1/lines'))
  })

  test('search_data follows a next URL directly without rebuilding the query', async () => {
    const calls: any[] = []
    const tools = buildEvaluatorDataTools({
      accountType: 'user',
      accountId: 'u1',
      dataFairApiPath: '/x',
      apiFetch: async (path, o) => { calls.push({ path, query: o?.query }); return { total: 0, results: [] } }
    })
    // data-fair returns an absolute next URL; it must be passed straight through
    // (ofetch leaves absolute URLs untouched by baseURL).
    const next = 'https://data-fair.test/data-fair/api/v1/datasets/ds1/lines?after=42'
    await (tools.search_data as any).execute({ datasetId: 'ds1', next }, {})
    assert.equal(calls[0].path, next)
    assert.equal(calls[0].query, undefined)
  })

  test('the default data-fair client tags requests with x-client: agents', async () => {
    const originalFetch = globalThis.fetch
    let sentClient: string | null = null
    globalThis.fetch = (async (input: any, init: any) => {
      const headers = new Headers(init?.headers ?? input?.headers)
      sentClient = headers.get('x-client')
      return new Response(JSON.stringify({ results: [], count: 0 }), { status: 200, headers: { 'content-type': 'application/json' } })
    }) as any
    try {
      const tools = buildEvaluatorDataTools({ accountType: 'user', accountId: 'u1', dataFairApiPath: '/x' })
      await (tools.list_datasets as any).execute({}, {})
    } finally {
      globalThis.fetch = originalFetch
    }
    assert.equal(sentClient, 'agents')
  })

  test('get_dataset_metadata_raw returns the full dataset JSON with no select', async () => {
    const calls: any[] = []
    const tools = buildEvaluatorDataTools({
      accountType: 'user',
      accountId: 'u1',
      dataFairApiPath: '/x',
      apiFetch: async (path, o) => { calls.push({ path, query: o?.query }); return { id: 'ds1', title: 'T', schema: [] } }
    })
    const res = await (tools.get_dataset_metadata_raw as any).execute({ datasetId: 'ds1' }, {})
    assert.equal(calls[0].path, 'datasets/ds1')
    assert.equal(calls[0].query, undefined)
    assert.match(res, /"id": "ds1"/)
  })
})
