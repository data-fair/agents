/**
 * stateless unit tests for the wait handover: what `wait_for_user_action` shows the person.
 *
 * Ported from main's stream-part builder tests (#73, #75), which tested the same rule in the browser
 * loop. The loop is server-side now, and the rule became a pure function the loop calls when it
 * records the call — so the cases are the same, against the new seam.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { repairWaitInput, waitHandover } from '../../../shared/host-events.ts'

test.describe('waitHandover', () => {
  test('a wait shows its message when the step wrote none', () => {
    assert.equal(
      waitHandover('', { message: 'Le formulaire est prêt : appuyez sur Enregistrer.', expecting: 'Clic sur Enregistrer' }),
      'Le formulaire est prêt : appuyez sur Enregistrer.'
    )
  })

  test('a wait does not repeat a message the step already wrote', () => {
    // A model that writes the handover as text AND passes it as the message must not show it twice.
    assert.equal(waitHandover('Le formulaire est prêt : appuyez sur Enregistrer.', { message: 'appuyez sur Enregistrer.', expecting: 'x' }), null)
  })

  test('a wait adds its message after text that does not say it, with one blank line between', () => {
    assert.equal(waitHandover('Voilà.', { message: 'Appuyez sur Enregistrer.', expecting: 'x' }), '\n\nAppuyez sur Enregistrer.')
    // Trailing whitespace in the step's text does not count as text, nor multiply the separator: the
    // loop trims the step's text before appending, and this returns one separator either way.
    assert.equal(waitHandover('Voilà.\n\n', { message: 'Appuyez sur Enregistrer.', expecting: 'x' }), '\n\nAppuyez sur Enregistrer.')
    assert.equal(waitHandover('   ', { message: 'Appuyez.', expecting: 'x' }), 'Appuyez.')
  })

  test('nothing to add for a wait without a message', () => {
    // The tool refuses such a wait (it must be retried with a message), so there is no handover to
    // show for the refused call either.
    assert.equal(waitHandover('Voilà.', { expecting: 'x' }), null)
    assert.equal(waitHandover('', {}), null)
    assert.equal(waitHandover('', undefined), null)
  })

  test('repairs the other arguments swallowed into the wait message', () => {
    // The exact arguments a Haiku run sent (JSON-decoded once, as the tool receives them).
    const raw = JSON.parse(String.raw`{"message":"Parfait ! J'ai créé les 11 champs :\\n\\n**Contact :** Email\\n\\nCliquez sur « Enregistrer ».\",\"expecting\":\"Enregistrement de la structure\",\"timeoutSeconds\":300"}`)
    const repaired = repairWaitInput(raw)
    assert.equal(repaired.message, "Parfait ! J'ai créé les 11 champs :\n\n**Contact :** Email\n\nCliquez sur « Enregistrer ».")
    assert.equal(repaired.expecting, 'Enregistrement de la structure')
    assert.equal(repaired.timeoutSeconds, 300)
    // And the handover shows the repaired message, never the swallowed JSON tail.
    const shown = waitHandover('', raw)
    assert.ok(shown && !shown.includes('expecting'), String(shown))
  })

  test('leaves well-formed wait arguments alone', () => {
    const input = { message: 'Appuyez sur "Enregistrer".', expecting: 'Clic', timeoutSeconds: 120 }
    assert.deepEqual(repairWaitInput(input), input)
  })
})
