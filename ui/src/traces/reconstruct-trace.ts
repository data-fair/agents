import type { SessionTrace, TraceSummary, PhysicalRequestTrace, TurnTrace, StepTrace, ToolCallTrace, ToolSnapshot, SubAgentTrace } from './session-recorder.ts'
import { splitHiddenContext } from './hidden-context.ts'
// Relative path (not the ~/ alias) so the root `tsc` pass — which compiles the
// unit tests that import this module — resolves it; the ~ Vite alias is not
// configured for that pass. Don't "fix" this to ~/utils/agent-flags.
import { DEFAULT_FLAGS, type AgentFlags } from '../utils/agent-flags.ts'

export interface StoredTraceRequest {
  conversation: { id: string }
  contextId: string
  contextKind: 'turn' | 'sub' | 'compaction' | 'moderation' | 'unknown'
  agent?: { name: string, index?: number }
  modelRole: string
  provider?: { name: string, type: string }
  request: { model: string, body: any, messageCount: number, toolCount: number, bodyChars: number }
  response: { content: string, toolCalls: { id: string, name: string, arguments: string }[], finishReason?: string }
  usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }
  cost?: { input: number, output: number, total: number }
  timing: { durationMs: number, timeToFirstChunkMs?: number }
  createdAt: string
  moderation?: { action: 'allow' | 'block', category?: string, reason?: string, latencyMs?: number, failOpen?: 'timeout' | 'error' }
  flags?: AgentFlags
}

const ts = (iso: string) => new Date(iso)

function toolSnapshotsFromBody (body: any): ToolSnapshot[] {
  const tools = Array.isArray(body?.tools) ? body.tools : []
  return tools.map((t: any) => ({
    name: t.function?.name ?? t.name ?? '',
    description: t.function?.description ?? '',
    inputSchema: t.function?.parameters ?? {}
  }))
}

function systemPromptFromBody (body: any): string {
  const messages = Array.isArray(body?.messages) ? body.messages : []
  return messages.filter((m: any) => m.role === 'system').map((m: any) => (typeof m.content === 'string' ? m.content : '')).join('\n')
}

function lastUserMessage (body: any): string {
  const messages = Array.isArray(body?.messages) ? body.messages : []
  const users = messages.filter((m: any) => m.role === 'user')
  const last = users[users.length - 1]
  if (typeof last?.content === 'string') return last.content
  if (Array.isArray(last?.content)) return last.content.find((c: any) => c.type === 'text')?.text ?? ''
  return ''
}

// Index every tool result (tool-role message) across the whole conversation by tool_call_id.
// Keep the raw content as-is (string or object) — callers decide whether to parse.
function buildToolResultIndex (requests: StoredTraceRequest[]): Map<string, any> {
  const map = new Map<string, any>()
  for (const r of requests) {
    const messages = Array.isArray(r.request.body?.messages) ? r.request.body.messages : []
    for (const m of messages) {
      if (m.role === 'tool' && m.tool_call_id) {
        // Parse JSON string content back into an object so the viewer's
        // JSON.stringify(output) preview is not double-quoted; safeJson keeps
        // genuinely non-JSON string outputs as-is (matches live-recorder output).
        if (!map.has(m.tool_call_id)) map.set(m.tool_call_id, safeJson(m.content))
      }
    }
  }
  return map
}

function safeJson (s: string): any { try { return JSON.parse(s) } catch { return s } }

// A compaction request (ctx `compaction:<turnId>`) → a step carrying the compaction
// summary. compactedCharCount: the post-compaction history size isn't stored, so we use
// the summary length as a close proxy (the summary replaced the history).
function compactionStepOf (comp: StoredTraceRequest): StepTrace {
  const step: StepTrace = { timestamp: ts(comp.createdAt), messages: [], toolCalls: [] }
  ;(step as any).compaction = {
    originalMessages: Array.isArray(comp.request.body?.messages) ? comp.request.body.messages : [],
    summary: comp.response.content,
    originalCharCount: comp.request.bodyChars,
    compactedCharCount: comp.response.content.length
  }
  return step
}

