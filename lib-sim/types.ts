/**
 * The shapes a host repo needs to write cases and read evidence.
 */

import type { GatewayExchange } from './gateway-capture.ts'
import type { Observation } from './page-perception.ts'
import type { RunMetrics } from './metrics.ts'

export type SimulationCase = {
  /** Evidence files are named after this; keep it filesystem-safe. */
  name: string
  route: string
  /** Who the simulated user is. Becomes its system prompt. */
  persona: string
  /** What they came for, in their own words. */
  goal: string
  /** Give up after this many user turns; the judge sees how far it got. */
  maxTurns: number
  /**
   * Which surface the persona operates. Defaults to the in-page assistant, so existing cases are
   * untouched; 'autonomous-agent' drives an autonomous agent's thread page instead.
   */
  surface?: 'in-page-chat' | 'autonomous-agent'
  /**
   * Who to log in as. Defaults to the account the runner seeds settings for. A case targeting an
   * existing autonomous agent needs someone who may instruct it, which that account is not.
   */
  user?: string
}

export type Transcript = {
  case: string
  goal: string
  persona: string
  route: string
  conversation: Array<{ role: string, text: string }>
  gateway: GatewayExchange[]
  consoleErrors: string[]
  observations: Observation[]
}

export type RunSidecar = {
  case: string
  valid: boolean
  error?: string
  assistantModel: string
  /** The tier the background roles ran on (sub-agents, compaction, moderation),
   *  when the host pins it separately from the assistant's. */
  toolsModel?: string
  userModel: string
  turns: number
  durationMs: number
  finishedAt: string
  /** Derived from the transcript by `writeEvidence`, so a host gets them without
   *  asking. Evidence for the judge, never a score. */
  metrics?: RunMetrics
}
