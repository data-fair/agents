import { type AccountKeys, type SessionState, getAccountRole, httpError } from '@data-fair/lib-express'

interface SessionLike {
  account: { type: string, id: string, department?: string }
  user: { id: string, adminMode?: unknown }
  accountRole?: string
}

export type EffectiveRole = 'admin' | 'contrib' | 'user' | 'external' | 'anonymous'

interface RoleQuota {
  unlimited?: boolean
  monthlyLimit?: number
}

interface QuotasConfig {
  admin?: RoleQuota
  contrib?: RoleQuota
  user?: RoleQuota
  external?: RoleQuota
  anonymous?: RoleQuota
}

/**
 * Determine the effective role for quota lookup, and for the decisions only an admin makes.
 *
 * The stack's rule, lib-common-types' getAccountRole: a superadmin in admin mode is an admin of any
 * account, a person the admin of their own, and otherwise the active account must MATCH the owner —
 * department included. A department's role grants nothing implicitly on the organization's root
 * account: an admin of one department used to count as the organization's admin here. Not a match →
 * 'external'; matched with no role → 'user'.
 */
export function getEffectiveRole (session: SessionLike, owner: AccountKeys): EffectiveRole {
  const role = getAccountRole(session as SessionState, owner)
  if (role === null) return 'external'
  return (role as EffectiveRole | undefined) ?? 'user'
}

/**
 * Check if the session user can use a model owned by the given account.
 *
 * Algorithm:
 * 1. Determine role via getEffectiveRole
 * 2. If role quota has unlimited → granted
 * 3. If role quota has any positive limit → granted (enforcement happens later)
 * 4. Otherwise → 403 (no access)
 */
export function assertCanUseModel (session: SessionLike, owner: AccountKeys, quotas: QuotasConfig): void {
  const role = getEffectiveRole(session, owner)
  assertRoleQuota(role, quotas)
}

/**
 * Check if a given role has access based on its quota configuration.
 */
export function assertRoleQuota (role: EffectiveRole, quotas: QuotasConfig): void {
  const quota = quotas[role]

  // No quota entry → no access
  if (!quota) {
    throw httpError(403, 'You do not have permission to use this model')
  }

  // Unlimited → always granted
  if (quota.unlimited) return

  // Any positive limit → granted (enforcement happens in router)
  if (quota.monthlyLimit && quota.monthlyLimit > 0) return

  // Limit is 0 or missing → no access
  throw httpError(403, 'You do not have permission to use this model')
}
