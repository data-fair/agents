/**
 * The verdict a moderation check produced.
 *
 * Declared here rather than in a trace type: it was `TraceModeration` while a trace document was the
 * thing that embedded it, and moderation is what actually owns the shape.
 */
import type { EffectiveRole } from '../auth.ts'

export interface ModerationVerdictRecord {
  action: 'allow' | 'block'
  category?: string
  reason?: string
  latencyMs?: number
  failOpen?: 'timeout' | 'error'
}

export type ModerationEventAction = 'allow' | 'block' | 'late-block' | 'fail-open-timeout' | 'fail-open-error' | 'strike-refusal'

export interface ModerationEvent {
  owner: { type: string, id: string }
  action: ModerationEventAction
  category?: string
  reason?: string
  latencyMs?: number
  role: EffectiveRole
  userId: string
  modelRole: string
  // present only on block / late-block: the review payload
  messageExcerpt?: string
  createdAt: Date // BSON Date — TTL target (30 days)
}

export interface ModerationStrike {
  owner: { type: string, id: string }
  userId: string
  count: number
  windowStartedAt: Date
  cooldownUntil?: Date
  updatedAt: Date // BSON Date — TTL target (48h)
}
