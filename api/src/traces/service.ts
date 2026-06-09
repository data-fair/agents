/**
 * service.ts contains stateful logic for trace storage
 */
import mongo from '#mongo'
import type { TraceRequest } from './types.ts'
import { buildTraceRequestDoc, type BuildTraceInput } from './operations.ts'

export type { TraceRequest } from './types.ts'

// Fire-and-forget: never throws into the caller's request path.
export async function recordTraceRequest (input: BuildTraceInput): Promise<void> {
  try {
    const doc = buildTraceRequestDoc(input, new Date())
    await mongo.traceRequests.insertOne(doc as TraceRequest)
  } catch {
    // swallow — trace recording must never affect the chat response
  }
}
