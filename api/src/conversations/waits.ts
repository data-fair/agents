/**
 * A conversation waiting on the person: the handover `wait_for_user_action` leaves behind.
 *
 * The wait does not block a turn. The turn that calls it ENDS, with the call left open and the
 * conversation's `pendingWait` naming it; whatever the person does next settles it:
 *
 *  - they ACT on the page: the call is settled with what the page reported, and a `wake` run continues
 *    from that result (executor.ts, `wakeIfAnswered`);
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
import { updateMessage } from './service.ts'
import { sessionFor } from '../agent-session/registry.ts'

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

  const watcher = sessionFor(conversationId)
  watcher?.send({ type: 'message', seq: wait.messageSeq, role: 'assistant', parts, pending: false })
  watcher?.send({ type: 'activity', activity: null })
  return wait
}
