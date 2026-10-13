/**
 * Unit tests for the mock model's minimal token estimator. The mock has no real
 * tokenizer; it approximates ~4 characters per token so dev/test traces show
 * non-zero, length-proportional token counts instead of always 0.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createMockLanguageModel, estimateMockTokens } from '../../../api/src/models/mock-model.ts'

test.describe('mock model token estimation (unit)', () => {
  test('estimateMockTokens approximates ~4 chars per token, rounding up', () => {
    assert.equal(estimateMockTokens(''), 0)
    assert.equal(estimateMockTokens('abcd'), 1) // ceil(4/4)
    assert.equal(estimateMockTokens('world'), 2) // ceil(5/4)
    assert.equal(estimateMockTokens('a'.repeat(40)), 10)
  })

  test('doGenerate reports non-zero input/output usage proportional to text', async () => {
    const model = createMockLanguageModel('mock-model')
    const prompt = [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }]
    const res = await (model as any).doGenerate({ prompt })
    // output is 'world' → ceil(5/4) = 2
    assert.equal(res.usage.outputTokens.total, 2)
    // input is the serialized prompt → matches the estimator over its JSON form
    assert.equal(res.usage.inputTokens.total, estimateMockTokens(JSON.stringify(prompt)))
    assert.ok(res.usage.inputTokens.total > 0)
  })

  test('tool-call responses also report non-zero input/output usage', async () => {
    const model = createMockLanguageModel('mock-model')
    const prompt = [{ role: 'user', content: [{ type: 'text', text: 'call tool foo {"x":1}' }] }]
    const res = await (model as any).doGenerate({ prompt })
    assert.equal(res.finishReason.unified, 'tool-calls')
    assert.ok(res.usage.outputTokens.total > 0)
    assert.ok(res.usage.inputTokens.total > 0)
  })

  test('doStream emits the same non-zero usage on the finish part', async () => {
    const model = createMockLanguageModel('mock-model')
    const prompt = [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }]
    const { stream } = await (model as any).doStream({ prompt })
    const reader = stream.getReader()
    let finishUsage: any
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      if (value.type === 'finish') finishUsage = value.usage
    }
    assert.equal(finishUsage.outputTokens.total, 2) // 'world'
    assert.equal(finishUsage.inputTokens.total, estimateMockTokens(JSON.stringify(prompt)))
  })

  test('a stream cancelled mid-text stops pushing, instead of crashing the process', async () => {
    // AI SDK 7 cancels the model stream when a turn is aborted; the pending character timer then
    // enqueued into a closed controller, an uncaught exception that took the whole dev server down.
    const crashes: Error[] = []
    const onCrash = (err: Error) => { crashes.push(err) }
    process.on('uncaughtException', onCrash)
    try {
      const model = createMockLanguageModel('mock-model')
      const prompt = [{ role: 'user', content: [{ type: 'text', text: 'long answer' }] }]
      const { stream } = await (model as any).doStream({ prompt })
      const reader = stream.getReader()
      await reader.read()
      await reader.read()
      await reader.cancel()
      await new Promise(resolve => setTimeout(resolve, 60))
    } finally {
      process.off('uncaughtException', onCrash)
    }
    assert.deepEqual(crashes.map(e => e.message), [])
  })
})
