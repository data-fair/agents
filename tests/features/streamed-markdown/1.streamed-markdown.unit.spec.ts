import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { marked } from 'marked'
import { repairInline, streamingSafeBuffer, looksLikeIncompleteTable } from '../../../ui/src/utils/markdown.ts'

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

test.describe('lexer assumptions (unit)', () => {
  test('token .raw concatenates to the source', () => {
    const src = 'intro\n\n- a\n- b\n\nmore'
    const joined = marked.lexer(src).map(t => t.raw).join('')
    assert.equal(joined, src)
  })
  test('an unclosed fence is a code token, not a paragraph', () => {
    const tokens = marked.lexer('```js\nconst a')
    assert.equal(tokens[tokens.length - 1].type, 'code')
  })
})

test.describe('streamingSafeBuffer (unit)', () => {
  test('renders all list items including the partial last one, repaired', () => {
    const out = streamingSafeBuffer('- a\n- b\n- partial **bo')
    assert.equal(out, '- a\n- b\n- partial **bo**')
  })
  test('holds back a table header before its delimiter row', () => {
    assert.equal(streamingSafeBuffer('| a | b |'), '')
  })
  test('commits complete table rows and holds the growing last row', () => {
    const out = streamingSafeBuffer('| a | b |\n|---|---|\n| 1 | 2')
    assert.equal(out, '| a | b |\n|---|---|\n')
  })
  test('holds back an open mermaid fence', () => {
    assert.equal(streamingSafeBuffer('```mermaid\ngraph TD\nA-->B'), '')
  })
  test('streams a regular code fence raw', () => {
    const src = '```js\nconst a = 1\nconst b'
    assert.equal(streamingSafeBuffer(src), src)
  })
  test('returns empty string for empty input', () => {
    assert.equal(streamingSafeBuffer(''), '')
  })
  test('a paragraph containing a literal pipe is held back (accepted cost)', () => {
    assert.equal(streamingSafeBuffer('use a | b convention'), '')
  })
})

test.describe('looksLikeIncompleteTable (unit)', () => {
  test('true for a pipe line without a delimiter', () => {
    assert.equal(looksLikeIncompleteTable('| a | b |'), true)
  })
  test('false once a delimiter row is present', () => {
    assert.equal(looksLikeIncompleteTable('| a | b |\n|---|---|'), false)
  })
  test('false for text without pipes', () => {
    assert.equal(looksLikeIncompleteTable('just text'), false)
  })
})
