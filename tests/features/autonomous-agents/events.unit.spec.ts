/**
 * stateless unit tests for the autonomous agent event channel naming
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { conversationChannel, channelConversationId } from '../../../api/src/autonomous-agent-runtime/operations.ts'

test.describe('conversationChannel', () => {
  test('round-trips a conversation id', () => {
    const channel = conversationChannel('abc123')
    assert.equal(channelConversationId(channel), 'abc123')
  })

  test('is distinct from the conversation LOCK id, which is colon-separated', () => {
    // The lock id is `autonomous-agent-conversation:<id>`. Sharing a spelling between a lock
    // key and a subscribable channel is how one ends up used as the other.
    assert.equal(conversationChannel('abc123').includes(':'), false)
    assert.notEqual(conversationChannel('abc123'), 'autonomous-agent-conversation:abc123')
  })

  test('names the feature in full, so a channel list is readable', () => {
    assert.match(conversationChannel('abc123'), /autonomous-agent/)
  })

  test('rejects a channel belonging to something else', () => {
    assert.equal(channelConversationId('datasets/abc123'), undefined)
    assert.equal(channelConversationId('autonomous-agent-conversations/'), undefined)
    assert.equal(channelConversationId(''), undefined)
  })

  test('rejects a channel with extra path segments rather than guessing', () => {
    // A subscriber must not be able to widen its subscription by appending a segment.
    assert.equal(channelConversationId('autonomous-agent-conversations/abc123/messages'), undefined)
  })
})
