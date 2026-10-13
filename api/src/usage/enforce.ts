/**
 * Shared usage gating for the model-spending routes, the chat turns included.
 *
 * Two responsibilities, kept here so both routers stay in sync:
 * - resolveUsageIdentity: assert the caller may use the model and figure out how
 *   their usage is tracked (per-user / per-IP, and whether they belong to the
 *   untrusted anonymous+external pool).
 * - enforceQuotas: run the untrusted-pool and per-user quotas in order and
 *   surface the first violation.
 */

import crypto from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import type { Request } from 'express'
import type { AccountKeys } from '@data-fair/lib-express'
import { reqIp } from '@data-fair/lib-express/req-origin.js'
import type { Settings } from '#types'
import { assertCanUseModel, assertRoleQuota, getEffectiveRole } from '../auth.ts'
import { assertAnonymousActionToken } from '../anonymous-token/service.ts'
import { getUsage, getMonthlyResetsAt } from './service.ts'
import { getCreditInfo } from '../limits/service.ts'
import { firstQuotaViolation, personUsageIdentity, quotaWindows, UNTRUSTED_POOL_ID, type QuotaExceeded, type SelfUsage, type UsageIdentity } from './operations.ts'

export type { SelfUsage } from './operations.ts'

type Quotas = NonNullable<Settings['quotas']>

/**
 * The per-IP key an anonymous caller's usage is recorded and limited under.
 *
 * One function for the HTTP routes and the agent session, so an anonymous visitor's chat turns are
 * charged to the very key the self-usage route reads back. Takes anything with headers: the socket
 * only has the upgrade's plain IncomingMessage.
 */
export function anonymousUsageUserId (req: IncomingMessage | Request): string {
  return `anon:${crypto.createHash('sha256').update(reqIp(req)).digest('hex').slice(0, 16)}`
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
    return personUsageIdentity({ id: anonymousUsageUserId(req) }, 'anonymous', owner)
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
  // An admin-mode superadmin is an admin of any account (getEffectiveRole): billed to that account
  // rather than untracked, with the admin quota.
  assertCanUseModel(sessionState, owner, quotas)
  return personUsageIdentity({ id: sessionState.user.id, name: sessionState.user.name }, getEffectiveRole(sessionState, owner), owner)
}

/**
 * The org-wide credit cap from the limits API (customers-pushed, or the configured default).
 *
 * Its own function because it has a SECOND caller: a long run re-checks it between steps. The pool
 * and the per-user quota are about the caller, which cannot change mid-run; this is the shared
 * account resource, and other runs can exhaust it while this one is still going. One definition so
 * the two cannot disagree about when the cap is reached.
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

/**
 * The shared-budget checks: the org-wide credit cap, then (untrusted callers
 * only) the anonymous+external pool. First of enforceQuotas()'s checks, and
 * what the self-usage view reports as the account status.
 */
export async function accountViolation (owner: AccountKeys, quotas: Quotas, identity: UsageIdentity): Promise<QuotaExceeded | null> {
  const accountCap = await checkAccountCreditCap(owner)
  if (accountCap) return accountCap

  // combined anonymous + external pool — caps untrusted traffic as a group
  if (identity.isUntrusted) {
    const poolLimits = quotas.untrusted
    if (poolLimits && !poolLimits.unlimited && poolLimits.monthlyLimit) {
      const usage = await getUsage(owner, UNTRUSTED_POOL_ID)
      return firstQuotaViolation([{ usage, limits: poolLimits, scope: 'untrusted' }])
    }
  }
  return null
}

/**
 * Enforce the shared budgets (see accountViolation), then the per-user (or
 * per-IP) quota. Returns the first violation (for a 429 response) or null.
 */
export async function enforceQuotas (owner: AccountKeys, quotas: Quotas, identity: UsageIdentity): Promise<QuotaExceeded | null> {
  const shared = await accountViolation(owner, quotas, identity)
  if (shared) return shared

  // per-user (or per-IP) role cap
  if (identity.trackPerUser) {
    const roleLimits = quotas[identity.role]
    if (roleLimits && !roleLimits.unlimited && roleLimits.monthlyLimit) {
      const usage = await getUsage(owner, identity.usageUserId)
      return firstQuotaViolation([{ usage, limits: roleLimits, scope: 'user' }])
    }
  }
  return null
}

/**
 * What a caller may know about their own consumption: their own quota windows,
 * and the shared budgets as a status — with numbers only for an admin of the owner.
 */
export async function getSelfUsage (owner: AccountKeys, quotas: Quotas, identity: UsageIdentity): Promise<SelfUsage> {
  const isAdmin = identity.role === 'admin'
  const [usage, violation, credits] = await Promise.all([
    // untracked callers (owner of a user account) consume the account aggregate
    getUsage(owner, identity.trackPerUser ? identity.usageUserId : undefined),
    accountViolation(owner, quotas, identity),
    isAdmin ? getCreditInfo(owner) : Promise.resolve(null)
  ])
  // a per-profile quota is only enforced for per-user tracked callers
  const quota = quotaWindows(usage, identity.trackPerUser ? quotas[identity.role] : undefined)
  const account: SelfUsage['account'] = violation ? { status: 'exhausted', resetsAt: violation.resetsAt } : { status: 'ok' }
  if (credits && credits.limit >= 0) Object.assign(account, { used: credits.consumption, limit: credits.limit })
  return { role: identity.role, quota, account }
}
