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
  account: { type: string, id: string, department?: string }
  accountRole?: string
}

interface InstructableAgent {
  owner: { type: string, id: string, department?: string }
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
  // The department has to match too, exactly as lib-common-types' matchAccount does for
  // assertAccountRole. Autonomous agents are always stored with a department-less owner, so
  // comparing type+id alone would let an admin OF A DEPARTMENT instruct an org-root agent —
  // borrowing its NHI permissions and spending the org's credits — while that same user is
  // refused by every route that uses assertAccountRole and cannot even list the agents.
  const ownsAccount = session.account.type === agent.owner.type &&
    session.account.id === agent.owner.id &&
    (session.account.department ?? null) === (agent.owner.department ?? null)
  if (ownsAccount && session.accountRole === 'admin') return true
  return (agent.instructors ?? []).some(instructor => instructor.userId === session.user.id)
}
