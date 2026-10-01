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
import { parseClientMessage, isAgentSessionPath, type ServerMessage } from '@agents/shared/agent-session-protocol'
import { createAgentSession, type AgentSession } from './session.ts'
import { attachSession, detachSession } from './registry.ts'
import { startSessionTurn } from './turn.ts'

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

  wss.on('connection', (ws: WebSocket, req: IncomingMessage, sessionState: any) => {
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
    const agentSession: AgentSession = createAgentSession({
      send,
      sessionCookie: req.headers.cookie,
      onAttach: conversationId => {
        if (boundConversationId && boundConversationId !== conversationId) detachSession(boundConversationId, agentSession)
        boundConversationId = conversationId
        attachSession(conversationId, agentSession)
      },
      onPrompt: content => {
        if (!boundConversationId) {
          send({ type: 'error', message: 'this connection is not bound to a conversation' })
          return
        }
        if (!sessionState?.user) {
          // Anonymous conversations are not persisted, so there is nothing to append a prompt to yet —
          // §3 of the design keeps them in memory, which the loop does not serve.
          send({ type: 'error', message: 'an anonymous session cannot run a turn yet' })
          return
        }
        startSessionTurn({
          conversationId: boundConversationId,
          owner: { type: sessionState.account.type, id: sessionState.account.id },
          session: sessionState,
          content
        }).catch((err: any) => {
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

    ws.on('message', (raw) => {
      const message = parseClientMessage(raw.toString())
      if (message.type === 'invalid') {
        // Told, not dropped: a browser-facing surface that silently ignores a malformed frame is
        // undebuggable from the other side.
        send({ type: 'error', message: message.reason })
        return
      }
      agentSession.handle(message)
    })

    ws.on('close', () => {
      agentSession.close('the connection closed')
      if (boundConversationId) detachSession(boundConversationId, agentSession)
      sessions.delete(ws)
      debug('session closed, %d live', sessions.size)
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
      .then((sessionState) => {
        // The resolved session travels with the connection: a websocket frame carries no cookie, so who
        // this is can only be established once, here.
        wss.handleUpgrade(req, socket as any, head, (ws) => { wss.emit('connection', ws, req, sessionState) })
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
