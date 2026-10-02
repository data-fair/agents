/**
 * The agent session wire protocol: what a browser and a server-side loop say to each other.
 *
 * Pure types and parsing, no I/O, so every branch is unit tested without a socket.
 *
 * In `shared/` because both sides consume it: the server dispatches these frames and the browser
 * composable speaks them. That is the contract in `tests/features/shared-contract/` — a module with one
 * consumer belongs in that workspace, and this one has two as of the browser tool bridge.
 *
 * WHY A SECOND SOCKET AT ALL, rather than extending the existing pub/sub one: that one fans a SHARED
 * conversation out to several watchers, which is exactly the capability this design drops. It accepts
 * only `subscribe`/`unsubscribe` from a client (verified in @data-fair/lib-express/ws-server) and
 * routes through mongo for a fleet. This protocol needs the server to ASK the browser something and
 * wait for the answer, in the process holding the connection.
 */

import type { ChatActivity } from './agent-activity.ts'

/** A contextual tool the page offers. Only its advertisement — the page keeps the implementation. */
export interface BrowserToolDescriptor {
  name: string
  description?: string
  /** JSON Schema, passed to the model as-is. Unvalidated here: the model's provider is the judge. */
  inputSchema?: unknown
}

export type ClientMessage =
  /** First message. Binds the connection to a conversation and declares the page's contextual tools. */
  | { type: 'hello', conversationId?: string, agentId?: string, tools: BrowserToolDescriptor[] }
  /** The page navigated or its state changed: this is the tool set from now on. */
  | { type: 'tools-changed', tools: BrowserToolDescriptor[] }
  /**
   * A user turn.
   *
   * `hiddenContext` is what an action button supplies: context the model should have and the person
   * should not see rendered back at them. It travels as its OWN field and the server does the wrapping
   * (see `wrapHiddenContext`), rather than the client sending a pre-wrapped `content`. That is what
   * keeps the sentinels from being something a client can place: a client that could wrap would be a
   * client that could forge a false boundary inside its own visible text and smuggle the rest past the
   * moderation gate, which classifies the whole wrapped message precisely so the wrapper is not an
   * escape hatch.
   */
  | { type: 'prompt', content: string, hiddenContext?: string }
  /** The answer to a `tool-call`. Exactly one of result/error. */
  | { type: 'tool-result', callId: string, result?: unknown, error?: string }
  /** Stop the turn in flight. */
  | { type: 'abort' }
  /**
   * What is true on the page right now — retained, keyed facts.
   *
   * Replaces the previous state wholesale, because it answers "what is true now" rather than "what
   * changed": the model is told it at the moments it has no history to integrate from (first turn,
   * after a reset, after a compaction).
   */
  | { type: 'host-state', state: Record<string, unknown> }
  /** Things the person did. Appended, coalesced and capped by the store, not by the wire. */
  | { type: 'host-events', events: HostEventFrame[] }

/**
 * One thing that happened on the page, as it travels.
 *
 * Structurally identical to lib-vue's `AgentEvent`, and deliberately re-declared rather than imported:
 * `shared/` must not depend on a Vue package, and this is a WIRE type whose shape is now part of the
 * protocol — pinning it here is what stops a lib-vue refactor silently changing what the server parses.
 */
export interface HostEventFrame {
  name: string
  detail?: string
  /** Present on state-like events: a later event with the same key supersedes this one. */
  key?: string
  at: number
}

export type ServerMessage =
  | { type: 'attached', conversationId: string, anonymous: boolean }
  /** Token stream of the turn in progress. */
  | { type: 'delta', kind: 'text' | 'reasoning', text: string }
  /** Run this contextual tool and answer with a `tool-result` carrying the same callId. */
  | { type: 'tool-call', callId: string, name: string, input: unknown }
  /**
   * The assistant turn as it stands, as STORED PARTS.
   *
   * One frame type instead of a parallel stream vocabulary. The transcript a client renders is the
   * conversation of record — the same `UIMessagePart[]` the model is replayed from — so the same
   * mapper serves the live chat and a thread reopened later, and there is no second format to keep in
   * step. `delta` stays for token-level smoothness; this carries structure: tool calls, their states,
   * step boundaries, reasoning.
   *
   * Throttled on the same clock as the partial persist, because the structure changes per tool call
   * rather than per token.
   */
  | { type: 'message', seq: number, role: 'user' | 'assistant', parts: unknown[], pending: boolean }
  /**
   * What the assistant is doing right now, in the vocabulary the chat already renders.
   *
   * `ChatActivity` straight from `shared/agent-activity.ts` rather than a wire type of its own: that
   * module was already free of Vue and of the `~` alias, so the server can produce exactly what
   * `activityLabelKey` consumes and there is no translation layer to drift. `null` means idle.
   *
   * It also answers `isWaitingForUser`, which is `kind === 'waiting'` — one frame rather than two
   * overlapping ones.
   */
  | {
    type: 'activity'
    activity: ChatActivity | null
    /**
     * Present when this is a sub-agent PANEL's phase line rather than the main one.
     *
     * Keyed on the delegating tool call, because several workers run concurrently when the lead
     * delegates more than once in a step — the browser loop keys its panels the same way, and without
     * the key two panels would share one phase line.
     */
    parentToolCallId?: string
  }
  /**
   * A worker's trace, as stored parts, for its panel.
   *
   * Same shape as the main turn's `message` frame and for the same reason: one way to render a turn.
   * The lead still sees only the summary — this is the trace the UI shows when a panel is expanded,
   * never something the model reads.
   */
  | { type: 'subagent', parentToolCallId: string, name: string, parts: unknown[], pending: boolean }
  | { type: 'turn-end', stopReason: string, detail?: string }
  | { type: 'error', message: string }

