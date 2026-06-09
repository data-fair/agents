export interface TraceRequest {
  owner: { type: string, id: string, department?: string }
  userId?: string
  userName?: string
  conversation: { id: string }
  contextId: string            // raw x-trace-ctx, e.g. "turn:<uid>" | "sub:<name>:<idx>:<uid>" | "compaction:<uid>" | "moderation:<uid>"
  contextKind: 'turn' | 'sub' | 'compaction' | 'moderation' | 'unknown'
  agent?: { name: string, index?: number }   // present only for sub-agent calls
  modelRole: string            // assistant | tools | summarizer | moderator | evaluator
  operation: { name: 'chat' }
  provider: { name: string, type: string }
  request: {
    model: string              // resolved model id
    body: any                  // raw OpenAI request body (system+messages+tools+model role)
    messageCount: number
    toolCount: number
    bodyChars: number
  }
  response: {
    content: string
    toolCalls: { id: string, name: string, arguments: string }[]
    finishReason?: string
  }
  usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }
  timing: { durationMs: number, timeToFirstChunkMs?: number }
  createdAt: Date              // ordering key + TTL target (30-day index on this field)
}
