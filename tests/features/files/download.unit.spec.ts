/**
 * The one download function against local servers: allowlist at every hop, a bound-site download that never
 * leaves its origin, the cookie sent to that origin only, bounds enforced while streaming.
 * localhost is declared public, as SSRF_PUBLIC_IPS does for dev-api.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { displayUrl } from '../../../api/src/web/operations.ts'
import { openDownload, saveUrl, createLinkOpener } from '../../../api/src/files/download.ts'
import { FsBackend } from '../../../api/src/files/fs.ts'
import { createTurnFiles } from '../../../api/src/files/turn-files.ts'

const publicIps = ['127.0.0.1', '::1']
const seen: { server: 'a' | 'b', url: string, cookie?: string }[] = []
let a: http.Server, b: http.Server, A: string, B: string

const start = (name: 'a' | 'b', routes: Record<string, (req: http.IncomingMessage, res: http.ServerResponse) => void>) => {
  const server = http.createServer((req, res) => {
    seen.push({ server: name, url: req.url ?? '', cookie: req.headers.cookie })
    const route = routes[(req.url ?? '').split('?')[0]]
    if (route) route(req, res); else res.writeHead(404).end()
  })
  return new Promise<http.Server>(resolve => server.listen(0, '127.0.0.1', () => resolve(server)))
}
const origin = (server: http.Server) => `http://localhost:${(server.address() as AddressInfo).port}`

// File-level: both describes below use the two servers.
test.beforeAll(async () => {
  b = await start('b', { '/elsewhere.csv': (req, res) => res.writeHead(200, { 'content-type': 'text/csv' }).end('b') })
  B = origin(b)
  a = await start('a', {
    // An explicit length: after writeHead, Node would send the body chunked.
    '/data.csv': (req, res) => res.writeHead(200, { 'content-type': 'text/csv', 'content-length': '8', 'content-disposition': 'attachment; filename="data.csv"', etag: '"v1"', 'last-modified': 'Tue, 13 Oct 2026 08:00:00 GMT' }).end('a,b\n1,2\n'),
    '/hop': (req, res) => res.writeHead(302, { location: '/data.csv' }).end(),
    '/away': (req, res) => res.writeHead(302, { location: `${B}/elsewhere.csv` }).end(),
    '/missing': (req, res) => res.writeHead(404).end(),
    '/nowhere': (req, res) => res.writeHead(302).end(),
    '/signed': (req, res) => res.writeHead(302, { location: `${B}/elsewhere.csv?X-Signature=secret#frag` }).end(),
    '/slow': (req, res) => { res.writeHead(200, { 'content-type': 'text/csv' }); res.write('x') },
    '/chunked': (req, res) => { res.writeHead(200, { 'content-type': 'application/octet-stream' }); res.write(Buffer.alloc(600)); res.end(Buffer.alloc(600)) }
  })
  A = origin(a)
})
test.afterAll(async () => { a.close(); b.close() })
test.beforeEach(() => { seen.length = 0 })

test.describe('openDownload', () => {
  test('an anonymous download follows an allowed redirect and gives the headers and the body', async () => {
    const opened = await openDownload({ url: `${A}/hop`, allowedUrls: [A], publicIps })
    assert.equal(opened.url, `${A}/data.csv`)
    assert.equal(opened.contentType, 'text/csv')
    assert.equal(opened.contentDisposition, 'attachment; filename="data.csv"')
    assert.equal(opened.contentLength, 8)
    assert.equal(opened.etag, '"v1"')
    assert.equal(opened.lastModified, 'Tue, 13 Oct 2026 08:00:00 GMT')
    opened.body.destroy()
    assert.ok(seen.every(s => s.cookie === undefined))
  })

  test('an anonymous download is allowlisted at every hop, with the web readers\' messages', async () => {
    await assert.rejects(openDownload({ url: `${B}/elsewhere.csv`, allowedUrls: [A], publicIps }), /is not under this agent's allowed URLs/)
    await assert.rejects(openDownload({ url: `${A}/away`, allowedUrls: [A], publicIps }), /redirects to .*, which cannot be fetched: .*is not under this agent's allowed URLs/)
    await assert.rejects(openDownload({ url: `${A}/missing`, allowedUrls: [A], publicIps }), /answered HTTP 404/)
  })

  test('a bound-site download never leaves its origin, and the cookie goes to that origin only', async () => {
    const opened = await openDownload({ url: `${A}/hop`, allowedUrls: [], site: { origin: A, cookie: 'id_token=abc' }, publicIps })
    opened.body.destroy()
    assert.deepEqual(seen.map(s => [s.server, s.cookie]), [['a', 'id_token=abc'], ['a', 'id_token=abc']])
    seen.length = 0
    await assert.rejects(openDownload({ url: `${A}/away`, allowedUrls: [], site: { origin: A, cookie: 'id_token=abc' }, publicIps }), /is not on http:\/\/localhost:\d+, the site this file was linked from/)
    assert.ok(!seen.some(s => s.server === 'b'), 'the other origin is never contacted')
  })

  test('messages show origin and path only, never a query', async () => {
    const err = await openDownload({ url: `${A}/signed?token=mine`, allowedUrls: [A], publicIps }).catch(e => e)
    assert.match(err.message, /redirects to http:\/\/localhost:\d+\/elsewhere\.csv, which/)
    assert.doesNotMatch(err.message, /secret|token|frag|\?/)
    const site = await openDownload({ url: `${A}/signed`, allowedUrls: [], site: { origin: A }, publicIps }).catch(e => e)
    assert.doesNotMatch(site.message, /secret|\?/)
    const missing = await openDownload({ url: `${A}/missing?sig=abc`, allowedUrls: [A], publicIps }).catch(e => e)
    assert.doesNotMatch(missing.message, /sig=abc/)
    assert.equal(displayUrl('https://u:p@h.test/a/b?x=1#y'), 'https://h.test/a/b')
    assert.equal(displayUrl('not a url?x=1'), 'not a url')
  })

  test('a non-public IP literal is refused in both modes (anonymous already refuses every literal)', async () => {
    await assert.rejects(openDownload({ url: 'http://127.0.0.1:1/x', allowedUrls: ['http://127.0.0.1'], publicIps: [] }), /URLs with an IP address are not accepted/)
    await assert.rejects(openDownload({ url: 'http://127.0.0.1:1/x', allowedUrls: [], site: { origin: 'http://127.0.0.1:1' }, publicIps: [] }), /not a public address/)
    await assert.rejects(openDownload({ url: 'http://[::1]:1/x', allowedUrls: [], site: { origin: 'http://[::1]:1' }, publicIps: [] }), /not a public address/)
  })

  test('a redirect without a location is an error, not a file', async () => {
    await assert.rejects(openDownload({ url: `${A}/nowhere`, allowedUrls: [A], publicIps }), /answered HTTP 302/)
  })

  test('the overall deadline aborts a download that never ends', async () => {
    const opened = await openDownload({ url: `${A}/slow`, allowedUrls: [A], publicIps, deadlineMs: 300 })
    await assert.rejects(new Promise((resolve, reject) => { opened.body.on('error', reject); opened.body.on('end', resolve); opened.body.resume() }))
  })

  test('a non-public address is refused without an exception for it', async () => {
    await assert.rejects(openDownload({ url: `${A}/data.csv`, allowedUrls: [A], publicIps: [] }), /not a public address/)
  })
})

test.describe('saveUrl', () => {
  let dir: string
  test.beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'save-url-')) })
  test.afterEach(async () => { await rm(dir, { recursive: true, force: true }) })
  const files = (limits?: { file: number, scope: number }) => createTurnFiles({ backend: new FsBackend(dir), scope: { ownerType: 'organization', ownerId: 'test1', scopeId: 'c1' }, secret: 's'.repeat(32), publicUrl: 'http://agents', limits })

  test('stores the body under the given path and answers path, type, size and what tells a later version apart', async () => {
    assert.deepEqual(await saveUrl({ url: `${A}/data.csv`, path: '/copy.csv', allowedUrls: [A], files: files(), publicIps }), {
      file_path: '/copy.csv',
      mimeType: 'text/csv',
      size: 8,
      sha256: createHash('sha256').update('a,b\n1,2\n').digest('hex'),
      etag: '"v1"',
      lastModified: '2026-10-13T08:00:00.000Z'
    })
    // No validator headers: the hash alone.
    assert.deepEqual(Object.keys(await saveUrl({ url: `${B}/elsewhere.csv`, path: '/b.csv', allowedUrls: [B], files: files(), publicIps })), ['file_path', 'mimeType', 'size', 'sha256'])
  })

  test('an invalid path is refused before any request', async () => {
    await assert.rejects(saveUrl({ url: `${A}/data.csv`, path: '/a b.csv', allowedUrls: [A], files: files(), publicIps }), /not a valid file path/)
    assert.equal(seen.length, 0)
  })

  test('a body without a length that grows past the bound is aborted, and nothing is stored', async () => {
    const small = files({ file: 1000, scope: 10_000 })
    await assert.rejects(saveUrl({ url: `${A}/chunked`, path: '/big.bin', allowedUrls: [A], files: small, publicIps }), /1 kB limit per file/)
    assert.deepEqual(await small.list(), [])
  })
})

test.describe('createLinkOpener', () => {
  test('only a catalog link on the bound site carries the cookie and skips the allowlist', async () => {
    const asked: string[] = []
    const open = createLinkOpener({ sites: { cookieFor: async (site: string) => { asked.push(site); return 'id_token=abc' } } as any, allowedUrls: [], publicIps })
    const bound = { catalog: true, site: A }
    ;(await open({ uri: `${A}/data.csv`, name: 'd' }, bound)).body.destroy()
    assert.deepEqual(asked, [A])
    assert.deepEqual(seen.map(s => s.cookie), ['id_token=abc'])
    // everything else: anonymous, and the (empty) allowlist applies
    seen.length = 0
    for (const [link, origin] of [
      [{ uri: `${A}/data.csv`, name: 'd' }, { catalog: false, site: A }],
      [{ uri: `${A}/data.csv`, name: 'd' }, { catalog: true }],
      [{ uri: `${B}/elsewhere.csv`, name: 'd' }, bound]
    ] as const) {
      await assert.rejects(open(link, origin), /is not under this agent's allowed URLs/)
    }
    assert.deepEqual(asked, [A], 'no session was even asked for')
    assert.equal(seen.length, 0)
    const anonymous = createLinkOpener({ sites: { cookieFor: async () => 'id_token=abc' } as any, allowedUrls: [A], publicIps })
    ;(await anonymous({ uri: `${A}/data.csv`, name: 'd' }, { catalog: false, site: A })).body.destroy()
    assert.deepEqual(seen.map(s => s.cookie), [undefined])
  })
})
