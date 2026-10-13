/**
 * The HTTP client of the web access module: GET only, no cookies, no credentials, public addresses
 * only, the allowlist checked at every redirect hop, and a cache shared by every agent of the instance.
 *
 * The cache is safe to share BECAUSE no credential is ever sent: every response is public by
 * construction. Should per-domain credentials ever be added, those requests must bypass it.
 */

import http from 'node:http'
import https from 'node:https'
import axios, { type AxiosInstance } from 'axios'
import Debug from 'debug'
import { checkUrl, type UrlScope } from './operations.ts'
import { envPublicIps, ipList, publicLookup } from './public-lookup.ts'

const debug = Debug('agents:web')

export const USER_AGENT = 'data-fair-agents/1.0 (autonomous agent web access; +https://github.com/data-fair/agents)'

export interface WebResponse {
  /** The URL that answered, after redirects. */
  url: string
  status: number
  contentType: string
  /**
   * The same Buffer for as long as the response stays cached, revalidations included — so a caller
   * can memoize what it derives from a body in a WeakMap keyed on it.
   */
  body: Buffer
  headers: Record<string, string>
}

export interface WebClientOptions {
  /** Addresses to treat as public despite their range (SSRF_PUBLIC_IPS by default). */
  publicIps?: string[]
  /** A response is reused without asking the server for at least this long, whatever its headers. */
  freshMs?: number
  cacheMaxBytes?: number
  maxBodyBytes?: number
  timeoutMs?: number
  maxRedirects?: number
}

export interface WebClient {
  /**
   * `accept` sees the final response's type before its body is read, and throws to refuse it.
   */
  get: (url: string, allowedUrls: string[], scope?: UrlScope, accept?: (contentType: string, url: string) => void) => Promise<WebResponse>
  /** Forget every cached response. */
  clear: () => void
}

interface CacheEntry {
  response: WebResponse
  storedAt: number
  freshMs: number
}

const KEPT_HEADERS = ['content-type', 'location', 'etag', 'last-modified', 'cache-control', 'server', 'cf-mitigated']

const maxAgeMs = (cacheControl: string | undefined) => {
  const seconds = /max-age=(\d+)/.exec(cacheControl ?? '')?.[1]
  return seconds ? Number(seconds) * 1000 : 0
}

