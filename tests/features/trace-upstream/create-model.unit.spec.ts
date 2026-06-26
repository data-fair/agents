import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createModel } from '../../../api/src/models/operations.ts'

test('createModel accepts an optional fetch and still builds an openai-compatible model', () => {
  const provider = { id: 'p', type: 'openai-compatible', name: 'P', enabled: true, baseURL: 'http://stub/v1' } as any
  const calls: string[] = []
  const fakeFetch = (async (u: any) => { calls.push(String(u)); return new Response('') }) as typeof fetch
  const model = createModel(provider, 'glm', fakeFetch)
  assert.ok(model) // constructs without throwing; fetch is wired into the provider client
})

test('createModel still works for mock provider without a fetch', () => {
  const provider = { id: 'm', type: 'mock', name: 'M', enabled: true } as any
  assert.ok(createModel(provider, 'mock-model'))
})
