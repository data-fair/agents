/**
 * Live session continuity (spec §2.4).
 *
 * The bridge keeps one SDK query alive per conversation so the prompt cache
 * carries across turns. Correctness rests on one property: the key is a content
 * hash of the exact history prefix, so ANY change upstream — compaction replacing
 * turns with a summary, media tool results being redacted, a user retrying —
 * produces a different key and therefore a MISS, which degrades to a full replay.
 * There is no path by which a superseded history is silently answered.
 */
import crypto from 'node:crypto'
import type { OpenAIMessage } from './openai.ts'

export type LiveSession = {
  key: string
  pending: Map<string, (result: string) => void>
  abort: () => void
  lastSeen: number
}

export function hashMessages (messages: OpenAIMessage[]): string {
  return crypto.createHash('sha256').update(JSON.stringify(messages)).digest('hex')
}

/**
 * A continuation request has exactly one shape: an assistant message carrying
 * tool_calls, followed by the tool messages answering every one of them. Strip
 * that suffix and you have the array the bridge saw when it suspended.
 * Anything else is not a continuation.
 */
export function continuationOf (messages: OpenAIMessage[]) {
  let i = messages.length
  const results: Array<{ id: string, content: string }> = []
  while (i > 0 && messages[i - 1].role === 'tool') {
    i--
    results.unshift({ id: messages[i].tool_call_id ?? '', content: messages[i].content ?? '' })
  }
  if (results.length === 0) return null

  const assistant = messages[i - 1]
  if (!assistant || assistant.role !== 'assistant' || !assistant.tool_calls?.length) return null

  // Every call must be answered; a partial answer is not a continuation.
  const answered = new Set(results.map(r => r.id))
  if (assistant.tool_calls.some(c => !answered.has(c.id))) return null

  return { key: hashMessages(messages.slice(0, i - 1)), toolResults: results }
}

/**
 * The live query keeps the MCP tool server it was built with on the FIRST request
 * of the turn, but the product registers tools mid-turn (use-agent-chat.ts
 * reconciles the set as panels open). Adopting a live session whose tool set no
 * longer matches would offer the model a stale set and make a freshly registered
 * tool uncallable — so a mismatch forfeits the cache and replays instead.
 */
export function sameToolSet (a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every(name => set.has(name))
}

export class SessionStore {
  #sessions = new Map<string, LiveSession>()
  #ttlMs: number
  #max: number

  constructor (opts: { ttlMs?: number, max?: number } = {}) {
    this.#ttlMs = opts.ttlMs ?? 15 * 60 * 1000
    this.#max = opts.max ?? 20
  }

  get size () { return this.#sessions.size }

  get (key: string, now = Date.now()): LiveSession | undefined {
    const s = this.#sessions.get(key)
    if (!s) return undefined
    if (now - s.lastSeen > this.#ttlMs) { this.delete(key); return undefined }
    return s
  }

  set (session: LiveSession): void {
    this.#sessions.set(session.key, session)
    while (this.#sessions.size > this.#max) {
      let oldest: LiveSession | undefined
      for (const s of this.#sessions.values()) {
        if (!oldest || s.lastSeen < oldest.lastSeen) oldest = s
      }
      if (!oldest) break
      this.delete(oldest.key)
    }
  }

  delete (key: string): void {
    const s = this.#sessions.get(key)
    if (!s) return
    this.#sessions.delete(key)
    s.abort()
  }

  /**
   * Move a still-running session to the key its grown history now hashes to.
   * Deliberately not `delete` + `set`: delete aborts the query.
   */
  rekey (oldKey: string, newKey: string): void {
    const s = this.#sessions.get(oldKey)
    if (!s) return
    this.#sessions.delete(oldKey)
    s.key = newKey
    this.#sessions.set(newKey, s)
  }

  sweep (now = Date.now()): void {
    for (const [key, s] of [...this.#sessions]) {
      if (now - s.lastSeen > this.#ttlMs) this.delete(key)
    }
  }
}
