/**
 * stateless unit tests for the global AI config validation
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { assertGlobalAiConfig, type GlobalAiProvider, type GlobalAiModel } from '../../../api/src/models/operations.ts'

const providers: GlobalAiProvider[] = [
  { type: 'mock', id: 'global-mock', name: 'Global Mock' },
  { type: 'openai-compatible', id: 'global-oc', name: 'Global OC', baseURL: 'http://localhost:1234/v1' }
]
const models: GlobalAiModel[] = [
  { id: 'mock-model', name: 'Mock Model', provider: 'global-mock', usage: ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator'], multiplier: 1 }
]

test.describe('assertGlobalAiConfig', () => {
  test('accepts a consistent config', () => {
    assertGlobalAiConfig(providers, models, { assistant: { provider: 'global-mock', id: 'mock-model' } })
  })
  test('rejects duplicate provider ids', () => {
    assert.throws(() => assertGlobalAiConfig([providers[0], { ...providers[1], id: 'global-mock' }], [], {}), /duplicate global provider id/)
  })
  test('rejects ollama/openai-compatible without baseURL', () => {
    assert.throws(() => assertGlobalAiConfig([{ type: 'ollama', id: 'o', name: 'O' }], [], {}), /requires baseURL/)
  })
  test('rejects duplicate model keys', () => {
    assert.throws(() => assertGlobalAiConfig(providers, [models[0], { ...models[0] }], {}), /duplicate global model/)
  })
  test('rejects model referencing unknown provider', () => {
    assert.throws(() => assertGlobalAiConfig(providers, [{ ...models[0], provider: 'nope' }], {}), /unknown provider/)
  })
  test('rejects defaultModels referencing unknown model', () => {
    assert.throws(() => assertGlobalAiConfig(providers, models, { assistant: { provider: 'global-mock', id: 'nope' } }), /unknown global model/)
  })
  test('rejects defaultModels whose model lacks the usage flag', () => {
    const narrow: GlobalAiModel[] = [{ ...models[0], usage: ['summarizer'] }]
    assert.throws(() => assertGlobalAiConfig(providers, narrow, { assistant: { provider: 'global-mock', id: 'mock-model' } }), /not flagged for usage/)
  })
})
