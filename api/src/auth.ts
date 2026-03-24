import { type AccountKeys, httpError } from '@data-fair/lib-express'

interface SessionLike {
  account: { type: string, id: string }
  user: { id: string }
  accountRole?: string
}

export type EffectiveRole = 'admin' | 'contrib' | 'user' | 'external' | 'anonymous'

interface RoleQuota {
  unlimited?: boolean
  dailyTokenLimit?: number
  monthlyTokenLimit?: number
}

interface QuotasConfig {
  admin?: RoleQuota
  contrib?: RoleQuota
  user?: RoleQuota
  external?: RoleQuota
  anonymous?: RoleQuota
}

/**
 * Determine the effective role for quota lookup.
 * - Different account → 'external'
 * - Same account → session.accountRole (defaults to 'user')
 */
export function getEffectiveRole (session: SessionLike, owner: AccountKeys): EffectiveRole {
  const isSameAccount = session.account.type === owner.type && session.account.id === owner.id
  if (!isSameAccount) return 'external'
  return (session.accountRole as EffectiveRole) ?? 'user'
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
  if ((quota.dailyTokenLimit && quota.dailyTokenLimit > 0) || (quota.monthlyTokenLimit && quota.monthlyTokenLimit > 0)) return

  // Both limits are 0 or missing → no access
  throw httpError(403, 'You do not have permission to use this model')
}
