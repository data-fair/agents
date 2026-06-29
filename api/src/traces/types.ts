export interface TraceModeration {
  action: 'allow' | 'block'
  category?: string
  reason?: string
  latencyMs?: number
  failOpen?: 'timeout' | 'error'
}

export interface TraceFlags {
  toolExploration: boolean
  subAgents: boolean
  mermaid: boolean
}

export interface TraceRequest {
  owner: { type: string, id: string, department?: string }
  userId?: string
  userName?: string
  conversation: { id: string }
  contextId: string            // raw x-trace-ctx, e.g. "turn:<uid>" | "sub:<name>:<idx>:<uid>" | "compaction:<uid>"
  contextKind: 'turn' | 'sub' | 'compaction' | 'unknown'
  agent?: { name: string, index?: number }   // present only for sub-agent calls
  modelRole: string            // assistant | tools | summarizer | evaluator
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
  // money cost of this request, computed at record time from the unit prices in
  // effect then; absent on pre-feature documents (cacheTokens are not priced)
  cost?: { input: number, output: number, total: number }
  timing: { durationMs: number, timeToFirstChunkMs?: number }
  // verdict of the gateway-side moderation check, when it had settled by the
  // time this request was recorded (untrusted callers only)
  moderation?: TraceModeration
  // experimental flags the user had active for this conversation (constant per conversation)
  flags?: TraceFlags
  createdAt: Date              // ordering key + TTL target (30-day index on this field)
}
