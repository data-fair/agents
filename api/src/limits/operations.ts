/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

/**
 * A request authenticates via the shared `?key=` param only when a secret is
 * actually configured on this deployment. Without this guard, an unset
 * `config.secretKeys.limits` (the default unless SECRET_LIMITS is set) would
 * make `req.query.key !== config.secretKeys.limits` evaluate to
 * `undefined !== undefined` → false whenever the caller omits the key too,
 * which fails OPEN and lets any anonymous caller push/read every account's
 * limits. This predicate fails CLOSED instead: no configured secret means no
 * request can ever match it, so callers always fall back to normal session
 * auth.
 */
export function limitsKeyMatches (queryKey: unknown, configuredKey: string | undefined): boolean {
  if (!configuredKey) return false
  return queryKey === configuredKey
}
