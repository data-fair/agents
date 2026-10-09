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

export interface StoredNhi { clientId: string, siteUrl?: string, issuer?: string }

/**
 * The server-built `nhi` of a write. Captured ONCE, on a first enrolment or a new client id: the site
 * an agent is first configured on (the back-office, or its organization's main site) is its home for
 * planned tasks and the issuer simple-directory knows it by. A later save from another of the
 * organization's hosts used to re-point both, silently moving the agent's home with wherever an
 * admin happened to click Save. `capture` is lazy: it reads the request's forwarded headers, which a
 * save that keeps the identity does not need.
 */
export function buildNhi (clientId: string | undefined, existing: StoredNhi | undefined, capture: () => { siteUrl: string, issuer: string }): StoredNhi | undefined {
  if (!clientId) return undefined
  if (existing?.clientId === clientId && existing.siteUrl && existing.issuer) {
    return { clientId, siteUrl: existing.siteUrl, issuer: existing.issuer }
  }
  return { clientId, ...capture() }
}
