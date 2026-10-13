/**
 * The S3 backend, on @aws-sdk/client-s3 + @aws-sdk/lib-storage as data-fair's (api/src/files-storage/s3.ts).
 * Two differences, both deliberate: the listing PAGINATES (data-fair reads one page of 1,000 keys, which
 * would silently stop the sweep), and checksums are computed only when the API requires them — the SDK's
 * default trailing checksums send `aws-chunked` bodies that several S3-compatible stores refuse.
 */
import { S3Client, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand, PutObjectCommand, paginateListObjectsV2 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import type { Readable } from 'node:stream'
import { httpError } from '@data-fair/lib-express'
import type { FileBackend, FileStats } from './types.ts'

export interface S3BackendOptions {
  bucket: string
  region?: string
  endpoint?: string
  credentials?: { accessKeyId?: string, secretAccessKey?: string }
  forcePathStyle?: boolean
}

const isMissing = (err: any): boolean => err?.name === 'NoSuchKey' || err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404

/** A directory has no object on S3, only a key prefix: without the trailing `/`, `a` would also match `ab`. */
const dirPrefix = (prefix: string) => prefix.endsWith('/') ? prefix : `${prefix}/`

export class S3Backend implements FileBackend {
  private client: S3Client
  private bucket: string

  // explicit options instead of #config so the backend can be constructed in the test process
  constructor (options: S3BackendOptions) {
    this.bucket = options.bucket
    const { accessKeyId, secretAccessKey } = options.credentials ?? {}
    this.client = new S3Client({
      region: options.region || 'us-east-1',
      ...(options.endpoint ? { endpoint: options.endpoint } : {}),
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
      forcePathStyle: options.forcePathStyle ?? true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED'
    })
  }

  async checkAccess () {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: 'check-access.txt', Body: 'ok' }), { requestTimeout: 10_000 } as any)
  }

  async lsrWithStats (prefix: string): Promise<FileStats[]> {
    const listed = dirPrefix(prefix)
    const results: FileStats[] = []
    for await (const page of paginateListObjectsV2({ client: this.client }, { Bucket: this.bucket, Prefix: listed })) {
      for (const object of page.Contents ?? []) {
        if (!object.Key) continue
        results.push({ path: object.Key.slice(listed.length), size: object.Size ?? 0, lastModified: object.LastModified ?? new Date(0) })
      }
    }
    return results
  }

  async fileStats (key: string) {
    try {
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
      return { size: head.ContentLength ?? 0, lastModified: head.LastModified ?? new Date(0) }
    } catch (err) {
      // a HEAD 404 has no body, so the SDK's own message is "UnknownError" (data-fair maps it the same way)
      if (isMissing(err)) throw httpError(404, 'file not found')
      throw err
    }
  }

  async readStream (key: string) {
    try {
      const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
      return { body: object.Body as Readable, size: object.ContentLength ?? 0, lastModified: object.LastModified ?? new Date(0) }
    } catch (err) {
      if (isMissing(err)) throw httpError(404, 'file not found')
      throw err
    }
  }

  async writeStream (body: Readable, key: string) {
    // Upload stores a small stream with one PutObject and a large one as a multipart upload, which it
    // aborts when the stream fails: either way, nothing is stored under the key.
    await new Upload({ client: this.client, params: { Bucket: this.bucket, Key: key, Body: body } }).done()
  }

  async removeFile (key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  async removeDir (prefix: string) {
    // the page size is also the number of parallel deletes (data-fair's removeDir)
    for await (const page of paginateListObjectsV2({ client: this.client, pageSize: 100 }, { Bucket: this.bucket, Prefix: dirPrefix(prefix) })) {
      await Promise.all((page.Contents ?? []).map(object => this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: object.Key }))))
    }
  }
}
