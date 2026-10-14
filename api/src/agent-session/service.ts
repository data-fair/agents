/**
 * The websocket layer for agent sessions: accept the upgrade, resolve who it is, hand each connection
 * a session (session.ts) and nothing more.
 *
 * Thin on purpose. Everything worth testing lives in session.ts, which takes a `send` function instead
 * of a socket.
 */

import type { Server, IncomingMessage } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import { session as expressSession, httpError, type AccountKeys } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import Debug from 'debug'
import { parseClientMessage, isAgentSessionPath, type ServerMessage, type ClientMessage } from '@agents/shared/agent-session-protocol'
import { createAgentSession, type AgentSession } from './session.ts'
import { attachSession, detachSession } from './registry.ts'
import {
  requireConversationById,
  assertOwnsConversation,
  conversationCost,
  createConversation,
  assertMayStartConversation,
  purgeConversation,
  type TurnCaller
} from '../conversations/service.ts'
import { startSessionTurn, sendHistory } from './turn.ts'
import { verifyAnonymousActionToken } from '../anonymous-token/service.ts'
import { anonymousUsageUserId } from '../usage/enforce.ts'
import { PORTAL_ASSISTANT_ID } from './personal-agent.ts'
import { abortRunsOfConversation } from '../conversations/live-runs.ts'
import { decideAndContinue } from '../conversations/approvals.ts'
import { settlePendingWait, wakeIfAnswered } from '../conversations/waits.ts'
import { INTERRUPTED_RESULTS } from '../conversations/interrupted-turn.ts'
import { getSettings } from '../settings/service.ts'
import { siteOriginFromHeaders } from '../sites/operations.ts'

const debug = Debug('agents:agent-session')

/**
 * The `error` frame for a refusal or a failure: the 4xx status an `httpError` carries (400 malformed,
 * 403 not allowed, 404 unknown, 409 conflict…), 503 while the service is restarting, 500 for anything else.
 */
const errorFrame = (err: any, fallback: string): ServerMessage =>
  ({ type: 'error', status: (err?.status >= 400 && err?.status < 500) || err?.status === 503 ? err.status : 500, message: err?.message || fallback })

/** Live sessions, so shutdown can close every one of them. */
const sessions = new Map<WebSocket, AgentSession>()

/** The live sessions of this process, read-only. */
export const liveAgentSessions = (): AgentSession[] => [...sessions.values()]

