/**
 * stateless unit tests of how a task's reminder pass adds to its first pass's record of what the model read
 * (mergeRunInputs, api/src/conversations/operations.ts).
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { mergeRunInputs } from '../../../api/src/conversations/operations.ts'

test.describe('mergeRunInputs', () => {
  test('the first pass alone is recorded as it is', () => {
    const first = { systemPrompt: 'p', context: { steps: [{ step: 2, injected: 'n' }] } }
    assert.deepEqual(mergeRunInputs(undefined, first), first)
  })

  test('a reminder pass adds its removals and steps, and keeps the first pass\'s prompt, page context, recap and tools', () => {
    const first = {
      systemPrompt: 'first',
      hostContext: 'page',
      toolDefinitionsRef: 'tools-first',
      context: { recap: { generation: 1, coversUpToSeq: 4 }, removed: [{ toolCallId: 'a', step: 1, reason: 'cleared' as const }], steps: [{ step: 2, injected: 'n' }] }
    }
    const reminder = {
      systemPrompt: 'second',
      toolDefinitionsRef: 'tools-reminder',
      context: { removed: [{ toolCallId: 'a', step: 4, reason: 'cleared' as const }, { toolCallId: 'b', step: 4, reason: 'image-earlier' as const }], steps: [{ step: 4, instructions: 'x' }] }
    }
    assert.deepEqual(mergeRunInputs(first, reminder), {
      systemPrompt: 'first',
      hostContext: 'page',
      toolDefinitionsRef: 'tools-first',
      context: {
        recap: { generation: 1, coversUpToSeq: 4 },
        // `a` was removed from step 1 already: its first step stands
        removed: [{ toolCallId: 'a', step: 1, reason: 'cleared' }, { toolCallId: 'b', step: 4, reason: 'image-earlier' }],
        steps: [{ step: 2, injected: 'n' }, { step: 4, instructions: 'x' }]
      }
    })
  })
})
