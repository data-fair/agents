/**
 * Runs ./extract.ts in one worker thread, started on first use. A job that runs too long terminates
 * the worker — a pathological page cannot hold it — and the next job starts a fresh one.
 */

import { Worker } from 'node:worker_threads'
import type { ExtractedFeed, ExtractedPage } from './extract.ts'

export interface Extractor {
  extract: {
    (kind: 'html', body: string, url: string): Promise<ExtractedPage>
    (kind: 'feed', body: string, url: string): Promise<ExtractedFeed>
  }
  close: () => Promise<void>
}

interface Pending {
  resolve: (result: any) => void
  reject: (err: Error) => void
  timer: NodeJS.Timeout
}

export const createExtractor = (opts: { timeoutMs?: number } = {}): Extractor => {
  const timeoutMs = opts.timeoutMs ?? 20_000
  const pending = new Map<number, Pending>()
  let worker: Worker | undefined
  let nextId = 0

  const failAll = (err: Error) => {
    for (const p of pending.values()) {
      clearTimeout(p.timer)
      p.reject(err)
    }
    pending.clear()
    worker = undefined
  }

  const getWorker = () => {
    if (worker) return worker
    const w = new Worker(new URL('./extract-worker.ts', import.meta.url), { resourceLimits: { maxOldGenerationSizeMb: 256 } })
    w.on('message', ({ id, result, error }) => {
      const p = pending.get(id)
      if (!p) return
      pending.delete(id)
      clearTimeout(p.timer)
      if (error) p.reject(new Error(`could not extract the content: ${error}`))
      else p.resolve(result)
      if (!pending.size) w.unref()
    })
    w.on('error', err => { if (worker === w) failAll(err) })
    w.on('exit', () => { if (worker === w) failAll(new Error('the extraction worker stopped')) })
    worker = w
    return w
  }

  const extract = (kind: 'html' | 'feed', body: string, url: string) => new Promise<any>((resolve, reject) => {
    const w = getWorker()
    w.ref()
    const id = nextId++
    const timer = setTimeout(() => {
      failAll(new Error(`the content of ${url} took too long to extract`))
      w.terminate().catch(() => {})
    }, timeoutMs)
    pending.set(id, { resolve, reject, timer })
    w.postMessage({ id, kind, body, url })
  })

  return {
    extract: extract as Extractor['extract'],
    close: async () => {
      const w = worker
      failAll(new Error('the extractor was closed'))
      await w?.terminate()
    }
  }
}
