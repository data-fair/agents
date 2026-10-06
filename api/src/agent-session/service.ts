/**
 * The websocket layer for agent sessions: accept the upgrade, resolve who it is, hand each connection
 * a session (session.ts) and nothing more.
 *
 * Thin on purpose. Everything worth testing lives in session.ts, which takes a `send` function instead
 * of a socket.
 */

import type { Server, IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import { WebSocketServer, type WebSocket } from 'ws'
import { session as expressSession } from '@data-fair/lib-express'
import Debug from 'debug'
import { parseClientMessage, isAgentSessionPath, type ServerMessage, type ClientMessage } from '@agents/shared/agent-session-protocol'
import { createAgentSession, type AgentSession } from './session.ts'
import { attachSession, detachSession } from './registry.ts'
import { requireConversationById, assertOwnsConversation, conversationCost, createAnonymousConversation, purgeConversation } from '../conversations/service.ts'
import { startSessionTurn, sendHistory, type TurnCaller } from './turn.ts'
import { verifyAnonymousActionToken } from '../anonymous-token/service.ts'
import { anonymousUsageUserId } from '../usage/enforce.ts'
import { PERSONAL_AGENT_ID } from './standard-agents.ts'
import { abortRunsOfConversation } from '../conversations/executor.ts'
import { hasTraceConsent } from '@agents/shared/trace-consent'
import { getSettings } from '../settings/service.ts'

const debug = Debug('agents:agent-session')

/** Live sessions, so a turn started elsewhere can reach the browser that owns it. */
const sessions = new Map<WebSocket, AgentSession>()

/** How many browsers are connected. The prototype's cheapest capacity signal. */
export const liveAgentSessionCount = () => sessions.size

/**
 * Call a contextual tool on the ONLY live session.
 *
 * A test seam, and deliberately a crude one: addressing a session properly means binding it to a
 * conversation, which is §4.4. Insisting on exactly one connection makes the ambiguity an error rather
 * than a coin flip — a test that opened two sockets and asserted on "the" session would pass or fail by
 * iteration order.
 */
export const callOnlyLiveAgentSession = async (name: string, input: unknown): Promise<unknown> => {
  if (sessions.size !== 1) throw new Error(`expected exactly one live agent session, found ${sessions.size}`)
  const [agentSession] = sessions.values()
  return await agentSession.callBrowserTool(name, input)
}

export interface StartAgentSessionsOptions {
  /**
   * Where to send an upgrade this endpoint does not own.
   *
   * Required rather than optional: `ws` constructed with `{ server }` and no `path` handles EVERY
   * upgrade on that HTTP server (verified in ws/lib/websocket-server.js — it attaches `listening`,
   * `error` and `upgrade`). Two such servers would each write a handshake and corrupt the stream. So
   * this service owns upgrade routing and the other ws server is given a stand-in emitter, which is
   * what this delegates to.
   */
  delegateUpgrade: (req: IncomingMessage, socket: Duplex, head: Buffer) => void
}

export const startAgentSessions = (server: Server, options: StartAgentSessionsOptions) => {
  const wss = new WebSocketServer({ noServer: true })

  wss.on('connection', (ws: WebSocket, req: IncomingMessage, sessionState: any, traceStorage?: boolean) => {
    const send = (message: ServerMessage) => {
      // readyState is checked because a turn can finish producing after the person closed the tab, and
      // writing to a closed socket throws rather than no-ops.
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message))
    }
    // The cookie is taken from the UPGRADE request, which is the only moment it is available: a
    // websocket frame carries no headers.
    // The conversation this connection is bound to, remembered so the close handler can detach the
    // right one. A session may re-attach (a navigation within the same tab), so this is not final.
    let boundConversationId: string | undefined
    // The attach in progress: a prompt sent right behind the hello waits for it, or its turn could
    // start before this socket is registered as the watcher, without the page's tools.
    let attaching: Promise<void> = Promise.resolve()
    // The one thread an ANONYMOUS socket holds: created by its hello, purged when it closes.
    let anonymousThread: { id: string, owner: { type: 'user' | 'organization', id: string }, usageUserId: string } | undefined
    const agentSession: AgentSession = createAgentSession({
      send,
      sessionCookie: req.headers.cookie,
      // Parsed from the upgrade request's cookies, which is the socket's equivalent of the
      // `x-trace-consent` header the gateway read per request. Same cookie, same meaning.
      traceConsent: hasTraceConsent(req.headers.cookie),
      traceStorage: traceStorage === true,
      anonymous: !sessionState?.user,
      onAttach: conversationId => {
        if (boundConversationId && boundConversationId !== conversationId) detachSession(boundConversationId, agentSession)
        boundConversationId = conversationId
        // Registered as the conversation's watcher only ONCE THE OWNERSHIP CHECK HAS PASSED. It used to
        // be registered first and checked after, which only gated the history: a socket naming someone
        // else's conversation became its watcher anyway, and received the stream of their next turn.
        // Authorization is the ownership check the HTTP routes apply; an anonymous socket's thread was
        // checked by its hello, which only ever binds it to the thread it created.
        attaching = (sessionState?.user ? resolveTurnOwner(conversationId) : Promise.resolve())
          .then(async () => {
            if (boundConversationId !== conversationId) return // rebound in the meantime
            attachSession(conversationId, agentSession)
            // The transcript so far, so a reload or a second tab shows the conversation rather than
            // an empty pane.
            if (sessionState?.user) await sendHistoryFor(conversationId)
          })
          .catch((err: any) => {
            // Reported rather than leaving the client to guess why nothing arrived.
            debug('could not attach: %O', err)
            send({ type: 'error', message: err.message ?? 'this conversation could not be opened' })
          })
      },
      // The chat's Stop. It was never wired: the frame was parsed and dropped, so Stop only changed
      // the page while the turn ran on, spending, and completed in the store. Checked like a prompt,
      // because a socket can NAME any conversation in its hello even when attaching to it is refused.
      onAbort: () => {
        const conversationId = boundConversationId
        if (!conversationId) return
        const allowed = attaching.then(() => sessionState?.user
          ? resolveTurnOwner(conversationId).then(() => true)
          : anonymousThread?.id === conversationId)
        allowed.then(ok => { if (ok) abortRunsOfConversation(conversationId, 'stop') })
          .catch((err: any) => { send({ type: 'error', message: err.message ?? 'the turn could not be stopped' }) })
      },
      onPrompt: (content, hiddenContext) => {
        if (!boundConversationId) {
          send({ type: 'error', message: 'this connection is not bound to a conversation' })
          return
        }
        // An anonymous visitor may prompt only into the thread this socket created for them: there is
        // no session to check ownership against, so the socket's own record IS the ownership check.
        const caller: TurnCaller | undefined = sessionState?.user
          ? { kind: 'person', session: sessionState }
          : anonymousThread && anonymousThread.id === boundConversationId
            ? { kind: 'anonymous', usageUserId: anonymousThread.usageUserId }
            : undefined
        if (!caller) {
          send({ type: 'error', message: 'this conversation belongs to someone else' })
          return
        }
        // Speaking takes the turn back. If a turn is live — most importantly one parked in
        // `wait_for_user_action` — the person typing IS the answer to it, and letting the wait run
        // out its clock while their message sits in the composer is the worst reading of "waiting
        // for the user". Harmless when nothing is live.
        abortRunsOfConversation(boundConversationId)
        // Captured, because the narrowing above does not survive into the callback below — and a
        // rebind mid-flight must not redirect this prompt to a different thread either.
        const conversationId = boundConversationId
        // The OWNER IS THE CONVERSATION'S, read from the thread rather than assumed to be the
        // caller's own account. An embedded chat belongs to the account whose data it is about, so an
        // external visitor's session account differs from it — and deriving the owner from the session
        // made every such turn fail with "unknown conversation" while members of the account were
        // unaffected. `startSessionTurn` still re-reads it under that owner and still checks the
        // thread belongs to this person.
        const owner = attaching.then(() => caller.kind === 'anonymous' ? anonymousThread!.owner : resolveTurnOwner(conversationId))
        owner.then(owner => startSessionTurn({
          conversationId,
          owner,
          caller,
          content,
          hiddenContext,
          echoTo: agentSession
        })).catch((err: any) => {
          // Reported on the socket rather than swallowed: the person pressed send, so a refusal has to
          // reach them. The same reasons the HTTP route rejects for — not your conversation, empty
          // content — arrive here as a message.
          debug('prompt refused: %O', err)
          send({ type: 'error', message: err.message ?? 'the turn could not be started' })
        })
      }
    })
    sessions.set(ws, agentSession)
    debug('session opened, %d live', sessions.size)

    /**
     * The account a thread belongs to, once the caller has been checked against it.
     *
     * Both socket paths — binding to a thread and prompting into one — go through here, so the
     * ownership rule is stated once: the thread is found by id, and the person must be the one it
     * belongs to (`assertOwnsConversation`, which is what the HTTP routes apply as well).
     */
    const resolveTurnOwner = async (conversationId: string) => {
      const conversation = await requireConversationById(conversationId)
      assertOwnsConversation(conversation, sessionState)
      return { type: conversation.owner.type, id: conversation.owner.id }
    }

    const sendHistoryFor = async (conversationId: string) => {
      await sendHistory(agentSession, conversationId)
      // The total so far, for the chat's Consumption tab; refreshed before every turn-end.
      agentSession.send({ type: 'cost', conversationCost: await conversationCost(conversationId) })
    }

    /**
     * An anonymous visitor's hello: verify their token, and give them a fresh thread.
     *
     * The thread is created HERE because an anonymous caller has no HTTP route to create one with
     * (see the `hello` frame). Any hello not naming the thread this socket already holds starts a new
     * one and purges the previous — a reset, in the chat's terms — so a socket holds at most one, and
     * a visitor can never bind to a thread they did not get from this very socket.
     */
    const anonymousHello = async (message: Extract<ClientMessage, { type: 'hello' }>): Promise<ClientMessage | undefined> => {
      if (anonymousThread && message.conversationId === anonymousThread.id) return message
      await verifyAnonymousActionToken(message.anonymousToken)
      if (!message.account) throw new Error('an anonymous hello must name the account it talks to')
      const owner = message.account
      const settings = await getSettings(owner)
      // Charged per IP, under the same key the HTTP routes use: the self-usage route reads it back.
      const usageUserId = anonymousUsageUserId(req)
      const conversation = await createAnonymousConversation(owner, message.agentId ?? PERSONAL_AGENT_ID, usageUserId, settings.quotas ?? {})
      await dropAnonymousThread()
      anonymousThread = { id: conversation.id, owner, usageUserId }
      return { ...message, conversationId: conversation.id }
    }

    /** Purge the anonymous thread this socket holds, live turn first. */
    const dropAnonymousThread = async () => {
      const thread = anonymousThread
      if (!thread) return
      anonymousThread = undefined
      abortRunsOfConversation(thread.id)
      await purgeConversation(thread.id)
    }

    const handleFrame = async (raw: string) => {
      const parsed = parseClientMessage(raw)
      if (parsed.type === 'invalid') {
        // Told, not dropped: a browser-facing surface that silently ignores a malformed frame is
        // undebuggable from the other side.
        send({ type: 'error', message: parsed.reason })
        return
      }
      let message: ClientMessage | undefined = parsed
      if (message.type === 'hello' && !sessionState?.user) {
        try {
          message = await anonymousHello(message)
        } catch (err: any) {
          debug('refused an anonymous hello: %O', err)
          send({ type: 'error', message: err.message ?? 'this conversation could not be opened' })
          return
        }
      }
      if (message) agentSession.handle(message)
    }

    // IN ORDER, one at a time. An anonymous hello is asynchronous (it creates the thread), and the
    // client sends its first prompt straight after the hello without waiting for `attached`; handled
    // concurrently, that prompt would arrive at a connection not bound to anything yet.
    let frames: Promise<void> = Promise.resolve()
    ws.on('message', (raw) => {
      frames = frames.then(() => handleFrame(raw.toString())).catch(err => { debug('frame failed %O', err) })
    })

    ws.on('close', () => {
      agentSession.close('the connection closed')
      if (boundConversationId) detachSession(boundConversationId, agentSession)
      sessions.delete(ws)
      debug('session closed, %d live', sessions.size)
      // The anonymous thread lives exactly as long as this socket. After any frame still in flight,
      // so a hello creating one cannot land after the purge and leave it behind.
      frames = frames.then(() => dropAnonymousThread()).catch(err => { debug('could not purge an anonymous thread %O', err) })
    })

    // An error is not a close: `ws` emits both for a broken connection, but only sometimes in that
    // order, so the pending calls are failed here too and `close` is idempotent.
    ws.on('error', (err) => {
      debug('session error %O', err)
      agentSession.close('the connection errored')
    })
  })

  server.on('upgrade', (req, socket, head) => {
    if (!isAgentSessionPath(req.url)) {
      options.delegateUpgrade(req, socket, head)
      return
    }
    // The session is resolved BEFORE the handshake completes, so an unauthenticated connection is
    // refused at the HTTP layer rather than accepted and then disappointed. Anonymous is allowed —
    // the chat is open to anonymous users — but it must be a deliberate decision rather than the
    // consequence of not looking.
    expressSession.req(req as any)
      .then(async (sessionState) => {
        // Whether this account stores traces at all, resolved HERE because the upgrade is the one
        // async moment before the first frame — `handle` is synchronous, and `attached` has to carry
        // it so the chat knows whether to ask the person for consent.
        const account = sessionState?.account
        const traceStorage = account
          ? (await getSettings({ type: account.type, id: account.id }).catch(() => undefined))?.storeTraces === true
          : false
        // The resolved session travels with the connection: a websocket frame carries no cookie, so who
        // this is can only be established once, here.
        wss.handleUpgrade(req, socket as any, head, (ws) => { wss.emit('connection', ws, req, sessionState, traceStorage) })
      })
      .catch((err) => {
        debug('rejected an upgrade: %O', err)
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
      })
  })

  return {
    close: async () => {
      for (const [ws, agentSession] of sessions) {
        agentSession.close('the server is shutting down')
        ws.close()
      }
      sessions.clear()
      await new Promise<void>(resolve => wss.close(() => resolve()))
    }
  }
}
