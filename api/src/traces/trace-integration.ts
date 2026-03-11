import type { TelemetryIntegration } from 'ai'
import type { Collection } from 'mongodb'
import type { TraceEvent } from '../mongo.ts'
import { randomUUID } from 'crypto'

export class TraceIntegration implements TelemetryIntegration {
  private traceId: string
  private userId: string
  private collection: Collection<TraceEvent>

  constructor (
    traceId: string,
    userId: string,
    collection: Collection<TraceEvent>
  ) {
    this.traceId = traceId
    this.userId = userId
    this.collection = collection
  }

  async onStart (event: any): Promise<void> {
    await this.saveEvent('onStart', {
      modelId: event.model?.modelId,
      tokens: event.usage
    })
  }

  async onStepStart (event: any): Promise<void> {
    await this.saveEvent('onStepStart', {
      stepNumber: event.stepNumber
    })
  }

  async onStepFinish (event: any): Promise<void> {
    await this.saveEvent('onStepFinish', {
      stepNumber: event.stepNumber,
      usage: event.usage,
      finishReason: event.finishReason
    })
  }

  async onToolCallStart (event: any): Promise<void> {
    await this.saveEvent('onToolCallStart', {
      toolCallId: event.toolCall?.id,
      toolName: event.toolCall?.toolName,
      input: event.toolCall?.input
    })
  }

  async onToolCallFinish (event: any): Promise<void> {
    await this.saveEvent('onToolCallFinish', {
      toolCallId: event.toolCall?.id,
      toolName: event.toolCall?.toolName,
      success: event.success,
      error: event.error,
      durationMs: event.durationMs,
      result: event.result
    })
  }

  async onFinish (event: any): Promise<void> {
    await this.saveEvent('onFinish', {
      text: event.text,
      usage: event.usage,
      finishReason: event.finishReason,
      totalDurationMs: event.durationMs
    })
  }

  private async saveEvent (eventType: string, data: any): Promise<void> {
    try {
      const event: TraceEvent = {
        traceId: this.traceId,
        userId: this.userId,
        eventType,
        timestamp: new Date(),
        data
      }
      await this.collection.insertOne(event)
    } catch (err) {
      console.error('Failed to save trace event:', err)
    }
  }
}

export function createTraceIntegration (
  userId: string,
  collection: Collection<TraceEvent>,
  existingTraceId?: string
): TraceIntegration {
  const traceId = existingTraceId || randomUUID()
  return new TraceIntegration(traceId, userId, collection)
}
