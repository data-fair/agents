import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { renderMarkdown } from '../../../ui/src/utils/markdown.ts'

const diagram = '```mermaid\nxychart-beta\n  line [1, 2, 3]\n```'

test.describe('markdown mermaid rendering (unit)', () => {
  test('emits a mermaid container when the flag is on', () => {
    const html = renderMarkdown(diagram, { mermaid: true })
    assert.match(html, /<div class="mermaid-block"><pre class="mermaid">/)
    assert.match(html, /xychart-beta/)
    assert.doesNotMatch(html, /language-mermaid/)
  })

  test('renders an ordinary code block when the flag is off', () => {
    const html = renderMarkdown(diagram)
    assert.match(html, /language-mermaid/)
    assert.doesNotMatch(html, /class="mermaid"/)
  })

  test('non-mermaid code is unaffected when the flag is on', () => {
    const html = renderMarkdown('```js\nconst a = 1\n```', { mermaid: true })
    assert.match(html, /language-js/)
    assert.doesNotMatch(html, /class="mermaid"/)
  })

  test('escapes html in the diagram source', () => {
    const html = renderMarkdown('```mermaid\nA --> "<b>"\n```', { mermaid: true })
    assert.doesNotMatch(html, /<b>/)
    assert.match(html, /&lt;b&gt;/)
  })
})
