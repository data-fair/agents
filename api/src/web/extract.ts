/**
 * Turns a fetched HTML page or feed into what the model reads. Pure (strings in, data out), but
 * CPU-bound — up to a second for a 2 MB page — so the service runs it in a worker thread
 * (./extractor.ts), never in the process that runs the conversations.
 */

import { parseHTML, DOMParser } from 'linkedom'
import { Defuddle } from 'defuddle/node'
import { normalizeSearchTemplate } from './operations.ts'

/**
 * A bound on the links read off one page, only so a pathological page cannot fill the worker's answer.
 * Not what the model gets: fetchUrl keeps the links under the agent's allowed URLs, and caps those.
 */
export const MAX_LINKS = 2000

export interface PageForm {
  method: 'GET' | 'POST'
  action: string
  /** Names of the visible fields; a GET form is a URL template the model can fill. */
  fields: string[]
}

export interface ExtractedPage {
  title?: string
  markdown: string
  links: string[]
  /** Forms are stripped from the markdown as page furniture, but a GET form is how a site is searched. */
  forms: PageForm[]
  /** OpenSearch description documents the page declares, still to be read for their templates. */
  openSearch: string[]
  /** Search URL templates the page declares itself, as schema.org SearchAction. */
  searchTemplates: string[]
}

/**
 * The schema.org SearchAction templates of the page's JSON-LD — the declaration behind search engines'
 * "search this site" box: `{ potentialAction: { @type: SearchAction, target: { urlTemplate },
 * query-input: "required name=q" } }`, on a top-level object or in its `@graph`.
 */
const searchActionTemplates = (document: Document, url: string): string[] => {
  const templates: string[] = []
  const visit = (node: any) => {
    if (Array.isArray(node)) return node.forEach(visit)
    if (!node || typeof node !== 'object') return
    if (node['@graph']) visit(node['@graph'])
    for (const action of [node.potentialAction].flat()) {
      if (!action || ![action['@type']].flat().includes('SearchAction')) continue
      const termsName = /name=([\w-]+)/.exec(String(action['query-input'] ?? ''))?.[1] ?? 'search_term_string'
      for (const target of [action.target].flat()) {
        const template = typeof target === 'string' ? target : target?.urlTemplate
        const normalized = typeof template === 'string' && normalizeSearchTemplate(template, url, termsName)
        if (normalized) templates.push(normalized)
      }
    }
  }
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try { visit(JSON.parse(script.textContent ?? '')) } catch {}
  }
  return templates
}

const absolute = (href: string | null, base: string): string | undefined => {
  if (!href) return
  try {
    const url = new URL(href, base)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return
    url.hash = ''
    return url.href
  } catch {}
}

export const extractHtml = async (html: string, url: string): Promise<ExtractedPage> => {
  const { document } = parseHTML(html)

  // read before Defuddle, which removes forms and navigation from what it returns
  const links = [...new Set([...document.querySelectorAll('a[href]')]
    .map(a => absolute(a.getAttribute('href'), url))
    .filter((href): href is string => !!href && href !== url))]
    .slice(0, MAX_LINKS)
  const forms = new Map<string, PageForm>()
  for (const element of document.querySelectorAll('form')) {
    const form: PageForm = {
      method: (element.getAttribute('method') ?? 'get').toUpperCase() === 'POST' ? 'POST' : 'GET',
      action: absolute(element.getAttribute('action'), url) ?? url,
      // a field without a name is not submitted: a script reads it, which nothing here runs
      fields: [...element.querySelectorAll('input[name], select[name], textarea[name]')]
        .filter(field => !['hidden', 'submit', 'button', 'image', 'reset'].includes(field.getAttribute('type') ?? ''))
        .map(field => field.getAttribute('name')!)
        .filter(Boolean)
    }
    // a page often repeats its search box (header and mobile menu): one is enough
    if (form.fields.length) forms.set(JSON.stringify(form), form)
  }
  const openSearch = [...document.querySelectorAll('link[rel="search"]')]
    .filter(link => (link.getAttribute('type') ?? '').includes('opensearchdescription'))
    .map(link => absolute(link.getAttribute('href'), url))
    .filter((href): href is string => !!href)
  const searchTemplates = searchActionTemplates(document as unknown as Document, url)

  const result = await Defuddle(document as unknown as Document, url, { markdown: true })
  return {
    ...(result.title ? { title: result.title } : {}),
    markdown: result.content ?? '',
    links,
    forms: [...forms.values()],
    openSearch,
    searchTemplates
  }
}

export interface ExtractedFeed {
  title?: string
  markdown: string
}

/** An RSS or Atom feed as a compact list: date, title, link — the natural "what is new" source. */
export const renderFeed = (xml: string): ExtractedFeed => {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const text = (el: Element | null | undefined, selector: string) => el?.querySelector(selector)?.textContent?.trim() || undefined
  const title = text(doc.querySelector('channel') ?? doc.querySelector('feed'), 'title')
  const items = [...doc.querySelectorAll('item, entry')].map(item => {
    const atomLink = [...item.querySelectorAll('link')].find(l => (l.getAttribute('rel') ?? 'alternate') === 'alternate')?.getAttribute('href')
    const link = atomLink ?? text(item, 'link')
    const date = text(item, 'pubDate') ?? text(item, 'updated') ?? text(item, 'published')
    const iso = date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString().slice(0, 10) : date
    const itemTitle = text(item, 'title') ?? link ?? '(untitled)'
    return `- ${iso ? `${iso} ` : ''}${link ? `[${itemTitle}](${link})` : itemTitle}`
  })
  return {
    ...(title ? { title } : {}),
    markdown: items.length ? items.join('\n') : '(this feed has no entries)'
  }
}
