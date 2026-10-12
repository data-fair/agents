/**
 * A conversation waiting on the person: the handover `wait_for_user_action` leaves behind.
 *
 * The wait does not block a turn. The turn that calls it ENDS, with the call left open and the
 * conversation's `pendingWait` naming it; whatever the person does next settles it:
 *
 *  - they ACT on the page: the call is settled with what the page reported, and a `wake` run continues
 *    from that result (`wakeIfAnswered`, below);
 *  - they WRITE: settled as interrupted, and their turn carries the reminder to wait again
 *    (interrupted-turn.ts);
 *  - they press STOP: settled as stopped, and nothing runs.
 *
 * Those three can race — a click and a message a moment apart — so settling starts by CLAIMING the
 * wait with an atomic $unset: exactly one of them wins, and the others find nothing to settle.
 */

import mongo from '#mongo'
import type { Conversation } from '#types'
import type { MessagePart } from '@agents/shared/message-parts'
import Debug from 'debug'
import { formatHostEvents, LOCATION_KEY } from '@agents/shared/host-events'
import { updateMessage, createRun, rejectPendingApprovals, PENDING_APPROVAL_ACTED, APPROVED_STEP_ACTED } from './service.ts'
import { startRun } from './executor.ts'
import { sessionFor, notifyMessage, notifyActivity } from '../agent-session/registry.ts'
import type { AgentSession } from '../agent-session/session.ts'

const debug = Debug('df-agents:autonomous-agent-executor')

export type PendingWait = NonNullable<Conversation['pendingWait']>

/**
 * Claim the conversation's pending wait and settle its call with `answer(wait)`. Returns the wait it
 * settled, or undefined when there was none (or another settler won).
 *
 * The watching page is sent the settled message and a cleared activity, so the chip stops reading
 * "waiting" and the label goes, whichever of the three settled it.
 */
export const settlePendingWait = async (conversationId: string, answer: (wait: PendingWait) => string): Promise<PendingWait | undefined> => {
  const claimed = await mongo.conversations.findOneAndUpdate(
    { id: conversationId, pendingWait: { $exists: true } },
    { $unset: { pendingWait: '' } },
    { projection: { _id: 0, pendingWait: 1 } }
  )
  const wait = claimed?.pendingWait
  if (!wait) return undefined

  const message = await mongo.messages.findOne(
    { conversationId, seq: wait.messageSeq },
    { projection: { _id: 0, parts: 1 } }
  )
  const output = answer(wait)
  const parts = ((message?.parts ?? []) as MessagePart[]).map(part =>
    part.type === 'dynamic-tool' && part.toolCallId === wait.toolCallId && part.state === 'input-available'
      ? { ...part, state: 'output-available', output } as MessagePart
      : part)
  await updateMessage(conversationId, wait.messageSeq, { parts: parts as any })

  notifyMessage(conversationId, { seq: wait.messageSeq, parts })
  notifyActivity(conversationId, null)
  return wait
}

/**
 * Continue a conversation whose pending wait the person has just answered on the page.
 *
 * Called when the socket receives host events, and when a turn that handed over ends (an answer may
 * have arrived while it was finishing). The answer is what the wait tool used to return inside the
 * turn — the first thing the person did, then the followers of the same gesture and the refreshes
 * that arrived meanwhile — so the settled call and the turn that continues from it read exactly as
 * before. A `wake` run carries no message of the person's: its history ends on that settled result.
 *
 * `session` is the socket the events arrived on, which must be the conversation's watcher: events from
 * a socket attached elsewhere are not this conversation's to answer with.
 */
export const wakeIfAnswered = async (conversationId: string, session: AgentSession | undefined = sessionFor(conversationId)): Promise<void> => {
  if (!session || sessionFor(conversationId) !== session || !session.hostEvents.hasWaitAnswer()) return
  // Checked before taking anything: events with no wait to answer stay pending, for the next turn.
  const waiting = await mongo.conversations.findOne({ id: conversationId, pendingWait: { $exists: true } }, { projection: { _id: 0, pendingWait: 1 } })
  if (!waiting?.pendingWait) return
  // The page re-announcing where it already was — a reload during the wait — is not the person leaving.
  const handedOverAt = waiting.pendingWait.location
  const notNews = (event: { key?: string, detail?: string }) => event.key === LOCATION_KEY && handedOverAt !== undefined && event.detail === handedOverAt
  if (!session.hostEvents.hasWaitAnswer(notNews)) return
  // One macrotask, as the wait tool did, so the followers of the same gesture (a keyed location event
  // posted right after a creation event) ride in the same answer.
  await new Promise(resolve => setTimeout(resolve, 0))
  const events = session.hostEvents.takeWaitAnswer(notNews)
  if (!events) return
  // A call the gate stopped in the SAME step as the wait (the handover won, so the turn ended `waiting`)
  // is rejected, as a new message rejects it: the person moved on without deciding, and the wake turn
  // continues without that call — its card, left pending in a message that is no longer the last, could
  // never run if approved later. Before the wait is settled, whose write replaces the message's parts
  // and would otherwise race a decision landing meanwhile.
  await rejectPendingApprovals(conversationId, PENDING_APPROVAL_ACTED, APPROVED_STEP_ACTED)
  const wait = await settlePendingWait(conversationId, () => formatHostEvents(events))
  if (!wait) {
    // Another settler won (the person wrote at the same moment): the events are still owed.
    session.hostEvents.restorePending(events)
    return
  }
  const conversation = await mongo.conversations.findOne({ id: conversationId }, { projection: { _id: 0, agentId: 1, owner: 1 } })
  if (!conversation) return
  const run = await createRun({
    agentId: conversation.agentId,
    conversationId,
    owner: conversation.owner,
    trigger: 'wake',
    ...(wait.triggeredBy ? { triggeredBy: wait.triggeredBy } : {}),
    ...(wait.triggeredByRole ? { triggeredByRole: wait.triggeredByRole } : {}),
    status: 'running',
    startedAt: new Date().toISOString()
  })
  debug('woke conversation %s on its pending wait, run %s', conversationId, run.id)
  // Not awaited, like a prompt's: the run is followed over the socket.
  startRun(run).catch(err => console.error('a wake run failed to start', err))
}
