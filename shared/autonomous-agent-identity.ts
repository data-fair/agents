/**
 * The identity contract between this service and simple-directory.
 *
 * In `shared/` because BOTH sides must produce the same strings: the server signs assertions with
 * this subject, and the UI registers an NHI in simple-directory carrying it. simple-directory pins
 * the subject per identity, so a disagreement of one character produces its deliberately uniform
 * 401 with no indication of what went wrong.
 */

/** The `sub` bound on the NHI record. Namespaced so it cannot collide with another subject. */
export function autonomousAgentSubject (autonomousAgentId: string): string {
  return `autonomous-agent:${autonomousAgentId}`
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
  autonomousAgentId: string
  title: string
  issuer: string
  role?: string
}) {
  return {
    // Readable in simple-directory's own identity list; the subject below carries the agent id.
    name: `${opts.title} (autonomous agent)`,
    // simple-directory validates this against the organization's roles, and an org with no custom
    // roles has only config.roles.defaults = ['admin', 'user'] — so 'contrib' would be rejected.
    // 'user' is also the least privilege an agent can hold.
    role: opts.role ?? 'user',
    provider: { issuer: opts.issuer },
    subject: autonomousAgentSubject(opts.autonomousAgentId)
  }
}
