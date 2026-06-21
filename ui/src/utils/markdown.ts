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

// While streaming, inline markup may be opened but not yet closed. marked renders
// such fragments literally (e.g. `**foo` stays `**foo`), so we synthesize the
// missing *markdown* closers before parsing. Pragmatic: code spans take
// precedence, then the common emphasis delimiters; links/images/html are left to
// render literally and resolve when complete.
export const repairInline = (text: string): string => {
  // 1) Code spans first. Find an unclosed backtick run across the whole text.
  let openTick = 0
  for (let i = 0; i < text.length;) {
    if (text[i] === '`') {
      let n = 0
      while (text[i] === '`') { n++; i++ }
      if (openTick === 0) openTick = n
      else if (openTick === n) openTick = 0
    } else i++
  }
  if (openTick > 0) return text + '`'.repeat(openTick)

  // 2) No open code span: balance emphasis/strong/strikethrough, line by line,
  //    skipping balanced inline code spans and ignoring line-leading markers.
  const stack: string[] = []
  for (let line of text.split('\n')) {
    line = line.replace(/^(\s*)([-*+]\s+|>\s?|\d+\.\s+)/, '')
    for (let i = 0; i < line.length;) {
      const ch = line[i]
      if (ch === '`') {
        let n = 0; let j = i
        while (line[j] === '`') { n++; j++ }
        const close = line.indexOf('`'.repeat(n), j)
        i = close === -1 ? line.length : close + n
        continue
      }
      const two = line.slice(i, i + 2)
      if (two === '**' || two === '__' || two === '~~') {
        if (stack[stack.length - 1] === two) stack.pop(); else stack.push(two)
        i += 2; continue
      }
      if (ch === '*' || ch === '_') {
        if (stack[stack.length - 1] === ch) stack.pop(); else stack.push(ch)
        i += 1; continue
      }
      i += 1
    }
  }
  let out = text
  for (let k = stack.length - 1; k >= 0; k--) out += stack[k]
  return out
}

const tableDelimiterRe = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/m

export const looksLikeIncompleteTable = (text: string): boolean =>
  /\|/.test(text) && !tableDelimiterRe.test(text)

// Decide which markdown source to feed renderMarkdown while streaming. We lex the
// raw buffer to classify the last (active) block, then apply a per-type rule.
export const streamingSafeBuffer = (markdown: string): string => {
  // Normalize line endings first: marked collapses \r\n to \n internally, so
  // without this `token.raw` would be shorter than the source and the
  // `activeStart = markdown.length - last.raw.length` offset would point at the
  // wrong index. The output still flows through renderMarkdown, which normalizes
  // again, so this changes nothing for LF input (the assistant's usual case).
  markdown = markdown.replace(/\r\n/g, '\n')
  const tokens = marked.lexer(markdown)
  if (!tokens.length) return ''
  const last = tokens[tokens.length - 1]
  const activeStart = markdown.length - last.raw.length
  const stable = markdown.slice(0, activeStart)
  const active = markdown.slice(activeStart)

  // Held back entirely: raw mermaid source (SVG render is deferred anyway) and a
  // table header that has not yet produced its delimiter row.
  if (last.type === 'code' && (last as { lang?: string }).lang === 'mermaid') return stable
  if (last.type === 'paragraph' && looksLikeIncompleteTable(active)) return stable

  // Real table: commit complete rows, hold the still-growing last row.
  if (last.type === 'table') {
    const nl = active.lastIndexOf('\n')
    return nl === -1 ? stable : markdown.slice(0, activeStart + nl + 1)
  }

  // Regular code fence: an unclosed fence renders as a code block, so stream raw.
  if (last.type === 'code') return markdown

  // Inline-repairable block (paragraph, list, blockquote, heading, …): render the
  // whole buffer with synthetic closers for any inline markup left open.
  return stable + repairInline(active)
}

export const renderMarkdown = (markdown: string, opts?: { mermaid?: boolean }) => {
  mermaidActive = !!opts?.mermaid
  return sanitizeHtml(marked.parse(replaceLatexCommands(markdown)) as string, sanitizeOpts)
}

export const renderStreamingMarkdown = (markdown: string, isStreaming: boolean, opts?: { mermaid?: boolean }): string => {
  if (!isStreaming || !markdown) return renderMarkdown(markdown, opts)
  const safe = streamingSafeBuffer(markdown)
  return safe === '' ? '' : renderMarkdown(safe, opts)
}
