import type { ModelMessage } from 'ai'
import { DEFAULT_FLAGS, type AgentFlags } from '../utils/agent-flags.ts'

export interface ToolCallTrace {
  id: string
  toolName: string
  input: any
  output: any
  timestamp: Date
  endTimestamp?: Date
  durationMs?: number
  subAgent?: SubAgentTrace
}

export interface StepTrace {
  timestamp: Date
  messages: ModelMessage[]
  finishReason?: string
  toolCalls: ToolCallTrace[]
}

export interface PhysicalRequestTrace {
  contextId: string
  timestamp: Date
  modelRole: string
  requestBody: any
  result: { content: string; toolCalls: { id: string; name: string; arguments: string }[]; finishReason?: string }
  inputTokens: number
  outputTokens: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
  messageCount: number
  toolCount: number
  bodyChars: number
  durationMs: number
  timeToFirstChunkMs?: number
}

export interface TurnTrace {
  userMessage: string
  hiddenContext?: string
  timestamp: Date
  steps: StepTrace[]
}

export interface ToolSnapshot {
  name: string
  title?: string
  description: string
  inputSchema: Record<string, any>
}

export interface SubAgentTrace {
  name: string
  systemPrompt: string
  tools: ToolSnapshot[]
  task: string
  steps: StepTrace[]
  turnIndex?: number
}

export interface ToolChangeEvent {
  timestamp: Date
  tools: ToolSnapshot[]
}

export interface TraceSummary {
  requestCount: number
  inputTokens: number
  outputTokens: number
  flags: AgentFlags
}

export interface SessionTrace {
  systemPrompt: string
  toolSnapshots: ToolSnapshot[][]
  toolChanges: ToolChangeEvent[]
  turns: TurnTrace[]
  physicalRequests: PhysicalRequestTrace[]
  // Optional so externally-deserialized/legacy traces (and the empty-trace test
  // fixture) remain valid; reconstructTrace always populates it and getSummary
  // falls back to a zeroed summary when absent.
  summary?: TraceSummary
}

export interface TraceOverviewEntry {
  index: number
  type: 'system-prompt' | 'user-message' | 'hidden-context' | 'assistant-step' | 'tool-call' | 'tool-result' | 'sub-agent-start' | 'sub-agent-system-prompt' | 'sub-agent-step' | 'sub-agent-end' | 'physical-request' | 'tools-changed' | 'compaction' | 'moderation'
  timestamp: Date
  label: string
  preview: string
}

export interface TraceEntryDetail {
  index: number
  type: TraceOverviewEntry['type']
  timestamp: Date
  label: string
  content: any
}

export function serializeTrace (trace: SessionTrace): string {
  return JSON.stringify(trace)
}

const toDate = (v: any): Date => (v instanceof Date ? v : new Date(v))

function reviveStepDates (step: any): void {
  step.timestamp = toDate(step.timestamp)
  for (const tc of step.toolCalls ?? []) {
    tc.timestamp = toDate(tc.timestamp)
    if (tc.endTimestamp) tc.endTimestamp = toDate(tc.endTimestamp)
    for (const subStep of tc.subAgent?.steps ?? []) reviveStepDates(subStep)
  }
}

// Mutates `trace` in place, turning ISO strings back into Date objects, and returns it.
export function reviveTraceDates (trace: SessionTrace): SessionTrace {
  for (const turn of trace.turns ?? []) {
    turn.timestamp = toDate(turn.timestamp)
    for (const step of turn.steps ?? []) reviveStepDates(step)
  }
  for (const change of trace.toolChanges ?? []) change.timestamp = toDate(change.timestamp)
  for (const pr of trace.physicalRequests ?? []) pr.timestamp = toDate(pr.timestamp)
  return trace
}

export class SessionRecorder {
  private trace: SessionTrace = {
    systemPrompt: '',
    toolSnapshots: [],
    toolChanges: [],
    turns: [],
    physicalRequests: [],
    summary: { requestCount: 0, inputTokens: 0, outputTokens: 0, flags: { ...DEFAULT_FLAGS } }
  }

  getTrace (): SessionTrace {
    return this.trace
  }

  static fromTrace (raw: SessionTrace): SessionRecorder {
    const recorder = new SessionRecorder()
    recorder.trace = reviveTraceDates(raw)
    return recorder
  }

  getTraceOverview (): TraceOverviewEntry[] {
    this.buildCache()
    return this.cachedOverview
  }

