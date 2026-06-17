/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */
import type { TraceRequest, TraceModeration, TraceFlags } from './types.ts'

// Stored traces are kept for 30 days, enforced by a TTL index on `createdAt`.
export const RETENTION_SECONDS = 30 * 24 * 60 * 60

// Parse the positive experimental flags from the request Cookie header.
// Returns undefined when the cookie is absent or unparseable, so callers can omit it.
export function parseFlagsCookie (cookieHeader?: string): TraceFlags | undefined {
  if (!cookieHeader) return undefined
  for (const part of cookieHeader.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k !== 'agent-chat-flags') continue
    try {
      const v = JSON.parse(decodeURIComponent(rest.join('=')))
      if (!v || typeof v !== 'object') return undefined
      return { toolExploration: !!v.toolExploration, subAgents: v.subAgents !== false, mermaid: !!v.mermaid }
    } catch { return undefined }
  }
  return undefined
}

export interface ParsedContext {
  kind: 'turn' | 'sub' | 'compaction' | 'unknown'
  uid: string
  agent?: { name: string, index?: number }
}

export function parseContextId (contextId: string): ParsedContext {
  const parts = (contextId ?? '').split(':')
  if (parts[0] === 'sub') {
    const idx = Number(parts[2])
    return {
      kind: 'sub',
      uid: parts.slice(3).join(':'),
      agent: { name: parts[1] ?? '', ...(Number.isFinite(idx) ? { index: idx } : {}) }
    }
  }
  if (parts[0] === 'compaction') return { kind: 'compaction', uid: parts.slice(1).join(':') }
  if (parts[0] === 'turn') return { kind: 'turn', uid: parts.slice(1).join(':') }
  return { kind: 'unknown', uid: contextId ?? '' }
}

export interface BuildTraceInput {
  owner: { type: string, id: string, department?: string }
  userId?: string
  userName?: string
  conversationId: string
  contextId: string
  modelRole: string
  providerName: string
  providerType: string
  resolvedModel: string
  body: any
  response: { content: string, toolCalls: { id: string, name: string, arguments: string }[], finishReason?: string }
  usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }
  timing: { durationMs: number, timeToFirstChunkMs?: number }
  moderation?: TraceModeration
  flags?: TraceFlags
}

export function buildTraceRequestDoc (input: BuildTraceInput, now: Date): TraceRequest {
  const ctx = parseContextId(input.contextId)
  const messages = Array.isArray(input.body?.messages) ? input.body.messages : []
  const tools = Array.isArray(input.body?.tools) ? input.body.tools : []
  return {
    owner: input.owner,
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.userName ? { userName: input.userName } : {}),
    conversation: { id: input.conversationId },
    contextId: input.contextId,
    contextKind: ctx.kind,
    ...(ctx.agent ? { agent: ctx.agent } : {}),
    modelRole: input.modelRole,
    operation: { name: 'chat' },
    provider: { name: input.providerName, type: input.providerType },
    request: {
      model: input.resolvedModel,
      body: input.body,
      messageCount: messages.length,
      toolCount: tools.length,
      bodyChars: JSON.stringify(input.body ?? {}).length
    },
    response: input.response,
    usage: input.usage,
    timing: input.timing,
    ...(input.moderation ? { moderation: input.moderation } : {}),
    ...(input.flags ? { flags: input.flags } : {}),
    // A BSON Date so the TTL index on `createdAt` can expire the document.
    createdAt: now
  }
}
