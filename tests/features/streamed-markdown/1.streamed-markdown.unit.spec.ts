import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { repairInline } from '../../../ui/src/utils/markdown.ts'

test.describe('repairInline (unit)', () => {
  test('closes an unclosed code span', () => {
    assert.equal(repairInline('a `code'), 'a `code`')
  })
  test('closes unclosed strong', () => {
    assert.equal(repairInline('a **bold'), 'a **bold**')
  })
  test('closes unclosed emphasis', () => {
    assert.equal(repairInline('a *em'), 'a *em*')
  })
  test('closes unclosed strikethrough', () => {
    assert.equal(repairInline('a ~~strike'), 'a ~~strike~~')
  })
  test('closes nested emphasis innermost first', () => {
    assert.equal(repairInline('**a *b'), '**a *b***')
  })
  test('code span protects emphasis chars (balanced span, no change)', () => {
    assert.equal(repairInline('`a*b`'), '`a*b`')
  })
  test('unclosed code span wins over inner star', () => {
    assert.equal(repairInline('a `b*c'), 'a `b*c`')
  })
  test('leading list marker is not emphasis', () => {
    assert.equal(repairInline('* item'), '* item')
  })
  test('leaves an incomplete link untouched', () => {
    assert.equal(repairInline('see [label'), 'see [label')
  })
  test('returns balanced text unchanged', () => {
    assert.equal(repairInline('**bold** and `code`'), '**bold** and `code`')
  })
})
