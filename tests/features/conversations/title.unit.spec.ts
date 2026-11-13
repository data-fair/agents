/**
 * stateless unit tests: what a conversation's title call reads, and how its answer is cleaned
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { titleInput, cleanTitle } from '../../../api/src/conversations/operations.ts'

test.describe('conversation titles', () => {
  test('the title call reads the first message and the first answer, as text, bounded', () => {
    const input = titleInput([
      { role: 'user', parts: [{ type: 'text', text: 'list the road closures ' + 'x'.repeat(3000) }] },
      { role: 'assistant', parts: [{ type: 'reasoning', text: 'hidden' }, { type: 'text', text: 'Here they are.' }] }
    ])!
    assert.match(input, /^<conversation>\nPerson: list the road closures x+…\n\nAssistant: Here they are\.\n<\/conversation>\n\nThe title of this conversation, and nothing else:$/)
    assert.ok(input.length < 2200)
    assert.equal(titleInput([{ role: 'assistant', parts: [{ type: 'text', text: 'hi' }] }]), undefined)
  })

  test('a model title is one clean bounded line', () => {
    assert.equal(cleanTitle('"Fermetures de rues du centre-ville."\nextra'), 'Fermetures de rues du centre-ville')
    assert.equal(cleanTitle('Title: Road closures'), 'Road closures')
    assert.equal(cleanTitle('  \n '), undefined)
    // what a small model answered in portals' simulations
    assert.equal(cleanTitle('Titre de la conversation : Page « Nos actions pour la jeunesse » vide sur mobile'), 'Page « Nos actions pour la jeunesse » vide sur mobile')
    assert.equal(cleanTitle('Titre demandé : Ajout d\'un bouton vers le catalogue'), 'Ajout d\'un bouton vers le catalogue')
    assert.equal(cleanTitle('Titre sans citation ni point final, en français, sujet et contexte :\nAperçu mobile de la page Jeunesse'), 'Aperçu mobile de la page Jeunesse')
    assert.equal(cleanTitle('Titre sans citation ni point final, en français, sujet et contexte :'), undefined)
    // a title that merely starts with the word stays whole
    assert.equal(cleanTitle('Titre de séjour : renouvellement'), 'Titre de séjour : renouvellement')
    assert.equal(cleanTitle('a'.repeat(200))!.length, 80)
  })
})
