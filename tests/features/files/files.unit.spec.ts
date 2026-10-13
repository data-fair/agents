/**
 * stateless unit tests of the file store's pure rules: names, keys, scopes, types, signing, config.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  isStoredName, parseFilePath, fileNameFrom, extensionOf, isValidScope, scopeOfRun, scopePrefix, fileKey,
  mimeTypeOf, isTextType, extensionForType, fileSignature, signedFileUrl, checkFileSignature, formatBytes,
  noSuchFileMessage, assertFilesConfig, FileError, SIGNED_URL_TTL_SECONDS
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
    assert.equal(extensionOf('a.tar.gz'), 'gz')
    assert.equal(extensionOf('closures-city-center'), undefined)
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
