/**
 * A websocket client for api tests.
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
export const openAgentSession = async (cookieString?: string): Promise<AgentSessionClient> => {
  const ws = new WebSocket(`ws://localhost:${process.env.NGINX_PORT}/agents/api/agent-session`, {
    headers: cookieString ? { cookie: cookieString } : {}
  })
  const inbox: any[] = []
  const waiters: ((msg: any) => void)[] = []
  let conversationId: string | undefined
  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString())
    if (msg.type === 'attached') conversationId = msg.conversationId
    const waiter = waiters.shift()
    if (waiter) waiter(msg)
    else inbox.push(msg)
  })
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve())
    ws.once('error', reject)
  })
  const next = async (timeoutMs = 5000): Promise<any> => {
    const buffered = inbox.shift()
    if (buffered) return buffered
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('no agent-session message within timeout')), timeoutMs)
      waiters.push(msg => { clearTimeout(timer); resolve(msg) })
    })
  }
  return {
    send: message => ws.send(JSON.stringify(message)),
    next,
    conversationId: () => conversationId,
    close: () => ws.close(),
    closed: async () => { await new Promise<void>(resolve => { ws.once('close', () => resolve()) }) }
  }
}
