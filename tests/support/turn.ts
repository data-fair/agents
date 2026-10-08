/**
 * Drive a real model turn over the chat's socket, for tests that need one as a SIDE EFFECT rather than as the
 * thing under test — usage records, credit consumption, a stored trace, a conversation to review.
 *
 * It replaces pointing the AI SDK at `/api/gateway/.../v1` as an OpenAI endpoint, which is how these
 * tests used to make a billable call. The gateway is gone, and the loop runs on the server now, so
 * the way to cause a turn is to ask for one: create a conversation, prompt it, wait for the turn to end.
 *
 * Deliberately the same door the UI uses (see ./socket-turn.ts). A test helper that reached into mongo to fabricate a usage
 * record would keep passing after the thing that writes usage records broke.
 */

import type { AxiosInstance } from 'axios'
import { turnOverSocket } from './socket-turn.ts'
import { CONSENT_COOKIE, CONSENT_YES } from '@agents/shared/trace-consent'

const apiOrigin = `http://localhost:${process.env.NGINX_PORT}/agents`

/**
 * Give (or withhold) this caller's consent to admin-visible trace storage.
 *
 * Set in the COOKIE JAR rather than as a request header, because the jar is what also carries the
 * session cookie — an explicit `Cookie` header would replace it and the call would be anonymous.
 * This is the same cookie the browser writes from the consent sheet, and the one the websocket
 * upgrade reads.
 */
export async function setTraceConsent (ax: AxiosInstance & { cookieJar?: any }, consented: boolean): Promise<void> {
  await ax.cookieJar?.setCookie(`${CONSENT_COOKIE}=${consented ? CONSENT_YES : 'no'}; Path=/`, apiOrigin)
}

export interface RunTurnResult {
  conversationId: string
  runId: string
}

/**
 * Create a conversation with a standard agent and run one turn in it.
 *
 * `owner` is the account path segment pair, e.g. `user/test-standalone1` or `organization/test1`.
 * Returns once the turn has ended, so a caller can immediately assert on
 * whatever the turn was supposed to produce.
 */
export async function runTurn (
  ax: AxiosInstance,
  owner: string,
  content = 'hello',
  opts?: { agentId?: string, conversationId?: string, title?: string }
): Promise<RunTurnResult> {
  let conversationId = opts?.conversationId
  if (!conversationId) {
    const created = await ax.post(`/api/conversations/${owner}`, {
      agentId: opts?.agentId ?? 'personal',
      title: opts?.title ?? 'test turn'
    })
    conversationId = created.data.id as string
  }

  const { runId } = await turnOverSocket(ax, conversationId, content, { owner })
  return { conversationId, runId }
}
