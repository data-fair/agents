/**
 * Starting a turn from a socket prompt.
 *
 * Deliberately the SAME steps as the HTTP message route — append the user turn, create the run, start
 * it — because two ways to begin a turn is two places for the ownership check, the stored shape and the
 * run record to drift. What differs is only how the caller is identified and that there is no response
 * to return.
 */

import { httpError } from '@data-fair/lib-express'
import type { AccountKeys } from '@data-fair/lib-express'
import Debug from 'debug'
import {
  appendMessage,
  createRun,
  requireConversation,
  assertOwnsConversation
} from '../autonomous-agent-runtime/service.ts'
import { startRun } from '../autonomous-agent-runtime/executor.ts'
import type { InstructSession } from '../autonomous-agents/operations.ts'

const debug = Debug('agents:agent-session-turn')

export interface SessionTurnRequest {
  conversationId: string
  owner: AccountKeys
  session: InstructSession & { user: { id: string, name?: string } }
  content: string
}

/**
 * Append the prompt and run the turn. Returns the run id.
 *
 * Throws like the HTTP route does, so the caller can report the reason to the browser: a prompt for
 * someone else's conversation is a 403, not a silently dropped frame.
 */
export const startSessionTurn = async (request: SessionTurnRequest): Promise<string> => {
  const conversation = await requireConversation(request.owner, request.conversationId)
  assertOwnsConversation(conversation, request.session)

  const content = request.content.trim()
  if (!content) throw httpError(400, 'content is required')

  await appendMessage(conversation, {
    role: 'user',
    author: { kind: 'user', userId: request.session.user.id, userName: request.session.user.name },
    parts: [{ type: 'text', text: content }]
  })

  const run = await createRun({
    autonomousAgentId: conversation.autonomousAgentId,
    conversationId: conversation.id,
    owner: conversation.owner,
    trigger: 'user',
    triggeredBy: { userId: request.session.user.id, userName: request.session.user.name },
    status: 'running',
    startedAt: new Date().toISOString()
  })

  debug('starting run %s for conversation %s', run.id, conversation.id)
  // Not awaited, exactly as the HTTP route does not await it: the executor owns turning its own
  // failures into a terminal run and a message, and the browser follows the socket. The catch is the
  // backstop for a throw before the executor can do that.
  startRun(run).catch(err => console.error('agent session run failed to start', err))
  return run.id
}
