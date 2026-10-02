/**
 * stateless unit tests for the autonomous agent event channel naming
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { conversationChannel, channelConversationId } from '@agents/shared/conversation-channel'

test.describe('conversationChannel', () => {
  test('round-trips a conversation id', () => {
    const channel = conversationChannel('abc123')
    assert.equal(channelConversationId(channel), 'abc123')
  })

  test('is distinct from the conversation LOCK id, which is colon-separated', () => {
    // The lock id is `conversation:<id>`. Sharing a spelling between a lock
    // key and a subscribable channel is how one ends up used as the other.
    assert.equal(conversationChannel('abc123').includes(':'), false)
    assert.notEqual(conversationChannel('abc123'), 'conversation:abc123')
  })

  test('names conversations, so a channel list is readable', () => {
    // It used to assert the channel named `autonomous-agent`, from when only autonomous agents had
    // conversations. Every chat is one of these now, so the prefix is `conversations/` — and what
    // still matters is the property below, not the word.
    assert.match(conversationChannel('abc123'), /^conversations\//)
  })

  test('rejects a channel belonging to something else', () => {
    assert.equal(channelConversationId('datasets/abc123'), undefined)
    assert.equal(channelConversationId('conversations/'), undefined)
    assert.equal(channelConversationId(''), undefined)
  })

  test('rejects a channel with extra path segments rather than guessing', () => {
    // A subscriber must not be able to widen its subscription by appending a segment.
    assert.equal(channelConversationId('conversations/abc123/messages'), undefined)
  })
})
