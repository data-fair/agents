/**
 * operations.ts contains pure stateless functions of the web access module (fetch and sitemaps for
 * autonomous agents): the URL allowlist, content classification, pagination, sitemap parsing.
 * Design: docs/architecture/web-access.md.
 */

import net from 'node:net'
import { gunzipSync } from 'node:zlib'

export const FETCH_URL_TOOL_NAME = 'fetch_url'
export const LIST_SITE_PAGES_TOOL_NAME = 'list_site_pages'
export const REQUEST_WEB_ACCESS_TOOL_NAME = 'request_web_access'
export const WEB_TOOL_NAMES = [FETCH_URL_TOOL_NAME, LIST_SITE_PAGES_TOOL_NAME, REQUEST_WEB_ACCESS_TOOL_NAME]

/** The source a stored web tool call names: the service's web access, not a catalog server. */
export const WEB_SERVER_ID = 'agent-web'

/** How many URL prefixes an agent's allowlist may hold. */
export const MAX_ALLOWED_URLS = 100

/** Characters of extracted content returned per call; the model reads on with `offset`. */
export const PAGE_SIZE = 20_000

/** Sitemap entries returned per call. */
export const SITEMAP_PAGE_SIZE = 200

const parseHttpUrl = (raw: string): URL => {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`"${raw}" is not a valid absolute URL`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error(`only http and https URLs are accepted, not ${url.protocol}`)
  if (url.username || url.password) throw new Error(`"${raw}": URLs with credentials are not accepted`)
  if (net.isIP(url.hostname.replace(/^\[|\]$/g, ''))) throw new Error(`"${raw}": URLs with an IP address are not accepted, only domain names`)
  url.hash = ''
  return url
}

/**
 * An address an agent is configured with, normalized: `https://` assumed when no scheme is given, http(s)
 * only, a host name rather than an IP address, no credentials, no fragment. Shared by the web allowlist and
 * the external MCP servers.
 */
export const normalizeHttpUrl = (input: string): string => {
  const trimmed = input.trim()
  return parseHttpUrl(trimmed.includes('://') ? trimmed : `https://${trimmed}`).href
}

/**
 * Calls one run may make to an open-world surface — the web readers, the external MCP servers — each
 * counted on its own: bounds a crawl or a loop that would not end on its own.
 */
export const MAX_CALLS_PER_RUN = 50

