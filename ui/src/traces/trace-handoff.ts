import type { SessionTrace } from './session-recorder.ts'
import { serializeTrace, reviveTraceDates } from './session-recorder.ts'

export const TRACE_HANDOFF_KEY = 'agent-chat-trace-handoff'

// Store the trace for a new-tab review page. Returns false if it didn't fit (quota).
export function writeHandoff (trace: SessionTrace, storage: Storage = localStorage): boolean {
  try {
    storage.setItem(TRACE_HANDOFF_KEY, serializeTrace(trace))
    return true
  } catch {
    return false
  }
}

// Read + remove the handed-off trace, reviving Date fields. Null if absent or malformed.
export function readHandoff (storage: Storage = localStorage): SessionTrace | null {
  const raw = storage.getItem(TRACE_HANDOFF_KEY)
  if (!raw) return null
  storage.removeItem(TRACE_HANDOFF_KEY)
  try {
    return reviveTraceDates(JSON.parse(raw))
  } catch {
    return null
  }
}

// Trigger a browser download of the trace as a JSON file.
export function downloadTrace (trace: SessionTrace, filename = `trace-${new Date().toISOString()}.json`): void {
  const blob = new Blob([serializeTrace(trace)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
