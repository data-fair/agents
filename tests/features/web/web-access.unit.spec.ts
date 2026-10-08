/**
 * The web access module end to end against a local HTTP server: no dev stack, no shared state.
 * localhost is declared public to the client (as SSRF_PUBLIC_IPS would in dev), except in the test
 * that checks it is refused by default.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { gzipSync } from 'node:zlib'
import type { AddressInfo } from 'node:net'
import { createWebClient } from '../../../api/src/web/client.ts'
import { createExtractor } from '../../../api/src/web/extractor.ts'
import { fetchUrl, listSitePages, type WebContext } from '../../../api/src/web/service.ts'
import { createWebTools, FETCH_URL_TOOL_NAME } from '../../../api/src/web/tools.ts'

const article = `<!doctype html><html><head><title>BAN</title>
  <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml">
  <link rel="search" type="application/opensearchdescription+xml" href="https://elsewhere.test/opensearch.xml"></head><body>
  <nav><a href="/">Home</a></nav>
  <form action="/search"><input name="q"></form>
  <main><article><h1>Base Adresse Nationale</h1><p>${'La Base Adresse Nationale est le référentiel des adresses. '.repeat(10)}</p></article></main>
  </body></html>`

let base: string
const hits: Record<string, number> = {}
let server: http.Server

const routes: Record<string, (req: http.IncomingMessage, res: http.ServerResponse) => void> = {
  '/page.html': (req, res) => {
    if (req.headers['if-none-match'] === '"v1"') { res.writeHead(304).end(); return }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', etag: '"v1"' }).end(article)
  },
  '/opensearch.xml': (req, res) => {
    res.writeHead(200, { 'content-type': 'application/opensearchdescription+xml' }).end(`<?xml version="1.0"?><OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
      <Url type="text/html" method="get" template="${base}/search?q={searchTerms}&amp;page={startPage?}"/>
      <Url type="application/x-suggestions+json" template="${base}/suggest?q={searchTerms}"/></OpenSearchDescription>`)
  },
  '/redirect': (req, res) => { res.writeHead(302, { location: '/page.html' }).end() },
  '/away': (req, res) => { res.writeHead(302, { location: 'https://example.com/' }).end() },
  '/data.json': (req, res) => { res.writeHead(200, { 'content-type': 'application/json' }).end('{"a":[1,2]}') },
  '/feed.xml': (req, res) => {
    res.writeHead(200, { 'content-type': 'application/atom+xml' }).end(`<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Releases</title>
      <entry><title>v1.2.0</title><link href="${base}/releases/v1.2.0"/><updated>2026-10-01T00:00:00Z</updated></entry></feed>`)
  },
  '/spa': (req, res) => { res.writeHead(200, { 'content-type': 'text/html' }).end('<html><body><div id="app"></div><script src="/app.js"></script></body></html>') },
  '/big': (req, res) => { res.writeHead(200, { 'content-type': 'text/plain' }).end('x'.repeat(5000)) },
  '/bot': (req, res) => { res.writeHead(403, { 'content-type': 'text/html', 'cf-mitigated': 'challenge' }).end('Just a moment...') },
  '/file.pdf': (req, res) => { res.writeHead(200, { 'content-type': 'application/pdf' }).end('%PDF-1.4') },
  '/robots.txt': (req, res) => { res.writeHead(200, { 'content-type': 'text/plain' }).end(`User-agent: *\nSitemap: ${base}/sitemap_index.xml\nSitemap: https://elsewhere.test/sitemap.xml\n`) },
  '/sitemap_index.xml': (req, res) => {
    res.writeHead(200, { 'content-type': 'application/xml' }).end(`<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap><loc>${base}/press.xml</loc><lastmod>2026-10-02</lastmod></sitemap>
      <sitemap><loc>${base}/projects.xml.gz</loc></sitemap></sitemapindex>`)
  },
  '/press.xml': (req, res) => {
    res.writeHead(200, { 'content-type': 'application/xml' }).end(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>${base}/press/new-dataset</loc><lastmod>2026-10-02</lastmod></url>
      <url><loc>${base}/press/old</loc><lastmod>2025-01-01</lastmod></url></urlset>`)
  },
  '/projects.xml.gz': (req, res) => {
    res.writeHead(200, { 'content-type': 'application/gzip' }).end(gzipSync(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>${base}/projects/new-portal</loc><lastmod>2026-10-03</lastmod></url>
      <url><loc>${base}/projects/undated</loc></url></urlset>`))
  }
}

const extractor = createExtractor()
/** The whole local site; set once the server listens. */
let allowedUrls: string[]
const publicIps = ['127.0.0.1', '::1']
const context = (opts: Parameters<typeof createWebClient>[0] = {}): WebContext => ({
  allowedUrls,
  client: createWebClient({ publicIps, ...opts }),
  extractor
})

