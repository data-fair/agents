/**
 * The driver types into a placeholder and reads turn completion off the Send /
 * Stop button, all matched by their visible text. The chat renders those in the
 * session's locale, so a host application running in French needs French
 * strings — and a mismatch surfaces as an opaque "element not found" rather
 * than as a locale problem, which is why the table is asserted here.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chatDriverStrings } from '../../../lib-sim/chat-driver.ts'

test.describe('chat driver composer strings', () => {
  test('serves the French strings', () => {
    assert.deepEqual(chatDriverStrings('fr'), {
      input: 'Tapez votre message...',
      send: 'Envoyer',
      stop: 'Arrêter'
    })
  })

  test('serves the English strings', () => {
    assert.deepEqual(chatDriverStrings('en'), {
      input: 'Type your message...',
      send: 'Send',
      stop: 'Stop'
    })
  })

  test('names the locales it has when given one it does not', () => {
    // Silently falling back to English would send every simulation in a French
    // host repo into a 15-minute timeout with nothing to explain it.
    assert.throws(
      () => chatDriverStrings('de' as never),
      /unsupported chat locale: de/
    )
  })

  test('every string in the table is one the composer actually renders', () => {
    // The drift guard. AgentChatInput.vue is where these strings come from; a
    // reword there and not here breaks every host repo's simulations at once,
    // and no other test in this suite would notice.
    const source = readFileSync('ui/src/components/agent-chat/AgentChatInput.vue', 'utf8')
    for (const locale of ['fr', 'en'] as const) {
      for (const [key, value] of Object.entries(chatDriverStrings(locale))) {
        assert.ok(source.includes(value), `${locale}.${key}: "${value}" is not in AgentChatInput.vue`)
      }
    }
  })
})
