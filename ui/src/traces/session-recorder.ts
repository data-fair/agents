import type { ModelMessage } from 'ai'

export interface ToolCallTrace {
  id: string
  toolName: string
  input: any
  output: any
  timestamp: Date
  durationMs?: number
  subAgent?: SubAgentTrace
}

export interface StepTrace {
  timestamp: Date
  messages: ModelMessage[]
  usage?: { inputTokens: number; outputTokens: number }
  finishReason?: string
  toolCalls: ToolCallTrace[]
}

export interface TurnTrace {
  userMessage: string
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
}

export interface ToolChangeEvent {
  timestamp: Date
  tools: ToolSnapshot[]
}

export interface SessionTrace {
  systemPrompt: string
  toolSnapshots: ToolSnapshot[][]
  toolChanges: ToolChangeEvent[]
  turns: TurnTrace[]
}

export interface TraceOverviewEntry {
  index: number
  type: 'user-message' | 'assistant-step' | 'tool-call' | 'tool-result' | 'sub-agent-start' | 'sub-agent-step' | 'sub-agent-end' | 'tools-changed'
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

export class SessionRecorder {
  private trace: SessionTrace = {
    systemPrompt: '',
    toolSnapshots: [],
    toolChanges: [],
    turns: []
  }

  private currentTurn: TurnTrace | null = null
  private currentStep: StepTrace | null = null
  private pendingToolCalls = new Map<string, ToolCallTrace>()
  private subAgentPendingToolCalls = new Map<string, Map<string, ToolCallTrace>>()

  setSystemPrompt (prompt: string): void {
    this.trace.systemPrompt = prompt
  }

  snapshotTools (tools: ToolSnapshot[]): void {
    const snapshot = [...tools]
    this.trace.toolSnapshots.push(snapshot)
    this.trace.toolChanges.push({ timestamp: new Date(), tools: snapshot })
  }

  startTurn (userMessage: string): void {
    this.currentTurn = {
      userMessage,
      timestamp: new Date(),
      steps: []
    }
    this.trace.turns.push(this.currentTurn)
    // Start an implicit first step
    this.currentStep = { timestamp: new Date(), messages: [], toolCalls: [] }
  }

  startToolCall (id: string, toolName: string, input: any): void {
    const tc: ToolCallTrace = { id, toolName, input, output: null, timestamp: new Date() }
    this.pendingToolCalls.set(id, tc)
    if (this.currentStep) {
      this.currentStep.toolCalls.push(tc)
    }
  }

  finishToolCall (id: string, output: any, durationMs?: number): void {
    const tc = this.pendingToolCalls.get(id)
    if (tc) {
      tc.output = output
      // Auto-compute durationMs from timestamp if not provided
      tc.durationMs = durationMs ?? (Date.now() - tc.timestamp.getTime())
      this.pendingToolCalls.delete(id)
    }
  }

  startSubAgent (toolCallId: string, name: string, systemPrompt: string, task: string, tools: ToolSnapshot[]): void {
    const tc = this.pendingToolCalls.get(toolCallId)
    if (tc) {
      tc.subAgent = { name, systemPrompt, tools, task, steps: [] }
      this.subAgentPendingToolCalls.set(toolCallId, new Map())
    }
  }

  startSubAgentToolCall (toolCallId: string, id: string, toolName: string, input: any): void {
    const tc = this.pendingToolCalls.get(toolCallId)
    if (!tc?.subAgent) return
    const subTc: ToolCallTrace = { id, toolName, input, output: null, timestamp: new Date() }
    const pendingMap = this.subAgentPendingToolCalls.get(toolCallId)
    pendingMap?.set(id, subTc)
    const steps = tc.subAgent.steps
    if (steps.length === 0) {
      steps.push({ timestamp: new Date(), messages: [], toolCalls: [] })
    }
    steps[steps.length - 1].toolCalls.push(subTc)
  }

  finishSubAgentToolCall (toolCallId: string, id: string, output: any): void {
    const pendingMap = this.subAgentPendingToolCalls.get(toolCallId)
    const subTc = pendingMap?.get(id)
    if (subTc) {
      subTc.output = output
      pendingMap?.delete(id)
    }
  }

  finishSubAgentStep (toolCallId: string): void {
    const tc = this.pendingToolCalls.get(toolCallId)
    if (!tc?.subAgent) return
    tc.subAgent.steps.push({ timestamp: new Date(), messages: [], toolCalls: [] })
  }

  addSubAgentStepMessages (toolCallId: string, messages: ModelMessage[], usage?: { inputTokens: number; outputTokens: number }): void {
    const tc = this.pendingToolCalls.get(toolCallId)
    if (!tc?.subAgent) return
    const steps = tc.subAgent.steps
    // Remove empty trailing steps created by finishSubAgentStep
    while (steps.length > 0 && steps[steps.length - 1].toolCalls.length === 0 && steps[steps.length - 1].messages.length === 0) {
      steps.pop()
    }
    // Set messages/usage on the last step with content
    const targetStep = steps.length > 0 ? steps[steps.length - 1] : null
    if (targetStep) {
      targetStep.messages = messages
      targetStep.usage = usage
    }
    this.subAgentPendingToolCalls.delete(toolCallId)
  }

