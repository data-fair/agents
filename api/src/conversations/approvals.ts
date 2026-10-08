/**
 * Deciding on a pending approval: the person approves or rejects a call the approval gate stopped, and the
 * turn continues from the decision. The approval gate's equivalent of ./waits.ts.
 */
import { httpError } from '@data-fair/lib-express'
import type { SessionStateAuthenticated } from '@data-fair/lib-common-types/session/index.js'
import type { Conversation } from '#types'
import type { MessagePart } from '@agents/shared/message-parts'
import mongo from '#mongo'
import { createRun, decideApproval, WAIT_SUPERSEDED_BY_DECISION, requireAutonomousAgent, assertCanInstruct } from './service.ts'
import { startRun } from './executor.ts'
import { settlePendingWait } from './waits.ts'
import { sessionFor } from '../agent-session/registry.ts'
import { getEffectiveRole } from '../auth.ts'
import { REQUEST_WEB_ACCESS_TOOL_NAME } from '../web/operations.ts'
import { PLANNING_TOOL_NAMES } from '../self-knowledge/operations.ts'

/**
 * The calls whose approval is an administrator's of the organization, not any instructor's, and why.
 * Allowing more of the web widens who can, in effect, instruct the agent (every author of the pages it may
 * then read). Planning writes the agent's standing tasks, which the task routes leave to administrators.
 * The service-tool registry offers these tools only in a turn an administrator started, for the same reason.
 */
const ADMIN_DECISIONS: Record<string, string> = {
  [REQUEST_WEB_ACCESS_TOOL_NAME]: 'only an administrator of the organization can allow more web addresses',
  ...Object.fromEntries(PLANNING_TOOL_NAMES.map(name => [name, 'only an administrator of the organization can change the agent\'s planned tasks']))
}

/**
 * The socket's `approval` frame is the only way in, and the grant is checked here: approvals
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
  // An administrator's call (ADMIN_DECISIONS) approved by anyone else is refused before anything is
  // recorded, so the call stays pending for an administrator. Rejecting it is anyone's.
  if (input.approved && getEffectiveRole(session, conversation.owner) !== 'admin') {
    const asking = await mongo.messages.findOne(
      { conversationId: conversation.id, parts: { $elemMatch: { 'approval.id': input.approvalId, toolName: { $in: Object.keys(ADMIN_DECISIONS) } } } },
      { projection: { _id: 0, 'parts.$': 1 } }
    )
    const toolName = (asking?.parts?.[0] as { toolName?: string } | undefined)?.toolName
    if (toolName) throw httpError(403, ADMIN_DECISIONS[toolName])
  }
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
  // A WAIT HANDED OVER IN THE SAME STEP is settled by the decision, as acting on the page settles the
  // approval (waits.ts wakeIfAnswered): the person moved, and the continuation must replay a step
  // whose every call has a result. Only the wait of THIS message — a wait elsewhere is not this step's.
  const waiting = await mongo.conversations.findOne({ id: conversation.id }, { projection: { _id: 0, pendingWait: 1 } })
  if (waiting?.pendingWait?.messageSeq === message.seq) {
    await settlePendingWait(conversation.id, () => WAIT_SUPERSEDED_BY_DECISION)
  }
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
