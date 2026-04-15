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

export const renderMarkdown = (markdown: string) =>
  sanitizeHtml(marked.parse(markdown) as string, sanitizeOpts)

export const renderStreamingMarkdown = (markdown: string, isStreaming: boolean): string => {
  if (!isStreaming || !markdown) return renderMarkdown(markdown)

  const lastBlock = markdown.lastIndexOf('\n\n')
  if (lastBlock === -1) return '' // No complete block yet — show nothing

  return renderMarkdown(markdown.slice(0, lastBlock + 2))
}
