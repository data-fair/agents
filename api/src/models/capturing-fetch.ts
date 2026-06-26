/**
 * A fetch wrapper that records the raw upstream request/response into a sink, for
 * trace storage. Linear passthrough: the response body is piped through a
 * TransformStream that copies chunks into the sink as the consumer reads them, so
 * capture completes exactly when the SDK finishes reading — no clone(), no tee(),
 * no background race, and nothing happens if the body is never read.
 * Only the request URL and body are recorded — never headers (no API-key leakage).
 */
export const UPSTREAM_RAW_CAP = 256 * 1024

export interface UpstreamCaptureSink {
  request?: { url: string, body: any, bodyChars: number }
  response?: { status: number, raw: string, rawChars: number, truncated?: boolean }
}

export function createCapturingFetch (
  sink: UpstreamCaptureSink,
  opts: { baseFetch?: typeof fetch, cap?: number } = {}
): typeof fetch {
  const baseFetch = opts.baseFetch ?? globalThis.fetch
  const cap = opts.cap ?? UPSTREAM_RAW_CAP
  return (async (input: any, init?: any): Promise<Response> => {
    const url = typeof input === 'string' ? input : (input?.url ?? String(input))
    const rawBody = typeof init?.body === 'string' ? init.body : undefined
    if (rawBody !== undefined) {
      let body: any = rawBody
      try { body = JSON.parse(rawBody) } catch { /* keep the string form */ }
      sink.request = { url, body, bodyChars: rawBody.length }
    } else {
      sink.request = { url, body: undefined, bodyChars: 0 }
    }

    const res = await baseFetch(input, init)
    if (!res.body) {
      const text = await res.clone().text().catch(() => '')
      sink.response = { status: res.status, raw: text.slice(0, cap), rawChars: text.length, ...(text.length > cap ? { truncated: true } : {}) }
      return res
    }

    let raw = ''
    let total = 0
    let truncated = false
    const decoder = new TextDecoder()
    const ts = new TransformStream<Uint8Array, Uint8Array>({
      transform (chunk, controller) {
        const text = decoder.decode(chunk, { stream: true })
        total += text.length
        if (!truncated && raw.length < cap) {
          if (raw.length + text.length <= cap) raw += text
          else { raw += text.slice(0, cap - raw.length); truncated = true }
        } else if (total > cap) {
          truncated = true
        }
        controller.enqueue(chunk)
      },
      flush () {
        sink.response = { status: res.status, raw, rawChars: total, ...(truncated ? { truncated: true } : {}) }
      }
    })
    return new Response(res.body.pipeThrough(ts), { status: res.status, statusText: res.statusText, headers: res.headers })
  }) as typeof fetch
}
