import type { SessionTrace, PhysicalRequestTrace, TurnTrace, StepTrace, ToolCallTrace, ToolSnapshot, SubAgentTrace } from './session-recorder.ts'

export interface StoredTraceRequest {
  conversation: { id: string }
  contextId: string
  contextKind: 'turn' | 'sub' | 'compaction' | 'unknown'
  agent?: { name: string, index?: number }
  modelRole: string
  request: { model: string, body: any, messageCount: number, toolCount: number, bodyChars: number }
  response: { content: string, toolCalls: { id: string, name: string, arguments: string }[], finishReason?: string }
  usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }
  timing: { durationMs: number, timeToFirstChunkMs?: number }
  createdAt: string
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

export function reconstructTrace (requests: StoredTraceRequest[]): SessionTrace {
  const sorted = [...requests].sort((a, b) => ts(a.createdAt).getTime() - ts(b.createdAt).getTime())

  const physicalRequests: PhysicalRequestTrace[] = sorted.map(r => ({
    contextId: r.contextId,
    timestamp: ts(r.createdAt),
    modelRole: r.modelRole,
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

  const systemPrompt = systemPromptFromBody(sorted.find(r => r.contextKind !== 'sub')?.request.body)

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
    // Try to find a sub-agent whose name matches the tool name first, then fall back to any unused
    const chosen = [...subByKey.entries()].find(([k]) => k.startsWith(`${toolName}:`) && !usedSubKeys.has(k)) ??
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
    return { userMessage: lastUserMessage(reqs[0].request.body), timestamp: ts(reqs[0].createdAt), steps }
  })

  return { systemPrompt, toolSnapshots, toolChanges, turns, physicalRequests }
}
