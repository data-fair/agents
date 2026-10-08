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
import { PERSONAL_AGENT_ID } from './personal-agent.ts'
import { abortRunsOfConversation } from '../conversations/executor.ts'
import { decideAndContinue } from '../conversations/approvals.ts'
import { settlePendingWait, wakeIfAnswered } from '../conversations/waits.ts'
import { INTERRUPTED_RESULTS } from '../conversations/interrupted-turn.ts'
import { getSettings } from '../settings/service.ts'

const debug = Debug('agents:agent-session')

/**
 * The `error` frame for a refusal or a failure: the 4xx status an `httpError` carries (400 malformed,
 * 403 not allowed, 404 unknown, 409 conflict…), 500 for anything else.
 */
const errorFrame = (err: any, fallback: string): ServerMessage =>
  ({ type: 'error', status: err?.status >= 400 && err?.status < 500 ? err.status : 500, message: err?.message || fallback })

/** Live sessions, so shutdown can close every one of them. */
const sessions = new Map<WebSocket, AgentSession>()

/** The live sessions of this process, read-only. */
export const liveAgentSessions = (): AgentSession[] => [...sessions.values()]

export const startAgentSessions = (server: Server) => {
  const wss = new WebSocketServer({ noServer: true })

  wss.on('connection', (ws: WebSocket, req: IncomingMessage, sessionState: any, traceStorage?: boolean) => {
    const send = (message: ServerMessage) => {
      // readyState is checked because a turn can finish producing after the person closed the tab, and
      // writing to a closed socket throws rather than no-ops.
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message))
    }
    // The conversation this connection is bound to, remembered so the close handler can detach the
    // right one. A session may re-attach (a navigation within the same tab), so this is not final.
    let boundConversationId: string | undefined
    // The attach in progress: a prompt sent right behind the hello waits for it, or its turn could
    // start before this socket is registered as the watcher, without the page's tools.
    let attaching: Promise<void> = Promise.resolve()
    // The turn starts, Stops and approval decisions asked for so far, chained so they happen in the
    // order they were sent.
    let prompts: Promise<void> = Promise.resolve()
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
      traceStorage: traceStorage === true,
      anonymous: !sessionState?.user,
      onAttach: conversationId => {
        if (boundConversationId && boundConversationId !== conversationId) detachSession(boundConversationId, agentSession)
        boundConversationId = conversationId
        if (!conversationId) {
          attaching = Promise.resolve()
          return
        }
        // Registered as the conversation's watcher only ONCE THE OWNERSHIP CHECK HAS PASSED, or a socket
        // naming someone else's conversation would receive the stream of their next turn.
        // Authorization is the ownership check the HTTP routes apply; an anonymous socket only ever binds
        // to the thread it created.
        attaching = (sessionState?.user ? resolveOwnConversation(conversationId) : Promise.resolve(undefined))
          .then(async conversation => {
            if (boundConversationId !== conversationId) return // rebound in the meantime
            attachSession(conversationId, agentSession)
            // The transcript so far, so a reload or a second tab shows the conversation rather than
            // an empty pane.
            if (conversation) await sendHistoryFor(conversation)
          })
          .catch((err: any) => {
            // Reported rather than leaving the client to guess why nothing arrived.
            debug('could not attach: %O', err)
            send(errorFrame(err, 'this conversation could not be opened'))
          })
      },
      // The chat's Stop. It was never wired: the frame was parsed and dropped, so Stop only changed
      // the page while the turn ran on, spending, and completed in the store. Checked like a prompt,
      // because a socket can NAME any conversation in its hello even when attaching to it is refused.
      onAbort: (dismissWait) => {
        const conversationId = boundConversationId
        if (!conversationId) return
        // Behind the prompts sent before it: a Stop right after a send must reach the run that send
        // creates, not run before it exists.
        prompts = prompts.then(async () => {
          await attaching
          const ok = sessionState?.user
            ? await resolveOwnConversation(conversationId).then(() => true)
            : anonymousThread?.id === conversationId
          if (!ok) return
          await abortRunsOfConversation(conversationId, 'stop')
          // Declining a handover: settled as stopped, and nothing runs — there is nothing to answer.
          if (dismissWait) await settlePendingWait(conversationId, () => INTERRUPTED_RESULTS.stop)
        }).catch((err: any) => { send(errorFrame(err, 'the turn could not be stopped')) })
      },
      // A decision on a call the approval gate stopped, for the conversation this socket is bound to —
      // never one named in the frame, so a socket cannot decide on someone else's thread. An anonymous
      // visitor has none to decide: approvals exist only on configured autonomous agents.
      onApproval: (approvalId, approved, reason) => {
        const conversationId = boundConversationId
        if (!conversationId || !sessionState?.user) {
          send({ type: 'error', status: 403, message: 'only a signed-in person decides on an approval' })
          return
        }
        const session = sessionState
        // Behind the prompts sent before it, like a Stop: a decision followed by a message is recorded
        // before that message rejects whatever is still pending, in the order the person sent them.
        prompts = prompts.then(async () => {
          await attaching
          const conversation = await resolveOwnConversation(conversationId)
          await decideAndContinue({
            conversation,
            session,
            approvalId,
            approved,
            ...(reason ? { reason } : {})
          })
        }).catch((err: any) => {
          debug('approval refused: %O', err)
          send(errorFrame(err, 'the decision could not be recorded'))
        })
      },
      // The person acted on the page: if the bound conversation is waiting on them, this answers it.
      // Only once attached — `wakeIfAnswered` checks this socket is the conversation's watcher, which it
      // becomes after the ownership check.
      onHostEvents: () => {
        const conversationId = boundConversationId
        if (!conversationId) return
        attaching.then(() => wakeIfAnswered(conversationId, agentSession))
          .catch(err => { console.error('could not wake a conversation on its pending wait', err) })
      },
      onPrompt: (content, hiddenContext) => {
        if (!boundConversationId) {
          send({ type: 'error', status: 400, message: 'this connection is not bound to a conversation' })
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
          send({ type: 'error', status: 403, message: 'this conversation belongs to someone else' })
          return
        }
        // Captured, because the narrowing above does not survive into the callback below — and a
        // rebind mid-flight must not redirect this prompt to a different thread either.
        const conversationId = boundConversationId
        // The OWNER IS THE CONVERSATION'S, read from the thread rather than assumed to be the
        // caller's own account. An embedded chat belongs to the account whose data it is about, so an
        // external visitor's session account differs from it — and deriving the owner from the session
        // made every such turn fail with "unknown conversation" while members of the account were
        // unaffected. `startSessionTurn` still re-reads it under that owner and still checks the
        // thread belongs to this person.
        // A person's thread is read once here, for the ownership check, and handed on: the turn starting
        // below has no reason to read it again. An anonymous visitor's is checked inside the turn start.
        //
        // Started IN ORDER, one at a time: two prompts sent back to back would otherwise race to store
        // their message. Each turn start stops the conversation's running turns first (see
        // startSessionTurn), so the later message is the one answered.
        prompts = prompts.then(async () => {
          await attaching
          const { owner, conversation } = caller.kind === 'anonymous'
            ? { owner: anonymousThread!.owner, conversation: undefined }
            : await resolveOwnConversation(conversationId).then(conversation => ({ owner: { type: conversation.owner.type, id: conversation.owner.id }, conversation }))
          await startSessionTurn({
            conversationId,
            owner,
            ...(conversation ? { conversation } : {}),
            caller,
            content,
            hiddenContext,
            echoTo: agentSession
          })
        }).catch((err: any) => {
          // Reported on the socket rather than swallowed: the person pressed send, so a refusal has to
          // reach them. The reasons a prompt is refused — not your conversation, empty
          // content — arrive here as a message.
          debug('prompt refused: %O', err)
          send(errorFrame(err, 'the turn could not be started'))
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
      agentSession.handle(message)
      if (message.conversationId || !message.account) return
      const target = { owner: message.account, agentId: message.agentId ?? PERSONAL_AGENT_ID }
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
      const conversation = await createConversation(newThread.owner, newThread.agentId, caller, title)
      newThread = undefined
      if (caller.kind === 'anonymous') anonymousThread = { id: conversation.id, owner: conversation.owner, usageUserId: caller.usageUserId }
      else eventsLog.info('agents.conversation.create', `conversation created for agent ${conversation.agentId}`, { account: caller.session.account, user: caller.session.user })
      agentSession.bind(conversation.id)
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
      agentSession.handle(parsed)
    }

    // IN ORDER, one at a time. A hello is asynchronous (it checks the agent), and so is the first prompt
    // (it creates the thread); the client sends its first prompt straight after the hello without
    // waiting for `attached`, and handled concurrently two prompts would start two threads.
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
