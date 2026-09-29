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
  /**
   * Tool calls as the SERVER recorded them, for surfaces whose model calls do not pass through the
   * browser.
   *
   * `gateway` is captured with `page.on('request')`, so it sees everything for the in-page chat — where
   * the browser talks to the gateway — and NOTHING for an autonomous agent, whose executor runs
   * server-side. Without this the judge could only take the assistant's word for which tools it called,
   * which is precisely the unverifiable claim this harness exists to check.
   */
  agentToolCalls?: Array<{
    toolName: string
    arguments?: string
    serverId?: string
    failed?: boolean
    error?: string
    // NOTE: the tool's RESULT is deliberately absent, because the server does not persist it — the
    // stored message records only the call, its arguments and whether it failed. So "does what the
    // agent reported match what the tool returned" still has to be checked against the fixture's own
    // source. Keep fixture outputs deterministic and distinctive for that reason; the road-closure
    // fixture's named streets and computed dates are what make that check possible at all.
  }>
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
