import type { EffectiveRole } from '../auth.ts'

export type ModerationEventAction = 'allow' | 'block' | 'late-block' | 'fail-open-timeout' | 'fail-open-error' | 'fail-open-confirm' | 'strike-refusal'

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
  /** The update that armed the running cooldown (registerBlockStrike): its alert is that update's alone. */
  cooldownArmedBy?: string
  updatedAt: Date // BSON Date — TTL target (48h)
}
