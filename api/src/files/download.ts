/**
 * THE download function (spec §4.2): a URL streamed into a scope's files, never through the model, never
 * through the shared web cache. Two modes, chosen by its callers and never by a tool schema:
 *  - anonymous: fetch_url's rules — the allowlist at every redirect hop;
 *  - bound site: a link a catalog tool returned on the site its call was bound to — no allowlist (the URL
 *    is the output of a tool an admin selected), the call's own session when it had one, and it never
 *    leaves that origin, so the credential cannot follow a redirect elsewhere.
 * Both: GET only, public addresses only (SSRF_PUBLIC_IPS exceptions), 15 s to the headers, 30 s idle body,
 * 5 minutes overall. Messages show origin and path only: a redirect target or a link can be presigned.
 */
import net from 'node:net'
import { Transform, type Readable } from 'node:stream'
import { createHash } from 'node:crypto'
import { request, type Agent } from 'undici'
import { checkUrl, displayUrl } from '../web/operations.ts'
import { USER_AGENT } from '../web/client.ts'
import { envPublicIps, ipList, isPublicAddress, publicDispatcher } from '../web/public-lookup.ts'
import { credentialHeaders, type SiteCredentials, type SiteCredential } from '../mcp-servers/operations.ts'
import { parseFilePath, linkCredentialSite, type LinkOrigin, type ResourceLink, type DownloadRecord } from './operations.ts'
import type { TurnFiles } from './turn-files.ts'

export interface OpenedDownload {
  /** The URL that answered, after redirects. */
  url: string
  contentType: string
  contentDisposition?: string
  contentLength?: number
  /** The response's validators, raw: what tells this version apart from a later one. */
  etag?: string
  lastModified?: string
  body: Readable
}

export interface DownloadOptions {
  url: string
  /** The anonymous mode's allowlist (fetch_url's). Unused for a bound site. */
  allowedUrls: string[]
  /** The bound-site mode: the origin the link must stay on, and the session of the call that returned it. */
  site?: { origin: string, credential?: SiteCredential }
  publicIps?: string[]
  signal?: AbortSignal
  maxRedirects?: number
  /** Bound on the whole download, body included (default 5 minutes). */
  deadlineMs?: number
}

const DEADLINE_MS = 5 * 60_000

const dispatchers = new Map<string, Agent>()
const dispatcherFor = (publicIps: string[]) => {
  const key = publicIps.join(',')
  let dispatcher = dispatchers.get(key)
  if (!dispatcher) dispatchers.set(key, dispatcher = publicDispatcher(publicIps, { headersTimeout: 15_000, bodyTimeout: 30_000 }))
  return dispatcher
}

/** undici emits an AbortError on a body destroyed unread: with no listener that is an uncaught exception. */
const discard = (body: Readable) => { body.on('error', () => {}); body.destroy() }

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value

export const openDownload = async (opts: DownloadOptions): Promise<OpenedDownload> => {
  const publicIps = opts.publicIps ?? envPublicIps()
  const exceptions = ipList(publicIps)
  const dispatcher = dispatcherFor(publicIps)
  const signal = AbortSignal.any([AbortSignal.timeout(opts.deadlineMs ?? DEADLINE_MS), ...(opts.signal ? [opts.signal] : [])])
  const check = (raw: string): string => {
    const url = opts.site ? new URL(raw) : checkUrl(raw, opts.allowedUrls)
    if (opts.site && ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.origin !== opts.site.origin)) {
      throw new Error(`"${displayUrl(url.href)}" is not on ${opts.site.origin}, the site this file was linked from`)
    }
    // an IP literal is never resolved, so the dispatcher's lookup would not see it
    const host = url.hostname.replace(/^\[|\]$/g, '')
    if (net.isIP(host) && !isPublicAddress(host, exceptions)) {
      throw new Error(`"${displayUrl(url.href)}" refused, it is not a public address`)
    }
    return url.href
  }
  let url = check(opts.url)
  for (let hop = 0; ; hop++) {
    let res
    try {
      res = await request(url, {
        method: 'GET',
        dispatcher,
        signal,
        headers: { 'user-agent': USER_AGENT, ...credentialHeaders(opts.site?.credential) }
      })
    } catch (err: any) {
      throw new Error(`could not fetch ${displayUrl(url)}: ${err?.cause?.message ?? err.message}`)
    }
    const location = first(res.headers.location)
    if (res.statusCode >= 300 && res.statusCode < 400 && location) {
      discard(res.body as unknown as Readable)
      if (hop >= (opts.maxRedirects ?? 5)) throw new Error(`too many redirects from ${displayUrl(opts.url)}`)
      const target = new URL(location, url).href
      try {
        url = check(target)
      } catch (err: any) {
        throw new Error(`${displayUrl(url)} redirects to ${displayUrl(target)}, which cannot be fetched: ${err.message}`)
      }
      continue
    }
    // anything else that is not a success is not a file: 4xx, 5xx, and a redirect that goes nowhere
    if (res.statusCode >= 300) {
      discard(res.body as unknown as Readable)
      throw new Error(`${displayUrl(url)} answered HTTP ${res.statusCode}`)
    }
    const length = first(res.headers['content-length'])
    // a caller that gives up on the body destroys it: that must not be an uncaught error
    res.body.on('error', () => {})
    return {
      url,
      contentType: first(res.headers['content-type']) ?? '',
      ...(first(res.headers['content-disposition']) ? { contentDisposition: first(res.headers['content-disposition']) } : {}),
      ...(length && /^\d+$/.test(length) ? { contentLength: Number(length) } : {}),
      ...(first(res.headers.etag) ? { etag: first(res.headers.etag) } : {}),
      ...(first(res.headers['last-modified']) ? { lastModified: first(res.headers['last-modified']) } : {}),
      body: res.body as unknown as Readable
    }
  }
}

