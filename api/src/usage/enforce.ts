/**
 * Shared request-time usage gating for the gateway and summary endpoints.
 *
 * Two responsibilities, kept here so both routers stay in sync:
 * - resolveUsageIdentity: assert the caller may use the model and figure out how
 *   their usage is tracked (per-user / per-IP, and whether they belong to the
 *   untrusted anonymous+external pool).
 * - enforceQuotas: run the account-wide, untrusted-pool and per-user quotas in
 *   order and surface the first violation.
 */

import crypto from 'node:crypto'
import type { Request } from 'express'
import type { AccountKeys } from '@data-fair/lib-express'
import { reqIp } from '@data-fair/lib-express/req-origin.js'
import type { Settings } from '#types'
import { assertCanUseModel, assertRoleQuota, getEffectiveRole, type EffectiveRole } from '../auth.ts'
import { assertAnonymousActionToken } from '../anonymous-token/service.ts'
import { getUsage, getOwnerUsage } from './service.ts'
import { firstQuotaViolation, isUntrustedRole, type QuotaCheckInput, type QuotaExceeded } from './operations.ts'

type Quotas = NonNullable<Settings['quotas']>

// sentinel userId for the aggregate anonymous + external usage record
export const UNTRUSTED_POOL_ID = 'pool:untrusted'

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
  const session = sessionState
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
 * Enforce account-wide, untrusted-pool and per-user quotas, in that order.
 * Returns the first violation (for a 429 response) or null when within all limits.
 */
export async function enforceQuotas (owner: AccountKeys, quotas: Quotas, identity: UsageIdentity): Promise<QuotaExceeded | null> {
  const checks: (QuotaCheckInput | null)[] = []

  // account-wide cap (everyone combined)
  const globalLimits = quotas.global
  if (globalLimits && !globalLimits.unlimited && globalLimits.monthlyLimit) {
    const usage = await getOwnerUsage(owner)
    checks.push({ usage, limits: globalLimits, scope: identity.trackPerUser ? 'organization' : 'user' })
  }

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
