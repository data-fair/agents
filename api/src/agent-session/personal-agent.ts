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
import type { McpServerAuth } from '../mcp-servers/operations.ts'

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
 * Build the personal assistant.
 *
 * Every catalog entry it calls as the person, unfiltered: their own permissions are already the ceiling.
 * Narrowing here would be a second, weaker copy of an authorization decision that whatever the tool calls
 * already makes — and it is why an unreachable entry is skipped rather than fatal for it (see
 * ../mcp-servers/client.ts). The one exception is an `apiKey` entry: it sends the deployment's own key
 * whoever is chatting, an anonymous visitor included, so the person is not its ceiling. Only a configured
 * agent, chosen by an administrator, may reference one.
 *
 * The catalog is passed in rather than read from `#config`, following the rule `contextBudget` follows:
 * a module that imports `#config` cannot be unit tested, because that import validates the whole
 * deployment environment.
 */
export const personalAgent = (catalog: Array<{ id: string, auth: McpServerAuth }>): PersonalAgent => ({
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
  mcpServers: catalog.filter(server => server.auth !== 'apiKey').map(server => ({ serverId: server.id }))
})
