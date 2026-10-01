/**
 * A minimal websocket client for api tests.
 *
 * ws-server authorizes a subscription from the COOKIE on the upgrade request (it calls
 * session.req(req)), so a client has to carry the same cookie the axios clients use — hence
 * the cookieString argument rather than a user id.
 */
import WebSocket from 'ws'

export interface WsClient {
  next: (timeoutMs?: number) => Promise<any>
  subscribe: (channel: string) => Promise<any>
  close: () => void
}

export const openWsClient = async (cookieString?: string): Promise<WsClient> => {
  const ws = new WebSocket(`ws://localhost:${process.env.DEV_API_PORT}`, {
    headers: cookieString ? { cookie: cookieString } : {}
  })
  const inbox: any[] = []
  const waiters: ((msg: any) => void)[] = []
  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString())
    const waiter = waiters.shift()
    if (waiter) waiter(msg)
    else inbox.push(msg)
  })
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve())
    ws.once('error', reject)
  })

  /** The next message, waiting up to timeoutMs — so a MISSING event fails loudly. */
  const next = async (timeoutMs = 5000): Promise<any> => {
    const buffered = inbox.shift()
    if (buffered) return buffered
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('no websocket message within timeout')), timeoutMs)
      waiters.push(msg => { clearTimeout(timer); resolve(msg) })
    })
  }

  return {
    next,
    subscribe: async (channel: string) => {
      ws.send(JSON.stringify({ type: 'subscribe', channel }))
      return await next()
    },
    close: () => ws.close()
  }
}

export interface AgentSessionClient {
  send: (message: unknown) => void
  next: (timeoutMs?: number) => Promise<any>
  close: () => void
  closed: () => Promise<void>
}

/**
 * A client for the AGENT SESSION endpoint, which is a different socket from the one above.
 *
 * Through NGINX rather than straight to dev-api, unlike openWsClient: the upgrade reaches the HTTP
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
  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString())
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
    close: () => ws.close(),
    closed: async () => { await new Promise<void>(resolve => { ws.once('close', () => resolve()) }) }
  }
}
