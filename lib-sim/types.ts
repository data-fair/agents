/**
 * The shapes a host repo needs to write cases and read evidence.
 */

import type { ConversationExport } from './conversation-export.ts'
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
   * What the case is dispatched as. Defaults to the in-page assistant; 'autonomous-agent' means the
   * chat is opened on a configured autonomous agent, so the runner seeds that agent. The UI is the
   * same chat either way, and so is the evidence.
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
  consoleErrors: string[]
  observations: Observation[]
  /**
   * The conversation exports, one file per conversation the person had, written beside the transcript.
   *
   * What the server recorded: every message part (tool calls with their arguments AND results), and
   * per run the system prompt and each model call — role, model, tokens, credits, the tools offered,
   * the page context folded in. The same file a maintainer downloads to debug a real session.
   */
  exports: Array<{ conversationId: string, agentId?: string, file: string }>
  /** Why some of that evidence is missing, so a judge reads an absence as a gap, not as a finding. */
  evidenceErrors?: string[]
}

/** What the runner hands `writeEvidence`: the transcript, with the exports' contents still in hand. */
export type TranscriptInput = Omit<Transcript, 'exports'> & { exports: ConversationExport[] }

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
