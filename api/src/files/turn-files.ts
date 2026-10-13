/**
 * One scope's files — a conversation's, or a task run's — as a turn uses them: the bounds of spec §3, the
 * names of §3, the messages of §9 and the signed URLs of §4.3. Free of #config, so the unit tests drive it
 * on a temp directory; files/service.ts builds it from the deployment's store.
 */
import { pipeline, Readable, Transform } from 'node:stream'
import type { FileBackend } from './types.ts'
import {
  FILE_MAX_BYTES, SCOPE_MAX_BYTES, FILE_TTL_MS, READ_MAX_BYTES, FileError, fileKey, scopePrefix, isStoredName, parseFilePath,
  mimeTypeOf, signedFileUrl, noSuchFileMessage, fileTooLargeMessage, scopeFullMessage, storageFailureMessage, type FileScope
} from './operations.ts'

export interface StoredFile {
  /** `/<name>`: the flat virtual path the model reads and writes. */
  path: string
  name: string
  mimeType: string
  size: number
  lastModified: Date
  expiresAt: Date
}

export interface TurnFiles {
  readonly scope: FileScope
  list (): Promise<StoredFile[]>
  stat (path: string): Promise<StoredFile>
  readText (path: string, maxBytes?: number): Promise<{ file: StoredFile, text: string, truncated: boolean }>
  writeText (path: string, content: string): Promise<StoredFile>
  /** Store a stream under a sanitized name (not a model path): the bounds are enforced as it streams. */
  save (name: string, body: Readable, declaredSize?: number): Promise<StoredFile>
  signedUrl (path: string): Promise<{ url: string, file: StoredFile }>
}

export interface TurnFilesOptions {
  backend: FileBackend
  scope: FileScope
  secret: string
  publicUrl: string
  limits?: { file: number, scope: number }
  now?: () => Date
}

const isNotFound = (err: any) => err?.status === 404

/** A failure of the store itself, named as one so the model does not take it for its own mistake. */
const storageFailure = (err: any): FileError => err instanceof FileError ? err : new FileError(storageFailureMessage(err?.message ?? String(err)))

export const createTurnFiles = (opts: TurnFilesOptions): TurnFiles => {
  const { backend, scope, secret, publicUrl } = opts
  const limits = opts.limits ?? { file: FILE_MAX_BYTES, scope: SCOPE_MAX_BYTES }
  const now = opts.now ?? (() => new Date())

  const record = (name: string, size: number, lastModified: Date): StoredFile => ({
    path: `/${name}`, name, mimeType: mimeTypeOf(name), size, lastModified, expiresAt: new Date(lastModified.getTime() + FILE_TTL_MS)
  })

  const list = async (): Promise<StoredFile[]> => {
    let stats
    try { stats = await backend.lsrWithStats(scopePrefix(scope)) } catch (err) { throw storageFailure(err) }
    // A nested path or a hidden temp file is not one of the scope's files.
    return stats.filter(s => !s.path.includes('/') && isStoredName(s.path))
      .map(s => record(s.path, s.size, s.lastModified))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const stat = async (path: string): Promise<StoredFile> => {
    const name = parseFilePath(path)
    try {
      const { size, lastModified } = await backend.fileStats(fileKey(scope, name))
      return record(name, size, lastModified)
    } catch (err) {
      if (isNotFound(err)) throw new FileError(noSuchFileMessage(`/${name}`, (await list()).map(f => f.path)))
      throw storageFailure(err)
    }
  }

  const readText = async (path: string, maxBytes = READ_MAX_BYTES) => {
    const file = await stat(path)
    let body: Readable
    try { ({ body } = await backend.readStream(fileKey(scope, file.name))) } catch (err) { throw storageFailure(err) }
    const chunks: Buffer[] = []
    let read = 0
    for await (const chunk of body) {
      const buffer = Buffer.from(chunk)
      chunks.push(buffer.subarray(0, Math.max(0, maxBytes - read)))
      read += buffer.length
      if (read >= maxBytes) { body.destroy(); break }
    }
    return { file, text: new TextDecoder().decode(Buffer.concat(chunks)), truncated: file.size > maxBytes }
  }

  const save = async (name: string, body: Readable, declaredSize?: number): Promise<StoredFile> => {
    if (!isStoredName(name)) { body.destroy(); throw new Error(`invalid stored name ${name}`) }
    const files = await list().catch(err => { body.destroy(); throw err })
    const used = files.filter(f => f.name !== name).reduce((sum, f) => sum + f.size, 0)
    const room = Math.min(limits.file, limits.scope - used)
    const tooLarge = (bytes: number) => new FileError(bytes > limits.file ? fileTooLargeMessage(limits.file) : scopeFullMessage(used, limits.scope))
    if (declaredSize !== undefined && declaredSize > room) { body.destroy(); throw tooLarge(declaredSize) }
    if (room <= 0) { body.destroy(); throw tooLarge(1) }

    // Counted as it streams: a missing or lying Content-Length cannot get past the bounds.
    let seen = 0
    let limitError: FileError | undefined
    let bodyError: Error | undefined
    body.once('error', err => { bodyError = err })
    const limiter = new Transform({
      transform (chunk, _encoding, callback) {
        seen += chunk.length
        if (seen > room) { limitError = tooLarge(seen); callback(limitError) } else callback(null, chunk)
      }
    })
    const limited = pipeline(body, limiter, () => {})
    try {
      await backend.writeStream(limited, fileKey(scope, name))
    } catch (err) {
      body.destroy()
      if (limitError) throw limitError
      if (bodyError) throw new Error(`the download failed: ${bodyError.message}`)
      throw storageFailure(err)
    }
    if (limitError) throw limitError
    if (bodyError) throw new Error(`the download failed: ${bodyError.message}`)
    return await stat(`/${name}`)
  }

  const writeText = async (path: string, content: string) => {
    const name = parseFilePath(path)
    const bytes = Buffer.from(content, 'utf8')
    return await save(name, Readable.from([bytes]), bytes.length)
  }

  const signedUrl = async (path: string) => {
    const file = await stat(path)
    return { url: signedFileUrl(publicUrl, secret, scope, file.name, Math.floor(now().getTime() / 1000)), file }
  }

  return { scope, list, stat, readText, writeText, save, signedUrl }
}
