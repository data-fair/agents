import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { marked } from 'marked'
import { repairInline, streamingSafeBuffer, looksLikeIncompleteTable, renderStreamingMarkdown, appendStreamingCaret } from '../../../ui/src/utils/markdown.ts'

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

test.describe('streamingSafeBuffer CRLF handling (unit)', () => {
  test('a CRLF list round-trips its committed items', () => {
    const out = streamingSafeBuffer('- a\r\n- b\r\n- partial **bo')
    assert.equal(out, '- a\n- b\n- partial **bo**')
  })
})

test.describe('renderStreamingMarkdown (unit)', () => {
  test('renders every list item while streaming, including the partial last', () => {
    const html = renderStreamingMarkdown('- a\n- b\n- c', true)
    assert.match(html, /<li[^>]*>a<\/li>/)
    assert.match(html, /<li[^>]*>b<\/li>/)
    // the last item carries the streaming caret, so allow markup between c and </li>
    assert.match(html, /<li[^>]*>c.*<\/li>/)
  })
  test('renders open bold as <strong> while streaming', () => {
    const html = renderStreamingMarkdown('this is **bo', true)
    assert.match(html, /<strong>bo<\/strong>/)
  })
  test('renders nothing for empty streaming input', () => {
    assert.equal(renderStreamingMarkdown('', true), '')
  })
  test('renders nothing for a table header before its delimiter', () => {
    assert.equal(renderStreamingMarkdown('| a | b |', true), '')
  })
  test('holds back an open mermaid fence while streaming', () => {
    assert.equal(renderStreamingMarkdown('```mermaid\ngraph TD\nA-->B', true, { mermaid: true }), '')
  })
  test('when not streaming, renders the full buffer like renderMarkdown', () => {
    const html = renderStreamingMarkdown('# Title', false)
    assert.match(html, /Title/)
  })
  test('appends a blinking caret inline at the end while streaming', () => {
    const html = renderStreamingMarkdown('hello', true)
    // caret sits inside the last paragraph, right after the text
    assert.match(html, /hello<span class="agent-chat__streaming-caret" aria-hidden="true"><\/span><\/p>/)
  })
  test('places the caret inside the last list item, not after the list', () => {
    const html = renderStreamingMarkdown('- a\n- b', true)
    assert.match(html, /<li[^>]*>b<span class="agent-chat__streaming-caret" aria-hidden="true"><\/span><\/li>/)
  })
  test('no caret when not streaming', () => {
    assert.doesNotMatch(renderStreamingMarkdown('hello', false), /streaming-caret/)
  })
})

test.describe('appendStreamingCaret (unit)', () => {
  test('inserts before the last leaf block closer', () => {
    assert.equal(
      appendStreamingCaret('<p>a</p><p>b</p>'),
      '<p>a</p><p>b<span class="agent-chat__streaming-caret" aria-hidden="true"></span></p>'
    )
  })
  test('targets the last list item, not the enclosing list', () => {
    assert.equal(
      appendStreamingCaret('<ul><li>a</li><li>b</li></ul>'),
      '<ul><li>a</li><li>b<span class="agent-chat__streaming-caret" aria-hidden="true"></span></li></ul>'
    )
  })
  test('appends at the end when there is no block element', () => {
    assert.equal(
      appendStreamingCaret('just text'),
      'just text<span class="agent-chat__streaming-caret" aria-hidden="true"></span>'
    )
  })
  test('returns empty input unchanged', () => {
    assert.equal(appendStreamingCaret(''), '')
  })
})
