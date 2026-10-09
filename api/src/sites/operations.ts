/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 *
 * A SITE is an origin: the platform serves each organization's domains from the same services, and
 * which one a request came through is what decides the session it may carry (simple-directory's
 * sessions are host-only) and the data it reaches (data-fair resolves the publication site from the
 * host). Sites' path prefix is ignored: it is being deprecated.
 */

type Headers = Record<string, string | string[] | undefined>

const first = (value: string | string[] | undefined): string | undefined =>
  (Array.isArray(value) ? value[0] : value)?.split(',')[0].trim() || undefined

/** The origin of a site URL: lowercase scheme and host, default port dropped, no path. */
export function siteOrigin (url: string): string {
  return new URL(url).origin
}

/**
 * The site a proxied request came through, from its x-forwarded-* headers — what lib-express's
 * reqOrigin computes, but on the plain IncomingMessage of a websocket upgrade, and undefined rather
 * than a throw when the proxy said nothing usable.
 */
export function siteOriginFromHeaders (headers: Headers): string | undefined {
  const host = first(headers['x-forwarded-host'])
  const proto = first(headers['x-forwarded-proto'])
  if (!host || (proto !== 'http' && proto !== 'https')) return undefined
  try {
    const url = new URL(`${proto}://${host}`)
    if (url.pathname !== '/' || url.username || url.search) return undefined
    const port = first(headers['x-forwarded-port'])
    if (port) url.port = port
    return url.origin
  } catch {
    return undefined
  }
}

/** What tells a stack service which site a server-to-server call acts on. */
export function forwardedSiteHeaders (siteUrl: string): { 'x-forwarded-host': string, 'x-forwarded-proto': string } {
  const url = new URL(siteUrl)
  return { 'x-forwarded-host': url.host, 'x-forwarded-proto': url.protocol.slice(0, -1) }
}

/**
 * The agent's authentication space: the site it was enrolled on, and the sites simple-directory lists
 * for its organization (hosts only, served on the enrolment site's protocol).
 */
export function accountSiteOrigins (nhiSiteUrl: string, listedHosts: string[]): string[] {
  const protocol = new URL(nhiSiteUrl).protocol
  return [...new Set([siteOrigin(nhiSiteUrl), ...listedHosts.map(host => siteOrigin(`${protocol}//${host}`))])]
}
