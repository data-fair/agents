/**
 * operations.ts contains pure stateless functions of the web access module (fetch and sitemaps for
 * autonomous agents): the domain allowlist, content classification, pagination, sitemap parsing.
 * Design: docs/superpowers/specs/2026-10-08-web-fetch-search-research.md (§7f).
 */

import net from 'node:net'

/** How many domains an agent's allowlist may hold. */
export const MAX_DOMAINS = 100

/** Characters of extracted content returned per call; the model reads on with `offset`. */
export const PAGE_SIZE = 20_000

/** Sitemap entries returned per call. */
export const SITEMAP_PAGE_SIZE = 200

/**
 * Normalizes one allowlist entry to a bare lowercase host name, accepting a pasted URL.
 * An entry covers the host itself and every subdomain: no wildcard syntax, so none to get wrong.
 */
export const normalizeDomain = (input: string): string => {
  const trimmed = input.trim()
  if (!trimmed) throw new Error('a domain cannot be empty')
  if (trimmed.includes('*')) throw new Error(`"${input}": wildcards are not needed, a domain already covers its subdomains`)
  let host: string
  try {
    host = new URL(trimmed.includes('://') ? trimmed : `http://${trimmed}`).hostname
  } catch {
    throw new Error(`"${input}" is not a valid domain`)
  }
  host = host.replace(/\.$/, '')
  if (!host) throw new Error(`"${input}" is not a valid domain`)
  if (net.isIP(host.replace(/^\[|\]$/g, ''))) throw new Error(`"${input}": IP addresses are not accepted, only domain names`)
  return host
}

/** Normalizes and dedupes a whole allowlist; throws on the first invalid entry. */
export const normalizeDomains = (inputs: string[]): string[] => {
  const domains = [...new Set(inputs.map(normalizeDomain))]
  if (domains.length > MAX_DOMAINS) throw new Error(`at most ${MAX_DOMAINS} domains are accepted`)
  return domains
}

export const hostAllowed = (host: string, domains: string[]): boolean =>
  domains.some(d => host === d || host.endsWith(`.${d}`))

/**
 * Parses a URL the agent asked for and checks it against the allowlist. The message names the
 * allowlist, so the model can explain the refusal or ask for the domain to be added.
 */
export const checkUrl = (raw: string, domains: string[]): URL => {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`"${raw}" is not a valid absolute URL`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error(`only http and https URLs can be fetched, not ${url.protocol}`)
  if (url.username || url.password) throw new Error('URLs with credentials are not accepted')
  if (net.isIP(url.hostname.replace(/^\[|\]$/g, ''))) throw new Error('URLs with an IP address are not accepted, only domain names')
  if (!hostAllowed(url.hostname, domains)) {
    throw new Error(`"${url.hostname}" is not in this agent's allowed domains (${domains.join(', ') || 'none'})`)
  }
  url.hash = ''
  return url
}

export type ContentKind = 'html' | 'feed' | 'json' | 'xml' | 'text' | 'unsupported'

/** What to do with a response body, from its content type, sniffing the start when that is vague. */
export const classifyContent = (contentType: string, start: string): ContentKind => {
  const type = contentType.split(';')[0].trim().toLowerCase()
  const head = start.trimStart().slice(0, 500).toLowerCase()
  if (type === 'text/html' || type === 'application/xhtml+xml') return 'html'
  if (type === 'application/rss+xml' || type === 'application/atom+xml') return 'feed'
  if (type === 'application/json' || type.endsWith('+json')) return 'json'
  const xmlish = type === 'text/xml' || type === 'application/xml' || type.endsWith('+xml')
  if (xmlish || (!type && head.startsWith('<?xml'))) return /<(rss|feed)[\s>]/.test(head) ? 'feed' : 'xml'
  if (!type && (head.startsWith('<!doctype html') || head.startsWith('<html'))) return 'html'
  if (type.startsWith('text/')) return 'text'
  return 'unsupported'
}

