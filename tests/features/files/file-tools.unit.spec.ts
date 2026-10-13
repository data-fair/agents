/**
 * stateless unit tests of ls, read_file and write_file on a temp directory: what the model reads.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FsBackend } from '../../../api/src/files/fs.ts'
import { createTurnFiles } from '../../../api/src/files/turn-files.ts'
import { createFileTools } from '../../../api/src/files/tools.ts'
import { renderTextPage } from '../../../api/src/files/operations.ts'

let dir: string
let tools: ReturnType<typeof createFileTools>
const call = (name: string, input: unknown) => (tools[name] as any).execute(input, { toolCallId: 't', messages: [] })

test.describe('file tools', () => {
  test.beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'file-tools-'))
    tools = createFileTools(createTurnFiles({ backend: new FsBackend(dir), scope: { ownerType: 'organization', ownerId: 'test1', scopeId: 'c1' }, secret: 's'.repeat(32), publicUrl: 'http://agents' }))
  })
  test.afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  test('ls, then write_file, then ls and read_file', async () => {
    assert.equal(await call('ls', {}), 'You have no files.')
    assert.equal(await call('write_file', { file_path: '/notes.csv', content: 'a,b\n1,2\n' }), 'Wrote /notes.csv (text/csv, 8 B).')
    assert.match(await call('ls', {}), /^Your files \(8 B of 500 MB used; a file is deleted 7 days after it was last written\):\n- \/notes\.csv — text\/csv, 8 B, expires \d{4}-\d\d-\d\dT/)
    assert.equal(await call('read_file', { file_path: '/notes.csv' }), '/notes.csv (text/csv, 8 B, 2 lines): lines 1-2\n     1\ta,b\n     2\t1,2\nEnd of file.')
  })

  test('write_file writes text only, and small text', async () => {
    await assert.rejects(call('write_file', { file_path: '/x.xlsx', content: 'a' }), /write_file writes text: give \/x\.xlsx the extension of a text type/)
    await assert.rejects(call('write_file', { file_path: '/x.txt', content: 'a'.repeat(1_000_001) }), /at most 1 MB/)
    await assert.rejects(call('write_file', { file_path: '/x.txt' }), /content must be a string/)
  })

  test('read_file of a binary file says what it is and what to do with it', async () => {
    const files = createTurnFiles({ backend: new FsBackend(dir), scope: { ownerType: 'organization', ownerId: 'test1', scopeId: 'c1' }, secret: 's'.repeat(32), publicUrl: 'http://agents' })
    const { Readable } = await import('node:stream')
    await files.save('blob.bin', Readable.from([Buffer.alloc(3)]), 3)
    assert.equal(await call('read_file', { file_path: '/blob.bin' }), '/blob.bin is application/octet-stream (3 B): a binary file, which cannot be read here. Pass its path to a tool that takes a file.')
  })
})

test.describe('renderTextPage', () => {
  const file = { path: '/a.txt', mimeType: 'text/plain', size: 100 }
  const text = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n')
  test('pages by lines from a 0-based offset, and says where to read on', () => {
    assert.equal(renderTextPage(file, text, 2, 3), '/a.txt (text/plain, 100 B, 10 lines): lines 3-5\n     3\tline 3\n     4\tline 4\n     5\tline 5\nRead on with offset 5.')
  })
  test('an offset past the end says how many lines there are', () => {
    assert.equal(renderTextPage(file, text, 20, 3), '/a.txt (text/plain, 100 B, 10 lines): nothing from offset 20, the file has 10 lines.')
  })
  test('a page stops at the character budget, and a file read in part says so', () => {
    const long = Array.from({ length: 5 }, () => 'x'.repeat(9000)).join('\n')
    const page = renderTextPage({ ...file, size: 45000 }, long, 0, 500, true)
    assert.match(page, /^\/a\.txt \(text\/plain, 45 kB, 5 lines in its first 10 MB\): lines 1-2\n/)
    assert.match(page, /Read on with offset 2\.$/)
  })
})