  getSummary (): TraceSummary {
    return this.trace.summary ?? { requestCount: 0, inputTokens: 0, outputTokens: 0, flags: { ...DEFAULT_FLAGS } }
  }

  private cachedOverview: TraceOverviewEntry[] = []
  private cachedDetails: TraceEntryDetail[] = []

  private buildCache (): void {
    const items: { overview: Omit<TraceOverviewEntry, 'index'>; detail: any }[] = []

    const add = (overview: Omit<TraceOverviewEntry, 'index'>, content: any) => {
      items.push({ overview, detail: content })
    }

    // Session-setup entries (system prompt, the initial tool snapshot) are recorded
    // before the first turn starts, so their raw timestamps predate turns[0]. Sorting
    // by raw timestamp would float them above the system prompt non-deterministically
    // (whichever happened to win the sub-millisecond race). Anchor anything that
    // predates the first turn to the first turn's timestamp so the preamble keeps a
    // stable document order: system prompt first, then the conversation.
    const firstTurnTs = this.trace.turns[0]?.timestamp
    const anchorTs = (ts: Date): Date => (firstTurnTs && ts < firstTurnTs ? firstTurnTs : ts)

    if (this.trace.systemPrompt) {
      add(
        { type: 'system-prompt', timestamp: this.trace.turns[0]?.timestamp ?? new Date(), label: '', preview: this.trace.systemPrompt.slice(0, 150) },
        this.trace.systemPrompt
      )
    }

    for (const turn of this.trace.turns) {
      if (turn.hiddenContext) {
        add(
          { type: 'hidden-context', timestamp: turn.timestamp, label: '', preview: turn.hiddenContext.slice(0, 150) },
          turn.hiddenContext
        )
      }
      add(
        { type: 'user-message', timestamp: turn.timestamp, label: '', preview: (turn.userMessage ?? '').slice(0, 150) },
        turn.userMessage ?? ''
      )
      for (const step of turn.steps) {
        if ((step as any).compaction) {
          const c = (step as any).compaction
          add(
            { type: 'compaction', timestamp: step.timestamp, label: '', preview: `${c.originalCharCount} \u2192 ${c.compactedCharCount} chars` },
            { summary: c.summary, originalMessages: c.originalMessages, originalCharCount: c.originalCharCount, compactedCharCount: c.compactedCharCount }
          )
        }
        if ((step as any).moderation) {
          const m = (step as any).moderation
          const verdict = m.failOpen ? 'skipped' : m.action
          add(
            { type: 'moderation', timestamp: step.timestamp, label: verdict, preview: [m.category, m.reason].filter(Boolean).join(': ').slice(0, 150) },
            { action: m.action, category: m.category, reason: m.reason, failOpen: m.failOpen, latencyMs: m.latencyMs }
          )
        }
        for (const tc of step.toolCalls) {
          add(
            { type: 'tool-call', timestamp: tc.timestamp, label: tc.toolName, preview: (JSON.stringify(tc.input) ?? '').slice(0, 150) },
            { input: tc.input, toolName: tc.toolName }
          )
          if (tc.subAgent) {
            add(
              { type: 'sub-agent-start', timestamp: tc.timestamp, label: tc.subAgent.name, preview: (tc.subAgent.task ?? '').slice(0, 150) },
              { name: tc.subAgent.name, task: tc.subAgent.task, tools: tc.subAgent.tools }
            )
            if (tc.subAgent.systemPrompt) {
              add(
                { type: 'sub-agent-system-prompt', timestamp: tc.timestamp, label: tc.subAgent.name, preview: tc.subAgent.systemPrompt.slice(0, 150) },
                tc.subAgent.systemPrompt
              )
            }
            for (const subStep of tc.subAgent.steps) {
              for (const subTc of subStep.toolCalls) {
                add(
                  { type: 'tool-call', timestamp: subTc.timestamp, label: `${subTc.toolName} (${tc.subAgent!.name})`, preview: (JSON.stringify(subTc.input) ?? '').slice(0, 150) },
                  { input: subTc.input, toolName: subTc.toolName }
                )
                add(
                  { type: 'tool-result', timestamp: subTc.timestamp, label: `${subTc.toolName} (${tc.subAgent!.name})`, preview: (JSON.stringify(subTc.output) ?? '').slice(0, 150) },
                  { output: subTc.output, toolName: subTc.toolName, durationMs: subTc.durationMs }
                )
              }
              if (subStep.messages.length > 0) {
                add(
                  { type: 'sub-agent-step', timestamp: subStep.timestamp, label: tc.subAgent!.name, preview: this.extractTextPreview(subStep.messages) },
                  { messages: subStep.messages, finishReason: subStep.finishReason }
                )
              }
            }
            // endTimestamp (set when the tool call finishes, after all sub-agent steps) ensures the
            // sub-agent-end and parent tool-result entries sort AFTER the sub-agent's step entries,
            // whose timestamps fall between the call's start and end.
            add(
              { type: 'sub-agent-end', timestamp: tc.endTimestamp ?? tc.timestamp, label: tc.subAgent.name, preview: '' },
              { name: tc.subAgent.name }
            )
          }
          add(
            { type: 'tool-result', timestamp: tc.endTimestamp ?? tc.timestamp, label: tc.toolName, preview: (JSON.stringify(tc.output) ?? '').slice(0, 150) },
            { output: tc.output, toolName: tc.toolName, durationMs: tc.durationMs }
          )
        }
        if (step.messages.length > 0) {
          add(
            { type: 'assistant-step', timestamp: step.timestamp, label: '', preview: this.extractTextPreview(step.messages) },
            { messages: step.messages, finishReason: step.finishReason }
          )
        }
      }
    }

    for (const tc of this.trace.toolChanges) {
      const toolNames = tc.tools.map(t => t.name).join(', ')
      add(
        { type: 'tools-changed', timestamp: anchorTs(tc.timestamp), label: `${tc.tools.length}`, preview: toolNames.slice(0, 150) },
        { tools: tc.tools }
      )
    }

    for (const pr of this.trace.physicalRequests) {
      add(
        {
          type: 'physical-request',
          timestamp: pr.timestamp,
          label: pr.modelRole,
          preview: `${pr.inputTokens} in${pr.cacheReadTokens ? ` (${pr.cacheReadTokens} cached)` : ''} · ${pr.outputTokens} out · ${pr.messageCount} msgs · ${pr.toolCount} tools · ${Math.round(pr.durationMs)}ms`
        },
        {
          modelRole: pr.modelRole,
          inputTokens: pr.inputTokens,
          outputTokens: pr.outputTokens,
          cacheReadTokens: pr.cacheReadTokens,
          cacheWriteTokens: pr.cacheWriteTokens,
          messageCount: pr.messageCount,
          toolCount: pr.toolCount,
          bodyChars: pr.bodyChars,
          durationMs: pr.durationMs,
          timeToFirstChunkMs: pr.timeToFirstChunkMs,
          finishReason: pr.result.finishReason,
          requestBody: pr.requestBody,
          result: pr.result
        }
      )
    }

    // A physical request and the semantic entries reconstructed from its response share the
    // same timestamp. Within one instant, show the turn's inputs first, then the physical
    // request that was sent, then the info extracted from its response.
    const sortRank: Record<TraceOverviewEntry['type'], number> = {
      'system-prompt': 0,
      'user-message': 0,
      'hidden-context': 0,
      'physical-request': 1,
      'assistant-step': 2,
      'tool-call': 2,
      'tool-result': 2,
      'sub-agent-start': 2,
      'sub-agent-system-prompt': 2,
      'sub-agent-step': 2,
      'sub-agent-end': 2,
      'tools-changed': 2,
      compaction: 2,
      moderation: 2
    }
    items.sort((a, b) =>
      (a.overview.timestamp.getTime() - b.overview.timestamp.getTime()) ||
      (sortRank[a.overview.type] - sortRank[b.overview.type]))

    this.cachedOverview = items.map((item, i) => ({ ...item.overview, index: i }))
    this.cachedDetails = items.map((item, i) => ({ ...item.overview, index: i, content: item.detail }))
  }

  private extractTextPreview (messages: ModelMessage[]): string {
    for (const msg of messages) {
      if (typeof msg.content === 'string') return msg.content.slice(0, 150)
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'text') return (part as any).text?.slice(0, 150) ?? ''
        }
      }
    }
    return ''
  }

  getTraceEntry (index: number): TraceEntryDetail | null {
    this.buildCache()
    return this.cachedDetails[index] ?? null
  }

  getTraceEntries (from: number, to: number): TraceEntryDetail[] {
    this.buildCache()
    return this.cachedDetails.slice(from, to + 1)
  }
}
