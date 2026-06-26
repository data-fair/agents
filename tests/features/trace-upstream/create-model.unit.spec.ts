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

// Scaleway and openai-compatible('compatible') route through @ai-sdk/openai-compatible
// (so reasoning_content is captured). Just assert they construct without throwing.
test('createModel builds a scaleway model via the openai-compatible provider', () => {
  const provider = { id: 's', type: 'scaleway', name: 'S', enabled: true, apiKey: 'k', projectId: '83bdc357-6147-460e-a8ac-83e38c087766' } as any
  assert.ok(createModel(provider, 'glm-5.2'))
})

test('createModel builds an openai-compatible model in both compatibility modes', () => {
  const compatible = { id: 'c', type: 'openai-compatible', name: 'C', enabled: true, baseURL: 'http://stub/v1', compatibility: 'compatible' } as any
  const dflt = { id: 'd', type: 'openai-compatible', name: 'D', enabled: true, baseURL: 'http://stub/v1' } as any
  assert.ok(createModel(compatible, 'glm-5.2-scw'))
  assert.ok(createModel(dflt, 'gpt-4o'))
})
