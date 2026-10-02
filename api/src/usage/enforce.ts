/**
 * Shared request-time usage gating for the gateway and summary endpoints.
 *
 * Two responsibilities, kept here so both routers stay in sync:
 * - resolveUsageIdentity: assert the caller may use the model and figure out how
 *   their usage is tracked (per-user / per-IP, and whether they belong to the
 *   untrusted anonymous+external pool).
 * - enforceQuotas: run the untrusted-pool and per-user quotas in order and
 *   surface the first violation.
 */

import crypto from 'node:crypto'
import type { Request } from 'express'
import type { AccountKeys } from '@data-fair/lib-express'
import { reqIp } from '@data-fair/lib-express/req-origin.js'
import type { Settings } from '#types'
import { assertCanUseModel, assertRoleQuota, getEffectiveRole, type EffectiveRole } from '../auth.ts'
import { assertAnonymousActionToken } from '../anonymous-token/service.ts'
import { getUsage, getMonthlyResetsAt } from './service.ts'
import { getCreditInfo } from '../limits/service.ts'
import { firstQuotaViolation, isUntrustedRole, UNTRUSTED_POOL_ID, type QuotaCheckInput, type QuotaExceeded } from './operations.ts'

type Quotas = NonNullable<Settings['quotas']>

// sentinel userId for the aggregate anonymous + external usage record
// Declared in ./operations.ts (pure); re-exported here so existing importers are unaffected.
export { UNTRUSTED_POOL_ID } from './operations.ts'

export interface UsageIdentity {
  trackPerUser: boolean
  usageUserId?: string
  usageUserName?: string
  role: EffectiveRole
  isUntrusted: boolean
  // sentinel userId of the shared pool this request contributes to, if any
  poolId?: string
}

/**
 * Resolve the caller's usage identity and assert they may use the model.
 * Throws 401/403 when the caller is not allowed (mirrors the previous inline gate).
 */
export async function resolveUsageIdentity (req: Request, owner: AccountKeys, quotas: Quotas, sessionState: any, authenticated: boolean): Promise<UsageIdentity> {
  if (!authenticated) {
    // Anonymous path: per-IP tracking, requires a signed anonymous-action token
    assertRoleQuota('anonymous', quotas)
    await assertAnonymousActionToken(req)
    const ipHash = crypto.createHash('sha256').update(reqIp(req)).digest('hex').slice(0, 16)
    return { trackPerUser: true, usageUserId: `anon:${ipHash}`, role: 'anonymous', isUntrusted: true, poolId: UNTRUSTED_POOL_ID }
  }

  // Authenticated path
  return authenticatedUsageIdentity(sessionState, owner, quotas)
}

/**
 * The usage identity of an authenticated caller.
 *
 * Split out of `resolveUsageIdentity` because it needs no `Request`: only the anonymous branch does
 * (for the per-IP hash and the signed action token). That makes it callable from the WEBSOCKET path,
 * where there is a session but no per-turn request — which is what a chat turn on the server-held loop
 * needs to be billed as the person rather than as the agent it is talking to.
 */
export function authenticatedUsageIdentity (sessionState: any, owner: AccountKeys, quotas: Quotas): UsageIdentity {
  const session = sessionState

  // Admin-mode superadmins may consume any account: treat them as an admin of the owner regardless
  // of membership. Quotas still apply and usage is still recorded on the owner, so a superadmin
  // acting on an account they are not a member of is billed to that account rather than untracked.
  if (session.user?.adminMode) {
    const trackPerUser = owner.type === 'organization'
    return {
      trackPerUser,
      usageUserId: trackPerUser ? session.user.id : undefined,
      usageUserName: trackPerUser ? session.user.name : undefined,
      role: 'admin',
      isUntrusted: false
    }
  }

  const isSameAccount = session.account.type === owner.type && session.account.id === owner.id
  const trackPerUser = owner.type === 'organization' || !isSameAccount
  assertCanUseModel(session, owner, quotas)
  const role = getEffectiveRole(session, owner)
  const isUntrusted = isUntrustedRole(role)
  return {
    trackPerUser,
    usageUserId: trackPerUser ? session.user.id : undefined,
    usageUserName: trackPerUser ? session.user.name : undefined,
    role,
    isUntrusted,
    poolId: isUntrusted ? UNTRUSTED_POOL_ID : undefined
  }
}

/**
 * Enforce the org-wide credit cap, then the untrusted-pool and per-user
 * quotas, in that order. Returns the first violation (for a 429 response) or
 * null when within all limits.
 *
 * The account-wide cap is no longer a quota: it is enforced from the
 * account's credits limit (customers-pushed, or the configured default) and
 * checked first, short-circuiting even when the caller's own profile quota
 * is unlimited.
 */
/**
 * The org-wide credit cap from the limits API (customers-pushed, or the configured default).
 *
 * Extracted from enforceQuotas because it has a SECOND caller: a long autonomous run re-checks it
 * between steps. The rest of enforceQuotas is about the caller's role and pool, which cannot change
 * mid-run; this is the shared account resource, and it can be exhausted by other runs while this one
 * is still going. One definition so the two cannot disagree about when the cap is reached.
 */
export async function checkAccountCreditCap (owner: AccountKeys): Promise<QuotaExceeded | null> {
  const { limit, consumption } = await getCreditInfo(owner)
  if (limit >= 0 && consumption >= limit) {
    return {
      allowed: false,
      reason: 'Account credit limit exceeded',
      scope: 'account',
      period: 'monthly',
      usage: consumption,
      limit,
      resetsAt: getMonthlyResetsAt()
    }
  }
  return null
}

export async function enforceQuotas (owner: AccountKeys, quotas: Quotas, identity: UsageIdentity): Promise<QuotaExceeded | null> {
  const accountCap = await checkAccountCreditCap(owner)
  if (accountCap) return accountCap

  const checks: (QuotaCheckInput | null)[] = []

  // combined anonymous + external pool — caps untrusted traffic as a group
  if (identity.isUntrusted) {
    const poolLimits = quotas.untrusted
    if (poolLimits && !poolLimits.unlimited && poolLimits.monthlyLimit) {
      const usage = await getUsage(owner, UNTRUSTED_POOL_ID)
      checks.push({ usage, limits: poolLimits, scope: 'untrusted' })
    }
  }

  // per-user (or per-IP) role cap
  if (identity.trackPerUser) {
    const roleLimits = quotas[identity.role]
    if (roleLimits && !roleLimits.unlimited && roleLimits.monthlyLimit) {
      const usage = await getUsage(owner, identity.usageUserId)
      checks.push({ usage, limits: roleLimits, scope: 'user' })
    }
  }

  return firstQuotaViolation(checks)
}
