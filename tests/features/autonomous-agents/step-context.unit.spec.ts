/**
 * stateless unit tests of context management BETWEEN the steps of a turn (api/src/conversations/step-context.ts):
 * live results bounded like stored ones, old results cleared when the step would not fit, and cleared for good.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import type { ModelMessage } from 'ai'
import { createStepContext } from '../../../api/src/conversations/step-context.ts'
import { TOOL_RESULT_LIMIT } from '../../../api/src/conversations/operations.ts'

const call = (id: string): ModelMessage => ({ role: 'assistant', content: [{ type: 'tool-call', toolCallId: id, toolName: 'bulk', input: {} }] })
const result = (id: string, chars: number): ModelMessage => ({ role: 'tool', content: [{ type: 'tool-result', toolCallId: id, toolName: 'bulk', output: { type: 'text', value: 'b'.repeat(chars) } }] })
const exchange = (n: number, chars: number) => Array.from({ length: n }, (_, i) => [call(`c${i}`), result(`c${i}`, chars)]).flat()
const outputOf = (messages: ModelMessage[], id: string) => ((messages.find(m => m.role === 'tool' && (m.content as any)[0].toolCallId === id)!.content as any)[0].output.value as string)

test.describe('createStepContext', () => {
  test('under budget, the messages are sent as they are', () => {
    const messages = [{ role: 'user', content: 'go' } as ModelMessage, ...exchange(2, 100)]
    assert.deepEqual(createStepContext(100_000)(messages), messages)
  })

  test('a live result over the stored bound is cut like the stored one', () => {
    const step = createStepContext(1_000_000)
    const out = step([{ role: 'user', content: 'go' }, ...exchange(1, TOOL_RESULT_LIMIT + 10)])
    assert.match(outputOf(out, 'c0'), /rest of this result dropped to free context/)
  })

  test('over budget, the oldest results are cleared and the last three kept', () => {
    // 6 x 20,000 chars is ~30,000 tokens (4 chars per token) against a 20,000-token budget
    const out = createStepContext(20_000)([{ role: 'user', content: 'go' }, ...exchange(6, 20_000)])
    for (const id of ['c0', 'c1', 'c2']) assert.match(outputOf(out, id), /^\[earlier result of bulk removed to free context/)
    for (const id of ['c3', 'c4', 'c5']) assert.equal(outputOf(out, id).length, 20_000)
  })

  test('a result cleared at one step stays cleared, identically, at the next', () => {
    const step = createStepContext(20_000)
    const first = step([{ role: 'user', content: 'go' }, ...exchange(6, 20_000)])
    // The loop guards rebuild each step from the FULL responses: the next step arrives uncleared, one exchange longer.
    const second = step([{ role: 'user', content: 'go' }, ...exchange(7, 20_000)])
    assert.match(outputOf(first, 'c0'), /^\[earlier result/)
    assert.equal(outputOf(second, 'c0'), outputOf(first, 'c0'))
    assert.deepEqual(second.slice(0, first.length - 6), first.slice(0, first.length - 6))
  })

  test('a cleared result that was also over the stored bound keeps the same placeholder', () => {
    const step = createStepContext(20_000)
    const big = TOOL_RESULT_LIMIT + 5000
    const first = step([{ role: 'user', content: 'go' }, ...exchange(6, big)])
    const second = step([{ role: 'user', content: 'go' }, ...exchange(7, big)])
    assert.equal(outputOf(second, 'c0'), outputOf(first, 'c0'))
  })

  test('a placeholder the turn history already wrote survives a mid-turn clear byte-identical', () => {
    const placeholder = '[earlier result of bulk from srv removed to free context — 20026 chars. Call the tool again if you still need it.]'
    const pre: ModelMessage = { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'p0', toolName: 'bulk', output: { type: 'text', value: placeholder } }] }
    const out = createStepContext(20_000)([{ role: 'user', content: 'go' }, call('p0'), pre, ...exchange(6, 20_000)])
    assert.equal(outputOf(out, 'p0'), placeholder)
    assert.match(outputOf(out, 'c0'), /^\[earlier result of bulk removed/)
  })

  test('no budget (a model without a known window): nothing is cleared, results are still bounded', () => {
    const out = createStepContext(0)([{ role: 'user', content: 'go' }, ...exchange(6, 20_000)])
    assert.equal(outputOf(out, 'c0').length, 20_000)
  })
})
