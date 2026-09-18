/**
 * Chip labels must not change under a person who already read them.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createToolTitleMemo } from '../../../ui/src/composables/tool-titles.ts'

test.describe('createToolTitleMemo', () => {
  test('uses the title the registry currently gives', () => {
    const title = createToolTitleMemo(() => 'Choisir le type de jeu de données')
    assert.equal(title('select_dataset_type'), 'Choisir le type de jeu de données')
  })

  test('keeps the title after the page that registered the tool unmounts', () => {
    // The whole point: the call really did happen on that page, so its label
    // stays true even once the tool is gone from the registry.
    let registered = true
    const title = createToolTitleMemo(() => registered ? 'Définir le titre du jeu de données' : undefined)
    assert.equal(title('set_dataset_title'), 'Définir le titre du jeu de données')
    registered = false
    assert.equal(title('set_dataset_title'), 'Définir le titre du jeu de données')
  })

  test('falls back to the raw name for a tool it has never seen titled', () => {
    const title = createToolTitleMemo(() => undefined)
    assert.equal(title('advance_to_confirmation'), 'advance_to_confirmation')
  })

  test('takes a later title over an earlier one, so a rename is not pinned forever', () => {
    let current = 'Old label'
    const title = createToolTitleMemo(() => current)
    assert.equal(title('t'), 'Old label')
    current = 'New label'
    assert.equal(title('t'), 'New label')
  })

  test('remembers each tool separately', () => {
    const titles: Record<string, string | undefined> = { a: 'Alpha', b: 'Beta' }
    const title = createToolTitleMemo(n => titles[n])
    assert.equal(title('a'), 'Alpha')
    assert.equal(title('b'), 'Beta')
    titles.a = undefined
    assert.equal(title('a'), 'Alpha')
    assert.equal(title('b'), 'Beta')
  })
})
