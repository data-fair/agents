/**
 * stateless unit tests for mapping a stored autonomous agent message onto the ChatMessage
 * shape the existing transcript component renders
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { autonomousAgentMessageToChat, type StoredConversationMessage } from '../../../ui/src/utils/autonomous-agent-chat-message.ts'

const base: StoredConversationMessage = {
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

  test('a tool call that has produced its output is done', () => {
    const chat = autonomousAgentMessageToChat({
      ...base,
      role: 'assistant',
      pending: false,
      parts: [
        { type: 'text', text: 'x' },
        { type: 'dynamic-tool', toolCallId: 't1', toolName: 'echo', state: 'output-available', input: {}, output: 'r' }
      ]
    })
    assert.deepEqual(chat.toolInvocations, [{ toolCallId: 't1', toolName: 'echo', state: 'done', input: {} }])
  })

  test('a call carries its arguments, so a wait chip can say what it waits for', () => {
    const chat = autonomousAgentMessageToChat({
      ...base,
      role: 'assistant',
      parts: [{ type: 'dynamic-tool', toolCallId: 'w1', toolName: 'wait_for_user_action', state: 'input-available', input: { message: 'Ready.', expecting: 'you to click Create' } }]
    })
    assert.equal((chat.toolInvocations?.[0].input as any).expecting, 'you to click Create')
  })

  test('text from separate steps reads as separate paragraphs, not one run-on sentence', () => {
    const chat = autonomousAgentMessageToChat({
      ...base,
      role: 'assistant',
      parts: [
        { type: 'step-start' },
        { type: 'text', text: 'I found the levels.' },
        { type: 'dynamic-tool', toolCallId: 't1', toolName: 'set_display', state: 'output-available', input: {}, output: 'ok' },
        { type: 'step-start' },
        { type: 'text', text: 'It is on screen now.' }
      ]
    })
    assert.equal(chat.content, 'I found the levels.\n\nIt is on screen now.')
  })

  test('a call still waiting for its output is pending, so the spinner is honest', () => {
    const chat = autonomousAgentMessageToChat({
      ...base,
      role: 'assistant',
      pending: true,
      parts: [{ type: 'dynamic-tool', toolCallId: 't1', toolName: 'echo', state: 'input-available', input: {} }]
    })
    assert.equal(chat.toolInvocations?.[0].state, 'pending')
  })

  test('each call of a parallel step reports its OWN progress', () => {
    // The distinction the AI SDK's per-call states bought. Progress used to be read off the MESSAGE,
    // so every chip in a step waited on the slowest call in it — a finished call kept spinning until
    // the whole turn ended.
    const chat = autonomousAgentMessageToChat({
      ...base,
      role: 'assistant',
      pending: true,
      parts: [
        { type: 'dynamic-tool', toolCallId: 't1', toolName: 'fast', state: 'output-available', input: {}, output: 'r' },
        { type: 'dynamic-tool', toolCallId: 't2', toolName: 'slow', state: 'input-available', input: {} }
      ]
    })
    assert.deepEqual(chat.toolInvocations?.map(i => i.state), ['done', 'pending'])
  })

  test('a FAILED tool call is still shown as done, not as running forever', () => {
    // ChatMessage has no failure state for a tool call. Reporting 'pending' would leave a
    // spinner turning for a call that will never return; the failure is surfaced outside the
    // transcript instead, where its arguments and error can be read.
    const chat = autonomousAgentMessageToChat({
      ...base,
      role: 'assistant',
      pending: true,
      parts: [
        { type: 'text', text: 'x' },
        { type: 'dynamic-tool', toolCallId: 't1', toolName: 'echo', state: 'output-error', input: {}, errorText: 'boom' }
      ]
    })
    assert.equal(chat.toolInvocations?.[0].state, 'done')
  })
})

test.describe('approval states', () => {
  test('a call awaiting approval carries its approval id; a rejected one reads as denied', () => {
    const chat = autonomousAgentMessageToChat({
      ...base,
      role: 'assistant',
      parts: [
        { type: 'dynamic-tool', toolCallId: 'a', toolName: 'wipe', state: 'approval-requested', input: {}, approval: { id: 'ap1' }, toolMetadata: { serverId: 'dev' } } as any,
        { type: 'dynamic-tool', toolCallId: 'b', toolName: 'wipe', state: 'output-denied', input: {}, approval: { id: 'ap2', approved: false } } as any
      ]
    })
    assert.equal(chat.toolInvocations?.[0].state, 'awaiting-approval')
    assert.equal(chat.toolInvocations?.[0].approvalId, 'ap1')
    assert.equal(chat.toolInvocations?.[0].serverId, 'dev')
    assert.equal(chat.toolInvocations?.[1].state, 'denied')
    assert.equal(chat.toolInvocations?.[0].approvalLocked, undefined, 'a closed message is decidable')
  })

  test('a card is locked while the message asking is still being written, and unlocked once it is closed', () => {
    // The server refuses a decision on a pending message (it would be overwritten by the turn's last writes).
    const parts = [{ type: 'dynamic-tool', toolCallId: 'a', toolName: 'wipe', state: 'approval-requested', input: {}, approval: { id: 'ap1' } } as any]
    const finishing = autonomousAgentMessageToChat({ ...base, role: 'assistant', pending: true, parts })
    assert.equal(finishing.toolInvocations?.[0].state, 'awaiting-approval')
    assert.equal(finishing.toolInvocations?.[0].approvalLocked, true)
    const closed = autonomousAgentMessageToChat({ ...base, role: 'assistant', pending: false, parts })
    assert.equal(closed.toolInvocations?.[0].approvalLocked, undefined)
  })
})

test.describe('a sub-agent transcript stored on the message', () => {
  test('becomes the panel of its delegating call', () => {
    const chat = autonomousAgentMessageToChat({
      seq: 2,
      role: 'assistant',
      parts: [
        { type: 'dynamic-tool', toolCallId: 'd1', toolName: 'subagent_analyst', state: 'output-available', input: {}, output: 'summary' },
        {
          type: 'data-subagent',
          data: {
            parentToolCallId: 'd1',
            name: 'subagent_analyst',
            parts: [
              { type: 'dynamic-tool', toolCallId: 'w1', toolName: 'query_data', state: 'output-available', input: {}, output: 'rows' },
              { type: 'text', text: 'Analysis complete' }
            ]
          }
        } as any
      ]
    })
    const panel = chat.subAgentPanels?.d1?.messages[0]
    assert.equal(panel?.content, 'Analysis complete')
    assert.deepEqual(panel?.toolInvocations?.map(call => call.toolName), ['query_data'])
    // and the transcript part is not mistaken for anything of the lead's own
    assert.equal(chat.content, '')
    assert.deepEqual(chat.toolInvocations?.map(call => call.toolName), ['subagent_analyst'])
  })
})