  finishStep (): void {
    if (this.currentTurn && this.currentStep) {
      this.currentTurn.steps.push(this.currentStep)
    }
    this.currentStep = { timestamp: new Date(), messages: [], toolCalls: [] }
  }

  addStepMessages (messages: ModelMessage[], usage?: { inputTokens: number; outputTokens: number }, finishReason?: string): void {
    if (!this.currentTurn) return

    const lastPushedStep = this.currentTurn.steps[this.currentTurn.steps.length - 1]
    const finishStepWasCalled = lastPushedStep && this.currentStep && !this.currentTurn.steps.includes(this.currentStep)

    if (finishStepWasCalled) {
      // finishStep was called: push currentStep as response step if it has messages,
      // otherwise set usage/finishReason on the last tool-call step
      if (this.currentStep && messages.length > 0) {
        this.currentStep.messages = messages
        this.currentStep.usage = usage
        this.currentStep.finishReason = finishReason
        this.currentTurn.steps.push(this.currentStep)
      } else {
        lastPushedStep.usage = usage
        lastPushedStep.finishReason = finishReason
      }
    } else if (this.currentStep) {
      // No finishStep call: push the current step with messages
      this.currentStep.messages = messages
      this.currentStep.usage = usage
      this.currentStep.finishReason = finishReason
      this.currentTurn.steps.push(this.currentStep)
    }

    this.currentStep = null
  }

  getTrace (): SessionTrace {
    return this.trace
  }

  getTraceOverview (): TraceOverviewEntry[] {
    this.buildCache()
    return this.cachedOverview
  }

  private cachedOverview: TraceOverviewEntry[] = []
  private cachedDetails: TraceEntryDetail[] = []

  private buildCache (): void {
    const items: { overview: Omit<TraceOverviewEntry, 'index'>; detail: any }[] = []

    const add = (overview: Omit<TraceOverviewEntry, 'index'>, content: any) => {
      items.push({ overview, detail: content })
    }

    for (const turn of this.trace.turns) {
      add(
        { type: 'user-message', timestamp: turn.timestamp, label: 'user message', preview: (turn.userMessage ?? '').slice(0, 150) },
        turn.userMessage ?? ''
      )
      for (const step of turn.steps) {
        for (const tc of step.toolCalls) {
          add(
            { type: 'tool-call', timestamp: tc.timestamp, label: `tool call: ${tc.toolName}`, preview: (JSON.stringify(tc.input) ?? '').slice(0, 150) },
            { input: tc.input, toolName: tc.toolName }
          )
          if (tc.subAgent) {
            add(
              { type: 'sub-agent-start', timestamp: tc.timestamp, label: `sub-agent: ${tc.subAgent.name}`, preview: (tc.subAgent.task ?? '').slice(0, 150) },
              { name: tc.subAgent.name, systemPrompt: tc.subAgent.systemPrompt, task: tc.subAgent.task, tools: tc.subAgent.tools }
            )
            for (const subStep of tc.subAgent.steps) {
              for (const subTc of subStep.toolCalls) {
                add(
                  { type: 'tool-call', timestamp: subTc.timestamp, label: `tool call: ${subTc.toolName} (sub-agent: ${tc.subAgent!.name})`, preview: (JSON.stringify(subTc.input) ?? '').slice(0, 150) },
                  { input: subTc.input, toolName: subTc.toolName }
                )
                add(
                  { type: 'tool-result', timestamp: subTc.timestamp, label: `tool result: ${subTc.toolName} (sub-agent: ${tc.subAgent!.name})`, preview: (JSON.stringify(subTc.output) ?? '').slice(0, 150) },
                  { output: subTc.output, toolName: subTc.toolName, durationMs: subTc.durationMs }
                )
              }
              if (subStep.messages.length > 0) {
                add(
                  { type: 'sub-agent-step', timestamp: subStep.timestamp, label: `sub-agent step: ${tc.subAgent!.name}`, preview: this.extractTextPreview(subStep.messages) },
                  { messages: subStep.messages, usage: subStep.usage }
                )
              }
            }
            add(
              { type: 'sub-agent-end', timestamp: tc.timestamp, label: `sub-agent end: ${tc.subAgent.name}`, preview: '' },
              { name: tc.subAgent.name }
            )
          }
          add(
            { type: 'tool-result', timestamp: tc.timestamp, label: `tool result: ${tc.toolName}`, preview: (JSON.stringify(tc.output) ?? '').slice(0, 150) },
            { output: tc.output, toolName: tc.toolName, durationMs: tc.durationMs }
          )
        }
        if (step.messages.length > 0) {
          add(
            { type: 'assistant-step', timestamp: step.timestamp, label: 'assistant step', preview: this.extractTextPreview(step.messages) },
            { messages: step.messages, usage: step.usage, finishReason: step.finishReason }
          )
        }
      }
    }

    for (const tc of this.trace.toolChanges) {
      const toolNames = tc.tools.map(t => t.name).join(', ')
      add(
        { type: 'tools-changed', timestamp: tc.timestamp, label: `tools changed (${tc.tools.length})`, preview: toolNames.slice(0, 150) },
        { tools: tc.tools }
      )
    }

    items.sort((a, b) => a.overview.timestamp.getTime() - b.overview.timestamp.getTime())

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
