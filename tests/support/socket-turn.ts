/**
 * Drive a conversation's turns the way the chat does: over the agent-session socket.
 *
 * There is no HTTP route that starts a turn or decides an approval, because two ways to do each thing
 * is two places for the ownership check and the run record to drift. Tests that need a turn as the
 * thing under test, or as a side effect, therefore go through the same door as the UI, using the
 * client in ./ws.ts.
 *
 * What these helpers add is only the part a test would otherwise repeat: bind the socket to the
 * conversation, send the frame, find the run it caused (the socket's frames do not carry a run id, the
 * run is read back from the conversation's runs), and turn an `error` frame back into the status the
 * refusal used to have, so `assert.rejects(..., { status })` keeps reading the same.
 */

import type { AxiosInstance } from 'axios'
import { directoryUrl } from './axios.ts'
import { openAgentSession, type AgentSessionClient } from './ws.ts'

type Ax = AxiosInstance & { cookieJar?: any }

export interface SocketTurnOptions {
  /** The account path the conversation lives under. Default `organization/test1`. */
  owner?: string
  /** Per-frame wait. Generous: a turn against the mock provider streams, and some tests stall one on purpose. */
  timeoutMs?: number
  hiddenContext?: string
}

/** The status a refusal had when it was an HTTP response, recovered from the socket's error text. */
const statusOfRefusal = (message: string): number => {
  if (/content is required|must be/.test(message)) return 400
  if (/no pending approval|still finishing/.test(message)) return 409
  if (/^unknown /.test(message)) return 404
  if (/belongs to someone else|not allowed|signed-in person/.test(message)) return 403
  return 500
}

/** `data` is the text, where a caller used to read the response body. */
const refusal = (message: string): Error & { status: number, data: string } =>
  Object.assign(new Error(message), { status: statusOfRefusal(message), data: message })

const base = (owner: string, conversationId: string) => `/api/conversations/${owner}/${conversationId}`

const runsOf = async (ax: Ax, owner: string, conversationId: string): Promise<any[]> =>
  (await ax.get(`${base(owner, conversationId)}/runs`)).data.results

/**
 * One run of a conversation, as its owner reads it: through the conversation's runs, the only route a
 * conversation run has (a task run is read through its agent's `GET …/runs/:runId`).
 */
export const runOf = async (ax: Ax, conversationId: string, runId: string, owner = 'organization/test1'): Promise<any> => {
  const run = (await runsOf(ax, owner, conversationId)).find(r => r.id === runId)
  if (!run) throw new Error(`no run ${runId} in conversation ${conversationId}`)
  return run
}

/** Open a socket as `ax`, bound to the conversation, past its `attached` frame. */
const attach = async (ax: Ax, conversationId: string, timeoutMs: number) => {
  const socket = await openAgentSession(await ax.cookieJar.getCookieString(directoryUrl))
  socket.send({ type: 'hello', tools: [], conversationId })
  const history: any[] = []
  // `attached` is sent synchronously by the hello; a refusal to bind (not your conversation) follows it.
  // Otherwise the stored transcript follows, closed by a `cost` frame: read past it, so that history is
  // never mistaken for what the next frame caused.
  for (let attached = false; ;) {
    const frame = await socket.next(timeoutMs)
    history.push(frame)
    if (frame.type === 'error') { socket.close(); throw refusal(frame.message) }
    if (frame.type === 'attached') attached = true
    else if (attached && frame.type === 'cost') break
  }
  return { socket, history }
}

export interface StartedSocketTurn {
  runId: string
  socket: AgentSessionClient
  /** Every frame since the prompt, once the turn has ended; rejects if the prompt was refused. */
  done: Promise<any[]>
  /** The chat's Stop. */
  abort: () => void
}

/**
 * Prompt a conversation and return as soon as the run exists, leaving the turn running — for tests that
 * act while it does (stop it, speak again, read it mid-flight). `done` settles at `turn-end`, and the
 * socket is closed then.
 */
