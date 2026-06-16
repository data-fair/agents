import sanitizeHtml from 'sanitize-html'
import { marked } from 'marked'
import { getSanitizeOpts } from '@data-fair/lib-utils/sanitize-html.js'
import { createMarkedVuetify } from '@data-fair/lib-utils/marked-vuetify.js'

// The chat is dense and we never want large headings, so we override the
// heading classes to be smaller than even the `compact` preset. The biggest
// reductions are on the first levels (compact h1 is 2rem, h2 1.75rem, h3 1.5rem).
const markedVuetify = createMarkedVuetify({
  density: 'compact',
  headingClasses: {
    1: 'text-title-large font-weight-bold text-primary mt-4 mb-2',
    2: 'text-title-medium font-weight-bold mt-3 mb-1',
    3: 'text-title-small font-weight-bold mt-2 mb-1',
    4: 'text-body-medium font-weight-bold mt-2 mb-1',
    5: 'text-body-medium font-weight-bold text-medium-emphasis mt-2 mb-1',
    6: 'text-body-medium font-weight-bold text-medium-emphasis mt-2 mb-1'
  }
})
const sanitizeOpts = getSanitizeOpts(sanitizeHtml.defaults)
sanitizeOpts.allowedAttributes = { ...sanitizeOpts.allowedAttributes, a: ['href', 'target'] }
marked.use(markedVuetify)

marked.use({
  renderer: {
    link (token) {
      const html = marked.Renderer.prototype.link.call(this, token)
      return html.replace('<a ', '<a target="_top" ')
    }
  }
})

// Mermaid fences become a container that a post-render pass (see utils/mermaid.ts)
// turns into an SVG. Gated by a module-level flag set synchronously before each
// marked.parse call below — safe because parsing is fully synchronous.
let mermaidActive = false

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

marked.use({
  renderer: {
    code (token) {
      if (mermaidActive && token.lang === 'mermaid') {
        return `<div class="mermaid-block"><pre class="mermaid">${escapeHtml(token.text)}</pre></div>`
      }
      return marked.Renderer.prototype.code.call(this, token)
    }
  }
})

// Models sometimes emit LaTeX-style inline math (e.g. `$\rightarrow$`) that marked
// does not render. Substitute the common commands with their Unicode equivalent.
const latexToUnicode: Record<string, string> = {
  rightarrow: '→',
  leftarrow: '←',
  Rightarrow: '⇒',
  Leftarrow: '⇐',
  leftrightarrow: '↔',
  Leftrightarrow: '⇔',
  uparrow: '↑',
  downarrow: '↓',
  to: '→',
  gets: '←',
  mapsto: '↦',
  times: '×',
  div: '÷',
  cdot: '·',
  pm: '±',
  mp: '∓',
  le: '≤',
  leq: '≤',
  ge: '≥',
  geq: '≥',
  ne: '≠',
  neq: '≠',
  approx: '≈',
  equiv: '≡',
  infty: '∞',
  ldots: '…',
  cdots: '⋯'
}

const replaceLatexCommands = (markdown: string): string =>
  markdown.replace(/\$\s*\\([a-zA-Z]+)\s*\$/g, (match, cmd) =>
    latexToUnicode[cmd] ?? match
  )

export const renderMarkdown = (markdown: string, opts?: { mermaid?: boolean }) => {
  mermaidActive = !!opts?.mermaid
  return sanitizeHtml(marked.parse(replaceLatexCommands(markdown)) as string, sanitizeOpts)
}

export const renderStreamingMarkdown = (markdown: string, isStreaming: boolean, opts?: { mermaid?: boolean }): string => {
  if (!isStreaming || !markdown) return renderMarkdown(markdown, opts)

  const lastBlock = markdown.lastIndexOf('\n\n')
  if (lastBlock === -1) return '' // No complete block yet — show nothing

  return renderMarkdown(markdown.slice(0, lastBlock + 2), opts)
}
