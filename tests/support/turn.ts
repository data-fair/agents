/**
 * Drive a real model turn over the chat's socket, for tests that need one as a SIDE EFFECT rather than as the
 * thing under test — usage records, credit consumption, a stored trace, a conversation to review.
 *
 * It replaces pointing the AI SDK at `/api/gateway/.../v1` as an OpenAI endpoint, which is how these
 * tests used to make a billable call. The gateway is gone, and the loop runs on the server now, so
 * the way to cause a turn is to ask for one: create a conversation, prompt it, wait for the turn to end.
 *
 * Deliberately the same door the UI uses (see dev/socket-turn.ts). A test helper that reached into mongo to fabricate a usage
 * record would keep passing after the thing that writes usage records broke.
 */

import type { AxiosInstance } from 'axios'
import { turnOverSocket } from '../../dev/socket-turn.ts'
import { CONSENT_COOKIE, CONSENT_YES } from '../../ui/src/traces/trace-consent.ts'

const apiOrigin = `http://localhost:${process.env.NGINX_PORT}/agents`

/**
 * Give (or withhold) this caller's consent to admin-visible trace storage.
 *
 * Set in the COOKIE JAR, as the browser keeps it: the same cookie the consent sheet writes. Like the
 * chat, the socket helper reads it back and says it in its hello — the server never reads the cookie.
 */
export async function setTraceConsent (ax: AxiosInstance & { cookieJar?: any }, consented: boolean): Promise<void> {
  await ax.cookieJar?.setCookie(`${CONSENT_COOKIE}=${consented ? CONSENT_YES : 'no'}; Path=/`, apiOrigin)
}

export interface RunTurnResult {
  conversationId: string
  runId: string
}

/**
 * Run one turn: the first of a new conversation with a standard agent, or one in `conversationId`.
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
  const target = opts?.conversationId ?? { agentId: opts?.agentId ?? 'personal', title: opts?.title ?? 'test turn' }
  const { runId, conversationId } = await turnOverSocket(ax, target, content, { owner })
  return { conversationId, runId }
}
