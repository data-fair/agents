/**
 * The sweep's pass over one backend (api/src/files/service.ts sweepFiles): no config or mongo, so it is tested
 * on a real backend.
 */
import type { FileBackend } from './types.ts'
import { FILES_ROOT, FILE_TTL_MS } from './operations.ts'

export const sweepBackend = async (backend: FileBackend, now: Date, prefix: string): Promise<number> => {
  if (!prefix.startsWith(`${FILES_ROOT}/`)) throw new Error(`the sweep only reaches ${FILES_ROOT}/`)
  const listed = prefix.endsWith('/') ? prefix : `${prefix}/`
  const cutoff = now.getTime() - FILE_TTL_MS
  // hidden too: a crashed writer's temp file is listed nowhere else, and is outside every quota
  const stale = (await backend.lsrWithStats(listed, { includeHidden: true })).filter(file => file.lastModified.getTime() < cutoff)
  let removed = 0
  for (const file of stale) {
    // one failing key must not abort the pass; the next one retries it
    try {
      await backend.removeFile(`${listed}${file.path}`)
      removed++
    } catch (err) {
      console.error('[files] could not sweep a file', err instanceof Error ? err.message : err)
    }
  }
  return removed
}
