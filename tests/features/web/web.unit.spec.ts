/**
 * stateless unit tests of the web access module's pure functions
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { gzipSync } from 'node:zlib'
import {
  normalizeAllowedUrl, normalizeAllowedUrls, urlAllowed, hostAllowed, checkUrl, classifyContent, charsetOf, paginate,
  robotsSitemaps, parseSitemap, sitemapText, filterEntries, normalizeSearchTemplate, parseOpenSearchDescription, parseAiCatalog, mcpServerFromCard
} from '../../../api/src/web/operations.ts'
import { ipList, isPublicAddress } from '../../../api/src/web/public-lookup.ts'
import { extractHtml, renderFeed } from '../../../api/src/web/extract.ts'

test.describe('web allowlist', () => {
  test('normalizes an allowed URL, https assumed', () => {
    assert.equal(normalizeAllowedUrl(' github.com/data-fair '), 'https://github.com/data-fair')
    assert.equal(normalizeAllowedUrl('https://WWW.Data.Gouv.fr'), 'https://www.data.gouv.fr/')
    assert.equal(normalizeAllowedUrl('https://docs.koumoul.com/pages/../tutoriels/#top'), 'https://docs.koumoul.com/tutoriels/')
  })

  test('refuses wildcards, IP addresses, credentials and garbage', () => {
    assert.throws(() => normalizeAllowedUrl('*.example.com'), /no wildcards/)
    assert.throws(() => normalizeAllowedUrl('https://192.168.1.1/'), /IP address/)
    assert.throws(() => normalizeAllowedUrl('[::1]'), /IP address/)
    assert.throws(() => normalizeAllowedUrl('https://u:p@a.test/'), /credentials/)
    assert.throws(() => normalizeAllowedUrl('ftp://a.test/'), /only http and https/)
    assert.throws(() => normalizeAllowedUrl(''), /empty/)
    assert.throws(() => normalizeAllowedUrl('exa mple.com'), /not a valid absolute URL/)
  })

  test('dedupes and caps a list', () => {
    assert.deepEqual(normalizeAllowedUrls(['a.test/x', 'https://A.test/x', 'b.test']), ['https://a.test/x', 'https://b.test/'])
    assert.throws(() => normalizeAllowedUrls(Array.from({ length: 101 }, (_, i) => `d${i}.test`)), /at most 100/)
  })

  test('an allowed URL is a prefix, matched at a boundary', () => {
    const allowed = ['https://github.com/data-fair', 'https://www.data.gouv.fr/']
    const ok = (url: string) => urlAllowed(new URL(url), allowed)
    assert.ok(ok('https://github.com/data-fair'))
    assert.ok(ok('https://github.com/data-fair/agents/releases'))
    assert.ok(ok('https://github.com/data-fair?tab=repositories'))
    assert.ok(ok('http://github.com/data-fair/agents'), 'http and https are the same address')
    assert.ok(ok('https://www.data.gouv.fr/datasets/ban'))
    assert.ok(!ok('https://github.com/data-fair-evil/x'), 'not a path segment boundary')
    assert.ok(!ok('https://github.com/other/repo'))
    assert.ok(!ok('https://github.com/data-fair/../other'), 'dot segments are resolved first')
    assert.ok(!ok('https://github.com/data-fair/%2e%2e/other'), 'encoded dot segments too')
    assert.ok(!ok('https://data.gouv.fr/'), 'no implicit subdomain or parent')
    assert.ok(!urlAllowed(new URL('https://data.gouv.fr.evil.test/'), ['https://data.gouv.fr']), 'not a host boundary')
  })

  test('a site metadata file is allowed on any host with an allowed URL', () => {
    assert.ok(hostAllowed('github.com', ['https://github.com/data-fair']))
    assert.ok(!hostAllowed('api.github.com', ['https://github.com/data-fair']))
    assert.equal(checkUrl('https://github.com/robots.txt', ['https://github.com/data-fair'], 'site').href, 'https://github.com/robots.txt')
    assert.throws(() => checkUrl('https://github.com/robots.txt', ['https://github.com/data-fair']), /not under this agent's allowed URLs/)
  })

  test('checkUrl names the allowlist when refusing', () => {
    assert.equal(checkUrl('https://www.data.gouv.fr/a#b', ['https://www.data.gouv.fr/']).href, 'https://www.data.gouv.fr/a')
    assert.throws(() => checkUrl('https://example.com/', ['https://github.com/data-fair', 'https://docs.koumoul.com/']), /"https:\/\/example.com\/" is not under this agent's allowed URLs \(https:\/\/github.com\/data-fair, https:\/\/docs.koumoul.com\/\)/)
    assert.throws(() => checkUrl('https://example.com/', []), /\(none\)/)
    assert.throws(() => checkUrl('ftp://a.test/', ['https://a.test/']), /only http and https/)
    assert.throws(() => checkUrl('https://u:p@a.test/', ['https://a.test/']), /credentials/)
    assert.throws(() => checkUrl('http://127.0.0.1/', ['https://a.test/']), /IP address/)
    assert.throws(() => checkUrl('/relative', ['https://a.test/']), /not a valid absolute URL/)
  })
})

test.describe('web addresses', () => {
  const none = ipList([])

  test('private, loopback, link-local and mapped addresses are not public', () => {
    for (const address of ['127.0.0.1', '10.1.2.3', '172.20.0.1', '192.168.0.10', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1']) {
      assert.ok(!isPublicAddress(address, none), address)
    }
    for (const address of ['8.8.8.8', '151.101.1.1', '2606:4700::1111', '::ffff:8.8.8.8']) {
      assert.ok(isPublicAddress(address, none), address)
    }
  })

  test('declared public IPs are exceptions', () => {
    const list = ipList(['127.0.0.1', '10.1.0.0/16'])
    assert.ok(isPublicAddress('127.0.0.1', list))
    assert.ok(isPublicAddress('10.1.5.5', list))
    assert.ok(!isPublicAddress('10.2.5.5', list))
    assert.throws(() => ipList(['nope']), /invalid IP/)
  })
})

test.describe('web content', () => {
  test('classifies by content type, sniffing a missing one', () => {
    assert.equal(classifyContent('text/html; charset=utf-8', ''), 'html')
    assert.equal(classifyContent('application/atom+xml', ''), 'feed')
    assert.equal(classifyContent('application/xml', '<?xml version="1.0"?><rss version="2.0">'), 'feed')
    assert.equal(classifyContent('text/xml', '<?xml version="1.0"?><urlset>'), 'xml')
    assert.equal(classifyContent('application/json', '{}'), 'json')
    assert.equal(classifyContent('application/geo+json', '{}'), 'json')
    assert.equal(classifyContent('text/csv', 'a,b'), 'text')
    assert.equal(classifyContent('', '<!DOCTYPE html><html>'), 'html')
    assert.equal(classifyContent('application/pdf', '%PDF'), 'unsupported')
  })

  test('reads the charset of a content type', () => {
    assert.equal(charsetOf('text/html; charset=ISO-8859-1'), 'windows-1252')
    assert.equal(charsetOf('text/html'), 'utf-8')
    assert.equal(charsetOf('text/html; charset=nonsense'), 'utf-8')
  })

  test('paginates at a line break near the end of a page', () => {
    const text = Array.from({ length: 30 }, (_, i) => `line ${i}`.padEnd(9, '.')).join('\n')
    const first = paginate(text, 0, 100)
    assert.ok(first.content.endsWith('\n'))
    assert.equal(first.offset, 0)
    assert.equal(first.nextOffset, first.content.length)
    assert.equal(first.totalLength, text.length)
    let all = first.content
    let next: number | undefined = first.nextOffset
    while (next !== undefined) {
      const page = paginate(text, next, 100)
      all += page.content
      next = page.nextOffset
    }
    assert.equal(all, text)
    assert.deepEqual(paginate('short'), { content: 'short', offset: 0, totalLength: 5 })
  })

  test('extracts an HTML page with its links, GET forms and OpenSearch', async () => {
    const html = `<!doctype html><html><head><title>Datasets</title>
      <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml"></head>
      <body><nav><a href="/">Home</a><a href="/about">About</a><a href="mailto:x@y.z">mail</a></nav>
      <form action="/search" method="get"><input type="text" name="q"><input type="hidden" name="lang" value="fr"><button>Go</button></form>
      <form action="/login" method="post"><input name="user"><input type="password" name="password"></form>
      <form action="/search"><input type="search" name="q"></form>
      <form><input type="search" name="" placeholder="driven by a script"></form>
      <main><article><h1>Base Adresse Nationale</h1><p>${'La Base Adresse Nationale est le référentiel des adresses. '.repeat(10)}</p>
      <p><a href="https://example.com/doc#part">documentation</a></p></article></main></body></html>`
    const page = await extractHtml(html, 'https://site.test/datasets/ban')
    assert.ok(page.markdown.includes('Base Adresse Nationale'))
    assert.ok(!page.markdown.includes('<form'))
    assert.deepEqual(page.links, ['https://site.test/', 'https://site.test/about', 'https://example.com/doc'])
    assert.deepEqual(page.forms, [
      { method: 'GET', action: 'https://site.test/search', fields: ['q'] },
      { method: 'POST', action: 'https://site.test/login', fields: ['user', 'password'] }
    ])
    assert.deepEqual(page.openSearch, ['https://site.test/opensearch.xml'])
    assert.deepEqual(page.searchTemplates, [])
  })

  test('reads schema.org SearchAction templates from JSON-LD', async () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","url":"https://site.test/",
        "potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://site.test/search?q={search_term_string}"},"query-input":"required name=search_term_string"}}]}</script>
      <script type="application/ld+json">[{"@type":"WebSite","potentialAction":[{"@type":"SearchAction","target":"/find?text={query}&page={page?}","query-input":"required name=query"}]}]</script>
      <script type="application/ld+json">{"@type":"WebSite","potentialAction":{"@type":"SearchAction","target":"https://site.test/s?q={q}&sort={sort}","query-input":"required name=q"}}</script>
      <script type="application/ld+json">not json</script>
      </head><body><p>content</p></body></html>`
    const page = await extractHtml(html, 'https://site.test/page')
    // the third requires a {sort} no default can fill: dropped rather than handed over half-filled
    assert.deepEqual(page.searchTemplates, ['https://site.test/search?q={searchTerms}', 'https://site.test/find?text={searchTerms}&page='])
  })

  test('renders RSS and Atom feeds as a dated list', () => {
    const rss = renderFeed(`<?xml version="1.0"?><rss version="2.0"><channel><title>News</title>
      <item><title>First</title><link>https://site.test/1</link><pubDate>Tue, 30 Sep 2026 10:00:00 GMT</pubDate></item>
      <item><title>Second</title><link>https://site.test/2</link></item></channel></rss>`)
    assert.equal(rss.title, 'News')
    assert.equal(rss.markdown, '- 2026-09-30 [First](https://site.test/1)\n- [Second](https://site.test/2)')

    const atom = renderFeed(`<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Releases</title>
      <entry><title>v6.21.2</title><link rel="alternate" type="text/html" href="https://github.com/o/r/releases/tag/v6.21.2"/><updated>2026-09-30T14:19:00Z</updated></entry></feed>`)
    assert.equal(atom.title, 'Releases')
    assert.equal(atom.markdown, '- 2026-09-30 [v6.21.2](https://github.com/o/r/releases/tag/v6.21.2)')

    assert.equal(renderFeed('<rss><channel></channel></rss>').markdown, '(this feed has no entries)')
  })
})

test.describe('web search templates', () => {
  test('normalizes a template to one {searchTerms} placeholder', () => {
    assert.equal(normalizeSearchTemplate('https://a.test/s?q={searchTerms}&p={startPage?}', 'https://a.test/'), 'https://a.test/s?q={searchTerms}&p=')
    assert.equal(normalizeSearchTemplate('/s?q={searchTerms}&n={count}&l={language}', 'https://a.test/x/'), 'https://a.test/s?q={searchTerms}&n=10&l=*')
    assert.equal(normalizeSearchTemplate('https://a.test/s?q={kw}', 'https://a.test/', 'kw'), 'https://a.test/s?q={searchTerms}')
    assert.equal(normalizeSearchTemplate('https://a.test/s?q={searchTerms}&x={custom:thing}', 'https://a.test/'), undefined)
    assert.equal(normalizeSearchTemplate('https://a.test/s', 'https://a.test/'), undefined)
    assert.equal(normalizeSearchTemplate('javascript:search({searchTerms})', 'https://a.test/'), undefined)
  })

  test('reads the result templates of an OpenSearch description, not its suggestion endpoints', () => {
    // fr.wikipedia.org's, as served
    const wikipedia = `<?xml version="1.0"?><OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/"><ShortName>Wikipédia (fr)</ShortName>
      <Url type="text/html" method="get" template="https://fr.wikipedia.org/w/index.php?title=Sp%C3%A9cial:Recherche&amp;search={searchTerms}" />
      <Url type="application/x-suggestions+json" method="get" template="https://fr.wikipedia.org/w/api.php?action=opensearch&amp;search={searchTerms}&amp;namespace=0" />
      <Url type="application/x-suggestions+xml" method="get" template="https://fr.wikipedia.org/w/api.php?action=opensearch&amp;format=xml&amp;search={searchTerms}&amp;namespace=0" />
      </OpenSearchDescription>`
    assert.deepEqual(parseOpenSearchDescription(wikipedia, 'https://fr.wikipedia.org/w/rest.php/v1/search'), [
      'https://fr.wikipedia.org/w/index.php?title=Sp%C3%A9cial:Recherche&search={searchTerms}'
    ])
    const relative = `<OpenSearchDescription><Url template='/search?q={searchTerms}&amp;page={startPage?}' type='text/html'/>
      <Url type="text/html" method="post" template="/post-search"/></OpenSearchDescription>`
    assert.deepEqual(parseOpenSearchDescription(relative, 'https://a.test/opensearch.xml'), ['https://a.test/search?q={searchTerms}&page='])
  })
})

test.describe('web sitemaps', () => {
  test('reads the Sitemap lines of a robots.txt', () => {
    assert.deepEqual(robotsSitemaps('User-agent: *\nDisallow: /admin\nSitemap: https://a.test/s1.xml\nsitemap:https://a.test/s2.xml\n'), ['https://a.test/s1.xml', 'https://a.test/s2.xml'])
    assert.deepEqual(robotsSitemaps('User-agent: *'), [])
  })

  test('parses an index and a urlset, entities and CDATA included', () => {
    const index = parseSitemap(`<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap><loc>https://a.test/s1.xml</loc><lastmod>2026-10-01</lastmod></sitemap>
      <sitemap><loc><![CDATA[https://a.test/s2.xml]]></loc></sitemap></sitemapindex>`)
    assert.deepEqual(index, { kind: 'index', entries: [{ loc: 'https://a.test/s1.xml', lastmod: '2026-10-01' }, { loc: 'https://a.test/s2.xml' }] })

    const urlset = parseSitemap(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
      <url><loc>https://a.test/p?a=1&amp;b=2</loc><image:image><image:loc>https://a.test/i.png</image:loc></image:image></url>
      <url><lastmod>2026-01-01</lastmod></url></urlset>`)
    assert.deepEqual(urlset, { kind: 'urlset', entries: [{ loc: 'https://a.test/p?a=1&b=2' }] })
  })

  // These parsers run on the API's event loop, over bodies an allowed site writes (up to the 10 MB
  // body cap): a backtracking pattern there froze every conversation of the instance.
  test('reads hostile robots.txt, sitemaps and OpenSearch descriptions in linear time', () => {
    const fast = (label: string, fn: () => unknown) => {
      const start = performance.now()
      fn()
      const ms = performance.now() - start
      assert.ok(ms < 200, `${label} took ${Math.round(ms)} ms`)
    }
    fast('blank lines in robots.txt', () => robotsSitemaps('\n'.repeat(60_000)))
    fast('unclosed <url> openers', () => parseSitemap('<urlset>' + '<url>'.repeat(20_000)))
    fast('unclosed <loc> openers', () => parseSitemap('<urlset><url>' + '<loc>'.repeat(20_000) + '</url>'))
    fast('unclosed <Url openers', () => parseOpenSearchDescription('<Url '.repeat(20_000), 'https://a.test/'))
    fast('one huge <Url tag', () => parseOpenSearchDescription('<Url ' + 'a'.repeat(200_000) + '>', 'https://a.test/'))
  })

  test('inflates a .xml.gz sitemap, but not past the size the sitemap protocol allows', () => {
    const xml = '<urlset><url><loc>https://a.test/p</loc></url></urlset>'
    assert.equal(sitemapText(Buffer.from(xml)), xml)
    assert.equal(sitemapText(gzipSync(xml)), xml)
    // 60 MB of zeros gzips to ~60 KB: well under the body cap, far over 50 MB once inflated
    assert.throws(() => sitemapText(gzipSync(Buffer.alloc(60 * 1024 * 1024))), /larger than 50 MB/)
  })

  test('filters by URL substring and by modification date', () => {
    const entries = [
      { loc: 'https://a.test/press/new-dataset', lastmod: '2026-10-02' },
      { loc: 'https://a.test/press/old', lastmod: '2025-01-01' },
      { loc: 'https://a.test/Press/undated' },
      { loc: 'https://a.test/projects/x', lastmod: '2026-10-05T08:00:00+02:00' }
    ]
    assert.deepEqual(filterEntries(entries, { contains: 'press' }).map(e => e.loc), ['https://a.test/press/new-dataset', 'https://a.test/press/old', 'https://a.test/Press/undated'])
    assert.deepEqual(filterEntries(entries, { since: '2026-10-01' }).map(e => e.loc), ['https://a.test/press/new-dataset', 'https://a.test/projects/x'])
    assert.deepEqual(filterEntries(entries, { contains: 'press', since: '2026-10-01' }).map(e => e.loc), ['https://a.test/press/new-dataset'])
    assert.throws(() => filterEntries(entries, { since: 'yesterday' }), /not a valid date/)
  })
})

test.describe('MCP discovery parsing', () => {
  const card = {
    $schema: 'https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json',
    name: 'fr.data-fair/catalog',
    version: '1.0.0',
    description: 'What this portal publishes',
    remotes: [{ type: 'streamable-http', url: 'https://portal.example.org/mcp-server/mcp?profiles=catalog' }]
  }
  test('reads the MCP entries of an AI Catalog, embedded or linked', () => {
    const catalog = JSON.stringify({
      specVersion: '1.0',
      entries: [
        { identifier: 'a', type: 'application/mcp-server-card+json', data: card },
        { identifier: 'b', type: 'application/mcp-server-card+json', url: 'https://portal.example.org/card' },
        { identifier: 'c', type: 'application/a2a-agent-card+json', url: 'https://portal.example.org/agent' }
      ]
    })
    assert.deepEqual(parseAiCatalog(catalog), [{ data: card }, { url: 'https://portal.example.org/card' }])
  })
  test('an unreadable catalog is no catalog', () => {
    assert.deepEqual(parseAiCatalog('<html>'), [])
    assert.deepEqual(parseAiCatalog('{"entries":"x"}'), [])
  })
  test('a card gives its streamable-http endpoint', () => {
    assert.deepEqual(mcpServerFromCard(card), { url: 'https://portal.example.org/mcp-server/mcp?profiles=catalog', name: 'fr.data-fair/catalog', description: 'What this portal publishes' })
  })
  test('a card needing variables or headers, or without an http(s) endpoint, is not usable anonymously', () => {
    assert.equal(mcpServerFromCard({ ...card, remotes: [{ type: 'streamable-http', url: '{base}/mcp' }] }), undefined)
    assert.equal(mcpServerFromCard({ ...card, remotes: [{ type: 'streamable-http', url: 'https://a.example.org/mcp', headers: [{ name: 'Authorization', isRequired: true }] }] }), undefined)
    assert.equal(mcpServerFromCard({ ...card, remotes: [{ type: 'sse', url: 'https://a.example.org/sse' }] }), undefined)
    assert.equal(mcpServerFromCard({ ...card, remotes: [{ type: 'streamable-http', url: 'javascript:alert(1)' }] }), undefined)
    assert.equal(mcpServerFromCard('nope'), undefined)
  })
})