export const createWebClient = (opts: WebClientOptions = {}): WebClient => {
  const {
    freshMs = 10 * 60_000,
    cacheMaxBytes = 64 * 1024 * 1024,
    maxBodyBytes = 10 * 1024 * 1024,
    timeoutMs = 15_000,
    maxRedirects = 5
  } = opts
  const lookup = publicLookup(ipList(opts.publicIps ?? envPublicIps()))
  const ax: AxiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, lookup: lookup as any }),
    httpsAgent: new https.Agent({ keepAlive: true, lookup: lookup as any }),
    // an environment proxy would resolve names itself, out of reach of the lookup above
    proxy: false,
    maxRedirects: 0,
    validateStatus: () => true,
    responseType: 'stream',
    timeout: timeoutMs,
    headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml,application/json,application/xml;q=0.9,*/*;q=0.8' }
  })

  // insertion-ordered Map as an LRU: a hit is deleted and re-set, eviction takes the oldest
  const cache = new Map<string, CacheEntry>()
  let cacheBytes = 0
  const forget = (key: string) => {
    const entry = cache.get(key)
    if (!entry) return
    cacheBytes -= entry.response.body.length
    cache.delete(key)
  }
  const store = (key: string, entry: CacheEntry) => {
    forget(key)
    if (entry.response.body.length > cacheMaxBytes / 4) return
    cache.set(key, entry)
    cacheBytes += entry.response.body.length
    for (const oldest of cache.keys()) {
      if (cacheBytes <= cacheMaxBytes) break
      forget(oldest)
    }
  }

  /** A streamed body as one Buffer: refused past maxBodyBytes, and past timeoutMs of reading. */
  const readBody = (stream: NodeJS.ReadableStream & { destroy: (err?: Error) => void }, url: string): Promise<Buffer> =>
    new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      let size = 0
      const timer = setTimeout(() => stream.destroy(new Error(`timed out after ${timeoutMs} ms`)), timeoutMs)
      stream.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > maxBodyBytes) {
          stream.destroy(new Error(`the response is larger than ${maxBodyBytes >= 1048576 ? `${maxBodyBytes / 1048576} MB` : `${maxBodyBytes} bytes`}`))
          return
        }
        chunks.push(chunk)
      })
      stream.on('end', () => { clearTimeout(timer); resolve(Buffer.concat(chunks)) })
      stream.on('error', (err: Error) => { clearTimeout(timer); reject(new Error(`could not fetch ${url}: ${err.message}`)) })
    })

  /** One request, no redirect following: a redirect is a response like any other, and is cached. */
  const getOne = async (url: string, accept?: (contentType: string, url: string) => void): Promise<WebResponse> => {
    const accepted = (response: WebResponse) => {
      if (accept && response.status >= 200 && response.status < 300) accept(response.contentType, url)
      return response
    }
    const cached = cache.get(url)
    if (cached) {
      cache.delete(url)
      cache.set(url, cached)
      if (Date.now() - cached.storedAt < cached.freshMs) {
        debug('cache hit %s', url)
        return accepted(cached.response)
      }
    }
    const conditional: Record<string, string> = {}
    if (cached?.response.headers.etag) conditional['if-none-match'] = cached.response.headers.etag
    if (cached?.response.headers['last-modified']) conditional['if-modified-since'] = cached.response.headers['last-modified']

    let res
    try {
      res = await ax.get(url, { headers: conditional })
    } catch (err: any) {
      throw new Error(`could not fetch ${url}: ${err.message}`)
    }
    if (res.status === 304 && cached) {
      res.data.destroy()
      debug('revalidated %s', url)
      cached.storedAt = Date.now()
      return accepted(cached.response)
    }
    const headers: Record<string, string> = {}
    for (const name of KEPT_HEADERS) {
      const value = res.headers[name]
      if (value !== undefined && value !== null) headers[name] = String(value)
    }
    const contentType = headers['content-type'] ?? ''
    // Refused from the headers, before the body is read (spec §4.2): a binary file is never downloaded to be thrown away.
    if (accept && res.status >= 200 && res.status < 300) {
      try { accept(contentType, url) } catch (err) { res.data.destroy(); throw err }
    }
    const response: WebResponse = { url, status: res.status, contentType, body: await readBody(res.data, url), headers }
    debug('fetched %s %d %d bytes', url, res.status, response.body.length)
    // server errors are not kept: the next call tries again
    if (res.status < 500 && !/no-store/.test(headers['cache-control'] ?? '')) {
      store(url, { response, storedAt: Date.now(), freshMs: Math.max(freshMs, maxAgeMs(headers['cache-control'])) })
    }
    return response
  }

  const get = async (rawUrl: string, allowedUrls: string[], scope: UrlScope = 'page', accept?: (contentType: string, url: string) => void): Promise<WebResponse> => {
    let url = checkUrl(rawUrl, allowedUrls, scope).href
    for (let hop = 0; ; hop++) {
      const response = await getOne(url, accept)
      const location = response.headers.location
      if (response.status < 300 || response.status >= 400 || !location) return response
      if (hop >= maxRedirects) throw new Error(`too many redirects from ${rawUrl}`)
      // the allowlist applies to every hop, not only to the URL the agent asked for
      const target = new URL(location, url).href
      try {
        url = checkUrl(target, allowedUrls, scope).href
      } catch (err: any) {
        throw new Error(`${url} redirects to ${target}, which cannot be fetched: ${err.message}`)
      }
    }
  }

  return {
    get,
    clear: () => { cache.clear(); cacheBytes = 0 }
  }
}
