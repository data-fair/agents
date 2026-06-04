/**
 * Verifies the simple-directory "anonymous action token" presented by anonymous
 * callers of cost-bearing endpoints (gateway, summary). The token is issued by
 * SD's rate-limited /api/auth/anonymous-action endpoint and verified here via
 * the JWKS the session singleton was initialized with in server.ts.
 */
import { type Request } from 'express'
import { session, httpError } from '@data-fair/lib-express'
import config from '#config'

export async function assertAnonymousActionToken (req: Request): Promise<void> {
  if (!config.requireAnonymousActionToken) return

  const token = req.get('x-anonymous-token')
  if (!token) throw httpError(401, 'anonymous action token required')

  let decoded: any
  try {
    decoded = await session.verifyToken(token)
  } catch (err: any) {
    if (err?.name === 'NotBeforeError') throw httpError(401, 'anonymous action token not yet valid')
    if (err?.name === 'TokenExpiredError') throw httpError(401, 'anonymous action token expired')
    throw httpError(401, 'invalid anonymous action token')
  }

  if (decoded?.anonymousAction !== true) throw httpError(401, 'invalid anonymous action token')
}
