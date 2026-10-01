/**
 * The personal assistant, as an agent.
 *
 * The move that collapses two subsystems into one: a personal conversation is a conversation with an
 * agent, differing from a configured one only in who it acts as and where its persona comes from. If
 * that holds, the loop does not need to know which it is serving — which is the whole claim this
 * prototype exists to test.
 *
 * SYNTHETIC, not stored. A record per user would need a collection, a migration and a lifecycle, and
 * would buy nothing yet: there is nothing per-user to configure. It is built per turn from the
 * deployment's own configuration, so making it configurable later is a change of source, not of shape.
 */

import type { AutonomousAgentForTools } from '../mcp-servers/client.ts'

/** The id every personal assistant conversation names. Reserved: no configured agent may use it. */
export const PERSONAL_AGENT_ID = 'personal'

export interface PersonalAgent extends AutonomousAgentForTools {
  id: typeof PERSONAL_AGENT_ID
  title: string
  persona: string
  instructions?: string
  enabled: true
  /** Absent, and that is the defining difference: it acts as the person, not as itself. */
  nhi?: undefined
}

/**
 * The persona a personal assistant runs with.
 *
 * Deployment-level rather than per-user, because a persona is product voice: an org admin configures
 * the assistant's character for everyone, and letting each user rewrite the system prompt of an agent
 * that acts with their own permissions is a prompt-injection surface with no upside.
 */
const DEFAULT_PERSONA = [
  'You are the assistant built into this application.',
  'You help the person using it with what is on the page in front of them, and with the data they can reach.',
  'You act with that person\'s own permissions — never more — so if something is not permitted, say so plainly rather than looking for another way.'
].join(' ')

/**
 * The tools a personal assistant may reach, beyond the page's own.
 *
 * Every catalog entry, unfiltered: the assistant acts as the person, so the ceiling is already their
 * own permissions, enforced upstream by whatever the tool calls. Narrowing here would be a second,
 * weaker copy of an authorization decision that is not ours to make — the mistake the parity invariant
 * in §3 of the design warns about from the other direction.
 *
 * The catalog is passed in rather than read from `#config`, following the same rule `contextBudget`
 * follows: a module that reads config cannot be unit tested, because importing `#config` validates the
 * whole deployment environment at import time.
 */
export function personalAgent (catalog: Array<{ id: string }>): PersonalAgent {
  return {
    id: PERSONAL_AGENT_ID,
    title: 'Assistant',
    persona: DEFAULT_PERSONA,
    enabled: true,
    mcpServers: catalog.map(server => ({ serverId: server.id }))
  }
}
