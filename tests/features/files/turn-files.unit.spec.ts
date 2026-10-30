/**
 * stateless unit tests of one scope's files, on the fs backend in a temp directory: bounds, names,
 * overwrite, reads, signing, and what the model is told when something fails.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { FsBackend } from '../../../api/src/files/fs.ts'
import { createTurnFiles, type TurnFiles } from '../../../api/src/files/turn-files.ts'
import { checkFileSignature, FileError } from '../../../api/src/files/operations.ts'
import type { FileBackend } from '../../../api/src/files/types.ts'

const scope = { ownerType: 'organization' as const, ownerId: 'test1', scopeId: 'conv1' }
const secret = 's'.repeat(32)
let dir: string
let backend: FsBackend
const make = (over: Partial<Parameters<typeof createTurnFiles>[0]> = {}): TurnFiles =>
  createTurnFiles({ backend, scope, secret, publicUrl: 'http://agents:8080', ...over })

test.describe('TurnFiles', () => {
  test.beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'turn-files-')); backend = new FsBackend(dir) })
  test.afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  test('a written file is listed with its path, type, size and expiry, and read back', async () => {
    const now = new Date('2026-10-13T10:00:00Z')
    const files = make({ now: () => now })
    const written = await files.writeText('/notes.csv', 'street,reason\nRue A,works\n')
    assert.equal(written.path, '/notes.csv')
    assert.equal(written.mimeType, 'text/csv')
    assert.equal(written.size, 26)
    const [listed] = await files.list()
    assert.equal(listed.path, '/notes.csv')
    assert.equal(listed.expiresAt.getTime() - listed.lastModified.getTime(), 7 * 24 * 3600 * 1000)
    const { text, truncated } = await files.readText('notes.csv')
    assert.equal(text, 'street,reason\nRue A,works\n')
    assert.equal(truncated, false)
  })

  test('another scope does not see the files', async () => {
    await make().writeText('/notes.csv', 'x')
    assert.deepEqual(await make({ scope: { ...scope, scopeId: 'conv2' } }).list(), [])
  })

  test('writing an existing name overwrites it, and the scope total counts it once', async () => {
    const files = make({ limits: { file: 100, scope: 150 } })
    await files.writeText('/a.txt', 'x'.repeat(100))
    await files.writeText('/a.txt', 'y'.repeat(100))
    assert.equal((await files.readText('/a.txt')).text, 'y'.repeat(100))
    await files.writeText('/b.txt', 'z'.repeat(50))
    await assert.rejects(files.writeText('/c.txt', 'w'), (err: any) => err instanceof FileError && /150 B limit \(150 B already used\)/.test(err.message))
  })

  test('a file over the per-file bound is refused from its declared size, and from its bytes when undeclared, storing nothing', async () => {
    const files = make({ limits: { file: 10, scope: 1000 } })
    await assert.rejects(files.save('big.bin', Readable.from([Buffer.alloc(20)]), 20), (err: any) => err instanceof FileError && /10 B limit per file/.test(err.message))
    await assert.rejects(files.save('big.bin', Readable.from([Buffer.alloc(5), Buffer.alloc(5), Buffer.alloc(5)])), (err: any) => err instanceof FileError && /limit per file/.test(err.message))
    assert.deepEqual(await files.list(), [])
  })

  test('a download that breaks mid-way stores nothing and says the download failed', async () => {
    const files = make()
    const broken = new Readable({ read () { this.push(Buffer.from('partial')); setImmediate(() => this.destroy(new Error('socket hang up'))) } })
    await assert.rejects(files.save('x.csv', broken), /the download failed: socket hang up/)
    assert.deepEqual(await files.list(), [])
  })

  test('a missing file names the files that exist', async () => {
    const files = make()
    await files.writeText('/a.csv', 'x')
    await assert.rejects(files.stat('/missing.csv'), (err: any) => err instanceof FileError && err.message === 'There is no file named /missing.csv here. Your files: /a.csv.')
    await assert.rejects(files.readText('/missing.csv'), FileError)
  })

  test('an invalid path is refused before the store is touched', async () => {
    await assert.rejects(make().writeText('/a/b.csv', 'x'), (err: any) => err instanceof FileError && /not a valid file path/.test(err.message))
  })

  test('a text file larger than the read bound is read up to it, and says so', async () => {
    const files = make()
    await files.writeText('/big.txt', 'a'.repeat(30))
    const { text, truncated } = await files.readText('/big.txt', 10)
    assert.equal(text, 'a'.repeat(10))
    assert.equal(truncated, true)
  })

  test('a signed URL is for an existing file, and verifies', async () => {
    const files = make({ now: () => new Date(1_000_000) })
    await files.writeText('/a.csv', 'x')
    const { url, file } = await files.signedUrl('/a.csv')
    assert.equal(file.path, '/a.csv')
    const parsed = new URL(url)
    assert.ok(parsed.pathname.endsWith('/api/files/organization/test1/conv1/a.csv'))
    assert.equal(checkFileSignature(secret, scope, 'a.csv', parsed.searchParams.get('exp'), parsed.searchParams.get('sig'), 1000), 'valid')
    await assert.rejects(files.signedUrl('/b.csv'), /There is no file named \/b\.csv here/)
  })

  test('a store failure is named as one, without paths or keys', async () => {
    const failing: FileBackend = { ...backend, lsrWithStats: async () => { throw Object.assign(new Error("EACCES: permission denied, open '/data/organization/test1/conv1/.a.csv.x.part'"), { code: 'EACCES' }) } } as any
    await assert.rejects(make({ backend: failing }).list(), (err: any) => err instanceof FileError && err.message === 'The file store failed (EACCES); your other tools still work.' && !err.message.includes('/'))
  })

  test('a body that errors while the store is being listed is handled, and nothing is stored', async () => {
    const uncaught: Error[] = []
    const onUncaught = (err: Error) => uncaught.push(err)
    process.on('uncaughtException', onUncaught)
    try {
      const slow: FileBackend = { ...backend, lsrWithStats: async (prefix: string) => { await new Promise(resolve => setTimeout(resolve, 50)); return backend.lsrWithStats(prefix) } } as any
      const body = new Readable({ read () {} })
      setTimeout(() => body.destroy(new Error('socket hang up')), 10)
      await assert.rejects(make({ backend: slow }).save('x.csv', body), /the download failed: socket hang up/)
      await new Promise(resolve => setTimeout(resolve, 20))
      assert.deepEqual(uncaught, [])
      assert.deepEqual(await make().list(), [])
    } finally { process.off('uncaughtException', onUncaught) }
  })

  test('a truncated read does not end on a half character', async () => {
    const files = make()
    await files.writeText('/e.txt', 'é'.repeat(10))
    const { text, truncated } = await files.readText('/e.txt', 5)
    assert.equal(text, 'éé')
    assert.equal(truncated, true)
  })

  test('the scope bound hit mid-stream with no declared size says the scope is full', async () => {
    const files = make({ limits: { file: 100, scope: 15 } })
    await files.writeText('/a.txt', 'x'.repeat(10))
    await assert.rejects(files.save('b.txt', Readable.from([Buffer.alloc(4), Buffer.alloc(4)])), (err: any) => err instanceof FileError && /15 B limit \(10 B already used\)/.test(err.message))
    assert.deepEqual((await files.list()).map(f => f.path), ['/a.txt'])
  })
})
