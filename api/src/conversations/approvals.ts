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
 * decisions racing on the same call, exactly one gets a message back, the other is told 409. Of two
 * racing on different calls of one step, exactly one sees none left pending and starts the run: each
 * reads the message as its own update left it.
 *
 * Returns the run continuing the turn, or — while calls of the same step are still undecided — how
 * many remain.
 */
export const decideAndContinue = async (input: {
  conversation: Conversation
  session: SessionStateAuthenticated
  approvalId: string
  approved: boolean
  reason?: string
}): Promise<{ runId: string } | { pending: number }> => {
  const { conversation, session } = input
  assertCanInstruct(await requireAutonomousAgent(conversation.owner, conversation.agentId), session)
  const by = { userId: session.user.id, userName: session.user.name }
  const message = await decideApproval(conversation.id, input.approvalId, {
    approved: input.approved,
    ...(input.reason ? { reason: input.reason } : {}),
    by
  })
  if (message === 'still-finishing') throw httpError(409, 'the turn is still finishing: decide once it has ended')
  if (!message) throw httpError(409, 'no pending approval with this id: it was already decided, or never asked')
  // The page shows the decision at once.
  const watcher = sessionFor(conversation.id)
  watcher?.send({ type: 'message', seq: message.seq, role: 'assistant', parts: message.parts as MessagePart[], pending: false })
  // ONE CONTINUATION PER STEP, once every call it stopped is decided. The SDK executes the approvals
  // it finds in the LAST message only: a run started after the first of two decisions would put its own
  // message after them, and the second call, approved later, would never run. So an earlier decision
  // only records, and the "awaiting approval" label stays for the calls still undecided.
  const pending = (message.parts as MessagePart[]).filter(p => p.type === 'dynamic-tool' && p.state === 'approval-requested').length
  if (pending) return { pending }
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
