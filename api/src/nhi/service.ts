/**
 * service.ts contains stateful logic (config, mongo) built on top of operations.ts
 */

import config from '#config'
import { httpError } from '@data-fair/lib-express'
import { toPublicJwk, nhiIssuerUrl, nhiAudience, type NhiPrivateJwk, type NhiPublicJwk } from './operations.ts'

/** The whole NHI feature is off when no signing key is configured. */
export const nhiEnabled = () => !!config.nhiSigningKey

const requireNhi = (): { key: NhiPrivateJwk, publicUrl: string } => {
  // 501 rather than 404: the caller asked for a coherent capability this deployment
  // has not enabled, and boot validation already guarantees publicUrl is set whenever
  // the key is.
  if (!config.nhiSigningKey || !config.publicUrl) throw httpError(501, 'the autonomous agent non-human-identity feature is not configured on this deployment')
  return { key: config.nhiSigningKey as NhiPrivateJwk, publicUrl: config.publicUrl }
}

export const getNhiIssuer = (): string => nhiIssuerUrl(requireNhi().publicUrl)

export const getNhiAudience = (): string => nhiAudience(requireNhi().publicUrl)

export const getNhiSigningKey = (): NhiPrivateJwk => requireNhi().key

export const getNhiDiscovery = (): { issuer: string, jwks_uri: string } => {
  const issuer = getNhiIssuer()
  return { issuer, jwks_uri: `${issuer}/jwks` }
}

export const getNhiJwks = (): { keys: NhiPublicJwk[] } => ({ keys: [toPublicJwk(requireNhi().key)] })
