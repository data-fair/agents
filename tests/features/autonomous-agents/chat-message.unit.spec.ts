/**
 * stateless unit tests for mapping a stored autonomous agent message onto the ChatMessage
 * shape the existing transcript component renders
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { autonomousAgentMessageToChat, autonomousAgentMessagesToChat, mergeBySeq, type StoredAutonomousAgentMessage } from '@agents/shared/autonomous-agent-chat-message'

const base: StoredAutonomousAgentMessage = {
  seq: 1,
  role: 'user'
}

test.describe('autonomousAgentMessageToChat', () => {
  test('carries role and content through', () => {
    const chat = autonomousAgentMessageToChat({ ...base, parts: [{ type: 'text', text: 'hello' }] })
    assert.equal(chat.role, 'user')
    assert.equal(chat.content, 'hello')
  })

  test('a message with no parts maps to an empty string, never undefined', () => {
    // ChatMessage.content is required and the renderer indexes into it; a pending assistant
    // message legitimately has none yet.
    const chat = autonomousAgentMessageToChat({ ...base, role: 'assistant' })
    assert.equal(chat.content, '')
  })

  test('reasoning is carried so the foldable panel can show it', () => {
    const chat = autonomousAgentMessageToChat({
      ...base, parts: [{ type: 'text', text: 'x' }, { type: 'reasoning', text: 'thinking' }]
    })
    assert.equal(chat.reasoning, 'thinking')
  })

  test('a tool call of a FINISHED message is done, not pending', () => {
    const chat = autonomousAgentMessageToChat({
      ...base,
      role: 'assistant',
      pending: false,
      parts: [{ type: 'text', text: 'x' }, { type: 'tool-call', toolCallId: 't1', toolName: 'echo' }]
    })
    assert.deepEqual(chat.toolInvocations, [{ toolCallId: 't1', toolName: 'echo', state: 'done' }])
  })

  test('a tool call of a PENDING message is pending, so the spinner is honest', () => {
    const chat = autonomousAgentMessageToChat({
      ...base, role: 'assistant', pending: true, parts: [{ type: 'tool-call', toolCallId: 't1', toolName: 'echo' }]
    })
    assert.equal(chat.toolInvocations?.[0].state, 'pending')
  })

  test('a FAILED tool call is still shown as done, not as running forever', () => {
    // ChatMessage has no failure state for a tool call. Reporting 'pending' would leave a
    // spinner turning for a call that will never return; the failure is surfaced outside the
    // transcript instead.
    const chat = autonomousAgentMessageToChat({
      ...base,
      role: 'assistant',
      pending: true,
      parts: [
        { type: 'text', text: 'x' },
        { type: 'tool-call', toolCallId: 't1', toolName: 'echo' },
        // The failure lives on the RESULT now, because the model was handed the error as the tool's
        // answer — so the pair exists and the history stays replayable.
        { type: 'tool-result', toolCallId: 't1', toolName: 'echo', failed: true, error: 'boom' }
      ]
    })
    assert.equal(chat.toolInvocations?.[0].state, 'done')
  })

  test('a tool call with no id still renders rather than being dropped', () => {
    const chat = autonomousAgentMessageToChat({
      ...base, role: 'assistant', parts: [{ type: 'text', text: 'x' }, { type: 'tool-call', toolName: 'echo' }]
    })
    assert.equal(chat.toolInvocations?.length, 1)
    assert.equal(typeof chat.toolInvocations?.[0].toolCallId, 'string')
    assert.ok(chat.toolInvocations![0].toolCallId.length > 0)
  })

  test('maps a list in seq order regardless of input order', () => {
    const chats = autonomousAgentMessagesToChat([
      { ...base, seq: 2, parts: [{ type: 'text', text: 'second' }] },
      { ...base, seq: 1, parts: [{ type: 'text', text: 'first' }] }
    ])
    assert.deepEqual(chats.map(c => c.content), ['first', 'second'])
  })
})

test.describe('mergeBySeq', () => {
  test('replaces a message that came back updated, rather than duplicating it', () => {
    // The whole point of ?sinceVersion=: an in-place update returns the SAME seq.
    const existing: StoredAutonomousAgentMessage[] = [
      { ...base, seq: 1, parts: [{ type: 'text', text: 'hello' }] },
      { ...base, seq: 2, parts: [], pending: true }
    ]
    const merged = mergeBySeq(existing, [{ ...base, seq: 2, parts: [{ type: 'text', text: 'world' }], pending: false }])
    assert.equal(merged.length, 2)
    assert.deepEqual(merged[1].parts, [{ type: 'text', text: 'world' }])
    assert.equal(merged[1].pending, false)
  })

  test('appends a genuinely new message', () => {
    const merged = mergeBySeq<StoredAutonomousAgentMessage>([{ ...base, seq: 1 }], [{ ...base, seq: 2 }])
    assert.deepEqual(merged.map(m => m.seq), [1, 2])
  })

  test('keeps the result sorted by seq even when an update arrives out of order', () => {
    const merged = mergeBySeq<StoredAutonomousAgentMessage>([{ ...base, seq: 2 }], [{ ...base, seq: 1 }])
    assert.deepEqual(merged.map(m => m.seq), [1, 2])
  })

  test('an empty incoming batch changes nothing', () => {
    const existing: StoredAutonomousAgentMessage[] = [{ ...base, seq: 1 }]
    assert.deepEqual(mergeBySeq(existing, []), existing)
  })
})
