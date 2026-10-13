/**
 * stateless unit tests of the S3 backend's own logic, at the client level with aws-sdk-client-mock: which
 * commands it sends with which keys and prefixes, how it reads several listing pages, maps a 404, and
 * writes through lib-storage's Upload. The contract against a real server is in backends.unit.spec.ts
 * (S3_TEST_ENDPOINT).
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { mockClient } from 'aws-sdk-client-mock'
import {
  S3Client, ListObjectsV2Command, HeadObjectCommand, GetObjectCommand, PutObjectCommand, DeleteObjectCommand,
  CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand
} from '@aws-sdk/client-s3'
import { S3Backend } from '../../../api/src/files/s3.ts'

const s3 = mockClient(S3Client)
const backend = () => new S3Backend({ bucket: 'agents', endpoint: 'http://s3.test', region: 'us-east-1', credentials: { accessKeyId: 'k', secretAccessKey: 's' }, forcePathStyle: true })
const notFound = () => Object.assign(new Error('NotFound'), { name: 'NotFound', $metadata: { httpStatusCode: 404 } })
const bodyOf = async (body: unknown) => {
  if (body instanceof Readable) { const chunks: Buffer[] = []; for await (const c of body) chunks.push(Buffer.from(c)); return Buffer.concat(chunks).toString() }
  return Buffer.from(body as Uint8Array).toString()
}

test.describe('S3Backend', () => {
  test.beforeEach(() => { s3.reset() })
  test.afterAll(() => { s3.restore() })

  test('a listing reads every page, under the prefix with a trailing slash, paths relative to it', async () => {
    const at = new Date('2026-10-13T10:00:00Z')
    s3.on(ListObjectsV2Command)
      .resolvesOnce({ Contents: [{ Key: 'agent-files/organization/test1/c1/a.csv', Size: 3, LastModified: at }], IsTruncated: true, NextContinuationToken: 'page-2' })
      .resolvesOnce({ Contents: [{ Key: 'agent-files/organization/test1/c1/b.json', Size: 5, LastModified: at }], IsTruncated: false })
    const listed = await backend().lsrWithStats('agent-files/organization/test1/c1')
    assert.deepEqual(listed, [{ path: 'a.csv', size: 3, lastModified: at }, { path: 'b.json', size: 5, lastModified: at }])
    const calls = s3.commandCalls(ListObjectsV2Command).map(call => call.args[0].input)
    assert.equal(calls.length, 2)
    assert.equal(calls[0].Bucket, 'agents')
    assert.equal(calls[0].Prefix, 'agent-files/organization/test1/c1/', 'a trailing slash: `c1` must not match `c10`')
    assert.equal(calls[1].ContinuationToken, 'page-2')
  })

  test('stats and reads use the key as is; a 404 is a not-found, any other error is not', async () => {
    const at = new Date('2026-10-13T10:00:00Z')
    s3.on(HeadObjectCommand, { Key: 'agent-files/o/c/a.csv' }).resolves({ ContentLength: 3, LastModified: at })
    s3.on(HeadObjectCommand, { Key: 'agent-files/o/c/missing.csv' }).rejects(notFound())
    s3.on(GetObjectCommand, { Key: 'agent-files/o/c/a.csv' }).resolves({ Body: Readable.from([Buffer.from('a,b')]) as any, ContentLength: 3, LastModified: at })
    s3.on(GetObjectCommand, { Key: 'agent-files/o/c/missing.csv' }).rejects(Object.assign(new Error('NoSuchKey'), { name: 'NoSuchKey', $metadata: { httpStatusCode: 404 } }))
    s3.on(HeadObjectCommand, { Key: 'agent-files/o/c/denied.csv' }).rejects(Object.assign(new Error('AccessDenied'), { name: 'AccessDenied', $metadata: { httpStatusCode: 403 } }))

    assert.deepEqual(await backend().fileStats('agent-files/o/c/a.csv'), { size: 3, lastModified: at })
    await assert.rejects(backend().fileStats('agent-files/o/c/missing.csv'), (err: any) => err.status === 404)
    await assert.rejects(backend().fileStats('agent-files/o/c/denied.csv'), (err: any) => err.status !== 404 && /AccessDenied/.test(err.message))
    const read = await backend().readStream('agent-files/o/c/a.csv')
    assert.equal(read.size, 3)
    assert.equal(await bodyOf(read.body), 'a,b')
    await assert.rejects(backend().readStream('agent-files/o/c/missing.csv'), (err: any) => err.status === 404)
  })

  test('a small write is one PutObject of the whole stream under the key', async () => {
    let sent: any
    s3.on(PutObjectCommand).callsFake(async (input, getClient) => {
      // aws-sdk-client-mock README, "Lib Storage Upload": Upload builds the object's location from the endpoint.
      getClient().config.endpoint = () => ({ hostname: '' }) as any
      sent = input
      return {}
    })
    await backend().writeStream(Readable.from([Buffer.from('a,b\n'), Buffer.from('1,2\n')]), 'agent-files/o/c/data.csv')
    assert.equal(sent.Bucket, 'agents')
    assert.equal(sent.Key, 'agent-files/o/c/data.csv')
    assert.equal(await bodyOf(sent.Body), 'a,b\n1,2\n')
  })

  test('a large write is a multipart upload; a source that fails stores nothing', async () => {
    s3.on(CreateMultipartUploadCommand).resolves({ UploadId: 'u1' })
    s3.on(UploadPartCommand).resolves({ ETag: '"e"' })
    s3.on(CompleteMultipartUploadCommand).resolves({})
    s3.on(AbortMultipartUploadCommand).resolves({})
    await backend().writeStream(Readable.from([Buffer.alloc(6 * 1024 * 1024, 1)]), 'agent-files/o/c/big.bin')
    assert.equal(s3.commandCalls(CreateMultipartUploadCommand)[0].args[0].input.Key, 'agent-files/o/c/big.bin')
    assert.equal(s3.commandCalls(CompleteMultipartUploadCommand).length, 1)

    // the stream's end is unknown when its first chunk arrives, so Upload opens a multipart upload before it learns the source broke
    s3.reset()
    s3.on(PutObjectCommand).resolves({})
    s3.on(CreateMultipartUploadCommand).resolves({ UploadId: 'u2' })
    s3.on(UploadPartCommand).resolves({ ETag: '"e"' })
    s3.on(CompleteMultipartUploadCommand).resolves({})
    s3.on(AbortMultipartUploadCommand).resolves({})
    // one chunk, then the failure: a source that keeps pushing until a macrotask runs would spin forever against a mock
    // whose every answer is a microtask
    let pushed = false
    const failing = new Readable({ read () { if (pushed) return; pushed = true; this.push(Buffer.from('partial-')); setImmediate(() => this.destroy(new Error('the source broke'))) } })
    await assert.rejects(backend().writeStream(failing, 'agent-files/o/c/broken.csv'), /the source broke/)
    assert.equal(s3.commandCalls(PutObjectCommand).length, 0, 'nothing was put')
    assert.equal(s3.commandCalls(CompleteMultipartUploadCommand).length, 0, 'never completed')
    assert.equal(s3.commandCalls(AbortMultipartUploadCommand).length, s3.commandCalls(CreateMultipartUploadCommand).length, 'every multipart upload opened was aborted')
  })

  test('removing a file deletes its key; removing a prefix deletes every key of every page under it', async () => {
    s3.on(DeleteObjectCommand).resolves({})
    s3.on(ListObjectsV2Command)
      .resolvesOnce({ Contents: [{ Key: 'agent-files/o/c/a.csv' }, { Key: 'agent-files/o/c/b.csv' }], IsTruncated: true, NextContinuationToken: 'p2' })
      .resolvesOnce({ Contents: [{ Key: 'agent-files/o/c/c.csv' }], IsTruncated: false })
    await backend().removeFile('agent-files/o/x/one.csv')
    await backend().removeDir('agent-files/o/c')
    assert.deepEqual(s3.commandCalls(DeleteObjectCommand).map(call => call.args[0].input.Key), ['agent-files/o/x/one.csv', 'agent-files/o/c/a.csv', 'agent-files/o/c/b.csv', 'agent-files/o/c/c.csv'])
    assert.equal(s3.commandCalls(ListObjectsV2Command)[0].args[0].input.Prefix, 'agent-files/o/c/')
  })

  test('checksums only when required: S3-compatible stores refuse the SDK\'s default aws-chunked uploads', async () => {
    const client = (backend() as any).client as S3Client
    assert.equal(await client.config.requestChecksumCalculation(), 'WHEN_REQUIRED')
    assert.equal(await client.config.responseChecksumValidation(), 'WHEN_REQUIRED')
  })
})
