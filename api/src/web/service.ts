/**
 * Web access for autonomous agents: reading one URL (`fetchUrl`) and narrowing a site through its
 * sitemaps (`listSitePages`). Everything an agent may reach is bounded by the `allowedUrls` it is given.
 * Knows nothing of the agent loop: ./tools.ts adapts it to AI SDK tools.
 */

import { gunzipSync } from 'node:zlib'
import { createWebClient, type WebClient, type WebResponse } from './client.ts'
import { createExtractor, type Extractor } from './extractor.ts'
import type { ExtractedFeed, ExtractedPage, PageForm } from './extract.ts'
import {
  charsetOf, checkUrl, classifyContent, filterEntries, hasFilter, hostAllowed, paginate, parseOpenSearchDescription, parseSitemap, robotsSitemaps, urlAllowed,
  SITEMAP_PAGE_SIZE, type SitemapEntry, type SitemapFilter
} from './operations.ts'

/** Below this many characters, an HTML page probably renders its content with JavaScript. */
const THIN_CONTENT = 200

/** Links returned with a page, after keeping those under the allowed URLs. */
const MAX_RETURNED_LINKS = 200

/** Child sitemaps read by one filtered listing (service-public.gouv.fr has 14 of 1.1 MB each). */
const MAX_CHILD_SITEMAPS = 25

export interface WebContext {
  /** URL prefixes the agent may read under (see urlAllowed in ./operations.ts). */
  allowedUrls: string[]
  client?: WebClient
  extractor?: Extractor
}

let defaultClient: WebClient | undefined
let defaultExtractor: Extractor | undefined
const clientOf = (ctx: WebContext) => ctx.client ?? (defaultClient ??= createWebClient())
const extractorOf = (ctx: WebContext) => ctx.extractor ?? (defaultExtractor ??= createExtractor())

/** Extractions by body: a cached response keeps its Buffer, so a cache hit also skips the extraction. */
const extracted = new WeakMap<Buffer, ExtractedPage | ExtractedFeed>()

const decode = (res: WebResponse) => new TextDecoder(charsetOf(res.contentType)).decode(res.body)

/** An HTTP error, saying so when it is bot protection: retrying or rephrasing will not help. */
const httpError = (res: WebResponse) => {
  const challenge = res.headers['cf-mitigated'] === 'challenge' || (res.status === 403 && /cloudflare/i.test(res.headers.server ?? ''))
  return new Error(challenge
    ? `${res.url} refused an automated client (bot protection, HTTP ${res.status}); its content cannot be read this way`
    : `${res.url} answered HTTP ${res.status}`)
}

export interface FetchUrlInput {
  url: string
  /** Where to continue reading a long content, from a previous call's `nextOffset`. */
  offset?: number
}

export interface FetchUrlResult {
  url: string
  contentType: string
  title?: string
  content: string
  offset: number
  nextOffset?: number
  totalLength: number
  /** On the first page of an HTML document only: the page's links the agent may follow. */
  links?: string[]
  /** How many of the page's links lead outside the allowed URLs, and were left out. */
  linksElsewhere?: number
  forms?: PageForm[]
  /** URLs to fill by replacing `{searchTerms}`: the site's search, from OpenSearch or schema.org. */
  searchTemplates?: string[]
  note?: string
}

/**
 * The templates of a page's OpenSearch descriptions. Read through the same client, so cached, as a
 * site's metadata (a description sits at the root, outside a narrower allowed URL); a template outside
 * the allowlist is then refused when the agent fills it. One that cannot be read is skipped — the page
 * itself was read, that is what was asked.
 */
const openSearchTemplates = async (descriptions: string[], ctx: WebContext): Promise<string[]> => {
  const templates: string[] = []
  for (const description of descriptions) {
    try {
      const res = await clientOf(ctx).get(description, ctx.allowedUrls, 'site')
      if (res.status < 400) templates.push(...parseOpenSearchDescription(decode(res), res.url))
    } catch {}
  }
  return templates
}

export const fetchUrl = async (input: FetchUrlInput, ctx: WebContext): Promise<FetchUrlResult> => {
  const res = await clientOf(ctx).get(input.url, ctx.allowedUrls)
  if (res.status >= 400) throw httpError(res)
  const text = decode(res)
  const kind = classifyContent(res.contentType, text.slice(0, 500))
  if (kind === 'unsupported') throw new Error(`${res.url} is ${res.contentType || 'of an unknown type'}, which cannot be read as text`)

  let title: string | undefined
  let content = text
  let page: ExtractedPage | undefined
  if (kind === 'html' || kind === 'feed') {
    let result = extracted.get(res.body)
    if (!result) {
      result = kind === 'html' ? await extractorOf(ctx).extract('html', text, res.url) : await extractorOf(ctx).extract('feed', text, res.url)
      extracted.set(res.body, result)
    }
    title = result.title
    content = result.markdown
    if (kind === 'html') page = result as ExtractedPage
  } else if (kind === 'json') {
    try { content = JSON.stringify(JSON.parse(text), null, 2) } catch {}
  }

  const offset = input.offset ?? 0
  const first = offset === 0 ? page : undefined
  const searchTemplates = first
    ? [...new Set([...first.searchTemplates, ...await openSearchTemplates(first.openSearch, ctx)])]
    : []
  // Only the links the agent can follow: GitHub's releases page carried ~250, a quarter of them GitHub's
  // own navigation, and the whole list rode along in every later step of the run.
  const links = (first?.links ?? []).filter(link => urlAllowed(new URL(link), ctx.allowedUrls))
  const linksElsewhere = (first?.links.length ?? 0) - links.length
  return {
    url: res.url,
    contentType: res.contentType,
    ...(title ? { title } : {}),
    ...paginate(content, offset),
    ...(links.length ? { links: links.slice(0, MAX_RETURNED_LINKS) } : {}),
    ...(linksElsewhere ? { linksElsewhere } : {}),
    ...(first?.forms.length ? { forms: first.forms } : {}),
    ...(searchTemplates.length ? { searchTemplates } : {}),
    ...(page && content.trim().length < THIN_CONTENT
      ? { note: 'This page has almost no readable content: it probably renders it with JavaScript, which is not run. Look for a JSON API, a feed or a sitemap instead.' }
      : {})
  }
}

