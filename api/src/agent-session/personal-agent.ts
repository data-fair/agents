/**
 * The personal assistants: two built-in agents, one for the front office (portals) and one for the back
 * office, with fixed ids and their persona held here as a string.
 *
 * A host application NAMES an agent rather than supplying its own prose, so a client never controls the
 * model's INSTRUCTIONS: the text lives on this side where it cannot be tampered with.
 *
 * SYNTHETIC, not stored: no collection, no migration, no lifecycle. Built per call. What differs between
 * the two is their servers, which the deployment configures (`personalAssistants`, see
 * docs/superpowers/specs/2026-10-14-two-personal-assistants.md).
 */

import { PORTAL_ASSISTANT_ID, BACK_OFFICE_ASSISTANT_ID, PERSONAL_AGENT_IDS, isPersonalAgentId } from '@agents/shared/agent-audit'
import type { AutonomousAgentForTools } from '../mcp-servers/client.ts'

export { PORTAL_ASSISTANT_ID, BACK_OFFICE_ASSISTANT_ID, PERSONAL_AGENT_IDS, isPersonalAgentId }

type ServerRefs = NonNullable<AutonomousAgentForTools['mcpServers']>

/** The deployment's `personalAssistants`: each assistant's catalog references, like a configured agent's. */
export interface PersonalAssistantsConfig {
  portal?: { mcpServers?: ServerRefs }
  backOffice?: { mcpServers?: ServerRefs }
}

/** Which key of `personalAssistants` configures which assistant, and its name. */
const ASSISTANTS = {
  [PORTAL_ASSISTANT_ID]: { key: 'portal', title: 'Assistant' },
  [BACK_OFFICE_ASSISTANT_ID]: { key: 'backOffice', title: 'Back-office assistant' }
} as const

export const personalAgentTitle = (id: string): string | undefined =>
  isPersonalAgentId(id) ? ASSISTANTS[id as keyof typeof ASSISTANTS].title : undefined

export interface PersonalAgent extends AutonomousAgentForTools {
  title: string
  persona: string
  enabled: true
  /**
   * Absent, and that is the defining difference from a configured agent: a personal assistant acts as
   * the PERSON using it, through their forwarded session, not as an identity of its own.
   */
  nhi?: undefined
}

/**
 * Build a personal assistant, or undefined when the id names none.
 *
 * Its servers are the ones the deployment configured for it, and only those: the catalog is shared with
 * configured agents, which need write profiles, and taking all of it handed the assistant every tool an
 * operator added for an autonomous agent. Unconfigured, it has none. Within them it acts as the person, so
 * their own permissions are the ceiling — which is why an unreachable entry is skipped rather than fatal for
 * it (see ../mcp-servers/client.ts).
 *
 * The configuration is passed in rather than read from `#config`, following the rule `contextBudget`
 * follows: a module that imports `#config` cannot be unit tested, because that import validates the whole
 * deployment environment.
 */
export const personalAgent = (id: string, assistants: PersonalAssistantsConfig): PersonalAgent | undefined => {
  if (!isPersonalAgentId(id)) return undefined
  const { key, title } = ASSISTANTS[id as keyof typeof ASSISTANTS]
  return {
    id,
    title,
    persona: [
      'You are the assistant built into this application.',
      // NOT a line about acting with the person's permissions: buildSystemPrompt adds exactly that
      // for any agent without an NHI, and a persona repeating it put two near-identical sentences in
      // consecutive paragraphs of the prompt. The ceiling is stated once, where it is derived from
      // the identity rather than from a string every persona has to remember to include.
      'You help the person using it with what is on the page in front of them, and with the data they can reach.',
      // Every host of these assistants is a data-fair one, so grounding is the product's concern, not a
      // host's: a simulation caught the assistant counting rows against a threshold in its own reply,
      // contradicting itself, and offering a threshold nobody gave as a figure to quote.
      'Every figure you state comes from a data tool\'s result in this conversation: a count, total or threshold you need is asked of the tools, never worked out in your reply, and never taken from the person\'s own figures without checking them.',
      'Write everything the person sees in their language, including a note while you work.'
    ].join(' '),
    enabled: true,
    mcpServers: assistants[key]?.mcpServers ?? []
  }
}