/** Why a client message was rejected. The client is told, because a silent drop is undebuggable. */
export interface InvalidMessage { type: 'invalid', reason: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * A tool descriptor list, or undefined when the shape is wrong.
 *
 * Tool NAMES are checked here because they end up as model-facing tool identifiers and in a
 * correlation table; everything else about a tool is the provider's problem. The name charset is
 * deliberately narrow — the same reason the MCP tool names are sanitised before they reach a prompt.
 */
const parseTools = (value: unknown): BrowserToolDescriptor[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const tools: BrowserToolDescriptor[] = []
  for (const raw of value) {
    if (!isRecord(raw)) return undefined
    const name = raw.name
    if (typeof name !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(name)) return undefined
    tools.push({
      name,
      ...(typeof raw.description === 'string' ? { description: raw.description } : {}),
      ...(raw.inputSchema !== undefined ? { inputSchema: raw.inputSchema } : {})
    })
  }
  // A page that registers the same name twice would make the correlation table ambiguous and would
  // give the model two tools it cannot tell apart.
  if (new Set(tools.map(tool => tool.name)).size !== tools.length) return undefined
  return tools
}

/**
 * Parse one client frame, strictly.
 *
 * Strict on purpose: this is a browser-facing surface, so anything not explicitly allowed is refused
 * rather than coerced. A client that sends nonsense gets told which field was wrong, because the
 * alternative — dropping it — is the silent failure this project treats as the worst outcome.
 */
export function parseClientMessage (raw: string): ClientMessage | InvalidMessage {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { type: 'invalid', reason: 'not valid JSON' }
  }
  if (!isRecord(parsed)) return { type: 'invalid', reason: 'a message must be an object' }

  switch (parsed.type) {
    case 'hello': {
      const tools = parseTools(parsed.tools)
      if (!tools) return { type: 'invalid', reason: 'tools must be an array of { name, description?, inputSchema? } with unique names matching [a-zA-Z0-9_-]{1,64}' }
      if (parsed.conversationId !== undefined && typeof parsed.conversationId !== 'string') {
        return { type: 'invalid', reason: 'conversationId must be a string when present' }
      }
      if (parsed.agentId !== undefined && typeof parsed.agentId !== 'string') {
        return { type: 'invalid', reason: 'agentId must be a string when present' }
      }
      return {
        type: 'hello',
        tools,
        ...(typeof parsed.conversationId === 'string' ? { conversationId: parsed.conversationId } : {}),
        ...(typeof parsed.agentId === 'string' ? { agentId: parsed.agentId } : {})
      }
    }
    case 'tools-changed': {
      const tools = parseTools(parsed.tools)
      if (!tools) return { type: 'invalid', reason: 'tools must be an array of { name, description?, inputSchema? } with unique names matching [a-zA-Z0-9_-]{1,64}' }
      return { type: 'tools-changed', tools }
    }
    case 'prompt': {
      // Non-blank, matching the HTTP route's own rule: an empty turn is refused rather than started,
      // because a provider rejects a whitespace-only text block anyway.
      if (typeof parsed.content !== 'string' || !parsed.content.trim()) {
        return { type: 'invalid', reason: 'content must be a non-blank string' }
      }
      // A present-but-wrong hiddenContext is rejected rather than coerced: it ends up inside the
      // model's user turn, so silently stringifying an object would put "[object Object]" there.
      if (parsed.hiddenContext !== undefined && typeof parsed.hiddenContext !== 'string') {
        return { type: 'invalid', reason: 'hiddenContext must be a string when present' }
      }
      return {
        type: 'prompt',
        content: parsed.content,
        ...(parsed.hiddenContext ? { hiddenContext: parsed.hiddenContext } : {})
      }
    }
    case 'tool-result': {
      if (typeof parsed.callId !== 'string' || !parsed.callId) {
        return { type: 'invalid', reason: 'callId must be a non-empty string' }
      }
      const hasError = parsed.error !== undefined
      const hasResult = parsed.result !== undefined
      // Exactly one. Both would leave "did it work?" to a tie-break, which is how a failed tool came
      // to be indistinguishable from a successful one elsewhere in this codebase.
      if (hasError === hasResult) {
        return { type: 'invalid', reason: 'a tool-result carries exactly one of result or error' }
      }
      if (hasError && typeof parsed.error !== 'string') {
        return { type: 'invalid', reason: 'error must be a string' }
      }
      return hasError
        ? { type: 'tool-result', callId: parsed.callId, error: parsed.error as string }
        : { type: 'tool-result', callId: parsed.callId, result: parsed.result }
    }
    case 'abort':
      return { type: 'abort' }
    case 'host-state': {
      if (!isRecord(parsed.state)) return { type: 'invalid', reason: 'state must be an object of keyed facts' }
      return { type: 'host-state', state: parsed.state }
    }
    case 'host-events': {
      if (!Array.isArray(parsed.events)) return { type: 'invalid', reason: 'events must be an array' }
      const events: HostEventFrame[] = []
      for (const raw of parsed.events) {
        // Validated rather than trusted: these reach the model's context as prose, and `at` orders the
        // coalescing, so a missing name or a non-numeric timestamp corrupts what the model is told.
        if (!isRecord(raw) || typeof raw.name !== 'string' || !raw.name || typeof raw.at !== 'number') {
          return { type: 'invalid', reason: 'each event needs a non-empty name and a numeric at' }
        }
        events.push({
          name: raw.name,
          at: raw.at,
          ...(typeof raw.detail === 'string' ? { detail: raw.detail } : {}),
          ...(typeof raw.key === 'string' ? { key: raw.key } : {})
        })
      }
      return { type: 'host-events', events }
    }
    default:
      return { type: 'invalid', reason: `unknown message type ${JSON.stringify(parsed.type)}` }
  }
}

