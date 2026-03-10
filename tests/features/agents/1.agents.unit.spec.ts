/**
 * stateless unit tests, validate only pure functions usually imported from files named operations.ts in api/src
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { listAgents, createModel, getTools, createMockLanguageModel } from '../../../api/src/agents/operations.ts'

test.describe('Agents operations - listAgents', () => {
  test('returns list of available agents', () => {
    const agents = listAgents()
    assert.equal(agents.length, 1)
    assert.equal(agents[0].id, 'back-office-assistant')
    assert.equal(agents[0].name, 'Data Fair Assistant')
  })
})

test.describe('Agents operations - createMockLanguageModel', () => {
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
    assert.deepEqual(result.content[0].input, { query: 'test' })
    assert.equal(result.finishReason.unified, 'tool-calls')
  })

  test('returns default response for empty prompt', async () => {
    const model = createMockLanguageModel() as any
    const result = await model.doGenerate({ prompt: '' })
    assert.equal(result.content[0].text, 'what do you mean ?')
  })

  test('handles array prompt with user message', async () => {
    const model = createMockLanguageModel() as any
    const result = await model.doGenerate({ prompt: [{ role: 'user', content: 'hello' }] })
    assert.equal(result.content[0].text, 'world')
  })

  test('handles array prompt with mixed content', async () => {
    const model = createMockLanguageModel() as any
    const result = await model.doGenerate({
      prompt: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: [{ type: 'text', text: 'hello' }] }
      ]
    })
    assert.equal(result.content[0].text, 'world')
  })

  test('handles tool call with empty args', async () => {
    const model = createMockLanguageModel() as any
    const result = await model.doGenerate({ prompt: 'call tool searchDatasets' })
    assert.equal(result.content[0].toolName, 'searchDatasets')
    assert.deepEqual(result.content[0].input, {})
  })
})

test.describe('Agents operations - createModel', () => {
  test('throws for unknown provider type', () => {
    assert.throws(
      () => createModel({ id: 'test', type: 'invalid' as any, name: 'Test', enabled: true }, 'model-id'),
      /Unknown provider type/
    )
  })

  test('returns mock model for mock provider', () => {
    const model = createModel({ id: 'mock', type: 'mock', name: 'Mock', enabled: true }, 'mock-model')
    assert.ok(model)
  })
})

test.describe('Agents operations - getTools', () => {
  test('returns 4 dataset tools', () => {
    const tools = getTools('http://localhost:3200')
    assert.ok(tools.searchDatasets)
    assert.ok(tools.describeDataset)
    assert.ok(tools.searchData)
    assert.ok(tools.aggregateData)
  })

  test('tools have execute method', () => {
    const tools = getTools('http://localhost:3200')
    assert.equal(typeof tools.searchDatasets.execute, 'function')
    assert.equal(typeof tools.describeDataset.execute, 'function')
    assert.equal(typeof tools.searchData.execute, 'function')
    assert.equal(typeof tools.aggregateData.execute, 'function')
  })
})
