/**
 * unit tests for evaluator operations and mock models
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createEvaluatorMockLanguageModel } from '../../../api/src/models/operations.ts'

test.describe('Evaluator Mock Model', () => {
  test('should return quality evaluation when prompted with quality evaluation', async () => {
    const model = createEvaluatorMockLanguageModel() as any

    const result = await model.doGenerate({
      prompt: 'Ideal result: expected response\n\nActual response: actual response',
      system: 'You are evaluating the quality of an AI response. Rate it from 0-100.',
      headers: {}
    })

    const textContent = result.content.find((c: any) => c.type === 'text')?.text
    assert.ok(textContent, 'should have text content')
    assert.ok(textContent.includes('Quality') || textContent.includes('quality'), 'should include quality score')
  })

  test('should return efficiency evaluation when prompted with efficiency', async () => {
    const model = createEvaluatorMockLanguageModel() as any

    const result = await model.doGenerate({
      prompt: 'Conversation trace: [] efficiency analysis',
      system: 'You are analyzing the efficiency of an AI conversation trace. Rate efficiency 0-100.',
      headers: {}
    })

    const textContent = result.content.find((c: any) => c.type === 'text')?.text
    assert.ok(textContent, 'should have text content')
    assert.ok(textContent.includes('Efficiency') || textContent.includes('efficiency'), 'should include efficiency score')
  })

  test('should return tool call for completion check', async () => {
    const model = createEvaluatorMockLanguageModel() as any

    const result = await model.doGenerate({
      prompt: 'Last assistant response: Here is your answer',
      system: 'You are evaluating whether a conversation has reached a satisfactory conclusion.',
      headers: {}
    })

    const toolCall = result.content.find((c: any) => c.type === 'tool-call')
    assert.ok(toolCall, 'should return tool call for completion check')
    assert.equal(toolCall.toolName, 'checkCompletion')
  })

  test('should simulate user response for user simulator', async () => {
    const model = createEvaluatorMockLanguageModel() as any

    const result = await model.doGenerate({
      prompt: [
        { role: 'user', content: 'Hello, I need help' },
        { role: 'assistant', content: 'How can I help you?' }
      ],
      system: 'You are a user interacting with an assistant. Continue the conversation naturally.',
      headers: {}
    })

    const textContent = result.content.find((c: any) => c.type === 'text')?.text
    assert.ok(textContent, 'should have text content')
  })
})
