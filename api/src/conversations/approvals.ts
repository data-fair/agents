/**
 * Deciding on a pending approval: the person approves or rejects a call the approval gate stopped, and the
 * turn continues from the decision. The approval gate's equivalent of ./waits.ts.
 */
import { httpError } from '@data-fair/lib-express'
import type { SessionStateAuthenticated } from '@data-fair/lib-common-types/session/index.js'
import type { Conversation } from '#types'
import type { MessagePart } from '@agents/shared/message-parts'
import { createRun, decideApproval, requireAutonomousAgent, assertCanInstruct } from './service.ts'
import { startRun } from './executor.ts'
import { sessionFor } from '../agent-session/registry.ts'
import { getEffectiveRole } from '../auth.ts'

/**
 * Both the HTTP route and the socket come through here, so the grant is checked in ONE place: approvals
 * exist only on configured autonomous agents, and approving borrows the autonomous agent's permissions
 * exactly as instructing it does — someone whose grant was revoked since the request may not approve it.
 * That the conversation is the caller's own is the caller's check (it already holds the conversation).
 *
 * The decision is recorded BEFORE the run is created, and atomically (see decideApproval): of two
 * decisions racing, exactly one gets a message back and starts a run, the other is told 409.
 */
export const decideAndContinue = async (input: {
  conversation: Conversation
  session: SessionStateAuthenticated
  approvalId: string
  approved: boolean
  reason?: string
}): Promise<{ runId: string }> => {
  const { conversation, session } = input
  assertCanInstruct(await requireAutonomousAgent(conversation.owner, conversation.agentId), session)
  const by = { userId: session.user.id, userName: session.user.name }
  const message = await decideApproval(conversation.id, input.approvalId, {
    approved: input.approved,
    ...(input.reason ? { reason: input.reason } : {}),
    by
  })
  if (!message) throw httpError(409, 'no pending approval with this id: it was already decided, or never asked')
  // The page shows the decision at once, and the "awaiting approval" label goes; the run that follows
  // streams the rest.
  const watcher = sessionFor(conversation.id)
  watcher?.send({ type: 'message', seq: message.seq, role: 'assistant', parts: message.parts as MessagePart[], pending: false })
  watcher?.send({ type: 'activity', activity: null })
  const run = await createRun({
    agentId: conversation.agentId,
    conversationId: conversation.id,
    owner: conversation.owner,
    trigger: 'approval',
    triggeredBy: by,
    triggeredByRole: getEffectiveRole(session, conversation.owner),
    status: 'running',
    startedAt: new Date().toISOString()
  })
  // Not awaited, like a prompt's: the run is followed over the socket, or by polling it.
  startRun(run).catch(err => console.error('an approval run failed to start', err))
  return { runId: run.id }
}
