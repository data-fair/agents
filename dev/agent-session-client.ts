/**
 * A websocket client for the agent-session endpoint, for api tests and dev scripts.
 *
 * The session is resolved from the COOKIE on the upgrade request, so a client has to carry the same
 * cookie the axios clients use — hence the cookieString argument rather than a user id.
 */
import WebSocket from 'ws'

export interface AgentSessionClient {
  send: (message: unknown) => void
  next: (timeoutMs?: number) => Promise<any>
  /**
   * The thread the server last said this socket is bound to (`attached`), as RECEIVED — whether or not
   * `next` has read that frame yet. A thread is created by its first prompt, so this is how a test
   * learns its id.
   */
  conversationId: () => string | undefined
  close: () => void
  closed: () => Promise<void>
}

/**
 * A hello that starts a fresh thread: the account it is on (an `owner` path such as
 * `organization/test1`) and the agent. The first prompt after it creates the thread.
 */
export const newThreadHello = (owner = 'organization/test1', extra: Record<string, unknown> = {}) => {
  const [type, id] = owner.split('/')
  return { type: 'hello', tools: [], account: { type, id }, agentId: 'personal', ...extra }
}

/**
 * A client for the AGENT SESSION endpoint.
 *
 * Through NGINX rather than straight to dev-api: the upgrade reaches the HTTP
 * server before Express, so the path carries the deployment's public prefix, and connecting directly
 * would skip both the proxy's Upgrade headers and the prefix handling — the two things most likely to
 * be wrong in a real deployment.
 */
export const openAgentSession = async (cookieString?: string, host?: string): Promise<AgentSessionClient> => {
  // `host`: open the socket as if through another of the platform's domains. nginx forwards the Host
  // header as x-forwarded-host, which is all that tells the service which site a socket is on.
  const ws = new WebSocket(`ws://localhost:${process.env.NGINX_PORT}/agents/api/agent-session`, {
    headers: { ...(cookieString ? { cookie: cookieString } : {}), ...(host ? { host } : {}) }
  })
  const inbox: any[] = []
  const waiters: { resolve: (msg: any) => void, reject: (err: Error) => void }[] = []
  let conversationId: string | undefined
  let closedBy: string | undefined
  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString())
    if (msg.type === 'attached') conversationId = msg.conversationId
    const waiter = waiters.shift()
    if (waiter) waiter.resolve(msg)
    else inbox.push(msg)
  })
  // A closed socket sends nothing more: whoever waits is told so now, with the close code, rather
  // than after their whole timeout — which, longer than a test's own, surfaced as a bare test timeout.
  ws.on('close', (code, reason) => {
    closedBy = `the agent-session socket closed (${code}${reason.length ? ` ${reason.toString()}` : ''})`
    for (const waiter of waiters.splice(0)) waiter.reject(new Error(closedBy))
  })
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve())
    ws.once('error', reject)
  })
  const next = async (timeoutMs = 5000): Promise<any> => {
    const buffered = inbox.shift()
    if (buffered) return buffered
    if (closedBy) throw new Error(closedBy)
    return await new Promise((resolve, reject) => {
      const waiter = {
        resolve: (msg: any) => { clearTimeout(timer); resolve(msg) },
        reject: (err: Error) => { clearTimeout(timer); reject(err) }
      }
      // A waiter that timed out leaves the queue: left in it, it would swallow the next frame.
      const timer = setTimeout(() => {
        waiters.splice(waiters.indexOf(waiter), 1)
        reject(new Error('no agent-session message within timeout'))
      }, timeoutMs)
      waiters.push(waiter)
    })
  }
  return {
    send: message => ws.send(JSON.stringify(message)),
    next,
    conversationId: () => conversationId,
    close: () => ws.close(),
    closed: async () => { if (!closedBy) await new Promise<void>(resolve => { ws.once('close', () => resolve()) }) }
  }
}
