/**
 * The fs backend: a directory, on a volume shared by every node when the service is scaled (data-fair's
 * rule for its dataDir). Writes go to a hidden temp file beside the target, synced and renamed into
 * place, so a failed or interrupted write never leaves a truncated file under a real name; a temp file
 * left by a crash is hidden from listings by its name (a stored name never starts with a dot) and swept
 * with everything else.
 */
import { createReadStream, createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { Readable } from 'node:stream'
import { nanoid } from 'nanoid'
import { httpError } from '@data-fair/lib-express'
import type { FileBackend, FileStats } from './types.ts'

export class FsBackend implements FileBackend {
  private root: string

  // explicit dataDir instead of #config so the backend can be constructed in the test process
  constructor (dataDir: string) {
    this.root = path.resolve(dataDir)
  }

  /**
   * Keys come from validated components; this is the defence in depth: a key must name something strictly
   * inside the data directory (never the directory itself). Symlinks are not resolved: only the service
   * writes the data directory, and listings skip symlinks.
   */
  private full (key: string): string {
    const full = path.resolve(this.root, key)
    if (!full.startsWith(this.root + path.sep)) throw new Error(`key outside the data directory: ${key}`)
    return full
  }

  async checkAccess () {
    await fs.mkdir(this.root, { recursive: true })
    const probe = path.join(this.root, '.check-access')
    await fs.writeFile(probe, 'ok')
    await fs.rm(probe, { force: true })
  }

  async lsrWithStats (prefix: string, options: { includeHidden?: boolean } = {}): Promise<FileStats[]> {
    const dir = this.full(prefix)
    let entries
    try {
      entries = await fs.readdir(dir, { recursive: true, withFileTypes: true })
    } catch (err: any) {
      if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return []
      throw err
    }
    const results: FileStats[] = []
    for (const entry of entries) {
      // a name starting with a dot is a writer's temp file (in flight or orphaned by a crash), never a stored file: only the sweep asks to see them
      if (!entry.isFile() || (entry.name.startsWith('.') && !options.includeHidden)) continue
      const file = path.join(entry.parentPath, entry.name)
      const stat = await fs.stat(file).catch(() => undefined)
      if (!stat) continue
      results.push({ path: path.relative(dir, file).split(path.sep).join('/'), size: stat.size, lastModified: stat.mtime })
    }
    return results
  }

  async fileStats (key: string) {
    let stat
    try {
      stat = await fs.stat(this.full(key))
    } catch (err: any) {
      if (err.code === 'ENOENT' || err.code === 'ENOTDIR') throw httpError(404, 'file not found')
      throw err
    }
    if (!stat.isFile()) throw httpError(404, 'file not found')
    return { size: stat.size, lastModified: stat.mtime }
  }

  async readStream (key: string) {
    const { size, lastModified } = await this.fileStats(key)
    return { body: createReadStream(this.full(key)), size, lastModified }
  }

  async writeStream (body: Readable, key: string) {
    let tmp: string | undefined
    try {
      const file = this.full(key)
      await fs.mkdir(path.dirname(file), { recursive: true })
      tmp = path.join(path.dirname(file), `.${path.basename(file)}.${nanoid(8)}.part`)
      await pipeline(body, createWriteStream(tmp))
      // durably flushed before it takes the real name: the volume may be NFS (data-fair's fsyncFile)
      const handle = await fs.open(tmp, 'r')
      try { await handle.sync() } finally { await handle.close() }
      await fs.rename(tmp, file)
    } catch (err) {
      // the caller's source is never left open, whether the failure came before or during the pipeline
      body.destroy()
      if (tmp) await fs.rm(tmp, { force: true })
      throw err
    }
  }

  /** Removes the file, then its emptied parent directories: a swept conversation leaves no directory behind. */
  async removeFile (key: string) {
    const file = this.full(key)
    await fs.rm(file, { force: true })
    let dir = path.dirname(file)
    while (dir.startsWith(this.root + path.sep)) {
      try { await fs.rmdir(dir) } catch { break }
      dir = path.dirname(dir)
    }
  }

  async removeDir (prefix: string) {
    await fs.rm(this.full(prefix), { recursive: true, force: true })
  }
}