/**
 * An opened download stored under `name`, answered as its record (DownloadRecord): the SHA-256 is computed as the
 * bytes pass to the store. A store that gives up on the body (a bound passed) destroys the hashing stream, which
 * releases the response too.
 */
export const saveOpened = async (files: TurnFiles, name: string, opened: OpenedDownload): Promise<DownloadRecord> => {
  const hash = createHash('sha256')
  const hashed = new Transform({ transform (chunk, _encoding, callback) { hash.update(chunk); callback(null, chunk) } })
  opened.body.on('error', err => hashed.destroy(err))
  hashed.on('close', () => { if (!opened.body.readableEnded) opened.body.destroy() })
  const file = await files.save(name, opened.body.pipe(hashed), opened.contentLength)
  const lastModified = opened.lastModified && !Number.isNaN(Date.parse(opened.lastModified)) ? new Date(opened.lastModified).toISOString() : undefined
  return {
    file_path: file.path,
    mimeType: file.mimeType,
    size: file.size,
    sha256: hash.digest('hex'),
    ...(opened.etag ? { etag: opened.etag } : {}),
    ...(lastModified ? { lastModified } : {})
  }
}

/** fetch_url with saveAs: the model chose the URL, so anonymous and allowlisted, always (spec §4.2). */
export const saveUrl = async (opts: { url: string, path: string, allowedUrls: string[], files: TurnFiles, publicIps?: string[], signal?: AbortSignal }): Promise<DownloadRecord> => {
  const name = parseFilePath(opts.path)
  const opened = await openDownload({ url: opts.url, allowedUrls: opts.allowedUrls, publicIps: opts.publicIps, signal: opts.signal })
  return await saveOpened(opts.files, name, opened)
}

/**
 * How a turn opens the links its tools return (spec §4.2). The credential is the turn's own: `credentialFor` is the
 * per-turn, per-site cache the catalog calls use (nhi/service.ts agentSiteCredentials), so a link fetch
 * reuses the session of the call that produced it. A bound site outside the account has no session: the
 * link is fetched there anonymously, still without the allowlist — the rule is where the URL came from.
 */
export const createLinkOpener = (opts: { sites: Pick<SiteCredentials, 'credentialFor'>, allowedUrls: string[], publicIps?: string[] }) =>
  async (link: ResourceLink, origin: LinkOrigin, signal?: AbortSignal): Promise<OpenedDownload> => {
    const site = linkCredentialSite(link.uri, origin)
    if (site) {
      const credential = await opts.sites.credentialFor(site)
      return await openDownload({ url: link.uri, allowedUrls: [], site: { origin: site, ...(credential ? { credential } : {}) }, publicIps: opts.publicIps, signal })
    }
    return await openDownload({ url: link.uri, allowedUrls: opts.allowedUrls, publicIps: opts.publicIps, signal })
  }