/** The charset declared in a content type, when TextDecoder knows it; utf-8 otherwise. */
export const charsetOf = (contentType: string): string => {
  const label = /charset=["']?([^;"'\s]+)/i.exec(contentType)?.[1]
  if (!label) return 'utf-8'
  try {
    return new TextDecoder(label).encoding
  } catch {
    return 'utf-8'
  }
}

export interface Page {
  content: string
  offset: number
  nextOffset?: number
  totalLength: number
}

/** One page of a long text, cut at a line break when there is one near the end. */
export const paginate = (text: string, offset = 0, size = PAGE_SIZE): Page => {
  const start = Math.max(0, Math.min(offset, text.length))
  let end = Math.min(start + size, text.length)
  if (end < text.length) {
    const lineBreak = text.lastIndexOf('\n', end)
    if (lineBreak > start + size * 0.8) end = lineBreak + 1
  }
  return {
    content: text.slice(start, end),
    offset: start,
    ...(end < text.length ? { nextOffset: end } : {}),
    totalLength: text.length
  }
}

/** The one placeholder of a search template returned to the model, whatever the site declared. */
export const SEARCH_TERMS = '{searchTerms}'

/** Values for the other OpenSearch parameters a template may require, from the specification's defaults. */
const OPENSEARCH_DEFAULTS: Record<string, string> = {
  startPage: '1', startIndex: '1', count: '10', language: '*', inputEncoding: 'UTF-8', outputEncoding: 'UTF-8'
}

/**
 * A search URL template reduced to one `{searchTerms}` placeholder: optional parameters (`{x?}`)
 * dropped, required ones given their default, resolved against the URL that declared it. Undefined
 * when it cannot be filled with search terms alone.
 */
export const normalizeSearchTemplate = (template: string, base: string, termsName = 'searchTerms'): string | undefined => {
  let unknown = false
  const filled = template.trim().replace(/\{([\w:-]+?)(\?)?\}/g, (_, name: string, optional?: string) => {
    if (name === termsName) return SEARCH_TERMS
    if (optional) return ''
    if (OPENSEARCH_DEFAULTS[name]) return OPENSEARCH_DEFAULTS[name]
    unknown = true
    return ''
  })
  if (unknown || !filled.includes(SEARCH_TERMS)) return
  // URL resolution would percent-encode the braces
  const marker = 'SEARCH_TERMS_PLACEHOLDER'
  try {
    const url = new URL(filled.replace(SEARCH_TERMS, marker), base)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return
    return url.href.replace(marker, SEARCH_TERMS)
  } catch {}
}

const xmlAttributes = (tag: string) => Object.fromEntries(
  [...tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)].map(m => [m[1], decodeXmlText(m[3] ?? m[4])])
)

/**
 * The search templates of an OpenSearch description document: the ones answering a page of results,
 * not the type-ahead suggestion endpoints sites declare beside them.
 */
export const parseOpenSearchDescription = (xml: string, descriptionUrl: string): string[] => {
  const templates: string[] = []
  for (const tag of xml.match(/<Url\b[^>]*>/g) ?? []) {
    const attrs = xmlAttributes(tag)
    if ((attrs.method ?? 'get').toLowerCase() !== 'get') continue
    if (/suggestions/.test(attrs.type ?? '') || attrs.rel === 'suggestions') continue
    const template = attrs.template && normalizeSearchTemplate(attrs.template, descriptionUrl)
    if (template) templates.push(template)
  }
  return templates
}

/** The `Sitemap:` lines of a robots.txt. */
export const robotsSitemaps = (robotsTxt: string): string[] =>
  [...robotsTxt.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map(m => m[1])

export interface SitemapEntry {
  loc: string
  lastmod?: string
}

export interface ParsedSitemap {
  /** An index lists other sitemaps; a urlset lists pages. */
  kind: 'index' | 'urlset'
  entries: SitemapEntry[]
}

const decodeXmlText = (s: string) => s
  .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
  .trim()

/**
 * Reads a sitemap with two regular expressions rather than an XML parser: the format is flat and
 * a 1 MB sitemap of 5,000 URLs is common, which a DOM would cost far more to build.
 */
export const parseSitemap = (xml: string): ParsedSitemap => {
  const kind = /<sitemapindex[\s>]/.test(xml) ? 'index' : 'urlset'
  const tag = kind === 'index' ? 'sitemap' : 'url'
  const entries: SitemapEntry[] = []
  for (const block of xml.matchAll(new RegExp(`<${tag}[\\s>]([\\s\\S]*?)</${tag}>`, 'g'))) {
    const loc = /<loc>([\s\S]*?)<\/loc>/.exec(block[1])?.[1]
    if (!loc) continue
    const lastmod = /<lastmod>([\s\S]*?)<\/lastmod>/.exec(block[1])?.[1]
    entries.push({ loc: decodeXmlText(loc), ...(lastmod ? { lastmod: decodeXmlText(lastmod) } : {}) })
  }
  return { kind, entries }
}

export interface SitemapFilter {
  /** Case-insensitive substring of the URL. */
  contains?: string
  /** ISO date: only entries modified on or after it; entries without a date are then left out. */
  since?: string
}

export const hasFilter = (filter: SitemapFilter) => !!(filter.contains || filter.since)

export const filterEntries = (entries: SitemapEntry[], filter: SitemapFilter): SitemapEntry[] => {
  const contains = filter.contains?.toLowerCase()
  const since = filter.since ? Date.parse(filter.since) : undefined
  if (since !== undefined && Number.isNaN(since)) throw new Error(`"${filter.since}" is not a valid date`)
  return entries.filter(e => {
    if (contains && !e.loc.toLowerCase().includes(contains)) return false
    if (since !== undefined) {
      const modified = e.lastmod ? Date.parse(e.lastmod) : NaN
      if (Number.isNaN(modified) || modified < since) return false
    }
    return true
  })
}
