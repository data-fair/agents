/**
 * The file store's backend contract, run against the fs backend on a temp directory and — when
 * S3_TEST_ENDPOINT is set — the S3 backend on a real S3-compatible server (e.g. data-fair's dev RustFS:
 * S3_TEST_ENDPOINT=http://localhost:$S3_PORT S3_TEST_BUCKET=bucketdev S3_TEST_ACCESS_KEY_ID=rustfsadmin
 * S3_TEST_SECRET_ACCESS_KEY=rustfsadmin). The S3 backend's own logic is tested at the client level in
 * s3-backend.unit.spec.ts.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { nanoid } from 'nanoid'
import { FsBackend } from '../../../api/src/files/fs.ts'
import { S3Backend } from '../../../api/src/files/s3.ts'
import type { FileBackend } from '../../../api/src/files/types.ts'

const readAll = async (body: Readable) => {
  const chunks: Buffer[] = []
  for await (const chunk of body) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

/** A source that fails after its first chunk: what a broken download looks like to the store. */
const failingSource = () => new Readable({
  read () {
    this.push(Buffer.from('partial-'))
    setImmediate(() => this.destroy(new Error('the source broke')))
  }
})

const contract = (name: string, open: () => Promise<{ backend: FileBackend, root: string, close: () => Promise<void> }>) => {
  test.describe(`${name} backend contract`, () => {
    let backend: FileBackend
    let root: string
    let close: () => Promise<void>
    test.beforeAll(async () => { ({ backend, root, close } = await open()) })
    test.afterAll(async () => { await backend.removeDir(`${root}/`); await close() })

    test('a written file is read back whole, with its size and a recent last write', async () => {
      await backend.writeStream(Readable.from([Buffer.from('a,b\n'), Buffer.from('1,2\n')]), `${root}/s1/data.csv`)
      const stats = await backend.fileStats(`${root}/s1/data.csv`)
      assert.equal(stats.size, 8)
      assert.ok(Math.abs(stats.lastModified.getTime() - Date.now()) < 10_000)
      const { body, size } = await backend.readStream(`${root}/s1/data.csv`)
      assert.equal(size, 8)
      assert.equal((await readAll(body)).toString(), 'a,b\n1,2\n')
    })

    test('writing an existing key replaces it', async () => {
      await backend.writeStream(Readable.from([Buffer.from('old')]), `${root}/s2/x.txt`)
      await backend.writeStream(Readable.from([Buffer.from('new content')]), `${root}/s2/x.txt`)
      assert.equal((await readAll((await backend.readStream(`${root}/s2/x.txt`)).body)).toString(), 'new content')
    })

    test('a missing key is a 404, for stats and reads', async () => {
      await assert.rejects(backend.fileStats(`${root}/nowhere/x.csv`), (err: any) => err.status === 404)
      await assert.rejects(backend.readStream(`${root}/nowhere/x.csv`), (err: any) => err.status === 404)
    })

    test('a listing holds the files under the prefix only, relative to it — not a sibling sharing its start', async () => {
      for (const key of ['s3/a.csv', 's3/b.json', 's3-sibling/c.csv']) await backend.writeStream(Readable.from([Buffer.from('x')]), `${root}/${key}`)
      const listed = (await backend.lsrWithStats(`${root}/s3/`)).map(f => f.path).sort()
      assert.deepEqual(listed, ['a.csv', 'b.json'])
      assert.deepEqual(await backend.lsrWithStats(`${root}/absent/`), [])
    })

    test('a long listing is read to its end', async () => {
      for (let i = 0; i < 5; i++) await backend.writeStream(Readable.from([Buffer.from(String(i))]), `${root}/s4/f${i}.txt`)
      assert.equal((await backend.lsrWithStats(`${root}/s4/`)).length, 5)
    })

    test('a source that fails mid-way stores nothing', async () => {
      await assert.rejects(backend.writeStream(failingSource(), `${root}/s5/broken.csv`))
      await assert.rejects(backend.fileStats(`${root}/s5/broken.csv`), (err: any) => err.status === 404)
      assert.deepEqual(await backend.lsrWithStats(`${root}/s5/`), [])
    })

    test('removing a file and a prefix', async () => {
      for (const key of ['s6/a.csv', 's6/b.csv', 's6-kept/c.csv']) await backend.writeStream(Readable.from([Buffer.from('x')]), `${root}/${key}`)
      await backend.removeFile(`${root}/s6/a.csv`)
      assert.deepEqual((await backend.lsrWithStats(`${root}/s6/`)).map(f => f.path), ['b.csv'])
      await backend.removeDir(`${root}/s6/`)
      assert.deepEqual(await backend.lsrWithStats(`${root}/s6/`), [])
      assert.deepEqual((await backend.lsrWithStats(`${root}/s6-kept/`)).map(f => f.path), ['c.csv'])
    })

    test('access is checked', async () => {
      await backend.checkAccess()
    })
  })
}

contract('fs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'agent-files-'))
  return { backend: new FsBackend(dir), root: 'agent-files', close: () => rm(dir, { recursive: true, force: true }) }
})

if (process.env.S3_TEST_ENDPOINT) {
  contract('s3 (real)', async () => {
    const backend = new S3Backend({
      bucket: process.env.S3_TEST_BUCKET ?? 'bucketdev',
      endpoint: process.env.S3_TEST_ENDPOINT,
      region: process.env.S3_TEST_REGION ?? 'us-east-1',
      credentials: { accessKeyId: process.env.S3_TEST_ACCESS_KEY_ID, secretAccessKey: process.env.S3_TEST_SECRET_ACCESS_KEY },
      forcePathStyle: true
    })
    return { backend, root: `agent-files-contract-${nanoid(8)}`, close: async () => {} }
  })
}

test.describe('fs backend keys', () => {
  test('a key cannot leave the data directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'agent-files-'))
    try {
      const backend = new FsBackend(dir)
      await assert.rejects(backend.writeStream(Readable.from([Buffer.from('x')]), '../escape.txt'), /outside the data directory/)
      await assert.rejects(backend.fileStats('agent-files/../../escape.txt'), /outside the data directory/)
    } finally { await rm(dir, { recursive: true, force: true }) }
  })
})
