/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

/**
 * The minimal session shape canInstruct reads. Structural rather than lib-express's
 * SessionState so the rule stays a pure function with a unit test that constructs its
 * own input.
 */
export interface InstructSession {
  // adminMode is widened past `boolean` on purpose: lib-express's SessionStateAuthenticated
  // types it as `1 | undefined`, and canInstruct only ever reads it for truthiness. Keeping
  // it `boolean` here forced every real call site to cast.
  user: { id: string, adminMode?: boolean | number }
  account: { type: string, id: string }
  accountRole?: string
}

interface InstructableAgent {
  owner: { type: string, id: string }
  instructors?: { userId: string, userName?: string }[]
}

/**
 * Who may send an autonomous agent a message. Single source of truth: the message
 * route, the websocket canSubscribe callback (Plan C) and the abort route all call
 * this, so the three cannot drift apart.
 *
 * Admins of the owning account are implicitly allowed — they configure the autonomous
 * agent anyway. Listed instructors are allowed from any account, because the list is
 * a deliberate grant to borrow this autonomous agent's permissions.
 */
export function canInstruct (agent: InstructableAgent, session: InstructSession): boolean {
  if (session.user.adminMode) return true
  const ownsAccount = session.account.type === agent.owner.type && session.account.id === agent.owner.id
  if (ownsAccount && session.accountRole === 'admin') return true
  return (agent.instructors ?? []).some(instructor => instructor.userId === session.user.id)
}
