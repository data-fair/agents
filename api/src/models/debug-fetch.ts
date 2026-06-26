/**
 * A fetch wrapper that logs the raw upstream request/response to the `debug`
 * sink, namespaced by provider so logging can be restricted to one provider:
 *   DEBUG=agents:upstream:<type>:<id>   (one provider)
 *   DEBUG=agents:upstream:openai:*      (one provider type)
 *   DEBUG=agents:upstream:*             (everything upstream)
 *
 * Linear passthrough mirroring capturing-fetch.ts: the response body is piped
 * through a TransformStream that accumulates chunks as the consumer reads them,
 * so logging completes when the SDK finishes reading — no clone(), no tee().
 * Only the request URL and body are logged — never headers (no API-key leakage).
 * When the namespace is disabled the base fetch is returned unchanged, so there
 * is no per-request or per-chunk cost unless the flag is actually activated.
 */
import createDebug from 'debug'

export function createDebugFetch (
  provider: { type: string, id: string },
  baseFetch: typeof fetch = globalThis.fetch,
  opts: { logger?: (msg: string, ...args: any[]) => void, enabled?: boolean } = {}
): typeof fetch {
  const debug = createDebug(`agents:upstream:${provider.type}:${provider.id}`)
  const enabled = opts.enabled ?? debug.enabled
  if (!enabled) return baseFetch
  const log = opts.logger ?? ((msg: string, ...args: any[]) => { debug(msg, ...args) })

  return (async (input: any, init?: any): Promise<Response> => {
    const url = typeof input === 'string' ? input : (input?.url ?? String(input))
    const rawBody = typeof init?.body === 'string' ? init.body : undefined
    log('request %s\n%s', url, rawBody ?? '(no body)')

    const res = await baseFetch(input, init)
    if (!res.body) {
      const text = await res.clone().text().catch(() => '')
      log('response %d\n%s', res.status, text)
      return res
    }

    let raw = ''
    const decoder = new TextDecoder()
    const ts = new TransformStream<Uint8Array, Uint8Array>({
      transform (chunk, controller) {
        raw += decoder.decode(chunk, { stream: true })
        controller.enqueue(chunk)
      },
      flush () {
        log('response %d\n%s', res.status, raw)
      }
    })
    return new Response(res.body.pipeThrough(ts), { status: res.status, statusText: res.statusText, headers: res.headers })
  }) as typeof fetch
}