/**
 * Parse a server frame on the CLIENT, leniently — the mirror image of parseClientMessage.
 *
 * Deliberately the opposite posture. The server is strict with a browser because a browser-facing
 * surface should refuse what it does not recognise. The browser is lenient with the server because an
 * unrecognised frame means a newer server talking to an older tab, which is normal during a deploy:
 * ignoring it degrades one feature, while failing hard breaks the whole session.
 *
 * Returns undefined for anything it cannot place, so the caller logs and carries on.
 */
export function parseServerMessageForClient (raw: string): ServerMessage | undefined {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return undefined
  }
  if (!isRecord(parsed)) return undefined
  switch (parsed.type) {
    case 'attached':
      if (typeof parsed.conversationId !== 'string') return undefined
      return { type: 'attached', conversationId: parsed.conversationId, anonymous: parsed.anonymous === true }
    case 'delta':
      if (parsed.kind !== 'text' && parsed.kind !== 'reasoning') return undefined
      if (typeof parsed.text !== 'string') return undefined
      return { type: 'delta', kind: parsed.kind, text: parsed.text }
    case 'tool-call':
      if (typeof parsed.callId !== 'string' || typeof parsed.name !== 'string') return undefined
      return { type: 'tool-call', callId: parsed.callId, name: parsed.name, input: parsed.input }
    case 'message': {
      if (typeof parsed.seq !== 'number') return undefined
      if (parsed.role !== 'user' && parsed.role !== 'assistant') return undefined
      if (!Array.isArray(parsed.parts)) return undefined
      return { type: 'message', seq: parsed.seq, role: parsed.role, parts: parsed.parts, pending: parsed.pending === true }
    }
    case 'activity':
      // Structurally tolerant: the vocabulary may grow a kind, and an older tab should ignore one it
      // does not know rather than drop the frame — the renderer already returns null for anything it
      // cannot label.
      if (parsed.activity !== null && !isRecord(parsed.activity)) return undefined
      return {
        type: 'activity',
        activity: parsed.activity as ChatActivity | null,
        ...(typeof parsed.parentToolCallId === 'string' ? { parentToolCallId: parsed.parentToolCallId } : {})
      }
    case 'subagent': {
      if (typeof parsed.parentToolCallId !== 'string' || typeof parsed.name !== 'string') return undefined
      if (!Array.isArray(parsed.parts)) return undefined
      return {
        type: 'subagent',
        parentToolCallId: parsed.parentToolCallId,
        name: parsed.name,
        parts: parsed.parts,
        pending: parsed.pending === true
      }
    }
    case 'turn-end':
      if (typeof parsed.stopReason !== 'string') return undefined
      return {
        type: 'turn-end',
        stopReason: parsed.stopReason,
        ...(typeof parsed.detail === 'string' ? { detail: parsed.detail } : {})
      }
    case 'error':
      if (typeof parsed.message !== 'string') return undefined
      return { type: 'error', message: parsed.message }
    default:
      return undefined
  }
}

/**
 * Whether a raw upgrade url is this protocol's endpoint.
 *
 * Matched on the SUFFIX rather than the whole path: the websocket upgrade reaches the HTTP server
 * before Express, so `req.url` carries whatever public prefix the reverse proxy was configured with
 * (`/agents/api/...` in dev, something else in another deployment). Anchoring on the deployment's
 * prefix would make this work in dev and fail in production for an invisible reason.
 */
export function isAgentSessionPath (url: string | undefined): boolean {
  if (!url) return false
  const pathname = url.split('?')[0].replace(/\/+$/, '')
  return pathname.endsWith('/api/agent-session')
}
