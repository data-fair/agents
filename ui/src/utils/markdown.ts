import sanitizeHtml from 'sanitize-html'
import { marked } from 'marked'
import { getSanitizeOpts } from '@data-fair/lib-utils/sanitize-html.js'
import { createMarkedVuetify } from '@data-fair/lib-utils/marked-vuetify.js'

const markedVuetify = createMarkedVuetify({ density: 'compact' })
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

export const renderMarkdown = (markdown: string) =>
  sanitizeHtml(marked.parse(replaceLatexCommands(markdown)) as string, sanitizeOpts)

export const renderStreamingMarkdown = (markdown: string, isStreaming: boolean): string => {
  if (!isStreaming || !markdown) return renderMarkdown(markdown)

  const lastBlock = markdown.lastIndexOf('\n\n')
  if (lastBlock === -1) return '' // No complete block yet — show nothing

  return renderMarkdown(markdown.slice(0, lastBlock + 2))
}
