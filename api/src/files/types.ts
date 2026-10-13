/**
 * The file store's backend: the subset of data-fair's `FileBackend` (api/src/files-storage/types.ts) the
 * agents need, same names and semantics, so the two can converge. Keys are relative to the store root
 * (`agent-files/…`) on both backends, where data-fair passes absolute paths under its dataDir.
 */
import type { Readable } from 'node:stream'

export type FileStats = {
  /** Relative to the listed prefix, `/`-separated. */
  path: string
  size: number
  lastModified: Date
}

export interface FileBackend {
  checkAccess (): Promise<void>
  /** Every file under the prefix, recursively; an absent prefix lists nothing. */
  lsrWithStats (prefix: string): Promise<FileStats[]>
  /** Rejects with an httpError 404 when absent. */
  fileStats (key: string): Promise<{ size: number, lastModified: Date }>
  /** Rejects with an httpError 404 when absent. */
  readStream (key: string): Promise<{ body: Readable, size: number, lastModified: Date }>
  /** Stores the whole stream, replacing the key, or nothing when the stream fails. */
  writeStream (body: Readable, key: string): Promise<void>
  removeFile (key: string): Promise<void>
  removeDir (prefix: string): Promise<void>
}
