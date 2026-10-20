/**
 * The identity contract between this service and simple-directory.
 *
 * In `shared/` because BOTH sides must produce the same strings: the server signs assertions with
 * this subject, and the UI registers an NHI in simple-directory carrying it. simple-directory pins
 * the subject per identity, so a disagreement of one character produces its deliberately uniform
 * 401 with no indication of what went wrong.
 */

/** The `sub` bound on the NHI record. Namespaced so it cannot collide with another subject. */
export function autonomousAgentSubject (agentId: string): string {
  return `autonomous-agent:${agentId}`
}

/** Readable in simple-directory's own identity list; the subject carries the agent id. */
export function autonomousAgentNhiName (title: string): string {
  return `${title} (autonomous agent)`
}

/**
 * What to PATCH on the identity in simple-directory after the autonomous agent was saved: the changed
 * fields only, or null when its name and role are as they were. An undefined role is the default, `user`.
 */
export function identityPatch (
  saved: { title?: string, role?: string },
  next: { title?: string, role?: string }
): { name?: string, role?: string } | null {
  const patch: { name?: string, role?: string } = {}
  if (saved.title !== next.title && next.title !== undefined) patch.name = autonomousAgentNhiName(next.title)
  const nextRole = next.role ?? 'user'
  if ((saved.role ?? 'user') !== nextRole) patch.role = nextRole
  return Object.keys(patch).length ? patch : null
}

/**
 * The NHI to register in simple-directory for one autonomous agent.
 *
 * `issuer` is NOT reconstructed here: the caller reads it from this service's own discovery document
 * (`/api/nhi/.well-known/openid-configuration`), which is the same value the server will declare when
 * it signs. Rebuilding it from the browser's location would be a second source of truth that could
 * drift from the one that matters.
 */
export function autonomousAgentNhiBody (opts: {
  agentId: string
  title: string
  issuer: string
  role?: string
  /** Its maximum scopes; none chosen, none sent: unrestricted, what its role allows. */
  scopes?: string[]
}) {
  return {
    name: autonomousAgentNhiName(opts.title),
    // simple-directory validates this against the organization's roles, and an org with no custom
    // roles has only config.roles.defaults = ['admin', 'user'] — so 'contrib' would be rejected.
    // 'user' is also the least privilege an agent can hold.
    //
    // This applies to what is sent THROUGH THIS ROUTE only. dev/resources/organizations.json lists
    // both fixture NHIs as "contrib" and that is fine: FileStorage reads membership roles from the
    // file without validating them (the pre-existing dev1-user1 even carries the non-existent role
    // "user1"). A reader comparing the two should not conclude the fixtures are wrong.
    role: opts.role ?? 'user',
    provider: { issuer: opts.issuer },
    subject: autonomousAgentSubject(opts.agentId),
    ...(opts.scopes?.length ? { scopes: opts.scopes } : {})
  }
}
