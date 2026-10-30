/**
 * An approved call whose tool is no longer offered is denied by name. AI SDK 7 skips such a call silently
 * (6 denied it), leaving an approved call with no result after it in what the provider is sent.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import type { ModelMessage } from 'ai'
import { goneApprovedToolNames, denyGoneApprovedTools } from '../../../api/src/conversations/approved-calls.ts'

const asking = (toolName: string, id: string): ModelMessage[] => [
  {
    role: 'assistant',
    content: [
      { type: 'tool-call', toolCallId: `call-${id}`, toolName, input: {} },
      { type: 'tool-approval-request', approvalId: `appr-${id}`, toolCallId: `call-${id}` }
    ]
  } as ModelMessage
]
const responded = (id: string, approved: boolean): ModelMessage =>
  ({ role: 'tool', content: [{ type: 'tool-approval-response', approvalId: `appr-${id}`, approved }] }) as ModelMessage

test.describe('approved calls whose tool is gone (unit)', () => {
  test('an approved call with no result and no tool is named', () => {
    const history = [...asking('wipe', 'a'), responded('a', true)]
    assert.deepEqual(goneApprovedToolNames(history, {}), ['wipe'])
    assert.deepEqual(denyGoneApprovedTools(history, {}), { wipe: { type: 'denied', reason: 'this tool is no longer available' } })
  })

  test('a tool still offered, a denied call and a call with a result are left alone', () => {
    const answered: ModelMessage = { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call-c', toolName: 'done', output: { type: 'text', value: 'ok' } }] } as ModelMessage
    const history = [
      ...asking('offered', 'a'), responded('a', true),
      ...asking('refused', 'b'), responded('b', false),
      ...asking('done', 'c'), responded('c', true), answered
    ]
    assert.deepEqual(goneApprovedToolNames(history, { offered: {} }), [])
    assert.deepEqual(denyGoneApprovedTools(history, { offered: {} }), {})
  })

  test('a call still awaiting its decision is not approved yet', () => {
    assert.deepEqual(goneApprovedToolNames(asking('wipe', 'a'), {}), [])
  })
})
