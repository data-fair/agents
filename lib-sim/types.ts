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
   *
   * 'unattended' means NOBODY is in the loop — a run the host starts itself (a planned task), which no
   * chat shows and no person answers. The runner drives no persona: `maxTurns` is 0, `persona` names
   * the absent reader of the result (it is never simulated), and the run is judged from its export
   * alone. Expressed as a surface rather than as an empty persona, so the transcript, the report and
   * the judge can all say "nobody was there" instead of reading an empty conversation as a person who
   * never spoke.
   */
  surface?: 'in-page-chat' | 'autonomous-agent' | 'unattended'
  /**
   * Who to log in as. Defaults to the account the runner seeds settings for. A case targeting an
   * existing autonomous agent needs someone who may instruct it, which that account is not.
   */
  user?: string
  /**
   * How many separate conversations the person has, one after the other. Defaults to 1. The person
   * ends each one with DONE; the runner then opens a NEW conversation with the same assistant (the
   * chat's reset button) and the person carries on. What a case about something outliving a
   * conversation — an agent's memory — needs: one transcript, every conversation in it, judged
   * together. `maxTurns` is the budget of the whole run, not of each conversation.
   */
  conversations?: number
}

export type Transcript = {
  case: string
  /** The case's surface, when not the default: 'unattended' tells the judge nobody was there. */
  surface?: SimulationCase['surface']
  goal: string
  persona: string
  route: string
  /**
   * What was said, as rendered. A case with several conversations has them all here, in order, each
   * new one opened by an entry of role `NEW_CONVERSATION_ROLE` (persona.ts).
   */
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
  /**
   * State the host read back after the run that no conversation export carries — an agent's memory
   * and its change history, say — keyed by what it is. Written verbatim into the transcript.
   */
  hostState?: Record<string, unknown>
}

/** What the runner hands `writeEvidence`: the transcript, with the exports' contents still in hand. */
export type TranscriptInput = Omit<Transcript, 'exports'> & { exports: ConversationExport[] }

export type RunSidecar = {
  case: string
  valid: boolean
  error?: string
  assistantModel: string
  /** The tier the background roles ran on (memory consolidation, compaction, moderation),
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
