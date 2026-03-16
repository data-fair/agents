/**
 * stateless unit tests, validate only pure functions usually imported from files named operations.ts in api/src
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createModel, createMockLanguageModel } from '../../../api/src/models/operations.ts'

test.describe('Model operations - createMockLanguageModel', () => {
  test('returns "world" for prompt "hello"', async () => {
    const model = createMockLanguageModel() as any
    const result = await model.doGenerate({ prompt: 'hello' })
    assert.equal(result.content[0].text, 'world')
    assert.equal(result.finishReason.unified, 'stop')
  })

  test('returns default response for unknown prompt', async () => {
    const model = createMockLanguageModel() as any
    const result = await model.doGenerate({ prompt: 'some random message' })
    assert.equal(result.content[0].text, 'what do you mean ?')
    assert.equal(result.finishReason.unified, 'stop')
  })

  test('parses tool call from prompt', async () => {
    const model = createMockLanguageModel() as any
    const result = await model.doGenerate({ prompt: 'call tool searchDatasets {"query": "test"}' })
    assert.equal(result.content[0].toolName, 'searchDatasets')
  })

  test('returns default response for empty prompt', async () => {
    const model = createMockLanguageModel() as any
    const result = await model.doGenerate({ prompt: '' })
    assert.equal(result.content[0].text, 'what do you mean ?')
  })

  test('handles array prompt with user message', async () => {
    const model = createMockLanguageModel() as any
    const result = await model.doGenerate({
      prompt: [{ role: 'user', content: 'hello' }]
    })
    assert.equal(result.content[0].text, 'world')
  })

  test('handles array prompt with mixed content', async () => {
    const model = createMockLanguageModel() as any
    const result = await model.doGenerate({
      prompt: [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'Hi!' },
        { role: 'user', content: 'call tool searchData {"test": true}' }
      ]
    })
    assert.equal(result.content[0].toolName, 'searchData')
  })

  test('handles tool call with empty args', async () => {
    const model = createMockLanguageModel() as any
    const result = await model.doGenerate({ prompt: 'call tool myTool' })
    assert.equal(result.content[0].toolName, 'myTool')
  })
})

test.describe('Model operations - createModel', () => {
  test('throws for unknown provider type', () => {
    assert.throws(
      () => createModel({ type: 'unknown' } as any, 'model-id'),
      /Unknown provider type: unknown/
    )
  })

  test('returns mock model for mock provider', () => {
    const model = createModel({ type: 'mock', id: 'mock', name: 'Mock', enabled: true }, 'mock-model')
    assert.ok(model)
  })
})
