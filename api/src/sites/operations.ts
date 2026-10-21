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

/** A site as simple-directory's public listing gives it: what tells its authentication realm. */
export interface ListedSite { host: string, authMode?: string, authOnlyOtherSite?: string }

/**
 * The realm a site authenticates in, mirroring simple-directory's resolveAccountMainSite: `'platform'` (no
 * authMode, or onlyBackOffice), the host of the site it relies on (onlyOtherSite), or its own host. `null` when
 * the chain cannot be resolved from the listing — a backing site not listed, or itself onlyOtherSite, which
 * simple-directory refuses: such a site is unreachable, never an error.
 */
export function siteRealm (site: ListedSite | undefined, byHost: (host: string) => ListedSite | undefined): string | null {
  if (!site?.authMode || site.authMode === 'onlyBackOffice') return 'platform'
  if (site.authMode === 'onlyOtherSite' && site.authOnlyOtherSite) {
    const backing = byHost(site.authOnlyOtherSite)
    if (!backing) return null
    if (!backing.authMode || backing.authMode === 'onlyBackOffice') return 'platform'
    if (backing.authMode === 'onlyOtherSite' && backing.authOnlyOtherSite) return null
    return backing.host.toLowerCase()
  }
  return site.host.toLowerCase()
}

/**
 * The agent's authentication space: the site it was enrolled on (its issuer), then the sites simple-directory
 * lists for its organization (hosts only, served on the enrolment site's protocol) — reachable when they are in
 * the issuer's realm, which is the only place its token endpoint issues tokens for. The enrolment site's realm is
 * its listed entry's, or the platform's when it is not listed (the platform's main site belongs to no organization).
 */
export function accountSites (enrolmentSiteUrl: string, listed: ListedSite[]): { reachable: string[], unreachable: string[] } {
  const protocol = new URL(enrolmentSiteUrl).protocol
  const enrolled = siteOrigin(enrolmentSiteUrl)
  const byHost = (host: string) => listed.find(site => site.host?.toLowerCase() === host.toLowerCase())
  const issuerRealm = siteRealm(byHost(new URL(enrolled).host), byHost) ?? 'platform'
  const reachable = new Set([enrolled])
  const unreachable = new Set<string>()
  for (const site of listed) {
    let origin: string
    // a malformed listed host is skipped: one bad entry must not take the whole listing down
    try { origin = siteOrigin(`${protocol}//${site.host}`) } catch { continue }
    if (reachable.has(origin)) continue
    if (siteRealm(site, byHost) === issuerRealm) reachable.add(origin)
    else unreachable.add(origin)
  }
  return { reachable: [...reachable], unreachable: [...unreachable] }
}