export const startAgentSessions = (server: Server) => {
  const wss = new WebSocketServer({ noServer: true })

  wss.on('connection', (ws: WebSocket, req: IncomingMessage, sessionState: any, reviewOffered?: boolean) => {
    const send = (message: ServerMessage) => {
      // readyState is checked because a turn can finish producing after the person closed the tab, and
      // writing to a closed socket throws rather than no-ops.
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message))
    }
    // The conversation this connection is bound to: set only once the ownership check has passed, so
    // a socket that merely NAMES someone else's conversation is bound to nothing. Remembered so the close
    // handler can detach it; a session may re-attach (a navigation within the same tab).
    let boundConversationId: string | undefined
    // What the first prompt of a connection bound to nothing creates, as its hello named it.
    let newThread: { owner: AccountKeys, agentId: string } | undefined
    // Why the last hello could name no thread at all (an anonymous token refused): what its prompts
    // are answered with, rather than a confusing "not bound".
    let helloRefusal: unknown
    // The one thread an ANONYMOUS socket holds: created by its first prompt, purged when it closes.
    let anonymousThread: { id: string, owner: AccountKeys, usageUserId: string } | undefined
    const agentSession: AgentSession = createAgentSession({
      send,
      // The cookie is taken from the UPGRADE request, which is the only moment it is available: a
      // websocket frame carries no headers.
      sessionCookie: req.headers.cookie,
      // Read from the same upgrade request, for the same reason: where the person is, and so where the
      // turn acts and the only site their cookie may be sent to.
      siteUrl: siteOriginFromHeaders(req.headers),
      reviewOffered: reviewOffered === true,
      anonymous: !sessionState?.user,
      onAttach: async conversationId => {
        if (boundConversationId) detachSession(boundConversationId, agentSession)
        boundConversationId = undefined
        if (!conversationId) return
        try {
          // Registered as the conversation's watcher only ONCE THE OWNERSHIP CHECK HAS PASSED, or a socket
          // naming someone else's conversation would receive the stream of their next turn. Authorization
          // is the ownership check the HTTP routes apply; an anonymous socket only ever binds to the
          // thread it created (see hello).
          const conversation = sessionState?.user ? await resolveOwnConversation(conversationId) : undefined
          boundConversationId = conversationId
          attachSession(conversationId, agentSession)
          // The transcript so far, so a reload or a second tab shows the conversation rather than
          // an empty pane.
          if (conversation) await sendHistoryFor(conversation)
        } catch (err: any) {
          // Reported rather than leaving the client to guess why nothing arrived, and kept as what this
          // socket's prompts are answered with: it is bound to nothing, and not because nothing was named.
          debug('could not attach: %O', err)
          helloRefusal = err
          send(errorFrame(err, 'this conversation could not be opened'))
        }
      },
      // The chat's Stop, for the conversation this socket is bound to — which it is only once its
      // ownership was checked.
      onAbort: async (dismissWait) => {
        const conversationId = boundConversationId
        if (!conversationId) return
        try {
          await abortRunsOfConversation(conversationId, 'stop')
          // Declining a handover: settled as stopped, and nothing runs — there is nothing to answer.
          if (dismissWait) await settlePendingWait(conversationId, () => INTERRUPTED_RESULTS.stop)
        } catch (err: any) {
          send(errorFrame(err, 'the turn could not be stopped'))
        }
      },
      // A decision on a call the approval gate stopped, for the conversation this socket is bound to —
      // never one named in the frame, so a socket cannot decide on someone else's thread. An anonymous
      // visitor has none to decide: the personal assistant offers them no tool that asks.
      onApproval: async (approvalId, approved, reason) => {
        const conversationId = boundConversationId
        if (!conversationId || !sessionState?.user) {
          send({ type: 'error', status: 403, message: 'only a signed-in person decides on an approval' })
          return
        }
        try {
          await decideAndContinue({
            // Read again rather than kept from the attach: the decision acts on the thread as it is now.
            conversation: await resolveOwnConversation(conversationId),
            session: sessionState,
            approvalId,
            approved,
            ...(reason ? { reason } : {})
          })
        } catch (err: any) {
          debug('approval refused: %O', err)
          send(errorFrame(err, 'the decision could not be recorded'))
        }
      },
      // The person acted on the page: if the bound conversation is waiting on them, this answers it.
      onHostEvents: async () => {
        const conversationId = boundConversationId
        if (!conversationId) return
        await wakeIfAnswered(conversationId, agentSession)
          .catch(err => { console.error('could not wake a conversation on its pending wait', err) })
      },
      onPrompt: async (content, hiddenContext) => {
        // Always bound by now: a prompt on a socket bound to nothing creates its thread first, or is
        // refused there (handleFrame).
        const conversationId = boundConversationId
        if (!conversationId) return
        // The thread is read again, as it is now. Its ownership was checked when the socket bound to it
        // (an anonymous socket binds only to the thread it created), and the turn runs under the
        // CONVERSATION'S owner, not the caller's account: an embedded chat belongs to the account whose
        // data it is about, so an external visitor's session account differs from it.
        try {
          await startSessionTurn({
            conversation: await requireConversationById(conversationId),
            caller: callerOf(),
            content,
            hiddenContext,
            echoTo: agentSession
          })
        } catch (err: any) {
          // Reported on the socket rather than swallowed: the person pressed send, so a refusal has to
          // reach them. The reasons a prompt is refused — not your conversation, empty
          // content — arrive here as a message.
          debug('prompt refused: %O', err)
          send(errorFrame(err, 'the turn could not be started'))
        }
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
    const resolveOwnConversation = async (conversationId: string) => {
      const conversation = await requireConversationById(conversationId)
      assertOwnsConversation(conversation, sessionState)
      return conversation
    }

    const sendHistoryFor = async (conversation: Awaited<ReturnType<typeof requireConversationById>>) => {
      await sendHistory(agentSession, conversation.id)
      // The total so far, for the chat's Consumption tab; refreshed before every turn-end. Off the
      // document the ownership check just read, rather than a read of its own.
      agentSession.send({ type: 'cost', conversationCost: await conversationCost(conversation.id, conversation) })
      // A thread waiting on the person says so on reopening, as it did when the handover was made.
      if (conversation.pendingWait) agentSession.send({ type: 'activity', activity: { kind: 'waiting', expecting: conversation.pendingWait.expecting ?? '' } })
    }

    /** Who this socket speaks for, as the conversation service names a caller. */
    const callerOf = (): TurnCaller => sessionState?.user
      ? { kind: 'person', session: sessionState }
      // Charged per IP, under the same key the HTTP routes use: the self-usage route reads it back.
      : { kind: 'anonymous', usageUserId: anonymousUsageUserId(req) }

    /**
     * A hello: bind (or unbind) the connection, and check a fresh thread's agent right away.
     *
     * A hello without `conversationId` binds to nothing and names what the first prompt will create,
     * for a signed-in person and an anonymous visitor alike. Whether they may talk to that agent is
     * checked NOW, so a refusal (a revoked grant, an account closed to visitors) reaches the chat when it
     * opens — as an `error` frame after the `attached` one — and nothing is created. The first prompt
     * checks again, since a grant can change in between.
     *
     * An anonymous visitor can never bind to a thread they did not get from this very socket: a hello
     * naming any other is a fresh one. Any fresh hello purges the thread the socket held — a reset, in
     * the chat's terms — so a socket holds at most one.
     */
    const hello = async (message: Extract<ClientMessage, { type: 'hello' }>) => {
      newThread = undefined
      helloRefusal = undefined
      if (!sessionState?.user && message.conversationId && message.conversationId !== anonymousThread?.id) {
        message = { ...message }
        delete message.conversationId
      }
      if (!message.conversationId) await dropAnonymousThread()
      await agentSession.handle(message)
      if (message.conversationId || !message.account) return
      const target = { owner: message.account, agentId: message.agentId || PORTAL_ASSISTANT_ID }
      try {
        if (!sessionState?.user) await verifyAnonymousActionToken(message.anonymousToken).catch(err => { helloRefusal = err; throw err })
        newThread = target
        await assertMayStartConversation(target.owner, target.agentId, callerOf())
      } catch (err: any) {
        debug('refused a hello: %O', err)
        send(errorFrame(err, 'this conversation could not be opened'))
      }
    }

    /**
     * The first prompt of a connection bound to nothing: create the thread its hello named, titled as
     * the prompt says (the chat stamps it when the message is sent), and bind.
     */
    const startNewThread = async (title: string | undefined) => {
      if (!newThread) throw helloRefusal ?? httpError(400, 'this connection is not bound to a conversation')
      // A tab closed right behind its first message: nobody is left to answer, so no thread is started.
      if (ws.readyState !== ws.OPEN) throw new Error('the connection closed')
      const caller = callerOf()
      const conversation = await createConversation(newThread.owner, newThread.agentId, caller, title, siteOriginFromHeaders(req.headers))
      newThread = undefined
      if (caller.kind === 'anonymous') anonymousThread = { id: conversation.id, owner: conversation.owner, usageUserId: caller.usageUserId }
      else eventsLog.info('agents.conversation.create', `conversation created for agent ${conversation.agentId}`, { account: caller.session.account, user: caller.session.user })
      await agentSession.bind(conversation.id)
    }

    /** Purge the anonymous thread this socket holds, live turn first. */
    const dropAnonymousThread = async () => {
      const thread = anonymousThread
      if (!thread) return
      anonymousThread = undefined
      // 'stop', not the default 'spoke': a closed tab is nobody speaking, and a purge must also stop
      // the thread's queued runs that are not a person's turn.
      await abortRunsOfConversation(thread.id, 'stop')
      await purgeConversation(thread.id)
    }

    const handleFrame = async (raw: string) => {
      const parsed = parseClientMessage(raw)
      if (parsed.type === 'invalid') {
        // Told, not dropped: a browser-facing surface that silently ignores a malformed frame is
        // undebuggable from the other side.
        send({ type: 'error', status: 400, message: parsed.reason })
        return
      }
      if (parsed.type === 'hello') {
        await hello(parsed)
        return
      }
      if (parsed.type === 'prompt' && !boundConversationId && agentSession.attached()) {
        try {
          await startNewThread(parsed.title)
        } catch (err: any) {
          // The person pressed send: a refusal to start the thread has to reach them.
          debug('could not start a thread: %O', err)
          send(errorFrame(err, 'this conversation could not be started'))
          return
        }
      }
      await agentSession.handle(parsed)
    }

    // IN ORDER, one at a time, each once the previous one's work is done: a hello checks the agent and
    // attaches, the first prompt creates the thread, and a prompt stores its message and starts its run
    // (never awaiting the turn itself). The client sends its first prompt straight after the hello
    // without waiting for `attached`; handled concurrently, two prompts would start two threads, a
    // prompt could start before its socket is the conversation's watcher, and a Stop right after a send
    // would run before the run that send creates.
    let frames: Promise<void> = Promise.resolve()
    ws.on('message', (raw) => {
      frames = frames.then(() => handleFrame(raw.toString())).catch(err => { debug('frame failed %O', err) })
    })

    // Closed in turn, after the frames received before it: a prompt sent right before the tab closed is
    // still stored and answered — its turn simply runs without the page. Frames are short (none awaits a
    // turn), so a running turn's page tool calls are failed moments later rather than at once.
    const closeSession = (reason: string) => {
      frames = frames.then(async () => {
        agentSession.close(reason)
        if (boundConversationId) detachSession(boundConversationId, agentSession)
        // The anonymous thread lives exactly as long as this socket.
        await dropAnonymousThread()
      }).catch(err => { debug('could not close a session %O', err) })
    }

    ws.on('close', () => {
      sessions.delete(ws)
      debug('session closed, %d live', sessions.size)
      closeSession('the connection closed')
    })

    // An error is not a close: `ws` emits both for a broken connection, but only sometimes in that
    // order, so the session is closed here too, and closing is idempotent.
    ws.on('error', (err) => {
      debug('session error %O', err)
      closeSession('the connection errored')
    })
  })

  server.on('upgrade', (req, socket, head) => {
    // The only socket this service serves. Anything else is refused at the HTTP layer rather than left
    // hanging: an upgrade nobody answers holds the connection open until the client gives up.
    if (!isAgentSessionPath(req.url)) {
      socket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n')
      return
    }
    // The session is resolved BEFORE the handshake completes, so an unauthenticated connection is
    // refused at the HTTP layer rather than accepted and then disappointed. Anonymous is allowed —
    // the chat is open to anonymous users — but it must be a deliberate decision rather than the
    // consequence of not looking.
    expressSession.req(req as any)
      .then(async (sessionState) => {
        // Whether this account offers personal-assistant review at all, resolved HERE because the upgrade is the one
        // async moment before the first frame — `handle` is synchronous, and `attached` has to carry
        // it so the chat knows whether to ask the person for consent.
        const account = sessionState?.account
        const reviewOffered = account
          ? (await getSettings({ type: account.type, id: account.id }).catch(() => undefined))?.reviewPersonalAssistant === true
          : false
        // The resolved session travels with the connection: a websocket frame carries no cookie, so who
        // this is can only be established once, here.
        wss.handleUpgrade(req, socket as any, head, (ws) => { wss.emit('connection', ws, req, sessionState, reviewOffered) })
      })
      .catch((err) => {
        debug('rejected an upgrade: %O', err)
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
      })
  })

  return {
    /**
     * Shutdown's first move: close every session except those watching a live turn (`keep`). Their
     * page reopens a socket the next time it sends anything, which lands on a healthy instance; the
     * kept ones see their turn end here, then are closed by `close`.
     */
    closeAllBut: (keep: Set<AgentSession>) => {
      for (const [ws, agentSession] of sessions) {
        if (keep.has(agentSession) || ws.readyState !== ws.OPEN) continue
        agentSession.close('the server is shutting down')
        ws.close()
      }
    },
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
