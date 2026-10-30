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
    assert.match(input, /^Person: list the road closures x+…\n\nAssistant: Here they are\.$/)
    assert.ok(input.length < 2200)
    assert.equal(titleInput([{ role: 'assistant', parts: [{ type: 'text', text: 'hi' }] }]), undefined)
  })

  test('a model title is one clean bounded line', () => {
    assert.equal(cleanTitle('"Fermetures de rues du centre-ville."\nextra'), 'Fermetures de rues du centre-ville')
    assert.equal(cleanTitle('Title: Road closures'), 'Road closures')
    assert.equal(cleanTitle('  \n '), undefined)
    assert.equal(cleanTitle('a'.repeat(200))!.length, 80)
  })
})
