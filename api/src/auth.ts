import { type AccountKeys, httpError } from '@data-fair/lib-express'

interface SessionLike {
  account: { type: string, id: string }
  user: { id: string }
  accountRole?: string
}

interface ModelRolesConfig {
  roles?: string[]
}

/**
 * Check if the session user can use a model owned by the given account.
 *
 * Algorithm (ordered):
 * 1. Admin of the owner account → granted
 * 2. Same account + non-empty roles → granted (any member)
 * 3. Different account + "external" in roles → granted
 * 4. Otherwise → 403
 */
export function assertCanUseModel (session: SessionLike, owner: AccountKeys, modelConfig: ModelRolesConfig): void {
  const isSameAccount = session.account.type === owner.type && session.account.id === owner.id
  const roles = modelConfig.roles ?? []

  // 1. Admin of owner account always has access
  if (isSameAccount && session.accountRole === 'admin') return

  // 2. Same account member with non-empty roles
  if (isSameAccount && roles.length > 0) return

  // 3. External user with "external" in roles
  if (!isSameAccount && roles.includes('external')) return

  // 4. Denied
  throw httpError(403, 'You do not have permission to use this model')
}
