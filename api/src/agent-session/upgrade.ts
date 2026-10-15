/**
 * What the agent-session upgrade refuses, and how long an accepted socket may speak for the person.
 *
 * Pure, so it is unit tested; service.ts applies it.
 */

import type { SessionState } from '@data-fair/lib-express'
import { siteOriginFromHeaders } from '../sites/operations.ts'

type Headers = Record<string, string | string[] | undefined>

/**
 * Why this upgrade must be refused, or undefined.
 *
 * ORIGIN: the socket is authenticated by the cookie alone, and SameSite=Lax stops a cross-SITE page but
 * not a sibling under the same registrable domain (another portal, an XSS anywhere on it). Such a page
 * could open the socket as the visitor and, unlike a CSRF, read every frame back: cross-site websocket
 * hijacking (OWASP WebSocket Security Cheat Sheet). The chat always opens the socket on its own page's
 * origin, so the Origin a browser sends must be the site the request came through. A browser always
 * sends one on a websocket handshake; a client sending none is not a browser and carries no ambient
 * cookie to borrow, so it is let in, as the stack's HTTP routes let in a request with no Origin.
 *
 * PSEUDO SESSION: simple-directory's read-only sessions, which lib-express confines to GET. The upgrade
 * is a GET, but the socket it opens prompts agents and decides approvals.
 */
export const upgradeRefusal = (headers: Headers, sessionState: SessionState): { status: number, message: string } | undefined => {
  if (sessionState.user?.pseudoSession) return { status: 403, message: 'a pseudo session only allows reading' }
  const origin = Array.isArray(headers.origin) ? headers.origin[0] : headers.origin
  if (origin === undefined) return undefined
  const site = siteOriginFromHeaders(headers)
  if (!site || origin !== site) return { status: 403, message: 'this socket can only be opened from a page of its own site' }
  return undefined
}

/**
 * When the session token the socket was opened with expires (epoch ms), undefined for an anonymous one.
 *
 * Who the socket speaks for is resolved once, at the upgrade: a frame carries no cookie. Past this, its
 * role and memberships are older than any HTTP request of the stack would accept, so the socket is
 * closed and the chat reopens it with the cookie as it is now.
 */
export const sessionExpiresAt = (sessionState: SessionState): number | undefined => {
  const exp = (sessionState.user as { exp?: unknown } | undefined)?.exp
  return typeof exp === 'number' ? exp * 1000 : undefined
}