// A turn request carrying an embedded gateway moderation verdict → a step
// surfacing it as a moderation entry.
function moderationStepOf (r: StoredTraceRequest): StepTrace {
  const m = r.moderation!
  const step: StepTrace = { timestamp: ts(r.createdAt), messages: [], toolCalls: [] }
  ;(step as any).moderation = { action: m.action, category: m.category, reason: m.reason, latencyMs: m.latencyMs, failOpen: m.failOpen }
  return step
}

export function reconstructTrace (requests: StoredTraceRequest[]): SessionTrace & { summary: TraceSummary } {
  const sorted = [...requests].sort((a, b) => ts(a.createdAt).getTime() - ts(b.createdAt).getTime())

  const physicalRequests: PhysicalRequestTrace[] = sorted.map(r => ({
    contextId: r.contextId,
    timestamp: ts(r.createdAt),
    modelRole: r.modelRole,
    model: r.request.model,
    provider: r.provider,
    cost: r.cost,
    requestBody: r.request.body,
    result: { content: r.response.content, toolCalls: r.response.toolCalls, finishReason: r.response.finishReason },
    inputTokens: r.usage.inputTokens,
    outputTokens: r.usage.outputTokens,
    cacheReadTokens: r.usage.cacheReadTokens,
    cacheWriteTokens: r.usage.cacheWriteTokens,
    messageCount: r.request.messageCount,
    toolCount: r.request.toolCount,
    bodyChars: r.request.bodyChars,
    durationMs: r.timing.durationMs,
    timeToFirstChunkMs: r.timing.timeToFirstChunkMs
  }))

  const toolResults = buildToolResultIndex(sorted)

  // Compaction requests use ctx `compaction:<turnId>` and carry the history that was
  // summarized (request body) plus the produced summary (response). Map them by turnId
  // so we can surface a dedicated compaction entry inside the matching `turn:<turnId>`.
  const compactionByTurn = new Map<string, StoredTraceRequest>()
  for (const r of sorted) {
    if (r.contextKind === 'compaction') {
      const turnId = r.contextId.replace(/^compaction:/, '')
      if (!compactionByTurn.has(turnId)) compactionByTurn.set(turnId, r)
    }
  }

  const toolSnapshots: ToolSnapshot[][] = []
  const toolChanges: { timestamp: Date, tools: ToolSnapshot[] }[] = []
  let lastToolNames = ''
  for (const r of sorted.filter(r => r.contextKind !== 'sub')) {
    const snap = toolSnapshotsFromBody(r.request.body)
    const key = snap.map(s => s.name).join(',')
    if (snap.length && key !== lastToolNames) {
      toolSnapshots.push(snap)
      toolChanges.push({ timestamp: ts(r.createdAt), tools: snap })
      lastToolNames = key
    }
  }

  // Use a main-thread (turn) request for the system prompt — moderation/compaction
  // requests carry their own system prompts (the moderator/summarizer instructions).
  const systemPrompt = systemPromptFromBody(sorted.find(r => r.contextKind === 'turn' || r.contextKind === 'unknown')?.request.body)

  // Build a map of sub-agent requests grouped by agent key (name:index)
  const subByKey = new Map<string, StoredTraceRequest[]>()
  for (const r of sorted) {
    if (r.contextKind === 'sub' && r.agent) {
      const key = `${r.agent.name}:${r.agent.index ?? 0}`
      const arr = subByKey.get(key) ?? []
      arr.push(r)
      subByKey.set(key, arr)
    }
  }
  const usedSubKeys = new Set<string>()

  const nextSubForName = (toolName: string): SubAgentTrace | undefined => {
    // Strip leading "subagent_" prefix so e.g. "subagent_Researcher" matches key "Researcher:0"
    const stripped = toolName.replace(/^subagent_/, '')
    // Try to find a sub-agent whose name matches the tool name first, then fall back to any unused
    const chosen = [...subByKey.entries()].find(([k]) => k.startsWith(`${stripped}:`) && !usedSubKeys.has(k)) ??
                   [...subByKey.entries()].find(([k]) => !usedSubKeys.has(k))
    if (!chosen) return undefined
    usedSubKeys.add(chosen[0])
    const reqs = chosen[1]
    return {
      name: reqs[0].agent!.name,
      systemPrompt: systemPromptFromBody(reqs[0].request.body),
      tools: toolSnapshotsFromBody(reqs[0].request.body),
      task: lastUserMessage(reqs[0].request.body),
      turnIndex: reqs[0].agent!.index,
      steps: reqs.map(sr => ({
        timestamp: ts(sr.createdAt),
        messages: [{ role: 'assistant', content: sr.response.content }] as any,
        finishReason: sr.response.finishReason,
        toolCalls: sr.response.toolCalls.map(tc => ({
          id: tc.id,
          toolName: tc.name,
          input: safeJson(tc.arguments),
          output: toolResults.get(tc.id) ?? null,
          timestamp: ts(sr.createdAt)
        }))
      }))
    }
  }

  // Group main-thread requests by contextId (turn uid), preserving order
  const mainReqs = sorted.filter(r => r.contextKind === 'turn' || r.contextKind === 'unknown')
  const turnsByUid = new Map<string, StoredTraceRequest[]>()
  const uidOrder: string[] = []
  for (const r of mainReqs) {
    const uid = r.contextId
    if (!turnsByUid.has(uid)) { turnsByUid.set(uid, []); uidOrder.push(uid) }
    turnsByUid.get(uid)!.push(r)
  }

  const turns: TurnTrace[] = uidOrder.map(uid => {
    const reqs = turnsByUid.get(uid)!
    const steps: StepTrace[] = reqs.map(r => {
      const toolCalls: ToolCallTrace[] = r.response.toolCalls.map(tc => {
        const call: ToolCallTrace = {
          id: tc.id,
          toolName: tc.name,
          input: safeJson(tc.arguments),
          output: toolResults.get(tc.id) ?? null,
          timestamp: ts(r.createdAt)
        }
        const sub = nextSubForName(tc.name)
        if (sub) call.subAgent = sub
        return call
      })
      return {
        timestamp: ts(r.createdAt),
        messages: r.response.content ? ([{ role: 'assistant', content: r.response.content }] as any) : [],
        finishReason: r.response.finishReason,
        toolCalls
      }
    })
    // Prepend compaction + moderation steps — both happen before/around the turn's
    // response, and matched the old in-browser recorder's recordCompaction/recordModerationDecision.
    const turnId = uid.replace(/^turn:/, '')
    const prefix: StepTrace[] = []
    const comp = compactionByTurn.get(turnId)
    if (comp) prefix.push(compactionStepOf(comp))
    const mod = reqs.find(r => r.moderation)
    if (mod) prefix.push(moderationStepOf(mod))
    const { visible, hidden } = splitHiddenContext(lastUserMessage(reqs[0].request.body))
    return { userMessage: visible, ...(hidden ? { hiddenContext: hidden } : {}), timestamp: ts(reqs[0].createdAt), steps: [...prefix, ...steps] }
  })

  // Synthesize turns for compaction requests whose main turn request was never stored.
  const builtTurnIds = new Set(uidOrder.map(uid => uid.replace(/^turn:/, '')))
  const orphanIds = new Set<string>()
  for (const k of compactionByTurn.keys()) if (!builtTurnIds.has(k)) orphanIds.add(k)
  for (const turnId of orphanIds) {
    const comp = compactionByTurn.get(turnId)
    const steps: StepTrace[] = []
    if (comp) steps.push(compactionStepOf(comp))
    const src = comp!
    const { visible, hidden } = splitHiddenContext(lastUserMessage(src.request.body))
    turns.push({ userMessage: visible, ...(hidden ? { hiddenContext: hidden } : {}), timestamp: ts(src.createdAt), steps })
  }
  // Keep turns chronological after appending any synthesized ones.
  turns.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  const flags = sorted.find(r => r.flags)?.flags ?? DEFAULT_FLAGS
  const summary = {
    requestCount: physicalRequests.length,
    totalDurationMs: physicalRequests.reduce((s, p) => s + (p.durationMs || 0), 0),
    inputTokens: physicalRequests.reduce((s, p) => s + (p.inputTokens || 0), 0),
    outputTokens: physicalRequests.reduce((s, p) => s + (p.outputTokens || 0), 0),
    ...(physicalRequests.some(p => p.cost) ? { totalCost: physicalRequests.reduce((s, p) => s + (p.cost?.total || 0), 0) } : {}),
    flags
  }

  return { systemPrompt, toolSnapshots, toolChanges, turns, physicalRequests, summary }
}
