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

export interface SessionTrace {
  systemPrompt: string
  toolSnapshots: ToolSnapshot[][]
  turns: TurnTrace[]
}

export class SessionRecorder {
  private trace: SessionTrace = {
    systemPrompt: '',
    toolSnapshots: [],
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
    this.trace.toolSnapshots.push([...tools])
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
      // finishStep was called: set usage and finishReason on the last pushed step
      lastPushedStep.usage = usage
      lastPushedStep.finishReason = finishReason
      // Also push the current step as a new step with the messages
      if (this.currentStep) {
        this.currentStep.messages = messages
        this.currentStep.usage = usage
        this.currentStep.finishReason = finishReason
        this.currentTurn.steps.push(this.currentStep)
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
}
