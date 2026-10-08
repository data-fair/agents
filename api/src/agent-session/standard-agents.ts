/**
 * The personal assistant: the one built-in agent, with a fixed id and its persona held here as a string.
 *
 * A host application NAMES an agent rather than supplying its own prose, so a client never controls the
 * model's INSTRUCTIONS: the text lives on this side where it cannot be tampered with.
 *
 * SYNTHETIC, not stored: no collection, no migration, no lifecycle. Built per call.
 */

import { PERSONAL_AGENT_ID } from '@agents/shared/agent-audit'
import type { AutonomousAgentForTools } from '../mcp-servers/client.ts'

export { PERSONAL_AGENT_ID }

export const PERSONAL_AGENT_TITLE = 'Assistant'

export interface PersonalAgent extends AutonomousAgentForTools {
  title: string
  persona: string
  enabled: true
  /**
   * Absent, and that is the defining difference from a configured agent: the personal assistant acts as
   * the PERSON using it, through their forwarded session, not as an identity of its own.
   */
  nhi?: undefined
}

/**
 * Whether an id names the personal assistant. Also what makes the id reserved against configured agents.
 */
export const isStandardAgentId = (id: string): boolean => id === PERSONAL_AGENT_ID

/**
 * Build the personal assistant.
 *
 * Every catalog entry, unfiltered: it acts as the person, so their own permissions are already the
 * ceiling. Narrowing here would be a second, weaker copy of an authorization decision that whatever the
 * tool calls already makes — and it is why an unreachable entry is skipped rather than fatal for it
 * (see ../mcp-servers/client.ts).
 *
 * The catalog is passed in rather than read from `#config`, following the rule `contextBudget` follows:
 * a module that imports `#config` cannot be unit tested, because that import validates the whole
 * deployment environment.
 */
export const personalAgent = (catalog: Array<{ id: string }>): PersonalAgent => ({
  id: PERSONAL_AGENT_ID,
  title: PERSONAL_AGENT_TITLE,
  persona: [
    'You are the assistant built into this application.',
    // NOT a line about acting with the person's permissions: buildSystemPrompt adds exactly that
    // for any agent without an NHI, and a persona repeating it put two near-identical sentences in
    // consecutive paragraphs of the prompt. The ceiling is stated once, where it is derived from
    // the identity rather than from a string every persona has to remember to include.
    'You help the person using it with what is on the page in front of them, and with the data they can reach.'
  ].join(' '),
  enabled: true,
  mcpServers: catalog.map(server => ({ serverId: server.id }))
})
