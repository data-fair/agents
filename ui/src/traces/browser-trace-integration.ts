import type { TelemetryIntegration } from 'ai'

export interface BrowserTraceEvent {
  traceId: string
  eventType: string
  timestamp: Date
  data: any
}

export class BrowserTraceIntegration implements TelemetryIntegration {
  private traceId: string
  private events: BrowserTraceEvent[] = []

  constructor (traceId: string) {
    this.traceId = traceId
  }

  async onStart (event: any): Promise<void> {
    this.addEvent('onStart', {
      modelId: event.model?.modelId,
      tokens: event.usage
    })
  }

  async onStepStart (event: any): Promise<void> {
    this.addEvent('onStepStart', {
      stepNumber: event.stepNumber
    })
  }

  async onStepFinish (event: any): Promise<void> {
    this.addEvent('onStepFinish', {
      stepNumber: event.stepNumber,
      usage: event.usage,
      finishReason: event.finishReason
    })
  }

  async onToolCallStart (event: any): Promise<void> {
    this.addEvent('onToolCallStart', {
      toolCallId: event.toolCall?.id,
      toolName: event.toolCall?.toolName,
      input: event.toolCall?.input
    })
  }

  async onToolCallFinish (event: any): Promise<void> {
    this.addEvent('onToolCallFinish', {
      toolCallId: event.toolCall?.id,
      toolName: event.toolCall?.toolName,
      success: event.success,
      error: event.error,
      durationMs: event.durationMs,
      result: event.result
    })
  }

  async onFinish (event: any): Promise<void> {
    this.addEvent('onFinish', {
      text: event.text,
      usage: event.usage,
      finishReason: event.finishReason,
      totalDurationMs: event.durationMs
    })
  }

  getEvents (): BrowserTraceEvent[] {
    return this.events
  }

  getTraceId (): string {
    return this.traceId
  }

  clear (): void {
    this.events = []
  }

  private addEvent (eventType: string, data: any): void {
    this.events.push({
      traceId: this.traceId,
      eventType,
      timestamp: new Date(),
      data
    })
  }
}