test.describe('web access', () => {
  test.beforeAll(async () => {
    server = http.createServer((req, res) => {
      const path = new URL(req.url!, 'http://localhost').pathname
      hits[path] = (hits[path] ?? 0) + 1
      const route = routes[path]
      if (route) route(req, res)
      else res.writeHead(404).end()
    })
    await new Promise<void>(resolve => server.listen(0, 'localhost', resolve))
    base = `http://localhost:${(server.address() as AddressInfo).port}`
    allowedUrls = [`${base}/`]
  })

  test.afterAll(async () => {
    await extractor.close()
    await new Promise(resolve => server.close(resolve))
  })

  test.beforeEach(() => { for (const key of Object.keys(hits)) delete hits[key] })

  test('refuses a name resolving to a private address, by default', async () => {
    const ctx: WebContext = { allowedUrls, client: createWebClient({ publicIps: [] }), extractor }
    await assert.rejects(fetchUrl({ url: `${base}/page.html` }, ctx), /not a public address/)
    assert.equal(hits['/page.html'], undefined)
  })

  test('refuses a URL outside the allowlist without any request', async () => {
    await assert.rejects(fetchUrl({ url: `${base}/page.html` }, { ...context(), allowedUrls: ['https://example.com/'] }), /is not under this agent's allowed URLs \(https:\/\/example.com\/\)/)
    assert.equal(hits['/page.html'], undefined)
  })

  test('reads a page as markdown with its links and search form', async () => {
    const result = await fetchUrl({ url: `${base}/page.html` }, context())
    assert.equal(result.url, `${base}/page.html`)
    assert.equal(result.title, 'BAN')
    assert.ok(result.content.includes('Base Adresse Nationale'))
    assert.deepEqual(result.links, [`${base}/`])
    assert.deepEqual(result.forms, [{ method: 'GET', action: `${base}/search`, fields: ['q'] }])
    // the declared description was read for its template; the one off the allowlist was skipped
    assert.deepEqual(result.searchTemplates, [`${base}/search?q={searchTerms}&page=`])
    assert.equal(result.note, undefined)
  })

  test('serves a fresh response from the cache, then revalidates a stale one', async () => {
    const fresh = context()
    await fetchUrl({ url: `${base}/page.html` }, fresh)
    await fetchUrl({ url: `${base}/page.html` }, fresh)
    assert.equal(hits['/page.html'], 1)

    const stale = context({ freshMs: 0 })
    const first = await fetchUrl({ url: `${base}/page.html` }, stale)
    const second = await fetchUrl({ url: `${base}/page.html` }, stale)
    assert.equal(hits['/page.html'], 3, 'the second call asked the server again')
    assert.deepEqual(second, first, 'a 304 keeps the cached content')
  })

  test('follows a redirect inside the allowlist, refuses one leaving it', async () => {
    const result = await fetchUrl({ url: `${base}/redirect` }, context())
    assert.equal(result.url, `${base}/page.html`)
    await assert.rejects(fetchUrl({ url: `${base}/away` }, context()), /redirects to https:\/\/example.com\/, which cannot be fetched: "https:\/\/example.com\/" is not under this agent's allowed URLs/)
  })

  test('passes JSON through, renders a feed, flags a JavaScript shell', async () => {
    const json = await fetchUrl({ url: `${base}/data.json` }, context())
    assert.equal(json.content, '{\n  "a": [\n    1,\n    2\n  ]\n}')

    const feed = await fetchUrl({ url: `${base}/feed.xml` }, context())
    assert.equal(feed.title, 'Releases')
    assert.equal(feed.content, `- 2026-10-01 [v1.2.0](${base}/releases/v1.2.0)`)

    const spa = await fetchUrl({ url: `${base}/spa` }, context())
    assert.match(spa.note ?? '', /JavaScript/)
  })

  test('reports what cannot be read', async () => {
    await assert.rejects(fetchUrl({ url: `${base}/big` }, context({ maxBodyBytes: 1000 })), /maxContentLength/)
    await assert.rejects(fetchUrl({ url: `${base}/bot` }, context()), /bot protection, HTTP 403/)
    await assert.rejects(fetchUrl({ url: `${base}/file.pdf` }, context()), /application\/pdf, which cannot be read as text/)
    await assert.rejects(fetchUrl({ url: `${base}/missing` }, context()), /answered HTTP 404/)
  })

  test('lists a sitemap index as a table of contents without a filter', async () => {
    const result = await listSitePages({ site: base }, context())
    assert.deepEqual(result.sitemaps.map(s => s.loc), [`${base}/sitemap_index.xml`, `${base}/press.xml`, `${base}/projects.xml.gz`])
    assert.deepEqual(result.pages, [])
    assert.match(result.note ?? '', /filter with `contains` or `since`/)
    assert.equal(hits['/press.xml'], undefined, 'children are not read without a filter')
  })

  test('searches the child sitemaps with a filter, gzipped ones included', async () => {
    const recent = await listSitePages({ site: `${base}/any/page`, since: '2026-10-01' }, context())
    assert.deepEqual(recent.pages.map(p => p.loc), [`${base}/press/new-dataset`, `${base}/projects/new-portal`])
    assert.equal(recent.total, 2)
    assert.match(recent.note ?? '', /1 listed page\(s\) have no modification date and were left out by `since`/)

    const press = await listSitePages({ site: base, contains: 'press' }, context())
    assert.deepEqual(press.pages.map(p => p.loc), [`${base}/press/new-dataset`, `${base}/press/old`])

    const none = await listSitePages({ site: base, contains: 'passeport' }, context())
    assert.equal(none.total, 0)
    assert.match(none.note ?? '', /site's own search/)
  })

  test('a narrow allowed URL reads the site root sitemaps but lists only the pages under it', async () => {
    const press = { ...context(), allowedUrls: [`${base}/press`] }
    await assert.rejects(fetchUrl({ url: `${base}/page.html` }, press), /not under this agent's allowed URLs/)
    const result = await listSitePages({ site: base, since: '2026-01-01' }, press)
    assert.deepEqual(result.pages.map(p => p.loc), [`${base}/press/new-dataset`])
    assert.ok(hits['/robots.txt'] && hits['/sitemap_index.xml'] && hits['/projects.xml.gz'], 'the metadata files were read')

    const none = await listSitePages({ site: base, contains: 'projects' }, press)
    assert.equal(none.total, 0, 'a page outside the prefix is never listed')
  })

  test('the tools stop a run at its call budget', async () => {
    const tools = createWebTools({ ...context(), maxCalls: 2 })
    const execute = (tools[FETCH_URL_TOOL_NAME] as any).execute
    await execute({ url: `${base}/data.json` })
    await execute({ url: `${base}/data.json` })
    await assert.rejects(execute({ url: `${base}/data.json` }), /used all of its 2 web tool calls/)
  })
})