export interface ListSitePagesInput extends SitemapFilter {
  /** A host name or any URL of the site. */
  site: string
  offset?: number
}

export interface ListSitePagesResult {
  /** The sitemaps that were read, or found but not read. */
  sitemaps: SitemapEntry[]
  /** Pages listed by those sitemaps under the allowed URLs, filtered, one page of them at a time. */
  pages: SitemapEntry[]
  offset: number
  nextOffset?: number
  total: number
  note?: string
}

const loadSitemap = async (url: string, ctx: WebContext) => {
  const res = await clientOf(ctx).get(url, ctx.allowedUrls, 'site')
  if (res.status >= 400) throw httpError(res)
  // a .xml.gz file, served as a file rather than with a content-encoding the client would undo
  const body = res.body[0] === 0x1f && res.body[1] === 0x8b ? gunzipSync(res.body) : res.body
  return parseSitemap(body.toString('utf-8'))
}

export const listSitePages = async (input: ListSitePagesInput, ctx: WebContext): Promise<ListSitePagesResult> => {
  const origin = checkUrl(input.site.includes('://') ? input.site : `https://${input.site}`, ctx.allowedUrls, 'site').origin

  // where the site declares its sitemaps, or the conventional place
  let roots: string[] = []
  try {
    const robots = await clientOf(ctx).get(`${origin}/robots.txt`, ctx.allowedUrls, 'site')
    if (robots.status < 400) roots = robotsSitemaps(decode(robots))
  } catch {}
  roots = roots.filter(loc => { try { return hostAllowed(new URL(loc).hostname, ctx.allowedUrls) } catch { return false } })
  if (!roots.length) roots = [`${origin}/sitemap.xml`]

  const sitemaps: SitemapEntry[] = []
  const children: SitemapEntry[] = []
  let pages: SitemapEntry[] = []
  const unreadable: string[] = []
  for (const loc of roots) {
    try {
      const parsed = await loadSitemap(loc, ctx)
      sitemaps.push({ loc })
      if (parsed.kind === 'index') children.push(...parsed.entries)
      else pages.push(...parsed.entries)
    } catch (err: any) {
      unreadable.push(`${loc}: ${err.message}`)
    }
  }

  // an index alone is already a table of contents; its children are read only to answer a filter
  const notes: string[] = []
  if (hasFilter(input)) {
    for (const child of children.slice(0, MAX_CHILD_SITEMAPS)) {
      try {
        const parsed = await loadSitemap(child.loc, ctx)
        if (parsed.kind === 'urlset') pages.push(...parsed.entries)
      } catch (err: any) {
        unreadable.push(`${child.loc}: ${err.message}`)
      }
    }
    if (children.length > MAX_CHILD_SITEMAPS) notes.push(`Only the first ${MAX_CHILD_SITEMAPS} of ${children.length} sitemaps were read.`)
    // docs.koumoul.com dates its home page only: `since` alone made the rest of the site invisible
    const undated = input.since ? pages.filter(page => !page.lastmod).length : 0
    if (undated) notes.push(`${undated} listed page(s) have no modification date and were left out by \`since\`: list without it to see them.`)
    pages = filterEntries(pages, input)
  } else {
    sitemaps.push(...children)
    if (children.length) notes.push('This site splits its sitemap: filter with `contains` or `since` to search the pages they list.')
  }
  if (unreadable.length) notes.push(`Could not read: ${unreadable.join('; ')}`)
  if (!sitemaps.length && !pages.length) throw new Error(`no sitemap found for ${origin}${unreadable.length ? ` (${unreadable.join('; ')})` : ''}`)
  // the sitemaps were read as the site's metadata: what they list reaches the agent only under the allowlist
  pages = pages.filter(page => { try { return urlAllowed(new URL(page.loc), ctx.allowedUrls) } catch { return false } })
  // service-public.gouv.fr's pages are /vosdroits/F1709: a topic word is often not in the URL at all
  if (hasFilter(input) && !pages.length) notes.push('No listed page under the allowed URLs matches. URLs do not always contain the words of their topic: the site\'s own search (a GET form of fetch_url) may find more.')

  const offset = Math.max(0, input.offset ?? 0)
  const end = offset + SITEMAP_PAGE_SIZE
  return {
    sitemaps,
    pages: pages.slice(offset, end),
    offset,
    ...(end < pages.length ? { nextOffset: end } : {}),
    total: pages.length,
    ...(notes.length ? { note: notes.join(' ') } : {})
  }
}
