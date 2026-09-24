/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

/** The ES256 private key this deployment signs NHI assertions with. */
export interface NhiPrivateJwk {
  kty: string
  crv: string
  x: string
  y: string
  d: string
  kid: string
  alg?: string
}

/** The same key's public half, as published in the JWKS. */
export interface NhiPublicJwk {
  kty: string
  crv: string
  x: string
  y: string
  kid: string
  alg: string
  use: 'sig'
}

/**
 * Fail-fast boot validation, mirroring assertGlobalAiConfig/assertGlobalMcpConfig.
 *
 * The whole NHI feature is optional: a deployment with no signing key simply does not
 * serve the issuer routes and refuses to mint assertions. But a signing key WITHOUT a
 * publicUrl is a misconfiguration we must catch at boot, because the issuer url has to
 * be stable and identical to what an org admin registered in simple-directory — and
 * this service otherwise only learns its url per-request, which is unavailable in a
 * background run.
 */
export function assertNhiConfig (signingKey: unknown, publicUrl: string | undefined): void {
  if (signingKey === undefined || signingKey === null) return

  if (typeof signingKey !== 'object' || Array.isArray(signingKey)) {
    throw new Error('invalid NHI config: NHI_SIGNING_KEY must be a JSON object (an ES256 private JWK)')
  }
  const key = signingKey as Partial<NhiPrivateJwk>

  if (!publicUrl) throw new Error('invalid NHI config: NHI_SIGNING_KEY requires PUBLIC_URL to be set, so the issuer url is stable')
  try {
    // eslint-disable-next-line no-new
    new URL(publicUrl)
  } catch {
    throw new Error(`invalid NHI config: invalid PUBLIC_URL "${publicUrl}"`)
  }

  if (key.kty !== 'EC') throw new Error('invalid NHI config: NHI_SIGNING_KEY must be an EC key (kty "EC")')
  if (key.crv !== 'P-256') throw new Error('invalid NHI config: NHI_SIGNING_KEY must use curve P-256 (ES256)')
  if (!key.d) throw new Error('invalid NHI config: NHI_SIGNING_KEY must be the private key (missing "d")')
  if (!key.x || !key.y) throw new Error('invalid NHI config: NHI_SIGNING_KEY is missing its public coordinates')
  // Rotation works by publishing a new kid alongside the old one and letting
  // simple-directory's createRemoteJWKSet refetch on an unknown kid. Without a kid
  // there is nothing for it to key on.
  if (!key.kid) throw new Error('invalid NHI config: NHI_SIGNING_KEY must carry a "kid"')
}

/** The JWKS entry. Never returns the private scalar. */
export function toPublicJwk (privateJwk: NhiPrivateJwk): NhiPublicJwk {
  return {
    kty: privateJwk.kty,
    crv: privateJwk.crv,
    x: privateJwk.x,
    y: privateJwk.y,
    kid: privateJwk.kid,
    alg: privateJwk.alg ?? 'ES256',
    use: 'sig'
  }
}

/** Stable issuer url. Must match the `issuer` on the NHI record in simple-directory. */
export function nhiIssuerUrl (publicUrl: string): string {
  return publicUrl.replace(/\/$/, '') + '/api/nhi'
}

/**
 * The `aud` simple-directory checks. It compares against reqSiteUrl(req), which is
 * reqOrigin(req) + reqSitePath(req) — and reqSitePath is empty for the main site, so
 * the audience is the site ORIGIN rather than this service's mount path.
 *
 * A deployment serving agents on a non-main site would need that site's path appended;
 * that is out of scope here.
 */
export function nhiAudience (publicUrl: string): string {
  return new URL(publicUrl).origin
}

/** The `sub` bound on the NHI record. Namespaced so it cannot collide with another subject. */
export function autonomousAgentSubject (autonomousAgentId: string): string {
  return `autonomous-agent:${autonomousAgentId}`
}
