/**
 * Worker thread entry of ./extractor.ts: runs the CPU-bound extraction away from the event loop that
 * serves every live conversation.
 */

import { parentPort } from 'node:worker_threads'
import { extractHtml, renderFeed } from './extract.ts'

parentPort!.on('message', async ({ id, kind, body, url }: { id: number, kind: 'html' | 'feed', body: string, url: string }) => {
  try {
    const result = kind === 'html' ? await extractHtml(body, url) : renderFeed(body)
    parentPort!.postMessage({ id, result })
  } catch (err: any) {
    parentPort!.postMessage({ id, error: err.message ?? String(err) })
  }
})
