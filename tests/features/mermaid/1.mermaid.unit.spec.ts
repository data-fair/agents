import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { renderMarkdown } from '../../../ui/src/utils/markdown.ts'
import { buildMermaidThemeVariables } from '../../../ui/src/utils/mermaid.ts'
import { formatMermaidFix } from '../../../ui/src/utils/mermaid-fix.ts'

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

test.describe('mermaid theme variables (unit)', () => {
  const colors = {
    primary: '#1E88E5',
    secondary: '#42A5F5',
    surface: '#FFFFFF',
    'on-surface': '#212121',
    'on-primary': '#FFFFFF'
  }

  test('maps the vuetify palette to mermaid theme variables', () => {
    const vars = buildMermaidThemeVariables(colors)
    assert.equal(vars.primaryColor, '#1E88E5')
    assert.equal(vars.primaryTextColor, '#FFFFFF')
    assert.equal(vars.lineColor, '#212121')
    assert.equal(vars.secondaryColor, '#42A5F5')
    assert.equal(vars.tertiaryColor, '#FFFFFF')
  })

  test('falls back to sensible defaults when a color is missing', () => {
    const vars = buildMermaidThemeVariables({ primary: '#000000' })
    assert.equal(vars.primaryColor, '#000000')
    assert.equal(typeof vars.primaryTextColor, 'string')
    assert.equal(typeof vars.lineColor, 'string')
  })

  test('drives the xychart palette and text from the theme (legible, on-brand)', () => {
    const xy = buildMermaidThemeVariables(colors).xyChart as Record<string, string>
    // plots use the theme's primary/secondary, not mermaid's default palette
    assert.equal(xy.plotColorPalette, '#1E88E5,#42A5F5')
    // title and every axis text/line color use on-surface so they stay legible
    assert.equal(xy.titleColor, '#212121')
    assert.equal(xy.xAxisLabelColor, '#212121')
    assert.equal(xy.yAxisLabelColor, '#212121')
    assert.equal(xy.backgroundColor, '#FFFFFF')
  })
})

test.describe('formatMermaidFix (unit)', () => {
  test('embeds the error and a fenced mermaid source', () => {
    const out = formatMermaidFix('Parse error on line 2', 'xychart-beta\n  bad')
    assert.match(out, /Parse error on line 2/)
    assert.match(out, /```mermaid\nxychart-beta\n {2}bad\n```/)
    assert.match(out, /syntax corrected/i)
  })
})
