/**
 * Drive a real model turn over HTTP, for tests that need one as a SIDE EFFECT rather than as the
 * thing under test — usage records, credit consumption, a stored trace, a conversation to review.
 *
 * It replaces pointing the AI SDK at `/api/gateway/.../v1` as an OpenAI endpoint, which is how these
 * tests used to make a billable call. The gateway is gone, and the loop runs on the server now, so
 * the way to cause a turn is to ask for one: create a conversation, post a message, wait for the run.
 *
 * Deliberately the same route the UI uses. A test helper that reached into mongo to fabricate a usage
 * record would keep passing after the thing that writes usage records broke.
 */

import type { AxiosInstance } from 'axios'
import { CONSENT_COOKIE, CONSENT_YES } from '@agents/shared/trace-consent'

const apiOrigin = `http://localhost:${process.env.NGINX_PORT}/agents`

/**
 * Give (or withhold) this caller's consent to admin-visible trace storage.
 *
 * Set in the COOKIE JAR rather than as a request header, because the jar is what also carries the
 * session cookie — an explicit `Cookie` header would replace it and the call would be anonymous.
 * This is the same cookie the browser writes from the consent sheet, and the same one both the
 * websocket upgrade and the HTTP message route read.
 */
export async function setTraceConsent (ax: AxiosInstance & { cookieJar?: any }, consented: boolean): Promise<void> {
  await ax.cookieJar?.setCookie(`${CONSENT_COOKIE}=${consented ? CONSENT_YES : 'no'}; Path=/`, apiOrigin)
}

export interface RunTurnResult {
  conversationId: string
  runId: string
}

/** How long to wait for a turn against the mock provider. Generous: the run is asynchronous. */
const RUN_TIMEOUT_MS = 20_000

/**
 * Create a conversation with a standard agent and run one turn in it.
 *
 * `owner` is the account path segment pair, e.g. `user/test-standalone1` or `organization/test1`.
 * Returns once the assistant's message is no longer pending, so a caller can immediately assert on
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
    const created = await ax.post(`/api/autonomous-agent-conversations/${owner}`, {
      autonomousAgentId: opts?.agentId ?? 'personal',
      title: opts?.title ?? 'test turn'
    })
    conversationId = created.data.id as string
  }

  const posted = await ax.post(`/api/autonomous-agent-conversations/${owner}/${conversationId}/messages`, { content })
  const runId = posted.data.runId as string

  await waitForTurn(ax, owner, conversationId)
  return { conversationId, runId }
}

/**
 * Wait until the conversation's last assistant message has stopped being pending.
 *
 * Polls the messages route rather than the run, because `pending: false` on the message is what a
 * reader of the conversation actually sees settle — a run marked done with a message still pending
 * would be a bug this helper should expose rather than hide.
 */
export async function waitForTurn (ax: AxiosInstance, owner: string, conversationId: string): Promise<void> {
  const deadline = Date.now() + RUN_TIMEOUT_MS
  let last: any
  while (Date.now() < deadline) {
    const res = await ax.get(`/api/autonomous-agent-conversations/${owner}/${conversationId}/messages`)
    const messages = res.data.results as any[]
    last = messages[messages.length - 1]
    if (last && last.role === 'assistant' && last.pending !== true) return
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  // Named in the failure, because "a test timed out" is useless here: what matters is whether the turn
  // never started, or started and never settled.
  throw new Error(`the turn in ${conversationId} did not settle within ${RUN_TIMEOUT_MS}ms (last message: ${JSON.stringify(last)})`)
}