export const startTurnOverSocket = async (
  ax: Ax,
  conversationId: string,
  content: string,
  opts: SocketTurnOptions = {}
): Promise<StartedSocketTurn> => {
  const owner = opts.owner ?? 'organization/test1'
  const timeoutMs = opts.timeoutMs ?? 60_000
  const known = new Set((await runsOf(ax, owner, conversationId).catch(() => [])).map(r => r.id))
  const { socket, history } = await attach(ax, conversationId, timeoutMs)
  socket.send({ type: 'prompt', content, ...(opts.hiddenContext ? { hiddenContext: opts.hiddenContext } : {}) })

  let failure: Error | undefined
  let ended = false
  const done = (async () => {
    const frames = [...history]
    try {
      for (;;) {
        const frame = await socket.next(timeoutMs)
        frames.push(frame)
        if (frame.type === 'error') throw refusal(frame.message)
        if (frame.type === 'turn-end') return frames
      }
    } catch (err: any) {
      failure = err
      throw err
    } finally {
      ended = true
      socket.close()
    }
  })()
  done.catch(() => {})

  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (failure) throw failure
    const created = (await runsOf(ax, owner, conversationId)).find(r => !known.has(r.id))
    if (created) return { runId: created.id, socket, done, abort: () => socket.send({ type: 'abort' }) }
    // A turn that ended before its run was seen cannot be located; surface the real reason.
    if (ended) { await done; throw new Error('the turn ended without a run being created') }
    if (Date.now() > deadline) throw new Error('no run was created by the prompt')
    await new Promise(resolve => setTimeout(resolve, 25))
  }
}

export interface SocketTurnResult {
  runId: string
  /** The run that answered, read once the turn has ended. */
  run: any
  messages: any[]
  /** The last assistant message. */
  assistant: any
  frames: any[]
}

/** Prompt a conversation and wait for the turn to end. Throws like the old route did on a refusal. */
export const turnOverSocket = async (
  ax: Ax,
  conversationId: string,
  content: string,
  opts: SocketTurnOptions = {}
): Promise<SocketTurnResult> => {
  const owner = opts.owner ?? 'organization/test1'
  const started = await startTurnOverSocket(ax, conversationId, content, opts)
  const frames = await started.done
  const run = await runOf(ax, conversationId, started.runId, owner)
  const messages: any[] = (await ax.get(`${base(owner, conversationId)}/messages`)).data.results
  const assistant = [...messages].reverse().find(m => m.role === 'assistant')
  return { runId: started.runId, run, messages, assistant, frames }
}

/**
 * Decide on a call the approval gate stopped, over the chat's `approval` frame.
 *
 * Answers what the route answered: `{ runId }` once the continuing run exists, `{ pending }` while calls
 * of the same step are still undecided, and a thrown error with the refusal's `status` (409 already
 * decided, 403 not yours). The run is NOT waited for — follow it with `runId`, as before.
 */
export const decideOverSocket = async (
  ax: Ax,
  conversationId: string,
  approvalId: string,
  decision: { approved: boolean, reason?: string },
  opts: SocketTurnOptions = {}
): Promise<{ runId: string } | { pending: number }> => {
  const owner = opts.owner ?? 'organization/test1'
  const timeoutMs = opts.timeoutMs ?? 60_000
  const known = new Set((await runsOf(ax, owner, conversationId)).map(r => r.id))
  const { socket } = await attach(ax, conversationId, timeoutMs)
  socket.send({ type: 'approval', approvalId, approved: decision.approved, ...(decision.reason ? { reason: decision.reason } : {}) })
  // The socket stays open until the continuation ends, so its frames are still delivered to whoever
  // reads the record; closed in the background so the caller is not held for the whole run.
  const closeWhenDone = () => {
    ;(async () => {
      try {
        for (;;) if ((await socket.next(timeoutMs)).type === 'turn-end') break
      } catch { /* closed below */ }
      socket.close()
    })().catch(() => {})
  }
  try {
    for (;;) {
      const frame = await socket.next(timeoutMs)
      if (frame.type === 'error') throw refusal(frame.message)
      // The page shows the decision at once: this frame is the decided message, and it is how a
      // decision that leaves other calls undecided is told apart from the one that continues the turn.
      if (frame.type === 'message' && frame.role === 'assistant') {
        const undecided = (frame.parts ?? []).filter((p: any) => p.type === 'dynamic-tool' && p.state === 'approval-requested').length
        if (undecided) { socket.close(); return { pending: undecided } }
        break
      }
    }
    const deadline = Date.now() + timeoutMs
    for (;;) {
      const created = (await runsOf(ax, owner, conversationId)).find(r => !known.has(r.id))
      if (created) { closeWhenDone(); return { runId: created.id } }
      if (Date.now() > deadline) throw new Error('no run was created by the decision')
      await new Promise(resolve => setTimeout(resolve, 25))
    }
  } catch (err) {
    socket.close()
    throw err
  }
}

/** `decideOverSocket` for a decision that is expected to continue the turn: the run's id, or a failure. */
export const decideOverSocketToRun = async (
  ...args: Parameters<typeof decideOverSocket>
): Promise<{ runId: string }> => {
  const decided = await decideOverSocket(...args)
  if (!('runId' in decided)) throw new Error(`the decision left ${decided.pending} call(s) undecided: no run continues the turn`)
  return decided
}
