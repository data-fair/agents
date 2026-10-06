/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

import { matchAccessRef, type AccessRef } from '@data-fair/lib-common-types/access-ref/index.js'
import type { SessionStateAuthenticated } from '@data-fair/lib-common-types/session/index.js'

export interface InstructableAgent {
  owner: { type: string, id: string, department?: string }
  instructors?: AccessRef[]
}

/**
 * Who may send an autonomous agent a message. Single source of truth: the message
 * route, the websocket canSubscribe callback (Plan C) and the abort route all call
 * this, so the three cannot drift apart.
 *
 * Admins of the owning account are implicitly allowed — they configure the autonomous
 * agent anyway. Listed instructors are allowed from any account, because the list is
 * a deliberate grant to borrow this autonomous agent's permissions.
 *
 * The list holds uniform access refs (member, email, partner organization, role or
 * department), matched by lib-common-types' matchAccessRef — the same rule as every other
 * permission list in the stack. The owner-admin rule above stays separate on purpose:
 * matchAccessRef treats an absent department as "all departments", while this check is
 * exact, which is what keeps an admin OF A DEPARTMENT from instructing an org-root agent.
 */
export function canInstruct (agent: InstructableAgent, session: SessionStateAuthenticated): boolean {
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
  return (agent.instructors ?? []).some(accessRef => matchAccessRef(session, accessRef))
}