/** A URL without its scheme: http and https are the same address for the allowlist. */
const withoutScheme = (href: string) => href.replace(/^https?:\/\//, '')

/**
 * Normalizes one allowlist entry: an absolute URL prefix, `https://` assumed when no scheme is given.
 * Through the URL parser, so it compares with the URLs it is matched against (lowercase host,
 * percent-encoding, dot segments resolved).
 */
export const normalizeAllowedUrl = (input: string): string => {
  const trimmed = input.trim()
  if (!trimmed) throw new Error('an allowed URL cannot be empty')
  if (trimmed.includes('*')) throw new Error(`"${input}": no wildcards, an allowed URL is a prefix`)
  return normalizeHttpUrl(trimmed)
}

/** Normalizes and dedupes a whole allowlist; throws on the first invalid entry. */
export const normalizeAllowedUrls = (inputs: string[]): string[] => {
  const urls = [...new Set(inputs.map(normalizeAllowedUrl))]
  if (urls.length > MAX_ALLOWED_URLS) throw new Error(`at most ${MAX_ALLOWED_URLS} allowed URLs are accepted`)
  return urls
}

/**
 * Prefix matching, at a boundary: "github.com/data-fair" allows "github.com/data-fair/agents" and
 * "github.com/data-fair?tab=repositories", but not "github.com/data-fair-evil", and
 * "https://data.gouv.fr" does not allow "data.gouv.fr.evil.com".
 */
/**
 * A path segment that steps out of its parent once a backend decodes or strips it: `..%2f`, `%2e%2e%5c`,
 * `..;` (a path parameter to Tomcat). The URL parser resolves plain and `%2e` dot segments itself; these it
 * keeps as names, and a prefix match would let them out of the allowed prefix.
 */
const escapesPrefix = (pathname: string): boolean => pathname.split('/').some(segment => {
  let decoded = segment
  try { decoded = decodeURIComponent(segment) } catch {}
  return /(^|[/\\])\.\.([/\\;]|$)/.test(decoded) || /^\.\.;/.test(segment)
})

export const urlAllowed = (url: URL, allowedUrls: string[]): boolean => {
  if (escapesPrefix(url.pathname)) return false
  const target = withoutScheme(url.href)
  return allowedUrls.some(allowed => {
    const prefix = withoutScheme(allowed)
    if (!target.startsWith(prefix)) return false
    return target.length === prefix.length || /[/?&=]$/.test(prefix) || /^[/?]/.test(target.slice(prefix.length))
  })
}

/**
 * Whether the host has any allowed URL: its robots.txt, sitemaps and search descriptions may then be read.
 * `host` with its port (URL.host): another port of the same name is another service.
 */
export const hostAllowed = (host: string, allowedUrls: string[]): boolean =>
  allowedUrls.some(allowed => new URL(allowed).host === host)

/**
 * `page`: a URL the agent reads, which must be under an allowed URL. `site`: one of a site's own
 * metadata files (robots.txt, a sitemap, an OpenSearch description), which sit at its root, outside
 * any prefix narrower than the whole site — allowed on any host that has an allowed URL; what they
 * list is filtered by the allowlist again before it reaches the agent.
 */
export type UrlScope = 'page' | 'site'

/**
 * Parses a URL and checks it against the allowlist. The message names the allowlist, so the model can
 * explain the refusal or ask for an address to be added.
 */
/**
 * A URL as it may appear in a message the model reads: origin and path only. A redirect target or a catalog
 * link can be presigned, its query carrying a credential; the user info and the fragment go too.
 */
export const displayUrl = (raw: string): string => {
  try {
    const url = new URL(raw)
    return url.origin === 'null' ? `${url.protocol}${url.pathname}` : `${url.origin}${url.pathname}`
  } catch {
    return raw.split(/[?#]/)[0]
  }
}

export const checkUrl = (raw: string, allowedUrls: string[], scope: UrlScope = 'page'): URL => {
  const url = parseHttpUrl(raw)
  const allowed = scope === 'site' ? hostAllowed(url.host, allowedUrls) : urlAllowed(url, allowedUrls)
  if (!allowed) {
    throw new Error(`"${displayUrl(url.href)}" is not under this agent's allowed URLs (${allowedUrls.join(', ') || 'none'})`)
  }
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

// The XML these parsers read is written by any allowed site and read on the API's event loop, up to
// the 10 MB body cap, so they scan with indexOf rather than lazy or open-ended regular expressions:
// those restart from every unclosed opener and rescan the rest of the document, which is quadratic
// and froze the whole instance on a crafted file. An opener with no closer after it ends the scan,
// since no later one can be closed either.

/** The opening tags `<name …>` of a document, `<name>` included, `<names …>` not. */
function * openingTags (xml: string, name: string): Generator<string> {
  let from = 0
  while (true) {
    const start = xml.indexOf(`<${name}`, from)
    if (start === -1) return
    const after = start + name.length + 1
    if (/\w/.test(xml[after] ?? 'x')) { from = after; continue }
    const end = xml.indexOf('>', after)
    if (end === -1) return
    yield xml.slice(start, end + 1)
    from = end + 1
  }
}

/** What each `<name>…</name>` element holds, the attributes of its opening tag included. */
function * elementContents (xml: string, name: string): Generator<string> {
  const close = `</${name}>`
  let from = 0
  while (true) {
    const start = xml.indexOf(`<${name}`, from)
    if (start === -1) return
    const after = start + name.length + 1
    if (xml[after] !== '>' && !/\s/.test(xml[after] ?? 'x')) { from = after; continue }
    const end = xml.indexOf(close, after + 1)
    if (end === -1) return
    yield xml.slice(after + 1, end)
    from = end + close.length
  }
}

const firstElement = (xml: string, name: string): string | undefined => elementContents(xml, name).next().value ?? undefined

const xmlAttributes = (tag: string) => Object.fromEntries(
  [...tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)].map(m => [m[1], decodeXmlText(m[3] ?? m[4])])
)

/**
 * The search templates of an OpenSearch description document: the ones answering a page of results,
 * not the type-ahead suggestion endpoints sites declare beside them.
 */
export const parseOpenSearchDescription = (xml: string, descriptionUrl: string): string[] => {
  const templates: string[] = []
  for (const tag of openingTags(xml, 'Url')) {
    // a real one is a few hundred characters; the attribute pattern is quadratic over a huge one
    if (tag.length > 4096) continue
    const attrs = xmlAttributes(tag)
    if ((attrs.method ?? 'get').toLowerCase() !== 'get') continue
    if (/suggestions/.test(attrs.type ?? '') || attrs.rel === 'suggestions') continue
    const template = attrs.template && normalizeSearchTemplate(attrs.template, descriptionUrl)
    if (template) templates.push(template)
  }
  return templates
}

/**
 * The `Sitemap:` lines of a robots.txt. Horizontal blanks only around the field: `\s` also takes line
 * breaks, and backtracked quadratically over a run of blank lines.
 */
export const robotsSitemaps = (robotsTxt: string): string[] =>
  [...robotsTxt.matchAll(/^[ \t]*sitemap:[ \t]*(\S+)/gim)].map(m => m[1])

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

/** The sitemap protocol's own limit on an uncompressed sitemap. */
const SITEMAP_MAX_BYTES = 50 * 1024 * 1024

/**
 * A sitemap's text. A .xml.gz file, served as a file rather than with a content-encoding the client
 * would undo, is inflated — within the protocol's limit: gzip reaches 1000:1, so a file under the
 * body cap would otherwise inflate to gigabytes, synchronously.
 */
export const sitemapText = (body: Buffer): string => {
  if (body[0] !== 0x1f || body[1] !== 0x8b) return body.toString('utf-8')
  try {
    return gunzipSync(body, { maxOutputLength: SITEMAP_MAX_BYTES }).toString('utf-8')
  } catch (err: any) {
    if (err?.code === 'ERR_BUFFER_TOO_LARGE') throw new Error('the sitemap is larger than 50 MB once inflated')
    throw err
  }
}

/**
 * Reads a sitemap by searching for its elements rather than with an XML parser: the format is flat
 * and a 1 MB sitemap of 5,000 URLs is common, which a DOM would cost far more to build.
 */
export const parseSitemap = (xml: string): ParsedSitemap => {
  const kind = /<sitemapindex[\s>]/.test(xml) ? 'index' : 'urlset'
  const tag = kind === 'index' ? 'sitemap' : 'url'
  const entries: SitemapEntry[] = []
  for (const block of elementContents(xml, tag)) {
    const loc = firstElement(block, 'loc')
    if (!loc) continue
    const lastmod = firstElement(block, 'lastmod')
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

/** Where a site lists its AI artifacts, MCP servers among them (MCP Server Cards, SEP-2127). */
export const AI_CATALOG_PATH = '/.well-known/ai-catalog.json'
export const MCP_SERVER_CARD_TYPE = 'application/mcp-server-card+json'

export interface DiscoveredMcpServer {
  /** The streamable-http endpoint. */
  url: string
  name: string
  title?: string
  description?: string
}

/** The MCP server entries of an AI Catalog: an embedded card (`data`) or its URL. Anything unreadable: none. */
export function parseAiCatalog (text: string): Array<{ url?: string, data?: unknown }> {
  let doc: any
  try { doc = JSON.parse(text) } catch { return [] }
  if (!Array.isArray(doc?.entries)) return []
  return doc.entries
    .filter((e: any) => e?.type === MCP_SERVER_CARD_TYPE && (typeof e.url === 'string' || (e.data && typeof e.data === 'object')))
    .map((e: any) => typeof e.url === 'string' ? { url: e.url } : { data: e.data })
}

/**
 * The endpoint of a server card that can be used ANONYMOUSLY: a streamable-http remote with a plain
 * http(s) URL, no variables to fill and no required header. Anything else is not for us: an agent's
 * external servers carry no credential.
 */
export function mcpServerFromCard (card: unknown): DiscoveredMcpServer | undefined {
  const c = card as any
  if (!c || typeof c !== 'object' || typeof c.name !== 'string' || !Array.isArray(c.remotes)) return undefined
  const remote = c.remotes.find((r: any) =>
    r?.type === 'streamable-http' &&
    typeof r.url === 'string' && /^https?:\/\//.test(r.url) && !/[{}]/.test(r.url) &&
    !(Array.isArray(r.headers) && r.headers.some((h: any) => h?.isRequired)) &&
    !(r.variables && Object.keys(r.variables).length))
  if (!remote) return undefined
  return {
    url: remote.url,
    name: c.name,
    ...(typeof c.title === 'string' ? { title: c.title } : {}),
    ...(typeof c.description === 'string' ? { description: c.description } : {})
  }
}

/** What fetch_url says it cannot read; with files on, how to keep it anyway (spec §4.2). */
export const unreadableTypeMessage = (url: string, type: string, filesOn: boolean): string =>
  `${displayUrl(url)} is ${type || 'of an unknown type'}, which cannot be read as text.${filesOn ? ' Save it as one of your files instead: call fetch_url again with saveAs (for example "/data.xlsx"), then pass its path to a tool that takes a file.' : ''}`

/**
 * fetch_url's check on a response's declared type, before its body is read: a declared binary type is
 * refused at once. A missing or vague type is read and sniffed, as before.
 */
export const refuseBinary = (filesOn = false) => (contentType: string, url: string): void => {
  const type = contentType.split(';')[0].trim().toLowerCase()
  if (type && classifyContent(type, '') === 'unsupported') throw new Error(unreadableTypeMessage(url, type, filesOn))
}
