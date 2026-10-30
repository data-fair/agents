/**
 * stateless unit tests of the file store's pure rules: names, keys, scopes, types, signing, config.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  isStoredName, parseFilePath, fileNameFrom, extensionOf, isValidScope, scopeOfRun, scopePrefix, fileKey,
  mimeTypeOf, isTextType, extensionForType, fileSignature, signedFileUrl, checkFileSignature, formatBytes,
  noSuchFileMessage, assertFilesConfig, FileError, SIGNED_URL_TTL_SECONDS, fileArgumentsOf, scrubUrls,
  resourceLinksOf, withResourceLinks, isLinkedToolResult, linkCredentialSite, dispositionFilename, storedNameForLink, uniqueName, rewriteLinkText
} from '../../../api/src/files/operations.ts'

const scope = { ownerType: 'organization' as const, ownerId: 'test1', scopeId: 'conv1' }
const secret = 'x'.repeat(32)

test.describe('file names', () => {
  test('a stored name is one segment with an extension', () => {
    for (const ok of ['report.csv', 'a.b.json', 'Data_2026-10.xlsx', 'x.ndjson']) assert.equal(isStoredName(ok), true, ok)
    for (const ko of ['', 'report', '.hidden.csv', '../x.csv', 'a/b.csv', 'a..csv', 'r é.csv', 'x.toolongextension', 'a'.repeat(101) + '.csv']) assert.equal(isStoredName(ko), false, ko)
  })

  test('a path from the model is one valid name, with or without its leading slash', () => {
    assert.equal(parseFilePath('/report.csv'), 'report.csv')
    assert.equal(parseFilePath('report.csv'), 'report.csv')
    assert.throws(() => parseFilePath('/a/report.csv'), (err: any) => err instanceof FileError && /one name with an extension/.test(err.message) && /"\/report\.csv"/.test(err.message))
    assert.throws(() => parseFilePath('/Rapport été.csv'), FileError)
    assert.throws(() => parseFilePath('/notes'), FileError)
    assert.throws(() => parseFilePath(42), FileError)
  })

  test('names from headers are transliterated to the stored set, never empty', () => {
    assert.equal(fileNameFrom('Rapport été 2026.csv'), 'Rapport-ete-2026.csv')
    assert.equal(fileNameFrom('../../etc/passwd'), 'passwd')
    assert.equal(fileNameFrom('...'), 'file')
    assert.equal(fileNameFrom('a..b.csv'), 'a.b.csv')
    const long = fileNameFrom('a'.repeat(150) + '.csv')
    assert.equal(long.length, 100)
    assert.ok(long.endsWith('.csv'))
    const cut = fileNameFrom('a'.repeat(95) + '.' + 'b'.repeat(20) + '.csv')
    assert.equal(isStoredName(cut), true, cut)
    assert.equal(cut.length <= 100, true)
    assert.equal(fileNameFrom('a'.repeat(99) + '.csv').length <= 100, true)
    assert.equal(isStoredName(fileNameFrom('a'.repeat(99) + '.csv')), true)
    assert.equal(fileNameFrom('a'.repeat(99) + '-' + 'b'.repeat(10)).endsWith('-'), false)
    assert.equal(extensionOf('a.tar.gz'), 'gz')
    assert.equal(extensionOf('closures-city-center'), undefined)
  })
})

test.describe('hostile names', () => {
  test('control characters, percent-encoding and backslashes are refused from the model, sanitized from headers', () => {
    for (const bad of ['/a\nb.csv', '/a\u0000b.csv', '/a\tb.csv', '/%2e.csv', '/%2e%2e.csv', '/a%2Fb.csv', '/..\\..\\x.csv', '/a\\b.csv']) {
      assert.throws(() => parseFilePath(bad), FileError, JSON.stringify(bad))
    }
    assert.throws(() => parseFilePath('a'.repeat(97) + '.csv'), FileError)
    assert.equal(parseFilePath('/' + 'a'.repeat(96) + '.csv'), 'a'.repeat(96) + '.csv')
    assert.equal(fileNameFrom('a\nb\u0000c.csv'), 'a-b-c.csv')
    assert.equal(fileNameFrom('%2e.csv'), '2e.csv')
    assert.equal(fileNameFrom('a%2Fb.csv'), 'a-2Fb.csv')
    assert.equal(fileNameFrom('..\\..\\x.csv'), 'x.csv')
    for (const raw of ['a\nb.csv', '%2e%2e', '..\\..\\x.csv', '\u0000', 'a'.repeat(300)]) {
      const n = fileNameFrom(raw)
      assert.equal(/^[A-Za-z0-9._-]{1,100}$/.test(n) && !n.includes('..'), true, JSON.stringify(raw))
    }
  })
})

test.describe('scopes and keys', () => {
  test('a conversation run is scoped by its conversation, a task run by itself', () => {
    assert.deepEqual(scopeOfRun({ kind: 'conversation', id: 'r1', conversationId: 'c1', owner: { type: 'organization', id: 'test1' } }), { ownerType: 'organization', ownerId: 'test1', scopeId: 'c1' })
    assert.deepEqual(scopeOfRun({ kind: 'task', id: 'r2', owner: { type: 'user', id: 'u1' } }), { ownerType: 'user', ownerId: 'u1', scopeId: 'r2' })
  })

  test('keys follow the layout, and a scope with a traversal component is invalid', () => {
    assert.equal(scopePrefix(scope), 'agent-files/organization/test1/conv1/')
    assert.equal(fileKey(scope, 'report.csv'), 'agent-files/organization/test1/conv1/report.csv')
    assert.equal(isValidScope(scope), true)
    assert.equal(isValidScope({ ...scope, ownerType: 'group' }), false)
    assert.equal(isValidScope({ ...scope, ownerId: '..' }), false)
    assert.equal(isValidScope({ ...scope, scopeId: 'a/b' }), false)
    assert.throws(() => scopeOfRun({ kind: 'conversation', id: 'r', conversationId: '../x', owner: { type: 'organization', id: 'test1' } }))
  })
})

test.describe('types', () => {
  test('from the extension; text types are the readable ones', () => {
    assert.equal(mimeTypeOf('a.csv'), 'text/csv')
    assert.equal(mimeTypeOf('a.json'), 'application/json')
    assert.equal(mimeTypeOf('a.ndjson'), 'application/x-ndjson')
    assert.equal(mimeTypeOf('a.unknownext'), 'application/octet-stream')
    for (const t of ['text/csv', 'application/json', 'application/geo+json', 'application/xml', 'application/x-ndjson', 'text/markdown']) assert.equal(isTextType(t), true, t)
    for (const t of ['application/octet-stream', 'application/pdf', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']) assert.equal(isTextType(t), false, t)
    assert.equal(extensionForType('text/csv; charset=utf-8'), 'csv')
    assert.equal(extensionForType('application/json'), 'json')
    assert.equal(extensionForType(undefined), undefined)
  })
})

test.describe('signed file URLs', () => {
  test('a URL carries its expiry and a signature over the scope, the name and the expiry', () => {
    const url = new URL(signedFileUrl('http://agents:8080/', secret, scope, 'report.csv', 1000))
    assert.equal(url.origin + url.pathname, 'http://agents:8080/api/files/organization/test1/conv1/report.csv')
    assert.equal(url.searchParams.get('exp'), String(1000 + SIGNED_URL_TTL_SECONDS))
    assert.equal(url.searchParams.get('sig'), fileSignature(secret, scope, 'report.csv', 1000 + SIGNED_URL_TTL_SECONDS))
  })

  test('valid until it expires; any other name, scope, expiry or secret is invalid', () => {
    const exp = String(1000 + SIGNED_URL_TTL_SECONDS)
    const sig = fileSignature(secret, scope, 'report.csv', Number(exp))
    assert.equal(checkFileSignature(secret, scope, 'report.csv', exp, sig, 1000), 'valid')
    assert.equal(checkFileSignature(secret, scope, 'report.csv', exp, sig, 1000 + SIGNED_URL_TTL_SECONDS + 1), 'expired')
    assert.equal(checkFileSignature(secret, scope, 'other.csv', exp, sig, 1000), 'invalid')
    assert.equal(checkFileSignature(secret, { ...scope, scopeId: 'conv2' }, 'report.csv', exp, sig, 1000), 'invalid')
    assert.equal(checkFileSignature(secret, scope, 'report.csv', String(Number(exp) + 1), sig, 1000), 'invalid')
    assert.equal(checkFileSignature('y'.repeat(32), scope, 'report.csv', exp, sig, 1000), 'invalid')
    assert.equal(checkFileSignature(secret, scope, 'report.csv', exp, sig.slice(0, -1), 1000), 'invalid')
    assert.equal(checkFileSignature(secret, scope, 'report.csv', undefined, sig, 1000), 'invalid')
    assert.equal(checkFileSignature(secret, scope, 'report.csv', '12abc', sig, 1000), 'invalid')
  })
})

test.describe('messages and config', () => {
  test('sizes read like a person writes them; a missing file names the files that exist', () => {
    assert.equal(formatBytes(512), '512 B')
    assert.equal(formatBytes(1234), '1.2 kB')
    assert.equal(formatBytes(100_000_000), '100 MB')
    assert.equal(noSuchFileMessage('/x.csv', ['/a.csv', '/b.json']), 'There is no file named /x.csv here. Your files: /a.csv, /b.json.')
    assert.equal(noSuchFileMessage('/x.csv', []), 'There is no file named /x.csv here. You have no files yet.')
  })

  test('a files config is complete for its backend or refused at boot', () => {
    assert.doesNotThrow(() => assertFilesConfig(undefined))
    assert.doesNotThrow(() => assertFilesConfig({ storage: 'fs', dataDir: '/data/files', secret, publicUrl: 'http://agents:8080' }))
    assert.throws(() => assertFilesConfig({ storage: 'fs', secret, publicUrl: 'http://agents:8080' }), /files\.dataDir/)
    assert.throws(() => assertFilesConfig({ storage: 's3', secret, publicUrl: 'http://agents:8080' }), /files\.s3\.bucket/)
    assert.throws(() => assertFilesConfig({ storage: 'fs', dataDir: '/d', secret, publicUrl: 'agents:8080' }), /files\.publicUrl/)
  })
})

test.describe('file arguments', () => {
  const schema = {
    type: 'object',
    required: ['file', 'title'],
    properties: {
      file: { type: 'string', format: 'uri', description: 'The CSV to import', 'x-mcp-file': { accept: ['text/csv'], maxSize: 10_000_000 } },
      title: { type: 'string' }
    }
  }

  test('a top-level x-mcp-file property becomes "the path of one of your files", keeping accept and maxSize in words', () => {
    const { schema: rewritten, fileArgs } = fileArgumentsOf(schema)
    assert.deepEqual(fileArgs, ['file'])
    assert.deepEqual(rewritten.properties.file, { type: 'string', description: 'The path of one of your files, as ls lists it (for example "/data.csv"). Accepted types: text/csv. At most 10 MB. The CSV to import' })
    assert.deepEqual(rewritten.properties.title, { type: 'string' })
    assert.deepEqual(rewritten.required, ['file', 'title'])
  })

  test('a tool without the marker is untouched, and a string accept is read as one type', () => {
    assert.deepEqual(fileArgumentsOf({ type: 'object', properties: { q: { type: 'string' } } }), { schema: { type: 'object', properties: { q: { type: 'string' } } }, fileArgs: [] })
    assert.match(fileArgumentsOf({ type: 'object', properties: { f: { type: 'string', 'x-mcp-file': { accept: 'application/json' } } } }).schema.properties.f.description, /Accepted types: application\/json\./)
    assert.deepEqual(fileArgumentsOf(undefined).fileArgs, [])
  })

  test('the boolean form of the marker is a file argument like the object form', () => {
    const { schema, fileArgs } = fileArgumentsOf({ type: 'object', properties: { file: { type: 'string', 'x-mcp-file': true }, off: { type: 'string', 'x-mcp-file': false }, other: { type: 'string' } } })
    assert.deepEqual(fileArgs, ['file'])
    assert.match(schema.properties.file.description, /The path of one of your files/)
    assert.equal(schema.properties.off.type, 'string')
  })

  test('signed URLs are replaced by their path, whole or without their query', () => {
    const replacements = new Map([['http://agents/api/files/organization/t/c/a.csv?exp=1&sig=x', '/a.csv']])
    assert.equal(scrubUrls('could not fetch http://agents/api/files/organization/t/c/a.csv?exp=1&sig=x: 403', replacements), 'could not fetch /a.csv: 403')
    assert.equal(scrubUrls('GET http://agents/api/files/organization/t/c/a.csv failed', replacements), 'GET /a.csv failed')
  })
})

test.describe('scrubUrls — echoes', () => {
  const scope = { ownerType: 'organization' as const, ownerId: 't', scopeId: 'c' }
  const url = signedFileUrl('http://agents', 's'.repeat(32), scope, 'a.csv', 1_800_000_000)
  const sig = new URL(url).searchParams.get('sig')!
  const replacements = new Map([[url, '/a.csv']])

  test('an HTML-escaped, JSON or percent-encoded echo leaks no signature', () => {
    const escaped = url.replace('&', '&amp;')
    assert.equal(scrubUrls(`<a href="${escaped}">x</a>`, replacements), '<a href="/a.csv">x</a>')
    assert.equal(scrubUrls(`<a href="${url.split('?')[0]}?exp=1800000600&amp;sig=${sig}">`, replacements), '<a href="/a.csv">')
    assert.equal(scrubUrls(`{"u":"${url}"}`, replacements), '{"u":"/a.csv"}')
    assert.equal(scrubUrls(`redirect=${encodeURIComponent(url)}&x=1`, replacements), 'redirect=/a.csv&x=1')
    const half = `redirect=${encodeURIComponent(url.split('?')[0])}%3Fexp%3D1800000600%26sig%3D${sig}&x=1`
    assert.ok(!scrubUrls(half, replacements).includes(sig), 'percent-encoded separators')
    assert.ok(!scrubUrls(half, replacements).includes('exp'))
  })

  test('without a signed URL in the call, the text is left alone', () => {
    assert.equal(scrubUrls('?exp=1800000600&sig=' + sig, new Map()), '?exp=1800000600&sig=' + sig)
  })
})

test.describe('links', () => {
  const link = { uri: 'https://portal.example.org/data-fair/api/v1/datasets/roads/raw', name: 'roads' }

  test('resource_link contents are read; a text-only or image result is left as it is', () => {
    const result = { content: [{ type: 'resource_link', uri: link.uri, name: 'roads' }, { type: 'text', text: `Download: ${link.uri}` }] }
    assert.deepEqual(resourceLinksOf(result), [link])
    const wrapped = withResourceLinks(`Download: ${link.uri}`, result, { catalog: true, site: 'https://portal.example.org' })
    assert.ok(isLinkedToolResult(wrapped))
    assert.deepEqual(wrapped, { _agentsLinkResult: true, text: `Download: ${link.uri}`, links: [link], catalog: true, site: 'https://portal.example.org' })
    assert.equal(withResourceLinks('plain', { content: [{ type: 'text', text: 'plain' }] }, { catalog: true }), 'plain')
    const media = { _agentsMediaResult: true as const, media: [] }
    assert.equal(withResourceLinks(media, result, { catalog: true }), media)
    assert.deepEqual(resourceLinksOf({ content: [{ type: 'resource_link', uri: 'file:///etc/passwd', name: 'x' }] }), [])
  })

  test('credentials only for a catalog link on the very site its call was bound to', () => {
    assert.equal(linkCredentialSite(link.uri, { catalog: true, site: 'https://portal.example.org' }), 'https://portal.example.org')
    assert.equal(linkCredentialSite(link.uri, { catalog: true, site: 'https://other.example.org' }), undefined)
    assert.equal(linkCredentialSite(link.uri, { catalog: true }), undefined, 'not site-bound: anonymous')
    assert.equal(linkCredentialSite(link.uri, { catalog: false, site: 'https://portal.example.org' }), undefined, 'external: anonymous')
    assert.equal(linkCredentialSite('http://portal.example.org/x', { catalog: true, site: 'https://portal.example.org' }), undefined, 'another scheme is another origin')
    assert.equal(linkCredentialSite('not a url', { catalog: true, site: 'https://portal.example.org' }), undefined)
  })

  test('the file name comes from Content-Disposition, else the link name, with an extension from the type', () => {
    assert.equal(dispositionFilename('attachment; filename="roads 2026.csv"'), 'roads 2026.csv')
    assert.equal(dispositionFilename("attachment; filename*=UTF-8''r%C3%A9sum%C3%A9.csv; filename=\"resume.csv\""), 'résumé.csv')
    assert.equal(dispositionFilename('attachment; filename=plain.json'), 'plain.json')
    assert.equal(dispositionFilename(undefined), undefined)
    assert.equal(storedNameForLink({ contentDisposition: 'attachment; filename="roads 2026.csv"', contentType: 'text/csv', link }), 'roads-2026.csv')
    assert.equal(storedNameForLink({ contentType: 'text/csv; charset=utf-8', link }), 'roads.csv')
    assert.equal(storedNameForLink({ contentType: 'application/octet-stream', link }), 'roads.bin')
    assert.equal(storedNameForLink({ link: { ...link, mimeType: 'application/json' } }), 'roads.json')
    assert.equal(storedNameForLink({ link: { uri: 'https://x/a/b/report.xlsx', name: '' } }), 'report.xlsx')
    for (const input of [{ contentType: 'text/csv', link }, { link }, { contentType: 'x/unknown', link: { uri: 'https://x/', name: '' } }]) {
      assert.equal(isStoredName(storedNameForLink(input)), true, JSON.stringify(input))
    }
  })

  test('two links with the same name are stored under distinct names', () => {
    const used = new Set<string>()
    assert.equal(uniqueName('a.csv', used), 'a.csv')
    assert.equal(uniqueName('a.csv', used), 'a-2.csv')
    assert.equal(uniqueName('a.csv', used), 'a-3.csv')
  })

  test('the link URL in the text becomes the stored path', () => {
    assert.equal(rewriteLinkText(`Download: ${link.uri} (and ${link.uri})`, link.uri, '/roads.csv'), 'Download: /roads.csv (and /roads.csv)')
  })
})
