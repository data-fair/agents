/**
 * The scopes of an autonomous agent's identity, as the agents UI edits them: its NHI's maximum scopes in
 * simple-directory, which the token exchange grants whole. Pure, so the form and its tests share it.
 */

export interface ScopeRow { scope: string, description: string }

/** simple-directory's `GET /api/scopes`: a description per scope, plain or with the scopes it includes. */
export function scopeRows (doc: { scopes?: Record<string, string | { description?: string, includes?: string[] }> }): ScopeRow[] {
  return Object.entries(doc.scopes ?? {})
    .map(([scope, value]) => ({ scope, description: typeof value === 'string' ? value : value?.description ?? '' }))
    .sort((a, b) => a.scope.localeCompare(b.scope))
}

export function sameScopes (a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join(' ') === [...b].sort().join(' ')
}

/** What the NHI PATCH sends: simple-directory refuses an empty array (`minItems: 1`), `null` clears them. */
export function scopesPatchValue (scopes: string[]): string[] | null {
  return scopes.length ? scopes : null
}
