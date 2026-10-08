/**
 * The agent session wire protocol: what a browser and a server-side loop say to each other.
 *
 * Pure types and parsing, no I/O, so every branch is unit tested without a socket.
 *
 * In `shared/` because both sides consume it: the server dispatches these frames and the browser
 * composable speaks them. That is the contract in `tests/features/shared-contract/` — a module with one
 * consumer belongs in that workspace, and this one has two as of the browser tool bridge.
 *
 * The frames themselves are JSON schemas, like every other boundary of this service, and each frame's
 * meaning is documented there: ./agent-session-client-frame/schema.js (what a browser may send — types
 * and validator) and ./agent-session-server-frame/schema.js (what the server sends — types only),
 * compiled by `npm run build-types` like those under api/types. This module is their entry point.
 *
 * WHY NOT @data-fair/lib-express's pub/sub socket: it fans a channel out to several watchers through
 * mongo and accepts only `subscribe`/`unsubscribe` from a client. This protocol needs the server to ASK
 * the browser something and wait for the answer, in the process holding the connection.
 */

import { validate } from './agent-session-client-frame/index.ts'
import type { AgentSessionClientFrame, BrowserToolDescriptor, HostEventFrame } from './agent-session-client-frame/index.ts'
import type { AgentSessionServerFrame } from './agent-session-server-frame/index.ts'
import serverFrameSchema from './agent-session-server-frame/schema.js'

export type { BrowserToolDescriptor, HostEventFrame }
export type ClientMessage = AgentSessionClientFrame
export type ServerMessage = AgentSessionServerFrame

/** Why a client message was rejected. The client is told, because a silent drop is undebuggable. */
export interface InvalidMessage { type: 'invalid', reason: string }

const TOOLS_REASON = 'tools must be an array of { name, description?, inputSchema? } with unique names matching [a-zA-Z0-9_-]{1,64}'

/**
 * Parse one client frame, strictly: the schema's validator, whose `errorMessage`s name the field that
 * was wrong. Unknown properties are stripped rather than refused.
 */
export function parseClientMessage (raw: string): ClientMessage | InvalidMessage {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { type: 'invalid', reason: 'not valid JSON' }
  }
  if (!validate(parsed)) {
    const error = (validate as unknown as { errors?: Array<{ message?: string }> }).errors?.[0]
    return { type: 'invalid', reason: error?.message ?? 'invalid message' }
  }
  // The one rule a schema cannot state. A page registering the same name twice would make the
  // correlation table ambiguous and give the model two tools it cannot tell apart.
  if ('tools' in parsed && new Set(parsed.tools.map(tool => tool.name)).size !== parsed.tools.length) {
    return { type: 'invalid', reason: TOOLS_REASON }
  }
  return parsed
}

/** Every frame type the server sends, read off the schema so a frame added there is never ignored. */
const SERVER_FRAME_TYPES = new Set<string>(serverFrameSchema.oneOf.map(frame => frame.properties.type.const))

/**
 * Parse a server frame on the CLIENT, leniently — the mirror image of parseClientMessage.
 *
 * The server is strict with a browser because a browser-facing surface should refuse what it does not
 * recognise. The browser only dispatches on `type` and ignores a type it does not know: that means a
 * newer server talking to an older tab, which is normal during a deploy, and failing hard would break
 * the whole session. A known frame is not re-checked field by field: it comes from our own server,
 * typed by the same schema.
 */
export function parseServerMessageForClient (raw: string): ServerMessage | undefined {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return undefined
  }
  const type = (parsed as { type?: unknown } | null)?.type
  return typeof type === 'string' && SERVER_FRAME_TYPES.has(type) ? parsed as ServerMessage : undefined
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
