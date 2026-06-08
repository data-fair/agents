/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */
import type { TraceRequest } from './types.ts'

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000

export interface ParsedContext {
  kind: 'turn' | 'sub' | 'compaction' | 'unknown'
  uid: string
  agent?: { name: string, index?: number }
}

export function parseContextId (contextId: string): ParsedContext {
  const parts = (contextId ?? '').split(':')
  if (parts[0] === 'sub') {
    return { kind: 'sub', uid: parts.slice(3).join(':') || parts[parts.length - 1], agent: { name: parts[1] ?? '', index: Number(parts[2]) } }
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
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + RETENTION_MS)
  }
}
