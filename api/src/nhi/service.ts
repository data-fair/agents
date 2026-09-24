/**
 * service.ts contains stateful logic (config, mongo) built on top of operations.ts
 */

import config from '#config'
import { httpError, reqSiteUrl } from '@data-fair/lib-express'
import type { Request } from 'express'
import { toPublicJwk, nhiIssuerUrl, type NhiPrivateJwk, type NhiPublicJwk } from './operations.ts'

/** The whole NHI feature is off when no signing key is configured. */
export const nhiEnabled = () => !!config.nhiSigningKey

// 501 rather than 404: the caller asked for a coherent capability this deployment has
// not enabled. Composes off nhiEnabled() so there is a single encoding of "is this
// configured" rather than two independent ones drifting apart.
const requireNhi = (): NhiPrivateJwk => {
  if (!nhiEnabled()) throw httpError(501, 'the autonomous agent non-human-identity feature is not configured on this deployment')
  return config.nhiSigningKey as NhiPrivateJwk
}

export const getNhiSigningKey = (): NhiPrivateJwk => requireNhi()

/**
 * Built from the request rather than config, so the `issuer` we echo is always exactly
 * the url simple-directory fetched — it rejects a discovery document that claims a
 * different issuer, and a config value could drift from reality.
 */
export const getNhiDiscovery = (req: Request): { issuer: string, jwks_uri: string } => {
  requireNhi()
  const issuer = nhiIssuerUrl(reqSiteUrl(req))
  return { issuer, jwks_uri: `${issuer}/jwks` }
}

export const getNhiJwks = (): { keys: NhiPublicJwk[] } => ({ keys: [toPublicJwk(requireNhi())] })
