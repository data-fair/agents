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
  { id: 'mock-model', name: 'Mock Model', provider: 'global-mock', usage: ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator'], multiplier: 1, inputPricePerMillion: 0.4, outputPricePerMillion: 0.8 }
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
  test('rejects a model with no input price', () => {
    const { inputPricePerMillion, ...noInput } = models[0]
    assert.throws(() => assertGlobalAiConfig(providers, [noInput as GlobalAiModel], {}), /global-mock\/mock-model.*requires inputPricePerMillion/)
  })
  test('rejects a model with no output price', () => {
    const { outputPricePerMillion, ...noOutput } = models[0]
    assert.throws(() => assertGlobalAiConfig(providers, [noOutput as GlobalAiModel], {}), /global-mock\/mock-model.*requires outputPricePerMillion/)
  })
  test('accepts a zero price — free is a legitimate price, absent is not', () => {
    assertGlobalAiConfig(providers, [{ ...models[0], inputPricePerMillion: 0, outputPricePerMillion: 0 }], {})
  })
})
