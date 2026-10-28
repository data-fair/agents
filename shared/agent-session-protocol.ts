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
import type { AgentSessionClientFrame, BrowserToolDescriptor, PageSkillDescriptor, HostEventFrame } from './agent-session-client-frame/index.ts'
import type { AgentSessionServerFrame } from './agent-session-server-frame/index.ts'
import serverFrameSchema from './agent-session-server-frame/schema.js'
import { CLIENT_FRAME_LIMITS, TOOLS_MESSAGE, SKILLS_MESSAGE } from './agent-session-client-frame/limits.js'

export type { BrowserToolDescriptor, PageSkillDescriptor, HostEventFrame }
export { CLIENT_FRAME_LIMITS, TOOLS_MESSAGE, SKILLS_MESSAGE }
export type ClientMessage = AgentSessionClientFrame
export type ServerMessage = AgentSessionServerFrame

/** Why a client message was rejected. The client is told, because a silent drop is undebuggable. */
export interface InvalidMessage { type: 'invalid', reason: string }

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
    return { type: 'invalid', reason: TOOLS_MESSAGE }
  }
  // Likewise for skills: the model loads one by URI, so two with the same URI could not be told apart.
  if ('skills' in parsed && parsed.skills && new Set(parsed.skills.map(skill => skill.uri)).size !== parsed.skills.length) {
    return { type: 'invalid', reason: SKILLS_MESSAGE }
  }
  return parsed
}

const TRUNCATED = '\n\n[truncated]'
/** The Agent Skills name format, as the frame schema states it. */
const SKILL_NAME = /^(?=.{1,64}$)[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * What a page publishes, made to fit the frame: the first of a duplicate URI, `skill://` URIs only, at
 * most CLIENT_FRAME_LIMITS.skills, descriptions and bodies cut to their bounds. Called by the browser
 * before sending, because a frame the server refuses would lose the page's tools as well.
 */
export function fitPageSkills (skills: PageSkillDescriptor[]): PageSkillDescriptor[] {
  const L = CLIENT_FRAME_LIMITS
  const seen = new Set<string>()
  const fitted: PageSkillDescriptor[] = []
  for (const skill of skills) {
    // What the schema would refuse is dropped here: one refused skill would cost the whole frame.
    if (!skill.uri.startsWith('skill://') || skill.uri.length > L.id || !SKILL_NAME.test(skill.name) || seen.has(skill.uri)) continue
    seen.add(skill.uri)
    fitted.push({
      ...skill,
      description: skill.description.slice(0, L.skillDescription),
      body: skill.body.length > L.skillBody ? skill.body.slice(0, L.skillBody - TRUNCATED.length) + TRUNCATED : skill.body
    })
    if (fitted.length === L.skills) break
  }
  return fitted
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
 * Whether a frame is replaced whole by a later one of the same turn, so a socket whose browser is not
 * reading fast enough may skip it: an in-progress message or sub-agent transcript (every one carries
 * all its parts, and the final one is never skipped) and a text delta (the final message carries the
 * text). Anything else says something nothing later repeats — a call to the page, an activity, the
 * turn's end, an error — and is always sent.
 */
export function isSupersededFrame (message: ServerMessage): boolean {
  if (message.type === 'delta') return true
  if (message.type === 'message' || message.type === 'subagent') return message.pending === true
  return false
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
