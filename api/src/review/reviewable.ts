/**
 * Pure: which conversations of an account an admin may review.
 *
 * Two populations (docs/architecture/conversation-review.md):
 *  - threads with a configured autonomous agent: ALWAYS, for as long as they exist — they are never
 *    private (shared/agent-audit.ts);
 *  - threads with a standard agent: only when the organization enabled review (`storeTraces`), the
 *    person consented, and the exchange is inside the retention window.
 */
import type { AccountKeys } from '@data-fair/lib-express'
import { STANDARD_AGENT_IDS } from '@agents/shared/agent-audit'

export const reviewableFilter = (owner: AccountKeys, opts: { storeTraces: boolean, cutoff: string }) => ({
  'owner.type': owner.type,
  'owner.id': owner.id,
  $or: [
    { agentId: { $nin: [...STANDARD_AGENT_IDS] } },
    ...(opts.storeTraces
      ? [{ agentId: { $in: [...STANDARD_AGENT_IDS] }, consentedToReview: true, lastMessageAt: { $gte: opts.cutoff } }]
      : [])
  ]
})
