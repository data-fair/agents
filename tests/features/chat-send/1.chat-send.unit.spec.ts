/**
 * Both send guards used to `return` on a busy turn, dropping the message with no
 * trace: the composer kept the text, nothing was emitted, and nothing said why.
 *
 * A judged simulation lost six of its nine turns to it. The composer only offers
 * Send while a wait is armed, so a person rarely meets the guard — but the flag
 * can flip between the button being found and the click handler running, and the
 * message then falls into the gap. Queued instead of dropped, that race is
 * harmless.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { canSendNow } from '../../../ui/src/composables/chat-send.ts'

test.describe('canSendNow', () => {
  test('an idle chat takes the message', () => {
    assert.equal(canSendNow(false, false), true)
  })

  test('a turn paused on a declared wait takes it too, and the wait settles', () => {
    assert.equal(canSendNow(true, true), true)
  })

  test('a turn that is genuinely working does not', () => {
    assert.equal(canSendNow(true, false), false)
  })
})
